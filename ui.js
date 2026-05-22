window.chessHelper = { autoPlay: false, debug: false };

const $ = id => document.getElementById(id);

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
        setup_telemetry_sub: "Отправлять полностью анонимную статистику использования?",
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
        confirm_reset: "Вы уверены, что хотите полностью сбросить настройки и статистику?"
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
        confirm_reset: "Are you sure you want to completely reset settings and stats?"
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
    games: 0
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
        if (appConfig.sfMode) root.classList.add('sf-theme');

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
        }

        setInterval(syncColor,  1800);
        setInterval(syncStats,  2200);

        window.addEventListener('ch:thinking', e => onThinking(e.detail));
        window.addEventListener('ch:move',     e => logMove(e.detail));
        window.addEventListener('ch:gameover', e => onGameOverDetected(e.detail));

        document.addEventListener('visibilitychange', () => {
            if (appConfig.sfMode && !appConfig.muteSfMusic) {
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
    const logoFilename = appConfig.sfMode ? 'sf.gif' : 'Knight.png';
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
    
    const gifFilename = appConfig.sfMode ? 'sf.gif' : (appConfig.lang === 'ru' ? 'ru.gif' : 'uk.gif');
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

    <div id="ch-color-strip">
        <div id="ch-color-inner">
            <span id="ch-color-dot"></span>
            <span id="ch-color-text">–</span>
        </div>
        <span id="ch-phase-tag">–</span>
    </div>

    <div id="ch-avatar-section">
        <img src="${gifUrl}" id="ch-avatar-gif" draggable="false" />
    </div>

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

    <div id="ch-elo-section">
        <div id="ch-elo-top">
            <span id="ch-elo-tier">Club Player</span>
            <span id="ch-elo-num">${appConfig.elo}</span>
        </div>
        <div id="ch-elo-bar-wrap">
            <div id="ch-elo-bar-fill"></div>
            <input type="range" id="ch-elo-range" min="1000" max="1500" step="50" value="${appConfig.elo}">
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
        panel.classList.add('open');
        playGreetingSound(); 
    }, 300);
}

async function saveSettings() {
    await chrome.storage.local.set({ appConfig });
    applyConfigToEngine();
}

function applyConfigToEngine() {
    window.chessHelperEngine?.updateConfig({
        preset: appConfig.preset,
        blunders: appConfig.blunders,
        mouseSpeed: appConfig.mouseSpeed,
        thinkVariance: appConfig.thinkVariance,
        randDepthEnabled: appConfig.randDepthEnabled,
        fatigueEnabled: appConfig.fatigueEnabled,
        distractionsEnabled: appConfig.distractionsEnabled,
        ponderingEnabled: appConfig.ponderingEnabled,
        misclicksEnabled: appConfig.misclicksEnabled
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

    const autoplay = $('ch-autoplay');
    autoplay.addEventListener('change', () => {
        window.chessHelper.autoPlay = autoplay.checked;
        $('ch-ap-indicator').classList.toggle('active', autoplay.checked);
        $('ch-ap-label').textContent = autoplay.checked ? t('active') : t('autoplay');
        if (autoplay.checked) window.chessHelperEngine?.trigger();
    });

    const range  = $('ch-elo-range');
    const eloNum = $('ch-elo-num');
    const fill   = $('ch-elo-bar-fill');

    function syncElo() {
        let v   = parseInt(range.value);
        if (isNaN(v)) v = 1300;
        const pct = (v - 1000) / 500 * 100;
        eloNum.textContent     = v;
        $('ch-elo-tier').textContent  = eloTier(v);
        fill.style.width       = `${pct}%`;
        appConfig.elo = v;
        saveSettings();
        window.chessHelperEngine?.setElo(v);
    }
    range.addEventListener('input', syncElo);
    syncElo();

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
            drawArrow(move);
            txt.textContent = `${t('hint')}: ${move.toUpperCase()}`;
            icon.textContent = '✓';
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
    };

    $('ch-log-clear').onclick = () => { moveLog.length = 0; renderLog(); };
}

function loadSettingsView() {
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

    $('slider-blunders').value = Math.round(appConfig.blunders * 100);
    $('slider-speed').value = Math.round(appConfig.mouseSpeed * 10);
    $('slider-variance').value = Math.round(appConfig.thinkVariance * 10);

    syncSlidersUI();

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
                root.classList.toggle('sf-theme', appConfig.sfMode);
                bubble.innerHTML = svgKnight();
                const logoEl = $('ch-logo');
                if (logoEl) logoEl.innerHTML = svgKnight();
                
                const avatarGif = $('ch-avatar-gif');
                if (avatarGif) {
                    const gifFilename = appConfig.sfMode ? 'sf.gif' : (appConfig.lang === 'ru' ? 'ru.gif' : 'uk.gif');
                    avatarGif.src = chrome.runtime.getURL(`assets/${gifFilename}`);
                }

                if (appConfig.sfMode && !appConfig.muteSfMusic) {
                    playSound('sf.mp3');
                }
            }
            if (key === 'muteSfMusic') {
                if (appConfig.muteSfMusic) {
                    chrome.runtime.sendMessage({ target: 'background', type: 'STOP_SOUND' });
                } else if (appConfig.sfMode) {
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

    $('stat-games').textContent = appConfig.games;
    const wr = appConfig.games > 0 ? Math.round((appConfig.wins / appConfig.games) * 100) : 0;
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
                    root.classList.toggle('sf-theme', appConfig.sfMode);
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

function onGameOverDetected(detail) {
    const text = String(detail?.modalText || '').toLowerCase();
    let won = false;
    
    const color = window.chessHelperEngine?.myColor() || 'w';
    
    if (
        text.includes('won') || 
        text.includes('victory') || 
        text.includes('victorious') || 
        text.includes('победа') || 
        text.includes('выиграл') || 
        text.includes('выиграли') || 
        text.includes('победил') || 
        text.includes('вы победили') ||
        (text.includes('white won') && color === 'w') ||
        (text.includes('black won') && color === 'b') ||
        (text.includes('1-0') && color === 'w') ||
        (text.includes('0-1') && color === 'b') ||
        (text.includes('1–0') && color === 'w') || 
        (text.includes('0–1') && color === 'b')    
    ) {
        won = true;
    }

    appConfig.games++;
    if (won) {
        appConfig.wins++;
        if (!appConfig.muteVictorySound) {
            playSound('victory.mp3'); 
        }
    }

    moveLog.length = 0;
    renderLog();
    saveSettings();
    window.chessHelperEngine?.reset();
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
    --bg:#0d0e12;
    --border:rgba(255,255,255,0.06);
    --border-glow:rgba(16,185,129,0.25);
    --text:#fff;
    --text-sub:#a1a1aa;
    --text-muted:#44444c;
    --bg-strip:rgba(255,255,255,0.015);
    --bg-item:rgba(255,255,255,0.03);
}

#ch-root.light-theme {
    --bg:#f4f5f8;
    --border:rgba(0,0,0,0.08);
    --border-glow:rgba(16,185,129,0.4);
    --text:#12131a;
    --text-sub:#52525b;
    --text-muted:#a1a1aa;
    --bg-strip:rgba(0,0,0,0.02);
    --bg-item:rgba(0,0,0,0.04);
}

/* Shadow Fiend Theme variables override */
#ch-root.sf-theme {
    --bg:#08090d;
    --border:rgba(239,68,68,0.08);
    --border-glow:rgba(239,68,68,0.35);
    --text:#fff;
    --text-sub:#f87171;
    --text-muted:#7f1d1d;
    --bg-strip:rgba(239,68,68,0.02);
    --bg-item:rgba(239,68,68,0.04);
}

/* Floating bubble orb */
#ch-bubble {
    position:fixed;width:50px;height:50px;
    background:linear-gradient(135deg,#12131a 0%,#1e202b 100%);
    border:1.5px solid var(--border-glow);
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
    border-color:var(--border-glow);
    transform:scale(1.06);
}
#ch-bubble:active { cursor:grabbing; }

@keyframes pulse-glow {
    0% { box-shadow: 0 0 12px rgba(16,185,129,0.15), 0 8px 32px rgba(0,0,0,0.5); }
    50% { box-shadow: 0 0 25px rgba(16,185,129,0.45), 0 8px 32px rgba(0,0,0,0.5); }
    100% { box-shadow: 0 0 12px rgba(16,185,129,0.15), 0 8px 32px rgba(0,0,0,0.5); }
}

/* SF pulsing animation override */
#ch-root.sf-theme #ch-bubble {
    color:#ef4444;
    animation:pulse-glow-sf 2.5s infinite ease-in-out;
}
@keyframes pulse-glow-sf {
    0% { box-shadow: 0 0 12px rgba(239,68,68,0.15), 0 8px 32px rgba(0,0,0,0.5); }
    50% { box-shadow: 0 0 25px rgba(239,68,68,0.5), 0 8px 32px rgba(0,0,0,0.5); }
    100% { box-shadow: 0 0 12px rgba(239,68,68,0.15), 0 8px 32px rgba(0,0,0,0.5); }
}

/* Onboarding Setup view with smooth slide-up */
.setup-container {
    display:none;
    padding:24px;
    text-align:center;
    opacity:0;
    transform:translateY(12px);
    transition:opacity .35s ease, transform .35s ease;
}
.setup-container.active {
    display:block;
    opacity:1;
    transform:translateY(0);
}
.setup-header {
    margin-bottom:20px;
}
.setup-logo {
    display:inline-block;
    filter:drop-shadow(0 0 8px rgba(16,185,129,0.4));
}
.setup-container h3 {
    margin:10px 0 5px;
    color:var(--text);
    font-size:18px;
    font-weight:700;
}
.setup-title {
    color:var(--text-sub);
    font-size:13px;
    margin-bottom:20px;
    font-weight:500;
}
.setup-title-sub {
    color:var(--text-sub);
    font-size:12px;
    line-height:1.5;
    margin-bottom:24px;
}
.setup-options {
    display:flex;
    flex-direction:column;
    gap:10px;
}
.setup-btn {
    width:100%;
    padding:12px;
    border-radius:10px;
    border:1px solid var(--border);
    background:var(--bg-item);
    color:var(--text);
    font-size:13px;
    font-weight:600;
    cursor:pointer;
    transition:background .2s, border-color .2s;
}
.setup-btn:hover {
    background:rgba(16,185,129,0.1);
    border-color:rgba(16,185,129,0.5);
}
.setup-btn-primary {
    background:#10b981;
    color:#fff;
    border:none;
}
.setup-btn-primary:hover {
    background:#059669;
}

/* Premium panel */
#ch-panel {
    position:fixed;width:300px;
    background:var(--bg);
    border:1px solid var(--border);
    border-radius:20px;
    overflow:hidden;
    pointer-events:none;
    opacity:0;transform:scale(0.93);
    transition:opacity .22s ease,transform .28s cubic-bezier(0.34,1.56,0.64,1);
    box-shadow:0 24px 64px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.03);
}
#ch-panel.open { opacity:1;transform:scale(1);pointer-events:auto; }

/* Fluid view switching */
#ch-main-view, #ch-settings-view {
    transition:opacity 0.22s ease, transform 0.22s ease;
}

#ch-main-view.hidden, #ch-settings-view.hidden, .hidden {
    display:none !important;
}

#ch-header {
    display:flex;justify-content:space-between;align-items:center;
    padding:18px 18px 14px;
    border-bottom:1px solid var(--border);
}
#ch-brand { display:flex;align-items:center;gap:11px; }
#ch-logo { color:#10b981;display:flex;align-items:center;filter:drop-shadow(0 0 4px rgba(16,185,129,0.2)); }
#ch-title { font-size:16px;font-weight:700;color:var(--text);letter-spacing:-.012em; }
#ch-subtitle { font-size:11px;color:var(--text-sub);margin-top:1px;font-weight:500; }
#ch-close, #ch-settings-btn {
    background:none;border:none;cursor:pointer;
    color:var(--text-sub);font-size:13px;padding:5px 7px;border-radius:8px;
    transition:color .15s,background .15s,transform .15s;
}
#ch-close:hover, #ch-settings-btn:hover { color:var(--text);background:var(--bg-item); }
#ch-settings-btn:hover { transform:rotate(25deg); }

/* SF UI Overrides */
#ch-root.sf-theme #ch-logo {
    color:#ef4444;
    filter:drop-shadow(0 0 4px rgba(239,68,68,0.3));
}
#ch-root.sf-theme #ch-ap-indicator.active {
    background:#ef4444;
    box-shadow:0 0 8px rgba(239,68,68,0.6);
}
#ch-root.sf-theme #ch-toggle-wrap input:checked ~ #ch-track {
    background:#ef4444;
}
#ch-root.sf-theme #ch-elo-bar-fill {
    background:#ef4444;
    box-shadow:0 0 6px rgba(239,68,68,0.3);
}
#ch-root.sf-theme #ch-elo-range::-webkit-slider-thumb {
    background:#ef4444;
    box-shadow:0 0 0 3px rgba(239,68,68,0.25);
}
#ch-root.sf-theme .ch-action {
    background:linear-gradient(135deg,#ef4444 0%,#b91c1c 100%);
    box-shadow:0 4px 14px rgba(239,68,68,0.3);
}
#ch-root.sf-theme .ch-action:hover {
    background:linear-gradient(135deg,#b91c1c 0%,#991b1b 100%);
    box-shadow:0 6px 18px rgba(239,68,68,0.45);
}
#ch-root.sf-theme #ch-think-fill {
    background:linear-gradient(90deg,transparent,#ef4444,transparent);
}

#ch-color-strip {
    display:flex;align-items:center;justify-content:space-between;
    padding:11px 18px;
    background:var(--bg-strip);
    border-bottom:1px solid var(--border);
}
#ch-color-inner { display:flex;align-items:center;gap:9px; }
#ch-color-dot {
    width:9px;height:9px;border-radius:50%;background:#3f3f46;
    transition:background .3s,box-shadow .3s;
}
#ch-color-dot.white { background:#fff;box-shadow:0 0 8px rgba(255,255,255,0.7); }
#ch-color-dot.black { background:#18181b;border:1px solid #52525b;box-shadow:none; }
#ch-color-text { font-size:12px;font-weight:600;color:var(--text-sub); }
#ch-phase-tag {
    font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
    padding:3px 9px;border-radius:20px;
    background:var(--bg-item);color:var(--text-muted);
    transition:all .3s;
}
#ch-phase-tag.opening    { background:rgba(59,130,246,.12);color:#60a5fa; }
#ch-phase-tag.middlegame { background:rgba(245,158,11,.12);color:#fbbf24; }
#ch-phase-tag.endgame    { background:rgba(139,92,246,.12);color:#a78bfa; }

/* Секция аватара Shadow Fiend */
#ch-avatar-section {
    display:flex;justify-content:center;align-items:center;
    padding:12px 0;
    background:var(--bg-strip);
    border-bottom:1px solid var(--border);
}
#ch-avatar-gif {
    width:72px;
    height:72px;
    border-radius:50%;
    border:2px solid var(--border-glow);
    object-fit:cover;
    box-shadow:0 0 12px var(--border-glow);
    pointer-events:none;
    user-select:none;
}

#ch-stats {
    display:flex;align-items:center;justify-content:space-around;
    padding:16px 14px;
    border-bottom:1px solid var(--border);
}
.ch-stat { display:flex;flex-direction:column;align-items:center;gap:3px;flex:1; }
.ch-stat-n { font-family:'DM Mono',monospace;font-size:15px;font-weight:600;color:var(--text); }
.ch-stat-n.pos { color:#10b981;text-shadow:0 0 8px rgba(16,185,129,0.15); }
.ch-stat-n.neg { color:#ef4444;text-shadow:0 0 8px rgba(239,68,68,0.15); }

#ch-root.sf-theme .ch-stat-n.pos {
    color:#ef4444;
    text-shadow:0 0 8px rgba(239,68,68,0.22);
}

.ch-stat-l { font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted); }
.ch-stat-div { width:1px;height:28px;background:var(--border);flex-shrink:0; }

#ch-autoplay-row {
    display:flex;justify-content:space-between;align-items:center;
    padding:13px 18px;
    border-bottom:1px solid var(--border);
}
#ch-ap-left { display:flex;align-items:center;gap:9px; }
#ch-ap-indicator {
    width:7px;height:7px;border-radius:50%;
    background:#3f3f46;transition:background .3s,box-shadow .3s;
}
#ch-ap-indicator.active { background:#10b981;box-shadow:0 0 8px rgba(16,185,129,0.6); }
#ch-ap-label { font-size:13px;font-weight:600;color:var(--text); }
#ch-toggle-wrap { position:relative;display:inline-block;width:40px;height:21px;cursor:pointer; }
#ch-toggle-wrap input { display:none; }
#ch-track {
    position:absolute;inset:0;
    background:var(--bg-item);border-radius:11px;
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
    border-bottom:1px solid var(--border);
}
#ch-elo-top { display:flex;justify-content:space-between;align-items:baseline;margin-bottom:11px; }
#ch-elo-tier { font-size:12px;font-weight:700;color:var(--text-sub); }
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
    height:3px;background:var(--border);border-radius:2px;
    outline:none;cursor:pointer;
    background:transparent;
}
#ch-elo-range::-webkit-slider-thumb {
    -webkit-appearance:none;width:14px;height:14px;border-radius:50%;
    background:#10b981;cursor:pointer;
    box-shadow:0 0 0 3px rgba(16,185,129,0.25);
    transition:transform .12s;
}
#ch-elo-range::-webkit-slider-thumb:hover {
    transform:scale(1.2);box-shadow:0 0 0 5px rgba(16,185,129,0.35);
}
#ch-elo-ends { display:flex;justify-content:space-between;font-size:9px;font-weight:600;color:#3f3f46;margin-top:2px; }

#ch-log-section {
    padding:11px 18px 14px;
    border-bottom:1px solid var(--border);
}
#ch-log-header {
    display:flex;justify-content:space-between;align-items:center;
    margin-bottom:10px;
}
#ch-log-header span { font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);font-weight:700; }
#ch-log-clear {
    font-size:10px;font-weight:600;background:none;border:none;color:#3f3f46;cursor:pointer;
    padding:2px 6px;border-radius:5px;transition:color .15s,background .15s;
}
#ch-log-clear:hover { color:var(--text-sub);background:var(--bg-item); }
#ch-log-list { display:flex;flex-direction:column;gap:4px;min-height:22px; }
.ch-log-empty { font-size:11px;color:#3f3f46;font-style:italic; }
.ch-log-row {
    display:flex;align-items:center;gap:6px;padding:2px 0;
    opacity:.55;transition:opacity .2s;
}
.ch-log-row.latest { opacity:1; }
.ch-log-move { font-family:'DM Mono',monospace;font-size:12px;font-weight:600;color:var(--text); }
.ch-log-tag {
    font-size:9px;font-weight:700;padding:1px 5px;border-radius:4px;text-transform:uppercase;letter-spacing:.04em;
}
.ch-log-tag.book { background:rgba(59,130,246,0.15);color:#60a5fa; }
.ch-log-phase { font-size:10px;color:var(--text-muted);margin-left:auto;font-weight:600; }

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
    background:var(--bg-item);color:var(--text-sub);
    box-shadow:none;border:1px solid var(--border);
}
.ch-action-outline:hover { background:rgba(255,255,255,0.08);color:var(--text);transform:translateY(-1px);box-shadow:none; }

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

/* Gear/Settings view specific */
.settings-scroll-box {
    max-height:340px;
    overflow-y:auto;
    padding:18px;
    display:flex;
    flex-direction:column;
    gap:16px;
}
.settings-group {
    display:flex;
    flex-direction:column;
    gap:8px;
    border-bottom:1px solid var(--border);
    padding-bottom:14px;
}
.settings-group:last-child {
    border-bottom:none;
}
.settings-label {
    font-size:11px;
    font-weight:700;
    text-transform:uppercase;
    color:var(--text-muted);
    letter-spacing:.05em;
    margin-bottom:4px;
}
.settings-select {
    width:100%;
    padding:8px 12px;
    background:var(--bg-item);
    border:1.5px solid var(--border);
    border-radius:10px;
    color:var(--text);
    font-size:13px;
    font-weight:600;
    outline:none;
    cursor:pointer;
}
.settings-select option {
    background: #111214;
    color: #fff;
}
.light-theme .settings-select option {
    background: #f4f5f8;
    color: #12131a;
}
.switch-row {
    display:flex;
    justify-content:space-between;
    align-items:center;
    font-size:13px;
    font-weight:600;
    color:var(--text-sub);
    cursor:pointer;
    transition:color .12s;
}
.switch-row:hover {
    color:var(--text);
}
.switch-row input[type="checkbox"] {
    width:34px;
    height:18px;
    -webkit-appearance:none;
    appearance:none;
    background:var(--border);
    border-radius:10px;
    position:relative;
    outline:none;
    cursor:pointer;
    transition:background .2s;
}
.switch-row input[type="checkbox"]:checked {
    background:#10b981;
}
#ch-root.sf-theme .switch-row input[type="checkbox"]:checked {
    background:#ef4444;
}
.switch-row input[type="checkbox"]::before {
    content:'';
    position:absolute;
    width:14px;
    height:14px;
    border-radius:50%;
    background:#fff;
    top:2px;
    left:2px;
    transition:transform .2s;
}
.switch-row input[type="checkbox"]:checked::before {
    transform:translateX(16px);
}
.slider-header {
    display:flex;
    justify-content:space-between;
    font-size:12px;
    font-weight:600;
    color:var(--text-sub);
}
.settings-group input[type="range"] {
    -webkit-appearance:none;
    width:100%;
    height:3px;
    background:var(--border);
    border-radius:2px;
    outline:none;
}
.settings-group input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance:none;
    width:12px;
    height:12px;
    border-radius:50%;
    background:#10b981;
    cursor:pointer;
    transition:transform .12s;
}
#ch-root.sf-theme .settings-group input[type="range"]::-webkit-slider-thumb {
    background:#ef4444;
}
.settings-group input[type="range"]::-webkit-slider-thumb:hover {
    transform:scale(1.2);
}
.stats-grid {
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:10px;
    font-size:12px;
    color:var(--text-sub);
    font-weight:500;
}
.stats-grid strong {
    color:var(--text);
}
.settings-buttons {
    display:flex;
    flex-wrap:wrap;
    gap:8px;
}
.settings-btn {
    flex:1;
    min-width:100px;
    padding:8px 0;
    border-radius:8px;
    border:1.5px solid var(--border);
    background:var(--bg-item);
    color:var(--text);
    font-size:12px;
    font-weight:600;
    cursor:pointer;
    transition:background .15s, border-color .15s, transform .12s;
}
.settings-btn:hover {
    background:rgba(255,255,255,0.06);
    transform:translateY(-1px);
}
.settings-btn:active {
    transform:translateY(0);
}
.settings-btn-danger {
    border-color:rgba(239,68,68,0.3);
    color:#f87171;
}
.settings-btn-danger:hover {
    background:rgba(239,68,68,0.1);
    border-color:#ef4444;
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
#ch-root.sf-theme .ch-arrow-line {
    stroke:#ef4444;
}
@keyframes dash { to { stroke-dashoffset:-8.5; } }
`;

document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();