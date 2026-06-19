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

const ERROR_RESULT = { error: true, eval: 0, mate: null, best: null };

function startSearch(fen, depth, color, resolve) {
    currentResolve = resolve;
    currentColor = color;
    latestEval = 0;
    latestMate = null;
    searching = true;
    stockfishWorker.postMessage(`position fen ${fen}`);
    stockfishWorker.postMessage(`go depth ${depth}`);
}

function failAllPending() {
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
