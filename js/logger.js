/**
 * Game Logger - Monitors all important game events and state changes
 * Useful for debugging, performance analysis, and understanding game flow
 */

// Enable/disable logging globally
export const LOG_ENABLED = true;
export const LOG_DRAG = true;
export const LOG_PLACEMENT = true;
export const LOG_SCORE = true;
export const LOG_PERFORMANCE = true;
export const LOG_GRID = true;
export const LOG_ERRORS = true;

// Color coding for console
const COLORS = {
    DRAG: '#FF6B6B',      // Red
    PLACEMENT: '#4ECDC4', // Teal
    SCORE: '#FFE66D',     // Yellow
    PERF: '#95E1D3',      // Mint
    GRID: '#A8D8EA',      // Light Blue
    ERROR: '#FF4444',     // Dark Red
    SUCCESS: '#66BB6A',   // Green
    INFO: '#90CAF9'       // Bright Blue
};

function styled(text, color) {
    return `%c${text}`;
}

export function log(label, message, color, data = null) {
    if (!LOG_ENABLED) return;
    
    const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        fractionalSecondDigits: 3
    });
    
    const prefix = `[${timestamp}] ${label}`;
    const style = `color: ${color}; font-weight: bold; font-size: 12px;`;
    
    if (data) {
        console.log(styled(prefix, color), style, message, data);
    } else {
        console.log(styled(prefix, color), style, message);
    }
}

// ============= DRAG & DROP LOGGING =============
export function logDragStart(pieceId, startX, startY, gridPosition) {
    if (!LOG_DRAG) return;
    log('DRAG START', `Piece #${pieceId} from (${startX}, ${startY})`, COLORS.DRAG, { gridPosition });
}

export function logDragMove(pieceId, currentX, currentY, gridCell, isValid) {
    if (!LOG_DRAG) return;
    const status = isValid ? '✓ VALID' : '✗ INVALID';
    log('DRAG MOVE', `${status} - Piece #${pieceId} → Cell (${gridCell.row}, ${gridCell.col})`, 
        isValid ? COLORS.SUCCESS : '#FF9800', 
        { pos: `${currentX},${currentY}` });
}

export function logDragEnd(pieceId, gridCell, isPlaced) {
    if (!LOG_DRAG) return;
    const result = isPlaced ? '✓ PLACED' : '✗ CANCELED';
    log('DRAG END', `${result} - Piece #${pieceId}`, 
        isPlaced ? COLORS.SUCCESS : '#FF9800');
}

// ============= PLACEMENT LOGGING =============
export function logPlacementAttempt(pieceId, row, col, rotations) {
    if (!LOG_PLACEMENT) return;
    log('PLACEMENT', `Attempting piece #${pieceId} at (${row}, ${col}) [${rotations} rotations]`, 
        COLORS.PLACEMENT);
}

export function logPlacementValid(pieceId, row, col, cellsFilled) {
    if (!LOG_PLACEMENT) return;
    log('PLACEMENT ✓', `Valid placement - Piece #${pieceId} fills ${cellsFilled} cells`, 
        COLORS.SUCCESS, { position: `(${row}, ${col})` });
}

export function logPlacementInvalid(pieceId, row, col, reason) {
    if (!LOG_PLACEMENT) return;
    log('PLACEMENT ✗', `Invalid - ${reason}`, '#FF9800', 
        { piece: pieceId, position: `(${row}, ${col})` });
}

export function logLineCleared(lines, cellsCleared) {
    if (!LOG_PLACEMENT) return;
    log('LINE CLEAR', `${lines.length} line(s) cleared! ${cellsCleared} cells freed`, 
        COLORS.SUCCESS, { lines: lines.join(', ') });
}

// ============= SCORE LOGGING =============
export function logScoreAdded(points, reason) {
    if (!LOG_SCORE) return;
    log('SCORE +', `+${points} points (${reason})`, COLORS.SCORE, { totalAfter: 'see game state' });
}

export function logCombo(multiplier, totalBonus) {
    if (!LOG_SCORE) return;
    log('COMBO!', `${multiplier}x multiplier! +${totalBonus} bonus`, 
        COLORS.SUCCESS, { multiplier });
}

export function logGameOver(finalScore, piecesUsed) {
    if (!LOG_SCORE) return;
    log('GAME OVER', `Final Score: ${finalScore} (${piecesUsed} pieces used)`, 
        '#FF4444', { finalScore, piecesUsed });
}

// ============= PERFORMANCE LOGGING =============
export function logPerformanceStart(operation) {
    if (!LOG_PERFORMANCE) return;
    performance.mark(`${operation}-start`);
}

export function logPerformanceEnd(operation) {
    if (!LOG_PERFORMANCE) return;
    try {
        performance.mark(`${operation}-end`);
        performance.measure(operation, `${operation}-start`, `${operation}-end`);
        const measure = performance.getEntriesByName(operation)[0];
        const duration = measure.duration.toFixed(2);
        
        const color = duration > 16 ? '#FF6B6B' : COLORS.PERF;
        log('PERF', `${operation}: ${duration}ms`, color);
        
        performance.clearMarks(`${operation}-start`);
        performance.clearMarks(`${operation}-end`);
        performance.clearMeasures(operation);
    } catch (e) {
        console.warn('Performance measurement failed:', e);
    }
}

// ============= GRID STATE LOGGING =============
export function logGridState(gridData, emptyCount) {
    if (!LOG_GRID) return;
    log('GRID STATE', `${emptyCount} empty cells remaining`, COLORS.GRID, 
        { occupied: (100 - emptyCount), coverage: `${((100-emptyCount)/100*100).toFixed(1)}%` });
}

export function logAvailableMoves(moveCount) {
    if (!LOG_GRID) return;
    const status = moveCount > 0 ? `✓ ${moveCount} moves` : '✗ NO MOVES';
    log('MOVES', status, moveCount > 0 ? COLORS.SUCCESS : '#FF9800');
}

export function logGridCellOccupied(row, col, pieceId) {
    if (!LOG_GRID) return;
    log('GRID CELL', `Cell (${row}, ${col}) occupied by piece #${pieceId}`, '#90CAF9');
}

// ============= ERROR LOGGING =============
export function logError(errorType, message, details = null) {
    if (!LOG_ERRORS) return;
    log('ERROR!', `${errorType}: ${message}`, COLORS.ERROR, details);
    console.trace('Error stacktrace:');
}

export function logWarning(message, details = null) {
    if (!LOG_ERRORS) return;
    log('WARNING', message, '#FFA500', details);
}

// ============= STATE LOGGING =============
export function logGameStateSnapshot(state) {
    if (!LOG_ENABLED) return;
    
    console.group('%c📊 GAME STATE SNAPSHOT', `color: ${COLORS.INFO}; font-weight: bold;`);
    console.log('Score:', state.score);
    console.log('High Score:', state.highScore);
    console.log('Game Over:', state.isGameOver);
    console.log('Paused:', state.isPaused);
    console.log('Combo Multiplier:', state.currentComboMultiplier);
    console.log('Grid Empty Cells:', state.gridEmptyCellCount);
    console.log('Dragging:', state.dragState.isDragging);
    console.groupEnd();
}

export function logMoveHistory(moves) {
    if (!LOG_ENABLED) return;
    
    console.group('%c📜 MOVE HISTORY', `color: ${COLORS.INFO}; font-weight: bold;`);
    moves.forEach((move, idx) => {
        console.log(`${idx + 1}. Piece #${move.pieceId} → (${move.row}, ${move.col}) = +${move.pointsEarned}`);
    });
    console.groupEnd();
}

// ============= INITIALIZATION =============
let _gameStartLogged = false; // Prevent duplicate logging on resume

export function logGameStart() {
    if (!LOG_ENABLED || _gameStartLogged) return;
    _gameStartLogged = true; // Mark that we've logged start
    // Note: console.clear() blocked by 'Preserve log' setting - using separator instead
    console.log('%c' + '='.repeat(80), `color: ${COLORS.SUCCESS}; font-size: 11px;`);
    console.log('%c🎮 BLOKUS GAME STARTED', `color: ${COLORS.SUCCESS}; font-size: 16px; font-weight: bold;`);
    console.log('%cLogger enabled - monitoring all game events', `color: ${COLORS.INFO};`);
}

export function resetGameStartFlag() {
    _gameStartLogged = false; // Reset for next full game session
}

export function logGameMode(mode) {
    if (!LOG_ENABLED) return;
    log('GAME MODE', `Mode: ${mode}`, COLORS.INFO);
}

// ============= DETAILED PERFORMANCE TIMING GUIDE =============
/**
 * Guide for interpreting detailed performance timings
 * Use this to understand what console.time/timeEnd logs mean
 */
export function logPerformanceGuide() {
    if (!LOG_ENABLED) return;
    
    console.group('%c⏱️ DETAILED PERFORMANCE TIMING GUIDE', `color: ${COLORS.PERF}; font-weight: bold; font-size: 14px;`);
    
    console.log('%cPLACEMENT TIMINGS:', 'color: #FFE66D; font-weight: bold;');
    console.log('  • placement:save-state: Time to save game state for undo');
    console.log('  • placement:place-piece: Time to add piece to grid array');
    console.log('  • placement:replace-piece: Time to generate new random piece');
    console.log('  • placement:detect-lines: Time to scan for completed lines (CRITICAL)');
    console.log('  • placement:animate-lines: Time for line clear animation');
    console.log('  • placement:update-state: Time to update game state after clears');
    console.log('  • placement:finish-drag: Time to reset UI after placement');
    console.log('  • placement:finish-drag-no-clear: Same as above but without line clears');
    
    console.log('%cFINISH DRAG TIMINGS:', 'color: #FFE66D; font-weight: bold;');
    console.log('  • finishDrag:total: Total time for all cleanup and UI updates');
    console.log('  • finishDrag:hide-elements: Hide clone and highlights');
    console.log('  • finishDrag:reset-state: Reset drag state object');
    console.log('  • finishDrag:update-grid: Redraw entire game grid');
    console.log('  • finishDrag:animate-placement: Show placement animation');
    console.log('  • finishDrag:update-pieces: Refresh piece display and event listeners');
    console.log('  • finishDrag:update-ui: Update score, buttons, overlays');
    
    console.log('%cDRAG MOVEMENT TIMINGS (per frame):', 'color: #FFE66D; font-weight: bold;');
    console.log('  • drag:hit-test: Total time for hit-testing and validation');
    console.log('  • drag:validate-placement: Time to check if piece placement is valid');
    console.log('  • drag:highlight: Time to update ghost piece and highlights');
    console.log('  • touch:hit-test: Same as drag:hit-test but for touch events');
    console.log('  • touch:validate-placement: Same as drag:validate-placement but for touch');
    console.log('  • touch:highlight: Same as drag:highlight but for touch');
    
    console.log('%c⚡ PERFORMANCE TARGETS:', 'color: #66BB6A; font-weight: bold;');
    console.log('  • placement:detect-lines < 10ms (critical - runs on every placement)');
    console.log('  • drag:hit-test < 16ms (must complete in one frame)');
    console.log('  • finishDrag:total < 50ms (should be much faster)');
    console.log('  • drag:validate-placement < 5ms (bottleneck for smoothness)');
    
    console.groupEnd();
}
