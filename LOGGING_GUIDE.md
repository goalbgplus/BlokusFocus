# 🎮 BLOKUS GRID - LOGGING SYSTEM GUIDE

## What is This?

A comprehensive **logging system** has been added to track all important game events in real-time. Open **Developer Tools (F12)** in your browser to see detailed console logs while playing.

## How to Use

### 1. **Open DevTools**
   - Press `F12` on Windows/Linux
   - Press `Cmd + Option + I` on Mac
   - Click **Console** tab

### 2. **Look for Colored Logs**
When you play, you'll see messages like:

```
[13:55:42.123] DRAG START   → Piece #3 from (145, 230)
[13:55:43.456] DRAG MOVE    ✓ VALID - Piece #3 → Cell (3, 2)
[13:55:44.789] PLACEMENT ✓  Valid placement - Piece #3 fills 4 cells
[13:55:45.012] LINE CLEAR   2 line(s) cleared! 20 cells freed
[13:55:45.234] SCORE +      +50 points (line clear)
```

## What Each Color Means

| Color | Event Type | What to Watch For |
|-------|------------|------------------|
| 🔴 Red | **DRAG & DROP** | Piece movement, valid/invalid positions |
| 🔵 Teal | **PLACEMENT** | When pieces are placed, lines cleared |
| 🟡 Yellow | **SCORE** | Points earned, bonuses, combos |
| 🟢 Mint | **PERFORMANCE** | How long operations take (should be < 16ms) |
| 🔷 Blue | **GRID STATE** | Empty cells, available moves |
| ⚫ Dark Red | **ERRORS** | Problems and failures |
| ⚪ Green | **SUCCESS** | Completed actions |

## Console Commands for Debugging

Open DevTools Console and type these to control logging:

```javascript
// Disable all logging
logger.LOG_ENABLED = false;

// Disable specific types
logger.LOG_DRAG = false;           // Hide drag-drop logs
logger.LOG_PLACEMENT = false;       // Hide placement logs
logger.LOG_SCORE = false;           // Hide score logs
logger.LOG_PERFORMANCE = false;     // Hide performance metrics
logger.LOG_GRID = false;            // Hide grid state logs
logger.LOG_ERRORS = false;          // Hide error messages

// View current game state
logger.logGameStateSnapshot(gameState);

// View move history (if available)
logger.logMoveHistory(moveHistory);
```

## Common Issues & How to Debug

### Problem: Drag feels laggy or elastic
```
✅ Solution:
   1. Look at PERF logs - check if updateDraggedPiecePosition < 16ms
   2. Check DRAG MOVE logs - is validity changing every frame or just when needed?
   3. If PERF times are high, that's causing lag
```

### Problem: Pieces won't place where I expect
```
✅ Solution:
   1. Look for PLACEMENT ✗ INVALID logs
   2. Check the reason given (overlapping? out of bounds?)
   3. Look at DRAG MOVE logs to see if position is even being considered
```

### Problem: Score not updating correctly
```
✅ Solution:
   1. Check SCORE + logs - are points being logged?
   2. Check LINE CLEAR logs - is the line detection working?
   3. Check if piece was actually placed (PLACEMENT ✓ VALID log)
```

### Problem: Game ends too early
```
✅ Solution:
   1. Watch GRID STATE logs - when does "0 moves" appear?
   2. Look back at PLACEMENT logs - which pieces failed?
   3. Check DRAG MOVE logs - which positions were marked invalid?
```

### Problem: Performance is bad
```
✅ Solution:
   1. Look at PERF logs - which operations take > 16ms?
   2. If hit-testing is slow, it's the getCellFromPoint calculation
   3. If rendering is slow, it's the DOM update or animation
   4. Check if multiple updates happening simultaneously
```

## Key Metrics to Monitor

### Drag Performance
```javascript
// In console, check:
// PERF: updateDraggedPiecePosition: X.XXms  (should be < 2ms)
// PERF: _handleMouseMoveInner: X.XXms       (should be < 5ms)
// Total should be < 16ms per frame (60fps = 16.67ms)
```

### Placement Performance
```javascript
// In console, check:
// PERF: placement-process: X.XXms  (should be < 50ms)
// PERF: game-init: X.XXms          (first load, < 200ms acceptable)
```

### Grid Coverage
```javascript
// From GRID STATE logs:
[HH:MM:SS.sss] GRID STATE  45 empty cells remaining
// As game progresses, this number should decrease
// When it reaches 0 with no valid moves, game ends
```

## Performance Target Goals

| Operation | Target Time | Acceptable | Bad |
|-----------|------------|-----------|-----|
| Drag movement per frame | < 2ms | < 5ms | > 16ms |
| Hit-testing calculation | < 5ms | < 10ms | > 16ms |
| Placement validation | < 10ms | < 20ms | > 50ms |
| Line clear animation | < 100ms | < 200ms | > 500ms |
| Game initialization | < 200ms | < 500ms | > 1000ms |

## Example: Full Game Session Log

```
🎮 BLOKUS GAME STARTED
Logger enabled - monitoring all game events

[13:55:00.000] GAME MODE  Mode: Blokus Grid
[13:55:00.050] PERF  game-init: 48.32ms

[13:55:05.123] DRAG START  Piece #0 from (152, 234)
[13:55:05.145] DRAG MOVE  ✓ VALID - Piece #0 → Cell (2, 1)
[13:55:05.234] DRAG MOVE  ✓ VALID - Piece #0 → Cell (3, 1)
[13:55:05.456] PLACEMENT ✓  Valid placement - Piece #0 fills 3 cells
[13:55:05.789] SCORE +  +15 points (placement only)

[13:55:08.234] DRAG START  Piece #2 from (298, 145)
[13:55:08.567] PLACEMENT ✓  Valid placement - Piece #2 fills 4 cells
[13:55:08.890] LINE CLEAR  1 line(s) cleared! 10 cells freed
[13:55:08.901] SCORE +  +50 points (line clear)
[13:55:08.912] COMBO!  2x multiplier! +50 bonus

...

[13:56:30.123] GAME OVER  Final Score: 450 (15 pieces used)

🔄 Game Restarted
📊 GAME STATE SNAPSHOT
   Score: 0
   ...
```

## Tips for Optimization

1. **Watch PERF logs** - If any operation > 16ms, it's a bottleneck
2. **Check DRAG MOVE frequency** - Should only log when validity changes, not every frame
3. **Monitor GRID STATE** - Know how many moves are available at each turn
4. **Track LINE CLEAR** - See if combo system is working correctly
5. **Compare versions** - Use version badge color to track optimizations (v2.7 = Blue)

---

**Created**: November 2025  
**Logger Version**: 1.0  
**Status**: ✅ Active and Monitoring
