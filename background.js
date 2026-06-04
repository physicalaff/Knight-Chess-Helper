let creatingOffscreen = null;
let stockfishWorker = null;
let currentResolve = null;
let currentAudio = null;
let activeMusicTabId = null;

let latestEval = 0;
let latestMate = null;
let currentActiveColor = 'w';

const isChrome = typeof chrome.offscreen !== 'undefined';

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

    stockfishWorker.onmessage = (event) => {
        const line = event.data;

        if (line.startsWith('info') && line.includes('score')) {
            if (line.includes('score cp ')) {
                const match = line.match(/score cp (-?\d+)/);
                if (match) {
                    latestEval = parseInt(match[1]) / 100;
                    latestMate = null;
                }
            } else if (line.startsWith('info') && line.includes('score mate ')) {
                const match = line.match(/score mate (-?\d+)/);
                if (match) {
                    latestMate = parseInt(match[1]);
                    latestEval = 0;
                }
            }
        }

        if (line.startsWith('bestmove')) {
            const parts = line.split(' ');
            const bestMove = parts[1];

            if (currentResolve) {
                let finalEval = latestEval;
                let finalMate = latestMate;

                if (currentActiveColor === 'b') {
                    finalEval = -latestEval;
                    if (latestMate !== null) {
                        finalMate = -latestMate;
                    }
                }

                currentResolve({
                    best: bestMove,
                    eval: finalEval,
                    mate: finalMate
                });
                currentResolve = null;
            }
        }
    };

    stockfishWorker.postMessage('uci');
    stockfishWorker.postMessage('isready');
    stockfishWorker.postMessage('ucinewgame');

    return stockfishWorker;
}

async function sendDailyPing() {
    try {
        let storage = await chrome.storage.local.get(['anonymousClientId', 'lastPingDate', 'telemetryEnabled']);
        
        if (storage.telemetryEnabled === false) {
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
    if (message.target !== 'background') return;

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

            latestEval = 0;
            latestMate = null;
            currentActiveColor = message.fen.split(' ')[1] || 'w';

            if (currentResolve) {
                currentResolve({ eval: 0, mate: null, best: null });
            }

            const analysisPromise = new Promise((resolve) => {
                currentResolve = resolve;
            });

            worker.postMessage(`position fen ${message.fen}`);
            worker.postMessage(`go depth ${message.depth}`);

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
        });
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