// Application bootstrap

// COLOR SCHEME FOR VERSION BADGE
// Each version gets a new color to track refreshes
const VERSION_COLORS = {
    'v2.3': '#ff0000',  // Red
    'v2.4': '#ff7700',  // Orange
    'v2.5': '#ffdd00',  // Yellow
    'v2.6': '#00ff00',  // Green
    'v2.7': '#0088ff',  // Blue
    'v2.8': '#aa00ff',  // Purple
    'v2.9': '#ff00ff',  // Magenta
    'v3.0': '#00ffff',  // Cyan
    'v3.1': '#ff0088',  // Pink
};

// Initialize version badge with color
function initVersionBadge() {
    const versionMeta = document.querySelector('meta[name="app-version"]');
    const version = versionMeta?.getAttribute('content') || 'v0';
    
    const versionNumber = document.getElementById('versionNumber');
    if (versionNumber) {
        versionNumber.textContent = version;
    }
    
    const badge = document.getElementById('versionBadge');
    if (badge) {
        const color = VERSION_COLORS[version] || '#ff0000';
        badge.style.backgroundColor = color;
        badge.style.boxShadow = `0 0 20px rgba(${hexToRgb(color)}, 0.8)`;
    }
}

// Helper to convert hex to rgb for shadow
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
    }
    return '255, 0, 0';
}

// Import core modules (side-effects & initializers)
// Bootstrapping entry point
// Bootstrapping entry point
import { initLanding } from './landing.js';
import { initDarkMode } from './darkMode.js';
import { initGameBackground } from './game-background.js';
import { ColorBurstEffect } from './colorBurst.js';
// Modal manager exposes global handlers
import './modalManager.js';
// Import logger
import * as logger from './logger.js';

// Print logging guide to console
function printLoggingGuide() {
	console.clear();
	console.log('%c🎮 BLOKUS GRID - LOGGING SYSTEM ACTIVE 🎮', 
		'color: #90CAF9; font-size: 18px; font-weight: bold; text-shadow: 0 0 10px rgba(144, 202, 249, 0.8);');
	
	console.group('%c📊 CONSOLE LOGGER COMMANDS', 'color: #FFE66D; font-weight: bold; font-size: 14px;');
	console.log('%cControl Logging:', 'color: #66BB6A; font-weight: bold;');
	console.log('  • logger.LOG_ENABLED = false;          // Disable all logging');
	console.log('  • logger.LOG_DRAG = false;             // Disable drag-drop logging');
	console.log('  • logger.LOG_PLACEMENT = false;        // Disable placement logging');
	console.log('  • logger.LOG_SCORE = false;            // Disable score logging');
	console.log('  • logger.LOG_PERFORMANCE = false;      // Disable performance metrics');
	console.log('  • logger.LOG_GRID = false;             // Disable grid state logging');
	console.log('  • logger.LOG_ERRORS = false;           // Disable error logging');
	console.groupEnd();
	
	console.group('%c📍 WHAT TO LOOK FOR IN CONSOLE', 'color: #95E1D3; font-weight: bold; font-size: 14px;');
	console.log('%c1. DRAG & DROP EVENTS (Red):', 'color: #FF6B6B; font-weight: bold;');
	console.log('   - When piece drag starts/moves/ends');
	console.log('   - Shows if placement is VALID ✓ or INVALID ✗');
	console.log('');
	console.log('%c2. PLACEMENT & LINE CLEARS (Teal):', 'color: #4ECDC4; font-weight: bold;');
	console.log('   - When pieces are placed successfully');
	console.log('   - When lines are cleared');
	console.log('   - How many cells are freed');
	console.log('');
	console.log('%c3. SCORE UPDATES (Yellow):', 'color: #FFE66D; font-weight: bold;');
	console.log('   - Points earned for placements');
	console.log('   - Line clear bonuses');
	console.log('   - Combo multipliers');
	console.log('');
	console.log('%c4. PERFORMANCE METRICS (Mint):', 'color: #95E1D3; font-weight: bold;');
	console.log('   - How long each operation takes (milliseconds)');
	console.log('   - If any operation takes > 16ms (potential jank)');
	console.log('');
	console.log('%c5. GRID STATE (Blue):', 'color: #A8D8EA; font-weight: bold;');
	console.log('   - Empty cells remaining');
	console.log('   - Available moves count');
	console.log('');
	console.log('%c6. ERRORS & WARNINGS (Red):', 'color: #FF4444; font-weight: bold;');
	console.log('   - Invalid placements');
	console.log('   - Missing pieces');
	console.log('   - Game logic errors');
	console.groupEnd();
	
	console.group('%c💡 HOW TO USE FOR DEBUGGING', 'color: #A8D8EA; font-weight: bold; font-size: 14px;');
	console.log('%cExample 1: Drag feels laggy', 'color: #FFE66D; font-weight: bold;');
	console.log('  → Check PERF logs - are movement updates < 16ms?');
	console.log('  → Check DRAG MOVE logs - is validity check working correctly?');
	console.log('');
	console.log('%cExample 2: Placement is broken', 'color: #FFE66D; font-weight: bold;');
	console.log('  → Check PLACEMENT logs - is piece getting marked as VALID?');
	console.log('  → Check ERROR logs for rejection reasons');
	console.log('');
	console.log('%cExample 3: Score not updating', 'color: #FFE66D; font-weight: bold;');
	console.log('  → Check SCORE + logs - are points being added?');
	console.log('  → Check LINE CLEAR logs - are lines detected?');
	console.log('');
	console.log('%cExample 4: Game over too early', 'color: #FFE66D; font-weight: bold;');
	console.log('  → Check GRID STATE logs - when does move count hit 0?');
	console.log('  → Check PLACEMENT logs - which pieces failed?');
	console.groupEnd();
	
	console.log('%c✅ Ready to play! Open DevTools (F12) to see real-time logs', 
		'color: #66BB6A; font-size: 12px; font-style: italic;');
	console.log('');
	
	// Show detailed performance timing guide
	console.log('%c⏱️ TIP: For DETAILED performance metrics, type in console:', 
		'color: #95E1D3; font-weight: bold;');
	console.log('  → logger.logPerformanceGuide()');
	console.log('');
}

// Bootstrap all modules on DOMContentLoaded
// Initialize all modules when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	// Print logging guide first
	printLoggingGuide();
	
	// Initialize version badge first
	initVersionBadge();
	
	initLanding();
	initDarkMode();
	initGameBackground();

	// Register service worker for PWA offline support.
	// Use absolute path to the repo base so it works on GitHub Pages.
	try {
		if ('serviceWorker' in navigator) {
			// Register service worker with prefetch check to avoid noisy 404 logs.
			// Try repo base (`/BlokusFocus/sw.js`) first, then fall back to `/sw.js`.
			(async () => {
				const candidates = ['/BlokusFocus/sw.js', '/sw.js'];
				for (const swPath of candidates) {
					try {
						// Prefetch to check if the script exists before registration
						const resp = await fetch(swPath, { method: 'HEAD', cache: 'no-store' });
						if (!resp.ok) {
							console.debug('SW not found at', swPath);
							continue;
						}
						const reg = await navigator.serviceWorker.register(swPath);
						console.log('ServiceWorker registered with', swPath, 'scope:', reg.scope);
						break;
					} catch (err) {
						console.debug('SW registration attempt failed for', swPath);
						// try next candidate
					}
				}
			})();
		}
	} catch (e) {
		console.warn('ServiceWorker registration error', e);
	}
	// Color burst effect on logo
	if (document.querySelector('.logo')) {
		window.colorBurstEffect = new ColorBurstEffect();
	}
	// Highlight special-action buttons on click
	const specialBtns = document.querySelectorAll('.special-actions .action-btn');
	specialBtns.forEach(btn => {
		btn.addEventListener('click', () => {
			specialBtns.forEach(b => b.classList.remove('active'));
			btn.classList.add('active');
		});
	});

	// Defer enabling heavy blur effects until the browser is idle
	const enableGlass = () => document.body.classList.add('glass-ready');
	if ('requestIdleCallback' in window) {
		requestIdleCallback(enableGlass, { timeout: 1500 });
	} else {
		setTimeout(enableGlass, 1200);
	}

	// Modal accessibility: focus management & ESC key
	const modal = document.getElementById('settingsModal');
	const openBtn = document.getElementById('settingsButton');
	const closeBtn = modal?.querySelector('.settings-close');
	const title = document.getElementById('settingsTitle');

	function openSettings() {
		if (!modal) return;
		modal.style.display = 'flex';
		if (title) setTimeout(() => title.focus(), 50);
		document.addEventListener('keydown', escClose);
	}

	function closeSettings() {
		if (!modal) return;
		modal.style.display = 'none';
		document.removeEventListener('keydown', escClose);
		if (openBtn) openBtn.focus();
	}

	function escClose(e) {
		if (e.key === 'Escape') closeSettings();
	}

	openBtn?.addEventListener('click', openSettings);
	closeBtn?.addEventListener('click', closeSettings);
});
