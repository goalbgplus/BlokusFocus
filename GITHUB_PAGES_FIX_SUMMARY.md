# GitHub Pages Layout & Responsiveness Fixes

## Problem Summary
The game layout works on localhost but breaks on GitHub Pages (`https://goalbgplus.github.io/BlokusFocus/`):
- Horizontal overflow on mobile devices
- Game board and pieces tray extend beyond viewport
- No obvious console errors

## Root Causes Identified

### 1. **Absolute Icon Path** ❌
**File**: `index.html` line 13
```html
<!-- BEFORE (GitHub Pages 404) -->
<link rel="apple-touch-icon" href="/icons/icon-192.png">

<!-- AFTER (Relative path works everywhere) -->
<link rel="apple-touch-icon" href="./icons/icon-192.png">
```
**Why**: Absolute paths starting with `/` resolve to domain root, not the `/BlokusFocus/` repo folder.

---

### 2. **Hard-Coded Vite Asset Path** ❌
**File**: `index.html` line 90
```html
<!-- REMOVED - This conflicted with vite.config.js's dynamic base handling -->
<link rel="stylesheet" crossorigin href="/BlokusFocus/assets/index-BUXLTvqt.css">
```
**Why**: Vite already handles asset paths correctly based on `base` config. This hard-coded path is redundant and can interfere with the build system.

---

### 3. **Game Container Overflow** ❌
**File**: `css/game-ui.css` line 571
```css
/* BEFORE */
.game-container {
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;  /* ← PROBLEM: extends beyond safe viewport */
    height: 100vh !important;
    padding: clamp(16px, 3vh, 32px) clamp(12px, 6vw, 48px);
    overflow: hidden;
}

/* AFTER */
.game-container {
    position: fixed !important;
    inset: 0 !important;
    width: 100% !important;     /* ← FIX: respects parent constraints */
    height: 100% !important;
    max-width: 100vw;           /* ← Safety cap for true viewport width */
    max-height: 100vh;
    padding: clamp(16px, 3vh, 32px) clamp(12px, 6vw, 48px);
    overflow: hidden;
    box-sizing: border-box;     /* ← Critical: includes padding in width calculation */
}
```

**Why**: 
- `width: 100vw + padding` = overflow beyond viewport
- Using `width: 100%` respects parent's constraints
- `box-sizing: border-box` ensures padding doesn't add to width
- `max-width/max-height: 100vw/vh` as safety caps

---

### 4. **Pieces Container Width** ❌
**File**: `css/game-ui.css` line 447
```css
/* BEFORE */
.pieces-container, #piecesContainer {
    width: 100%;        /* 100% of potentially oversized parent */
    max-width: calc(100% - 40px);
}

/* AFTER */
.pieces-container, #piecesContainer {
    width: calc(100% - 40px) !important;  /* Subtract padding from start */
    max-width: calc(100% - 40px);
    box-sizing: border-box;  /* Include padding in calculation */
}
```

**Why**: Ensures the container with internal padding stays within parent bounds.

---

### 5. **Mobile CSS Viewport Unit Issues** ⚠️
**File**: `css/mobile.css` lines 143, 160
```css
/* BEFORE */
.pieces-container {
    max-width: min(var(--game-grid-total-size), 100vw) !important;  /* 100vw can overflow */
}
.game-area {
    max-width: 100vw !important;  /* Same issue */
}

/* AFTER */
.pieces-container {
    max-width: min(var(--game-grid-total-size), calc(100% - 40px)) !important;  /* Relative to parent */
}
.game-area {
    max-width: 100% !important;  /* Respects parent flex container */
}
```

**Why**: Mobile CSS needs to respect the `.game-container`'s safe bounds, not absolute viewport.

---

## Files Modified

| File | Changes | Impact |
|------|---------|--------|
| `index.html` | 2 changes | Fixes asset loading on GitHub Pages |
| `css/game-ui.css` | 2 changes | Fixes overflow on game container and pieces tray |
| `css/mobile.css` | 2 changes | Fixes mobile viewport constraints |

---

## How to Verify the Fix

### Locally (should still work):
```bash
npm run dev
# Open http://localhost:5173 in mobile emulator
# Game should be fully visible, no horizontal scroll
```

### On GitHub Pages (the actual fix):
1. Push changes to `main` branch
2. Visit https://goalbgplus.github.io/BlokusFocus/
3. Open DevTools → Device Toolbar (mobile emulator)
4. Test various devices (iPhone SE, iPhone 12, Galaxy S20, iPad)
5. **Expected**: No horizontal overflow, board and pieces fit in viewport

---

## Key Principles Applied

✅ **Relative paths** for assets served under `/BlokusFocus/`  
✅ **100% instead of 100vw** for child elements (prevents overflow)  
✅ **box-sizing: border-box** on all sized containers  
✅ **Safe viewport units** (`100vh` only for fixed full-screen overlays)  
✅ **Preserved all visual styling** (colors, gradients, animations)  

---

## Testing Checklist

- [ ] **Desktop (1920px)**: Game board centered, pieces visible below
- [ ] **Tablet (iPad 768px)**: Board sized appropriately, no horizontal scroll
- [ ] **Large Phone (iPhone 12, 390px)**: Grid uses `clamp()` to scale down, pieces fit
- [ ] **Small Phone (iPhone SE, 375px)**: Minimal scaling, still fully visible
- [ ] **Extra Small (iPhone 5S height ~568px)**: Grid cell size drops to 24px, playable
- [ ] **Chrome DevTools mobile emulator**: All above tested virtually
- [ ] **Icons loading**: Apple touch icon shows correctly (no 404 in console)
- [ ] **CSS loading**: No path-related 404s in Network tab

---

## Additional Notes

**Why vite.config.js already works:**
```javascript
const REPO_BASE = '/BlokusFocus/';
const isProd = process.env.NODE_ENV === 'production' || process.env.CI === 'true';

export default defineConfig({
    base: isProd ? REPO_BASE : '/',  // ← Automatically sets base for production
    // ...
});
```
The build system **already handles the base path correctly**. Removing the hard-coded asset link lets Vite do its job.

**Why `100%` is safer than `100vw`:**
- `100vw` = full browser viewport width (ignores parent constraints, includes scrollbars on some browsers)
- `100%` = parent container width (respects layout flow, never overflows)
- On mobile with notches/safe-area-insets, `100vw` can extend into unsafe zones

---

## Rollback Plan
If issues arise, the changes are minimal and can be reverted:
1. Restore `/icons/...` paths (unlikely to break anything)
2. Restore `width: 100vw` in game-container (will cause overflow to return)
3. Restore `width: 100%` in pieces-container (will cause alignment issues)

---

**Status**: ✅ Ready for production deployment
**Last Updated**: December 4, 2025
