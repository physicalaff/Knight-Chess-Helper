window.chessHelper = { autoPlay: false, debug: false };

const $ = id => document.getElementById(id);

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

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
        analysis_failed: "Ошибка, повторите",
        not_loaded: "Движок спит",
        reset: "Сброс",
        settings: "Настройки",
        telemetry: "Анонимная телеметрия",
        debug_mode: "Debug Overlay в углу",
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
        guide_warn_text: "Использование авто-игры в рейтинговых матчах может привести к блокировке вашего аккаунта. Играйте осторожно!",
        auto_new_game: "Авто новая игра"
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
        analysis_failed: "Failed, retry",
        not_loaded: "Engine asleep",
        reset: "Reset",
        settings: "Settings",
        telemetry: "Anonymous Telemetry",
        debug_mode: "Debug Overlay",
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
        guide_warn_text: "Abusing automated play in rated matches can lead to account bans. Play responsibly!",
        auto_new_game: "Auto New Game"
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
    bulletMode: false,
    autoNewGame: false,
    debugMode: false,
    theme: 'midnight',
    statAnalyses: 0,
    statTotalSearchTime: 0,
    statTotalDepth: 0,
    statMovesPlayed: 0,
    debugCollapsed: false,
    debugTransparent: false,
    debugPos: null,
    statTotalAccuracy: 0,
    statAccuracyCount: 0,
    commandPaletteEnabled: true,
    devVerboseLogs: false,
    devEngineConsole: false,
    devPerformanceMetrics: false,
    devDomInspector: false,
    devExperimentalFeatures: false,
    debugShowBestMove: true,
    debugShowEval: true,
    debugShowFps: true,
    debugShowHumanizer: true,
    debugShowMemory: true,
    activeProfile: 'default',
    profiles: {
        default: { blunders: 0.04, mouseSpeed: 1.0, thinkVariance: 1.0, bulletMode: false },
        blitz: { blunders: 0.02, mouseSpeed: 1.4, thinkVariance: 0.6, bulletMode: false },
        bullet: { blunders: 0.0, mouseSpeed: 2.0, thinkVariance: 0.2, bulletMode: true }
    }
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
            if (appConfig.uiStyle) {
                delete appConfig.uiStyle;
            }
            if (appConfig.sandboxEndTime) {
                delete appConfig.sandboxEndTime;
            }
            if (appConfig.sandboxEnabled) {
                delete appConfig.sandboxEnabled;
            }
            if (appConfig.theme === 'cyber') {
                appConfig.theme = 'midnight';
            }
            await chrome.storage.local.set({ appConfig });
        }

        const sessionData = await chrome.storage.local.get(['sessionActive']);
        if (sessionData.sessionActive) {
            setTimeout(showCrashRecoveryModal, 1000);
        }
        await chrome.storage.local.set({ sessionActive: true });
        window.addEventListener('beforeunload', () => {
            chrome.storage.local.set({ sessionActive: false });
        });

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

        const debugOverlay = el('div', { id: 'ch-debug-overlay', className: 'hidden' });
        root.append(bubble, panel, debugOverlay);
        document.body.appendChild(root);

        applyTheme();
        positionDebugOverlay();
        bindDebugOverlayDrag(debugOverlay);

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

        window.chessHelperIntervals.register('sync_color', syncColor, 1800);
        window.chessHelperIntervals.register('sync_stats', syncStats, 2200);

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

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
                e.preventDefault();
                appConfig.debugMode = !appConfig.debugMode;
                saveSettings();
                const chk = $('set-debug-mode');
                if (chk) chk.checked = appConfig.debugMode;
                applyConfigToEngine();
                updateDebugOverlay();
            }
            if (appConfig.commandPaletteEnabled !== false && e.ctrlKey && e.shiftKey && e.code === 'KeyP') {
                e.preventDefault();
                showCommandPalette();
            }
        });

        fpsLoop();
        window.chessHelperIntervals.register('debug_overlay', updateDebugOverlay, 250);
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
    <div id="ch-rail">
        <span id="ch-logo">${svgKnight()}</span>
        <div id="ch-rail-nav">
            <button class="ch-mode-tab ch-rail-btn${!appConfig.rageMode ? ' active' : ''}" id="tab-mode-regular" title="${t('mode_regular')}" aria-label="${t('mode_regular')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg></button>
            <button class="ch-mode-tab ch-rail-btn${appConfig.rageMode ? ' active' : ''}" id="tab-mode-rage" title="${t('mode_rage')}" aria-label="${t('mode_rage')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg></button>
            <button class="ch-mode-tab ch-rail-btn" id="tab-mode-analysis" title="${appConfig.lang === 'ru' ? 'Анализ' : 'Analysis'}" aria-label="Analysis"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg></button>
            <button class="ch-mode-tab ch-rail-btn" id="tab-mode-developer" title="${appConfig.lang === 'ru' ? 'Разработчик' : 'Developer'}" aria-label="Developer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></button>
        </div>
        <div id="ch-rail-spacer"></div>
        <button class="ch-rail-btn" id="ch-settings-btn" aria-label="Settings" title="${t('settings')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
    </div>
    <div id="ch-content">
        <div id="ch-topbar">
            <div id="ch-brand">
                <div>
                    <div id="ch-title">${t('title')}</div>
                    <div id="ch-subtitle">${t('subtitle')}</div>
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

    <div id="ch-developer-panel" class="hidden" style="padding:12px 18px;display:flex;flex-direction:column;gap:12px;">
        <div class="developer-settings" style="display:flex;flex-direction:column;gap:6px;background:rgba(0,0,0,0.2);border:1px solid var(--border);border-radius:14px;padding:12px;">
            <label class="switch-row" style="font-size:11px;display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;color:var(--text-sub);">
                <span>Verbose Logs</span>
                <input type="checkbox" id="set-dev-verbose-logs">
            </label>
            <label class="switch-row" style="font-size:11px;display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;color:var(--text-sub);">
                <span>Engine Console</span>
                <input type="checkbox" id="set-dev-engine-console">
            </label>
            <label class="switch-row" style="font-size:11px;display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;color:var(--text-sub);">
                <span>Performance Metrics</span>
                <input type="checkbox" id="set-dev-performance-metrics">
            </label>
            <label class="switch-row" style="font-size:11px;display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;color:var(--text-sub);">
                <span>DOM Inspector</span>
                <input type="checkbox" id="set-dev-dom-inspector">
            </label>
            <label class="switch-row" style="font-size:11px;display:flex;justify-content:space-between;align-items:center;color:var(--text-sub);">
                <span>Experimental Features</span>
                <input type="checkbox" id="set-dev-experimental-features">
            </label>
        </div>
        
        <div id="ch-dev-console-container" class="hidden" style="display:flex;flex-direction:column;gap:4px;">
            <div style="font-size:9px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Engine Console</div>
            <div id="ch-dev-console" style="width:100%;height:100px;background:#000;border:1px solid var(--border);border-radius:8px;padding:8px;overflow-y:auto;font-family:monospace;font-size:8px;color:#7C84F2;white-space:pre-wrap;word-break:break-all;">
                <div>Console ready.</div>
            </div>
        </div>
    </div>

    <div id="ch-footer">
        <a href="https://github.com/physicalaff/Knight-Chess-Helper" target="_blank" id="ch-github-link">
            <img src="${githubIconUrl}" id="ch-github-icon" />
            <span>physicalaff/Knight-Chess-Helper</span>
        </a>
    </div>
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
        <div class="settings-group kch-theme-seg">
            <label class="settings-label">${appConfig.lang === 'ru' ? 'Тема' : 'Theme'}</label>
            <div class="kch-seg" id="kch-theme-seg">
                <button type="button" id="kch-theme-dark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> ${appConfig.lang === 'ru' ? 'Тёмная' : 'Dark'}</button>
                <button type="button" id="kch-theme-light"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg> ${appConfig.lang === 'ru' ? 'Светлая' : 'Light'}</button>
            </div>
        </div>

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

        <div class="settings-group">
            <label class="settings-label">${appConfig.lang === 'ru' ? 'Тема оформления' : 'Theme'}</label>
            <select id="set-ui-theme" class="settings-select">
                <option value="midnight">Midnight 🌌</option>
                <option value="minimal">Minimalist 📃</option>
                <option value="system">System Theme 💻</option>
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
            <div class="stats-grid" style="display:grid;grid-template-columns:1fr;gap:6px;">
                <div><span>${t('winrate')}:</span> <strong id="stat-winrate">0%</strong></div>
                <div><span>${appConfig.lang === 'ru' ? 'Игр сыграно' : 'Games played'}:</span> <strong id="stat-games">0</strong></div>
                <div><span>${appConfig.lang === 'ru' ? 'Всего анализов' : 'Total analyses'}:</span> <strong id="stat-analyses-cnt">0</strong></div>
                <div><span>${appConfig.lang === 'ru' ? 'Ср. время поиска' : 'Avg search time'}:</span> <strong id="stat-avg-search">0ms</strong></div>
                <div><span>${appConfig.lang === 'ru' ? 'Ср. глубина расчета' : 'Avg calculation depth'}:</span> <strong id="stat-avg-depth">0</strong></div>
                <div><span>${appConfig.lang === 'ru' ? 'Сыграно ходов' : 'Moves played'}:</span> <strong id="stat-moves-cnt">0</strong></div>
                <div><span>${appConfig.lang === 'ru' ? 'Ср. точность движка' : 'Avg engine accuracy'}:</span> <strong id="stat-avg-accuracy">0%</strong></div>
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
            <label class="switch-row">
                <span>${t('auto_new_game')}</span>
                <input type="checkbox" id="set-auto-new-game">
            </label>
            <label class="switch-row">
                <span>${t('debug_mode')}</span>
                <input type="checkbox" id="set-debug-mode">
            </label>
            <div id="debug-fields-container" class="hidden" style="padding-left:16px;margin-top:4px;display:flex;flex-direction:column;gap:4px;border-left:1px solid var(--border);">
                <label class="switch-row" style="font-size:10px;margin:0;padding:2px 0;">
                    <span>Best Move</span>
                    <input type="checkbox" id="set-debug-best-move">
                </label>
                <label class="switch-row" style="font-size:10px;margin:0;padding:2px 0;">
                    <span>Evaluation</span>
                    <input type="checkbox" id="set-debug-eval">
                </label>
                <label class="switch-row" style="font-size:10px;margin:0;padding:2px 0;">
                    <span>FPS</span>
                    <input type="checkbox" id="set-debug-fps">
                </label>
                <label class="switch-row" style="font-size:10px;margin:0;padding:2px 0;">
                    <span>Humanizer</span>
                    <input type="checkbox" id="set-debug-humanizer">
                </label>
                <label class="switch-row" style="font-size:10px;margin:0;padding:2px 0;">
                    <span>Memory</span>
                    <input type="checkbox" id="set-debug-memory">
                </label>
            </div>
        </div>

        <div class="settings-group">
            <label class="settings-label">${appConfig.lang === 'ru' ? 'Профиль настроек' : 'Settings Profile'}</label>
            <select id="set-profile" class="settings-select">
                <option value="default">Default</option>
                <option value="blitz">Blitz</option>
                <option value="bullet">Bullet</option>
            </select>
            <div style="display:flex;gap:6px;margin-top:6px;">
                <button class="settings-btn" id="btn-save-profile" style="flex:1;font-size:10px;padding:4px 8px;">${appConfig.lang === 'ru' ? 'Сохранить текущий' : 'Save Current'}</button>
            </div>
        </div>

        <div class="settings-group" id="settings-preview-group">
            <label class="settings-label">${appConfig.lang === 'ru' ? 'Предпросмотр движения' : 'Movement Preview'}</label>
            <div id="settings-preview-canvas-container" style="position:relative;width:100%;height:60px;background:rgba(0,0,0,0.25);border:1px solid var(--border);border-radius:12px;overflow:hidden;cursor:pointer;">
                <div id="settings-preview-dot" style="position:absolute;left:10px;top:25px;width:10px;height:10px;background:#7C84F2;border-radius:50%;box-shadow:0 0 8px #7C84F2;transition:transform 0.1s linear;"></div>
                <div style="position:absolute;bottom:4px;right:6px;font-size:8px;color:var(--text-muted);">${appConfig.lang === 'ru' ? 'Кликните для теста' : 'Click to test'}</div>
            </div>
        </div>

        <div class="settings-group">
            <label class="settings-label">${appConfig.lang === 'ru' ? 'Лог ошибок' : 'Error Log'}</label>
            <div id="settings-error-log" style="width:100%;max-height:80px;background:rgba(0,0,0,0.3);border-radius:8px;padding:6px;overflow-y:auto;font-family:monospace;font-size:8px;color:#ff5555;border:1px solid rgba(255,51,102,0.1);white-space:pre-wrap;word-break:break-all;">
                <div style="color:var(--text-muted);">${appConfig.lang === 'ru' ? 'Ошибок не зафиксировано' : 'No errors logged'}</div>
            </div>
            <button class="settings-btn" id="btn-clear-errors" style="margin-top:4px;font-size:9px;padding:2px 6px;">${appConfig.lang === 'ru' ? 'Очистить лог' : 'Clear Log'}</button>
        </div>

        <div class="settings-buttons">
            <button class="settings-btn" id="btn-export">${t('export')}</button>
            <button class="settings-btn" id="btn-import">${t('import')}</button>
            <button class="settings-btn" id="btn-backup-settings">${appConfig.lang === 'ru' ? 'Бэкап' : 'Backup'}</button>
            <button class="settings-btn" id="btn-restore-settings">${appConfig.lang === 'ru' ? 'Восст.' : 'Restore'}</button>
            <button class="settings-btn settings-btn-danger" id="btn-reset-all" style="width:100%;margin-top:4px;">${t('reset_all')}</button>
        </div>
    </div>
</div>

<div id="ch-think-bar">
    <div id="ch-think-fill"></div>
</div>
    `.trim();
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

function bindSetupEvents() {
    $('lang-en').onclick = () => selectLanguage('en');
    $('lang-ru').onclick = () => selectLanguage('ru');
}

function selectLanguage(lang) {
    appConfig.lang = lang;
    const step1 = $('setup-step-1');
    const step2 = $('setup-step-2');
    
    step1.classList.remove('active');
    setTimeout(() => {
        step1.style.display = 'none';
        step2.style.display = 'block';
        setTimeout(() => step2.classList.add('active'), 50);
    }, 250);

    $('telemetry-sub').textContent = TRANSLATIONS[lang].setup_telemetry_sub;
    $('telemetry-yes').textContent = TRANSLATIONS[lang].setup_yes;
    $('telemetry-no').textContent = TRANSLATIONS[lang].setup_no;

    $('telemetry-yes').onclick = () => selectTelemetry(true);
    $('telemetry-no').onclick = () => selectTelemetry(false);
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
    const overlay = document.getElementById('ch-debug-overlay');
    if (overlay) {
        if (appConfig.debugMode) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
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
    $('ch-settings-btn').onclick = async () => {
        switchView('ch-main-view', 'ch-settings-view');
        await loadSettingsView();
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

        const fen = eng.getFEN();

        // No board / no readable position -> genuinely "no game".
        if (!fen) {
            $('ch-hint-btn').disabled = false;
            txt.textContent = t('no_game');
            icon.textContent = '⚠';
            if (hintTimeout) clearTimeout(hintTimeout);
            hintTimeout = setTimeout(() => {
                icon.textContent = '⬡';
                txt.textContent = t('hint');
            }, 2500);
            return;
        }

        let hintResult = null;
        try {
            hintResult = await eng.hint(fen);
        } catch (err) {
            console.error('[ch:ui] hint failed:', err);
            hintResult = null;
        }

        $('ch-hint-btn').disabled = false;

        // eng.hint may return a plain move string (legacy) or an object that
        // distinguishes "engine failed to analyze" from "no move available".
        const move = typeof hintResult === 'string'
            ? hintResult
            : (hintResult && hintResult.best) || null;
        const failed = hintResult && typeof hintResult === 'object' && hintResult.error;

        if (move) {
            if (appConfig.rageMode && appConfig.bulletMode) {
                window.chessHelperEngine?.playInstant(move);
            } else {
                drawArrow(move);
            }
            txt.textContent = `${t('hint')}: ${move.toUpperCase()}`;
            icon.textContent = '✓';
        } else if (failed) {
            // We had a position but Stockfish timed out / errored. Tell the user
            // to retry instead of falsely claiming they aren't in a game.
            txt.textContent = t('analysis_failed');
            icon.textContent = '⚠';
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
            let prevEval = 0.3; 

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

                    const cpl = Math.max(0, -diff * 100); 
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
                        <span class="ch-an-move-text">${esc(m.notation)}</span>
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

    const tabDevEl = $('tab-mode-developer');
    if (tabDevEl) {
        tabDevEl.onclick = () => {
            switchTab('developer');
        };
    }

    const devToggle = (id, key) => {
        const el = $(id);
        if (el) {
            el.checked = !!appConfig[key];
            el.onchange = (e) => {
                appConfig[key] = e.target.checked;
                saveSettings();
                if (key === 'devEngineConsole') {
                    const devConsoleCont = $('ch-dev-console-container');
                    if (devConsoleCont) devConsoleCont.classList.toggle('hidden', !appConfig.devEngineConsole);
                }
            };
        }
    };
    devToggle('set-dev-verbose-logs', 'devVerboseLogs');
    devToggle('set-dev-engine-console', 'devEngineConsole');
    devToggle('set-dev-performance-metrics', 'devPerformanceMetrics');
    devToggle('set-dev-dom-inspector', 'devDomInspector');
    devToggle('set-dev-experimental-features', 'devExperimentalFeatures');

    const devConsoleCont = $('ch-dev-console-container');
    if (devConsoleCont) {
        devConsoleCont.classList.toggle('hidden', !appConfig.devEngineConsole);
    }
}

function switchTab(tab) {
    const tabReg = $('tab-mode-regular');
    const tabRage = $('tab-mode-rage');
    const tabAn = $('tab-mode-analysis');
    const tabDev = $('tab-mode-developer');
    
    if (tabReg && tabRage && tabAn) {
        tabReg.classList.toggle('active', tab === 'regular');
        tabRage.classList.toggle('active', tab === 'rage');
        tabAn.classList.toggle('active', tab === 'analysis');
        if (tabDev) tabDev.classList.toggle('active', tab === 'developer');
    }

    const normalControls = $('ch-normal-controls');
    const analysisPanel = $('ch-analysis-panel');
    const devPanel = $('ch-developer-panel');

    if (tab === 'analysis') {
        if (normalControls) normalControls.classList.add('hidden');
        if (analysisPanel) analysisPanel.classList.remove('hidden');
        if (devPanel) devPanel.classList.add('hidden');
    } else if (tab === 'developer') {
        if (normalControls) normalControls.classList.add('hidden');
        if (analysisPanel) analysisPanel.classList.add('hidden');
        if (devPanel) devPanel.classList.remove('hidden');
    } else {
        if (normalControls) normalControls.classList.remove('hidden');
        if (analysisPanel) analysisPanel.classList.add('hidden');
        if (devPanel) devPanel.classList.add('hidden');
        syncModeUI();
    }
}

async function loadSettingsView() {
    $('set-lang').value = appConfig.lang;
    $('set-preset').value = appConfig.preset;
    $('set-rand-depth').checked = appConfig.randDepthEnabled;
    $('set-fatigue').checked = appConfig.fatigueEnabled;
    $('set-distractions').checked = appConfig.distractionsEnabled;
    $('set-telemetry').checked = appConfig.telemetryEnabled;
    $('set-theme').checked = appConfig.darkTheme;
    (() => {
        const segDark = $('kch-theme-dark'), segLight = $('kch-theme-light');
        const syncSeg = () => {
            if (segDark) segDark.classList.toggle('active', appConfig.darkTheme);
            if (segLight) segLight.classList.toggle('active', !appConfig.darkTheme);
        };
        const applyMode = (dark) => {
            appConfig.darkTheme = dark;
            const chk = $('set-theme'); if (chk) chk.checked = dark;
            root.classList.toggle('light-theme', !dark);
            applyTheme();
            saveSettings();
            syncSeg();
        };
        if (segDark) segDark.onclick = () => applyMode(true);
        if (segLight) segLight.onclick = () => applyMode(false);
        syncSeg();
    })();
    $('set-sf-mode').checked = appConfig.sfMode;
    $('set-pondering').checked = appConfig.ponderingEnabled;
    $('set-misclicks').checked = appConfig.misclicksEnabled;
    $('set-mute-victory').checked = appConfig.muteVictorySound;
    $('set-mute-greeting').checked = appConfig.muteGreetingSound;
    $('set-mute-sf').checked = appConfig.muteSfMusic;
    $('set-auto-new-game').checked = appConfig.autoNewGame;
    $('set-debug-mode').checked = appConfig.debugMode || false;
    $('set-ui-theme').value = appConfig.theme || 'midnight';

    $('ch-bullet-toggle').checked = appConfig.bulletMode;
    $('ch-bullet-indicator').classList.toggle('active', appConfig.bulletMode);
    $('ch-bullet-label').textContent = appConfig.bulletMode ? t('active') : t('bullet_mode');

    $('slider-blunders').value = Math.round(appConfig.blunders * 100);
    $('slider-speed').value = Math.round(appConfig.mouseSpeed * 10);
    $('slider-variance').value = Math.round(appConfig.thinkVariance * 10);

    syncSlidersUI();

    $('set-lang').onchange = async (e) => {
        appConfig.lang = e.target.value;
        await chrome.storage.local.set({ appConfig });
        panel.innerHTML = panelHTML();
        bindEvents();
        syncColor();
        syncModeUI();
        $('ch-main-view').classList.add('hidden');
        $('ch-settings-view').classList.remove('hidden');
        await loadSettingsView();
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

    $('set-ui-theme').onchange = (e) => {
        appConfig.theme = e.target.value;
        applyTheme();
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
            if (key === 'debugMode') {
                const df = $('debug-fields-container');
                if (df) df.classList.toggle('hidden', !appConfig.debugMode);
                updateDebugOverlay();
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
    toggleSet('set-auto-new-game', 'autoNewGame');
    toggleSet('set-debug-mode', 'debugMode');

    const statsData = (await window.chessHelperStats?.getStats()) || { wins: 0, games: 0, history: [] };
    $('stat-games').textContent = statsData.games;
    const wr = statsData.games > 0 ? Math.round((statsData.wins / statsData.games) * 100) : 0;
    $('stat-winrate').textContent = `${wr}%`;

    const analysesCount = appConfig.statAnalyses || 0;
    const movesPlayed = appConfig.statMovesPlayed || 0;
    const avgSearch = analysesCount > 0 ? Math.round((appConfig.statTotalSearchTime || 0) / analysesCount) : 0;
    const avgDepth = analysesCount > 0 ? Math.round((appConfig.statTotalDepth || 0) / analysesCount) : 0;
    const avgAccuracy = appConfig.statAccuracyCount > 0 ? Math.round((appConfig.statTotalAccuracy || 0) / appConfig.statAccuracyCount) : 100;

    $('stat-analyses-cnt').textContent = analysesCount;
    $('stat-avg-search').textContent = `${avgSearch}ms`;
    $('stat-avg-depth').textContent = avgDepth;
    $('stat-moves-cnt').textContent = movesPlayed;
    $('stat-avg-accuracy').textContent = `${avgAccuracy}%`;

    $('set-debug-best-move').checked = appConfig.debugShowBestMove !== false;
    $('set-debug-eval').checked = appConfig.debugShowEval !== false;
    $('set-debug-fps').checked = appConfig.debugShowFps !== false;
    $('set-debug-humanizer').checked = appConfig.debugShowHumanizer !== false;
    $('set-debug-memory').checked = appConfig.debugShowMemory !== false;

    toggleSet('set-debug-best-move', 'debugShowBestMove');
    toggleSet('set-debug-eval', 'debugShowEval');
    toggleSet('set-debug-fps', 'debugShowFps');
    toggleSet('set-debug-humanizer', 'debugShowHumanizer');
    toggleSet('set-debug-memory', 'debugShowMemory');

    $('debug-fields-container').classList.toggle('hidden', !appConfig.debugMode);

    $('set-profile').value = appConfig.activeProfile || 'default';
    $('set-profile').onchange = (e) => {
        appConfig.activeProfile = e.target.value;
        const prof = appConfig.profiles[appConfig.activeProfile];
        if (prof) {
            appConfig.blunders = prof.blunders;
            appConfig.mouseSpeed = prof.mouseSpeed;
            appConfig.thinkVariance = prof.thinkVariance;
            appConfig.bulletMode = prof.bulletMode;
            applyConfigToEngine();
            loadSettingsView();
        }
        saveSettings();
    };

    $('btn-save-profile').onclick = () => {
        const active = appConfig.activeProfile || 'default';
        appConfig.profiles[active] = {
            blunders: appConfig.blunders,
            mouseSpeed: appConfig.mouseSpeed,
            thinkVariance: appConfig.thinkVariance,
            bulletMode: appConfig.bulletMode
        };
        saveSettings();
        showNotification('Profile updated successfully', 'success');
    };

    const previewBox = $('settings-preview-canvas-container');
    const previewDot = $('settings-preview-dot');
    if (previewBox && previewDot) {
        previewBox.onclick = () => {
            let start = null;
            const duration = 1500 / (appConfig.mouseSpeed || 1);
            const wobbleAmt = (appConfig.thinkVariance || 1) * 8;
            function animatePreview(timestamp) {
                if (!start) start = timestamp;
                const progress = (timestamp - start) / duration;
                if (progress < 1) {
                    const x = 10 + progress * (previewBox.clientWidth - 30);
                    const y = 25 + Math.sin(progress * Math.PI * 6) * wobbleAmt * Math.sin(progress * Math.PI);
                    previewDot.style.left = `${x}px`;
                    previewDot.style.top = `${y}px`;
                    requestAnimationFrame(animatePreview);
                } else {
                    previewDot.style.left = '10px';
                    previewDot.style.top = '25px';
                }
            }
            requestAnimationFrame(animatePreview);
        };
    }

    const errorLogEl = $('settings-error-log');
    if (errorLogEl) {
        const errors = window.chessHelperErrors || [];
        if (errors.length > 0) {
            errorLogEl.innerHTML = errors.map(e => `[${esc(e.time)}] ${esc(e.message)}`).join('<br>');
        }
    }
    $('btn-clear-errors').onclick = () => {
        window.chessHelperErrors = [];
        if (errorLogEl) errorLogEl.innerHTML = `<div style="color:var(--text-muted);">${appConfig.lang === 'ru' ? 'Ошибок не зафиксировано' : 'No errors logged'}</div>`;
    };

    $('btn-backup-settings').onclick = async () => {
        try {
            await chrome.storage.local.set({ appConfigBackup: appConfig });
            showNotification('Settings backup created', 'success');
        } catch (e) {
            console.error(e);
        }
    };
    $('btn-restore-settings').onclick = async () => {
        try {
            const data = await chrome.storage.local.get(['appConfigBackup']);
            if (data.appConfigBackup) {
                appConfig = data.appConfigBackup;
                await chrome.storage.local.set({ appConfig });
                applyConfigToEngine();
                await loadSettingsView();
                showNotification('Settings backup restored', 'success');
            } else {
                showNotification('No backup found', 'error');
            }
        } catch (e) {
            console.error(e);
        }
    };

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
                    if (parsed && typeof parsed === 'object') {
                        if (typeof parsed.elo === 'number' && !isNaN(parsed.elo)) appConfig.elo = parsed.elo;
                        if (typeof parsed.blunders === 'number' && !isNaN(parsed.blunders)) appConfig.blunders = parsed.blunders;
                        if (typeof parsed.mouseSpeed === 'number' && !isNaN(parsed.mouseSpeed)) appConfig.mouseSpeed = parsed.mouseSpeed;
                        if (typeof parsed.thinkVariance === 'number' && !isNaN(parsed.thinkVariance)) appConfig.thinkVariance = parsed.thinkVariance;
                        if (typeof parsed.games === 'number' && !isNaN(parsed.games)) appConfig.games = parsed.games;
                        if (typeof parsed.wins === 'number' && !isNaN(parsed.wins)) appConfig.wins = parsed.wins;
                        if (typeof parsed.lang === 'string') appConfig.lang = parsed.lang;
                        if (typeof parsed.preset === 'string') appConfig.preset = parsed.preset;
                        if (typeof parsed.telemetryEnabled === 'boolean') appConfig.telemetryEnabled = parsed.telemetryEnabled;
                        if (typeof parsed.randDepthEnabled === 'boolean') appConfig.randDepthEnabled = parsed.randDepthEnabled;
                        if (typeof parsed.fatigueEnabled === 'boolean') appConfig.fatigueEnabled = parsed.fatigueEnabled;
                        if (typeof parsed.distractionsEnabled === 'boolean') appConfig.distractionsEnabled = parsed.distractionsEnabled;
                        if (typeof parsed.ponderingEnabled === 'boolean') appConfig.ponderingEnabled = parsed.ponderingEnabled;
                        if (typeof parsed.misclicksEnabled === 'boolean') appConfig.misclicksEnabled = parsed.misclicksEnabled;
                        if (typeof parsed.sfMode === 'boolean') appConfig.sfMode = parsed.sfMode;
                        if (typeof parsed.muteVictorySound === 'boolean') appConfig.muteVictorySound = parsed.muteVictorySound;
                        if (typeof parsed.muteGreetingSound === 'boolean') appConfig.muteGreetingSound = parsed.muteGreetingSound;
                        if (typeof parsed.muteSfMusic === 'boolean') appConfig.muteSfMusic = parsed.muteSfMusic;
                        if (typeof parsed.darkTheme === 'boolean') appConfig.darkTheme = parsed.darkTheme;
                        if (typeof parsed.rageMode === 'boolean') appConfig.rageMode = parsed.rageMode;
                        if (typeof parsed.bulletMode === 'boolean') appConfig.bulletMode = parsed.bulletMode;
                        if (typeof parsed.autoNewGame === 'boolean') appConfig.autoNewGame = parsed.autoNewGame;
                        if (Array.isArray(parsed.gameHistory)) {
                            // Don't trust the imported array's shape: rebuild
                            // each entry from known fields with coerced types so
                            // a hand-edited file can't smuggle unexpected data
                            // (or huge arrays) into storage and the renderer.
                            appConfig.gameHistory = parsed.gameHistory
                                .slice(0, 8)
                                .filter(g => g && typeof g === 'object')
                                .map(g => ({
                                    color: g.color === 'White' ? 'White' : 'Black',
                                    result: (g.result === 'WIN' || g.result === 'LOSS') ? g.result : 'DRAW',
                                    elo: Number.isFinite(+g.elo) ? Math.round(+g.elo) : 0,
                                    eloChange: Number.isFinite(+g.eloChange) ? Math.round(+g.eloChange) : 0,
                                    date: typeof g.date === 'string' ? g.date.slice(0, 40) : ''
                                }));
                        }
                    }
                    await chrome.storage.local.set({ appConfig });
                    applyConfigToEngine();
                    await loadSettingsView();
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
            <span class="ch-log-move">${esc(m.move.toUpperCase())}</span>
            ${m.book ? `<span class="ch-log-tag book">${t('book')}</span>` : ''}
            <span class="ch-log-phase">${esc(m.phase)}</span>
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
            changeTag = `<span class="ch-history-elo-change ${isPlus ? 'plus' : 'minus'}">${isPlus ? '+' : ''}${parseInt(g.eloChange)}</span>`;
        }

        return `
            <div class="ch-history-row">
                <span class="ch-history-res ${resClass}">${resText}</span>
                <span class="ch-history-color">${colorText}</span>
                <span class="ch-history-elo">⚡ ${parseInt(g.elo)} ${changeTag}</span>
                <span class="ch-history-date">${esc(g.date)}</span>
            </div>
        `;
    }).join('');
}

const uiSleep = ms => new Promise(r => setTimeout(r, ms));
const uiRndInt = (a, b) => Math.floor(a + Math.random() * (b - a));

async function triggerAutoNewGame() {
    if (!appConfig.autoNewGame) return;
    
    console.log('[ch:ui] Auto New Game is enabled. Searching for new game buttons in 3-6s...');
    await uiSleep(uiRndInt(3000, 6000));
    
    if (!appConfig.autoNewGame) return;
    
    const selectors = [
        '.game-over-button-primary',
        '.game-over-button-button',
        '.game-over-buttons-component button',
        '.game-over-buttons-playAgain',
        '[data-action="next-game"]',
        '[data-testid="next-game"]',
        'button.game-over-button',
        '.game-over-modal-container button',
        '.board-modal-container button',
        '.game-over-modal button',
        '.game-over-dialog button',
        '.board-layout-sidebar button',
        '.sidebar-component button'
    ];
    
    const keywords = [
        'play again', 'new opponent', 'next game', 'new game', 'rematch',
        'new 1 min', 'new 3 min', 'new 5 min', 'new 10 min', 'new 15 min', 'new 30 min',
        'сыграть снова', 'новый соперник', 'следующая игра', 'новая игра', 'реванш',
        'новая 1 мин', 'новая 3 мин', 'новая 5 мин', 'новая 10 мин', 'новая 15 мин', 'новая 30 мин'
    ];
    
    for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
            if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
                const text = el.textContent.toLowerCase();
                if (keywords.some(kw => text.includes(kw))) {
                    console.log(`[ch:ui] Found new game button by selector "${sel}": "${el.textContent.trim()}"`);
                    clickElement(el);
                    return;
                }
            }
        }
    }
    
    const allButtons = document.querySelectorAll('button');
    for (const btn of allButtons) {
        if (btn && btn.offsetWidth > 0 && btn.offsetHeight > 0) {
            const text = btn.textContent.toLowerCase();
            if (keywords.some(kw => text.includes(kw))) {
                console.log(`[ch:ui] Found new game button by fallback text search: "${btn.textContent.trim()}"`);
                clickElement(btn);
                return;
            }
        }
    }
    
    console.log('[ch:ui] Could not find any active new game button on the page.');
}

function clickElement(el) {
    try {
        const r = el.getBoundingClientRect();
        const clientX = r.left + r.width/2 + (Math.random()-0.5)*3;
        const clientY = r.top + r.height/2 + (Math.random()-0.5)*3;
        
        el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX, clientY }));
        setTimeout(() => {
            el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX, clientY }));
            el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX, clientY }));
            console.log('[ch:ui] Clicked new game button!');
        }, 150);
    } catch (e) {
        console.error('[ch:ui] Failed to click new game button:', e);
        el.click();
    }
}

function onGameOverDetected(detail) {
    try {
        console.log('[ch:ui] onGameOverDetected triggered:', detail);
        const modalText = String(detail?.modalText || '').toLowerCase();
        const docText = document.body.textContent.toLowerCase();
        
        
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
        let outcome = 'DRAW'; 
        let parsedOutcome = false;

        
        const gameOverContainer = document.querySelector(
            '.game-over-modal-container, .board-modal-container, .game-over-header-component, ' + 
            '.board-modal-modal, .game-over-dialog, .game-over-modal, [data-behavior="game-over-modal"], ' +
            '.game-over-modal-content, .board-layout-sidebar, .sidebar-component, .game-over-sidebar, ' +
            '.game-over-pane, .sidebar-game-over, .live-game-over-component, .game-over-dialog-content, ' +
            '[class*="game-over-modal"], [class*="board-modal"], [data-testid*="game-over"]'
        ) || document;

        
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
        if (appConfig.autoNewGame) {
            triggerAutoNewGame();
        }
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
                fill.style.background = '#7C84F2';
                fill.style.boxShadow = '0 0 12px rgba(124,132,242, 0.65)';
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
            const el = document.querySelector('.player-bottom .clock-time-monospace, .player-bottom .clock-time, .board-layout-bottom .clock-time-monospace, .board-layout-bottom .clock-time');
            if (el) {
                clockEl.textContent = el.textContent.trim().replace(/\s/g, '') || '–';
            } else {
                const times = [...document.querySelectorAll('.clock-time-monospace, .clock-time')];
                const fallbackEl = times[times.length - 1];
                if (fallbackEl) clockEl.textContent = fallbackEl.textContent.trim().replace(/\s/g, '') || '–';
            }
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
    const pw = panel.offsetWidth || 316, ph = panel.offsetHeight || 480, m = 14;
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

function fontFaceCSS() {
    // Local, bundled fonts. Relative url() in an injected content-script <style>
    // resolves against the host page, so we must use chrome.runtime.getURL().
    const f = (file) => chrome.runtime.getURL('assets/fonts/' + file);
    return `
@font-face { font-family:'KCH Sans'; font-style:normal; font-weight:400; font-display:swap; src:url('${f('inter-400.woff2')}') format('woff2'); }
@font-face { font-family:'KCH Sans'; font-style:normal; font-weight:500; font-display:swap; src:url('${f('inter-500.woff2')}') format('woff2'); }
@font-face { font-family:'KCH Sans'; font-style:normal; font-weight:600; font-display:swap; src:url('${f('inter-600.woff2')}') format('woff2'); }
@font-face { font-family:'KCH Sans'; font-style:normal; font-weight:700; font-display:swap; src:url('${f('inter-700.woff2')}') format('woff2'); }
@font-face { font-family:'KCH Mono'; font-style:normal; font-weight:400; font-display:swap; src:url('${f('jbmono-400.woff2')}') format('woff2'); }
@font-face { font-family:'KCH Mono'; font-style:normal; font-weight:500; font-display:swap; src:url('${f('jbmono-500.woff2')}') format('woff2'); }
`;
}

function injectStyles() {
    try {
        const fonts = document.createElement('style');
        fonts.textContent = fontFaceCSS();
        document.head.appendChild(fonts);
    } catch (_) {}

    const s = document.createElement('style');
    s.textContent = STYLES + '\n' + STYLES_V7;
    document.head.appendChild(s);
}

const STYLES = `


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
    box-shadow: none !important;
    background: transparent !important;
    animation: none !important;
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
    0% { box-shadow: 0 0 12px rgba(124,132,242,0.15), 0 8px 32px rgba(0,0,0,0.5); }
    50% { box-shadow: 0 0 25px rgba(124,132,242,0.45), 0 8px 32px rgba(0,0,0,0.5); }
    100% { box-shadow: 0 0 12px rgba(124,132,242,0.15), 0 8px 32px rgba(0,0,0,0.5); }
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
    display:inline-block;filter:drop-shadow(0 0 8px rgba(124,132,242,0.4));
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
    background:rgba(124,132,242,0.1);border-color:rgba(124,132,242,0.5);
}
.setup-btn-primary { background:#05a873;color:#fff;border:none; }
.setup-btn-primary:hover { background:#047857; }

#ch-panel {
    position:fixed;width:316px;
    background:var(--bg);border:1px solid var(--border);
    border-radius:24px;overflow-y:auto;overflow-x:hidden;pointer-events:none;
    max-height:calc(100vh - 40px);
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
#ch-logo { display:flex;align-items:center;filter:drop-shadow(0 0 4px rgba(124,132,242,0.2)); }
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
    box-shadow: 0 6px 24px rgba(124,132,242, 0.05);
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
.ch-stat-n.pos { color:#7C84F2;text-shadow:0 0 8px rgba(124,132,242,0.2); }
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
#ch-ap-indicator.active { background:#7C84F2;box-shadow:0 0 8px rgba(124,132,242,0.7); }
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
    color:#7C84F2;text-shadow:0 0 6px rgba(124,132,242,0.3);
}
#ch-root.sf-theme #ch-elo-num, #ch-root.rage-active #ch-elo-num {
    color:#ff3366;text-shadow:0 0 6px rgba(255,51,102,0.3);
}
#ch-elo-bar-wrap { position:relative;height:18px;display:flex;align-items:center;margin-bottom:6px; }
#ch-elo-bar-fill {
    position:absolute;left:0;top:50%;transform:translateY(-50%);
    height:4px;background:#7C84F2;border-radius:2px;
    width:60%;transition:width .15s;pointer-events:none;z-index:1;
    box-shadow:0 0 8px rgba(124,132,242,0.4);
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
    background:#7C84F2;cursor:pointer;
    box-shadow:0 0 0 3px rgba(124,132,242,0.25);transition:transform .12s;
}
#ch-root.sf-theme #ch-elo-range::-webkit-slider-thumb, 
#ch-root.rage-active #ch-elo-range::-webkit-slider-thumb {
    background:#ff3366;box-shadow:0 0 0 3px rgba(255,51,102,0.25);
}
#ch-elo-range::-webkit-slider-thumb:hover {
    transform:scale(1.2);box-shadow:0 0 0 5px rgba(124,132,242,0.35);
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
.ch-history-res.win { background:rgba(124,132,242,0.12);color:#7C84F2; }
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
    background:#7C84F2;cursor:pointer;transition:transform .12s;
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
.ch-arrow-line { stroke:#7C84F2;stroke-width:1.6;stroke-dasharray:5 3.5;stroke-linecap:round;animation:dash .8s linear infinite; }
#ch-root.sf-theme .ch-arrow-line, #ch-root.rage-active .ch-arrow-line { stroke:#ff3366; }
@keyframes dash { to { stroke-dashoffset:-8.5; } }


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

#ch-debug-overlay {
    position: fixed;
    bottom: 16px;
    left: 16px;
    background: rgba(10, 11, 15, 0.78);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 12px;
    font-family: 'DM Mono', monospace !important;
    font-size: 10px;
    color: var(--text-sub);
    z-index: 999999;
    pointer-events: none;
    box-shadow: 0 12px 40px rgba(0,0,0,0.6);
    backdrop-filter: blur(24px) saturate(180%);
    display: flex;
    flex-direction: column;
    gap: 5px;
    transition: opacity 0.2s ease;
}
#ch-root.light-theme #ch-debug-overlay {
    background: rgba(255, 255, 255, 0.82);
    border: 1px solid rgba(0, 0, 0, 0.08);
    color: var(--text-sub);
    box-shadow: 0 12px 40px rgba(0,0,0,0.15);
}
#ch-debug-overlay.hidden {
    display: none !important;
}
#ch-debug-overlay {
    opacity: 0.85;
    pointer-events: auto !important;
    cursor: grab;
}
#ch-debug-overlay:hover {
    opacity: 1 !important;
    background: rgba(10, 11, 15, 0.92) !important;
}
#ch-root.light-theme #ch-debug-overlay:hover {
    background: rgba(255, 255, 255, 0.95) !important;
}
#ch-debug-overlay.transparent-mode {
    background: rgba(10, 11, 15, 0.15);
    border-color: rgba(255, 255, 255, 0.04);
    opacity: 0.35;
}
#ch-debug-overlay.transparent-mode:hover {
    background: rgba(10, 11, 15, 0.85) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    opacity: 1 !important;
}
#ch-root.light-theme #ch-debug-overlay.transparent-mode {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(0, 0, 0, 0.04);
}
#ch-root.light-theme #ch-debug-overlay.transparent-mode:hover {
    background: rgba(255, 255, 255, 0.9) !important;
    border-color: rgba(0, 0, 0, 0.08) !important;
}

#ch-root.theme-midnight {
    --bg: radial-gradient(circle at 50% 0%, oklch(0.16 0.03 260 / 0.95) 0%, oklch(0.09 0.02 260 / 0.98) 100%);
    --border: oklch(1 0 0 / 0.08);
    --border-glow: oklch(0.55 0.22 280 / 0.45);
    --text: oklch(0.96 0.01 260);
    --text-sub: oklch(0.82 0.03 260);
    --text-muted: oklch(0.55 0.04 260);
    --bg-strip: oklch(1 0 0 / 0.012);
    --bg-item: oklch(1 0 0 / 0.04);
    --btn-mode-bg: linear-gradient(135deg, oklch(0.65 0.22 280) 0%, oklch(0.48 0.18 280) 100%);
    --btn-mode-shadow: oklch(0.65 0.22 280 / 0.35);
}

#ch-root.theme-minimal {
    --bg: #ffffff;
    --border: rgba(0, 0, 0, 0.09);
    --border-glow: #111827;
    --text: #111827;
    --text-sub: #374151;
    --text-muted: #6b7280;
    --bg-strip: rgba(0, 0, 0, 0.02);
    --bg-item: rgba(0, 0, 0, 0.04);
    --btn-mode-bg: #111827;
    --btn-mode-shadow: rgba(0, 0, 0, 0.1);
    --git-invert: 0;
}
@media (prefers-color-scheme: light) {
    #ch-root.theme-system {
        --bg: #ffffff;
        --border: rgba(0, 0, 0, 0.09);
        --border-glow: #111827;
        --text: #111827;
        --text-sub: #374151;
        --text-muted: #6b7280;
        --bg-strip: rgba(0, 0, 0, 0.02);
        --bg-item: rgba(0, 0, 0, 0.04);
        --btn-mode-bg: #111827;
        --btn-mode-shadow: rgba(0, 0, 0, 0.1);
        --git-invert: 0;
    }
}
@media (prefers-color-scheme: dark) {
    #ch-root.theme-system {
        --bg: radial-gradient(circle at 50% 0%, oklch(0.18 0.04 250 / 0.95) 0%, oklch(0.12 0.02 250 / 0.98) 100%);
        --border: oklch(1 0 0 / 0.08);
        --border-glow: oklch(0.86 0.27 150 / 0.35);
        --text: oklch(1 0 0);
        --text-sub: oklch(0.88 0.02 240);
        --text-muted: oklch(0.55 0.03 240);
        --bg-strip: oklch(1 0 0 / 0.015);
        --bg-item: oklch(1 0 0 / 0.05);
        --btn-mode-bg: linear-gradient(135deg, oklch(0.86 0.27 150) 0%, oklch(0.62 0.22 150) 100%);
        --btn-mode-shadow: oklch(0.86 0.27 150 / 0.35);
    }
}

#ch-root.ch-modern-style #ch-panel {
    border-radius: 16px !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    box-shadow: 0 32px 64px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05) !important;
    padding: 20px 0 !important;
}
#ch-root.ch-modern-style #ch-header {
    padding: 12px 24px 16px !important;
}
#ch-root.ch-modern-style .control-card {
    border-radius: 16px !important;
    margin: 8px 24px 4px !important;
    padding: 12px 16px !important;
}
#ch-root.ch-modern-style #ch-actions {
    padding: 12px 24px !important;
}
#ch-root.ch-modern-style #ch-log-section,
#ch-root.ch-modern-style #ch-history-section {
    padding: 12px 24px !important;
}
#ch-root.ch-modern-style #ch-mode-tabs {
    margin: 0 24px 10px !important;
    border-radius: 12px !important;
    padding: 2px !important;
    background: rgba(0,0,0,0.2) !important;
}
#ch-root.ch-modern-style .ch-mode-tab {
    border-radius: 10px !important;
    padding: 8px 10px !important;
}
#ch-notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
}
.ch-toast {
    background: rgba(10, 11, 15, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #fff;
    padding: 10px 16px;
    border-radius: 12px;
    font-family: 'Outfit', sans-serif;
    font-size: 11px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    backdrop-filter: blur(12px);
    opacity: 0;
    transform: translateY(-20px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: auto;
}
.ch-toast.show {
    opacity: 1;
    transform: translateY(0);
}
.ch-toast.info { border-left: 3px solid #60a5fa; }
.ch-toast.success { border-left: 3px solid #7C84F2; }
.ch-toast.error { border-left: 3px solid #ff3366; }
#ch-crash-modal {
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.6);
    z-index: 10000000;
    display: flex;
    align-items: center;
    justify-content: center;
}
#ch-command-palette {
    position: fixed;
    top: 20%;
    left: 50%;
    transform: translate(-50%, 0);
    z-index: 10000000;
}
`;

const STYLES_V7 = `
/* ============================================================
   KNIGHT v7 — Xeno x Linear redesign (override layer)
   Appended last so it wins by source order. Variables flow into
   the existing inline styles; component rules use high specificity.
   ============================================================ */

#ch-root {
    --accent: #7C84F2 !important;
    --accent-soft: rgba(124,132,242,0.16) !important;
    --sans: 'KCH Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    --mono: 'KCH Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace !important;
    /* dark tokens */
    --bg: #0A0A0B !important;
    --border: rgba(255,255,255,0.07) !important;
    --border-glow: #7C84F2 !important;
    --btn-mode-bg: #7C84F2 !important;
    --btn-mode-shadow: rgba(124,132,242,0.30) !important;
    --text: #F5F5F7 !important;
    --text-sub: #9B9BA1 !important;
    --text-muted: #5E5E66 !important;
    --bg-strip: #0E0E10 !important;
    --bg-item: #161618 !important;
    --grid-line: rgba(255,255,255,0.022) !important;
    --git-invert: 1 !important;
}
#ch-root.light-theme {
    --accent: #5E6AD2 !important;
    --accent-soft: rgba(94,106,210,0.12) !important;
    --bg: #FBFBFC !important;
    --border: rgba(15,15,20,0.08) !important;
    --border-glow: #5E6AD2 !important;
    --btn-mode-bg: #5E6AD2 !important;
    --btn-mode-shadow: rgba(94,106,210,0.22) !important;
    --text: #16161A !important;
    --text-sub: #56565E !important;
    --text-muted: #9A9AA2 !important;
    --bg-strip: #F4F4F6 !important;
    --bg-item: #F4F4F6 !important;
    --grid-line: rgba(0,0,0,0.028) !important;
    --git-invert: 0 !important;
}

#ch-root, #ch-root * {
    font-family: var(--sans) !important;
}
#ch-root .ch-stat-n, #ch-root #ch-eval-bar-text, #ch-root #ch-elo-num,
#ch-root .ch-log-move, #ch-root .ch-an-move-eval, #ch-root .ch-acc-val,
#ch-root #ch-opening-eco, #ch-root .ch-history-elo {
    font-family: var(--mono) !important;
}

/* ---- Panel shell ---- */
#ch-root.ch-modern-style #ch-panel,
#ch-root #ch-panel {
    width: 400px !important;
    background: var(--bg) !important;
    border: 1px solid var(--border) !important;
    border-radius: 18px !important;
    padding: 0 !important;
    overflow: hidden !important;
    box-shadow: 0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04) !important;
    backdrop-filter: blur(20px) saturate(140%) !important;
}
#ch-root.light-theme #ch-panel {
    box-shadow: 0 20px 50px rgba(20,20,40,0.14), 0 0 0 1px rgba(15,15,20,0.04) !important;
}

#ch-main-view { display: flex !important; align-items: stretch !important; }

/* ---- Left rail ---- */
#ch-rail {
    flex: 0 0 56px; width: 56px;
    display: flex; flex-direction: column; align-items: center;
    gap: 6px; padding: 14px 0 12px;
    border-right: 1px solid var(--border);
    background: var(--bg-strip);
}
#ch-logo { display:flex; align-items:center; justify-content:center; margin-bottom: 10px; filter:none !important; }
#ch-logo img { width: 30px !important; height: 30px !important; border-radius: 9px; display:block; }
#ch-rail-nav { display:flex; flex-direction:column; gap:6px; align-items:center; }
#ch-rail-spacer { flex: 1 1 auto; min-height: 12px; }
#ch-root .ch-rail-btn {
    all: unset !important; box-sizing: border-box !important;
    width: 38px !important; height: 38px !important;
    display: flex !important; align-items: center !important; justify-content: center !important;
    border-radius: 11px !important; color: var(--text-muted) !important;
    cursor: pointer !important; transition: background .16s ease, color .16s ease !important;
}
#ch-root .ch-rail-btn svg { width: 19px; height: 19px; display:block; }
#ch-root .ch-rail-btn:hover { color: var(--text) !important; background: var(--bg-item) !important; }
#ch-root .ch-rail-btn.active, #ch-root .ch-mode-tab.active {
    background: var(--accent-soft) !important; color: var(--accent) !important; box-shadow: none !important;
}
#ch-settings-btn:hover { transform: none !important; }

/* ---- Content column ---- */
#ch-content {
    flex: 1 1 auto; min-width: 0;
    display: flex; flex-direction: column;
    max-height: calc(100vh - 40px); overflow-y: auto;
    background-image:
        linear-gradient(var(--grid-line) 1px, transparent 1px),
        linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
    background-size: 22px 22px;
}
#ch-topbar {
    display:flex; align-items:center; justify-content:space-between;
    padding: 16px 18px 10px;
}
#ch-brand { gap: 0 !important; }
#ch-title { font-family: var(--sans) !important; font-size: 15px !important; font-weight: 650 !important; letter-spacing: -0.01em !important; color: var(--text) !important; }
#ch-subtitle { display: none !important; }
#ch-close {
    all: unset !important; cursor: pointer !important;
    width: 28px; height: 28px; display:flex; align-items:center; justify-content:center;
    border-radius: 8px; color: var(--text-muted) !important; font-size: 14px;
    transition: background .15s, color .15s;
}
#ch-close:hover { color: var(--text) !important; background: var(--bg-item) !important; }

/* ---- Status pills ---- */
#ch-color-strip {
    border-bottom: none !important; padding: 2px 18px 12px !important;
    gap: 8px; justify-content: flex-start !important; flex-wrap: wrap;
}
#ch-color-inner, #ch-phase-tag {
    background: var(--bg-item) !important; border: 1px solid var(--border) !important;
    border-radius: 999px !important; padding: 6px 12px !important;
    font-size: 11px !important; font-weight: 500 !important; color: var(--text-sub) !important;
    display: inline-flex !important; align-items: center !important; gap: 7px !important;
}
#ch-color-dot { width: 7px !important; height: 7px !important; border-radius: 50% !important; box-shadow: none !important; }

/* ---- Cards (eval / opening / control) ---- */
#ch-opening-card, #ch-eval-bar-wrapper, #ch-root.ch-modern-style .control-card, #ch-root .control-card {
    background: var(--bg-item) !important; border: 1px solid var(--border) !important;
    border-radius: 14px !important; margin: 6px 18px !important; box-shadow: none !important;
}
#ch-eval-bar-wrapper { padding: 14px 16px !important; }
#ch-eval-bar-text { font-size: 24px !important; font-weight: 600 !important; color: var(--text) !important; letter-spacing: -0.01em; }
#ch-eval-bar-track { background: var(--border) !important; }
#ch-eval-bar-fill { background: var(--accent) !important; box-shadow: none !important; }
#ch-opening-eco { background: var(--accent) !important; color: #fff !important; }

/* ---- Stat mini cards ---- */
#ch-stats {
    display: grid !important; grid-template-columns: repeat(4, 1fr); gap: 8px !important;
    margin: 6px 18px !important; padding: 0 !important; background: transparent !important; border: none !important;
}
.ch-stat {
    background: var(--bg-item) !important; border: 1px solid var(--border) !important;
    border-radius: 12px !important; padding: 10px 8px !important;
    display: flex !important; flex-direction: column !important; align-items: flex-start !important; gap: 4px !important;
}
.ch-stat-div { display: none !important; }
.ch-stat-n { font-size: 15px !important; font-weight: 600 !important; color: var(--text) !important; }
.ch-stat-l { font-size: 8.5px !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; color: var(--text-muted) !important; font-weight: 600 !important; }

/* ---- Autoplay toggle row ---- */
#ch-track { background: var(--border) !important; }
#ch-autoplay:checked + #ch-track, #ch-bullet-toggle:checked + #ch-bullet-track { background: var(--accent) !important; }
#ch-ap-label, #ch-bullet-label { color: var(--text) !important; font-weight: 500 !important; }
#ch-ap-indicator, #ch-bullet-indicator { background: var(--accent) !important; }

/* ---- ELO ---- */
#ch-elo-section { background: var(--bg-item) !important; border: 1px solid var(--border) !important; border-radius: 14px !important; margin: 6px 18px !important; padding: 12px 14px !important; }
#ch-elo-num { color: var(--accent) !important; }
#ch-elo-bar-fill { background: var(--accent) !important; }
#ch-elo-range::-webkit-slider-thumb { background: var(--accent) !important; }

/* ---- Log + history rows (Linear activity style) ---- */
#ch-root.ch-modern-style #ch-log-section, #ch-root.ch-modern-style #ch-history-section { padding: 8px 18px !important; }
#ch-log-header, #ch-history-header { color: var(--text-muted) !important; font-size: 9px !important; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700 !important; }
#ch-log-clear { color: var(--text-muted) !important; background: transparent !important; border: none !important; }
#ch-log-clear:hover { color: var(--accent) !important; }
.ch-log-row, .ch-history-row {
    background: transparent !important; border: none !important; border-bottom: 1px solid var(--border) !important;
    border-radius: 0 !important; padding: 9px 4px !important; display: flex; align-items: center; gap: 10px;
}
.ch-log-row:last-child, .ch-history-row:last-child { border-bottom: none !important; }
.ch-log-move { color: var(--text) !important; font-weight: 600 !important; }
.ch-log-phase, .ch-log-tag { color: var(--text-muted) !important; }
.ch-log-empty, .ch-history-empty { color: var(--text-muted) !important; }

/* ---- Action buttons ---- */
#ch-root.ch-modern-style #ch-actions { padding: 12px 18px !important; gap: 10px; }
#ch-root .ch-action {
    border-radius: 12px !important; font-weight: 600 !important; font-size: 13px !important;
    background: var(--accent) !important; color: #fff !important; border: none !important; box-shadow: none !important;
    transition: filter .15s, background .15s !important;
}
#ch-root.light-theme .ch-action { color: #fff !important; }
#ch-root .ch-action:hover { filter: brightness(1.08) !important; }
#ch-root .ch-action.ch-action-outline {
    background: var(--bg-item) !important; color: var(--text) !important; border: 1px solid var(--border) !important;
}
#ch-root .ch-action.ch-action-outline:hover { background: var(--border) !important; filter: none !important; }
#ch-hint-icon { color: rgba(255,255,255,0.85) !important; }

/* ---- Guide accordion ---- */
#ch-guide-toggle { color: var(--text-sub) !important; background: transparent !important; }
#ch-guide-content { color: var(--text-sub) !important; }

/* ---- Footer ---- */
#ch-footer { border-top: 1px solid var(--border) !important; padding: 12px 18px !important; }
#ch-github-link { color: var(--text-muted) !important; font-size: 11px !important; }
#ch-github-link:hover { color: var(--text-sub) !important; }

/* ---- Analysis + developer panels: card surfaces ---- */
.ch-analysis-acc-card, .ch-analysis-counters-grid, .developer-settings, #ch-dev-console {
    background: var(--bg-item) !important; border-color: var(--border) !important;
}
.ch-analysis-promo { color: var(--text-sub) !important; }
.ch-an-move-row, .ch-analysis-move-row { background: var(--bg-item) !important; border: 1px solid var(--border) !important; }

/* ---- Think bar ---- */
#ch-think-fill { background: var(--accent) !important; }

/* ============================================================
   SETTINGS VIEW
   ============================================================ */
#ch-settings-view #ch-header { padding: 16px 20px 14px !important; border-bottom: 1px solid var(--border) !important; }
#ch-settings-view #ch-title { font-size: 16px !important; }
#ch-settings-back { all: unset !important; cursor: pointer !important; width: 28px; height: 28px; display:flex; align-items:center; justify-content:center; border-radius: 8px; color: var(--text-muted) !important; }
#ch-settings-back:hover { color: var(--text) !important; background: var(--bg-item) !important; }
.settings-scroll-box { padding: 14px 18px !important; }
.settings-group { background: transparent !important; margin-bottom: 14px !important; }
.settings-label { color: var(--text-muted) !important; font-size: 10px !important; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700 !important; margin-bottom: 8px !important; }
.settings-select {
    background: var(--bg-item) !important; border: 1px solid var(--border) !important; color: var(--text) !important;
    border-radius: 12px !important; padding: 11px 14px !important; font-size: 13px !important; font-weight: 500 !important;
}
.settings-select option { background: var(--bg-item); color: var(--text); }
.switch-row {
    background: var(--bg-item) !important; border: 1px solid var(--border) !important;
    border-radius: 12px !important; padding: 12px 14px !important; margin-bottom: 8px !important;
    color: var(--text) !important; font-size: 13px !important; font-weight: 500 !important;
    display: flex !important; align-items: center !important; justify-content: space-between !important;
}
.switch-row input[type="checkbox"]:checked { background: var(--accent) !important; }
#ch-root.ch-modern-style .switch-row input[type="checkbox"]:checked,
#ch-root .switch-row input[type="checkbox"]:checked { background: var(--accent) !important; }
.settings-btn {
    background: var(--bg-item) !important; border: 1px solid var(--border) !important; color: var(--text) !important;
    border-radius: 10px !important; font-weight: 600 !important;
}
.settings-btn:hover { background: var(--border) !important; }
.settings-btn-danger { color: #f87171 !important; border-color: rgba(248,113,113,0.3) !important; }
/* Hide the legacy multi-theme selector — monochrome design owns the look */
.settings-group:has(> #set-ui-theme) { display: none !important; }

/* ---- Segmented dark/light theme control built from the existing set-theme row ---- */
.settings-group.kch-theme-seg { display: block !important; }
.kch-seg {
    display: grid; grid-template-columns: 1fr 1fr; gap: 4px;
    background: var(--bg-item); border: 1px solid var(--border); border-radius: 12px; padding: 4px;
}
.kch-seg button {
    all: unset; cursor: pointer; text-align: center; padding: 9px 0;
    border-radius: 9px; font-size: 12px; font-weight: 600; color: var(--text-sub);
    display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: background .15s, color .15s;
}
.kch-seg button svg { width: 14px; height: 14px; }
.kch-seg button.active { background: var(--accent); color: #fff; }
#ch-root.light-theme .kch-seg button.active { background: var(--accent); color: #fff; }

/* ---- Bubble (collapsed launcher) ---- */
#ch-bubble { background: var(--bg) !important; border: 1px solid var(--border) !important; }

/* Hide legacy dark/light checkbox row (replaced by segmented control) */
.switch-row:has(#set-theme) { display: none !important; }

/* ---- Neutralize legacy green accents -> indigo monochrome ---- */
#ch-root .ch-stat-n.pos { color: var(--text) !important; text-shadow: none !important; }
#ch-root .ch-stat-n.neg { color: var(--text) !important; text-shadow: none !important; }
#ch-root #ch-ap-indicator.active, #ch-root #ch-bullet-indicator.active { background: var(--accent) !important; box-shadow: none !important; }
#ch-root #ch-elo-range::-webkit-slider-thumb,
#ch-root .settings-group input[type="range"]::-webkit-slider-thumb,
#ch-root #settings-preview-dot { background: var(--accent) !important; box-shadow: none !important; }
#ch-root #ch-elo-tier { color: var(--accent) !important; text-shadow: none !important; }
#ch-root .ch-arrow-line { stroke: var(--accent) !important; }
#ch-root .ch-history-res.win { background: var(--accent-soft) !important; color: var(--accent) !important; }
#ch-root #ch-think-fill { background: linear-gradient(90deg, transparent, var(--accent), transparent) !important; }
#ch-root #ch-logo { filter: none !important; }

/* ---- Rail/elo safeguards ---- */
#ch-root .ch-rail-btn { flex: 0 0 auto !important; }
#ch-root #ch-elo-bar-fill { box-shadow: none !important; }
#ch-root #ch-elo-range::-webkit-slider-thumb { box-shadow: 0 0 0 3px var(--accent-soft) !important; }

/* ===== Motion & micro-interactions (v7.1) ===== */
#ch-topbar { border-bottom: 1px solid var(--grid-line); }
#ch-hint-btn { box-shadow: 0 6px 18px rgba(124,132,242,.28); transition: transform .15s ease, box-shadow .2s ease, background .2s ease; }
#ch-hint-btn:hover { box-shadow: 0 9px 24px rgba(124,132,242,.42); }
#ch-color-dot { box-shadow: 0 0 0 3px rgba(124,132,242,.12); }
@media (prefers-reduced-motion: no-preference) {
  #ch-normal-controls:not(.hidden),
  #ch-analysis-panel:not(.hidden),
  #ch-developer-panel:not(.hidden),
  #ch-opening-card:not(.hidden) {
    animation: kch-view-in .30s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes kch-view-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

  #ch-content .control-card { transition: transform .22s cubic-bezier(.22,1,.36,1), border-color .22s ease, box-shadow .22s ease !important; }
  #ch-content .control-card:hover { transform: translateY(-2px) !important; box-shadow: 0 10px 26px rgba(0,0,0,.28) !important; }

  #ch-root .ch-rail-btn:active { transform: scale(.9) !important; }
  #ch-root .ch-rail-btn.active { animation: kch-tab-pop .3s cubic-bezier(.22,1,.36,1); }
  @keyframes kch-tab-pop { 0% { transform:scale(.82); } 60% { transform:scale(1.06); } 100% { transform:scale(1); } }

  .ch-action:active, .settings-btn:active { transform: scale(.97) !important; }

  #ch-color-dot { animation: kch-dot 2.6s ease-in-out infinite; }
  @keyframes kch-dot { 0%,100% { opacity:1; } 50% { opacity:.5; } }

  #ch-eval-bar-fill { position: relative; overflow: hidden; }
  #ch-eval-bar-fill::after {
    content:''; position:absolute; inset:0;
    background: linear-gradient(100deg, transparent 35%, rgba(255,255,255,.30) 50%, transparent 65%);
    transform: translateX(-120%);
    animation: kch-sheen 3.6s ease-in-out infinite;
  }
  @keyframes kch-sheen { 0% { transform:translateX(-120%); } 55%,100% { transform:translateX(120%); } }
}

/* ===== Refined menu motion (v8) ===== */
@media (prefers-reduced-motion: no-preference) {
  /* Panel: spring scale + blur-in on open, soft collapse on close */
  #ch-panel {
    transform-origin: top right;
    filter: blur(7px);
    transition:
      opacity .30s cubic-bezier(.16,1,.3,1),
      transform .44s cubic-bezier(.34,1.42,.5,1),
      filter .30s ease,
      display .30s allow-discrete !important;
  }
  #ch-panel.open { filter: blur(0); }
  @starting-style {
    #ch-panel.open { opacity:0; transform:scale(.9) translateY(-8px); filter:blur(10px); }
  }

  /* Brand logo springs in with the panel */
  #ch-panel.open #ch-logo { animation: kch-logo-in .55s cubic-bezier(.34,1.56,.64,1) both; }
  @keyframes kch-logo-in {
    from { opacity:0; transform: rotate(-22deg) scale(.6); }
    to   { opacity:1; transform: rotate(0) scale(1); }
  }

  /* Main <-> Settings crossfade */
  #ch-main-view:not(.hidden), #ch-settings-view:not(.hidden) {
    animation: kch-view-fade .34s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes kch-view-fade {
    from { opacity:0; transform: translateY(10px) scale(.992); }
    to   { opacity:1; transform: none; }
  }

  /* Staggered entrance for list rows (move log / history / analysis) */
  #ch-log-list .ch-log-row,
  #ch-history-list .ch-history-row,
  #ch-analysis-moves-list .ch-analysis-move-row {
    animation: kch-row-in .36s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes kch-row-in {
    from { opacity:0; transform: translateX(-12px); }
    to   { opacity:1; transform: translateX(0); }
  }
  #ch-log-list .ch-log-row:nth-child(1),
  #ch-history-list .ch-history-row:nth-child(1),
  #ch-analysis-moves-list .ch-analysis-move-row:nth-child(1) { animation-delay: .02s; }
  #ch-log-list .ch-log-row:nth-child(2),
  #ch-history-list .ch-history-row:nth-child(2),
  #ch-analysis-moves-list .ch-analysis-move-row:nth-child(2) { animation-delay: .06s; }
  #ch-log-list .ch-log-row:nth-child(3),
  #ch-history-list .ch-history-row:nth-child(3),
  #ch-analysis-moves-list .ch-analysis-move-row:nth-child(3) { animation-delay: .10s; }
  #ch-log-list .ch-log-row:nth-child(4),
  #ch-history-list .ch-history-row:nth-child(4),
  #ch-analysis-moves-list .ch-analysis-move-row:nth-child(4) { animation-delay: .14s; }
  #ch-log-list .ch-log-row:nth-child(5),
  #ch-history-list .ch-history-row:nth-child(5),
  #ch-analysis-moves-list .ch-analysis-move-row:nth-child(5) { animation-delay: .18s; }
  #ch-log-list .ch-log-row:nth-child(n+6),
  #ch-history-list .ch-history-row:nth-child(n+6),
  #ch-analysis-moves-list .ch-analysis-move-row:nth-child(n+6) { animation-delay: .22s; }

  /* Opening card pops when it appears */
  #ch-opening-card:not(.hidden) { animation: kch-pop-in .44s cubic-bezier(.34,1.56,.64,1) both; }
  @keyframes kch-pop-in {
    0%   { opacity:0; transform: scale(.85); }
    60%  { transform: scale(1.03); }
    100% { opacity:1; transform: scale(1); }
  }

  /* Mode tabs: hover lift */
  #ch-root .ch-mode-tab { transition: color .25s, background .25s, transform .2s cubic-bezier(.34,1.56,.64,1) !important; }
  #ch-root .ch-mode-tab:hover { transform: translateY(-1px) !important; }

  /* Bubble: spring hover + press feedback */
  #ch-bubble { transition: transform .26s cubic-bezier(.34,1.56,.64,1), border-color .2s, box-shadow .2s; }
  #ch-bubble:hover { transform: scale(1.1) translateY(-2px); }
  #ch-bubble:active { transform: scale(.93); }

  /* Buttons: subtle lift on hover, press feedback */
  .ch-action, .settings-btn, .setup-btn {
    transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .2s ease, background .2s ease, border-color .2s ease;
  }
  .ch-action:hover, .settings-btn:hover, .setup-btn:hover { transform: translateY(-1px); }
  .ch-action:active, .settings-btn:active, .setup-btn:active { transform: scale(.97); }
}
`;

let fps = 60;
let lastFpsTime = performance.now();
let frameCount = 0;
function fpsLoop() {
    frameCount++;
    const now = performance.now();
    if (now >= lastFpsTime + 1000) {
        fps = Math.round((frameCount * 1000) / (now - lastFpsTime));
        frameCount = 0;
        lastFpsTime = now;
    }
    requestAnimationFrame(fpsLoop);
}

function updateDebugOverlay() {
    const overlay = $('ch-debug-overlay');
    if (!overlay) return;
    if (!appConfig.debugMode) {
        overlay.classList.add('hidden');
        return;
    }
    overlay.classList.remove('hidden');
    
    overlay.classList.toggle('transparent-mode', !!appConfig.debugTransparent);

    const collapseSymbol = appConfig.debugCollapsed ? '+' : '−';
    const transColor = appConfig.debugTransparent ? '#7C84F2' : 'var(--text-muted)';
    
    let headerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;font-weight:800;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:4px;margin-bottom:4px;color:#fff;cursor:grab;user-select:none;gap:12px;">
            <span style="font-family:\'Outfit\',sans-serif;font-size:11px;letter-spacing:0.02em;">♞ DEBUGGER</span>
            <div style="display:flex;gap:6px;align-items:center;">
                <button id="ch-debug-trans-btn" style="background:none;border:none;cursor:pointer;font-size:9px;color:${transColor};padding:2px 4px;font-weight:800;" title="Toggle Transparency">T</button>
                <button id="ch-debug-collapse-btn" style="background:none;border:none;cursor:pointer;font-size:10px;color:#fff;padding:2px 4px;font-weight:800;">${collapseSymbol}</button>
            </div>
        </div>
    `;

    if (appConfig.debugCollapsed) {
        overlay.innerHTML = headerHTML + `<div style="font-size:9px;color:var(--text-muted);">Engine: ${window.chessHelperEngine?.getState()?.thinking ? 'THINK' : 'READY'}</div>`;
        bindOverlayHeaderEvents();
        return;
    }

    const boardFen = window.chessHelperEngine?.getFEN();
    const boardState = boardFen ? 'FOUND' : 'NOT FOUND';
    const engineState = window.chessHelperEngine?.getState();
    const isThinking = engineState?.thinking ? 'THINKING...' : 'READY';
    const mouseSpeed = window.chessHelperMouse?.speed || 1.0;
    const mouseWobble = window.chessHelperMouse?.wobble || 0;
    const activeTimersCount = window.chessHelperIntervals?.intervals?.size || 0;
    const queueSize = engineState?.queueSize || 0;

    let itemsHTML = '';
    
    if (appConfig.debugShowFps !== false) {
        itemsHTML += `<div>FPS: <span style="color:#7C84F2;">${fps}</span></div>`;
    }
    
    itemsHTML += `<div>BOARD: <span style="color:${boardFen ? '#7C84F2' : '#ff3366'};">${boardState}</span></div>`;
    itemsHTML += `<div>ENGINE: <span style="color:${engineState?.thinking ? '#fb923c' : '#7C84F2'};">${isThinking}</span></div>`;
    itemsHTML += `<div>DEPTH: <span style="color:#a855f7;">${engineState?.depth || 0}</span></div>`;
    
    if (appConfig.debugShowBestMove !== false) {
        itemsHTML += `<div>BEST MOVE: <span style="color:#e9d5ff;text-transform:uppercase;">${engineState?.bestMove || '–'}</span></div>`;
    }
    
    if (appConfig.debugShowEval !== false) {
        itemsHTML += `<div>EVAL: <span style="color:#60a5fa;">${engineState?.eval || 0.0}</span></div>`;
    }

    itemsHTML += `<div>MOUSE SPEED: <span style="color:#cbd5e1;">${mouseSpeed}x</span></div>`;
    itemsHTML += `<div>WOBBLE: <span style="color:#cbd5e1;">${mouseWobble}px</span></div>`;

    if (appConfig.debugShowHumanizer !== false) {
        const hState = `Fatigue:${appConfig.fatigueEnabled ? 'ON' : 'OFF'} Distract:${appConfig.distractionsEnabled ? 'ON' : 'OFF'}`;
        itemsHTML += `<div>HUMANIZER: <span style="color:#f472b6;font-size:9px;">${hState}</span></div>`;
    }

    if (appConfig.debugShowMemory !== false) {
        const mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB' : 'N/A';
        itemsHTML += `<div>MEMORY: <span style="color:#cbd5e1;">${mem}</span></div>`;
    }

    itemsHTML += `<div>ACTIVE TIMERS: <span style="color:#cbd5e1;">${activeTimersCount}</span></div>`;
    itemsHTML += `<div>QUEUE SIZE: <span style="color:#cbd5e1;">${queueSize}</span></div>`;
    itemsHTML += `<div>PHASE: <span style="color:#cbd5e1;text-transform:uppercase;">${engineState?.phase || 'unknown'}</span></div>`;

    if (boardFen) {
        itemsHTML += `<div style="font-size:8px;color:var(--text-muted);word-break:break-all;max-width:180px;margin-top:2px;">FEN: ${boardFen.split(' ')[0]}</div>`;
    }

    overlay.innerHTML = headerHTML + itemsHTML;
    bindOverlayHeaderEvents();
}

function applyTheme() {
    if (!root) return;
    root.classList.remove('theme-midnight', 'theme-cyber', 'theme-minimal', 'theme-system', 'ch-modern-style');
    const activeTheme = appConfig.theme || 'midnight';
    root.classList.add(`theme-${activeTheme}`);
    root.classList.add('ch-modern-style');
}

function positionDebugOverlay() {
    const overlay = $('ch-debug-overlay');
    if (!overlay) return;
    if (appConfig.debugPos) {
        overlay.style.bottom = 'auto';
        overlay.style.left = appConfig.debugPos.x + 'px';
        overlay.style.top = appConfig.debugPos.y + 'px';
    } else {
        overlay.style.bottom = '16px';
        overlay.style.left = '16px';
        overlay.style.top = 'auto';
    }
}

function bindDebugOverlayDrag(overlay) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialX = 0, initialY = 0;

    overlay.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = overlay.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        overlay.style.cursor = 'grabbing';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        let nx = initialX + dx;
        let ny = initialY + dy;
        const rect = overlay.getBoundingClientRect();
        nx = Math.max(0, Math.min(window.innerWidth - rect.width, nx));
        ny = Math.max(0, Math.min(window.innerHeight - rect.height, ny));
        overlay.style.bottom = 'auto';
        overlay.style.left = nx + 'px';
        overlay.style.top = ny + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        overlay.style.cursor = 'grab';
        const rect = overlay.getBoundingClientRect();
        appConfig.debugPos = {
            x: rect.left,
            y: rect.top
        };
        saveSettings();
    });
}

function bindOverlayHeaderEvents() {
    const collapseBtn = $('ch-debug-collapse-btn');
    if (collapseBtn) {
        collapseBtn.onclick = (e) => {
            e.stopPropagation();
            appConfig.debugCollapsed = !appConfig.debugCollapsed;
            saveSettings();
            updateDebugOverlay();
        };
    }
    const transBtn = $('ch-debug-trans-btn');
    if (transBtn) {
        transBtn.onclick = (e) => {
            e.stopPropagation();
            appConfig.debugTransparent = !appConfig.debugTransparent;
            saveSettings();
            updateDebugOverlay();
        };
    }
}

function showCrashRecoveryModal() {
    const modal = el('div', { id: 'ch-crash-modal' });
    modal.innerHTML = `
        <div class="ch-crash-content" style="background:rgba(15,16,22,0.95);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:20px;width:260px;box-shadow:0 20px 50px rgba(0,0,0,0.8);backdrop-filter:blur(20px);font-family:\'Outfit\',sans-serif;color:#fff;">
            <div style="font-weight:800;font-size:14px;color:#ff3366;margin-bottom:8px;display:flex;align-items:center;gap:6px;">⚠️ Crash Detected</div>
            <div style="font-size:11px;color:var(--text-sub);margin-bottom:16px;line-height:1.4;">Knight unexpectedly stopped. Restore previous session?</div>
            <div style="display:flex;gap:8px;">
                <button id="btn-crash-restore" style="flex:1;background:#10b981;color:#fff;border:none;border-radius:8px;padding:6px;font-size:11px;font-weight:700;cursor:pointer;">Restore</button>
                <button id="btn-crash-discard" style="flex:1;background:rgba(255,255,255,0.06);color:var(--text-sub);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:6px;font-size:11px;font-weight:700;cursor:pointer;">Discard</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    $('btn-crash-restore').onclick = async () => {
        const data = await chrome.storage.local.get(['appConfigBackup']);
        if (data.appConfigBackup) {
            appConfig = data.appConfigBackup;
            await chrome.storage.local.set({ appConfig });
            applyConfigToEngine();
            await loadSettingsView();
        }
        modal.remove();
        showNotification('Session restored', 'success');
    };
    $('btn-crash-discard').onclick = () => {
        modal.remove();
    };
}

function showCommandPalette() {
    let existing = $('ch-command-palette');
    if (existing) {
        existing.remove();
        return;
    }
    const palette = el('div', { id: 'ch-command-palette' });
    palette.innerHTML = `
        <div class="ch-palette-content" style="background:rgba(15,16,22,0.96);border:1px solid rgba(255,255,255,0.12);border-radius:16px;padding:12px;width:340px;box-shadow:0 24px 64px rgba(0,0,0,0.85);backdrop-filter:blur(24px);font-family:\'Outfit\',sans-serif;color:#fff;">
            <input type="text" id="ch-palette-input" placeholder="Type a command..." style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:8px 12px;font-size:12px;color:#fff;outline:none;font-family:inherit;margin-bottom:8px;" autocomplete="off" />
            <div id="ch-palette-list" style="max-height:200px;overflow-y:auto;display:flex;flex-direction:column;gap:2px;">
            </div>
        </div>
    `;
    document.body.appendChild(palette);
    const input = $('ch-palette-input');
    const list = $('ch-palette-list');
    input.focus();

    const commands = [
        { name: 'Change Theme', action: () => {
            const themes = ['midnight', 'minimal', 'system'];
            const currentIdx = themes.indexOf(appConfig.theme || 'midnight');
            appConfig.theme = themes[(currentIdx + 1) % themes.length];
            applyTheme();
            saveSettings();
            showNotification(`Theme changed to ${appConfig.theme}`, 'success');
        }},
        { name: 'Toggle Debug Overlay', action: () => {
            appConfig.debugMode = !appConfig.debugMode;
            saveSettings();
            applyConfigToEngine();
            updateDebugOverlay();
            showNotification(`Debug overlay ${appConfig.debugMode ? 'opened' : 'closed'}`, 'info');
        }},
        { name: 'Export Settings', action: () => {
            $('btn-export').click();
            showNotification('Settings exported', 'success');
        }},
        { name: 'Enable Human Mode', action: () => {
            appConfig.rageMode = false;
            appConfig.preset = 'intermediate';
            saveSettings();
            syncModeUI();
            showNotification('Human Mode enabled', 'success');
        }},
        { name: 'Reset UI Position', action: () => {
            drag.ox = window.innerWidth - 76;
            drag.oy = 100;
            syncBubble();
            appConfig.debugPos = null;
            positionDebugOverlay();
            saveSettings();
            showNotification('UI position reset', 'info');
        }}
    ];

    let selectedIndex = 0;
    function renderList() {
        const query = input.value.toLowerCase();
        const filtered = commands.filter(c => c.name.toLowerCase().includes(query));
        list.innerHTML = filtered.map((c, i) => `
            <div class="ch-palette-item ${i === selectedIndex ? 'selected' : ''}" data-index="${i}" style="padding:8px 12px;border-radius:8px;font-size:11px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:background 0.1s ease;${i === selectedIndex ? 'background:rgba(255,255,255,0.08);color:#7C84F2;font-weight:700;' : 'color:var(--text-sub);'}">
                <span>> ${c.name}</span>
            </div>
        `).join('');
        const items = list.querySelectorAll('.ch-palette-item');
        items.forEach((item, idx) => {
            item.onclick = () => {
                filtered[idx].action();
                palette.remove();
            };
        });
    }

    renderList();
    input.oninput = () => {
        selectedIndex = 0;
        renderList();
    };

    palette.addEventListener('keydown', (e) => {
        const query = input.value.toLowerCase();
        const filtered = commands.filter(c => c.name.toLowerCase().includes(query));
        if (e.code === 'ArrowDown') {
            e.preventDefault();
            if (!filtered.length) return;
            selectedIndex = (selectedIndex + 1) % filtered.length;
            renderList();
        } else if (e.code === 'ArrowUp') {
            e.preventDefault();
            if (!filtered.length) return;
            selectedIndex = (selectedIndex - 1 + filtered.length) % filtered.length;
            renderList();
        } else if (e.code === 'Enter') {
            e.preventDefault();
            if (filtered[selectedIndex]) {
                filtered[selectedIndex].action();
                palette.remove();
            }
        } else if (e.code === 'Escape') {
            palette.remove();
        }
    });

    document.addEventListener('mousedown', function outsideClick(evt) {
        if (!palette.contains(evt.target)) {
            palette.remove();
            document.removeEventListener('mousedown', outsideClick);
        }
    });
}

function showNotification(message, type = 'info') {
    let container = $('ch-notification-container');
    if (!container) {
        container = el('div', { id: 'ch-notification-container' });
        document.body.appendChild(container);
    }
    const toast = el('div', { className: `ch-toast ${type}` }, message);
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
