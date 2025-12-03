// Dark Mode Management System
class DarkModeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('blokus-theme') || 'default';
        this.init();
    }

    init() {
        // Apply saved theme on load
        this.applyTheme(this.currentTheme);
        
        // Initialize toggle buttons
        this.initToggleButtons();
        
        // Update UI icons
        this.updateIcons();
    }

    initToggleButtons() {
        // Game page toggle
        const gameToggle = document.getElementById('darkModeToggleGame');
        if (gameToggle) {
            gameToggle.addEventListener('click', () => this.toggleTheme());
        }

    // Landing page toggle (actual ID in template)
    const landingToggle = document.getElementById('theme-toggle');
        if (landingToggle) {
            landingToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'default' : 'dark';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme(theme);
        this.saveTheme(theme);
        this.updateIcons();
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: theme } 
        }));
    }

    applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    // Get reference to game container for background styling
    const gameContainer = document.querySelector('.game-container');
        // Always apply dark mode background on the game container
        // Body background remains skipped on landing page
        if (theme === 'dark') {
            // Body gradient (only effective after landing page)
            if (!document.body.classList.contains('landing-page')) {
                const bodyGradient = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a1a2e 100%)';
                document.body.style.setProperty('background', bodyGradient, 'important');
                document.body.style.setProperty('background-size', '400% 400%', 'important');
                document.body.style.setProperty('animation', 'dark-gradient-animation 30s ease infinite', 'important');
            }
            // Game container always styled
            if (gameContainer) {
                gameContainer.style.setProperty('background', `
                        radial-gradient(circle at 15% 20%, rgba(135, 206, 235, 0.3) 0%, transparent 45%),
                        radial-gradient(circle at 80% 70%, rgba(100, 149, 237, 0.4) 0%, transparent 45%),
                        radial-gradient(circle at 40% 85%, rgba(72, 61, 139, 0.4) 0%, transparent 45%),
                        radial-gradient(circle at 65% 25%, rgba(25, 25, 112, 0.5) 0%, transparent 45%),
                        linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #16213e)
                    `, 'important');
            }
        } else {
            // Remove body dark gradient
            document.body.style.removeProperty('background');
            document.body.style.removeProperty('background-size');
            document.body.style.removeProperty('animation');
            // Always clear game container background
            if (gameContainer) {
                gameContainer.style.removeProperty('background');
            }
        }
        // Force style recalculation
        document.body.offsetHeight;
        
        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.content = theme === 'dark' ? '#1a1a2e' : '#667eea';
        }

    // Also set CSS-level fallback for score gradient so JS-triggered theme changes reflect immediately
    let scoreGradient;
    if (theme === 'dark') scoreGradient = 'linear-gradient(135deg, #FFD700 0%, #FBBF24 50%, #FFA500 100%)';
    else if (theme === 'forest') scoreGradient = 'linear-gradient(135deg, #34d399 0%, #16a34a 100%)';
    else scoreGradient = 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)';
    document.body.style.setProperty('--score-gradient', scoreGradient, 'important');
    // Ghost color variables (theme aware)
    if (theme === 'dark') {
        document.body.style.setProperty('--ghost-border-color', 'rgba(86,176,255,0.95)', 'important');
        document.body.style.setProperty('--ghost-glow-color', 'rgba(86,176,255,0.55)', 'important');
        document.body.style.setProperty('--ghost-fill-color', 'rgba(86,176,255,0.12)', 'important');
    } else if (theme === 'forest') {
        document.body.style.setProperty('--ghost-border-color', 'rgba(34,197,94,0.95)', 'important');
        document.body.style.setProperty('--ghost-glow-color', 'rgba(34,197,94,0.5)', 'important');
        document.body.style.setProperty('--ghost-fill-color', 'rgba(34,197,94,0.12)', 'important');
    } else {
        // Default / light theme: restore original yellow ghost outline
        document.body.style.setProperty('--ghost-border-color', 'rgba(255,229,59,0.95)', 'important');
        document.body.style.setProperty('--ghost-glow-color', 'rgba(255,229,59,0.55)', 'important');
        document.body.style.setProperty('--ghost-fill-color', 'rgba(255,229,59,0.12)', 'important');
    }
    }

    updateIcons() {
    const gameIcon = document.getElementById('darkModeIconGame');
    const iconClass = this.currentTheme === 'dark' ? 'fa-sun' : 'fa-moon';
    const title = this.currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
        // Update game page icon
        if (gameIcon) {
            gameIcon.className = `fas ${iconClass}`;
            const gameBtn = gameIcon.parentElement;
            if (gameBtn) {
                gameBtn.setAttribute('title', title);
                gameBtn.setAttribute('aria-label', title);
                gameBtn.setAttribute('aria-pressed', this.currentTheme === 'dark' ? 'true' : 'false');
            }
        }
        // Update landing page toggle icons
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const moonIcon = themeToggle.querySelector('.icon-moon');
            const sunIcon = themeToggle.querySelector('.icon-sun');
            if (moonIcon && sunIcon) {
                if (this.currentTheme === 'dark') {
                    moonIcon.style.display = 'none';
                    sunIcon.style.display = 'block';
                } else {
                    moonIcon.style.display = 'block';
                    sunIcon.style.display = 'none';
                }
                themeToggle.setAttribute('title', title);
                themeToggle.setAttribute('aria-label', title);
                themeToggle.setAttribute('aria-pressed', this.currentTheme === 'dark' ? 'true' : 'false');
            }
        }
    }

    saveTheme(theme) {
        localStorage.setItem('blokus-theme', theme);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    // System theme detection (optional)
    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'default';
    }

    // Auto-switch based on system preference (optional)
    enableAutoSwitch() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            const systemTheme = e.matches ? 'dark' : 'default';
            this.setTheme(systemTheme);
        });
    }
}

// Initialize Dark Mode Manager
// Initialize Dark Mode on demand
export function initDarkMode() {
    const darkModeManager = new DarkModeManager();
    // Make it globally accessible for debugging
    window.darkModeManager = darkModeManager;
}

// Also export DarkModeManager class if needed
export default DarkModeManager;
