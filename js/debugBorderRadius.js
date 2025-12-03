/**
 * Debug script to log border-radius values for grid containers
 * Helps diagnose why CSS changes aren't taking effect
 */

function logBorderRadius() {
    const gameGridContainer = document.querySelector('.game-grid-container');
    const gameGrid = document.querySelector('.game-grid');
    
    console.group('%c📐 [BORDER-RADIUS DEBUG]', 'color: #FF6B6B; font-weight: bold; font-size: 12px;');
    
    if (gameGridContainer) {
        const containerStyle = window.getComputedStyle(gameGridContainer);
        const containerBorderRadius = containerStyle.borderRadius;
        console.log('%c.game-grid-container borderRadius:', 'color: #FF6B6B; font-weight: bold;', containerBorderRadius);
    } else {
        console.log('%c.game-grid-container: NOT FOUND', 'color: #FF0000; font-weight: bold;');
    }
    
    if (gameGrid) {
        const gridStyle = window.getComputedStyle(gameGrid);
        const gridBorderRadius = gridStyle.borderRadius;
        console.log('%c.game-grid borderRadius:', 'color: #4ECDC4; font-weight: bold;', gridBorderRadius);
    } else {
        console.log('%c.game-grid: NOT FOUND', 'color: #FF0000; font-weight: bold;');
    }
    
    // Check viewport width
    console.log('%cViewport Width:', 'color: #95E1D3; font-weight: bold;', window.innerWidth + 'px');
    console.log('%cIs mobile (≤768px)?:', 'color: #FFE66D; font-weight: bold;', window.innerWidth <= 768);
    
    // Check media query match
    const mobileMediaQuery = window.matchMedia('(max-width: 768px)');
    console.log('%cMedia Query (max-width: 768px) matches?:', 'color: #FFE66D; font-weight: bold;', mobileMediaQuery.matches);
    
    // NEW: Inspect DOM structure to find grid element
    console.log('%c--- DOM INSPECTION ---', 'color: #A8D8EA; font-weight: bold;');
    const allGrids = document.querySelectorAll('[class*="grid"]');
    console.log('%cFound', allGrids.length, 'elements with "grid" in class name:');
    allGrids.forEach((el, idx) => {
        const style = window.getComputedStyle(el);
        console.log(`  [${idx}] ${el.tagName}.${el.className} → borderRadius: ${style.borderRadius}`);
    });
    
    console.groupEnd();
}

export function debugBorderRadius() {
    logBorderRadius();
    
    // Log on window resize to catch media query changes
    window.addEventListener('resize', () => {
        console.log('%c[RESIZE EVENT DETECTED]', 'color: #A8D8EA; font-weight: bold;');
        logBorderRadius();
    });
    
    console.log('%c✅ Border Radius Debug Active. Run window.debugBorderRadius() to log values again.', 'color: #66BB6A; font-weight: bold;');
}

// Immediately expose to global scope
window.debugBorderRadius = logBorderRadius;

// Auto-run on import
console.log('%c🔵 Border Radius Debug Script Loading...', 'color: #4ECDC4; font-weight: bold;');
logBorderRadius();
setTimeout(logBorderRadius, 500);
setTimeout(logBorderRadius, 1000);
