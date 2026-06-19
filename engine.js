window.chessHelperIntervals = {
    intervals: new Map(),
    register(id, fn, ms) {
        this.clear(id);
        const tid = setInterval(fn, ms);
        this.intervals.set(id, tid);
        return tid;
    },
    clear(id) {
        if (this.intervals.has(id)) {
            clearInterval(this.intervals.get(id));
            this.intervals.delete(id);
        }
    },
    clearAll() {
        for (const [id, tid] of this.intervals.entries()) {
            clearInterval(tid);
        }
        this.intervals.clear();
    },
    count() {
        return this.intervals.size;
    }
};

(() => {
    const PIECE_MAP = {
        'wp':'P','wn':'N','wb':'B','wr':'R','wq':'Q','wk':'K',
        'bp':'p','bn':'n','bb':'b','br':'r','bq':'q','bk':'k'
    };
    const FILE_NUM = {'a':1,'b':2,'c':3,'d':4,'e':5,'f':6,'g':7,'h':8};
    const NUM_FILE = {1:'a',2:'b',3:'c',4:'d',5:'e',6:'f',7:'g',8:'h'};

    let lastGameId = '';
    let lastPlayersKey = '';

    function getPlayerUsernames() {
        let bottomUser = '';
        let topUser = '';
        try {
            const bottomSelectors = [
                '.player-bottom [data-username]',
                '.board-layout-bottom [data-username]',
                '.player-bottom .user-username-component',
                '.board-layout-bottom .user-username-component',
                '.player-bottom .user-username',
                '.board-layout-bottom .user-username',
                '.player-bottom .username',
                '.board-layout-bottom .username',
                '.player-bottom .user-tagline-username',
                '.board-layout-bottom .user-tagline-username'
            ];
            for (const sel of bottomSelectors) {
                const el = document.querySelector(sel);
                if (el) {
                    bottomUser = el.getAttribute('data-username') || el.textContent.trim();
                    if (bottomUser) break;
                }
            }

            const topSelectors = [
                '.player-top [data-username]',
                '.board-layout-top [data-username]',
                '.player-top .user-username-component',
                '.board-layout-top .user-username-component',
                '.player-top .user-username',
                '.board-layout-top .user-username',
                '.player-top .username',
                '.board-layout-top .username',
                '.player-top .user-tagline-username',
                '.board-layout-top .user-tagline-username'
            ];
            for (const sel of topSelectors) {
                const el = document.querySelector(sel);
                if (el) {
                    topUser = el.getAttribute('data-username') || el.textContent.trim();
                    if (topUser) break;
                }
            }
        } catch (_) {}
        return { bottomUser, topUser };
    }

    function getFensFromController() {
        const b = board();
        if (!b) return null;
        
        const paths = [
            () => b.game?.getFens?.(),
            () => b.game?.getFensHistory?.(),
            () => b.controller?.game?.getFens?.(),
            () => b.controller?.game?.getFensHistory?.(),
            () => b.controller?.getFens?.(),
            () => b.controller?.getFensHistory?.(),
            () => b.game?.plies?.map(p => p.fen),
            () => b.controller?.game?.plies?.map(p => p.fen),
            () => b.controller?.plies?.map(p => p.fen),
            () => b.game?.getHistory?.()?.map(h => h.fen),
            () => b.controller?.game?.getHistory?.()?.map(h => h.fen),
            () => b.controller?.getHistory?.()?.map(h => h.fen),
            () => b.game?.moveList?.map(m => m.fen),
            () => b.controller?.game?.moveList?.map(m => m.fen),
            () => b.controller?.moveList?.map(m => m.fen),
            () => b.game?.history?.map(h => h.fen),
            () => b.controller?.game?.history?.map(h => h.fen),
            () => b.controller?.history?.map(h => h.fen),
            () => b.game?.getPlies?.()?.map(p => p.fen),
            () => b.controller?.game?.getPlies?.()?.map(p => p.fen),
            () => b.controller?.getPlies?.()?.map(p => p.fen),
            () => b.game?.moveHistory?.map(m => m.fen),
            () => b.controller?.game?.moveHistory?.map(m => m.fen),
            () => b.controller?.moveHistory?.map(m => m.fen)
        ];
        
        for (const getFens of paths) {
            try {
                const res = getFens();
                if (Array.isArray(res) && res.length >= 2) {
                    const validFens = res.filter(f => typeof f === 'string' && f.includes('/'));
                    if (validFens.length >= 2) {
                        console.log(`[ch:engine] Extracted ${validFens.length} FENs directly from board controller!`);
                        return validFens;
                    }
                }
            } catch (_) {}
        }
        return null;
    }

    function getGameId() {
        try {
            const match = window.location.pathname.match(/\/game\/(live|daily|computer)\/(\d+)/);
            if (match) return match[2];
            
            const boardEl = board();
            if (boardEl) {
                const id = boardEl.getAttribute('data-game-id') || boardEl.getAttribute('data-gameid');
                if (id) return id;
            }
        } catch (_) {}
        return '';
    }

    function getPlayersKey() {
        const { bottomUser, topUser } = getPlayerUsernames();
        if (bottomUser || topUser) {
            return `${bottomUser}:${topUser}`;
        }
        return '';
    }

    async function checkNewGame() {
        const currentGameId = getGameId();
        const currentPlayersKey = getPlayersKey();
        
        let changed = false;
        if (currentGameId && lastGameId && currentGameId !== lastGameId) {
            console.log(`[ch:engine] New game detected by ID change: ${lastGameId} -> ${currentGameId}`);
            lastGameId = currentGameId;
            lastPlayersKey = currentPlayersKey;
            changed = true;
        } else if (currentPlayersKey && lastPlayersKey && currentPlayersKey !== lastPlayersKey) {
            console.log(`[ch:engine] New game detected by players change: ${lastPlayersKey} -> ${currentPlayersKey}`);
            lastPlayersKey = currentPlayersKey;
            lastGameId = currentGameId;
            changed = true;
        } else {
            if (currentGameId && !lastGameId) {
                lastGameId = currentGameId;
            }
            if (currentPlayersKey && !lastPlayersKey) {
                lastPlayersKey = currentPlayersKey;
            }
        }
        
        if (changed) {
            window.chessHelperGameFENs = [];
            try {
                await chrome.storage.local.set({ gameFens: [], gameId: currentGameId });
            } catch (_) {}
            window.chessHelperEngine?.reset();
        }
    }

    const cfg = {
        elo: 1300,
        preset: 'positional',
        mistakes: 0.15,
        blunders: 0.04,
        depth: 6,
        thinkMin: 500,
        thinkMax: 3000,
        wobble: 3.5,
        badHoverChance: 0.12,
        reconsiderChance: 0.07,
        premoveChance: 0.15,
        randDepthEnabled: true,
        fatigueEnabled: true,
        distractionsEnabled: true,
        ponderingEnabled: true,
        misclicksEnabled: true,
        bulletMode: false,
        mouseSpeed: 1.0,
        thinkVariance: 1.0
    };

    let state = {
        moves: 0,
        halfMoves: 0,
        eval: 0,
        justBlundered: false,
        lastWasCapture: false,
        quickMoveStreak: 0,
        thinking: false,
        lastMove: null,
        gameEnded: false,
        distractionTriggeredThisGame: false
    };

    const sleep  = ms => new Promise(r => setTimeout(r, ms));
    const clamp  = (v, a, b) => Math.max(a, Math.min(b, v));
    const rnd    = (a, b) => a + Math.random() * (b - a);
    const rndInt = (a, b) => Math.floor(rnd(a, b));

    function gauss(mean, std) {
        const u = Math.max(1e-10, 1 - Math.random());
        const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
        return mean + z * std;
    }

    function board() {
        return document.querySelector('wc-chess-board')
            || document.querySelector('.board')
            || document.querySelector('chess-board');
    }

    function myColor() {
        const b = board();
        return b?.classList.contains('flipped') ? 'b' : 'w';
    }

    function activeColor() {
        const b = board();
        if (!b) return 'w';
        
        const highlights = b.querySelectorAll('.highlight');
        for (const hl of highlights) {
            const cls = Array.from(hl.classList).find(c => c.startsWith('square-'));
            if (!cls) continue;
            
            const parts = cls.split('-');
            let sqSelector = '';
            if (parts.length === 3) {
                sqSelector = `.piece.square-${parts[1]}-${parts[2]}`;
            } else if (parts.length === 2) {
                sqSelector = `.piece.square-${parts[1]}`;
            }
            
            if (!sqSelector) continue;
            const piece = b.querySelector(sqSelector);
            if (!piece) continue;
            
            const pc = Array.from(piece.classList);
            if (pc.some(c => c.startsWith('w'))) return 'b';
            if (pc.some(c => c.startsWith('b'))) return 'w';
        }
        return 'w';
    }

    function getFENFromController() {
        const b = board();
        if (!b) return null;
        const paths = [
            () => b.game?.getFEN?.(),
            () => b.controller?.game?.getFEN?.(),
            () => b.controller?.getFEN?.(),
            () => b.game?.getFens?.().slice(-1)[0],
            () => b.controller?.game?.getFens?.().slice(-1)[0],
            () => b.controller?.getFens?.().slice(-1)[0]
        ];
        for (const p of paths) {
            try {
                const res = p();
                if (typeof res === 'string' && res.includes('/')) return res;
            } catch (_) {}
        }
        return null;
    }

    function getFEN() {
        const controllerFen = getFENFromController();
        if (controllerFen) return controllerFen;

        const b = board();
        if (!b) return null;
        const pieces = b.querySelectorAll('.piece');
        if (!pieces.length) return null;

        const grid = Array(8).fill(null).map(() => Array(8).fill(null));
        pieces.forEach(p => {
            const cls  = Array.from(p.classList);
            const type = cls.find(c => PIECE_MAP[c]);
            const sq   = cls.find(c => c.startsWith('square-'));
            if (type && sq) {
                const parts = sq.split('-');
                let x, y;
                if (parts.length === 3) {
                    x = parseInt(parts[1]);
                    y = parseInt(parts[2]);
                } else if (parts.length === 2) {
                    const val = parts[1];
                    x = parseInt(val[0]);
                    y = parseInt(val[1]);
                }
                if (!isNaN(x) && !isNaN(y) && x >= 1 && x <= 8 && y >= 1 && y <= 8) {
                    grid[8 - y][x - 1] = PIECE_MAP[type];
                }
            }
        });

        const rows = grid.map(row => {
            let s = '', e = 0;
            for (const cell of row) {
                if (!cell) { e++; }
                else { if (e) { s += e; e = 0; } s += cell; }
            }
            return s + (e || '');
        });

        // Best-effort castling rights derived from the static board. Far more
        // accurate than the old hard-coded "KQkq": a side only keeps a right if
        // its king is still on its home square and the matching rook is present.
        // (grid[0] = rank 8, grid[7] = rank 1; file a..h = index 0..7.)
        let castling = '';
        if (grid[7][4] === 'K') {
            if (grid[7][7] === 'R') castling += 'K';
            if (grid[7][0] === 'R') castling += 'Q';
        }
        if (grid[0][4] === 'k') {
            if (grid[0][7] === 'r') castling += 'k';
            if (grid[0][0] === 'r') castling += 'q';
        }
        if (!castling) castling = '-';

        return rows.join('/') + ` ${activeColor()} ${castling} - 0 1`;
    }

    function squareRect(sq) {
        const b = board();
        if (!b) return null;
        const r    = b.getBoundingClientRect();
        const size = r.width / 8;
        const flip = b.classList.contains('flipped');
        const f    = FILE_NUM[sq[0]], rk = parseInt(sq[1]);
        const x    = (flip ? 8 - f : f - 1) * size;
        const y    = (flip ? rk - 1 : 8 - rk) * size;
        return { centerX: r.left + x + size / 2, centerY: r.top + y + size / 2, size };
    }

    
    function pieceAt(sq) {
        const b = board();
        if (!b) return null;
        const f = FILE_NUM[sq[0]];
        const r = sq[1];
        return b.querySelector(`.piece.square-${f}${r}`) || b.querySelector(`.piece.square-${f}-${r}`);
    }

    function myPieceAt(sq) {
        const el = pieceAt(sq);
        if (!el) return false;
        return ['p','n','b','r','q','k'].some(t => el.classList.contains(`${myColor()}${t}`));
    }

    function oppPieceAt(sq) {
        const el = pieceAt(sq);
        if (!el) return false;
        const opp = myColor() === 'w' ? 'b' : 'w';
        return ['p','n','b','r','q','k'].some(t => el.classList.contains(`${opp}${t}`));
    }

    function pieceCount(fen) {
        return (fen.split(' ')[0].match(/[a-zA-Z]/g) || []).length;
    }

    function gamePhase(fen) {
        if (!fen) return 'middlegame';
        const n = pieceCount(fen);
        if (n >= 28) return 'opening';
        if (n >= 14) return 'middlegame';
        return 'endgame';
    }

    function hasTactics(fen) {
        const mid = fen.split(' ')[0].split('/').slice(2, 6).join('');
        return /[Qq]/.test(mid) && mid.replace(/\d/g, '').length > 6;
    }

    function moveContext(from, to) {
        const p   = pieceAt(from);
        const pawn = p && (p.classList.contains('wp') || p.classList.contains('bp'));
        return {
            capture:   oppPieceAt(to),
            pawn,
            promotion: pawn && (to[1] === '8' || to[1] === '1'),
        };
    }

    function parseTime(el) {
        const parts = el.textContent.trim().replace(/\s/g, '').split(':').map(Number);
        if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
        if (parts.length === 2) return parts[0]*60 + parts[1];
        if (parts.length === 1 && !isNaN(parts[0])) return parts[0];
        return Infinity;
    }

    function myClock() {
        try {
            const el = document.querySelector('.player-bottom .clock-time-monospace, .player-bottom .clock-time, .board-layout-bottom .clock-time-monospace, .board-layout-bottom .clock-time');
            if (el) return parseTime(el);
            
            const els = [...document.querySelectorAll('.clock-time-monospace, .clock-time')];
            const fallbackEl = els[els.length - 1];
            if (fallbackEl) return parseTime(fallbackEl);
        } catch (_) {}
        return Infinity;
    }

    const engineCache  = new Map();
    let   prefetch     = null;

    const pendingAnalyses = new Map();

    chrome.runtime.onMessage.addListener((message, sender) => {
        if (sender && sender.id && sender.id !== chrome.runtime.id) return;
        if (message.type === 'ANALYSIS_RESULT') {
            const { requestId, data } = message;
            if (pendingAnalyses.has(requestId)) {
                const { resolve } = pendingAnalyses.get(requestId);
                pendingAnalyses.delete(requestId);
                resolve(data);
            }
        }
    });

    // Single Stockfish request. Resolves with {result, searchTime}.
    // On timeout returns an explicit error sentinel so the caller can retry
    // instead of silently treating a failed search as an equal (0.0) evaluation.
    async function analyzeOnce(fen, depth) {
        const requestId = `${Date.now()}-${Math.random()}`;
        const promise = new Promise((resolve) => {
            pendingAnalyses.set(requestId, { resolve });
        });

        const safetyTimeout = setTimeout(() => {
            if (pendingAnalyses.has(requestId)) {
                const { resolve } = pendingAnalyses.get(requestId);
                pendingAnalyses.delete(requestId);
                resolve({ error: true, eval: 0, mate: null, best: null });
            }
        }, 10000);

        const startTime = performance.now();
        chrome.runtime.sendMessage({
            target: 'background',
            type: 'ANALYZE',
            fen,
            depth,
            requestId
        });

        const result = await promise;
        clearTimeout(safetyTimeout);
        return { result, searchTime: Math.round(performance.now() - startTime) };
    }

    async function analyze(fen, depth, tries = 2) {
        const key = `${fen}|${depth}`;
        if (engineCache.has(key)) return engineCache.get(key);

        // Real retry loop: a timed-out or superseded search no longer poisons
        // the result. `tries` is now actually honoured.
        for (let attempt = 0; attempt < Math.max(1, tries); attempt++) {
            const { result, searchTime } = await analyzeOnce(fen, depth);

            if (result && result.best && !result.error) {
                if (engineCache.size > 120) engineCache.delete(engineCache.keys().next().value);
                engineCache.set(key, result);
                try {
                    const stored = await chrome.storage.local.get(['appConfig']);
                    const cfg = stored.appConfig || {};
                    cfg.statAnalyses = (cfg.statAnalyses || 0) + 1;
                    cfg.statTotalSearchTime = (cfg.statTotalSearchTime || 0) + searchTime;
                    cfg.statTotalDepth = (cfg.statTotalDepth || 0) + depth;
                    await chrome.storage.local.set({ appConfig: cfg });
                } catch (_) {}
                return result;
            }
        }

        // All attempts failed: surface an error sentinel and do NOT cache it,
        // so a later retry for the same position can still succeed.
        return { error: true, eval: 0, mate: null, best: null };
    }

    
    function clearCache() {
        engineCache.clear();
        prefetch = null;
        window.chessHelperBook?.clearCache();
    }

    function thinkTime(analysis, fen, from, to, isBook) {
        if (isBook) return rndInt(180, 500 + clamp(gauss(0.4, 0.2), 0, 1) * 350);

        const phase    = gamePhase(fen);
        const absEval  = Math.abs(analysis.eval || 0);
        const mateIn   = analysis.mate ? Math.abs(analysis.mate) : Infinity;
        const ctx      = moveContext(from, to);
        const clock    = myClock();
        const tactics  = hasTactics(fen);

        const isRecapture = ctx.capture && state.lastMove && to === state.lastMove.slice(2, 4);
        if (isRecapture) {
            return rndInt(110, 275);
        }

        if (mateIn === 1) {
            return rndInt(140, 310);
        }

        let base, spread;
        if (phase === 'opening')    { base = 300;          spread = 500; }
        else if (phase === 'endgame') { base = 500;         spread = 1400; }
        else                        { base = cfg.thinkMin; spread = cfg.thinkMax - cfg.thinkMin; }

        if (analysis.mate !== null) {
            if (mateIn <= 3)  { base *= 0.65; spread *= 0.55; }
            else              { base *= 1.15; spread *= 1.25; }
        } 
        else if (absEval > 6) {
            base *= 0.40; 
            spread *= 0.30; 
        }
        else if (absEval < 1.2 && tactics) {
            if (cfg.preset === 'positional') {
                base *= 2.15;
                spread *= 2.40;
            } else {
                base *= 1.85;   
                spread *= 2.10; 
            }
        } 
        else if (absEval < 1.5) {
            base *= 1.30; 
            spread *= 1.40; 
        }

        if (ctx.capture && state.lastWasCapture) { base *= 0.45; spread *= 0.40; }
        else if (ctx.capture)                    { base *= 0.75; spread *= 0.70; }
        if (ctx.promotion)  { base = Math.max(base, 650); spread = Math.max(spread, 550); }
        if (state.justBlundered) { base = Math.max(base, 1000); spread = Math.max(spread, 1100); }

        if (state.quickMoveStreak >= 3) {
            base = Math.max(base, 700); spread = Math.max(spread, 800);
            state.quickMoveStreak = 0;
        }

        base *= cfg.thinkVariance;
        spread *= cfg.thinkVariance;

        if (cfg.fatigueEnabled && state.moves >= 15) {
            const factor = 1 + (state.moves - 15) * 0.025;
            base *= factor;
            spread *= factor;
        }

        if (cfg.distractionsEnabled && !state.distractionTriggeredThisGame && state.moves > 6 && Math.random() < 0.03) {
            state.distractionTriggeredThisGame = true;
            const distractionDelay = rndInt(8000, 15000);
            notify(`Distracted for ${(distractionDelay / 1000).toFixed(1)}s`);
            return distractionDelay;
        }

        if (clock < 20)       { base = Math.min(base, 280); spread = Math.min(spread, 400); }
        else if (clock < 45)  { base *= 0.40; spread *= 0.35; }
        else if (clock < 90)  { base *= 0.60; spread *= 0.50; }
        else if (clock < 150) { base *= 0.78; spread *= 0.65; }

        base   = clamp(base,   110, cfg.thinkMax * 1.5);
        spread = clamp(spread,  50, cfg.thinkMax * 2.0);

        return clamp(Math.floor(base + clamp(gauss(0.40, 0.2), 0, 1) * spread), 110, 10000);
    }

    async function pickMove(fen, main) {
        if (cfg.bulletMode) return main.best;
        const r = Math.random();
        
        if (r < cfg.blunders) {
            state.justBlundered = true;
            const w = await analyze(fen, 2);
            if (w.best) return w.best;
        } else {
            state.justBlundered = false;
        }
        
        if (r < cfg.blunders + cfg.mistakes) {
            const w = await analyze(fen, 3);
            if (w.best) return w.best;
        }
        
        return main.best;
    }

    async function fakeHoverWrong(target, skip) {
        const col = myColor();
        const pool = [...document.querySelectorAll('.piece')]
            .filter(p => ['p','n','b','r','q','k'].some(t => p.classList.contains(`${col}${t}`)))
            .filter(p => {
                const s = Array.from(p.classList).find(c => c.startsWith('square-'));
                if (!s) return false;
                const n = s.split('-')[1];
                return `${NUM_FILE[parseInt(n[0])]}${n[1]}` !== skip;
            });
        const r  = pool[Math.floor(Math.random() * pool.length)].getBoundingClientRect();
        if (!r.width) return;
        const wx = r.left + r.width/2, wy = r.top + r.height/2;
        await moveTo(target.centerX, target.centerY, wx, wy, 0);
        await sleep(rnd(100, 380));
        await moveTo(wx, wy, target.centerX, target.centerY, 0);
        await sleep(rnd(30, 90));
    }

    async function fakeReconsider(fx, fy, tx, ty) {
        const mx = fx + (tx-fx)*rnd(0.1, 0.35);
        const my = fy + (ty-fy)*rnd(0.1, 0.35);
        await moveTo(fx, fy, mx, my, 1);
        await sleep(rnd(90, 280));
        await moveTo(mx, my, fx, fy, 1);
        await sleep(rnd(50, 130));
    }

    async function playMove(move, instant = false) {
        if (!move) return false;
        const b = board();
        if (!b) return false;

        const from = move.slice(0, 2), to = move.slice(2, 4);
        if (!myPieceAt(from)) return false;

        const fr = squareRect(from), tr = squareRect(to);
        if (!fr || !tr) return false;

        if (instant || cfg.bulletMode) {
            const elFrom = document.elementFromPoint(fr.centerX, fr.centerY) || b;
            const elTo = document.elementFromPoint(tr.centerX, tr.centerY) || b;
            
            tap('pointerdown', elFrom, fr.centerX, fr.centerY);
            tap('pointerup', elFrom, fr.centerX, fr.centerY);
            tap('pointerdown', elTo, tr.centerX, tr.centerY);
            tap('pointerup', elTo, tr.centerX, tr.centerY);
        } else {
            const br = b.getBoundingClientRect();
            const sx = br.left + rnd(30, br.width  - 30);
            const sy = br.top  + rnd(30, br.height - 30);

            if (cfg.misclicksEnabled && Math.random() < 0.04) {
                const files = ['a','b','c','d','e','f','g','h'];
                const currentFileIdx = files.indexOf(from[0]);
                const currentRank = parseInt(from[1]);
                const targetFile = files[clamp(currentFileIdx + rndInt(-1, 1), 0, 7)];
                const targetRank = clamp(currentRank + rndInt(-1, 1), 1, 8);
                const wrongSq = `${targetFile}${targetRank}`;
                
                if (wrongSq !== from) {
                    const wrongRect = squareRect(wrongSq);
                    if (wrongRect) {
                        await moveTo(sx, sy, wrongRect.centerX, wrongRect.centerY, 0);
                        tap('pointerdown', document.elementFromPoint(wrongRect.centerX, wrongRect.centerY) || b, wrongRect.centerX, wrongRect.centerY);
                        await sleep(rnd(150, 300));
                        tap('pointerup', document.elementFromPoint(wrongRect.centerX, wrongRect.centerY) || document.body, wrongRect.centerX, wrongRect.centerY);
                        await sleep(rnd(200, 450));
                    }
                }
            }

            if (Math.random() < cfg.badHoverChance) await fakeHoverWrong(fr, from);

            await moveTo(sx, sy, fr.centerX, fr.centerY, 0);
            await sleep(rnd(18, 50));

            tap('pointerdown', document.elementFromPoint(fr.centerX, fr.centerY) || b, fr.centerX, fr.centerY);
            await sleep(rnd(40, 110));

            if (Math.random() < cfg.reconsiderChance) await fakeReconsider(fr.centerX, fr.centerY, tr.centerX, tr.centerY);

            await moveTo(fr.centerX, fr.centerY, tr.centerX, tr.centerY, 1);
            await sleep(rnd(12, 40));

            tap('pointerup', document.elementFromPoint(tr.centerX, tr.centerY) || document.body, tr.centerX, tr.centerY);
        }

        if (move.length === 5) await handlePromotion(move[4]);

        state.moves++;
        state.halfMoves++;
        state.lastWasCapture = oppPieceAt(to);
        state.lastMove = move;

        try {
            const stored = await chrome.storage.local.get(['appConfig']);
            const cfg = stored.appConfig || {};
            cfg.statMovesPlayed = (cfg.statMovesPlayed || 0) + 1;
            const accuracyVal = state.justBlundered ? 35 : 100;
            cfg.statTotalAccuracy = (cfg.statTotalAccuracy || 0) + accuracyVal;
            cfg.statAccuracyCount = (cfg.statAccuracyCount || 0) + 1;
            await chrome.storage.local.set({ appConfig: cfg });
        } catch (_) {}

        window.dispatchEvent(new CustomEvent('ch:move', { detail: { move, book: false } }));
        return true;
    }

    async function handlePromotion(piece) {
        const end = Date.now() + 3000;
        let win;
        while (Date.now() < end) {
            win = document.querySelector('.promotion-window, .promotion-popup');
            if (win) break;
            await sleep(50);
        }
        if (!win) return;
        await sleep(rnd(160, 380));

        const p   = piece.toLowerCase();
        const col = myColor();
        let btn   = win.querySelector(`.promotion-piece.${col}${p}`)
                 || win.querySelector(`.promotion-piece.w${p}`)
                 || win.querySelector(`.promotion-piece.b${p}`);
        if (!btn) {
            const all = win.querySelectorAll('.promotion-piece');
            btn = all[{ q:0, n:1, r:2, b:3 }[p] ?? 0];
        }
        if (!btn) return;

        const r  = btn.getBoundingClientRect();
        const bx = r.left + r.width/2, by = r.top + r.height/2;
        const wr = win.getBoundingClientRect();
        await moveTo(wr.left + rnd(0, wr.width), wr.top + rnd(0, wr.height), bx, by, 0);
        await sleep(rnd(45, 110));
        btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: bx, clientY: by }));
        await sleep(rnd(25, 60));
        btn.dispatchEvent(new PointerEvent('pointerup',   { bubbles: true, clientX: bx, clientY: by }));
        btn.dispatchEvent(new MouseEvent('click',         { bubbles: true }));
    }

    let running  = false;
    let lastFen  = '';
    let watchdog = 0;

    window.chessHelperIntervals.register('watchdog', () => {
        if (running && Date.now() - watchdog > 35000) {
            running = false; lastFen = '';
            notify('watchdog reset');
        }
    }, 5000);

    function notify(msg) {
        if (window.chessHelper?.debug) console.log(`[ch:engine] ${msg}`);
    }

    async function tick() {
        if (!window.chessHelper?.autoPlay || running) return;
        running = true;

        const fen = getFEN();
        if (!fen) {
            running = false;
            return;
        }

        const turn = fen.split(' ')[1];
        const me   = myColor();

        if (turn !== me) {
            lastFen = '';
            if (cfg.ponderingEnabled && !cfg.bulletMode && (!prefetch || prefetch.fen !== fen)) {
                const snap = fen;
                let currentDepth = cfg.depth;
                if (cfg.randDepthEnabled) {
                    currentDepth = clamp(cfg.depth + rndInt(-2, 2), 3, 10);
                }
                analyze(snap, currentDepth).then(a => {
                    if (a.best && getFEN() === snap) prefetch = { fen: snap, data: a };
                });
            }
            running = false;
            return;
        }
        if (fen === lastFen) {
            running = false;
            return;
        }

        await sleep(12);
        const stableFen = getFEN();
        if (stableFen !== fen) {
            running = false;
            setTimeout(tick, 5);
            return;
        }

        watchdog = Date.now();
        lastFen  = stableFen;

        try {
            state.thinking = true;
            window.dispatchEvent(new CustomEvent('ch:thinking', { detail: true }));

            const bk = gamePhase(stableFen) === 'opening' ? await window.chessHelperBook.getMove(stableFen) : null;

            let engine = null;
            if (!bk) {
                let currentDepth = cfg.depth;
                if (cfg.bulletMode) {
                    currentDepth = 5;
                } else if (cfg.randDepthEnabled) {
                    currentDepth = clamp(cfg.depth + rndInt(-2, 2), 3, 10);
                }
                state.depth = currentDepth;
                engine = (prefetch?.fen === stableFen) ? prefetch.data : await analyze(stableFen, currentDepth);
            } else {
                state.depth = 0;
            }
            prefetch = null;

            if (!bk && !engine?.best) {
                lastFen = '';
                setTimeout(tick, 1000);
                return;
            }

            const chosen  = bk || engine.best;
            state.bestMove = chosen;
            const fromSq  = chosen.slice(0, 2);
            const toSq    = chosen.slice(2, 4);
            const recap   = state.lastWasCapture && oppPieceAt(toSq);
            const fast    = recap && Math.random() < cfg.premoveChance;

            let wait;
            if (cfg.bulletMode) {
                wait = 0;
            } else if (fast) {
                wait = rndInt(90, 250);
                state.quickMoveStreak++;
            } else {
                wait = thinkTime(engine || { eval: 0, mate: null }, fen, fromSq, toSq, !!bk);
                if (wait < 900) state.quickMoveStreak++; else state.quickMoveStreak = 0;
            }

            state.eval = engine?.eval || 0;
            notify(`${gamePhase(fen)} hm=${state.halfMoves} wait=${wait}ms ${chosen}${bk ? ' [book]' : ''}`);

            if (wait > 0) {
                await sleep(wait);
            }

            if (getFEN() !== fen || !window.chessHelper.autoPlay) { lastFen = ''; return; }

            const move = bk ? bk : await pickMove(fen, engine);
            if (!move) { 
                lastFen = ''; 
                setTimeout(tick, 1000);
                return; 
            }
            if (getFEN() !== fen || !window.chessHelper.autoPlay) return;

            await playMove(move, cfg.bulletMode);

        } catch (err) {
            console.error('[ch:engine]', err);
            lastFen = '';
        } finally {
            running = false;
            state.thinking = false;
            window.dispatchEvent(new CustomEvent('ch:thinking', { detail: false }));
        }
    }

    function checkGameOver() {
        const gameOverModal = Array.from(document.querySelectorAll(
            '.game-over-modal-container, .board-modal-container, .game-over-header-component, ' + 
            '.board-modal-modal, .game-over-dialog, .game-over-modal, [data-behavior="game-over-modal"], ' +
            '.board-modal-content, .game-over-header-title, [class*="game-over-modal"], [class*="board-modal"], [data-testid*="game-over"]'
        )).find(el => el.offsetWidth > 0 && el.offsetHeight > 0);
        
        if (gameOverModal && !state.gameEnded) {
            state.gameEnded = true;
            setTimeout(() => {
                const updatedModal = Array.from(document.querySelectorAll(
                    '.game-over-modal-container, .board-modal-container, .game-over-header-component, ' + 
                    '.board-modal-modal, .game-over-dialog, .game-over-modal, [data-behavior="game-over-modal"], ' +
                    '.board-modal-content, .game-over-header-title, [class*="game-over-modal"], [class*="board-modal"], [data-testid*="game-over"]'
                )).find(el => el.offsetWidth > 0 && el.offsetHeight > 0) || gameOverModal;
                handleGameOver(updatedModal);
            }, 180);
        } else if (!gameOverModal) {
            state.gameEnded = false;
        }
    }

    function handleGameOver(modal) {
        window.dispatchEvent(new CustomEvent('ch:gameover', { detail: { modalText: modal.textContent } }));
    }

    async function recordFEN(fen) {
        if (!fen) return;
        if (!window.chessHelperGameFENs) window.chessHelperGameFENs = [];
        const history = window.chessHelperGameFENs;
        const parts = fen.split(' ');
        const piecesKey = parts[0];
        
        try {
            const isStartPos = piecesKey === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
            if (isStartPos) {
                window.chessHelperGameFENs = [fen];
                await chrome.storage.local.set({ gameFens: [fen], gameId: getGameId() });
            } else if (history.length === 0 || history[history.length - 1].split(' ')[0] !== piecesKey) {
                history.push(fen);
                await chrome.storage.local.set({ gameFens: history, gameId: getGameId() });
            }
        } catch (_) {}
    }

    let observerTimeout = null;
    const observer = new MutationObserver(() => { 
        if (observerTimeout) clearTimeout(observerTimeout);
        observerTimeout = setTimeout(() => {
            checkNewGame();
            checkGameOver();
            recordFEN(getFEN());
            if (window.chessHelper?.autoPlay) tick(); 
        }, 50);
    });

    let lastObservedBoard = null;
    let observerInterval = null;
    function attachObserver() {
        if (observerInterval) return;
        observerInterval = window.chessHelperIntervals.register('observer', () => {
            const b = board();
            if (b) {
                if (b !== lastObservedBoard) {
                    try { observer.disconnect(); } catch (_) {}
                    observer.observe(b, { childList: true, subtree: true, attributes: true });
                    lastObservedBoard = b;
                }
            } else if (lastObservedBoard) {
                try { observer.disconnect(); } catch (_) {}
                lastObservedBoard = null;
            }
        }, 1000);
    }

    async function loadConfigOnStartup() {
        try {
            const stored = await chrome.storage.local.get(['appConfig']);
            if (stored && stored.appConfig) {
                window.chessHelperEngine?.updateConfig({
                    preset: stored.appConfig.preset,
                    blunders: stored.appConfig.blunders,
                    mouseSpeed: stored.appConfig.mouseSpeed,
                    thinkVariance: stored.appConfig.thinkVariance,
                    randDepthEnabled: stored.appConfig.randDepthEnabled,
                    fatigueEnabled: stored.appConfig.fatigueEnabled,
                    distractionsEnabled: stored.appConfig.distractionsEnabled,
                    ponderingEnabled: stored.appConfig.ponderingEnabled,
                    misclicksEnabled: stored.appConfig.misclicksEnabled,
                    bulletMode: stored.appConfig.bulletMode
                });
                if (stored.appConfig.elo) {
                    window.chessHelperEngine?.setElo(stored.appConfig.elo);
                }
            }
        } catch (_) {}
    }

    async function init() {
        try {
            
            const currentGameId = getGameId();
            const res = await chrome.storage.local.get(['gameFens', 'gameId']);
            if (res.gameId === currentGameId && Array.isArray(res.gameFens)) {
                window.chessHelperGameFENs = res.gameFens;
            } else {
                window.chessHelperGameFENs = [];
                await chrome.storage.local.set({ gameFens: [], gameId: currentGameId });
            }
            console.log('[ch:engine] Loaded FEN history:', window.chessHelperGameFENs.length);
 
            
            lastGameId = currentGameId;
            lastPlayersKey = getPlayersKey();
 
            
            await loadConfigOnStartup();
 
            
            attachObserver();
 
            
            window.chessHelperIntervals.register('game_tick', () => { 
                checkNewGame();
                checkGameOver();
                recordFEN(getFEN());
                if (window.chessHelper?.autoPlay) tick(); 
            }, 200);
 
        } catch (e) {
            console.error('[ch:engine] Initialization exception:', e);
        }
    }

    init();

    window.chessHelperEngine = {
        trigger() { running = false; lastFen = ''; prefetch = null; tick(); },
        analyze,
        getFEN,
        myColor,
        getFensFromController,

        async hint(fen) {
            let currentDepth = cfg.depth;
            if (cfg.bulletMode) {
                currentDepth = 5; 
            } else if (cfg.randDepthEnabled) {
                currentDepth = clamp(cfg.depth + rndInt(-2, 2), 3, 10);
            }
            const a = await analyze(fen, currentDepth);
            return a.best;
        },

        setElo(elo) {
            const targetElo = isNaN(parseInt(elo)) ? 1300 : parseInt(elo);
            
            const t       = clamp((targetElo - 1000) / 1500, 0, 1);
            cfg.elo       = targetElo;
            
            
            cfg.depth     = Math.round(3 + t * 13);
            
            
            cfg.thinkMin  = Math.round(Math.max(80, 320 - t * 240));
            cfg.thinkMax  = Math.round(Math.max(300, 2000 - t * 1700));
            
            
            cfg.wobble    = Math.max(0, 5 - t * 5);
            cfg.badHoverChance  = Math.max(0, 0.20 - t * 0.20);
            cfg.reconsiderChance = Math.max(0, 0.12 - t * 0.12);
            
            if (window.chessHelperMouse) {
                window.chessHelperMouse.wobble = cfg.wobble;
            }
            clearCache();
        },

        updateConfig(newConfig) {
            Object.assign(cfg, newConfig);
            clearCache();
        },

        async playInstant(move) {
            running = true;
            try {
                await playMove(move, true);
            } catch (e) {
                console.error('[ch:engine] playInstant failure: ', e);
            } finally {
                running = false;
            }
        },

        getState: () => ({ ...state, phase: gamePhase(getFEN() || ''), queueSize: pendingAnalyses.size }),

        reset() {
            state = { moves: 0, halfMoves: 0, eval: 0, justBlundered: false, lastWasCapture: false, quickMoveStreak: 0, thinking: false, lastMove: null, gameEnded: false, distractionTriggeredThisGame: false, depth: 0, bestMove: null };
            running = false; lastFen = ''; prefetch = null;
            clearCache();
            pendingAnalyses.clear();
            window.dispatchEvent(new CustomEvent('ch:reset'));
        },
    };
})();