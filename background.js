let creatingOffscreen = null;

async function setupOffscreen() {
    if (creatingOffscreen) {
        await creatingOffscreen;
        return;
    }

    if (chrome.runtime.getContexts) {
        const contexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT']
        });
        if (contexts.length > 0) return;
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target !== 'background') return;

    if (message.type === 'ANALYZE') {
        const tabId = sender.tab?.id;
        if (!tabId) return;

        setupOffscreen().then(() => {
            chrome.runtime.sendMessage({
                target: 'offscreen',
                type: 'ANALYZE',
                fen: message.fen,
                depth: message.depth,
                requestId: message.requestId,
                tabId: tabId
            });
        });
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