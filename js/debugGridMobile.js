// Debug logging for mobile grid sizing
console.log("🚀 SKRIPTI FILLOI: debugGridMobile.js po ekzekutohet...");

(function() {
    function logGridDimensions() {
        console.log("📏 --- FILLIMI I MATJEVE ---");
        
        const root = document.documentElement;
        const gameContainer = document.querySelector('.game-container');
        const grid = document.querySelector('.game-grid');
        const gameArea = document.querySelector('.game-area');
        
        // Get computed CSS variables
        const gridCellSize = getComputedStyle(root).getPropertyValue('--grid-cell-size').trim();
        const gameGridPadding = getComputedStyle(root).getPropertyValue('--game-grid-padding').trim();
        const gameGridBorder = getComputedStyle(root).getPropertyValue('--game-grid-border').trim();
        const gameGridContentSize = getComputedStyle(root).getPropertyValue('--game-grid-content-size').trim();
        const gameGridTotalSize = getComputedStyle(root).getPropertyValue('--game-grid-total-size').trim();
        const viewHeight = getComputedStyle(root).getPropertyValue('--view-height').trim();
        const mobileGridMaxSize = getComputedStyle(root).getPropertyValue('--mobile-grid-max-size').trim();
        
        console.group('🎮 MOBILE GRID DEBUG');
        console.log('%cCSS Variables:', 'color: #FFD700; font-weight: bold;');
        console.log('--grid-cell-size:', gridCellSize);
        console.log('--game-grid-padding:', gameGridPadding);
        console.log('--game-grid-border:', gameGridBorder);
        console.log('--game-grid-content-size:', gameGridContentSize);
        console.log('--game-grid-total-size:', gameGridTotalSize);
        console.log('--view-height:', viewHeight);
        console.log('--mobile-grid-max-size:', mobileGridMaxSize);
        
        // Check .game-container visibility
        if (gameContainer) {
            const containerRect = gameContainer.getBoundingClientRect();
            console.log('%c.game-container:', 'color: #FF00FF; font-weight: bold;');
            console.log(`Has .hidden: ${gameContainer.classList.contains('hidden')}`);
            console.log(`Width: ${containerRect.width}px, Height: ${containerRect.height}px`);
        } else {
            console.warn("⚠️ .game-container nuk ekziston në DOM!");
        }
        
        if (gameArea) {
            const areaRect = gameArea.getBoundingClientRect();
            console.log('%c.game-area (actual):', 'color: #FF69B4; font-weight: bold;');
            console.log(`Width: ${areaRect.width}px, Height: ${areaRect.height}px`);
            console.log(`Display: ${getComputedStyle(gameArea).display}`);
            console.log(`Visibility: ${getComputedStyle(gameArea).visibility}`);
        } else {
            console.warn("⚠️ PARALAJMËRIM: .game-area nuk u gjet!");
        }
        
        if (grid) {
            const gridRect = grid.getBoundingClientRect();
            console.log('%c.game-grid (actual):', 'color: #00BFFF; font-weight: bold;');
            console.log(`Width: ${gridRect.width}px, Height: ${gridRect.height}px`);
            console.log(`Padding: ${getComputedStyle(grid).padding}`);
            console.log(`Display: ${getComputedStyle(grid).display}`);
            console.log(`Visibility: ${getComputedStyle(grid).visibility}`);
        } else {
            console.error("❌ GABIM: Elementi .game-grid NUK u gjet në DOM!");
        }
        
        console.log('%cViewport:', 'color: #FF1493; font-weight: bold;');
        console.log(`Window width: ${window.innerWidth}px`);
        console.log(`Window height: ${window.innerHeight}px`);
        console.log(`Is mobile (<= 768px): ${window.innerWidth <= 768}`);
        
        console.groupEnd();
        console.log("📏 --- FUNDI I MATJEVE ---");
    }
    
    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', logGridDimensions);
    } else {
        logGridDimensions();
    }
    
    // Re-run measurements after game starts (when container loses .hidden)
    // Listen for .game-container visibility changes
    const observer = new MutationObserver(() => {
        const gc = document.querySelector('.game-container');
        if (gc && !gc.classList.contains('hidden')) {
            console.log('🔄 GAME STARTED - Re-running grid measurements...');
            setTimeout(() => {
                logGridDimensions();
                window.debugGrid = logGridDimensions;
            }, 100);
        }
    });
    
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        observer.observe(gameContainer, { attributes: true, attributeFilter: ['class'] });
    }
    
    // Also expose a function to call from console
    window.debugGrid = logGridDimensions;
})();
