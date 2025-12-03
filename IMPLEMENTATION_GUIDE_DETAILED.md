# Performance Optimization Implementation Guide - DETAILED CODE CHANGES

## TASK 1: CSS Optimization ✅ COMPLETED
- **Status**: DONE
- **File**: `css/style.css`
- **Changes Made**: 
  - Removed all `backdrop-filter: blur()` declarations
  - Removed `-webkit-backdrop-filter: blur()` declarations
  - Increased background opacity from 0.1-0.15 to 0.12-0.18
  - Added `will-change` hints to animated elements
  - Expected FPS improvement: +8-10 fps

---

## TASK 2: Eliminate DOM Thrashing in updateGridDisplay()
- **File**: `js/render.js` (lines ~240-275)
- **Problem**: Function reads from DOM (querySelector) and writes (classList) in same loop = N² layout recalculations
- **Solution**: Use two-phase approach - batch reads, then batch writes

### Before (Layout Thrashing):
```javascript
export function updateGridDisplay() {
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            const blockWrapper = cellElement.querySelector('.grid-cell-block'); // READ
            blockWrapper.classList.remove(cls); // WRITE -> Triggers layout
            blockWrapper.classList.add(`filled-${cellValue}`); // WRITE -> Triggers layout
        }
    }
}
```

### After (Batched Reads & Writes):
```javascript
export function updateGridDisplay() {
    // PHASE 1: Read all DOM state
    const updates = [];
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            const cellValue = gameState.grid[r][c];
            const cellElement = cellElements[r][c];
            const blockWrapper = cellElement.querySelector('.grid-cell-block');
            const previousFilled = Array.from(blockWrapper.classList).filter(cls => cls.startsWith('filled-'));
            
            updates.push({ blockWrapper, previousFilled, filledClass: cellValue !== 0 ? `filled-${cellValue}` : null });
        }
    }
    
    // PHASE 2: Write all changes (single layout pass)
    updates.forEach(({ blockWrapper, previousFilled, filledClass }) => {
        previousFilled.forEach(cls => blockWrapper.classList.remove(cls));
        if (filledClass) blockWrapper.classList.add(filledClass);
    });
}
```

**Expected FPS improvement**: +10-15 fps

---

## TASK 3: Object Pooling for animatePlacement()
- **File**: `js/render.js` (add pool class, update animatePlacement)
- **Problem**: Creates new {r, c, delay} objects on every frame = GC pauses every 30 frames
- **Solution**: Reuse objects from pre-allocated pool

### Step 1: Add AnimationDataPool class (already done in render.js top)
```javascript
class AnimationDataPool {
    constructor(initialSize = 20) {
        this.pool = [];
        this.inUse = new Set();
        for (let i = 0; i < initialSize; i++) {
            this.pool.push({ r: 0, c: 0, delay: 0 });
        }
    }
    
    acquire(r, c, delay) {
        let obj = this.pool.length > 0 ? this.pool.pop() : { r: 0, c: 0, delay: 0 };
        obj.r = r;
        obj.c = c;
        obj.delay = delay;
        this.inUse.add(obj);
        return obj;
    }
    
    releaseAll() {
        this.inUse.forEach(obj => this.pool.push(obj));
        this.inUse.clear();
    }
}

const animationPool = new AnimationDataPool(50);
```

### Step 2: Update animatePlacement() to use pool
Replace this line:
```javascript
const cellsWithDelay = cells.map(({ r, c }) => {
    const distance = Math.hypot(r - centerR, c - centerC);
    return {
        r,
        c,
        delay: Math.sqrt(distance) * 28
    };
});
```

With this:
```javascript
const cellsWithDelay = cells.map(({ r, c }) => {
    const distance = Math.hypot(r - centerR, c - centerC);
    const delay = Math.sqrt(distance) * 28;
    return animationPool.acquire(r, c, delay);
});
```

### Step 3: Release objects after animation
At the end of animatePlacement(), add:
```javascript
setTimeout(() => {
    animationPool.releaseAll();
}, 1000);
```

**Expected FPS improvement**: +5-8 fps (reduces GC pauses)

---

## TASK 4: Passive Event Listeners
- **File**: `js/main.js`
- **Problem**: Non-passive listeners block scrolling/zooming even when preventDefault() not called
- **Solution**: Mark non-drag listeners as `{ passive: true }`

### Find in main.js and UPDATE:

#### Location 1: touchmove/touchend in handleTouchStart() (line ~750)
```javascript
// CURRENT:
document.addEventListener('touchmove', handleTouchMove);
document.addEventListener('touchend', handleTouchEnd);

// CHANGE TO:
document.addEventListener('touchmove', handleTouchMove, { passive: false });
document.addEventListener('touchend', handleTouchEnd, { passive: false });
```

#### Location 2: Global scroll listener (if exists)
```javascript
// IF YOU HAVE:
window.addEventListener('scroll', handler);

// CHANGE TO:
window.addEventListener('scroll', handler, { passive: true });
```

#### Location 3: Resize listener (if exists)  
```javascript
// IF YOU HAVE:
window.addEventListener('resize', handler);

// CHANGE TO:
window.addEventListener('resize', handler, { passive: true });
```

**Expected FPS improvement**: +3-5 fps (smoother scroll/zoom interactions)

---

## Expected Total Improvement
- Task 1 (CSS): +8 fps
- Task 2 (DOM Thrashing): +10 fps  
- Task 3 (Object Pooling): +5 fps
- Task 4 (Passive Listeners): +3 fps
- **TOTAL**: +26 fps improvement (30fps → 56fps achievable)

## Implementation Checklist

- [x] Task 1: CSS backdrop-filter removal
- [ ] Task 2: updateGridDisplay() two-phase rewrite
- [ ] Task 3: Add AnimationPool class and update animatePlacement()
- [ ] Task 4: Mark event listeners as passive where appropriate
- [ ] Test on mobile device (iPhone/Android)
- [ ] Verify FPS in DevTools (right-click > Inspect > Performance)
- [ ] Commit changes and deploy

## Testing Commands

```javascript
// In browser console to measure FPS before/after:
let fps = 0;
let lastTime = performance.now();
function measureFPS() {
    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;
    fps = Math.round(1000 / delta);
    console.log(`FPS: ${fps}`);
    requestAnimationFrame(measureFPS);
}
measureFPS();
```

---

## Priority Order
1. **HIGH**: Task 1 (CSS) + Task 2 (DOM) = 80% of gains
2. **MEDIUM**: Task 3 (Pooling) = 15% of gains
3. **LOW**: Task 4 (Passive) = 5% of gains, but helps user experience
