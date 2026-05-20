window.chessHelper = { autoPlay: false, debug: false };

const $ = id => document.getElementById(id);

let root, bubble, panel;
let hintTimeout = null;
const drag = { on: false, moved: false, ox: 0, oy: 0, ix: 0, iy: 0, vx: 0, vy: 0, lx: 0, ly: 0, lt: 0 };
const moveLog = [];

function init() {
    $('ch-root')?.remove();

    root = el('div', { id: 'ch-root' });

    bubble = el('div', { id: 'ch-bubble' });
    bubble.innerHTML = svgKnight();
    drag.ox = window.innerWidth - 76;
    drag.oy = 100;
    syncBubble();

    panel = el('div', { id: 'ch-panel' });
    panel.innerHTML = panelHTML();

    root.append(bubble, panel);
    document.body.appendChild(root);

    injectStyles();
    bindDrag();
    bindEvents();
    syncColor();

    setInterval(syncColor,  1800);
    setInterval(syncStats,  2200);

    window.addEventListener('ch:thinking', e => onThinking(e.detail));
    window.addEventListener('ch:move',     e => logMove(e.detail));
}

function el(tag, attrs = {}, text = '') {
    const e = document.createElement(tag);
    Object.assign(e, attrs);
    if (text) e.textContent = text;
    return e;
}

function svgKnight() {
    return `<img src="${chrome.runtime.getURL('Knight.png')}" style="width:32px;height:32px;pointer-events:none;object-fit:contain;" draggable="false"/>`;
}

function panelHTML() {
    return `
<div id="ch-header">
    <div id="ch-brand">
        <span id="ch-logo">${svgKnight()}</span>
        <div>
            <div id="ch-title">Knight</div>
            <div id="ch-subtitle">Chess Assistant</div>
        </div>
    </div>
    <button id="ch-close" aria-label="Close">✕</button>
</div>

<div id="ch-color-strip">
    <div id="ch-color-inner">
        <span id="ch-color-dot"></span>
        <span id="ch-color-text">–</span>
    </div>
    <span id="ch-phase-tag">–</span>
</div>

<div id="ch-stats">
    <div class="ch-stat">
        <span class="ch-stat-n" id="st-eval">–</span>
        <span class="ch-stat-l">Eval</span>
    </div>
    <div class="ch-stat-div"></div>
    <div class="ch-stat">
        <span class="ch-stat-n" id="st-moves">0</span>
        <span class="ch-stat-l">Moves</span>
    </div>
    <div class="ch-stat-div"></div>
    <div class="ch-stat">
        <span class="ch-stat-n" id="st-clock">–</span>
        <span class="ch-stat-l">Clock</span>
    </div>
    <div class="ch-stat-div"></div>
    <div class="ch-stat">
        <span class="ch-stat-n" id="st-phase">–</span>
        <span class="ch-stat-l">Phase</span>
    </div>
</div>

<div id="ch-autoplay-row">
    <div id="ch-ap-left">
        <div id="ch-ap-indicator"></div>
        <span id="ch-ap-label">Auto-play</span>
    </div>
    <label id="ch-toggle-wrap">
        <input type="checkbox" id="ch-autoplay">
        <span id="ch-track"><span id="ch-thumb"></span></span>
    </label>
</div>

<div id="ch-elo-section">
    <div id="ch-elo-top">
        <span id="ch-elo-tier">Club Player</span>
        <span id="ch-elo-num">1300</span>
    </div>
    <div id="ch-elo-bar-wrap">
        <div id="ch-elo-bar-fill"></div>
        <input type="range" id="ch-elo-range" min="1000" max="1500" step="50" value="1300">
    </div>
    <div id="ch-elo-ends">
        <span>1000 · Beginner</span>
        <span>1500 · Advanced</span>
    </div>
</div>

<div id="ch-log-section">
    <div id="ch-log-header">
        <span>Last moves</span>
        <button id="ch-log-clear">clear</button>
    </div>
    <div id="ch-log-list"></div>
</div>

<div id="ch-actions">
    <button class="ch-action" id="ch-hint-btn">
        <span id="ch-hint-icon">⬡</span>
        <span id="ch-hint-text">Show hint</span>
    </button>
    <button class="ch-action ch-action-outline" id="ch-reset-btn">
        <span>↺ Reset</span>
    </button>
</div>

<div id="ch-think-bar">
    <div id="ch-think-fill"></div>
</div>
    `.trim();
}

const TIERS = [
    [1000, 'Beginner'],
    [1100, 'Casual'],
    [1200, 'Intermediate'],
    [1300, 'Club Player'],
    [1400, 'Strong Club'],
    [1500, 'Advanced'],
];

function eloTier(v) {
    let tier = TIERS[0][1];
    for (const [n, label] of TIERS) { if (v >= n) tier = label; }
    return tier;
}

function bindEvents() {
    $('ch-close').onclick = closePanel;

    const autoplay = $('ch-autoplay');
    autoplay.addEventListener('change', () => {
        window.chessHelper.autoPlay = autoplay.checked;
        $('ch-ap-indicator').classList.toggle('active', autoplay.checked);
        $('ch-ap-label').textContent = autoplay.checked ? 'Active' : 'Auto-play';
        if (autoplay.checked) window.chessHelperEngine?.trigger();
    });

    const range  = $('ch-elo-range');
    const eloNum = $('ch-elo-num');
    const eloTierEl = $('ch-elo-tier');
    const fill   = $('ch-elo-bar-fill');

    function syncElo() {
        const v   = parseInt(range.value);
        const pct = (v - 1000) / 500 * 100;
        eloNum.textContent     = v;
        eloTierEl.textContent  = eloTier(v);
        fill.style.width       = `${pct}%`;
        window.chessHelperEngine?.setElo(v);
    }
    range.addEventListener('input', syncElo);
    syncElo();

    $('ch-hint-btn').onclick = async () => {
        const eng = window.chessHelperEngine;
        if (!eng) return;
        const icon = $('ch-hint-icon'), txt = $('ch-hint-text');
        
        icon.textContent = '…'; 
        txt.textContent = 'Analyzing';
        $('ch-hint-btn').disabled = true;
        
        const fen  = eng.getFEN();
        const move = fen ? await eng.hint(fen) : null;
        
        $('ch-hint-btn').disabled = false;
        
        if (move) {
            drawArrow(move);
            txt.textContent = `Hint: ${move.toUpperCase()}`;
            icon.textContent = '✓';
        } else {
            txt.textContent = 'No game';
            icon.textContent = '⚠';
        }
        
        if (hintTimeout) clearTimeout(hintTimeout);
        hintTimeout = setTimeout(() => { 
            icon.textContent = '⬡'; 
            txt.textContent = 'Show hint'; 
        }, 2500);
    };

    $('ch-reset-btn').onclick = () => {
        window.chessHelperEngine?.reset();
        moveLog.length = 0;
        renderLog();
        $('st-moves').textContent = '0';
        $('st-eval').textContent  = '–';
    };

    $('ch-log-clear').onclick = () => { moveLog.length = 0; renderLog(); };
}

function onThinking(active) {
    const bar = $('ch-think-bar');
    const fill = $('ch-think-fill');
    if (!bar || !fill) return;
    bar.style.opacity = active ? '1' : '0';
    fill.style.animationPlayState = active ? 'running' : 'paused';
    if (!active) fill.style.width = '0';
}

function logMove(detail) {
    if (!detail?.move) return;
    const eng   = window.chessHelperEngine;
    const phase = eng?.getState().phase || '';
    moveLog.unshift({ move: detail.move, book: detail.book, phase, t: Date.now() });
    if (moveLog.length > 12) moveLog.length = 12;
    renderLog();
}

function renderLog() {
    const list = $('ch-log-list');
    if (!list) return;
    if (!moveLog.length) { list.innerHTML = '<span class="ch-log-empty">No moves yet</span>'; return; }
    list.innerHTML = moveLog.slice(0, 6).map((m, i) => `
        <div class="ch-log-row ${i === 0 ? 'latest' : ''}">
            <span class="ch-log-move">${m.move.toUpperCase()}</span>
            ${m.book ? '<span class="ch-log-tag book">book</span>' : ''}
            <span class="ch-log-phase">${m.phase}</span>
        </div>
    `).join('');
}

function syncColor() {
    const b = document.querySelector('wc-chess-board, .board, chess-board');
    if (!b) return;
    const white = !b.classList.contains('flipped');
    const dot   = $('ch-color-dot');
    const txt   = $('ch-color-text');
    if (!dot || !txt) return;
    dot.className = white ? 'white' : 'black';
    txt.textContent = white ? 'White' : 'Black';

    const eng   = window.chessHelperEngine;
    const phase = eng?.getState().phase || '';
    const ptag  = $('ch-phase-tag');
    const stph  = $('st-phase');
    if (ptag) { ptag.textContent = phase; ptag.className = phase; }
    if (stph) stph.textContent = phase ? phase[0].toUpperCase() + phase.slice(1) : '–';
}

function syncStats() {
    const eng = window.chessHelperEngine;
    if (!eng) return;

    const s       = eng.getState();
    const color   = eng.myColor();
    const myEval  = color === 'w' ? s.eval : -s.eval;
    const sign    = myEval > 0.05 ? '+' : '';
    const evalEl  = $('st-eval');
    if (evalEl) {
        evalEl.textContent = isFinite(s.eval) ? sign + myEval.toFixed(1) : '–';
        evalEl.className = 'ch-stat-n' + (myEval > 0.3 ? ' pos' : myEval < -0.3 ? ' neg' : '');
    }

    const movesEl = $('st-moves');
    if (movesEl) movesEl.textContent = s.moves || 0;

    const clockEl = $('st-clock');
    if (clockEl) {
        try {
            const times = [...document.querySelectorAll('.clock-time-monospace, .clock-time')];
            const el    = color === 'w' ? times[times.length - 1] : times[0];
            if (el) clockEl.textContent = el.textContent.trim().replace(/\s/g, '') || '–';
        } catch (_) {}
    }
}

function bindDrag() {
    bubble.addEventListener('mousedown',  dragStart);
    bubble.addEventListener('touchstart', dragStart, { passive: false });
    document.addEventListener('mousemove',  dragMove);
    document.addEventListener('touchmove',  dragMove, { passive: false });
    document.addEventListener('mouseup',  dragEnd);
    document.addEventListener('touchend', dragEnd);
}

function dragStart(e) {
    drag.on = true; drag.moved = false;
    drag.lt = Date.now(); drag.vx = drag.vy = 0;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    drag.ix = cx - drag.ox; drag.iy = cy - drag.oy;
    drag.lx = cx; drag.ly = cy;
}
function dragMove(e) {
    if (!drag.on) return;
    e.preventDefault();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    const dt = Math.max(Date.now() - drag.lt, 1);
    const nx = cx - drag.ix, ny = cy - drag.iy;
    drag.vx = (cx - drag.lx) / dt; drag.vy = (cy - drag.ly) / dt;
    drag.lx = cx; drag.ly = cy; drag.lt = Date.now();
    if (Math.abs(nx - drag.ox) > 3 || Math.abs(ny - drag.oy) > 3) drag.moved = true;
    drag.ox = nx; drag.oy = ny;
    syncBubble();
    if (panel.classList.contains('open')) closePanel();
}
function dragEnd() {
    if (!drag.on) return;
    drag.on = false;
    if (!drag.moved || Math.hypot(drag.vx, drag.vy) < 0.1) { togglePanel(); return; }
    inertia();
}
function inertia() {
    if (drag.on) return;
    drag.vx *= 0.88; drag.vy *= 0.88;
    drag.ox += drag.vx * 16; drag.oy += drag.vy * 16;
    syncBubble();
    if (Math.abs(drag.vx) > 0.05 || Math.abs(drag.vy) > 0.05) requestAnimationFrame(inertia);
}
function syncBubble() {
    const s = 52;
    drag.ox = Math.max(0, Math.min(window.innerWidth  - s, drag.ox));
    drag.oy = Math.max(0, Math.min(window.innerHeight - s, drag.oy));
    bubble.style.transform = `translate3d(${drag.ox}px,${drag.oy}px,0)`;
}

function togglePanel() { panel.classList.contains('open') ? closePanel() : openPanel(); }

function openPanel() {
    positionPanel();
    panel.classList.add('open');
    syncStats();
    renderLog();
}
function closePanel() { panel.classList.remove('open'); }

function positionPanel() {
    const r = bubble.getBoundingClientRect();
    const W = window.innerWidth, H = window.innerHeight;
    const pw = 300, ph = 480, m = 14;
    let left = r.left > W/2 ? r.left - pw - m : r.right + m;
    let top  = r.top  > H/2 ? r.bottom - ph  : r.top;
    left = Math.max(m, Math.min(W - pw - m, left));
    top  = Math.max(m, Math.min(H - ph - m, top));
    const ox = r.left > W/2 ? 'right' : 'left';
    const oy = r.top  > H/2 ? 'bottom' : 'top';
    panel.style.cssText += `left:${left}px;top:${top}px;transform-origin:${ox} ${oy}`;
}

function drawArrow(move) {
    document.querySelectorAll('.ch-hl, .ch-svg').forEach(e => e.remove());
    const b = document.querySelector('wc-chess-board, .board, chess-board');
    if (!b || !move) return;

    const cm     = { a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8 };
    const flip   = b.classList.contains('flipped');
    const center = sq => {
        const col = cm[sq[0]], row = parseInt(sq[1]);
        return flip
            ? { x: (8-col)*12.5+6.25, y: (row-1)*12.5+6.25 }
            : { x: (col-1)*12.5+6.25, y: (8-row)*12.5+6.25 };
    };

    [move.slice(0,2), move.slice(2,4)].forEach((sq, i) => {
        const d = document.createElement('div');
        d.className = `ch-hl square-${cm[sq[0]]}${sq[1]}`;
        d.style.background = i === 0 ? 'rgba(247,192,69,0.45)' : 'rgba(129,182,76,0.5)';
        b.appendChild(d);
    });

    const s = center(move.slice(0,2)), e = center(move.slice(2,4));
    const ns  = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.classList.add('ch-svg');

    const line = document.createElementNS(ns, 'line');
    Object.entries({ x1:s.x, y1:s.y, x2:e.x, y2:e.y }).forEach(([k,v]) => line.setAttribute(k, v));
    line.classList.add('ch-arrow-line');

    const dot = document.createElementNS(ns, 'circle');
    Object.entries({ cx:e.x, cy:e.y, r:'2.5', fill:'#10b981', opacity:'0.92' }).forEach(([k,v]) => dot.setAttribute(k, v));

    svg.append(line, dot);
    b.append(svg);
    setTimeout(() => document.querySelectorAll('.ch-hl, .ch-svg').forEach(e => e.remove()), 4500);
}

function injectStyles() {
    const s = document.createElement('style');
    s.textContent = STYLES;
    document.head.appendChild(s);
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

#ch-root {
    position:fixed;inset:0;pointer-events:none;z-index:99999;
    font-family:'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif;
}

/* Floating bubble orb */
#ch-bubble {
    position:fixed;width:50px;height:50px;
    background:linear-gradient(135deg,#12131a 0%,#1e202b 100%);
    border:1.5px solid rgba(16,185,129,0.25);
    border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    color:#10b981;
    cursor:grab;pointer-events:auto;
    box-shadow:0 8px 32px rgba(0,0,0,0.5);
    animation:pulse-glow 3.5s infinite ease-in-out;
    transition:transform .2s,border-color .2s;
    user-select:none;
}
#ch-bubble:hover {
    border-color:rgba(16,185,129,0.7);
    transform:scale(1.06);
}
#ch-bubble:active { cursor:grabbing; }

@keyframes pulse-glow {
    0% { box-shadow: 0 0 12px rgba(16,185,129,0.15), 0 8px 32px rgba(0,0,0,0.5); }
    50% { box-shadow: 0 0 25px rgba(16,185,129,0.45), 0 8px 32px rgba(0,0,0,0.5); }
    100% { box-shadow: 0 0 12px rgba(16,185,129,0.15), 0 8px 32px rgba(0,0,0,0.5); }
}

/* Premium panel */
#ch-panel {
    position:fixed;width:300px;
    background:#0d0e12;
    border:1px solid rgba(255,255,255,0.06);
    border-radius:20px;
    overflow:hidden;
    pointer-events:none;
    opacity:0;transform:scale(0.93);
    transition:opacity .22s ease,transform .28s cubic-bezier(0.34,1.56,0.64,1);
    box-shadow:0 24px 64px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.03);
}
#ch-panel.open { opacity:1;transform:scale(1);pointer-events:auto; }

#ch-header {
    display:flex;justify-content:space-between;align-items:center;
    padding:18px 18px 14px;
    border-bottom:1px solid rgba(255,255,255,0.04);
}
#ch-brand { display:flex;align-items:center;gap:11px; }
#ch-logo { color:#10b981;display:flex;align-items:center;filter:drop-shadow(0 0 4px rgba(16,185,129,0.2)); }
#ch-title { font-size:16px;font-weight:700;color:#fff;letter-spacing:-.012em; }
#ch-subtitle { font-size:11px;color:#52525b;margin-top:1px;font-weight:500; }
#ch-close {
    background:none;border:none;cursor:pointer;
    color:#4b4b54;font-size:13px;padding:5px 7px;border-radius:8px;
    transition:color .15s,background .15s;
}
#ch-close:hover { color:#fff;background:rgba(255,255,255,0.06); }

#ch-color-strip {
    display:flex;align-items:center;justify-content:space-between;
    padding:11px 18px;
    background:rgba(255,255,255,0.015);
    border-bottom:1px solid rgba(255,255,255,0.04);
}
#ch-color-inner { display:flex;align-items:center;gap:9px; }
#ch-color-dot {
    width:9px;height:9px;border-radius:50%;background:#3f3f46;
    transition:background .3s,box-shadow .3s;
}
#ch-color-dot.white { background:#fff;box-shadow:0 0 8px rgba(255,255,255,0.7); }
#ch-color-dot.black { background:#18181b;border:1px solid #52525b;box-shadow:none; }
#ch-color-text { font-size:12px;font-weight:600;color:#a1a1aa; }
#ch-phase-tag {
    font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
    padding:3px 9px;border-radius:20px;
    background:rgba(255,255,255,0.04);color:#52525b;
    transition:all .3s;
}
#ch-phase-tag.opening    { background:rgba(59,130,246,.12);color:#60a5fa; }
#ch-phase-tag.middlegame { background:rgba(245,158,11,.12);color:#fbbf24; }
#ch-phase-tag.endgame    { background:rgba(139,92,246,.12);color:#a78bfa; }

#ch-stats {
    display:flex;align-items:center;justify-content:space-around;
    padding:16px 14px;
    border-bottom:1px solid rgba(255,255,255,0.04);
}
.ch-stat { display:flex;flex-direction:column;align-items:center;gap:3px;flex:1; }
.ch-stat-n { font-family:'DM Mono',monospace;font-size:15px;font-weight:600;color:#e4e4e7; }
.ch-stat-n.pos { color:#10b981;text-shadow:0 0 8px rgba(16,185,129,0.15); }
.ch-stat-n.neg { color:#ef4444;text-shadow:0 0 8px rgba(239,68,68,0.15); }
.ch-stat-l { font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#44444c; }
.ch-stat-div { width:1px;height:28px;background:rgba(255,255,255,0.05);flex-shrink:0; }

#ch-autoplay-row {
    display:flex;justify-content:space-between;align-items:center;
    padding:13px 18px;
    border-bottom:1px solid rgba(255,255,255,0.04);
}
#ch-ap-left { display:flex;align-items:center;gap:9px; }
#ch-ap-indicator {
    width:7px;height:7px;border-radius:50%;
    background:#3f3f46;transition:background .3s,box-shadow .3s;
}
#ch-ap-indicator.active { background:#10b981;box-shadow:0 0 8px rgba(16,185,129,0.6); }
#ch-ap-label { font-size:13px;font-weight:600;color:#e4e4e7; }
#ch-toggle-wrap { position:relative;display:inline-block;width:40px;height:21px;cursor:pointer; }
#ch-toggle-wrap input { display:none; }
#ch-track {
    position:absolute;inset:0;
    background:rgba(255,255,255,0.07);border-radius:11px;
    transition:background .25s;
}
#ch-toggle-wrap input:checked ~ #ch-track { background:#10b981; }
#ch-thumb {
    position:absolute;top:2.5px;left:3px;
    width:16px;height:16px;border-radius:50%;
    background:#71717a;transition:transform .25s cubic-bezier(.175,.885,.32,1.275),background .25s;
}
#ch-toggle-wrap input:checked ~ #ch-track #ch-thumb { transform:translateX(18px);background:#fff; }

#ch-elo-section {
    padding:16px 18px;
    border-bottom:1px solid rgba(255,255,255,0.04);
}
#ch-elo-top { display:flex;justify-content:space-between;align-items:baseline;margin-bottom:11px; }
#ch-elo-tier { font-size:12px;font-weight:700;color:#a1a1aa; }
#ch-elo-num {
    font-family:'DM Mono',monospace;font-size:14px;font-weight:600;
    color:#10b981;text-shadow:0 0 6px rgba(16,185,129,0.2);
}
#ch-elo-bar-wrap {
    position:relative;height:18px;display:flex;align-items:center;margin-bottom:6px;
}
#ch-elo-bar-fill {
    position:absolute;left:0;top:50%;transform:translateY(-50%);
    height:3px;background:#10b981;border-radius:2px;
    width:60%;transition:width .15s;pointer-events:none;z-index:1;
    box-shadow:0 0 6px rgba(16,185,129,0.3);
}
#ch-elo-range {
    position:relative;width:100%;z-index:2;
    -webkit-appearance:none;appearance:none;
    height:3px;background:rgba(255,255,255,0.1);border-radius:2px;
    outline:none;cursor:pointer;
    background:transparent;
}
#ch-elo-range::-webkit-slider-thumb {
    -webkit-appearance:none;width:14px;height:14px;border-radius:50%;
    background:#10b981;cursor:pointer;
    box-shadow:0 0 0 3px rgba(16,185,129,0.25);
    transition:transform .12s,box-shadow .12s;
}
#ch-elo-range::-webkit-slider-thumb:hover {
    transform:scale(1.2);box-shadow:0 0 0 5px rgba(16,185,129,0.35);
}
#ch-elo-ends { display:flex;justify-content:space-between;font-size:9px;font-weight:600;color:#3f3f46;margin-top:2px; }

#ch-log-section {
    padding:11px 18px 14px;
    border-bottom:1px solid rgba(255,255,255,0.04);
}
#ch-log-header {
    display:flex;justify-content:space-between;align-items:center;
    margin-bottom:10px;
}
#ch-log-header span { font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#44444c;font-weight:700; }
#ch-log-clear {
    font-size:10px;font-weight:600;background:none;border:none;color:#3f3f46;cursor:pointer;
    padding:2px 6px;border-radius:5px;transition:color .15s,background .15s;
}
#ch-log-clear:hover { color:#a1a1aa;background:rgba(255,255,255,0.04); }
#ch-log-list { display:flex;flex-direction:column;gap:4px;min-height:22px; }
.ch-log-empty { font-size:11px;color:#3f3f46;font-style:italic; }
.ch-log-row {
    display:flex;align-items:center;gap:6px;padding:2px 0;
    opacity:.55;transition:opacity .2s;
}
.ch-log-row.latest { opacity:1; }
.ch-log-move { font-family:'DM Mono',monospace;font-size:12px;font-weight:600;color:#e4e4e7; }
.ch-log-tag {
    font-size:9px;font-weight:700;padding:1px 5px;border-radius:4px;text-transform:uppercase;letter-spacing:.04em;
}
.ch-log-tag.book { background:rgba(59,130,246,0.15);color:#60a5fa; }
.ch-log-phase { font-size:10px;color:#44444c;margin-left:auto;font-weight:600; }

#ch-actions {
    display:flex;gap:10px;padding:14px 18px;
}
.ch-action {
    flex:1;padding:10px 0;border-radius:10px;font-family:'DM Sans',sans-serif;
    font-size:12px;font-weight:700;cursor:pointer;
    display:flex;align-items:center;justify-content:center;gap:5px;
    transition:all .18s ease-in-out;border:none;
    background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;
    box-shadow:0 4px 14px rgba(16,185,129,0.3);
}
.ch-action:hover { 
    background:linear-gradient(135deg,#059669 0%,#047857 100%);
    transform:translateY(-1px);
    box-shadow:0 6px 18px rgba(16,185,129,0.45); 
}
.ch-action:disabled { opacity:.4;pointer-events:none; }
.ch-action-outline {
    background:rgba(255,255,255,0.03);color:#a1a1aa;
    box-shadow:none;border:1px solid rgba(255,255,255,0.07);
}
.ch-action-outline:hover { background:rgba(255,255,255,0.08);color:#fff;transform:translateY(-1px);box-shadow:none; }

#ch-think-bar {
    height:2.5px;background:transparent;
    opacity:0;transition:opacity .3s;
    overflow:hidden;
}
#ch-think-fill {
    height:100%;width:0;
    background:linear-gradient(90deg,transparent,#10b981,transparent);
    animation:thinking 1.4s ease-in-out infinite;
    animation-play-state:paused;
}
@keyframes thinking {
    0%   { width:0;margin-left:0; }
    50%  { width:60%;margin-left:20%; }
    100% { width:0;margin-left:100%; }
}

.ch-hl {
    position:absolute;pointer-events:none;z-index:990;opacity:0.75;
    width:12.5%;height:12.5%;
    border-radius:4px;
}
.ch-svg {
    position:absolute;inset:0;width:100%;height:100%;
    pointer-events:none;z-index:1000;
    filter:drop-shadow(0 3px 6px rgba(0,0,0,.35));
}
.ch-arrow-line {
    stroke:#10b981;stroke-width:1.5;
    stroke-dasharray:5 3.5;stroke-linecap:round;
    animation:dash .8s linear infinite;
}
@keyframes dash { to { stroke-dashoffset:-8.5; } }
`;

document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();