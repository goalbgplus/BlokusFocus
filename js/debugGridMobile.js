// Debug logging for mobile grid sizing
(function() {
    function logGridDimensions() {
        const root = document.documentElement;
        const gridContainer = document.querySelector('.game-grid-container');
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
        
        if (gridContainer) {
            const containerRect = gridContainer.getBoundingClientRect();
            console.log('%c.game-grid-container (actual):', 'color: #00FF00; font-weight: bold;');
            console.log(`Width: ${containerRect.width}px, Height: ${containerRect.height}px`);
            console.log(`Padding: ${getComputedStyle(gridContainer).padding}`);
            console.log(`Border-radius: ${getComputedStyle(gridContainer).borderRadius}`);
        }
        
        if (grid) {
            const gridRect = grid.getBoundingClientRect();
            console.log('%c.game-grid (actual):', 'color: #00BFFF; font-weight: bold;');
            console.log(`Width: ${gridRect.width}px, Height: ${gridRect.height}px`);
            console.log(`Padding: ${getComputedStyle(grid).padding}`);
            console.log(`Border-radius: ${getComputedStyle(grid).borderRadius}`);
            console.log(`Max-width: ${getComputedStyle(grid).maxWidth}`);
            console.log(`Max-height: ${getComputedStyle(grid).maxHeight}`);
        }
        
        if (gameArea) {
            const areaRect = gameArea.getBoundingClientRect();
            console.log('%c.game-area (actual):', 'color: #FF69B4; font-weight: bold;');
            console.log(`Width: ${areaRect.width}px, Height: ${areaRect.height}px`);
            console.log(`Display: ${getComputedStyle(gameArea).display}`);
            console.log(`Justify-content: ${getComputedStyle(gameArea).justifyContent}`);
            console.log(`Align-items: ${getComputedStyle(gameArea).alignItems}`);
        }
        
        console.log('%cViewport:', 'color: #FF1493; font-weight: bold;');
        console.log(`Window width: ${window.innerWidth}px`);
        console.log(`Window height: ${window.innerHeight}px`);
        console.log(`Is mobile (<= 768px): ${window.innerWidth <= 768}`);
        
        console.groupEnd();
    }
    
    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', logGridDimensions);
    } else {
        logGridDimensions();
    }
    
    // Also expose a function to call from console
    window.debugGrid = logGridDimensions;
})();
