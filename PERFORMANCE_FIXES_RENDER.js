// TASK 2: Optimized updateGridDisplay() - Eliminates DOM Thrashing
// Replace the existing updateGridDisplay() function in render.js with this version
// This uses a two-phase approach: batch reads first, then batch writes

export function updateGridDisplay() {
    // PHASE 1: Batch all DOM reads and determine what needs to change
    // This phase reads from DOM but doesn't write, avoiding interleaved reads/writes
    const updates = [];
    
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            const cellValue = gameState.grid[r][c];
            const cellElement = cellElements[r][c];
            
            if (!cellElement) continue;
            
            // Get blockWrapper - OPTIMIZED: single querySelector per cell
            let blockWrapper = cellElement.querySelector('.grid-cell-block');
            
            // Fallback: if block wrapper doesn't exist, create it
            if (!blockWrapper) {
                blockWrapper = document.createElement('div');
                blockWrapper.classList.add('grid-cell-block');
                cellElement.innerHTML = '';
                cellElement.appendChild(blockWrapper);
            }
            
            // Determine what classes need to be added/removed
            const previousFilled = Array.from(blockWrapper.classList).filter(cls => cls.startsWith('filled-'));
            const filledClass = cellValue !== 0 ? `filled-${cellValue}` : null;
            
            // Store update info for phase 2
            updates.push({
                blockWrapper,
                cellElement,
                previousFilled,
                filledClass
            });
        }
    }
    
    // PHASE 2: Batch all DOM writes (classList modifications)
    // All reads are complete. Now apply all changes in sequence.
    // Browser batches these writes into a single layout recalculation.
    updates.forEach(({ blockWrapper, cellElement, previousFilled, filledClass }) => {
        // Remove old filled classes
        previousFilled.forEach(cls => blockWrapper.classList.remove(cls));
        
        // Add new filled class if needed
        if (filledClass) {
            blockWrapper.classList.add(filledClass);
        }
        
        // Ensure base grid-cell class remains on the cell
        if (!cellElement.classList.contains('grid-cell')) {
            cellElement.classList.add('grid-cell');
        }
        
        // Set cell dimensions
        cellElement.style.width = 'var(--grid-cell-size)';
        cellElement.style.height = 'var(--grid-cell-size)';
    });
}


// ============================================================
// TASK 3: AnimationPool Class - Object Pooling for animatePlacement
// Add this class definition BEFORE the animatePlacement function in render.js
// ============================================================

class AnimationDataPool {
    constructor(initialSize = 20) {
        this.pool = [];
        this.inUse = new Set();
        
        // Pre-allocate objects to avoid initial GC spike
        for (let i = 0; i < initialSize; i++) {
            this.pool.push({ r: 0, c: 0, delay: 0 });
        }
    }
    
    acquire(r, c, delay) {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
            obj.r = r;
            obj.c = c;
            obj.delay = delay;
        } else {
            obj = { r, c, delay };
        }
        this.inUse.add(obj);
        return obj;
    }
    
    release(obj) {
        this.inUse.delete(obj);
        this.pool.push(obj);
    }
    
    releaseAll() {
        this.inUse.forEach(obj => this.pool.push(obj));
        this.inUse.clear();
    }
}

// Create a global pool instance
const animationPool = new AnimationDataPool(50);


// ============================================================
// OPTIMIZED animatePlacement using Object Pooling
// Replace the existing animatePlacement function with this version
// ============================================================

export function animatePlacement(cells) {
    if (!Array.isArray(cells) || cells.length === 0) return;

    let centerR = 0;
    let centerC = 0;
    cells.forEach(({ r, c }) => {
        centerR += r;
        centerC += c;
    });
    centerR /= cells.length;
    centerC /= cells.length;

    // OPTIMIZED: Reuse objects from the pool instead of creating new ones
    const cellsWithDelay = cells.map(({ r, c }) => {
        const distance = Math.hypot(r - centerR, c - centerC);
        const delay = Math.sqrt(distance) * 28;
        return animationPool.acquire(r, c, delay);
    });

    cells.forEach(({ r, c }) => {
        const cell = cellElements[r]?.[c];
        if (!cell) return;
        const blockWrapper = cell.querySelector('.grid-cell-block');
        if (!blockWrapper) return;
        blockWrapper.classList.remove('placed');
        blockWrapper.style.animation = 'none';
        void blockWrapper.offsetWidth;
    });

    cellsWithDelay.forEach(({ r, c, delay }) => {
        const cell = cellElements[r]?.[c];
        if (!cell) return;
        const blockWrapper = cell.querySelector('.grid-cell-block');
        if (!blockWrapper) return;

        const jitter = (Math.random() - 0.5) * 14;
        const finalDelay = Math.max(0, delay + jitter);

        blockWrapper.style.animation = '';
        blockWrapper.style.animationDelay = `${finalDelay}ms`;
        blockWrapper.classList.add('placed');

        blockWrapper.addEventListener('animationend', () => {
            blockWrapper.classList.remove('placed');
            blockWrapper.style.animationDelay = '';
        }, { once: true });
    });
    
    // Release all objects back to the pool after animation completes
    // This prevents memory accumulation over time
    setTimeout(() => {
        animationPool.releaseAll();
    }, 1000); // Release after 1 second (animation duration)
}


// ============================================================
// TASK 4: Passive Event Listeners
// In main.js, update these event listener declarations:
// ============================================================

// FIND THIS in handleTouchMove:
document.addEventListener('touchmove', handleTouchMove);

// REPLACE WITH THIS:
document.addEventListener('touchmove', handleTouchMove, { passive: false });
// (passive: false because we call preventDefault() for drag logic)


// FIND THIS in handleTouchStart:
document.addEventListener('touchmove', handleTouchMove, { passive: false });
document.addEventListener('touchend', handleTouchEnd, { passive: false });
document.addEventListener('touchcancel', handleTouchEnd, { passive: false });
// These are already marked as passive: false, which is correct for drag.


// FIND THIS in handleTouchMove (scroll prevention):
document.addEventListener('touchmove', function(event) {
    if (gameState.dragState && gameState.dragState.isDragging && event.scale !== 1) {
        event.preventDefault();
    }
}, { passive: false });

// This is correct - passive: false is needed when calling preventDefault().


// FOR SCROLL/RESIZE listeners that DON'T call preventDefault(), add { passive: true }
// Example pattern to search for in main.js:
// window.addEventListener('scroll', handler);
// window.addEventListener('resize', handler);
// These should become:
// window.addEventListener('scroll', handler, { passive: true });
// window.addEventListener('resize', handler, { passive: true });


console.log('Performance fixes ready for implementation');
