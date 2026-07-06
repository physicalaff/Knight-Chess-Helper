let stockfishWorker = null;
let currentAudio = null;

let latestEval = 0;
let latestMate = null;

// Search state machine.
// `currentResolve` resolves the search whose result we actually want.
// `queued` holds a search that must wait for the previous (stopped) search to
// emit its bestmove before it can start — this guarantees a stale bestmove can
// never poison a newer request (the old `abortedSearchesCount` counter could
// desync if the engine emitted zero or extra bestmove lines).
let currentResolve = null;
let currentColor = 'w';
let queued = null;
let searching = false;

// Watchdog: if Stockfish never emits a `bestmove` for a running (or `stop`ped)
// search, the whole state machine would deadlock — `searching` stays true and
// every future request just replaces `queued`, so analysis "freezes forever".
// This can happen when `stop` is sent before a search actually started, or when
// the engine drops a bestmove line. The watchdog recovers by rebuilding the
// worker and either failing or restarting the pending request.
let searchWatchdog = null;
const SEARCH_TIMEOUT_MS = 15000;

const ERROR_RESULT = { error: true, eval: 0, mate: null, best: null };

function clearSearchWatchdog() {
    if (searchWatchdog) { clearTimeout(searchWatchdog); searchWatchdog = null; }
}

function armSearchWatchdog() {
    clearSearchWatchdog();
    searchWatchdog = setTimeout(onSearchTimeout, SEARCH_TIMEOUT_MS);
}

function onSearchTimeout() {
    searchWatchdog = null;
    // The engine appears wedged. Tear the worker down so a fresh one is created.
    try { if (stockfishWorker) stockfishWorker.terminate(); } catch (_) {}
    stockfishWorker = null;

    const pending = queued;
    if (currentResolve) { currentResolve(ERROR_RESULT); currentResolve = null; }
    queued = null;
    searching = false;

    // If a request was waiting behind the wedged search, run it on a clean worker
    // instead of dropping it — otherwise the user's next hint keeps failing.
    if (pending) {
        try {
            getStockfishWorker();
            startSearch(pending.fen, pending.depth, pending.color, pending.resolve);
        } catch (_) {
            pending.resolve(ERROR_RESULT);
        }
    }
}

function startSearch(fen, depth, color, resolve) {
    currentResolve = resolve;
    currentColor = color;
    latestEval = 0;
    latestMate = null;
    searching = true;
    stockfishWorker.postMessage(`position fen ${fen}`);
    stockfishWorker.postMessage(`go depth ${depth}`);
    armSearchWatchdog();
}

function failAllPending() {
    clearSearchWatchdog();
    if (currentResolve) { currentResolve(ERROR_RESULT); currentResolve = null; }
    if (queued) { queued.resolve(ERROR_RESULT); queued = null; }
    searching = false;
}

function getStockfishWorker() {
    if (stockfishWorker) return stockfishWorker;

    const workerUrl = chrome.runtime.getURL('stockfish/stockfish.js');
    stockfishWorker = new Worker(workerUrl);

    stockfishWorker.onerror = (err) => {
        try { stockfishWorker.terminate(); } catch (_) {}
        stockfishWorker = null;
        // Don't leave callers hanging until their safety timeout fires.
        failAllPending();
    };

    stockfishWorker.onmessage = (event) => {
        const line = event.data;

        if (line.startsWith('info') && line.includes('score')) {
            if (line.includes('score cp ')) {
                const match = line.match(/score cp (-?\d+)/);
                if (match) {
                    latestEval = parseInt(match[1]) / 100;
                    latestMate = null;
                }
            } else if (line.includes('score mate ')) {
                const match = line.match(/score mate (-?\d+)/);
                if (match) {
                    latestMate = parseInt(match[1]);
                    latestEval = 0;
                }
            }
        }

        if (line.startsWith('bestmove')) {
            const bestMove = line.split(' ')[1];
            clearSearchWatchdog();

            // A queued search means this bestmove belongs to a search we already
            // abandoned (it was `stop`ped). Discard its data and start the
            // queued one now that the engine is free.
            if (queued) {
                const q = queued;
                queued = null;
                startSearch(q.fen, q.depth, q.color, q.resolve);
                return;
            }

            if (currentResolve) {
                const { eval: finalEval, mate: finalMate } = (() => {
                    let fe = latestEval, fm = latestMate;
                    if (currentColor === 'b') {
                        fe = -latestEval;
                        if (latestMate !== null) fm = -latestMate;
                    }
                    return { eval: fe, mate: fm };
                })();

                const resolve = currentResolve;
                currentResolve = null;
                searching = false;
                resolve({ best: bestMove, eval: finalEval, mate: finalMate });
            } else {
                searching = false;
            }
        }
    };

    stockfishWorker.postMessage('uci');
    stockfishWorker.postMessage('isready');
    stockfishWorker.postMessage('ucinewgame');

    return stockfishWorker;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender && sender.id && sender.id !== chrome.runtime.id) return;
    if (message.target !== 'offscreen') return;

    if (message.type === 'SET_VISIBILITY') {
        if (currentAudio && currentAudio.src.includes('sf.mp3')) {
            if (message.visible) {
                currentAudio.play().catch(() => {});
            } else {
                currentAudio.pause();
            }
        }
        return;
    }

    if (message.type === 'STOP_SOUND') {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
        return;
    }

    if (message.type === 'PLAY_SOUND') {
        try {
            if (currentAudio && !currentAudio.paused && !currentAudio.ended) {
                return;
            }
            currentAudio = new Audio(chrome.runtime.getURL(`assets/${message.sound}`));
            currentAudio.volume = 0.55;
            currentAudio.play().catch(() => {});
        } catch (_) {}
        return;
    }

    if (message.type === 'ANALYZE') {
        const { fen, depth, requestId, tabId } = message;
        const worker = getStockfishWorker();
        const color = fen.split(' ')[1] || 'w';

        const analysisPromise = new Promise((resolve) => {
            if (searching) {
                // Abort the in-flight search: fail whatever was waiting, queue
                // the new request, and tell the engine to stop. The queued
                // search starts when the stopped search's bestmove arrives.
                if (currentResolve) { currentResolve(ERROR_RESULT); currentResolve = null; }
                if (queued) { queued.resolve(ERROR_RESULT); }
                queued = { fen, depth, color, resolve };
                try { worker.postMessage('stop'); } catch (_) {}
            } else {
                startSearch(fen, depth, color, resolve);
            }
        });

        analysisPromise.then((result) => {
            chrome.runtime.sendMessage({
                target: 'background',
                type: 'ANALYSIS_RESULT',
                requestId,
                tabId,
                data: result
            });
        });
    }
});
