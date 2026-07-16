// Keys use the first 4 FEN fields (pieces active castling ep-square) to match
// the normalised lookup key used by getMove() below.
const LOCAL_BOOK = {
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -": ["e2e4"],
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3": ["e7e5"],
    "rnbqkbnr/pppp1ppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3": ["c7c5", "e7e6"],
    "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3": ["d7d5", "g8f6"]
};

const bookCache = new Map();

function setCache(key, val) {
    if (bookCache.size >= 120) {
        bookCache.delete(bookCache.keys().next().value);
    }
    bookCache.set(key, val);
}

async function bookMoveOnline(fen) {
    const key = fen.split(' ').slice(0, 4).join(' ');
    if (bookCache.has(key)) return bookCache.get(key);

    try {
        const data = await chrome.runtime.sendMessage({
            target: 'background',
            type: 'FETCH_BOOK',
            fen: fen
        });
        if (!data) {
            setCache(key, null);
            return null;
        }
        if (data.opening) {
            window.dispatchEvent(new CustomEvent('ch:opening', { detail: data.opening }));
        }
        const pool = (data.moves || []).filter(m => m.white + m.black + m.draws > 8);
        if (!pool.length) {
            setCache(key, null);
            return null;
        }

        const total  = pool.reduce((s, m) => s + m.white + m.black + m.draws, 0);
        let roll     = Math.random() * total, picked = pool[0];
        for (const m of pool) {
            roll -= m.white + m.black + m.draws;
            if (roll <= 0) {
                picked = m;
                break;
            }
        }

        setCache(key, picked.uci);
        return picked.uci;
    } catch (_) {
        setCache(key, null);
        return null;
    }
}

window.chessHelperBook = {
    async getMove(fen) {
        const cleanFen = fen.split(' ').slice(0, 4).join(' ');
        
        const moves = LOCAL_BOOK[cleanFen];
        if (moves && moves.length) {
            return moves[Math.floor(Math.random() * moves.length)];
        }
        
        return await bookMoveOnline(fen);
    },
    
    clearCache() {
        bookCache.clear();
    }
};