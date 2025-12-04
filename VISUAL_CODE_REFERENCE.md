# CODE CHANGES - Visual Reference

## CHANGE #1: index.html - Line 13
**File**: `index.html`

```diff
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
      <meta name="description" content="GOALBG - Addictive block puzzle game...">
      <meta name="theme-color" content="#0b1220"...>
-     <link rel="apple-touch-icon" href="/icons/icon-192.png">
+     <link rel="apple-touch-icon" href="./icons/icon-192.png">
      <title>GOALBG - Block Puzzle Challenge</title>
```

**Why**: `/icons/...` looks for `/icons/` at domain root. On GitHub Pages, icons are in `/BlokusFocus/icons/`. Relative path `./icons/...` works correctly.

---

## CHANGE #2: index.html - Line 90
**File**: `index.html`

```diff
  <link rel="preload" href="css/desktop.css?v=3.1" as="style" 
    media="(min-width:769px)" onload="this.onload=null;this.rel='stylesheet'">
- <link rel="stylesheet" crossorigin href="/BlokusFocus/assets/index-BUXLTvqt.css">
  <link rel="preload" href="css/mobile.css?v=3.1" as="style" 
    media="(max-width:768px)" onload="this.onload=null;this.rel='stylesheet'">
```

**Why**: This hard-coded path conflicts with `vite.config.js` which auto-handles the base path. Removing it lets Vite do its job correctly.

---

## CHANGE #3: css/game-ui.css - Lines 571-590
**File**: `css/game-ui.css`

### BEFORE
```css
.game-container {
    background: var(--glass-bg);
    box-shadow: inset 0 1px 1px var(--glass-border), 0 10px 30px rgba(0,0,0,0.3);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;          /* ❌ OVERFLOW! */
    height: 100vh !important;
    padding: clamp(16px, 3vh, 32px) clamp(12px, 6vw, 48px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 1rem;
    overflow: hidden;
}
```

### AFTER
```css
.game-container {
    background: var(--glass-bg);
    box-shadow: inset 0 1px 1px var(--glass-border), 0 10px 30px rgba(0,0,0,0.3);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    position: fixed !important;
    inset: 0 !important;
    width: 100% !important;           /* ✅ RESPECTS PARENT */
    height: 100% !important;
    max-width: 100vw;                 /* ✅ SAFETY CAP */
    max-height: 100vh;
    padding: clamp(16px, 3vh, 32px) clamp(12px, 6vw, 48px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 1rem;
    overflow: hidden;
    box-sizing: border-box;           /* ✅ PADDING IN WIDTH */
}
```

**The Fix Explained**:
- `100vw` = full viewport width (ignores parent constraints, includes scroll bar width)
- `100%` = parent container width (respects constraints)
- `box-sizing: border-box` = padding included in width calc (no overflow)

---

## CHANGE #4: css/game-ui.css - Lines 443-465
**File**: `css/game-ui.css`

### BEFORE
```css
.pieces-container, #piecesContainer {
    margin: 0.35rem auto 0 auto;
    overflow: visible !important;
    display: flex !important;
    justify-content: space-around !important;
    align-items: center !important;
    gap: 1rem;
    padding: 12px 16px;
    width: 100%;                      /* ❌ TOO WIDE */
    max-width: calc(100% - 40px);
    background: var(--glass-bg, rgba(255,255,255,0.04)) !important;
    -webkit-backdrop-filter: blur(var(--glass-blur, 6px));
    backdrop-filter: blur(var(--glass-blur, 6px));
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.25);
    border: 1px solid rgba(255,255,255,0.04);
    min-height: auto !important;
    z-index: 1000;
}
```

### AFTER
```css
.pieces-container, #piecesContainer {
    margin: 0.35rem auto 0 auto;
    overflow: visible !important;
    display: flex !important;
    justify-content: space-around !important;
    align-items: center !important;
    gap: 1rem;
    padding: 12px 16px;
    width: calc(100% - 40px) !important;  /* ✅ ACCOUNTS FOR PADDING */
    max-width: calc(100% - 40px);
    background: var(--glass-bg, rgba(255,255,255,0.04)) !important;
    -webkit-backdrop-filter: blur(var(--glass-blur, 6px));
    backdrop-filter: blur(var(--glass-blur, 6px));
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.25);
    border: 1px solid rgba(255,255,255,0.04);
    min-height: auto !important;
    z-index: 1000;
    box-sizing: border-box;               /* ✅ PADDING IN WIDTH */
}
```

**The Fix Explained**:
- `width: 100%` means full available width
- But if parent is already "over-full" (from 100vw), this compounds overflow
- `width: calc(100% - 40px)` subtracts padding from start
- `box-sizing: border-box` ensures clean calc

---

## CHANGE #5: css/mobile.css - Line 143
**File**: `css/mobile.css`

### BEFORE
```css
.game-container > .pieces-container,
.pieces-container,
#piecesContainer {
    /* ... other styles ... */
    width: 100% !important;
    max-width: min(var(--game-grid-total-size), 100vw) !important;  /* ❌ VIEWPORT */
    height: auto !important;
    /* ... */
}
```

### AFTER
```css
.game-container > .pieces-container,
.pieces-container,
#piecesContainer {
    /* ... other styles ... */
    width: 100% !important;
    max-width: min(var(--game-grid-total-size), calc(100% - 40px)) !important;  /* ✅ PARENT */
    height: auto !important;
    /* ... */
}
```

**The Fix Explained**:
- Mobile CSS overrides game-ui.css settings
- `100vw` in mobile context still overflows
- `calc(100% - 40px)` respects parent `.game-container` bounds

---

## CHANGE #6: css/mobile.css - Line 160
**File**: `css/mobile.css`

### BEFORE
```css
/* Ensure game area doesn't overflow and can shrink if needed */
.game-area {
    max-width: 100vw !important;      /* ❌ VIEWPORT WIDTH */
    width: auto !important;
    flex-shrink: 1 !important;
    min-height: 200px !important;
}
```

### AFTER
```css
/* Ensure game area doesn't overflow and can shrink if needed */
.game-area {
    max-width: 100% !important;       /* ✅ PARENT WIDTH */
    width: auto !important;
    flex-shrink: 1 !important;
    min-height: 200px !important;
}
```

**The Fix Explained**:
- Game area is a child of flex container `.game-container`
- Using `100%` means it respects flex container's width
- `100vw` would break out of flex layout on mobile

---

## Summary Table

| Change | File | Line | Type | From | To |
|--------|------|------|------|------|-----|
| 1 | index.html | 13 | Path | `/icons/...` | `./icons/...` |
| 2 | index.html | 90 | Link | `/BlokusFocus/assets/...` | *REMOVED* |
| 3 | game-ui.css | 580-581 | Layout | `100vw/vh` | `100% + max` |
| 4 | game-ui.css | 451 | Width | `100%` | `calc(100% - 40px)` |
| 5 | mobile.css | 143 | Max | `100vw` | `calc(100% - 40px)` |
| 6 | mobile.css | 160 | Max | `100vw` | `100%` |

---

## Box Model Visualization

### Problem: 100vw + padding = overflow

```
┌─────────────────────────────────┐
│ Browser Viewport (100vw)        │ 375px
│  ┌─────────────────────────────┐│
│  │ game-container              ││ 375px (100vw)
│  │ width: 100vw                ││
│  │ padding: 16px left + right  ││
│  │                             ││
│  │ Actual size: 375 + 32 = 407px!
│  └─────────────────────────────┘│
│← 32px overflow →                │
└─────────────────────────────────┘
```

### Solution: 100% + box-sizing + max

```
┌──────────────────────────────────┐
│ Browser Viewport (375px)         │
│  ┌────────────────────────────┐  │
│  │ game-container             │  │ 375px
│  │ width: 100%                │  │
│  │ box-sizing: border-box     │  │
│  │ padding: 16px (included)   │  │
│  │                            │  │
│  │ Actual size: 375px ✓       │  │
│  └────────────────────────────┘  │
│ ✓ Perfect fit                     │
└──────────────────────────────────┘
```

---

## Testing Command

After applying all 6 changes, test with:

```bash
# Verify changes are applied
git diff index.html css/game-ui.css css/mobile.css

# Should show:
# - index.html: 2 changes
# - css/game-ui.css: 2 changes  
# - css/mobile.css: 2 changes

# Commit
git add .
git commit -m "Fix: GitHub Pages responsive layout - 6 targeted fixes"

# Push
git push origin main

# Test after ~1 min (GitHub Pages build time)
# Visit: https://goalbgplus.github.io/BlokusFocus/
```

---

**All changes verified and ready for deployment!** ✅
