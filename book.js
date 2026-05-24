const LOCAL_BOOK = {
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1": "e2e4",
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1": "e7e5",
    "rnbqkbnr/pppp1ppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1": "c7c5",
    "rnbqkbnr/pppp1ppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1": "e7e6",
    "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1": "d7d5",
    "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1": "g8f6"
};

const bookCache = new Map();

function timedFetch(url, ms = 9000) {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(tid));
}

async function bookMoveOnline(fen) {
    const key = fen.split(' ')[0];
    if (bookCache.has(key)) return bookCache.get(key);

    try {
        const res  = await timedFetch(
            `https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(fen)}&topGames=0&recentGames=0`,
            4000
        );
        if (!res.ok) { bookCache.set(key, null); return null; }
        const data = await res.json();
        if (data.opening) {
            window.dispatchEvent(new CustomEvent('ch:opening', { detail: data.opening }));
        }
        const pool = (data.moves || []).filter(m => m.white + m.black + m.draws > 8);
        if (!pool.length) { bookCache.set(key, null); return null; }

        const total  = pool.reduce((s, m) => s + m.white + m.black + m.draws, 0);
        let roll     = Math.random() * total, picked = pool[0];
        for (const m of pool) { roll -= m.white + m.black + m.draws; if (roll <= 0) { picked = m; break; } }

        bookCache.set(key, picked.uci);
        return picked.uci;
    } catch (_) {
        bookCache.set(key, null);
        return null;
    }
}

window.chessHelperBook = {
    async getMove(fen) {
        const cleanFen = fen.split(' ').slice(0, 4).join(' ');
        
        if (LOCAL_BOOK[cleanFen]) {
            return LOCAL_BOOK[cleanFen];
        }
        
        return await bookMoveOnline(fen);
    },
    
    clearCache() {
        bookCache.clear();
    }
};