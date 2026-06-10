let stockfishWorker = null;
let currentResolve = null;
let currentAudio = null;

let latestEval = 0;
let latestMate = null;
let currentActiveColor = 'w';
let abortedSearchesCount = 0;

function getStockfishWorker() {
    if (stockfishWorker) return stockfishWorker;

    const workerUrl = chrome.runtime.getURL('stockfish/stockfish.js');
    stockfishWorker = new Worker(workerUrl);

    stockfishWorker.onerror = (err) => {
        try { stockfishWorker.terminate(); } catch (_) {}
        stockfishWorker = null;
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

            if (abortedSearchesCount > 0) {
                abortedSearchesCount--;
                return;
            }

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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

        latestEval = 0;
        latestMate = null;
        currentActiveColor = fen.split(' ')[1] || 'w';

        if (currentResolve) {
            try {
                worker.postMessage('stop');
                abortedSearchesCount++;
            } catch (_) {}
            currentResolve({ eval: 0, mate: null, best: null });
        }

        const analysisPromise = new Promise((resolve) => {
            currentResolve = resolve;
        });

        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go depth ${depth}`);

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