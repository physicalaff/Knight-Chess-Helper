window.chessHelperStats = {
    async addGame(won, eloChange = 0, finalElo = 0) {
        try {
            const stored = await chrome.storage.local.get(['appConfig']);
            const cfg = stored.appConfig || {};
            
            if (typeof cfg.games !== 'number') cfg.games = 0;
            if (typeof cfg.wins !== 'number') cfg.wins = 0;
            if (!cfg.gameHistory) cfg.gameHistory = [];

            let res = 'DRAW';
            let isWin = false;
            if (won === 'WIN' || won === true) {
                res = 'WIN';
                isWin = true;
            } else if (won === 'LOSS' || won === false) {
                res = 'LOSS';
            }

            cfg.games++;
            if (isWin) {
                cfg.wins++;
            }

            const color = window.chessHelperEngine?.myColor() || 'w';
            
            
            let activeElo = finalElo || cfg.elo || 1300;
            if (!finalElo) {
                try {
                    const eloEl = document.querySelector('.player-bottom .user-tag-rating, .player-bottom-component .user-tag-rating, .player-bottom .player-rating, .board-layout-bottom .user-tag-rating');
                    if (eloEl) {
                        const parsedElo = parseInt(eloEl.textContent.replace(/[^\d]/g, ''));
                        if (!isNaN(parsedElo) && parsedElo > 100) {
                            activeElo = parsedElo;
                        }
                    }
                } catch (_) {}
            }

            
            if (activeElo && activeElo !== cfg.elo) {
                cfg.elo = activeElo;
            }

            cfg.gameHistory.unshift({
                color: color === 'w' ? 'White' : 'Black',
                result: res,
                elo: activeElo,
                eloChange: eloChange,
                date: new Date().toLocaleDateString(cfg.lang === 'ru' ? 'ru-RU' : 'en-US', {
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit'
                })
            });

            if (cfg.gameHistory.length > 8) {
                cfg.gameHistory.length = 8;
            }

            await chrome.storage.local.set({ appConfig: cfg });

            if (window.appConfig) {
                window.appConfig.elo = cfg.elo;
                window.appConfig.games = cfg.games;
                window.appConfig.wins = cfg.wins;
                window.appConfig.gameHistory = cfg.gameHistory;
            }
        } catch (e) {
            console.error('[ch:stats] Failed to save game outcome:', e);
        }
    },

    async getStats() {
        const stored = await chrome.storage.local.get(['appConfig']);
        const cfg = stored.appConfig || {};
        return {
            wins: cfg.wins || 0,
            games: cfg.games || 0,
            history: cfg.gameHistory || []
        };
    }
};