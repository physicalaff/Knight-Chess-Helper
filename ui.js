window.chessHelper = { autoPlay: false, debug: false };

const $ = id => document.getElementById(id);

const TIERS = [
    [1000, 'Beginner 👶'],
    [1100, 'Casual 📈'],
    [1200, 'Intermediate 🎓'],
    [1300, 'Club Player ⚔️'],
    [1400, 'Strong Club 🛡️'],
    [1500, 'Advanced 🏆'],
    [1750, 'Master 👑'],
    [2000, 'Grandmaster 🔮'],
    [2300, 'Super GM 🌌'],
    [2500, 'Stockfish Engine 👾']
];

function eloTier(v) {
    let tier = TIERS[0][1];
    for (const [n, label] of TIERS) { if (v >= n) tier = label; }
    return tier;
}

let root, bubble, panel;
let hintTimeout = null;
let lastGreetingTime = 0;
const drag = { on: false, moved: false, ox: 0, oy: 0, ix: 0, iy: 0, vx: 0, vy: 0, lx: 0, ly: 0, lt: 0 };
const moveLog = [];

const TRANSLATIONS = {
    ru: {
        title: "Knight",
        subtitle: "Шахматный Ассистент",
        setup_lang: "Выберите язык / Choose language",
        setup_telemetry: "Помочь развитию проекта?",
        setup_telemetry_sub: "Отправлять анонимную статистику использования?",
        setup_yes: "Да, помочь",
        setup_no: "Нет, спасибо",
        setup_finish: "Готово",
        autoplay: "Авто-игра",
        active: "Активен",
        eval: "Оценка",
        moves: "Ходы",
        clock: "Часы",
        phase: "Стадия",
        last_moves: "Последние ходы",
        clear: "очистить",
        hint: "Подсказка",
        analyzing: "Анализ",
        no_game: "Нет игры",
        not_loaded: "Движок спит",
        reset: "Сброс",
        settings: "Настройки",
        telemetry: "Анонимная телеметрия",
        profile: "Профиль поведения",
        custom_settings: "Ручные настройки",
        blunder_rate: "Частота ошибок",
        mouse_speed: "Скорость мыши",
        think_variance: "Разброс времени",
        antiban: "Анти-бан функции",
        rand_depth: "Рандомизация глубины",
        fatigue: "Имитация усталости",
        distractions: "Случайные отвлечения",
        pondering: "Фоновый расчет",
        misclicks: "Имитация мискликов",
        sf_mode: "Режим Shadow Fiend",
        mute_victory: "Отключить звук победы",
        mute_greeting: "Отключить звук меню",
        mute_sf: "Отключить музыку SF",
        theme: "Темная тема",
        export: "Экспорт JSON",
        import: "Импорт JSON",
        stats: "Статистика",
        winrate: "Победы",
        avg_cpl: "Ср. потеря пешек",
        blunders_game: "Зевки/игра",
        book: "дебют",
        reset_all: "Сбросить всё",
        confirm_reset: "Вы уверены, что хотите полностью сбросить настройки и статистику?",
        bullet_mode: "Режим Пули",
        mode_regular: "Обычный",
        mode_rage: "Рейдж",
        guide_title: "Инструкция и Риски",
        guide_regular: "Безопасный режим. Показывает лучшие ходы стрелками на доске. Автоматически ходы не делает.",
        guide_rage: "Максимальная сила. В сочетании с включенным режимом 'Пуля' клик по кнопке 'Подсказка' мгновенно делает ход за 1-3 сек.",
        guide_warn_title: "Предупреждение",
        guide_warn_text: "Использование авто-игры в рейтинговых матчах может привести к блокировке вашего аккаунта. Играйте осторожно!"
    },
    en: {
        title: "Knight",
        subtitle: "Chess Assistant",
        setup_lang: "Choose language",
        setup_telemetry: "Help improve the project?",
        setup_telemetry_sub: "Send completely anonymous usage statistics?",
        setup_yes: "Yes, help",
        setup_no: "No, thanks",
        setup_finish: "Finish",
        autoplay: "Auto-play",
        active: "Active",
        eval: "Eval",
        moves: "Moves",
        clock: "Clock",
        phase: "Phase",
        last_moves: "Last moves",
        clear: "clear",
        hint: "Show hint",
        analyzing: "Analyzing",
        no_game: "No game",
        not_loaded: "Engine asleep",
        reset: "Reset",
        settings: "Settings",
        telemetry: "Anonymous Telemetry",
        profile: "Human Profile",
        custom_settings: "Custom Controls",
        blunder_rate: "Blunder Rate",
        mouse_speed: "Mouse Speed",
        think_variance: "Think Variance",
        antiban: "Anti-Ban Features",
        rand_depth: "Randomize Depth",
        fatigue: "Fatigue Emulation",
        distractions: "Random Distractions",
        pondering: "Pondering (Background)",
        misclicks: "Simulate Misclicks",
        sf_mode: "Shadow Fiend Mode",
        mute_victory: "Mute Victory Sound",
        mute_greeting: "Mute Greeting Sound",
        mute_sf: "Mute SF Theme Music",
        theme: "Dark Theme",
        export: "Export JSON",
        import: "Import JSON",
        stats: "Statistics",
        winrate: "Winrate",
        avg_cpl: "Avg. Centipawn Loss",
        blunders_game: "Blunders/Game",
        book: "book",
        reset_all: "Reset All",
        confirm_reset: "Are you sure you want to completely reset settings and stats?",
        bullet_mode: "Bullet Mode",
        mode_regular: "Regular",
        mode_rage: "Rage",
        guide_title: "Guide & Risks",
        guide_regular: "Safe mode. Displays best moves via arrows on board. Does not make moves automatically.",
        guide_rage: "Maximum power. Combined with 'Bullet Mode', clicking the 'Show hint' button instantly plays the move in 1-3s.",
        guide_warn_title: "Warning",
        guide_warn_text: "Abusing automated play in rated matches can lead to account bans. Play responsibly!"
    }
};

let appConfig = {
    lang: null,
    telemetryEnabled: null,
    preset: 'positional',
    elo: 1300,
    blunders: 0.04,
    mouseSpeed: 1.0,
    thinkVariance: 1.0,
    randDepthEnabled: true,
    fatigueEnabled: true,
    distractionsEnabled: true,
    ponderingEnabled: true,
    misclicksEnabled: true,
    sfMode: false,
    muteVictorySound: false,
    muteGreetingSound: false,
    muteSfMusic: false,
    darkTheme: true,
    wins: 0,
    games: 0,
    gameHistory: [],
    rageMode: false,
    bulletMode: false
};

function t(key) {
    const l = appConfig.lang || 'en';
    return TRANSLATIONS[l][key] || key;
}

async function init() {
    try {
        $('ch-root')?.remove();

        const stored = await chrome.storage.local.get(['appConfig']);
        if (stored.appConfig) {
            appConfig = { ...appConfig, ...stored.appConfig };
        }

        if (typeof appConfig.elo !== 'number' || isNaN(appConfig.elo)) {
            appConfig.elo = 1300;
        }
        if (typeof appConfig.blunders !== 'number' || isNaN(appConfig.blunders)) {
            appConfig.blunders = 0.04;
        }
        if (typeof appConfig.mouseSpeed !== 'number' || isNaN(appConfig.mouseSpeed)) {
            appConfig.mouseSpeed = 1.0;
        }
        if (typeof appConfig.thinkVariance !== 'number' || isNaN(appConfig.thinkVariance)) {
            appConfig.thinkVariance = 1.0;
        }
        if (typeof appConfig.games !== 'number' || isNaN(appConfig.games)) {
            appConfig.games = 0;
        }
        if (typeof appConfig.wins !== 'number' || isNaN(appConfig.wins)) {
            appConfig.wins = 0;
        }

        root = el('div', { id: 'ch-root' });
        if (!appConfig.darkTheme) root.classList.add('light-theme');
        if (appConfig.sfMode && appConfig.rageMode) root.classList.add('sf-theme');
        if (appConfig.rageMode) root.classList.add('rage-active');

        bubble = el('div', { id: 'ch-bubble' });
        bubble.innerHTML = svgKnight();
        drag.ox = window.innerWidth - 76;
        drag.oy = 100;
        syncBubble();

        panel = el('div', { id: 'ch-panel' });
        
        if (!appConfig.lang) {
            panel.innerHTML = setupHTML();
        } else {
            panel.innerHTML = panelHTML();
        }

        root.append(bubble, panel);
        document.body.appendChild(root);

        injectStyles();
        bindDrag();
        
        if (!appConfig.lang) {
            bindSetupEvents();
        } else {
            bindEvents();
            syncColor();
            applyConfigToEngine();
            syncModeUI();
        }

        setInterval(syncColor,  1800);
        setInterval(syncStats,  2200);

        window.addEventListener('ch:thinking', e => onThinking(e.detail));
        window.addEventListener('ch:move',     e => logMove(e.detail));
        window.addEventListener('ch:gameover', e => onGameOverDetected(e.detail));
        window.addEventListener('ch:opening', e => {
            const { eco, name } = e.detail;
            const card = $('ch-opening-card');
            const ecoEl = $('ch-opening-eco');
            const nameEl = $('ch-opening-name');
            if (card && ecoEl && nameEl) {
                ecoEl.textContent = eco || 'ECO';
                nameEl.textContent = name || '';
                card.classList.remove('hidden');
            }
        });
        window.addEventListener('ch:reset', () => {
            moveLog.length = 0;
            renderLog();
            const moves = $('st-moves');
            if (moves) moves.textContent = '0';
            const ev = $('st-eval');
            if (ev) {
                ev.textContent = '–';
                ev.className = 'ch-stat-n';
            }
            $('ch-opening-card')?.classList.add('hidden');
            
            const fill = $('ch-eval-bar-fill');
            if (fill) {
                fill.style.width = '50%';
                fill.style.background = 'var(--text-muted)';
                fill.style.boxShadow = '0 0 8px var(--border)';
            }
            const text = $('ch-eval-bar-text');
            if (text) text.textContent = '0.0';
        });

        document.addEventListener('visibilitychange', () => {
            if (appConfig.sfMode && appConfig.rageMode && !appConfig.muteSfMusic) {
                chrome.runtime.sendMessage({
                    target: 'background',
                    type: 'SET_VISIBILITY',
                    visible: !document.hidden
                });
            }
        });
    } catch (e) {
        console.error('[ch:ui] Init error caught: ', e);
    }
}

function el(tag, attrs = {}, text = '') {
    const e = document.createElement(tag);
    Object.assign(e, attrs);
    if (text) e.textContent = text;
    return e;
}

function svgKnight() {
    const logoFilename = (appConfig.sfMode && appConfig.rageMode) ? 'sf.gif' : 'Knight.png';
    return `<img src="${chrome.runtime.getURL(`assets/${logoFilename}`)}" style="width:32px;height:32px;pointer-events:none;object-fit:contain;" draggable="false"/>`;
}

function setupHTML() {
    const enFlagUrl = chrome.runtime.getURL('assets/uk-flag.png');
    const ruFlagUrl = chrome.runtime.getURL('assets/ru-flag.png');

    return `
<div class="setup-container active" id="setup-step-1">
    <div class="setup-header">
        <span class="setup-logo">${svgKnight()}</span>
        <h3>Knight Chess Helper</h3>
    </div>
    <p class="setup-title">${TRANSLATIONS.en.setup_lang} / ${TRANSLATIONS.ru.setup_lang}</p>
    <div class="setup-options">
        <button class="setup-btn" id="lang-en" style="display:flex;align-items:center;justify-content:center;gap:10px;">
            <img src="${enFlagUrl}" style="width:24px;height:16px;object-fit:cover;border-radius:2px;" /> English
        </button>
        <button class="setup-btn" id="lang-ru" style="display:flex;align-items:center;justify-content:center;gap:10px;">
            <img src="${ruFlagUrl}" style="width:24px;height:16px;object-fit:cover;border-radius:2px;" /> Русский
        </button>
    </div>
</div>

<div class="setup-container" id="setup-step-2">
    <div class="setup-header">
        <h3>${TRANSLATIONS.en.telemetry}</h3>
    </div>
    <p class="setup-title-sub" id="telemetry-sub">${TRANSLATIONS.en.setup_telemetry_sub}</p>
    <div class="setup-options">
        <button class="setup-btn setup-btn-primary" id="telemetry-yes">${TRANSLATIONS.en.setup_yes}</button>
        <button class="setup-btn" id="telemetry-no">${TRANSLATIONS.en.setup_no}</button>
    </div>
</div>
    `.trim();
}

function panelHTML() {
    const gearIconUrl = chrome.runtime.getURL('assets/gear.png');
    const githubIconUrl = chrome.runtime.getURL('assets/github.png');
    
    const isSfActive = appConfig.sfMode && appConfig.rageMode;
    const gifFilename = isSfActive ? 'sf.gif' : (appConfig.lang === 'ru' ? 'ru.gif' : 'uk.gif');
    const gifUrl = chrome.runtime.getURL(`assets/${gifFilename}`);

    return `
<div id="ch-main-view">
    <div id="ch-header">
        <div id="ch-brand">
            <span id="ch-logo">${svgKnight()}</span>
            <div>
                <div id="ch-title">${t('title')}</div>
                <div id="ch-subtitle">${t('subtitle')}</div>
            </div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
            <button id="ch-settings-btn" aria-label="Settings" style="background:none;border:none;cursor:pointer;display:flex;align-items:center;">
                <img src="${gearIconUrl}" style="width:16px;height:16px;display:block;pointer-events:none;" />
            </button>
            <button id="ch-close" aria-label="Close">✕</button>
        </div>
    </div>

    <div id="ch-mode-tabs">
        <button class="ch-mode-tab${!appConfig.rageMode ? ' active' : ''}" id="tab-mode-regular">${t('mode_regular')}</button>
        <button class="ch-mode-tab${appConfig.rageMode ? ' active' : ''}" id="tab-mode-rage">${t('mode_rage')}</button>
        <button class="ch-mode-tab" id="tab-mode-analysis">${appConfig.lang === 'ru' ? 'Анализ' : 'Analysis'}</button>
    </div>

    <div id="ch-color-strip">
        <div id="ch-color-inner">
            <span id="ch-color-dot"></span>
            <span id="ch-color-text">–</span>
        </div>
        <span id="ch-phase-tag">–</span>
    </div>

    <div id="ch-opening-card" class="control-card hidden" style="margin: 8px 18px 4px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; background: rgba(0, 0, 0, 0.25);">
        <span id="ch-opening-eco" style="font-size: 10px; font-weight: 800; background: var(--border-glow); color: #fff; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">A00</span>
        <span id="ch-opening-name" style="font-size: 11px; font-weight: 600; color: var(--text-sub); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Starting Position</span>
    </div>

    <div id="ch-eval-bar-wrapper" class="control-card" style="margin: 8px 18px 4px; padding: 10px 14px; display: flex; flex-direction: column; gap: 6px; background: rgba(0,0,0,0.25); position: relative; overflow: hidden;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted);">${appConfig.lang === 'ru' ? 'СИЛА ПОЗИЦИИ' : 'POSITION STRENGTH'}</span>
            <span id="ch-eval-bar-text" style="font-size: 11px; font-weight: 700; color: var(--text-sub);">0.0</span>
        </div>
        <div id="ch-eval-bar-track" style="width: 100%; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; position: relative;">
            <div id="ch-eval-bar-fill" style="width: 50%; height: 100%; background: var(--text-muted); border-radius: 3px; transition: width 0.4s cubic-bezier(0.25, 1, 0.5, 1), background 0.4s ease; box-shadow: 0 0 10px var(--border-glow);"></div>
        </div>
    </div>

    <div id="ch-avatar-section">
        <img src="${gifUrl}" id="ch-avatar-gif" draggable="false" />
    </div>

    <div id="ch-normal-controls">
        <div id="ch-stats">
            <div class="ch-stat">
                <span class="ch-stat-n" id="st-eval">–</span>
                <span class="ch-stat-l">${t('eval')}</span>
            </div>
            <div class="ch-stat-div"></div>
            <div class="ch-stat">
                <span class="ch-stat-n" id="st-moves">0</span>
                <span class="ch-stat-l">${t('moves')}</span>
            </div>
            <div class="ch-stat-div"></div>
            <div class="ch-stat">
                <span class="ch-stat-n" id="st-clock">–</span>
                <span class="ch-stat-l">${t('clock')}</span>
            </div>
            <div class="ch-stat-div"></div>
            <div class="ch-stat">
                <span class="ch-stat-n" id="st-phase">–</span>
                <span class="ch-stat-l">${t('phase')}</span>
            </div>
        </div>

        <div class="control-card">
            <div id="ch-autoplay-row">
                <div id="ch-ap-left">
                    <div id="ch-ap-indicator"></div>
                    <span id="ch-ap-label">${t('autoplay')}</span>
                </div>
                <label id="ch-toggle-wrap">
                    <input type="checkbox" id="ch-autoplay">
                    <span id="ch-track"><span id="ch-thumb"></span></span>
                </label>
            </div>

            <div id="ch-bullet-row" class="hidden">
                <div id="ch-bullet-left">
                    <div id="ch-bullet-indicator"></div>
                    <span id="ch-bullet-label">${t('bullet_mode')}</span>
                </div>
                <label id="ch-bullet-toggle-wrap">
                    <input type="checkbox" id="ch-bullet-toggle">
                    <span id="ch-bullet-track"><span id="ch-bullet-thumb"></span></span>
                </label>
            </div>
        </div>

        <div id="ch-elo-section">
            <div id="ch-elo-top">
                <span id="ch-elo-tier">Club Player</span>
                <span id="ch-elo-num">${appConfig.elo}</span>
            </div>
            <div id="ch-elo-bar-wrap">
                <div id="ch-elo-bar-fill"></div>
                <input type="range" id="ch-elo-range" min="1000" max="${appConfig.rageMode ? 2500 : 1500}" step="50" value="${appConfig.elo}">
            </div>
        </div>

        <div id="ch-log-section">
            <div id="ch-log-header">
                <span>${t('last_moves')}</span>
                <button id="ch-log-clear">${t('clear')}</button>
            </div>
            <div id="ch-log-list"></div>
        </div>

        <div id="ch-actions">
            <button class="ch-action" id="ch-hint-btn">
                <span id="ch-hint-icon">⬡</span>
                <span id="ch-hint-text">${t('hint')}</span>
            </button>
            <button class="ch-action ch-action-outline" id="ch-reset-btn">
                <span>↺ ${t('reset')}</span>
            </button>
        </div>

        <div id="ch-history-section">
            <div id="ch-history-header">
                <span>📊 ${appConfig.lang === 'ru' ? 'История игр' : 'Match History'}</span>
            </div>
            <div id="ch-history-list"></div>
        </div>

        <div id="ch-guide-accordion">
            <button id="ch-guide-toggle">
                <span>📖 ${t('guide_title')}</span>
                <span id="ch-guide-arrow">▼</span>
            </button>
            <div id="ch-guide-content" class="hidden">
                <p><strong>🟢 ${t('mode_regular')}:</strong> ${t('guide_regular')}</p>
                <p><strong>🔴 ${t('mode_rage')}:</strong> ${t('guide_rage')}</p>
                <p class="warning-text"><strong>⚠️ ${t('guide_warn_title')}:</strong> ${t('guide_warn_text')}</p>
            </div>
        </div>
    </div>

    <div id="ch-analysis-panel" class="hidden" style="padding:12px 18px;">
        <p class="ch-analysis-promo">${appConfig.lang === 'ru' ? 'Бесплатный глубокий анализ партии Chess.com!' : 'Free deep match analysis for Chess.com!'}</p>
        
        <button class="ch-action" id="ch-start-analysis-btn" style="margin-bottom:12px;width:100%;">
            <span>📊 ${appConfig.lang === 'ru' ? 'Запустить Анализ' : 'Start Analysis'}</span>
        </button>
        
        <div id="ch-analysis-progress" class="hidden" style="margin-bottom:12px;display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;">
            <div id="ch-analysis-progress-bar-wrap" style="width:100%;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
                <div id="ch-analysis-progress-bar-fill" style="width:0%;height:100%;background:var(--border-glow);transition:width 0.15s ease;"></div>
            </div>
            <span id="ch-analysis-progress-text" style="font-size:11px;color:var(--text-sub);font-weight:600;">Анализируем...</span>
        </div>

        <div id="ch-analysis-results" class="hidden">
            <div id="ch-analysis-accuracy-cards" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
                <div class="ch-analysis-acc-card white" style="background:rgba(0,0,0,0.3);border:1px solid var(--border);border-left:4px solid #fff;border-radius:12px;padding:8px 10px;display:flex;flex-direction:column;align-items:center;gap:2px;">
                    <span class="ch-acc-label" style="font-size:8px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">White Acc</span>
                    <span class="ch-acc-val" id="ch-acc-white" style="font-family:'Plus Jakarta Sans',sans-serif;font-size:18px;font-weight:800;color:var(--text);">-%</span>
                </div>
                <div class="ch-analysis-acc-card black" style="background:rgba(0,0,0,0.3);border:1px solid var(--border);border-left:4px solid #60a5fa;border-radius:12px;padding:8px 10px;display:flex;flex-direction:column;align-items:center;gap:2px;">
                    <span class="ch-acc-label" style="font-size:8px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Black Acc</span>
                    <span class="ch-acc-val" id="ch-acc-black" style="font-family:'Plus Jakarta Sans',sans-serif;font-size:18px;font-weight:800;color:var(--text);">-%</span>
                </div>
            </div>
            
            <div class="ch-analysis-counters-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;background:rgba(0,0,0,0.2);border:1px solid var(--border);border-radius:14px;padding:10px;margin-bottom:12px;">
                <div class="counter-col" style="display:flex;flex-direction:column;gap:4px;">
                    <span class="counter-header-tag w" style="font-size:10px;font-weight:800;text-align:center;text-transform:uppercase;color:#fff;border-bottom:1px solid var(--border);margin-bottom:4px;padding-bottom:2px;">White</span>
                    <div class="counter-row brilliant" style="display:flex;justify-content:space-between;font-size:10px;color:#60a5fa;"><span class="badge" style="font-weight:700;">Brilliant</span><strong id="cnt-w-brilliant">0</strong></div>
                    <div class="counter-row best" style="display:flex;justify-content:space-between;font-size:10px;color:#10b981;"><span class="badge" style="font-weight:700;">Best</span><strong id="cnt-w-best">0</strong></div>
                    <div class="counter-row excellent" style="display:flex;justify-content:space-between;font-size:10px;color:#34d399;"><span class="badge" style="font-weight:700;">Excellent</span><strong id="cnt-w-excellent">0</strong></div>
                    <div class="counter-row good" style="display:flex;justify-content:space-between;font-size:10px;color:#9ca3af;"><span class="badge" style="font-weight:700;">Good</span><strong id="cnt-w-good">0</strong></div>
                    <div class="counter-row inaccuracy" style="display:flex;justify-content:space-between;font-size:10px;color:#fbbf24;"><span class="badge" style="font-weight:700;">Inaccuracy</span><strong id="cnt-w-inaccuracy">0</strong></div>
                    <div class="counter-row mistake" style="display:flex;justify-content:space-between;font-size:10px;color:#fb923c;"><span class="badge" style="font-weight:700;">Mistake</span><strong id="cnt-w-mistake">0</strong></div>
                    <div class="counter-row blunder" style="display:flex;justify-content:space-between;font-size:10px;color:#f87171;"><span class="badge" style="font-weight:700;">Blunder</span><strong id="cnt-w-blunder">0</strong></div>
                </div>
                <div class="counter-col" style="display:flex;flex-direction:column;gap:4px;">
                    <span class="counter-header-tag b" style="font-size:10px;font-weight:800;text-align:center;text-transform:uppercase;color:#60a5fa;border-bottom:1px solid var(--border);margin-bottom:4px;padding-bottom:2px;">Black</span>
                    <div class="counter-row brilliant" style="display:flex;justify-content:space-between;font-size:10px;color:#60a5fa;"><span class="badge" style="font-weight:700;">Brilliant</span><strong id="cnt-b-brilliant">0</strong></div>
                    <div class="counter-row best" style="display:flex;justify-content:space-between;font-size:10px;color:#10b981;"><span class="badge" style="font-weight:700;">Best</span><strong id="cnt-b-best">0</strong></div>
                    <div class="counter-row excellent" style="display:flex;justify-content:space-between;font-size:10px;color:#34d399;"><span class="badge" style="font-weight:700;">Excellent</span><strong id="cnt-b-excellent">0</strong></div>
                    <div class="counter-row good" style="display:flex;justify-content:space-between;font-size:10px;color:#9ca3af;"><span class="badge" style="font-weight:700;">Good</span><strong id="cnt-b-good">0</strong></div>
                    <div class="counter-row inaccuracy" style="display:flex;justify-content:space-between;font-size:10px;color:#fbbf24;"><span class="badge" style="font-weight:700;">Inaccuracy</span><strong id="cnt-b-inaccuracy">0</strong></div>
                    <div class="counter-row mistake" style="display:flex;justify-content:space-between;font-size:10px;color:#fb923c;"><span class="badge" style="font-weight:700;">Mistake</span><strong id="cnt-b-mistake">0</strong></div>
                    <div class="counter-row blunder" style="display:flex;justify-content:space-between;font-size:10px;color:#f87171;"><span class="badge" style="font-weight:700;">Blunder</span><strong id="cnt-b-blunder">0</strong></div>
                </div>
            </div>

            <div id="ch-analysis-moves-header" style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);font-weight:800;margin-bottom:6px;">
                <span>${appConfig.lang === 'ru' ? 'Ходы и Оценки' : 'Moves & Eval'}</span>
            </div>
            <div id="ch-analysis-moves-list" style="display:flex;flex-direction:column;gap:5px;max-height:160px;overflow-y:auto;padding-right:4px;"></div>
        </div>
    </div>

    <div id="ch-footer">
        <a href="https://github.com/physicalaff/Knight-Chess-Helper" target="_blank" id="ch-github-link">
            <img src="${githubIconUrl}" id="ch-github-icon" />
            <span>physicalaff/Knight-Chess-Helper</span>
        </a>
    </div>
</div>

<div id="ch-settings-view" class="hidden">
    <div id="ch-header">
        <div id="ch-brand">
            <span id="ch-logo" style="display:flex;align-items:center;">
                <img src="${gearIconUrl}" style="width:16px;height:16px;display:block;" />
            </span>
            <div>
                <div id="ch-title" style="margin-left:8px;">${t('settings')}</div>
            </div>
        </div>
        <button id="ch-settings-back" aria-label="Back">✕</button>
    </div>

    <div class="settings-scroll-box">
        <!-- Выпадающий список выбора языка -->
        <div class="settings-group">
            <label class="settings-label">Language / Язык</label>
            <select id="set-lang" class="settings-select">
                <option value="en">🇬🇧 English</option>
                <option value="ru">🇷🇺 Русский</option>
            </select>
        </div>

        <div class="settings-group">
            <label class="settings-label">${t('profile')}</label>
            <select id="set-preset" class="settings-select">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="aggressive">Aggressive</option>
                <option value="positional">Positional</option>
                <option value="custom">Custom</option>
            </select>
        </div>

        <div id="custom-sliders" class="hidden">
            <div class="settings-group">
                <div class="slider-header">
                    <span>${t('blunder_rate')}</span>
                    <span id="val-blunders">4%</span>
                </div>
                <input type="range" id="slider-blunders" min="0" max="30" step="1" value="4">
            </div>
            <div class="settings-group">
                <div class="slider-header">
                    <span>${t('mouse_speed')}</span>
                    <span id="val-speed">1.0x</span>
                </div>
                <input type="range" id="slider-speed" min="5" max="25" step="1" value="10">
            </div>
            <div class="settings-group">
                <div class="slider-header">
                    <span>${t('think_variance')}</span>
                    <span id="val-variance">1.0x</span>
                </div>
                <input type="range" id="slider-variance" min="2" max="20" step="1" value="10">
            </div>
        </div>

        <div class="settings-group">
            <label class="settings-label">${t('antiban')}</label>
            <label class="switch-row">
                <span>${t('rand_depth')}</span>
                <input type="checkbox" id="set-rand-depth">
            </label>
            <label class="switch-row">
                <span>${t('fatigue')}</span>
                <input type="checkbox" id="set-fatigue">
            </label>
            <label class="switch-row">
                <span>${t('distractions')}</span>
                <input type="checkbox" id="set-distractions">
            </label>
            <label class="switch-row">
                <span>${t('pondering')}</span>
                <input type="checkbox" id="set-pondering">
            </label>
            <label class="switch-row">
                <span>${t('misclicks')}</span>
                <input type="checkbox" id="set-misclicks">
            </label>
        </div>

        <div class="settings-group">
            <label class="settings-label">${t('stats')}</label>
            <div class="stats-grid">
                <div><span>${t('winrate')}:</span> <strong id="stat-winrate">0%</strong></div>
                <div><span>${t('moves')}:</span> <strong id="stat-games">0</strong></div>
            </div>
        </div>

        <div class="settings-group">
            <label class="switch-row">
                <span>${t('sf_mode')}</span>
                <input type="checkbox" id="set-sf-mode">
            </label>
            <label class="switch-row">
                <span>${t('mute_sf')}</span>
                <input type="checkbox" id="set-mute-sf">
            </label>
            <label class="switch-row">
                <span>${t('mute_victory')}</span>
                <input type="checkbox" id="set-mute-victory">
            </label>
            <label class="switch-row">
                <span>${t('mute_greeting')}</span>
                <input type="checkbox" id="set-mute-greeting">
            </label>
            <label class="switch-row">
                <span>${t('telemetry')}</span>
                <input type="checkbox" id="set-telemetry">
            </label>
            <label class="switch-row">
                <span>${t('theme')}</span>
                <input type="checkbox" id="set-theme">
            </label>
        </div>

        <div class="settings-buttons">
            <button class="settings-btn" id="btn-export">${t('export')}</button>
            <button class="settings-btn" id="btn-import">${t('import')}</button>
            <button class="settings-btn settings-btn-danger" id="btn-reset-all">${t('reset_all')}</button>
        </div>
    </div>
</div>

<div id="ch-think-bar">
    <div id="ch-think-fill"></div>
</div>
    `.trim();
}

function switchTab(mode) {
    const tabs = document.querySelectorAll('.ch-mode-tab');
    tabs.forEach(t => t.classList.remove('active'));

    const normal = $('ch-normal-controls');
    const analysis = $('ch-analysis-panel');

    if (mode === 'analysis') {
        $('tab-mode-analysis').classList.add('active');
        normal.classList.add('hidden');
        analysis.classList.remove('hidden');
    } else {
        $(`tab-mode-${mode}`).classList.add('active');
        normal.classList.remove('hidden');
        analysis.classList.add('hidden');
    }
}

function playSound(filename) {
    chrome.runtime.sendMessage({
        target: 'background',
        type: 'PLAY_SOUND',
        sound: filename
    });
}

function playGreetingSound() {
    if (appConfig.muteGreetingSound) {
        return; 
    }
    const now = Date.now();
    if (now - lastGreetingTime < 8000) {
        return; 
    }
    lastGreetingTime = now;

    const isRussian = appConfig.lang === 'ru';
    const pool = isRussian 
        ? [1, 3, 5, 7, 9, 11, 13] 
        : [2, 4, 6, 8, 10, 12, 14];
    
    const randomId = pool[Math.floor(Math.random() * pool.length)];
    playSound(`${randomId}.mp3`);
}

async function selectTelemetry(enabled) {
    appConfig.telemetryEnabled = enabled;
    await chrome.storage.local.set({ appConfig });
    
    panel.classList.remove('open');
    setTimeout(() => {
        panel.innerHTML = panelHTML();
        bindEvents();
        syncColor();
        applyConfigToEngine();
        syncModeUI();
        panel.classList.add('open');
        playGreetingSound(); 
    }, 300);
}

async function saveSettings() {
    await chrome.storage.local.set({ appConfig });
    applyConfigToEngine();
}

function applyConfigToEngine() {
    const mSpeed = appConfig.mouseSpeed;
    if (window.chessHelperMouse) {
        window.chessHelperMouse.speed = mSpeed;
        window.chessHelperMouse.bulletMode = appConfig.bulletMode;
    }
    window.chessHelperEngine?.updateConfig({
        preset: appConfig.preset,
        blunders: appConfig.blunders,
        mouseSpeed: mSpeed,
        thinkVariance: appConfig.thinkVariance,
        randDepthEnabled: appConfig.randDepthEnabled,
        fatigueEnabled: appConfig.fatigueEnabled,
        distractionsEnabled: appConfig.distractionsEnabled,
        ponderingEnabled: appConfig.ponderingEnabled,
        misclicksEnabled: appConfig.misclicksEnabled,
        bulletMode: appConfig.bulletMode
    });
}

function switchView(fromId, toId) {
    const from = $(fromId);
    const to = $(toId);
    from.style.opacity = '0';
    from.style.transform = 'translateY(-10px)';
    setTimeout(() => {
        from.classList.add('hidden');
        to.classList.remove('hidden');
        to.style.opacity = '0';
        to.style.transform = 'translateY(10px)';
        setTimeout(() => {
            to.style.opacity = '1';
            to.style.transform = 'translateY(0)';
        }, 50);
    }, 200);
}

function bindEvents() {
    $('ch-close').onclick = closePanel;
    $('ch-settings-btn').onclick = () => {
        switchView('ch-main-view', 'ch-settings-view');
        loadSettingsView();
    };
    $('ch-settings-back').onclick = () => {
        switchView('ch-settings-view', 'ch-main-view');
    };

    $('tab-mode-regular').onclick = () => {
        appConfig.rageMode = false;
        switchTab('regular');
    };
    $('tab-mode-rage').onclick = () => {
        appConfig.rageMode = true;
        switchTab('rage');
    };
    
    const tabAnEl = $('tab-mode-analysis');
    if (tabAnEl) {
        tabAnEl.onclick = () => {
            switchTab('analysis');
        };
    }

    $('ch-guide-toggle').onclick = () => {
        const content = $('ch-guide-content');
        const arrow = $('ch-guide-arrow');
        if (content && arrow) {
            const isHidden = content.classList.contains('hidden');
            content.classList.toggle('hidden', !isHidden);
            arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    };

    const autoplay = $('ch-autoplay');
    autoplay.addEventListener('change', () => {
        window.chessHelper.autoPlay = autoplay.checked;
        $('ch-ap-indicator').classList.toggle('active', autoplay.checked);
        $('ch-ap-label').textContent = autoplay.checked ? t('active') : t('autoplay');
        if (autoplay.checked) window.chessHelperEngine?.trigger();
    });

    const bulletToggle = $('ch-bullet-toggle');
    bulletToggle.addEventListener('change', () => {
        appConfig.bulletMode = bulletToggle.checked;
        $('ch-bullet-indicator').classList.toggle('active', bulletToggle.checked);
        $('ch-bullet-label').textContent = bulletToggle.checked ? t('active') : t('bullet_mode');
        if (window.chessHelperMouse) {
            window.chessHelperMouse.bulletMode = bulletToggle.checked;
        }
        saveSettings();
    });

    const range  = $('ch-elo-range');
    const eloNum = $('ch-elo-num');
    const fill   = $('ch-elo-bar-fill');

    function syncElo(save = false) {
        let v   = parseInt(range.value);
        if (isNaN(v)) v = 1300;
        
        const minVal = parseInt(range.min) || 1000;
        const maxVal = parseInt(range.max) || 1500;
        const pct = ((v - minVal) / (maxVal - minVal)) * 100;
        
        eloNum.textContent     = v;
        $('ch-elo-tier').textContent  = eloTier(v);
        fill.style.width       = `${pct}%`;
        appConfig.elo = v;
        if (save) saveSettings();
        window.chessHelperEngine?.setElo(v);
    }
    range.addEventListener('input', () => syncElo(true));
    syncElo(false);

    $('ch-hint-btn').onclick = async () => {
        const eng = window.chessHelperEngine;
        const icon = $('ch-hint-icon'), txt = $('ch-hint-text');
        
        if (!eng) {
            txt.textContent = t('not_loaded');
            icon.textContent = '⚠';
            return;
        }

        icon.textContent = '…'; 
        txt.textContent = t('analyzing');
        $('ch-hint-btn').disabled = true;
        
        const fen  = eng.getFEN();
        const move = fen ? await eng.hint(fen) : null;
        
        $('ch-hint-btn').disabled = false;
        
        if (move) {
            if (appConfig.rageMode && appConfig.bulletMode) {
                window.chessHelperEngine?.playInstant(move);
                txt.textContent = `${t('hint')}: ${move.toUpperCase()}`;
                icon.textContent = '✓';
            } else {
                drawArrow(move);
                txt.textContent = `${t('hint')}: ${move.toUpperCase()}`;
                icon.textContent = '✓';
            }
        } else {
            txt.textContent = t('no_game');
            icon.textContent = '⚠';
        }
        
        if (hintTimeout) clearTimeout(hintTimeout);
        hintTimeout = setTimeout(() => { 
            icon.textContent = '⬡'; 
            txt.textContent = t('hint'); 
        }, 2500);
    };

    $('ch-reset-btn').onclick = () => {
        window.chessHelperEngine?.reset();
        moveLog.length = 0;
        renderLog();
        $('st-moves').textContent = '0';
        $('st-eval').textContent  = '–';
        $('ch-opening-card')?.classList.add('hidden');
        
        const fill = $('ch-eval-bar-fill');
        if (fill) {
            fill.style.width = '50%';
            fill.style.background = 'var(--text-muted)';
            fill.style.boxShadow = '0 0 8px var(--border)';
        }
        const text = $('ch-eval-bar-text');
        if (text) text.textContent = '0.0';
    };

    $('ch-log-clear').onclick = () => { moveLog.length = 0; renderLog(); };

    // Клик на запуск Глубокого Анализа партии
    const startAnalysisBtn = $('ch-start-analysis-btn');
    if (startAnalysisBtn) {
            startAnalysisBtn.onclick = async () => {
                let fens = null;
                try {
                    fens = window.chessHelperEngine?.getFensFromController?.();
                } catch (_) {}
                
                if (!fens || fens.length < 2) {
                    const stored = await chrome.storage.local.get(['gameFens']);
                    fens = stored.gameFens || window.chessHelperGameFENs || [];
                }

                if (!fens || fens.length < 2) {
                    alert(appConfig.lang === 'ru' 
                        ? 'Нет сохраненных ходов для этой партии. Сыграйте сначала хотя бы несколько ходов или откройте игру с историей ходов!' 
                        : 'No moves recorded for this match. Play at least a few moves first or open a game with moves history!');
                    return;
                }

            startAnalysisBtn.classList.add('hidden');
            $('ch-analysis-progress').classList.remove('hidden');
            $('ch-analysis-results').classList.add('hidden');

            const movesAnalysis = [];
            let whiteCPLSum = 0;
            let whiteMovesCount = 0;
            let blackCPLSum = 0;
            let blackMovesCount = 0;

            const counters = {
                w: { brilliant: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
                b: { brilliant: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
            };

            const total = fens.length;
            let prevEval = 0.3; // Стандартное начало

            for (let i = 0; i < total; i++) {
                const pct = Math.round((i / total) * 100);
                $('ch-analysis-progress-bar-fill').style.width = `${pct}%`;
                $('ch-analysis-progress-text').textContent = appConfig.lang === 'ru' 
                    ? `Анализ хода ${i + 1} из ${total}...` 
                    : `Analyzing move ${i + 1} of ${total}...`;

                const fen = fens[i];
                const parsed = fen.split(' ');
                const activeCol = parsed[1];
                const prevActiveCol = activeCol === 'w' ? 'b' : 'w';
                
                const analysis = await window.chessHelperEngine.analyze(fen, 10);
                const currentEval = analysis.eval || 0;

                if (i > 0) {
                    let diff = 0;
                    if (prevActiveCol === 'w') {
                        diff = currentEval - prevEval;
                    } else {
                        diff = prevEval - currentEval;
                    }

                    const cpl = Math.max(0, -diff * 100); // centipawn loss
                    if (prevActiveCol === 'w') {
                        whiteCPLSum += cpl;
                        whiteMovesCount++;
                    } else {
                        blackCPLSum += cpl;
                        blackMovesCount++;
                    }

                    let cls = 'excellent';
                    if (diff >= 0.5) {
                        cls = 'brilliant';
                        counters[prevActiveCol].brilliant++;
                    } else if (diff >= -0.05) {
                        cls = 'best';
                        counters[prevActiveCol].best++;
                    } else if (diff >= -0.2) {
                        cls = 'excellent';
                        counters[prevActiveCol].excellent++;
                    } else if (diff >= -0.5) {
                        cls = 'good';
                        counters[prevActiveCol].good++;
                    } else if (diff >= -1.0) {
                        cls = 'inaccuracy';
                        counters[prevActiveCol].inaccuracy++;
                    } else if (diff >= -2.0) {
                        cls = 'mistake';
                        counters[prevActiveCol].mistake++;
                    } else {
                        cls = 'blunder';
                        counters[prevActiveCol].blunder++;
                    }

                    const moveNum = Math.floor((i - 1) / 2) + 1;
                    const prefix = prevActiveCol === 'w' ? `${moveNum}. ` : `${moveNum}... `;
                    const notation = analysis.best ? analysis.best.toUpperCase() : '??';

                    movesAnalysis.push({
                        notation: prefix + notation,
                        bestMove: analysis.best,
                        cls: cls,
                        eval: currentEval,
                        player: prevActiveCol
                    });
                }

                prevEval = currentEval;
            }

            // Вычисляем точность по ACPL
            const whiteAcc = whiteMovesCount > 0 ? Math.round(Math.max(0, Math.min(100, 100 - (whiteCPLSum / whiteMovesCount) * 0.45))) : 100;
            const blackAcc = blackMovesCount > 0 ? Math.round(Math.max(0, Math.min(100, 100 - (blackCPLSum / blackMovesCount) * 0.45))) : 100;

            $('ch-acc-white').textContent = `${whiteAcc}%`;
            $('ch-acc-black').textContent = `${blackAcc}%`;

            for (const col of ['w', 'b']) {
                for (const cls of ['brilliant', 'best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder']) {
                    $(`cnt-${col}-${cls}`).textContent = counters[col][cls];
                }
            }

            const list = $('ch-analysis-moves-list');
            list.innerHTML = movesAnalysis.map(m => {
                const classLabels = {
                    brilliant: appConfig.lang === 'ru' ? 'Блестящий' : 'Brilliant',
                    best: appConfig.lang === 'ru' ? 'Лучший' : 'Best',
                    excellent: appConfig.lang === 'ru' ? 'Отличный' : 'Excellent',
                    good: appConfig.lang === 'ru' ? 'Хороший' : 'Good',
                    inaccuracy: appConfig.lang === 'ru' ? 'Неточность' : 'Inaccuracy',
                    mistake: appConfig.lang === 'ru' ? 'Ошибка' : 'Mistake',
                    blunder: appConfig.lang === 'ru' ? 'Зевок' : 'Blunder'
                };
                return `
                    <div class="ch-analysis-move-row ${m.cls}" data-move-best="${m.bestMove}">
                        <span class="ch-an-move-text">${m.notation}</span>
                        <span class="ch-an-move-badge ${m.cls}">${classLabels[m.cls]}</span>
                        <span class="ch-an-move-eval">${m.eval > 0 ? '+' : ''}${m.eval.toFixed(1)}</span>
                    </div>
                `;
            }).join('');

            list.querySelectorAll('.ch-analysis-move-row').forEach(row => {
                row.onclick = () => {
                    const best = row.getAttribute('data-move-best');
                    if (best) drawArrow(best);
                };
            });

            $('ch-analysis-progress').classList.add('hidden');
            $('ch-analysis-results').classList.remove('hidden');
            startAnalysisBtn.classList.remove('hidden');
        };
    }
}

function switchTab(tab) {
    const tabReg = $('tab-mode-regular');
    const tabRage = $('tab-mode-rage');
    const tabAn = $('tab-mode-analysis');
    
    if (tabReg && tabRage && tabAn) {
        tabReg.classList.toggle('active', tab === 'regular');
        tabRage.classList.toggle('active', tab === 'rage');
        tabAn.classList.toggle('active', tab === 'analysis');
    }

    const normalControls = $('ch-normal-controls');
    const analysisPanel = $('ch-analysis-panel');

    if (tab === 'analysis') {
        if (normalControls) normalControls.classList.add('hidden');
        if (analysisPanel) analysisPanel.classList.remove('hidden');
    } else {
        if (normalControls) normalControls.classList.remove('hidden');
        if (analysisPanel) analysisPanel.classList.add('hidden');
        syncModeUI();
    }
}

function loadSettingsView() {
    $('set-lang').value = appConfig.lang;
    $('set-preset').value = appConfig.preset;
    $('set-rand-depth').checked = appConfig.randDepthEnabled;
    $('set-fatigue').checked = appConfig.fatigueEnabled;
    $('set-distractions').checked = appConfig.distractionsEnabled;
    $('set-telemetry').checked = appConfig.telemetryEnabled;
    $('set-theme').checked = appConfig.darkTheme;
    $('set-sf-mode').checked = appConfig.sfMode;
    $('set-pondering').checked = appConfig.ponderingEnabled;
    $('set-misclicks').checked = appConfig.misclicksEnabled;
    $('set-mute-victory').checked = appConfig.muteVictorySound;
    $('set-mute-greeting').checked = appConfig.muteGreetingSound;
    $('set-mute-sf').checked = appConfig.muteSfMusic;

    $('ch-bullet-toggle').checked = appConfig.bulletMode;
    $('ch-bullet-indicator').classList.toggle('active', appConfig.bulletMode);
    $('ch-bullet-label').textContent = appConfig.bulletMode ? t('active') : t('bullet_mode');

    $('slider-blunders').value = Math.round(appConfig.blunders * 100);
    $('slider-speed').value = Math.round(appConfig.mouseSpeed * 10);
    $('slider-variance').value = Math.round(appConfig.thinkVariance * 10);

    syncSlidersUI();

    // Смена языка в настройках на лету
    $('set-lang').onchange = async (e) => {
        appConfig.lang = e.target.value;
        await chrome.storage.local.set({ appConfig });
        panel.innerHTML = panelHTML();
        bindEvents();
        syncColor();
        syncModeUI();
        $('ch-main-view').classList.add('hidden');
        $('ch-settings-view').classList.remove('hidden');
        loadSettingsView();
    };

    $('set-preset').onchange = (e) => {
        appConfig.preset = e.target.value;
        if (appConfig.preset === 'custom') {
            $('custom-sliders').classList.remove('hidden');
        } else {
            $('custom-sliders').classList.add('hidden');
            const presets = {
                beginner: { blunders: 0.12, speed: 0.7, variance: 0.8 },
                intermediate: { blunders: 0.05, speed: 1.0, variance: 1.0 },
                advanced: { blunders: 0.015, speed: 1.3, variance: 1.3 },
                aggressive: { blunders: 0.02, speed: 1.2, variance: 0.4 },
                positional: { blunders: 0.01, speed: 0.9, variance: 1.2 }
            };
            const p = presets[appConfig.preset];
            if (p) {
                appConfig.blunders = p.blunders;
                appConfig.mouseSpeed = p.speed;
                appConfig.thinkVariance = p.variance;
            }
        }
        saveSettings();
    };

    $('slider-blunders').oninput = (e) => {
        appConfig.blunders = parseInt(e.target.value) / 100;
        syncSlidersUI();
        saveSettings();
    };
    $('slider-speed').oninput = (e) => {
        appConfig.mouseSpeed = parseInt(e.target.value) / 10;
        syncSlidersUI();
        saveSettings();
    };
    $('slider-variance').oninput = (e) => {
        appConfig.thinkVariance = parseInt(e.target.value) / 10;
        syncSlidersUI();
        saveSettings();
    };

    const toggleSet = (id, key) => {
        $(id).onchange = (e) => {
            appConfig[key] = e.target.checked;
            if (key === 'darkTheme') {
                root.classList.toggle('light-theme', !appConfig.darkTheme);
            }
            if (key === 'sfMode') {
                const isSfActive = appConfig.sfMode && appConfig.rageMode;
                root.classList.toggle('sf-theme', isSfActive);
                bubble.innerHTML = svgKnight();
                const logoEl = $('ch-logo');
                if (logoEl) logoEl.innerHTML = svgKnight();
                
                const avatarGif = $('ch-avatar-gif');
                if (avatarGif) {
                    const gifFilename = isSfActive ? 'sf.gif' : (appConfig.lang === 'ru' ? 'ru.gif' : 'uk.gif');
                    avatarGif.src = chrome.runtime.getURL(`assets/${gifFilename}`);
                }

                if (isSfActive && !appConfig.muteSfMusic) {
                    playSound('sf.mp3');
                } else {
                    chrome.runtime.sendMessage({ target: 'background', type: 'STOP_SOUND' });
                }
            }
            if (key === 'muteSfMusic') {
                if (appConfig.muteSfMusic) {
                    chrome.runtime.sendMessage({ target: 'background', type: 'STOP_SOUND' });
                } else if (appConfig.sfMode && appConfig.rageMode) {
                    playSound('sf.mp3');
                }
            }
            saveSettings();
        };
    };

    toggleSet('set-rand-depth', 'randDepthEnabled');
    toggleSet('set-fatigue', 'fatigueEnabled');
    toggleSet('set-distractions', 'distractionsEnabled');
    toggleSet('set-telemetry', 'telemetryEnabled');
    toggleSet('set-theme', 'darkTheme');
    toggleSet('set-sf-mode', 'sfMode');
    toggleSet('set-pondering', 'ponderingEnabled');
    toggleSet('set-misclicks', 'misclicksEnabled');
    toggleSet('set-mute-victory', 'muteVictorySound');
    toggleSet('set-mute-greeting', 'muteGreetingSound');
    toggleSet('set-mute-sf', 'muteSfMusic');

    const statsData = window.chessHelperStats?.getStats() || { wins: 0, games: 0, history: [] };
    $('stat-games').textContent = statsData.games;
    const wr = statsData.games > 0 ? Math.round((statsData.wins / statsData.games) * 100) : 0;
    $('stat-winrate').textContent = `${wr}%`;

    $('btn-export').onclick = () => {
        const str = JSON.stringify(appConfig, null, 2);
        const blob = new Blob([str], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = el('a', { href: url, download: 'knight_config.json' });
        a.click();
    };

    $('btn-import').onclick = () => {
        const inp = el('input', { type: 'file', accept: '.json' });
        inp.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const parsed = JSON.parse(evt.target.result);
                    appConfig = { ...appConfig, ...parsed };
                    await chrome.storage.local.set({ appConfig });
                    applyConfigToEngine();
                    loadSettingsView();
                    root.classList.toggle('light-theme', !appConfig.darkTheme);
                    root.classList.toggle('sf-theme', appConfig.sfMode && appConfig.rageMode);
                } catch (_) {
                    alert('Invalid JSON file');
                }
            };
            reader.readAsText(file);
        };
        inp.click();
    };

    $('btn-reset-all').onclick = async () => {
        if (confirm(t('confirm_reset'))) {
            await chrome.storage.local.clear();
            location.reload();
        }
    };
}

function syncModeUI() {
    const isRage = appConfig.rageMode;
    const isSfActive = isRage && appConfig.sfMode;

    const tabReg = $('tab-mode-regular');
    const tabRage = $('tab-mode-rage');
    if (tabReg && tabRage) {
        tabReg.classList.toggle('active', !isRage);
        tabRage.classList.toggle('active', isRage);
    }
    
    const bulletRow = $('ch-bullet-row');
    if (bulletRow) {
        if (isRage) {
            bulletRow.classList.remove('hidden');
        } else {
            bulletRow.classList.add('hidden');
        }
    }
    
    root.classList.toggle('rage-active', isRage);
    root.classList.toggle('sf-theme', isSfActive);
    
    bubble.innerHTML = svgKnight();
    const logoEl = $('ch-logo');
    if (logoEl) logoEl.innerHTML = svgKnight();
    
    const avatarGif = $('ch-avatar-gif');
    if (avatarGif) {
        const gifFilename = isSfActive ? 'sf.gif' : (appConfig.lang === 'ru' ? 'ru.gif' : 'uk.gif');
        avatarGif.src = chrome.runtime.getURL(`assets/${gifFilename}`);
    }

    if (!isRage) {
        const bulletToggle = $('ch-bullet-toggle');
        if (bulletToggle) {
            bulletToggle.checked = false;
            $('ch-bullet-indicator').classList.remove('active');
            $('ch-bullet-label').textContent = t('bullet_mode');
            appConfig.bulletMode = false;
        }
    }

    // Динамически перестраиваем ползунок ELO при переключении режима
    const range = $('ch-elo-range');
    if (range) {
        if (isRage) {
            range.min = "1000";
            range.max = "2500";
            range.step = "50";
        } else {
            range.min = "1000";
            range.max = "1500";
            range.step = "50";
            if (appConfig.elo > 1500) {
                appConfig.elo = 1500;
            }
        }
        range.value = appConfig.elo;
        // Программно вызываем input для пересчета стилей и заполнения прогресс-бара
        range.dispatchEvent(new Event('input'));
    }

    if (isSfActive && !appConfig.muteSfMusic) {
        playSound('sf.mp3');
    } else {
        chrome.runtime.sendMessage({ target: 'background', type: 'STOP_SOUND' });
    }

    saveSettings();
}

function syncSlidersUI() {
    $('val-blunders').textContent = `${Math.round(appConfig.blunders * 100)}%`;
    $('val-speed').textContent = `${appConfig.mouseSpeed.toFixed(1)}x`;
    $('val-variance').textContent = `${appConfig.thinkVariance.toFixed(1)}x`;
    if (appConfig.preset === 'custom') {
        $('custom-sliders').classList.remove('hidden');
    } else {
        $('custom-sliders').classList.add('hidden');
    }
}

function onThinking(active) {
    const bar = $('ch-think-bar');
    const fill = $('ch-think-fill');
    if (!bar || !fill) return;
    bar.style.opacity = active ? '1' : '0';
    fill.style.animationPlayState = active ? 'running' : 'paused';
    if (active) {
        fill.style.width = ''; 
    } else {
        fill.style.width = '0';
    }
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
            ${m.book ? `<span class="ch-log-tag book">${t('book')}</span>` : ''}
            <span class="ch-log-phase">${m.phase}</span>
        </div>
    `).join('');
}

function renderHistory() {
    const list = $('ch-history-list');
    if (!list) return;
    const history = appConfig.gameHistory || [];
    if (!history.length) {
        list.innerHTML = `<span class="ch-history-empty">${appConfig.lang === 'ru' ? 'Нет сыгранных игр' : 'No games played yet'}</span>`;
        return;
    }
    list.innerHTML = history.map(g => {
        const res = g.result;
        let resClass = 'draw';
        let resText = appConfig.lang === 'ru' ? 'НИЧЬЯ' : 'DRAW';
        
        if (res === 'WIN') {
            resClass = 'win';
            resText = appConfig.lang === 'ru' ? 'ПОБЕДА' : 'WIN';
        } else if (res === 'LOSS') {
            resClass = 'loss';
            resText = appConfig.lang === 'ru' ? 'ПОРАЖЕНИЕ' : 'LOSS';
        }

        const colorText = g.color === 'White' 
            ? (appConfig.lang === 'ru' ? 'Белые' : 'White')
            : (appConfig.lang === 'ru' ? 'Черные' : 'Black');
        
        let changeTag = '';
        if (g.eloChange !== undefined && g.eloChange !== 0) {
            const isPlus = g.eloChange > 0;
            changeTag = `<span class="ch-history-elo-change ${isPlus ? 'plus' : 'minus'}">${isPlus ? '+' : ''}${g.eloChange}</span>`;
        }

        return `
            <div class="ch-history-row">
                <span class="ch-history-res ${resClass}">${resText}</span>
                <span class="ch-history-color">${colorText}</span>
                <span class="ch-history-elo">⚡ ${g.elo} ${changeTag}</span>
                <span class="ch-history-date">${g.date}</span>
            </div>
        `;
    }).join('');
}

function onGameOverDetected(detail) {
    try {
        console.log('[ch:ui] onGameOverDetected triggered:', detail);
        const modalText = String(detail?.modalText || '').toLowerCase();
        const docText = document.body.textContent.toLowerCase();
        
        // 1. Извлекаем имена пользователей игроков
        let myUsername = '';
        let opponentUsername = '';
        try {
            const b = document.querySelector('wc-chess-board, .board, chess-board');
            if (b) {
                const gameObj = b.game || b.controller?.game || b.controller;
                if (gameObj) {
                    const whiteUser = gameObj.players?.white?.username || gameObj.players?.white?.name || gameObj.whitePlayer?.username || gameObj.whitePlayer?.name;
                    const blackUser = gameObj.players?.black?.username || gameObj.players?.black?.name || gameObj.blackPlayer?.username || gameObj.blackPlayer?.name;
                    
                    if (whiteUser && blackUser) {
                        const myColor = window.chessHelperEngine?.myColor() || 'w';
                        if (myColor === 'w') {
                            myUsername = whiteUser;
                            opponentUsername = blackUser;
                        } else {
                            myUsername = blackUser;
                            opponentUsername = whiteUser;
                        }
                    }
                }
            }
        } catch (_) {}

        if (!myUsername) {
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
                    '.board-layout-bottom .user-tagline-username',
                    '[data-testid="player-bottom"] .user-username-component',
                    '[data-control-name="player-bottom"] .user-username-component'
                ];
                for (const sel of bottomSelectors) {
                    const el = document.querySelector(sel);
                    if (el) {
                        myUsername = el.getAttribute('data-username') || el.textContent.trim();
                        if (myUsername) break;
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
                    '.board-layout-top .user-tagline-username',
                    '[data-testid="player-top"] .user-username-component',
                    '[data-control-name="player-top"] .user-username-component'
                ];
                for (const sel of topSelectors) {
                    const el = document.querySelector(sel);
                    if (el) {
                        opponentUsername = el.getAttribute('data-username') || el.textContent.trim();
                        if (opponentUsername) break;
                    }
                }
            } catch (_) {}
        }

        if (myUsername) {
            myUsername = myUsername.replace(/\s*\(\d+\)\s*$/, '').trim();
        }
        if (opponentUsername) {
            opponentUsername = opponentUsername.replace(/\s*\(\d+\)\s*$/, '').trim();
        }
        console.log(`[ch:ui] Resolved usernames: My: "${myUsername}", Opponent: "${opponentUsername}"`);

        let eloChange = 0;
        let finalElo = 0;
        let outcome = 'DRAW'; // 'WIN', 'LOSS', 'DRAW'
        let parsedOutcome = false;

        // 2. Ищем все возможные контейнеры результатов окончания игры в DOM
        const gameOverContainer = document.querySelector(
            '.game-over-modal-container, .board-modal-container, .game-over-header-component, ' + 
            '.board-modal-modal, .game-over-dialog, .game-over-modal, [data-behavior="game-over-modal"], ' +
            '.game-over-modal-content, .board-layout-sidebar, .sidebar-component, .game-over-sidebar, ' +
            '.game-over-pane, .sidebar-game-over, .live-game-over-component, .game-over-dialog-content, ' +
            '[class*="game-over-modal"], [class*="board-modal"], [data-testid*="game-over"]'
        ) || document;

        // Ищем строки/блоки игроков в контейнере окончания игры
        const playerRows = gameOverContainer.querySelectorAll(
            '.game-over-player-component, .game-over-player, .game-over-row, .game-over-player-row, ' +
            '.game-over-modal-player, .player-row, .game-over-player-row-component, .game-over-player-component-layout'
        );

        let myRow = null;
        let oppRow = null;

        if (myUsername && playerRows.length > 0) {
            for (const row of playerRows) {
                if (row.textContent.toLowerCase().includes(myUsername.toLowerCase())) {
                    myRow = row;
                    break;
                }
            }
        }

        // Если не нашли по нашему имени, пробуем исключить имя оппонента
        if (!myRow && opponentUsername && playerRows.length > 0) {
            for (const row of playerRows) {
                if (!row.textContent.toLowerCase().includes(opponentUsername.toLowerCase())) {
                    myRow = row;
                    break;
                }
            }
        }

        if (playerRows.length >= 2) {
            if (myRow) {
                oppRow = Array.from(playerRows).find(row => row !== myRow);
            } else {
                oppRow = playerRows[0];
                myRow = playerRows[1];
            }
        } else if (playerRows.length === 1) {
            myRow = playerRows[0];
        }

        // --- МЕТОД 0: Анализ заголовка модального окна (Быстро и надежно) ---
        if (!parsedOutcome) {
            try {
                const headerEl = document.querySelector(
                    '.game-over-header-title, .game-over-header, .game-over-title, ' +
                    '.game-over-header-title-component, .board-modal-header-title, ' +
                    '.game-over-modal-title, [class*="game-over-header-title"], [class*="game-over-title"], [class*="game-over-modal-title"]'
                );
                if (headerEl) {
                    const headerText = headerEl.textContent.toLowerCase();
                    const winHeaders = ['вы выиграли', 'you won', 'victory', 'победа', 'победил', 'выиграл', 'congratulations', 'поздравляем', 'победили'];
                    const lossHeaders = ['вы проиграли', 'you lost', 'defeat', 'поражение', 'проиграл', 'уступил', 'проиграли'];
                    const drawHeaders = ['ничья', 'draw', 'stalemate', 'пат', 'ничьей'];
                    
                    if (winHeaders.some(kw => headerText.includes(kw))) {
                        outcome = 'WIN';
                        parsedOutcome = true;
                        console.log('[ch:ui] Scraped WIN via game-over header text');
                    } else if (lossHeaders.some(kw => headerText.includes(kw))) {
                        outcome = 'LOSS';
                        parsedOutcome = true;
                        console.log('[ch:ui] Scraped LOSS via game-over header text');
                    } else if (drawHeaders.some(kw => headerText.includes(kw))) {
                        outcome = 'DRAW';
                        parsedOutcome = true;
                        console.log('[ch:ui] Scraped DRAW via game-over header text');
                    }
                }
            } catch (_) {}
        }

        // --- МЕТОД 1: Корона победителя (100% точность) ---
        if (!parsedOutcome) {
            try {
                let myCrown = false;
                let oppCrown = false;
                if (myRow) {
                    myCrown = !!myRow.querySelector('.crown, .icon-crown, [data-icon="crown"], .game-over-player-crown, .game-over-crown, img[src*="crown"], .player-crown');
                }
                if (oppRow) {
                    oppCrown = !!oppRow.querySelector('.crown, .icon-crown, [data-icon="crown"], .game-over-player-crown, .game-over-crown, img[src*="crown"], .player-crown');
                }
                
                if (myCrown && !oppCrown) {
                    outcome = 'WIN';
                    parsedOutcome = true;
                    console.log('[ch:ui] Scraped WIN via bottom player crown icon');
                } else if (oppCrown && !myCrown) {
                    outcome = 'LOSS';
                    parsedOutcome = true;
                    console.log('[ch:ui] Scraped LOSS via top player crown icon');
                }
            } catch (_) {}
        }

        // --- МЕТОД 2: Классы победы на блоках игроков ---
        if (!parsedOutcome) {
            try {
                let myWinClass = false;
                let oppWinClass = false;
                if (myRow) {
                    myWinClass = myRow.classList.contains('winner') || myRow.classList.contains('win') || 
                                 myRow.classList.contains('won') || !!myRow.querySelector('.winner, .win, .won');
                }
                if (oppRow) {
                    oppWinClass = oppRow.classList.contains('winner') || oppRow.classList.contains('win') || 
                                  oppRow.classList.contains('won') || !!oppRow.querySelector('.winner, .win, .won');
                }

                if (myWinClass && !oppWinClass) {
                    outcome = 'WIN';
                    parsedOutcome = true;
                    console.log('[ch:ui] Scraped WIN via winner class on player row');
                } else if (oppWinClass && !myWinClass) {
                    outcome = 'LOSS';
                    parsedOutcome = true;
                    console.log('[ch:ui] Scraped LOSS via winner class on opponent row');
                }
            } catch (_) {}
        }

        // --- МЕТОД 3: Считывание ELO изменений (+x / -x) ---
        const targetContainer = myRow || gameOverContainer;
        const plusEl = targetContainer.querySelector('.rating-change-plus, .player-rating-change.plus, .player-rating-change-value.plus, .rating-change-up');
        const minusEl = targetContainer.querySelector('.rating-change-minus, .player-rating-change.minus, .player-rating-change-value.minus, .rating-change-down');

        if (plusEl) {
            eloChange = parseInt(plusEl.textContent.trim().replace(/[^\d]/g, '')) || 0;
        } else if (minusEl) {
            eloChange = -(parseInt(minusEl.textContent.trim().replace(/[^\d]/g, '')) || 0);
        } else {
            const txt = targetContainer.textContent;
            const plusMatch = txt.match(/\+(\d+)/);
            const minusMatch = txt.match(/\-(\d+)/);
            if (plusMatch) {
                eloChange = parseInt(plusMatch[1]) || 0;
            } else if (minusMatch) {
                eloChange = -(parseInt(minusMatch[1])) || 0;
            }
        }

        if (!parsedOutcome && eloChange !== 0) {
            if (eloChange > 0) {
                outcome = 'WIN';
                parsedOutcome = true;
                console.log('[ch:ui] Scraped WIN via positive ELO rating change');
            } else if (eloChange < 0) {
                outcome = 'LOSS';
                parsedOutcome = true;
                console.log('[ch:ui] Scraped LOSS via negative ELO rating change');
            }
        }

        // --- МЕТОД 4: Массивный словарь ключевых слов в заголовках и текстах (с учетом локали) ---
        if (!parsedOutcome) {
            const textSources = [
                document.querySelector('.game-over-header-title, .game-over-header, .game-over-title, .game-over-header-title-component')?.textContent,
                document.querySelector('.game-over-header-subtitle, .game-over-status, .game-over-result')?.textContent,
                document.querySelector('.board-modal-header-title, .game-over-modal-title')?.textContent,
                modalText,
                myRow?.textContent,
                gameOverContainer.textContent
            ].filter(Boolean).map(t => String(t).toLowerCase());

            const winKeywords = [
                'victory', 'won', 'victorious', 'winner', 'win', 'you won', 'you are victorious', 'white won', 'black won', 'congratulations',
                'победа', 'выиграл', 'выиграли', 'выиграна', 'победил', 'победили', 'победил(а)', 'вы победили', 'победитель', 'поздравляем',
                'соперник сдался', 'сдался', 'opponent resigned', 'by resignation', 'resigned', 'resignation', 'вы выиграли', 'вы выиграли!', 'you won!'
            ];
            const lossKeywords = [
                'defeat', 'lost', 'loser', 'you lost', 'white lost', 'black lost',
                'поражение', 'проиграл', 'проиграли', 'проиграна', 'уступил', 'уступили', 'проигрыш', 'проигравший',
                'вы сдались', 'сдались', 'you resigned', 'вы проиграли', 'вы проиграли!', 'you lost!'
            ];
            const drawKeywords = [
                'draw', 'stalemate', 'insufficient', 'repetition', 'agreement', 'agreed', 'timeout vs insufficient',
                'ничья', 'пат', 'мат невозможен', 'согласие', 'недостаточно материала', 'повторение', 'ничьей'
            ];

            let winMatchCount = 0;
            let lossMatchCount = 0;
            let drawMatchCount = 0;

            for (const text of textSources) {
                for (const kw of winKeywords) {
                    if (text.includes(kw)) winMatchCount++;
                }
                for (const kw of lossKeywords) {
                    if (text.includes(kw)) lossMatchCount++;
                }
                for (const kw of drawKeywords) {
                    if (text.includes(kw)) drawMatchCount++;
                }
            }

            console.log(`[ch:ui] Keyword Matches: Wins=${winMatchCount}, Losses=${lossMatchCount}, Draws=${drawMatchCount}`);

            if (winMatchCount > lossMatchCount && winMatchCount > drawMatchCount) {
                outcome = 'WIN';
                parsedOutcome = true;
                console.log('[ch:ui] Scraped WIN via Win Keywords dictionary');
            } else if (lossMatchCount > winMatchCount && lossMatchCount > drawMatchCount) {
                outcome = 'LOSS';
                parsedOutcome = true;
                console.log('[ch:ui] Scraped LOSS via Loss Keywords dictionary');
            } else if (drawMatchCount > winMatchCount && drawMatchCount > lossMatchCount) {
                outcome = 'DRAW';
                parsedOutcome = true;
                console.log('[ch:ui] Scraped DRAW via Draw Keywords dictionary');
            }
        }

        // --- МЕТОД 5: Парсинг по цвету фигур и тексту о победе цвета ---
        if (!parsedOutcome) {
            const combinedText = docText + ' ' + modalText;
            const myColor = window.chessHelperEngine?.myColor() || 'w';
            
            const isWhiteWon = combinedText.includes('white won') || combinedText.includes('белые выиграли') || combinedText.includes('белые победили');
            const isBlackWon = combinedText.includes('black won') || combinedText.includes('черные выиграли') || combinedText.includes('черные победили');
            
            if (isWhiteWon) {
                outcome = (myColor === 'w') ? 'WIN' : 'LOSS';
                parsedOutcome = true;
                console.log(`[ch:ui] Resolved color victory (White Won, myColor=${myColor}) -> ${outcome}`);
            } else if (isBlackWon) {
                outcome = (myColor === 'b') ? 'WIN' : 'LOSS';
                parsedOutcome = true;
                console.log(`[ch:ui] Resolved color victory (Black Won, myColor=${myColor}) -> ${outcome}`);
            }
        }

        // --- МЕТОД 6: Реверсивное ELO изменение оппонента ---
        if (!parsedOutcome && oppRow) {
            const oppPlus = oppRow.querySelector('.rating-change-plus, .player-rating-change.plus, .player-rating-change-value.plus, .rating-change-up');
            const oppMinus = oppRow.querySelector('.rating-change-minus, .player-rating-change.minus, .player-rating-change-value.minus, .rating-change-down');
            let oppEloChange = 0;
            if (oppPlus) {
                oppEloChange = parseInt(oppPlus.textContent.trim().replace(/[^\d]/g, '')) || 0;
            } else if (oppMinus) {
                oppEloChange = -(parseInt(oppMinus.textContent.trim().replace(/[^\d]/g, '')) || 0);
            }
            
            if (oppEloChange > 0) {
                outcome = 'LOSS';
                parsedOutcome = true;
                console.log('[ch:ui] Scraped LOSS via opponent positive ELO rating change');
            } else if (oppEloChange < 0) {
                outcome = 'WIN';
                parsedOutcome = true;
                console.log('[ch:ui] Scraped WIN via opponent negative ELO rating change');
            }
        }

        // 5. Ищем итоговый рейтинг (Final ELO)
        const ratingEl = targetContainer.querySelector('.user-tag-rating, .player-rating, .rating, .player-rating-value');
        if (ratingEl) {
            finalElo = parseInt(ratingEl.textContent.replace(/[^\d]/g, '')) || 0;
        } else {
            const ratingMatch = targetContainer.textContent.match(/\((\d+)\)/);
            if (ratingMatch) {
                finalElo = parseInt(ratingMatch[1]) || 0;
            }
        }

        if (!finalElo) {
            try {
                const eloEl = document.querySelector('.player-bottom .user-tag-rating, .player-bottom-component .user-tag-rating, .player-bottom .player-rating, .board-layout-bottom .user-tag-rating, .player-bottom [class*="rating"]');
                if (eloEl) {
                    finalElo = parseInt(eloEl.textContent.replace(/[^\d]/g, '')) || 0;
                }
            } catch (_) {}
        }

        console.log(`[ch:ui] Game Outcome Resolved: ${outcome}, ELO Change: ${eloChange}, Final ELO: ${finalElo}`);
        window.chessHelperStats?.addGame(outcome, eloChange, finalElo);
    } catch (e) {
        console.error('[ch:ui] Error during game over processing:', e);
    } finally {
        moveLog.length = 0;
        renderLog();
        setTimeout(renderHistory, 250);
        window.chessHelperEngine?.reset();
    }
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
    const ptagEl  = $('st-phase');
    if (ptag) { ptag.textContent = phase; ptag.className = phase; }
    if (ptagEl) ptagEl.textContent = phase ? phase[0].toUpperCase() + phase.slice(1) : '–';
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

    if (isFinite(myEval)) {
        const clampedEval = Math.max(-4.0, Math.min(4.0, myEval));
        const pct = Math.round(((clampedEval + 4.0) / 8.0) * 100);
        
        const barText = $('ch-eval-bar-text');
        if (barText) barText.textContent = sign + myEval.toFixed(1);
        
        const fill = $('ch-eval-bar-fill');
        if (fill) {
            fill.style.width = `${pct}%`;
            
            if (myEval > 0.3) {
                fill.style.background = '#0df5a3';
                fill.style.boxShadow = '0 0 12px rgba(13, 245, 163, 0.65)';
            } else if (myEval < -0.3) {
                fill.style.background = '#ff3366';
                fill.style.boxShadow = '0 0 12px rgba(255, 51, 102, 0.65)';
            } else {
                fill.style.background = 'var(--text-muted)';
                fill.style.boxShadow = '0 0 8px var(--border)';
            }
        }
    } else {
        const barText = $('ch-eval-bar-text');
        if (barText) barText.textContent = '–';
        const fill = $('ch-eval-bar-fill');
        if (fill) {
            fill.style.width = '50%';
            fill.style.background = 'var(--text-muted)';
            fill.style.boxShadow = '0 0 8px var(--border)';
        }
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
    if (appConfig.lang) {
        syncStats();
        renderLog();
        renderHistory();
        playGreetingSound(); 
    }
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
        d.className = `ch-hl square-${cm[sq[0]]}${sq[1]} square-${cm[sq[0]]}-${sq[1]}`;
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
    try {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap';
        document.head.appendChild(link);
    } catch (_) {}

    const s = document.createElement('style');
    s.textContent = STYLES;
    document.head.appendChild(s);
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=DM+Mono:wght@400;500&display=swap');

/* Modern Web Guidance Scrollbars */
::-webkit-scrollbar {
    width: 6px !important;
    height: 6px !important;
}
::-webkit-scrollbar-track {
    background: transparent !important;
}
::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12) !important;
    border-radius: 10px !important;
}
#ch-root.light-theme ::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.12) !important;
}
::-webkit-scrollbar-thumb:hover {
    background: var(--border-glow) !important;
}
* {
    scrollbar-color: rgba(255, 255, 255, 0.12) transparent !important;
    scrollbar-width: thin !important;
}
#ch-root.light-theme * {
    scrollbar-color: rgba(0, 0, 0, 0.12) transparent !important;
}

#ch-root, #ch-root * {
    font-family: 'Plus Jakarta Sans', Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
}

#ch-root {
    position:fixed;inset:0;pointer-events:none;z-index:99999;
    --bg:radial-gradient(circle at 50% 0%, oklch(0.18 0.04 250 / 0.95) 0%, oklch(0.12 0.02 250 / 0.98) 100%);
    --border:oklch(1 0 0 / 0.08);
    --border-glow:oklch(0.86 0.27 150 / 0.35);
    --btn-mode-bg:linear-gradient(135deg, oklch(0.86 0.27 150) 0%, oklch(0.62 0.22 150) 100%);
    --btn-mode-shadow:oklch(0.86 0.27 150 / 0.35);
    --text:oklch(1 0 0);
    --text-sub:oklch(0.88 0.02 240);
    --text-muted:oklch(0.55 0.03 240);
    --bg-strip:oklch(1 0 0 / 0.015);
    --bg-item:oklch(1 0 0 / 0.05);
    --git-invert:1;
}

#ch-root.light-theme {
    --bg:radial-gradient(circle at 50% 0%, oklch(0.97 0.01 240 / 0.96) 0%, oklch(0.93 0.02 240 / 0.98) 100%);
    --border:oklch(0.15 0.03 240 / 0.1);
    --border-glow:oklch(0.62 0.22 150 / 0.45);
    --btn-mode-bg:linear-gradient(135deg, oklch(0.62 0.22 150) 0%, oklch(0.45 0.17 150) 100%);
    --btn-mode-shadow:oklch(0.62 0.22 150 / 0.25);
    --text:oklch(0.15 0.03 240);
    --text-sub:oklch(0.35 0.03 240);
    --text-muted:oklch(0.65 0.03 240);
    --bg-strip:oklch(0 0 0 / 0.02);
    --bg-item:oklch(0 0 0 / 0.05);
    --git-invert:0;
}

#ch-root.rage-active {
    --bg:radial-gradient(circle at 50% 0%, oklch(0.25 0.08 15 / 0.97) 0%, oklch(0.12 0.03 15 / 0.99) 100%);
    --border-glow:oklch(0.65 0.26 10 / 0.45);
    --btn-mode-bg:linear-gradient(135deg, oklch(0.65 0.26 10) 0%, oklch(0.48 0.22 10) 100%);
    --btn-mode-shadow:oklch(0.65 0.26 10 / 0.4);
}

#ch-root.sf-theme {
    --bg:radial-gradient(circle at 50% 0%, oklch(0.22 0.08 15 / 0.97) 0%, oklch(0.10 0.03 15 / 0.99) 100%);
    --border:oklch(0.65 0.26 10 / 0.12);
    --border-glow:oklch(0.65 0.26 10 / 0.45);
    --btn-mode-bg:linear-gradient(135deg, oklch(0.65 0.26 10) 0%, oklch(0.48 0.22 10) 100%);
    --btn-mode-shadow:oklch(0.65 0.26 10 / 0.4);
    --text:oklch(1 0 0);
    --text-sub:oklch(0.80 0.12 15);
    --text-muted:oklch(0.30 0.15 15);
    --bg-strip:oklch(0.65 0.26 10 / 0.03);
    --bg-item:oklch(0.65 0.26 10 / 0.05);
}

#ch-root::before {
    content: '' !important;
    position: fixed !important;
    inset: 0 !important;
    pointer-events: none !important;
    z-index: -1000 !important;
    transition: background 0.6s ease, box-shadow 0.6s ease !important;
    background: transparent !important;
    box-shadow: none !important;
}

#ch-root.rage-active::before {
    box-shadow: inset 0 0 100px rgba(255, 51, 102, 0.35) !important;
    background: rgba(255, 51, 102, 0.04) !important;
    animation: rage-pulse 3s infinite ease-in-out !important;
}

@keyframes rage-pulse {
    0% { 
        box-shadow: inset 0 0 60px rgba(255, 51, 102, 0.2) !important; 
        background: rgba(255, 51, 102, 0.02) !important; 
    }
    50% { 
        box-shadow: inset 0 0 120px rgba(255, 51, 102, 0.5) !important; 
        background: rgba(255, 51, 102, 0.06) !important; 
    }
    100% { 
        box-shadow: inset 0 0 60px rgba(255, 51, 102, 0.2) !important; 
        background: rgba(255, 51, 102, 0.02) !important; 
    }
}

#ch-bubble {
    position:fixed;width:52px;height:52px;
    background:linear-gradient(135deg,#0a0b12 0%,#181924 100%);
    border:1.5px solid var(--border-glow);
    border-radius:18px;
    display:flex;align-items:center;justify-content:center;
    cursor:grab;pointer-events:auto;
    box-shadow:0 8px 32px rgba(0,0,0,0.5);
    animation:pulse-glow 3.5s infinite ease-in-out;
    transition:transform .2s,border-color .2s;
    user-select:none;
}
#ch-bubble:hover {
    border-color:var(--border-glow);
    transform:scale(1.08);
}
#ch-bubble:active { cursor:grabbing; }

@keyframes pulse-glow {
    0% { box-shadow: 0 0 12px rgba(13,245,163,0.15), 0 8px 32px rgba(0,0,0,0.5); }
    50% { box-shadow: 0 0 25px rgba(13,245,163,0.45), 0 8px 32px rgba(0,0,0,0.5); }
    100% { box-shadow: 0 0 12px rgba(13,245,163,0.15), 0 8px 32px rgba(0,0,0,0.5); }
}

#ch-root.sf-theme #ch-bubble, #ch-root.rage-active #ch-bubble {
    animation:pulse-glow-sf 2.5s infinite ease-in-out;
}
@keyframes pulse-glow-sf {
    0% { box-shadow: 0 0 12px rgba(255,51,102,0.15), 0 8px 32px rgba(0,0,0,0.5); }
    50% { box-shadow: 0 0 25px rgba(255,51,102,0.5), 0 8px 32px rgba(0,0,0,0.5); }
    100% { box-shadow: 0 0 12px rgba(255,51,102,0.15), 0 8px 32px rgba(0,0,0,0.5); }
}

.setup-container {
    display:none;padding:26px;text-align:center;
    opacity:0;transform:translateY(12px);
    transition:opacity .35s ease, transform .35s ease;
}
.setup-container.active {
    display:block;opacity:1;transform:translateY(0);
}
.setup-header { margin-bottom:20px; }
.setup-logo {
    display:inline-block;filter:drop-shadow(0 0 8px rgba(13,245,163,0.4));
}
.setup-container h3 {
    margin:10px 0 5px;
    color:var(--text);font-size:19px;font-weight:700;
}
.setup-title {
    color:var(--text-sub);font-size:13px;margin-bottom:20px;font-weight:500;
}
.setup-title-sub { color:var(--text-sub);font-size:12px;line-height:1.5;margin-bottom:24px; }
.setup-options { display:flex;flex-direction:column;gap:10px; }
.setup-btn {
    width:100%;padding:12px;border-radius:12px;
    border:1px solid var(--border);background:var(--bg-item);
    color:var(--text);font-size:13px;font-weight:600;cursor:pointer;
    transition:background .2s, border-color .2s;
}
.setup-btn:hover {
    background:rgba(13,245,163,0.1);border-color:rgba(13,245,163,0.5);
}
.setup-btn-primary { background:#05a873;color:#fff;border:none; }
.setup-btn-primary:hover { background:#047857; }

#ch-panel {
    position:fixed;width:316px;
    background:var(--bg);border:1px solid var(--border);
    border-radius:24px;overflow:hidden;pointer-events:none;
    opacity:0;transform:scale(0.93);
    transition: 
        opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.34s cubic-bezier(0.34, 1.56, 0.64, 1),
        display 0.28s allow-discrete;
    box-shadow:0 30px 70px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.03);
    backdrop-filter: blur(28px) saturate(190%);
}
#ch-panel::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
    background-size: 100% 4px;
    z-index: 10;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.5s ease;
}
#ch-root.rage-active #ch-panel::after {
    opacity: 0.12;
}
#ch-panel.open { opacity:1;transform:scale(1);pointer-events:auto; }
@starting-style {
    #ch-panel.open {
        opacity:0;
        transform:scale(0.93);
    }
}

#ch-main-view, #ch-settings-view {
    transition:opacity 0.22s ease, transform 0.22s ease;
    position:relative;z-index:1;
}
#ch-main-view.hidden, #ch-settings-view.hidden, .hidden { display:none !important; }

#ch-header {
    display:flex;justify-content:space-between;align-items:center;
    padding:18px 20px 14px;border-bottom:1px solid var(--border);
}
#ch-brand { display:flex;align-items:center;gap:12px; }
#ch-logo { display:flex;align-items:center;filter:drop-shadow(0 0 4px rgba(13,245,163,0.2)); }
#ch-title { font-family:'Outfit',sans-serif;font-size:17px;font-weight:800;color:var(--text);letter-spacing:-.015em; }
#ch-subtitle { font-size:11px;color:var(--text-sub);margin-top:1px;font-weight:600; }
#ch-close, #ch-settings-btn {
    background:none;border:none;cursor:pointer;
    color:var(--text-sub);font-size:14px;padding:6px 8px;border-radius:10px;
    display:flex;align-items:center;justify-content:center;
    transition:color .15s,background .15s,transform .15s;
}
#ch-close:hover, #ch-settings-btn:hover { color:var(--text);background:var(--bg-item); }
#ch-settings-btn:hover { transform:rotate(25deg); }

#ch-mode-tabs {
    display: flex !important;
    background: rgba(0, 0, 0, 0.2) !important;
    border-radius: 14px !important;
    padding: 4px !important;
    margin: 14px 18px 8px !important;
    border: 1px solid var(--border) !important;
    box-sizing: border-box !important;
}
#ch-root .ch-mode-tab {
    all: unset !important;
    display: block !important;
    flex: 1 !important;
    padding: 9px 0 !important;
    background: transparent !important;
    border: none !important;
    color: var(--text-sub) !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    cursor: pointer !important;
    border-radius: 10px !important;
    transition: all 0.28s cubic-bezier(0.25, 1, 0.5, 1) !important;
    text-align: center !important;
    box-sizing: border-box !important;
    font-family: inherit !important;
}
#ch-root .ch-mode-tab:hover { color: var(--text) !important; }
#ch-root .ch-mode-tab.active {
    background: var(--btn-mode-bg) !important;
    color: #fff !important;
    box-shadow: 0 4px 14px var(--btn-mode-shadow) !important;
}

#ch-color-strip {
    display:flex;align-items:center;justify-content:space-between;
    padding:11px 20px;background:var(--bg-strip);
    border-bottom:1px solid var(--border);
}
#ch-color-inner { display:flex;align-items:center;gap:9px; }
#ch-color-dot {
    width:10px;height:10px;border-radius:50%;background:#475569;
    transition:background .3s,box-shadow .3s;
}
#ch-color-dot.white { background:#ffffff;box-shadow:0 0 10px rgba(255,255,255,0.7); }
#ch-color-dot.black { background:#0f172a;border:1.5px solid #64748b;box-shadow:none; }
#ch-color-text { font-size:12px;font-weight:700;color:var(--text-sub); }
#ch-phase-tag {
    font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
    padding:4px 10px;border-radius:20px;
    background:var(--bg-item);color:var(--text-muted);
    transition:all .3s;
}
#ch-phase-tag.opening    { background:rgba(59,130,246,.12);color:#60a5fa; }
#ch-phase-tag.middlegame { background:rgba(245,158,11,.12);color:#fbbf24; }
#ch-phase-tag.endgame    { background:rgba(167,139,250,.12);color:#c084fc; }

#ch-avatar-section {
    display:flex;justify-content:center;align-items:center;
    padding:14px 0;background:var(--bg-strip);
    border-bottom:1px solid var(--border);
}
#ch-avatar-gif {
    width:76px;height:76px;border-radius:50%;
    border:2.5px solid var(--border-glow);
    object-fit:cover;box-shadow:0 0 16px var(--border-glow);
    pointer-events:none;user-select:none;
    transition: transform 0.3s;
}
#ch-avatar-gif:hover { transform: scale(1.05); }

.control-card, #ch-stats, #ch-elo-section, #ch-log-section, #ch-history-section, #ch-guide-accordion {
    border-radius: 16px;
    border: 1px solid var(--border);
    margin: 12px 18px;
    background: rgba(0, 0, 0, 0.2);
    overflow: hidden;
    transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease;
}
.control-card:hover, #ch-stats:hover, #ch-elo-section:hover, #ch-log-section:hover, #ch-history-section:hover, #ch-guide-accordion:hover {
    border-color: var(--border-glow);
    box-shadow: 0 6px 24px rgba(13, 245, 163, 0.05);
    transform: translateY(-1.5px);
}
#ch-root.sf-theme .control-card:hover, 
#ch-root.sf-theme #ch-stats:hover, 
#ch-root.sf-theme #ch-elo-section:hover, 
#ch-root.sf-theme #ch-history-section:hover,
#ch-root.sf-theme #ch-log-section:hover {
    box-shadow: 0 6px 24px rgba(255, 51, 102, 0.07);
}

#ch-stats {
    display:flex;align-items:center;justify-content:space-around;
    padding:16px 14px;
}
.ch-stat { display:flex;flex-direction:column;align-items:center;gap:4px;flex:1; }
.ch-stat-n { font-size:15px;font-weight:600;color:var(--text); }
.ch-stat-n.pos { color:#0df5a3;text-shadow:0 0 8px rgba(13,245,163,0.2); }
.ch-stat-n.neg { color:#ff3366;text-shadow:0 0 8px rgba(255,51,102,0.2); }
#ch-root.sf-theme .ch-stat-n.pos, #ch-root.rage-active .ch-stat-n.pos {
    color:#ff3366;text-shadow:0 0 8px rgba(255,51,102,0.3);
}
.ch-stat-l { font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted); }
.ch-stat-div { width:1px;height:26px;background:var(--border);flex-shrink:0; }

#ch-autoplay-row, #ch-bullet-row {
    display:flex;justify-content:space-between;align-items:center;
    padding:13px 18px;
}
#ch-bullet-row { border-top: 1px solid var(--border); }
#ch-ap-left, #ch-bullet-left { display:flex;align-items:center;gap:9px; }
#ch-ap-indicator, #ch-bullet-indicator {
    width:8px;height:8px;border-radius:50%;
    background:#475569;transition:background .3s,box-shadow .3s;
}
#ch-ap-indicator.active { background:#0df5a3;box-shadow:0 0 8px rgba(13,245,163,0.7); }
#ch-bullet-indicator.active { background:#eab308;box-shadow:0 0 8px rgba(234,179,8,0.7); }
#ch-ap-label, #ch-bullet-label { font-size:13px;font-weight:600;color:var(--text); }
#ch-toggle-wrap, #ch-bullet-toggle-wrap { position:relative;display:inline-block;width:40px;height:21px;cursor:pointer; }
#ch-toggle-wrap input, #ch-bullet-toggle-wrap input { display:none; }
#ch-track, #ch-bullet-track {
    position:absolute;inset:0;background:rgba(255,255,255,0.06);
    border-radius:12px;transition:background .25s;
    border:1px solid var(--border);
}
#ch-toggle-wrap input:checked ~ #ch-track { background:#05a873; }
#ch-bullet-toggle-wrap input:checked ~ #ch-bullet-track { background:#eab308; }
#ch-thumb, #ch-bullet-thumb {
    position:absolute;top:2px;left:3px;
    width:15px;height:15px;border-radius:50%;
    background:#64748b;transition:transform .25s cubic-bezier(.175,.885,.32,1.2),background .25s;
}
#ch-toggle-wrap input:checked ~ #ch-track #ch-thumb,
#ch-bullet-toggle-wrap input:checked ~ #ch-bullet-track #ch-bullet-thumb { transform:translateX(18px);background:#fff; }

#ch-elo-section { padding:16px 20px; }
#ch-elo-top { display:flex;justify-content:space-between;align-items:baseline;margin-bottom:11px; }
#ch-elo-tier { font-size:12px;font-weight:700;color:var(--text-sub); }
#ch-elo-num {
    font-size:14px;font-weight:600;
    color:#0df5a3;text-shadow:0 0 6px rgba(13,245,163,0.3);
}
#ch-root.sf-theme #ch-elo-num, #ch-root.rage-active #ch-elo-num {
    color:#ff3366;text-shadow:0 0 6px rgba(255,51,102,0.3);
}
#ch-elo-bar-wrap { position:relative;height:18px;display:flex;align-items:center;margin-bottom:6px; }
#ch-elo-bar-fill {
    position:absolute;left:0;top:50%;transform:translateY(-50%);
    height:4px;background:#0df5a3;border-radius:2px;
    width:60%;transition:width .15s;pointer-events:none;z-index:1;
    box-shadow:0 0 8px rgba(13,245,163,0.4);
}
#ch-root.sf-theme #ch-elo-bar-fill, #ch-root.rage-active #ch-elo-bar-fill {
    background:#ff3366;box-shadow:0 0 8px rgba(255,51,102,0.4);
}
#ch-elo-range {
    position:relative;width:100%;z-index:2;
    -webkit-appearance:none;appearance:none;
    height:4px;background:var(--border);border-radius:2px;
    outline:none;cursor:pointer;background:transparent;
}
#ch-elo-range::-webkit-slider-thumb {
    -webkit-appearance:none;width:14px;height:14px;border-radius:50%;
    background:#0df5a3;cursor:pointer;
    box-shadow:0 0 0 3px rgba(13,245,163,0.25);transition:transform .12s;
}
#ch-root.sf-theme #ch-elo-range::-webkit-slider-thumb, 
#ch-root.rage-active #ch-elo-range::-webkit-slider-thumb {
    background:#ff3366;box-shadow:0 0 0 3px rgba(255,51,102,0.25);
}
#ch-elo-range::-webkit-slider-thumb:hover {
    transform:scale(1.2);box-shadow:0 0 0 5px rgba(13,245,163,0.35);
}
#ch-elo-ends { display:flex;justify-content:space-between;font-size:9px;font-weight:700;color:var(--text-muted);margin-top:2px; }

#ch-log-section, #ch-history-section { padding:12px 18px; }
#ch-log-header, #ch-history-header {
    display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;
}
#ch-log-header span, #ch-history-header span {
    font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);font-weight:800;
}
#ch-log-clear {
    font-size:10px;font-weight:700;background:none;border:none;color:var(--text-muted);cursor:pointer;
    padding:2px 6px;border-radius:6px;transition:color .15s,background .15s;
}
#ch-log-clear:hover { color:var(--text-sub);background:var(--bg-item); }
#ch-log-list, #ch-history-list { display:flex;flex-direction:column;gap:5px;min-height:22px; }
.ch-log-empty, .ch-history-empty { font-size:11px;color:var(--text-muted);font-style:italic; }
.ch-log-row, .ch-history-row {
    display:flex;align-items:center;gap:6px;padding:3px 0;
    opacity:.6;transition:opacity .2s;
}
.ch-log-row.latest { opacity:1; }
.ch-log-move, .ch-history-color { font-size:12px;font-weight:600;color:var(--text); }
.ch-log-tag, .ch-history-res {
    font-size:9px;font-weight:800;padding:2px 6px;border-radius:4px;text-transform:uppercase;letter-spacing:.04em;
}
.ch-log-tag.book { background:rgba(59,130,246,0.12);color:#60a5fa; }
.ch-log-phase { font-size:10px;color:var(--text-muted);margin-left:auto;font-weight:600; }

.ch-history-row { opacity: 0.95; border-bottom: 1px solid rgba(255, 255, 255, 0.02); padding-bottom: 5px; }
.ch-history-row:last-child { border-bottom: none; }
.ch-history-res.win { background:rgba(13,245,163,0.12);color:#0df5a3; }
.ch-history-res.loss { background:rgba(255,51,102,0.12);color:#ff3366; }
.ch-history-res.draw { background:rgba(234,179,8,0.12);color:#eab308; }
.ch-history-color { font-size:11px; font-weight:600; }
.ch-history-elo { font-size:11px;color:var(--text-sub);margin-left:8px; }
.ch-history-date { font-size:10px;color:var(--text-muted);margin-left:auto;font-weight:500; }

#ch-actions { display:flex;gap:10px;padding:12px 18px; }
.ch-action {
    flex:1;padding:11px 0;border-radius:12px;font-family:inherit;
    font-size:12px;font-weight:700;cursor:pointer;
    display:flex;align-items:center;justify-content:center;gap:6px;
    transition:all .18s ease-in-out;border:none;
    background:var(--btn-mode-bg);color:#fff;
    box-shadow:0 4px 14px var(--btn-mode-shadow);
}
.ch-action:hover {
    transform:translateY(-1px);
    box-shadow:0 6px 18px var(--btn-mode-shadow);
}
.ch-action:disabled { opacity:.4;pointer-events:none; }
.ch-action-outline {
    background:rgba(255,255,255,0.05);color:var(--text-sub);
    box-shadow:none;border:1px solid var(--border);
}
.ch-action-outline:hover { background:rgba(255,255,255,0.1);color:var(--text);transform:translateY(-1px);box-shadow:none; }

#ch-think-bar { height:3px;background:transparent;opacity:0;transition:opacity .3s;overflow:hidden; }
#ch-think-fill {
    height:100%;width:0;background:linear-gradient(90deg,transparent,var(--border-glow),transparent);
    animation:thinking 1.4s ease-in-out infinite;animation-play-state:paused;
}
@keyframes thinking {
    0%   { width:0;margin-left:0; }
    50%  { width:60%;margin-left:20%; }
    100% { width:0;margin-left:100%; }
}

#ch-guide-accordion { margin: 4px 18px 14px; background: var(--bg-strip); }
#ch-guide-toggle {
    width: 100%;padding: 11px 14px;background: none;border: none;
    display: flex;justify-content: space-between;align-items: center;
    color: var(--text-sub);font-size: 11px;font-weight: 700;
    cursor: pointer;text-transform: uppercase;letter-spacing: .05em;
    transition: color 0.15s;
}
#ch-guide-toggle:hover { color: var(--text); }
#ch-guide-arrow { font-size: 9px;transition: transform 0.25s ease;color: var(--text-muted); }
#ch-guide-content {
    padding: 0 14px 12px;font-size: 11px;line-height: 1.5;
    color: var(--text-sub);display: flex;flex-direction: column;gap: 8px;
    text-align: left;border-top: 1px dashed var(--border);padding-top: 10px;
}
#ch-guide-content p { margin: 0; }
#ch-guide-content strong { color: var(--text); }
#ch-guide-content .warning-text {
    color: #fca5a5;background: rgba(239, 68, 68, 0.05);
    padding: 8px;border-radius: 8px;border: 1px solid rgba(239, 68, 68, 0.1);
}

#ch-footer {
    display: flex;justify-content: center;align-items: center;
    padding: 11px 18px 14px;border-top: 1px solid var(--border);
    background: var(--bg-strip);
}
#ch-github-link {
    display: flex;align-items: center;gap: 8px;
    text-decoration: none;color: var(--text-sub);
    font-size: 11px;font-weight: 600;
    transition: color 0.15s ease, transform 0.15s ease;
}
#ch-github-link:hover { color: var(--text);transform: scale(1.02); }
#ch-github-icon { width: 14px;height: 14px;filter: invert(var(--git-invert));transition: filter 0.3s;pointer-events: none; }

.settings-scroll-box {
    max-height:350px;overflow-y:auto;padding:18px 20px;
    display:flex;flex-direction:column;gap:16px;
}
.settings-scroll-box::-webkit-scrollbar { width: 5px; }
.settings-scroll-box::-webkit-scrollbar-track { background: transparent; }
.settings-scroll-box::-webkit-scrollbar-thumb { background: var(--border);border-radius: 10px; }
.settings-scroll-box::-webkit-scrollbar-thumb:hover { background: var(--border-glow); }

.settings-group {
    display:flex;flex-direction:column;gap:9px;
    border-bottom:1px solid var(--border);padding-bottom:14px;
}
.settings-group:last-child { border-bottom:none; }
.settings-label {
    font-size:11px;font-weight:800;text-transform:uppercase;
    color:var(--text-muted);letter-spacing:.06em;margin-bottom:4px;
}
.settings-select {
    width:100%;padding:9px 12px;background:rgba(0,0,0,0.15);
    border:1px solid var(--border);border-radius:12px;
    color:var(--text);font-size:13px;font-weight:600;
    outline:none;cursor:pointer;transition:border-color 0.2s;
}
.settings-select:hover { border-color:var(--border-glow); }
.settings-select option { background: #0c0d12;color: #fff; }
.light-theme .settings-select option { background: #f5f7fc;color: #0f172a; }

.switch-row {
    display:flex;justify-content:space-between;align-items:center;
    font-size:13px;font-weight:600;color:var(--text-sub);
    cursor:pointer;transition:color .12s;
}
.switch-row:hover { color:var(--text); }
.switch-row input[type="checkbox"] {
    width:36px;height:19px;
    -webkit-appearance:none;appearance:none;
    background:rgba(255,255,255,0.06);border-radius:10px;
    position:relative;outline:none;cursor:pointer;
    transition:background .2s;border:1px solid var(--border);
}
.switch-row input[type="checkbox"]:checked { background:#05a873; }
#ch-root.sf-theme .switch-row input[type="checkbox"]:checked, 
#ch-root.rage-active .switch-row input[type="checkbox"]:checked {
    background:#ff3366;
}
.switch-row input[type="checkbox"]::before {
    content:'';position:absolute;width:13px;height:13px;
    border-radius:50%;background:#fff;top:2px;left:2px;
    transition:transform .2s;
}
.switch-row input[type="checkbox"]:checked::before { transform:translateX(17px); }

.slider-header { display:flex;justify-content:space-between;font-size:12px;font-weight:600;color:var(--text-sub); }
.settings-group input[type="range"] {
    -webkit-appearance:none;width:100%;height:3px;background:var(--border);border-radius:2px;outline:none;
}
.settings-group input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance:none;width:12px;height:12px;border-radius:50%;
    background:#0df5a3;cursor:pointer;transition:transform .12s;
}
#ch-root.sf-theme .settings-group input[type="range"]::-webkit-slider-thumb, 
#ch-root.rage-active .settings-group input[type="range"]::-webkit-slider-thumb {
    background:#ff3366;
}
.settings-group input[type="range"]::-webkit-slider-thumb:hover { transform:scale(1.2); }

.stats-grid {
    display:grid;grid-template-columns:1fr 1fr;gap:10px;
    font-size:12px;color:var(--text-sub);font-weight:600;
}
.stats-grid strong { color:var(--text); }

.settings-buttons { display:flex;flex-wrap:wrap;gap:8px; }
.settings-btn {
    flex:1;min-width:96px;padding:9px 0;border-radius:10px;
    border:1px solid var(--border);background:rgba(255,255,255,0.03);
    color:var(--text);font-size:12px;font-weight:600;cursor:pointer;
    transition:background .15s, border-color .15s, transform .12s;
}
.settings-btn:hover { background:rgba(255,255,255,0.06);transform:translateY(-1px); }
.settings-btn:active { transform:translateY(0); }
.settings-btn-danger { border-color:rgba(255,51,102,0.3);color:#fca5a5; }
.settings-btn-danger:hover { background:rgba(255,51,102,0.1);border-color:#ff3366; }

.ch-hl { position:absolute;pointer-events:none;z-index:990;opacity:0.75;width:12.5%;height:12.5%;border-radius:4px; }
.ch-svg { position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1000;filter:drop-shadow(0 3px 6px rgba(0,0,0,.35)); }
.ch-arrow-line { stroke:#0df5a3;stroke-width:1.6;stroke-dasharray:5 3.5;stroke-linecap:round;animation:dash .8s linear infinite; }
#ch-root.sf-theme .ch-arrow-line, #ch-root.rage-active .ch-arrow-line { stroke:#ff3366; }
@keyframes dash { to { stroke-dashoffset:-8.5; } }

/* Analysis Styles */
#ch-analysis-panel { display:flex; flex-direction:column; gap:12px; }
.ch-analysis-promo { font-size:11px; color:var(--text-sub); text-align:center; opacity:0.8; margin:0 0 4px 0; }
.counter-row { padding:3px 6px; border-radius:6px; background:rgba(0,0,0,0.15); border:1px solid var(--border); }
.ch-analysis-move-row { display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:10px; cursor:pointer; transition:all 0.15s ease; animation: slide-in-move 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
.ch-analysis-move-row:hover { background:rgba(255,255,255,0.06); border-color:var(--border-glow); transform:translateY(-0.5px); }
@keyframes slide-in-move {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
}
.ch-analysis-move-row:nth-child(1) { animation-delay: 0.02s; }
.ch-analysis-move-row:nth-child(2) { animation-delay: 0.04s; }
.ch-analysis-move-row:nth-child(3) { animation-delay: 0.06s; }
.ch-analysis-move-row:nth-child(4) { animation-delay: 0.08s; }
.ch-analysis-move-row:nth-child(5) { animation-delay: 0.10s; }
.ch-analysis-move-row:nth-child(6) { animation-delay: 0.12s; }
.ch-analysis-move-row:nth-child(7) { animation-delay: 0.14s; }
.ch-analysis-move-row:nth-child(8) { animation-delay: 0.16s; }
.ch-analysis-move-row:nth-child(9) { animation-delay: 0.18s; }
.ch-analysis-move-row:nth-child(10) { animation-delay: 0.20s; }
.ch-an-move-text { font-size:11px; font-weight:600; color:var(--text); }
.ch-an-move-badge { font-size:9px; font-weight:800; padding:2px 6px; border-radius:4px; text-transform:uppercase; letter-spacing:0.02em; }
.ch-an-move-badge.brilliant { background:rgba(96,165,250,0.15); color:#60a5fa; }
.ch-an-move-badge.best { background:rgba(16,185,129,0.15); color:#10b981; }
.ch-an-move-badge.excellent { background:rgba(5,150,105,0.15); color:#34d399; }
.ch-an-move-badge.good { background:rgba(107,114,128,0.15); color:#9ca3af; }
.ch-an-move-badge.inaccuracy { background:rgba(234,179,8,0.15); color:#fbbf24; }
.ch-an-move-badge.mistake { background:rgba(249,115,22,0.15); color:#fb923c; }
.ch-an-move-badge.blunder { background:rgba(239,68,68,0.15); color:#f87171; }
.ch-an-move-eval { font-size:11px; font-weight:600; color:var(--text-muted); }
`;

function injectStyles() {
    const s = document.createElement('style');
    s.textContent = STYLES;
    document.head.appendChild(s);
}

const toggleSet = (id, key) => {
    $(id).onchange = (e) => {
        appConfig[key] = e.target.checked;
        if (key === 'darkTheme') {
            root.classList.toggle('light-theme', !appConfig.darkTheme);
        }
        if (key === 'sfMode') {
            const isSfActive = appConfig.sfMode && appConfig.rageMode;
            root.classList.toggle('sf-theme', isSfActive);
            bubble.innerHTML = svgKnight();
            const logoEl = $('ch-logo');
            if (logoEl) logoEl.innerHTML = svgKnight();
            
            const avatarGif = $('ch-avatar-gif');
            if (avatarGif) {
                const gifFilename = isSfActive ? 'sf.gif' : (appConfig.lang === 'ru' ? 'ru.gif' : 'uk.gif');
                avatarGif.src = chrome.runtime.getURL(`assets/${gifFilename}`);
            }

            if (isSfActive && !appConfig.muteSfMusic) {
                playSound('sf.mp3');
            } else {
                chrome.runtime.sendMessage({ target: 'background', type: 'STOP_SOUND' });
            }
        }
        if (key === 'muteSfMusic') {
            if (appConfig.muteSfMusic) {
                chrome.runtime.sendMessage({ target: 'background', type: 'STOP_SOUND' });
            } else if (appConfig.sfMode && appConfig.rageMode) {
                playSound('sf.mp3');
            }
        }
        saveSettings();
    };
};

document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();