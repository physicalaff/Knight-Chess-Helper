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

async function sendDailyPing() {
    try {
        let storage = await chrome.storage.local.get(['anonymousClientId', 'lastPingDate']);
        let clientId = storage.anonymousClientId;
        let lastPingDate = storage.lastPingDate;

        if (!clientId) {
            clientId = 'usr_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            await chrome.storage.local.set({ anonymousClientId: clientId });
        }

        const today = new Date().toDateString();

        if (lastPingDate === today) {
            console.log('[ch:ping] Ping already sent today. Skipping.');
            return;
        }

        const serverUrl = 'https://script.google.com/macros/s/AKfycbwdu8LZ6sgs49xgYL3noWeRLFkFjBKf9kkQXgJzvbp2PCyU1n8CPe3OxI88pzzpmylu/exec';

        console.log('[ch:ping] Sending daily active ping...');

        const response = await fetch(serverUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ id: clientId })
        });

        if (response.ok) {
            await chrome.storage.local.set({ lastPingDate: today });
            console.log('[ch:ping] Ping successfully sent and logged.');
        } else {
            console.warn('[ch:ping] Server returned error status:', response.status);
        }
    } catch (err) {
        console.error('[ch:ping] Failed to send active ping:', err);
    }
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

// Trigger the check on service worker startup
sendDailyPing();