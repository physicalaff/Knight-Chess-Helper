const PIECE_MAP = {
    'wp':'P','wn':'N','wb':'B','wr':'R','wq':'Q','wk':'K',
    'bp':'p','bn':'n','bb':'b','br':'r','bq':'q','bk':'k'
};
const FILE_NUM = {'a':1,'b':2,'c':3,'d':4,'e':5,'f':6,'g':7,'h':8};
const NUM_FILE = {1:'a',2:'b',3:'c',4:'d',5:'e',6:'f',7:'g',8:'h'};

const cfg = {
    elo: 1300,
    mistakes: 0.18,
    blunders: 0.04,
    depth: 5,
    thinkMin: 500,
    thinkMax: 3000,
    wobble: 3.5,
    badHoverChance: 0.12,
    reconsiderChance: 0.07,
    premoveChance: 0.15,
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
};

const sleep  = ms => new Promise(r => setTimeout(r, ms));
const clamp  = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd    = (a, b) => a + Math.random() * (b - a);
const rndInt = (a, b) => Math.floor(rnd(a, b));

function gauss(mean, std) {
    const u = 1 - Math.random();
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
    for (const hl of document.querySelectorAll('.highlight')) {
        const cls = Array.from(hl.classList).find(c => c.startsWith('square-'));
        if (!cls) continue;
        const piece = document.querySelector(`.piece.square-${cls.split('-')[1]}`);
        if (!piece) continue;
        const pc = Array.from(piece.classList);
        if (pc.some(c => c.startsWith('w'))) return 'b';
        if (pc.some(c => c.startsWith('b'))) return 'w';
    }
    return 'w';
}

function getFEN() {
    const pieces = document.querySelectorAll('.piece');
    if (!pieces.length) return null;

    const grid = Array(8).fill(null).map(() => Array(8).fill(null));
    pieces.forEach(p => {
        const cls  = Array.from(p.classList);
        const type = cls.find(c => PIECE_MAP[c]);
        const sq   = cls.find(c => c.startsWith('square-'));
        if (type && sq) {
            const n = sq.split('-')[1];
            grid[8 - parseInt(n[1])][parseInt(n[0]) - 1] = PIECE_MAP[type];
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

    return rows.join('/') + ` ${activeColor()} - - 0 1`;
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
    return document.querySelector(`.piece.square-${FILE_NUM[sq[0]]}${sq[1]}`);
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

function myClock() {
    try {
        const els   = [...document.querySelectorAll('.clock-time-monospace, .clock-time')];
        const el    = myColor() === 'w' ? els[els.length - 1] : els[0];
        if (!el) return Infinity;
        const parts = el.textContent.trim().replace(/\s/g, '').split(':').map(Number);
        if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
        if (parts.length === 2) return parts[0]*60 + parts[1];
        if (parts.length === 1 && !isNaN(parts[0])) return parts[0];
    } catch (_) {}
    return Infinity;
}

const bookCache    = new Map();
const engineCache  = new Map();
let   prefetch     = null;

function timedFetch(url, ms = 9000) {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(tid));
}

async function bookMove(fen) {
    if (state.halfMoves > 14) return null;
    const key = fen.split(' ')[0];
    if (bookCache.has(key)) return bookCache.get(key);

    try {
        const res  = await timedFetch(
            `https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(fen)}&topGames=0&recentGames=0`,
            4000
        );
        if (!res.ok) { bookCache.set(key, null); return null; }
        const data = await res.json();
        const pool = (data.moves || []).filter(m => m.white + m.black + m.draws > 8);
        if (!pool.length) { bookCache.set(key, null); return null; }

        const total  = pool.reduce((s, m) => s + m.white + m.black + m.draws, 0);
        let roll     = Math.random() * total, picked = pool[0];
        for (const m of pool) { roll -= m.white + m.black + m.draws; if (roll <= 0) { picked = m; break; } }

        bookCache.set(key, picked.uci);
        notify(`book: ${picked.uci}`);
        return picked.uci;
    } catch (_) {
        bookCache.set(key, null);
        return null;
    }
}

const pendingAnalyses = new Map();

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'ANALYSIS_RESULT') {
        const { requestId, data } = message;
        if (pendingAnalyses.has(requestId)) {
            const { resolve } = pendingAnalyses.get(requestId);
            pendingAnalyses.delete(requestId);
            resolve(data);
        }
    }
});

async function analyze(fen, depth, tries = 2) {
    const key = `${fen}|${depth}`;
    if (engineCache.has(key)) return engineCache.get(key);

    const requestId = `${Date.now()}-${Math.random()}`;

    const promise = new Promise((resolve) => {
        pendingAnalyses.set(requestId, { resolve });
    });

    const safetyTimeout = setTimeout(() => {
        if (pendingAnalyses.has(requestId)) {
            const { resolve } = pendingAnalyses.get(requestId);
            pendingAnalyses.delete(requestId);
            console.warn('[ch:engine] Local search timeout fallback triggered.');
            resolve({ eval: 0, mate: null, best: null });
        }
    }, 10000);

    chrome.runtime.sendMessage({
        target: 'background',
        type: 'ANALYZE',
        fen,
        depth,
        requestId
    });

    const result = await promise;
    clearTimeout(safetyTimeout);

    if (result && result.best) {
        if (engineCache.size > 120) engineCache.delete(engineCache.keys().next().value);
        engineCache.set(key, result);
        return result;
    }

    return { eval: 0, mate: null, best: null };
}

function clearCache() {
    engineCache.clear();
    prefetch = null;
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
        base *= 1.85;   
        spread *= 2.10; 
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

    if (clock < 20)       { base = Math.min(base, 280); spread = Math.min(spread, 400); }
    else if (clock < 45)  { base *= 0.40; spread *= 0.35; }
    else if (clock < 90)  { base *= 0.60; spread *= 0.50; }
    else if (clock < 150) { base *= 0.78; spread *= 0.65; }

    base   = clamp(base,   110, cfg.thinkMax * 1.5);
    spread = clamp(spread,  50, cfg.thinkMax * 2.0);

    return clamp(Math.floor(base + clamp(gauss(0.40, 0.2), 0, 1) * spread), 110, 10000);
}

async function pickMove(fen, main) {
    const r = Math.random();
    if (r < cfg.blunders) {
        state.justBlundered = true;
        const w = await analyze(fen, 2);
        if (w.best) return w.best;
    } else {
        state.justBlundered = false;
    }
    if (r < cfg.blunders + cfg.mistakes) {
        const w = await analyze(fen, 2);
        if (w.best) return w.best;
    }
    return main.best;
}

function bezier(t, p0, p1, p2, p3) {
    const m = 1 - t;
    return m*m*m*p0 + 3*m*m*t*p1 + 3*m*t*t*p2 + t*t*t*p3;
}

async function moveTo(x0, y0, x1, y1, held = 0) {
    const dist  = Math.hypot(x1-x0, y1-y0);
    const steps = clamp(Math.floor(dist / 7), 8, 38);
    const drift = dist * rnd(0.06, 0.18);
    const ang   = Math.atan2(y1-y0, x1-x0) + rnd(-0.45, 0.45);
    const cx1   = x0 + (x1-x0)*rnd(0.2, 0.4) + Math.cos(ang)*drift;
    const cy1   = y0 + (y1-y0)*rnd(0.2, 0.4) + Math.sin(ang)*drift;
    const cx2   = x0 + (x1-x0)*rnd(0.6, 0.8) - Math.cos(ang)*drift*0.5;
    const cy2   = y0 + (y1-y0)*rnd(0.6, 0.8) - Math.sin(ang)*drift*0.5;

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const e = t < 0.5 ? 2*t*t : -1 + (4-2*t)*t;
        const x = bezier(e, x0, cx1, cx2, x1) + (Math.random()-0.5)*cfg.wobble;
        const y = bezier(e, y0, cy1, cy2, y1) + (Math.random()-0.5)*cfg.wobble;
        const el = document.elementFromPoint(x, y) || document.body;
        el.dispatchEvent(new PointerEvent('pointermove', {
            bubbles: true, cancelable: true, view: window,
            clientX: x, clientY: y, buttons: held, pointerId: 1, isPrimary: true,
            pressure: held ? 0.5 : 0,
        }));
        await sleep(clamp(Math.floor(rnd(5, 12) / (1 - Math.abs(t-0.5)*0.5)), 4, 18));
    }
}

function tap(type, el, x, y) {
    el.dispatchEvent(new PointerEvent(type, {
        bubbles: true, cancelable: true, view: window,
        clientX: x + (Math.random()-0.5)*1.5,
        clientY: y + (Math.random()-0.5)*1.5,
        buttons: 1, pointerId: 1, isPrimary: true,
        width: rnd(1,3), height: rnd(1,3), pressure: rnd(0.4, 0.7),
    }));
}

async function fakeHoverWrong(target, skip) {
    const col  = myColor();
    const pool = [...document.querySelectorAll('.piece')]
        .filter(p => ['p','n','b','r','q','k'].some(t => p.classList.contains(`${col}${t}`)))
        .filter(p => {
            const s = Array.from(p.classList).find(c => c.startsWith('square-'));
            if (!s) return false;
            const n = s.split('-')[1];
            return `${NUM_FILE[parseInt(n[0])]}${n[1]}` !== skip;
        });
    if (!pool.length) return;
    const r  = pool[rndInt(0, pool.length)].getBoundingClientRect();
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

async function playMove(move) {
    if (!move) return false;
    const b = board();
    if (!b) return false;

    const from = move.slice(0, 2), to = move.slice(2, 4);
    if (!myPieceAt(from)) return false;

    const fr = squareRect(from), tr = squareRect(to);
    if (!fr || !tr) return false;

    const br = b.getBoundingClientRect();
    const sx = br.left + rnd(30, br.width  - 30);
    const sy = br.top  + rnd(30, br.height - 30);

    if (Math.random() < cfg.badHoverChance) await fakeHoverWrong(fr, from);

    await moveTo(sx, sy, fr.centerX, fr.centerY, 0);
    await sleep(rnd(18, 50));

    tap('pointerdown', document.elementFromPoint(fr.centerX, fr.centerY) || b, fr.centerX, fr.centerY);
    await sleep(rnd(40, 110));

    if (Math.random() < cfg.reconsiderChance) await fakeReconsider(fr.centerX, fr.centerY, tr.centerX, tr.centerY);

    await moveTo(fr.centerX, fr.centerY, tr.centerX, tr.centerY, 1);
    await sleep(rnd(12, 40));

    tap('pointerup', document.elementFromPoint(tr.centerX, tr.centerY) || document.body, tr.centerX, tr.centerY);

    if (move.length === 5) await handlePromotion(move[4]);

    state.moves++;
    state.halfMoves++;
    state.lastWasCapture = oppPieceAt(to);
    state.lastMove = move;

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

setInterval(() => {
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

    const fen = getFEN();
    if (!fen) return;

    const turn = fen.split(' ')[1];
    const me   = myColor();

    if (turn !== me) {
        lastFen = '';
        if (!prefetch || prefetch.fen !== fen) {
            const snap = fen;
            analyze(snap, cfg.depth).then(a => {
                if (a.best && getFEN() === snap) prefetch = { fen: snap, data: a };
            });
        }
        return;
    }
    if (fen === lastFen) return;

    running  = true;
    watchdog = Date.now();
    lastFen  = fen;

    try {
        state.thinking = true;
        window.dispatchEvent(new CustomEvent('ch:thinking', { detail: true }));

        const bk = gamePhase(fen) === 'opening' ? await bookMove(fen) : null;

        let engine = null;
        if (!bk) {
            engine = (prefetch?.fen === fen) ? prefetch.data : await analyze(fen, cfg.depth);
        }
        prefetch = null;

        if (!bk && !engine?.best) {
            lastFen = '';
            return;
        }

        const chosen  = bk || engine.best;
        const fromSq  = chosen.slice(0, 2);
        const toSq    = chosen.slice(2, 4);
        const recap   = state.lastWasCapture && oppPieceAt(toSq);
        const fast    = recap && Math.random() < cfg.premoveChance;

        let wait;
        if (fast) {
            wait = rndInt(90, 250);
            state.quickMoveStreak++;
        } else {
            wait = thinkTime(engine || { eval: 0, mate: null }, fen, fromSq, toSq, !!bk);
            if (wait < 900) state.quickMoveStreak++; else state.quickMoveStreak = 0;
        }

        state.eval = engine?.eval || 0;
        notify(`${gamePhase(fen)} hm=${state.halfMoves} wait=${wait}ms ${chosen}${bk ? ' [book]' : ''}`);

        await sleep(wait);

        if (getFEN() !== fen || !window.chessHelper.autoPlay) { lastFen = ''; return; }

        const move = bk ? bk : await pickMove(fen, engine);
        if (!move) { lastFen = ''; return; }
        if (getFEN() !== fen || !window.chessHelper.autoPlay) return;

        await playMove(move);

    } catch (err) {
        console.error('[ch:engine]', err);
        lastFen = '';
    } finally {
        running = false;
        state.thinking = false;
        window.dispatchEvent(new CustomEvent('ch:thinking', { detail: false }));
    }
}

const observer = new MutationObserver(() => { if (window.chessHelper?.autoPlay) tick(); });

function attachObserver() {
    const b = board();
    if (b) { observer.observe(b, { childList: true, subtree: true, attributes: true }); }
    else   { setTimeout(attachObserver, 1000); }
}
attachObserver();
setInterval(() => { if (window.chessHelper?.autoPlay) tick(); }, 3500);

window.chessHelperEngine = {
    trigger() { running = false; lastFen = ''; prefetch = null; tick(); },

    getFEN,
    myColor,

    async hint(fen) {
        const a = await analyze(fen, cfg.depth);
        return a.best;
    },

    setElo(elo) {
        const t       = clamp((elo - 1000) / 500, 0, 1);
        cfg.elo       = elo;
        cfg.mistakes  = 0.30 - t * 0.22;
        cfg.blunders  = 0.08 - t * 0.065;
        cfg.depth     = Math.round(3 + t * 5);
        cfg.thinkMin  = Math.round(320 + t * 280);
        cfg.thinkMax  = Math.round(2000 + t * 1800);
        cfg.wobble    = 5 - t * 3.5;
        cfg.badHoverChance  = 0.20 - t * 0.16;
        cfg.reconsiderChance = 0.12 - t * 0.09;
        clearCache();
        notify(`elo=${elo} depth=${cfg.depth} mistakes=${(cfg.mistakes*100).toFixed(0)}%`);
    },

    getState: () => ({ ...state, phase: gamePhase(getFEN() || '') }),

    reset() {
        state = { moves: 0, halfMoves: 0, eval: 0, justBlundered: false, lastWasCapture: false, quickMoveStreak: 0, thinking: false, lastMove: null };
        running = false; lastFen = ''; prefetch = null;
        clearCache();
    },
};