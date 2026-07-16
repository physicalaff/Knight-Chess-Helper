let creatingOffscreen = null;
let stockfishWorker = null;
let currentAudio = null;
let activeMusicTabId = null;

let latestEval = 0;
let latestMate = null;

// Search state machine (Firefox / non-offscreen path). Mirrors offscreen.js:
// `currentResolve` is the search we want a result for, `queued` is a search
// waiting for the previous (stopped) one to flush its bestmove. This makes
// stale bestmoves harmless, replacing the old `abortedSearchesCount` counter
// that could desync.
let currentResolve = null;
let currentColor = 'w';
let queued = null;
let searching = false;

// Watchdog: if Stockfish never emits a `bestmove` for a running (or `stop`ped)
// search, the state machine deadlocks (`searching` stuck true) and analysis
// freezes forever. Recover by rebuilding the worker and restarting/failing the
// pending request.
let searchWatchdog = null;
const SEARCH_TIMEOUT_MS = 15000;

const ERROR_RESULT = { error: true, eval: 0, mate: null, best: null };

const isChrome = typeof chrome.offscreen !== 'undefined';

function clearSearchWatchdog() {
    if (searchWatchdog) { clearTimeout(searchWatchdog); searchWatchdog = null; }
}

function armSearchWatchdog() {
    clearSearchWatchdog();
    searchWatchdog = setTimeout(onSearchTimeout, SEARCH_TIMEOUT_MS);
}

function onSearchTimeout() {
    searchWatchdog = null;
    try { if (stockfishWorker) stockfishWorker.terminate(); } catch (_) {}
    stockfishWorker = null;

    const pending = queued;
    if (currentResolve) { currentResolve(ERROR_RESULT); currentResolve = null; }
    queued = null;
    searching = false;

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

async function setupOffscreen(force = false) {
    if (!isChrome) return;

    if (creatingOffscreen) {
        await creatingOffscreen;
        return;
    }

    if (!force && chrome.runtime.getContexts) {
        const contexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT']
        });
        if (contexts.length > 0) return;
    }

    if (force) {
        try {
            await chrome.offscreen.closeDocument();
        } catch (_) {}
    }

    creatingOffscreen = chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['WORKERS'],
        justification: 'Run Stockfish Web Worker locally'
    }).catch((err) => {
        if (!err.message.includes('Only a single offscreen')) {
            console.error('[ch:background] Failed to create offscreen document:', err);
        }
    }).finally(() => {
        creatingOffscreen = null;
    });

    await creatingOffscreen;
}

function getStockfishWorker() {
    if (stockfishWorker) return stockfishWorker;

    stockfishWorker = new Worker('stockfish/stockfish.js');

    stockfishWorker.onerror = (err) => {
        try { stockfishWorker.terminate(); } catch (_) {}
        stockfishWorker = null;
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

            if (queued) {
                const q = queued;
                queued = null;
                startSearch(q.fen, q.depth, q.color, q.resolve);
                return;
            }

            if (currentResolve) {
                let finalEval = latestEval;
                let finalMate = latestMate;
                if (currentColor === 'b') {
                    finalEval = -latestEval;
                    if (latestMate !== null) finalMate = -latestMate;
                }

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

function timedFetch(url, ms = 9000) {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(tid));
}

async function sendDailyPing() {
    try {
        let storage = await chrome.storage.local.get(['anonymousClientId', 'lastPingDate', 'appConfig']);
        
        if (storage.appConfig?.telemetryEnabled !== true) {
            return;
        }

        let clientId = storage.anonymousClientId;
        let lastPingDate = storage.lastPingDate;

        if (!clientId) {
            clientId = 'usr_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            await chrome.storage.local.set({ anonymousClientId: clientId });
        }

        const today = new Date().toDateString();

        if (lastPingDate === today) {
            return;
        }

        const serverUrl = 'https://script.google.com/macros/s/AKfycbwdu8LZ6sgs49xgYL3noWeRLFkFjBKf9kkQXgJzvbp2PCyU1n8CPe3OxI88pzzpmylu/exec';

        const response = await fetch(serverUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ id: clientId })
        });

        if (response.ok) {
            await chrome.storage.local.set({ lastPingDate: today });
        }
    } catch (err) {
    }
}

function handleVisibilityChange(visible) {
    if (currentAudio && currentAudio.src.includes('sf.mp3')) {
        if (visible) {
            currentAudio.play().catch(() => {});
        } else {
            currentAudio.pause();
        }
    }
}

function stopMusic() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender && sender.id && sender.id !== chrome.runtime.id) return;
    if (message.target !== 'background') return;

    if (message.type === 'FETCH_BOOK') {
        const fen = message.fen;
        timedFetch(
            `https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(fen)}&topGames=0&recentGames=0`,
            4000
        )
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(data => {
            sendResponse({ opening: data.opening, moves: data.moves });
        })
        .catch(() => {
            sendResponse(null);
        });
        return true;
    }

    if (message.type === 'SET_VISIBILITY') {
        if (isChrome) {
            setupOffscreen().then(() => {
                chrome.runtime.sendMessage({
                    target: 'offscreen',
                    type: 'SET_VISIBILITY',
                    visible: message.visible
                });
            });
        } else {
            handleVisibilityChange(message.visible);
        }
        return;
    }

    if (message.type === 'STOP_SOUND') {
        if (isChrome) {
            setupOffscreen().then(() => {
                chrome.runtime.sendMessage({
                    target: 'offscreen',
                    type: 'STOP_SOUND'
                }).catch(() => {});
            });
        } else {
            stopMusic();
        }
        return;
    }

    if (message.type === 'PLAY_SOUND') {
        if (message.sound === 'sf.mp3') {
            activeMusicTabId = sender.tab?.id;
        }
        if (isChrome) {
            setupOffscreen().then(() => {
                chrome.runtime.sendMessage({
                    target: 'offscreen',
                    type: 'PLAY_SOUND',
                    sound: message.sound,
                    tabId: sender.tab?.id
                });
            });
        } else {
            try {
                if (currentAudio && !currentAudio.paused && !currentAudio.ended) {
                    return;
                }
                currentAudio = new Audio(chrome.runtime.getURL(`assets/${message.sound}`));
                currentAudio.volume = 0.55;
                currentAudio.play().catch(() => {});
            } catch (_) {}
        }
        return;
    }

    if (message.type === 'ANALYZE') {
        const tabId = sender.tab?.id;
        if (!tabId) return;

        if (isChrome) {
            setupOffscreen().then(() => {
                chrome.runtime.sendMessage({
                    target: 'offscreen',
                    type: 'ANALYZE',
                    fen: message.fen,
                    depth: message.depth,
                    requestId: message.requestId,
                    tabId: tabId
                }).catch((err) => {
                    console.warn('[ch:background] Failed to send message to offscreen document, recreating offscreen:', err);
                    setupOffscreen(true).then(() => {
                        chrome.runtime.sendMessage({
                            target: 'offscreen',
                            type: 'ANALYZE',
                            fen: message.fen,
                            depth: message.depth,
                            requestId: message.requestId,
                            tabId: tabId
                        }).catch(err2 => {
                            console.error('[ch:background] Message retry to offscreen failed:', err2);
                        });
                    });
                });
            });
        } else {
            const worker = getStockfishWorker();
            const fen = message.fen;
            const depth = message.depth;
            const color = fen.split(' ')[1] || 'w';

            const analysisPromise = new Promise((resolve) => {
                if (searching) {
                    if (currentResolve) { currentResolve(ERROR_RESULT); currentResolve = null; }
                    if (queued) { queued.resolve(ERROR_RESULT); }
                    queued = { fen, depth, color, resolve };
                    try { worker.postMessage('stop'); } catch (_) {}
                } else {
                    startSearch(fen, depth, color, resolve);
                }
            });

            analysisPromise.then((result) => {
                chrome.tabs.sendMessage(tabId, {
                    type: 'ANALYSIS_RESULT',
                    requestId: message.requestId,
                    data: result
                });
            });
        }
        return true;
    }

    if (message.type === 'ANALYSIS_RESULT') {
        chrome.tabs.sendMessage(message.tabId, {
            type: 'ANALYSIS_RESULT',
            requestId: message.requestId,
            data: message.data
        }).catch(() => {}); // tab may have been closed before the result arrived
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    if (activeMusicTabId === tabId) {
        activeMusicTabId = null;
        if (isChrome) {
            chrome.runtime.sendMessage({
                target: 'offscreen',
                type: 'STOP_SOUND'
            }).catch(() => {});
        } else {
            stopMusic();
        }
    }
});

if (!isChrome) {
    setInterval(() => {
        try {
            chrome.runtime.getPlatformInfo(() => {});
        } catch (e) {}
    }, 20000);
}

sendDailyPing();
