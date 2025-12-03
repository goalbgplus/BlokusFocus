// TASK 2 & 3 & 4 - EXACT CODE REPLACEMENTS FOR render.js AND main.js

// ============================================================
// TO FIX IN js/render.js - TASK 2
// ============================================================
// Find line ~288 and replace entire updateGridDisplay function:

export function updateGridDisplay() {
    // PHASE 1: Batch all DOM reads - determine what needs to change
    const updates = [];
    
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            const cellValue = gameState.grid[r][c];
            const cellElement = cellElements[r][c];
            
            if (!cellElement) continue;
            
            let blockWrapper = cellElement.querySelector('.grid-cell-block');
            
            if (!blockWrapper) {
                blockWrapper = document.createElement('div');
                blockWrapper.classList.add('grid-cell-block');
                cellElement.innerHTML = '';
                cellElement.appendChild(blockWrapper);
            }
            
            const previousFilled = Array.from(blockWrapper.classList).filter(cls => cls.startsWith('filled-'));
            const filledClass = cellValue !== 0 ? `filled-${cellValue}` : null;
            
            updates.push({
                blockWrapper,
                cellElement,
                previousFilled,
                filledClass
            });
        }
    }
    
    // PHASE 2: Batch all DOM writes - browser batches these into single layout pass
    updates.forEach(({ blockWrapper, cellElement, previousFilled, filledClass }) => {
        previousFilled.forEach(cls => blockWrapper.classList.remove(cls));
        
        if (filledClass) {
            blockWrapper.classList.add(filledClass);
        }
        
        if (!cellElement.classList.contains('grid-cell')) {
            cellElement.classList.add('grid-cell');
        }
        
        cellElement.style.width = 'var(--grid-cell-size)';
        cellElement.style.height = 'var(--grid-cell-size)';
    });
}


// ============================================================
// TO FIX IN js/render.js - TASK 3
// ============================================================
// Find line ~321 in animatePlacement(), replace this section:

    // ORIGINAL (CREATES NEW OBJECTS):
    // const cellsWithDelay = cells.map(({ r, c }) => {
    //     const distance = Math.hypot(r - centerR, c - centerC);
    //     return {
    //         r,
    //         c,
    //         delay: Math.sqrt(distance) * 28
    //     };
    // });

    // REPLACEMENT (USES POOL):
    const cellsWithDelay = cells.map(({ r, c }) => {
        const distance = Math.hypot(r - centerR, c - centerC);
        const delay = Math.sqrt(distance) * 28;
        return animationPool.acquire(r, c, delay);
    });


// AT END OF animatePlacement() function, add this:
    
    // TASK 3: Release pool objects after animation completes
    setTimeout(() => {
        animationPool.releaseAll();
    }, 1000);


// ============================================================
// TO FIX IN js/main.js - TASK 4
// ============================================================
// Find line ~1390 in handleTouchStart():

    // ORIGINAL:
    // document.addEventListener('touchmove', handleTouchMove);
    // document.addEventListener('touchend', handleTouchEnd);
    // document.addEventListener('touchcancel', handleTouchEnd);

    // REPLACEMENT (already passive: false is correct for drag):
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: false });


// Find other scroll/resize listeners and make passive:
// window.addEventListener('scroll', handler, { passive: true });
// window.addEventListener('resize', handler, { passive: true });
// document.addEventListener('wheel', handler, { passive: true });

