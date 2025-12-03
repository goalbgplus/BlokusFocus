// Main game logic and event handlers
// ⚠️ IMPORTANT: When making optimizations/fixes, increment version in:
//    1. index.html → <meta name="app-version" content="vX.X">
//    2. The version badge will automatically change color so user sees the refresh

import { gameState, initializeState, resetDragState } from './state.js';
import * as logic from './gameLogic.js';
import * as render from './render.js';
import { dom } from './render.js';  // DOM cache used in initMain
import * as audio from './audio.js';
import { INVALID_PLACEMENT_SHAKE_DURATION, COMBO_MESSAGE_DURATION, GRID_COLS, GRID_ROWS } from './constants.js';
import { activateMagicUniverseBackground, deactivateMagicUniverseBackground } from './backgroundEffects.js';
// import FABManager removed (we no longer use a floating action button container)
import { pieceUnlockSystem } from './pieceUnlockSystem.js';
import { applyStatusBar } from './statusBarTheme.js';
import { initDebugOverlay } from './debugOverlay.js';
import { readyNativeUI, attachAppLifecycle } from './nativeBridge.js';
import { initializeSettings } from './modalManager.js';
import { animateLineClearSpectra } from './rowClearSpectra.js';
import * as logger from './logger.js';

// Exported bootstrap expected by app.js
export function initMain() {
    // If DOM is already ready, run immediately
    const boot = () => {
        try { readyNativeUI(); } catch(e) {}
        try { attachAppLifecycle(); } catch(e) {}
        try { initDebugOverlay(); } catch(e) {}
        try { applyStatusBar(document.body.dataset.theme || 'dark'); } catch(e) {}
        try { initializeSettings(); } catch(e) { console.warn('Failed to initialize settings:', e); }
        // Initialize the game UI and logic
        try { initializeGame(); } catch(e) { /* initializeGame defined later */ }
        // Initialize landing page button effects
        try { initializeLandingPageEffects(); } catch(e) {}
    };
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(boot, 0);
    } else {
        document.addEventListener('DOMContentLoaded', boot);
    }
}

// --- Simple FPS sampler + auto lite-mode ---


// --- Game Mode Management ---
let selectedGameMode = null; // 'classic' or 'collection'

function whenDomReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
        callback();
    }
}

let specialActionListenersAttached = false;
let legacyLandingSetupDone = false;


// --- Landing Page Stats Update ---
export function updateLandingPageStats() {
    // Update high score
    const highScoreEl = document.getElementById('highscore-display');
    if (highScoreEl) {
        const savedHighScore = localStorage.getItem('blokusHighScore') || '0';
        highScoreEl.textContent = savedHighScore;
    }
    
    // Update pieces unlocked based on current progress
    const piecesUnlockedEl = document.getElementById('pieces-unlocked');
    if (piecesUnlockedEl) {
        try {
            const currentScore = parseInt(localStorage.getItem('blokusHighScore') || '0');
            if (typeof pieceUnlockSystem !== 'undefined' && pieceUnlockSystem.getAvailablePieces) {
                const unlockedPieces = pieceUnlockSystem.getAvailablePieces();
                piecesUnlockedEl.textContent = unlockedPieces.length;
            } else {
                // Fallback calculation
                let pieces = 7; // Start with 7 basic pieces
                if (currentScore >= 2000) pieces += 6;
                if (currentScore >= 4000) pieces += 6;
                if (currentScore >= 6000) pieces += 6;
                if (currentScore >= 8000) pieces += 5;
                piecesUnlockedEl.textContent = Math.min(pieces, 30);
            }
        } catch (error) {
            piecesUnlockedEl.textContent = '7';
        }
    }
    
    // Update achievements count (placeholder for future implementation)
    const achievementsEl = document.getElementById('achievements-count');
    if (achievementsEl) {
        // For now, calculate based on score milestones
        const currentScore = parseInt(localStorage.getItem('blokusHighScore') || '0');
        let achievements = 0;
        if (currentScore >= 1000) achievements++;
        if (currentScore >= 5000) achievements++;
        if (currentScore >= 10000) achievements++;
        if (currentScore >= 20000) achievements++;
        if (currentScore >= 50000) achievements++;
        achievementsEl.textContent = achievements;
    }
}

// --- Main Game Flow ---


function initializeGame() {
    // Clean up resources from previous game session and reset paused state
    logger.resetGameStartFlag(); // Reset for fresh game session
    logger.logGameStart();
    cleanupGameResources();
    // Remove paused class so animations run on new game
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        gameContainer.classList.remove('paused');
    }
    render.cacheDOMElements();
    // Attach pause, restart, and settings handlers once DOM cache is ready
    if (!listenersAttached) {
        if (dom.pauseButton) {
            dom.pauseButton.addEventListener('click', togglePause);
            addNeonClickEffect(dom.pauseButton);
        }
        if (dom.restartButton) {
            dom.restartButton.addEventListener('click', handleRestart);
            addNeonClickEffect(dom.restartButton);
        }
        if (dom.settingsButton && window.showSettingsModal) {
            dom.settingsButton.addEventListener('click', window.showSettingsModal);
            addNeonClickEffect(dom.settingsButton);
        }
        if (dom.darkModeToggleGame) {
            addNeonClickEffect(dom.darkModeToggleGame);
        }
        listenersAttached = true;
    }
    render.createGridDOM();
    initializeState();
    logger.logGameMode('Blokus Grid');
    logic.populateInitialPieces();
    logger.logPerformanceStart('game-init');
    // Always create unlock progress indicator when landing hidden
    const landingPage = document.getElementById('landingPage');
    if (typeof render.createUnlockProgressIndicator === 'function' && landingPage && landingPage.classList.contains('hidden')) {
        render.createUnlockProgressIndicator();
    }
    render.updateGridDisplay();
    render.updatePiecesDisplay(true); // Pass true for initial load animation
    render.updateScoreDisplay();
    render.updateControlButtons();
    updateSpecialActionButtons();
    attachPieceEventListeners();
    attachGridEventListeners();
    logger.logPerformanceEnd('game-init');
}

// Add neon glow effect on button click
function addNeonClickEffect(button) {
    if (!button) return;
    
    button.addEventListener('click', function(e) {
        // Remove existing class if present
        this.classList.remove('neon-clicked');
        
        // Trigger reflow
        void this.offsetWidth;
        
    // Play click sound effect
    audio.playUIButtonSound();
    // Add the neon effect class
        this.classList.add('neon-clicked');
        
        // Remove the class after animation completes
        setTimeout(() => {
            this.classList.remove('neon-clicked');
        }, 400);
    });
}

// Initialize landing page button effects
function initializeLandingPageEffects() {
    const themeToggleLanding = document.getElementById('theme-toggle');
    if (themeToggleLanding) {
        addNeonClickEffect(themeToggleLanding);
    }
    // Add sound + neon click to mode buttons
    const modeButtons = document.querySelectorAll('.mode-button.selectable');
    modeButtons.forEach(btn => addNeonClickEffect(btn));
}

function togglePause() {
    if (gameState.isGameOver) return;
    gameState.isPaused = !gameState.isPaused;
    
    render.updateControlButtons();
    // Play pause or resume sound and toggle background animations
    if (gameState.isPaused) {
        audio.playPauseSound();
        document.dispatchEvent(new Event('app:pause'));
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.classList.add('paused');
        }
    } else {
        audio.playResumeSound();
        document.dispatchEvent(new Event('app:resume'));
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.classList.remove('paused');
            // Force reflow to restart paused animations
            void gameContainer.offsetWidth;
        }
    }
}

function handleRestart() {
    logger.logGameStateSnapshot(gameState);
    logger.log('INFO', '🔄 Game Restarted', '#90CAF9');
    // Play restart sound
    audio.playRestartSound();
    // Remove paused state from container so animations reset
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        gameContainer.classList.remove('paused');
    }
    // Then reinitialize game
    initializeGame();
    // Ensure control buttons are updated (hide restart based on pause state)
    render.updateControlButtons();
}

// --- Event Handlers ---

function handlePieceClick(event) {
    if (gameState.isPaused || gameState.isGameOver || gameState.dragState.isDragging) {
        return;
    }
    
    const pieceElement = event.target.closest('.piece');
    
    if (!pieceElement || pieceElement.classList.contains('empty')) {
        return;
    }
    
    const pieceIndex = parseInt(pieceElement.dataset.pieceIndex);
    
    // If we are in rotate mode, use token and rotate
    if (gameState.specialModes.rotateMode && gameState.specialModes.isWaitingForRotate) {
        const success = logic.rotateSpecificPiece(pieceIndex);
        
        if (success) {
            gameState.rotateTokens--; // Consume token on success
            render.updatePiecesDisplay();
            audio.playRotateSound();
            showSpecialModeMessage('rotate', 'Piece rotated successfully!', 1000);
        }
        
        // Reset rotate mode
        gameState.specialModes.rotateMode = false;
        gameState.specialModes.isWaitingForRotate = false;
        updateSpecialActionButtons();
        // Re-enable dragging after exiting rotate mode
        attachPieceEventListeners();
        return;
    }

    // If we are in flip mode, flip piece horizontally
    if (gameState.specialModes.flipMode && gameState.specialModes.isWaitingForFlip) {
        const piece = gameState.currentPieces[pieceIndex];
        
        if (!piece || !piece.currentShape) {
            showSpecialModeMessage('flip', 'Cannot flip this piece', 1500);
            return;
        }
        
        // Apply horizontal flip (mirror left-right)
        const flipped = logic.flipPieceHorizontally(piece);
        
        if (!flipped || !flipped.currentShape) {
            showSpecialModeMessage('flip', 'Flip failed', 1500);
            return;
        }
        
        piece.currentShape = flipped.currentShape;
        piece.id = Date.now() + Math.random(); // Force UI update
        gameState.flipTokens--; // Consume flip token
        
        render.updatePiecesDisplay();
        audio.playRotateSound();
        showSpecialModeMessage('flip', 'Piece flipped!', 1000);
        
        // Reset flip mode
        gameState.specialModes.flipMode = false;
        gameState.specialModes.isWaitingForFlip = false;
        updateSpecialActionButtons();
        attachPieceEventListeners();
        return;
    }

    // If we are in clear line mode, user should click a grid cell not a piece
    if (gameState.specialModes.clearLineMode) {
        showSpecialModeMessage('clearLine', 'Click on a grid cell to clear a line', 1500);
        return;
    }
}

// --- MOUSE EVENT HANDLERS FOR CUSTOM DRAG (Alternative to HTML5 drag & drop) ---

// --- MOUSE MOVE OPTIMIZATION ---
let __lastMouseEvent = null;
let __mouseRAF = 0;
const DRAG_PROFILING_ENABLED = false;
function startDragTimer(label) {
    if (DRAG_PROFILING_ENABLED) console.time(label);
}
function endDragTimer(label) {
    if (DRAG_PROFILING_ENABLED) console.timeEnd(label);
}

/**
 * Wrapper for mousemove to throttle via requestAnimationFrame for better performance
 * BUT updates visual position IMMEDIATELY without waiting for RAF for smooth feel
 */
function handleMouseMove(event) {
    if (!gameState.dragState.isDragging) return;
    
    // DRAG LATENCY FIX: Update visual position IMMEDIATELY - don't wait for RAF
    const clientX = event.clientX;
    const clientY = event.clientY;
    render.updateDraggedPiecePosition(clientX, clientY);
    
    // Mark as moved if threshold exceeded (immediate feedback)
    if (!gameState.dragState.hasMoved) {
        const dx = clientX - gameState.dragState.startX;
        const dy = clientY - gameState.dragState.startY;
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            gameState.dragState.hasMoved = true;
        }
    }
    
    // Store event for RAF processing (hit-testing and highlighting are deferred to RAF)
    __lastMouseEvent = event;
    if (!__mouseRAF) {
        __mouseRAF = requestAnimationFrame(() => {
            const ev = __lastMouseEvent;
            __mouseRAF = 0;
            if (ev) _handleMouseMoveInner(ev);
        });
    }
}

/**
 * Inner handler që ekzekuton logjikën aktuale të lëvizjes së mouse
 * OPTIMIZED: Shmanget përditësimi kur pozicioni nuk ka ndryshuar
 * NOTE: Visual position update is done IMMEDIATELY in handleMouseMove(), not here
 */
function _handleMouseMoveInner(event) {
    if (!gameState.dragState.isDragging) return;
    
    startDragTimer('drag:hit-test');
    const clientX = event.clientX;
    const clientY = event.clientY;
    
    // ✅ Store current pointer position for line clear grid re-positioning
    gameState.dragState.clientX = clientX;
    gameState.dragState.clientY = clientY;
    
    // NOTE: Visual position update is now done IMMEDIATELY in handleMouseMove(), not here
    // This eliminates lag and makes drag feel elastic-free
    
    // Determine drop target using math-based mapping
    const pos = getCellFromPoint(clientX, clientY);
    if (!pos) {
        endDragTimer('drag:hit-test');
        render.clearHighlights();
        gameState.dragState.lastTargetRow = undefined;
        gameState.dragState.lastTargetCol = undefined;
        return;
    }
    
    const startRow = pos.row - gameState.dragState.offsetY;
    const startCol = pos.col - gameState.dragState.offsetX;
    
    // OPTIMIZATION: Shmanget përditësimi nëse pozicioni nuk ka ndryshuar
    if (startRow === gameState.dragState.lastTargetRow && 
        startCol === gameState.dragState.lastTargetCol) {
        endDragTimer('drag:hit-test');
        return; // Asnjë ndryshim, mos bëj asgjë
    }
    
    startDragTimer('drag:validate-placement');
    const piece = gameState.currentPieces[gameState.dragState.pieceIndex];
    const isValid = logic.isValidPlacement(piece.currentShape, startRow, startCol);
    endDragTimer('drag:validate-placement');
    
    // Log only when validity changes (not every frame)
    if ((!gameState.dragState._lastValidState || gameState.dragState._lastValidState !== isValid) && logger.LOG_DRAG) {
        logger.logDragMove(gameState.dragState.pieceIndex, clientX, clientY, 
                          { row: startRow, col: startCol }, isValid);
        gameState.dragState._lastValidState = isValid;
    }
    
    startDragTimer('drag:highlight');
    render.showGhostAndHighlight(piece, startRow, startCol, isValid);
    endDragTimer('drag:highlight');
    
    gameState.dragState.lastTargetRow = startRow;
    gameState.dragState.lastTargetCol = startCol;
    endDragTimer('drag:hit-test');
}

function handleMouseUp(event) {
    if (!gameState.dragState.isDragging) return;
    
    // Cancel any pending RAF
    if (__mouseRAF) {
        cancelAnimationFrame(__mouseRAF);
        __mouseRAF = 0;
    }
    
    // Clean up mouse listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mouseleave', handleMouseUp);
    if ('onpointerup' in window) {
        document.removeEventListener('pointerup', handleMouseUp);
    }
    
    const duration = Date.now() - (gameState.dragState.startTime || 0);
    if (!gameState.dragState.hasMoved && duration < 300) {
        // Tap/click – cancel drag without placement
        finishDrag();
        return;
    }
    
    // Process drop like touch
    const { pieceIndex, lastTargetRow, lastTargetCol } = gameState.dragState;
    
    if (lastTargetRow !== undefined && lastTargetCol !== undefined) {
        const piece = gameState.currentPieces[pieceIndex];
        const isValid = logic.isValidPlacement(piece.currentShape, lastTargetRow, lastTargetCol);
        
        if (isValid) {
            // IMPORTANT: processSuccessfulPlacement itself will call finishDrag()
            // (either directly or via the line-clear animation callback).
            processSuccessfulPlacement(piece, pieceIndex, lastTargetRow, lastTargetCol);
        } else {
            // Invalid placement → shake + single finishDrag()
            processFailedPlacement();
            finishDrag();
        }
    } else {
        // No target at all → failed placement + single finishDrag()
        processFailedPlacement();
        finishDrag();
    }
}

// --- DRAG & DROP (MOUSE) HANDLERS ---

// OPTIMIZATION: Cache grid metrics at drag start to avoid repeated DOM reads during drag move
function cacheGridMetrics() {
    const grid = dom.gameGrid;
    if (!grid) return;

    const rect = grid.getBoundingClientRect();
    let cellSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid-cell-size'));
    if (!cellSize || Number.isNaN(cellSize)) {
        const probe = grid.querySelector('.grid-cell');
        if (probe) cellSize = probe.getBoundingClientRect().width; else cellSize = 40;
    }
    let gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid-gap'));
    if (Number.isNaN(gap)) gap = 0;

    const cs = getComputedStyle(grid);
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padT = parseFloat(cs.paddingTop) || 0;
    const bordL = parseFloat(cs.borderLeftWidth) || 0;
    const bordT = parseFloat(cs.borderTopWidth) || 0;

    Object.assign(gameState.dragState, {
        gridMetricsCached: true,
        gridRect: { left: rect.left, top: rect.top },
        cellSize: cellSize,
        step: cellSize + gap,
        gridPadL: padL,
        gridPadT: padT,
        gridBordL: bordL,
        gridBordT: bordT,
    });
}

// Helper: map a screen point to the nearest grid cell, even when over the gap
// OPTIMIZED: Uses cached grid metrics when available to avoid DOM reads during drag
function getCellFromPoint(clientX, clientY) {
    const grid = dom.gameGrid;
    if (!grid) return null;

    let cellSize, step, gridLeft, gridTop, padL, padT, bordL, bordT;

    // Use cached metrics if available (during drag), otherwise read DOM
    if (gameState.dragState.gridMetricsCached) {
        cellSize = gameState.dragState.cellSize;
        step = gameState.dragState.step;
        gridLeft = gameState.dragState.gridRect.left;
        gridTop = gameState.dragState.gridRect.top;
        padL = gameState.dragState.gridPadL;
        padT = gameState.dragState.gridPadT;
        bordL = gameState.dragState.gridBordL;
        bordT = gameState.dragState.gridBordT;
    } else {
        // Fallback: read from DOM if not cached
        const rect = grid.getBoundingClientRect();
        gridLeft = rect.left;
        gridTop = rect.top;

        cellSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid-cell-size'));
        if (!cellSize || Number.isNaN(cellSize)) {
            const probe = grid.querySelector('.grid-cell');
            if (probe) cellSize = probe.getBoundingClientRect().width; else cellSize = 40;
        }
        let gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid-gap'));
        if (Number.isNaN(gap)) gap = 0;

        step = cellSize + gap;
        const cs = getComputedStyle(grid);
        padL = parseFloat(cs.paddingLeft) || 0;
        padT = parseFloat(cs.paddingTop) || 0;
        bordL = parseFloat(cs.borderLeftWidth) || 0;
        bordT = parseFloat(cs.borderTopWidth) || 0;
    }

    // Quickly reject if completely outside grid bounds
    const gridWidth = 10 * cellSize + 9 * (step - cellSize);
    const gridHeight = 10 * cellSize + 9 * (step - cellSize);
    if (clientX < gridLeft || clientX > gridLeft + gridWidth || 
        clientY < gridTop || clientY > gridTop + gridHeight) {
        return null;
    }

    const x = clientX - gridLeft - padL - bordL;
    const y = clientY - gridTop - padT - bordT;
    
    // Snap to the NEAREST cell center so transitions are symmetric (50/50)
    let col = Math.round((x - cellSize / 2) / step);
    let row = Math.round((y - cellSize / 2) / step);

    // Clamp within grid
    col = Math.min(Math.max(0, col), GRID_COLS - 1);
    row = Math.min(Math.max(0, row), GRID_ROWS - 1);

    return { row, col };
}

function handleDragStart(event) {
    if (gameState.isPaused || gameState.isGameOver) {
        event.preventDefault();
        return;
    }
    
    // Don't allow dragging if in special modes (rotate/flip/hint)
    if (gameState.specialModes.rotateMode || gameState.specialModes.flipMode || gameState.specialModes.hintMode) {
        event.preventDefault();
        return;
    }
    
    // For desktop mouse events, use custom drag behavior instead of HTML5 drag & drop
    if (event.type === 'mousedown') {
        // Prevent default HTML5 drag behavior
        event.preventDefault();
        
        audio.initAudioContext();
        audio.playHapticFeedback(30);

        const pieceElement = event.target.closest('.piece');
        if (!pieceElement || pieceElement.classList.contains('empty')) {
            return;
        }
        const pieceIndex = parseInt(pieceElement.dataset.pieceIndex);
        const pieceData = gameState.currentPieces[pieceIndex];
        
        logger.logDragStart(pieceIndex, event.clientX, event.clientY, { row: 0, col: 0 });
        
        const pieceRect = pieceElement.getBoundingClientRect();
        const clickXInPiece = event.clientX - pieceRect.left;
        const clickYInPiece = event.clientY - pieceRect.top;

        let closestBlock = { dist: Infinity, row: 0, col: 0 };
        pieceElement.querySelectorAll('.piece-block[data-shape-row]').forEach(block => {
            const blockRect = block.getBoundingClientRect();
            const blockCenterX = (blockRect.left - pieceRect.left) + blockRect.width / 2;
            const blockCenterY = (blockRect.top - pieceRect.top) + blockRect.height / 2;
            const distance = Math.hypot(clickXInPiece - blockCenterX, clickYInPiece - blockCenterY);
            if (distance < closestBlock.dist) {
                closestBlock = {
                    dist: distance,
                    row: parseInt(block.dataset.shapeRow),
                    col: parseInt(block.dataset.shapeCol)
                };
            }
        });

        resetDragState();
        // OPTIMIZATION: Cache grid metrics now for fast getCellFromPoint calls during drag
        cacheGridMetrics();
        
        Object.assign(gameState.dragState, {
            isDragging: true,
            pieceIndex: pieceIndex,
            pieceSourceElement: pieceElement,
            offsetX: closestBlock.col,
            offsetY: closestBlock.row,
            startX: event.clientX,
            startY: event.clientY,
            startTime: Date.now(),
            hasMoved: false,
            lastTargetRow: undefined,
            lastTargetCol: undefined,
        });

        render.createDraggedPieceClone(pieceData);
        render.updateDraggedPiecePosition(event.clientX, event.clientY);
        
        pieceElement.classList.add('dragging');
        
        // Add global mouse listeners for custom drag behavior (like touch)
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        // Also add mouseup to window as backup
        window.addEventListener('mouseup', handleMouseUp);
        // Add mouseleave as another backup
        document.addEventListener('mouseleave', handleMouseUp);
        
        // Also try pointer events as backup if supported
        if ('onpointerup' in window) {
            document.addEventListener('pointerup', handleMouseUp);
        }
        
        return;
    }
    
    // For HTML5 drag events, prevent them to avoid conflicts
    if (event.type === 'dragstart') {
        event.preventDefault();
        return;
    }

    pieceElement.classList.add('dragging');
}

function handleDragOver(event) {
    event.preventDefault();
    if (!gameState.dragState.isDragging) return;

    const clientX = event.clientX;
    const clientY = event.clientY;

    render.updateDraggedPiecePosition(clientX, clientY);

    // Prefer math-based mapping to handle gaps between cells
    const pos = getCellFromPoint(clientX, clientY);
    if (!pos) {
        render.clearHighlights();
        gameState.dragState.lastTargetRow = undefined;
        gameState.dragState.lastTargetCol = undefined;
        return;
    }

    const startRow = pos.row - gameState.dragState.offsetY;
    const startCol = pos.col - gameState.dragState.offsetX;

    const piece = gameState.currentPieces[gameState.dragState.pieceIndex];
    const isValid = logic.isValidPlacement(piece.currentShape, startRow, startCol);

    render.showGhostAndHighlight(piece, startRow, startCol, isValid);

    gameState.dragState.lastTargetRow = startRow;
    gameState.dragState.lastTargetCol = startCol;
}

function handleDrop(event) {
    event.preventDefault();
    if (!gameState.dragState.isDragging) return;

    const { pieceIndex, lastTargetRow, lastTargetCol } = gameState.dragState;
    
    if (lastTargetRow !== undefined && lastTargetCol !== undefined) {
        const piece = gameState.currentPieces[pieceIndex];
        if (logic.isValidPlacement(piece.currentShape, lastTargetRow, lastTargetCol)) {
            processSuccessfulPlacement(piece, pieceIndex, lastTargetRow, lastTargetCol);
            // finishDrag() will be called from processSuccessfulPlacement callback
        } else {
            processFailedPlacement();
            finishDrag();
        }
    } else {
        processFailedPlacement();
        finishDrag();
    }
}

function handleDragEnd() {
    if (!gameState.dragState.isDragging) return;
    finishDrag();
}

// Fallback handler for desktop mouse operations
function handleDragEndFallback() {
    // Only trigger if we're actually dragging and haven't handled it yet
    if (gameState.dragState.isDragging) {
        finishDrag();
    }
}

// --- TOUCH EVENT CLEANUP FUNCTIONS ---

/**
 * Removes all global touch event listeners to prevent memory leaks
 */
function cleanupTouchListeners() {
    // Cancel any pending RAF
    if (__dragRAF) {
        cancelAnimationFrame(__dragRAF);
        __dragRAF = 0;
    }
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    document.removeEventListener('touchcancel', handleTouchEnd);
}

// --- TOUCH MOVE WRAPPER FOR PASSIVE HANDLING ---
let __lastTouchEvent = null;
let __dragRAF = 0;

/**
 * Wrapper for touchmove to throttle _handleTouchMoveInner via requestAnimationFrame
 * BUT updates visual position IMMEDIATELY without waiting for RAF for smooth feel
 */
function handleTouchMove(event) {
    if (!gameState.dragState.isDragging) return;
    if (event.cancelable) {
        event.preventDefault(); // kill browser scroll/zoom heuristics ASAP
    }
    
    // Find the correct touch by identifier
    const touch = Array.from(event.touches).find(t => t.identifier === gameState.dragState.touchIdentifier);
    if (!touch) return;
    
    // DRAG LATENCY FIX: Update visual position IMMEDIATELY - don't wait for RAF
    // This eliminates the "elastic" lag by keeping visuals in sync with finger
    const clientX = touch.clientX;
    const clientY = touch.clientY;
    render.updateDraggedPiecePosition(clientX, clientY + gameState.dragState.touchOffsetY);
    
    // Mark as moved if threshold exceeded (immediate feedback)
    if (!gameState.dragState.hasMoved) {
        const dx = clientX - gameState.dragState.startX;
        const dy = clientY - gameState.dragState.startY;
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            gameState.dragState.hasMoved = true;
        }
    }
    
    // Store event for RAF processing (hit-testing and highlighting are deferred to RAF)
    __lastTouchEvent = event;
    if (!__dragRAF) {
        __dragRAF = requestAnimationFrame(() => {
            const ev = __lastTouchEvent;
            __dragRAF = 0;
            if (ev) _handleTouchMoveInner(ev);
        });
    }
}

// --- TOUCH EVENT HANDLERS ---

function handleTouchStart(event) {
    if (gameState.isPaused || gameState.isGameOver) return;
    
    // Don't allow dragging if in special modes (rotate/flip/hint)
    if (gameState.specialModes.rotateMode || gameState.specialModes.flipMode || gameState.specialModes.hintMode) {
        return;
    }
    
    // Only prevent default if dragging a piece
    if (event.cancelable && event.target.closest('.piece')) {
        event.preventDefault();
    }

    // Clean up any existing touch listeners before adding new ones
    cleanupTouchListeners();

    audio.initAudioContext();
    audio.playHapticFeedback(30);

    const touch = event.touches[0];
    const pieceElement = event.target.closest('.piece');
    if (!pieceElement || pieceElement.classList.contains('empty')) {
        return;
    }
    const pieceIndex = parseInt(pieceElement.dataset.pieceIndex);
    const pieceData = gameState.currentPieces[pieceIndex];

    const pieceRect = pieceElement.getBoundingClientRect();
    const touchXInPiece = touch.clientX - pieceRect.left;
    const touchYInPiece = touch.clientY - pieceRect.top;

    let closestBlock = { dist: Infinity, row: 0, col: 0 };
    pieceElement.querySelectorAll('.piece-block[data-shape-row]').forEach(block => {
        const blockRect = block.getBoundingClientRect();
        const blockCenterX = (blockRect.left - pieceRect.left) + blockRect.width / 2;
        const blockCenterY = (blockRect.top - pieceRect.top) + blockRect.height / 2;
        const distance = Math.hypot(touchXInPiece - blockCenterX, touchYInPiece - blockCenterY);
        if (distance < closestBlock.dist) {
            closestBlock = {
                dist: distance,
                row: parseInt(block.dataset.shapeRow),
                col: parseInt(block.dataset.shapeCol)
            };
        }
    });
    
    const TOUCH_OFFSET_Y = -85;
    resetDragState();
    // OPTIMIZATION: Cache grid metrics now for fast getCellFromPoint calls during drag
    cacheGridMetrics();
    
    Object.assign(gameState.dragState, {
        isDragging: true,
        pieceIndex: pieceIndex,
        pieceSourceElement: pieceElement,
        offsetX: closestBlock.col,
        offsetY: closestBlock.row,  // NOW USING ACCURATE OFFSET
        touchIdentifier: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        hasMoved: false,
        touchOffsetY: TOUCH_OFFSET_Y,
    });
    render.createDraggedPieceClone(pieceData);
    render.updateDraggedPiecePosition(touch.clientX, touch.clientY + TOUCH_OFFSET_Y);
    pieceElement.classList.add('dragging');

    // Add touch listeners with proper cleanup tracking
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: false });
}

function _handleTouchMoveInner(event) {
    if (!gameState.dragState.isDragging) return;
    if (event.cancelable) event.preventDefault();

    startDragTimer('touch:hit-test');
    
    // Find the correct touch by identifier
    const touch = Array.from(event.touches).find(t => t.identifier === gameState.dragState.touchIdentifier);
    if (!touch) {
        endDragTimer('touch:hit-test');
        return;
    }
    const clientX = touch.clientX;
    const clientY = touch.clientY;

    // ✅ Store current pointer position for line clear grid re-positioning
    gameState.dragState.clientX = clientX;
    gameState.dragState.clientY = clientY + gameState.dragState.touchOffsetY;

    // NOTE: Visual position update is now done IMMEDIATELY in handleTouchMove(), not here
    // This eliminates lag and makes drag feel elastic-free

    // Determine drop target using math-based mapping (robust over gaps)
    const pos = getCellFromPoint(clientX, clientY + gameState.dragState.touchOffsetY);
    if (!pos) {
        endDragTimer('touch:hit-test');
        render.clearHighlights();
        gameState.dragState.lastTargetRow = undefined;
        gameState.dragState.lastTargetCol = undefined;
        return;
    }
    const startRow = pos.row - gameState.dragState.offsetY;
    const startCol = pos.col - gameState.dragState.offsetX;
    
    // OPTIMIZATION: Shmanget përditësimi nëse pozicioni nuk ka ndryshuar
    if (startRow === gameState.dragState.lastTargetRow && 
        startCol === gameState.dragState.lastTargetCol) {
        endDragTimer('touch:hit-test');
        return; // Asnjë ndryshim, mos bëj asgjë
    }
    
    startDragTimer('touch:validate-placement');
    const piece = gameState.currentPieces[gameState.dragState.pieceIndex];
    const isValid = logic.isValidPlacement(piece.currentShape, startRow, startCol);
    endDragTimer('touch:validate-placement');
    
    startDragTimer('touch:highlight');
    render.showGhostAndHighlight(piece, startRow, startCol, isValid);
    endDragTimer('touch:highlight');
    
    gameState.dragState.lastTargetRow = startRow;
    gameState.dragState.lastTargetCol = startCol;
    endDragTimer('touch:hit-test');
}

function handleTouchEnd(event) {
    if (!gameState.dragState.isDragging) return;
    
    // Clean up touch listeners immediately
    cleanupTouchListeners();
    
    const duration = Date.now() - (gameState.dragState.startTime || 0);
    if (!gameState.dragState.hasMoved && duration < 300) {
        // Tap – cancel drag
        finishDrag();
        return;
    }
    // Otherwise, treat as drop. Let handleDrop decide when to call finishDrag().
    setTimeout(() => {
        handleDrop(event);
        // DO NOT call finishDrag() here – handleDrop / processSuccessfulPlacement /
        // processFailedPlacement already handle it correctly.
    }, 50);
}

// --- HELPER FUNCTIONS FOR DRAG/DROP LOGIC ---

function processSuccessfulPlacement(piece, pieceIndex, row, col) {
    logger.logPlacementValid(pieceIndex, row, col, piece.currentShape.length);
    logger.logPerformanceStart('placement-process');
    
    // Clear any active hint highlights when placing a piece
    if (window.clearHintHighlights) {
        window.clearHintHighlights();
    }
    
    // DETAILED PERF: Save game state
    console.time('placement:save-state');
    logic.saveGameState();
    console.timeEnd('placement:save-state');
    
    // Record cells for placement animation
    gameState.lastPlacementCells = piece.currentShape.map(([r, c]) => ({ r: row + r, c: col + c }));
    
    // DETAILED PERF: Place piece on grid
    console.time('placement:place-piece');
    logic.placePieceOnGrid(piece, row, col);
    console.timeEnd('placement:place-piece');
    
    audio.playPlaceSound();
    
    // DETAILED PERF: Replace used piece
    console.time('placement:replace-piece');
    logic.replaceUsedPiece(pieceIndex);
    console.timeEnd('placement:replace-piece');

    // DETAILED PERF: Detect and clear lines
    console.time('placement:detect-lines');
    const clearResult = logic.checkAndClearLines(piece.color);
    console.timeEnd('placement:detect-lines');
    
    if (clearResult) {
        const totalLines = clearResult.clearedRows.length + clearResult.clearedCols.length;
        logger.logLineCleared(clearResult.clearedRows.concat(clearResult.clearedCols), totalLines * 10);
        logger.logScoreAdded(clearResult.pointsEarned, 'line clear');
        
        // DETAILED PERF: Animate line clears
        console.time('placement:animate-lines');
        // Animate line clears, then handle Game Over after animations
        handleLineClearEffects(clearResult, () => {
            console.timeEnd('placement:animate-lines');
            
            // DETAILED PERF: Update special actions and game state
            console.time('placement:update-state');
            updateSpecialActionButtons();
            logic.updateGameOverState();
            if (gameState.isGameOver) {
                gameState.isPaused = false;
                audio.playGameOverSound();
                logger.logGameOver(gameState.score, pieceIndex + 1);
            }
            render.updateOverlays();
            console.timeEnd('placement:update-state');
            
            // DETAILED PERF: Finish drag
            console.time('placement:finish-drag');
            finishDrag();
            console.timeEnd('placement:finish-drag');
            
            logger.logPerformanceEnd('placement-process');
        }, piece.color);
        checkSpecialRewards(clearResult.pointsEarned, clearResult.comboCount);
    } else {
        // No clears: check Game Over immediately
        logger.logScoreAdded(0, 'placement only');
        
        // DETAILED PERF: Update state when no clears
        console.time('placement:update-state-no-clear');
        updateSpecialActionButtons();
        logic.updateGameOverState();
        if (gameState.isGameOver) {
            gameState.isPaused = false;
            audio.playGameOverSound();
            logger.logGameOver(gameState.score, pieceIndex + 1);
        }
        render.updateOverlays();
        console.timeEnd('placement:update-state-no-clear');
        
        // DETAILED PERF: Finish drag
        console.time('placement:finish-drag-no-clear');
        finishDrag();
        console.timeEnd('placement:finish-drag-no-clear');
        
        logger.logPerformanceEnd('placement-process');
    }
}

function processFailedPlacement() {
    logger.logWarning('Invalid placement attempt - piece cannot be placed there');
    render.shakeDraggedPieceClone(INVALID_PLACEMENT_SHAKE_DURATION);
    audio.playHapticFeedback([20, 10, 20]);
}

function finishDrag() {
    console.time('finishDrag:total');
    
    console.time('finishDrag:hide-elements');
    render.hideDraggedPieceClone();
    render.clearHighlights();
    console.timeEnd('finishDrag:hide-elements');
    
    // Clean up touch listeners in case they weren't cleaned up elsewhere
    cleanupTouchListeners();
    
    // Clean up mouse listeners in case they weren't cleaned up elsewhere
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mouseleave', handleMouseUp);
    if ('onpointerup' in window) {
        document.removeEventListener('pointerup', handleMouseUp);
    }
    
    if (gameState.dragState.pieceSourceElement) {
        gameState.dragState.pieceSourceElement.classList.remove('dragging');
    }

    console.time('finishDrag:reset-state');
    // Reset drag state completely
    resetDragState();
    console.timeEnd('finishDrag:reset-state');
    
    console.time('finishDrag:update-grid');
    render.updateGridDisplay();
    console.timeEnd('finishDrag:update-grid');
    
    console.time('finishDrag:animate-placement');
    // Animate the recently placed cells
    render.animatePlacement(gameState.lastPlacementCells);
    console.timeEnd('finishDrag:animate-placement');
    
    console.time('finishDrag:update-pieces');
    // Always update pieces display after drag operations since pieces may have changed
    // (when a piece is placed, it gets replaced with a new one)
    render.updatePiecesDisplay();
    attachPieceEventListeners();
    console.timeEnd('finishDrag:update-pieces');
    
    console.time('finishDrag:update-ui');
    render.updateScoreDisplay();
    render.updateControlButtons();
    render.updateOverlays(); // Thirrja e re për të menaxhuar mbivendosjet
    // Clear placement animation flag
    render.clearPlacementFlag();
    console.timeEnd('finishDrag:update-ui');
    
    console.timeEnd('finishDrag:total');
}

function handleLineClearEffects(clearResult, onComplete, placedPieceColor = null) {
    audio.playClearSound(clearResult.totalLinesCleared);
    const boardSize = GRID_COLS;
    const gameGrid = dom.gameGrid;
    const gameArea = document.querySelector('.game-area');
    
    // Use placedPieceColor from clearResult if not provided
    if (!placedPieceColor && clearResult.placedPieceColor) {
        placedPieceColor = clearResult.placedPieceColor;
    }
    
    // Determine a visual color to use for the clear bar/frame.
    // Preference order:
    // 1) explicit placedPieceColor (palette index)
    // 2) clearResult.placedPieceColor (propagated from gameLogic)
    // 3) first cell's `animationColor` if present (string hex/rgb)
    let visualPieceColor = placedPieceColor || (clearResult && clearResult.placedPieceColor) || null;
    if (!visualPieceColor && clearResult && Array.isArray(clearResult.cellsToAnimate) && clearResult.cellsToAnimate.length) {
        const firstAnim = clearResult.cellsToAnimate.find(c => c && c.animationColor);
        if (firstAnim && firstAnim.animationColor) {
            visualPieceColor = firstAnim.animationColor;
        }
    }

    // Call Galaxy Row Clear animation
    animateLineClearSpectra({
        ctx: null, // Not using canvas
        rows: clearResult.clearedRows || [],
        cols: clearResult.clearedCols || [],
        boardSize: boardSize,
        placedPieceColor: visualPieceColor,
        onClearRow: (r) => {
            // Clear row from game state
            gameState.grid[r] = Array(boardSize).fill(0);
            // ✅ Update DOM immediately (not after 1500ms)
            render.updateGridDisplay();
            // ✅ If user is dragging, re-position clone after grid layout change
            if (gameState.dragState.isDragging) {
                const { clientX, clientY } = gameState.dragState;
                if (clientX !== undefined && clientY !== undefined) {
                    render.updateDraggedPiecePosition(clientX, clientY);
                }
            }
        },
        onClearCol: (c) => {
            // Clear column from game state
            for (let r = 0; r < GRID_ROWS; r++) {
                gameState.grid[r][c] = 0;
            }
            // ✅ Update DOM immediately (not after 1500ms)
            render.updateGridDisplay();
            // ✅ If user is dragging, re-position clone after grid layout change
            if (gameState.dragState.isDragging) {
                const { clientX, clientY } = gameState.dragState;
                if (clientX !== undefined && clientY !== undefined) {
                    render.updateDraggedPiecePosition(clientX, clientY);
                }
            }
        },
        onDone: () => {
            // After all clears finished, invoke onComplete callback
            if (typeof onComplete === 'function') onComplete();
            if (clearResult.comboCount > 1) {
                render.showComboMessage(clearResult.comboCount);
            }
        },
        syncStart: true // Start all animations at same time
    });
}

// --- EARNING SPECIAL TOKENS ---
function checkSpecialRewards(points, comboCount) {
    const gameMode = localStorage.getItem('selectedGameMode') || 'collection';
    
    // Check for piece unlocks only in Collection Mode
    if (gameMode === 'collection') {
        pieceUnlockSystem.checkForUnlocks(gameState.score);
    }
    
    // Every 1000 points earn a rotate
    if (Math.floor(gameState.score / 1000) > Math.floor((gameState.score - points) / 1000)) {
        gameState.rotateTokens++;
    }
    // Every 2000 points earn an undo
    if (Math.floor(gameState.score / 2000) > Math.floor((gameState.score - points) / 2000)) {
        gameState.undoTokens++;
    }
    // Combo >= 4 earns a clear line
    if (comboCount >= 4) {
        gameState.clearLineTokens++;
    }
    // Every 3000 points earn a hint
    if (Math.floor(gameState.score / 3000) > Math.floor((gameState.score - points) / 3000)) {
        gameState.hintTokens++;
    }
}

function updateSpecialActionButtons() {
    // Legacy button references (for backward compatibility)
    const rotateBtn = document.getElementById('rotateBtn');
    const undoBtn = document.getElementById('undoBtn');
    const clearLineBtn = document.getElementById('clearLineBtn');
    const flipBtn = document.getElementById('flipBtn');
    
    // FAB button references
    const fabRotate = document.getElementById('fabRotate');
    const fabUndo = document.getElementById('fabUndo');
    const fabClearLine = document.getElementById('fabClearLine');
    const fabFlip = document.getElementById('fabFlip');
    const fabHint = document.getElementById('fabHint');
    
    // Update button states (legacy)
    if (rotateBtn) {
        rotateBtn.disabled = gameState.rotateTokens <= 0;
        rotateBtn.classList.toggle('active-mode', gameState.specialModes.rotateMode);
    }
    if (undoBtn) undoBtn.disabled = gameState.undoTokens <= 0;
    if (clearLineBtn) {
        clearLineBtn.disabled = gameState.clearLineTokens <= 0;
        clearLineBtn.classList.toggle('active-mode', gameState.specialModes.clearLineMode);
    }
    if (flipBtn) {
        flipBtn.disabled = gameState.flipTokens <= 0;
        flipBtn.classList.toggle('active-mode', gameState.specialModes.flipMode);
    }
    
    // Update token counts (legacy)
    const rotateCountEl = document.getElementById('rotateCount');
    const undoCountEl = document.getElementById('undoCount');
    const clearLineCountEl = document.getElementById('clearLineCount');
    const flipCountEl = document.getElementById('flipCount');
    
    if (rotateCountEl) rotateCountEl.textContent = gameState.rotateTokens;
    if (undoCountEl) undoCountEl.textContent = gameState.undoTokens;
    if (clearLineCountEl) clearLineCountEl.textContent = gameState.clearLineTokens;
    if (flipCountEl) flipCountEl.textContent = gameState.flipTokens;
}

// --- EVENT LISTENERS FOR SPECIAL BUTTONS ---
function setupSpecialActionButtons() {
    if (specialActionListenersAttached) {
        return;
    }

    // Export globals for legacy integrations
    window.initializeGame = initializeGame;
    window.attachPieceEventListeners = attachPieceEventListeners;

    // Rotate Button Handler
    function handleRotateAction(e) {
        if (gameState.rotateTokens > 0) {
            // If already in rotate mode, clicking again cancels it.
            if (gameState.specialModes.rotateMode) {
                gameState.specialModes.rotateMode = false;
                gameState.specialModes.isWaitingForRotate = false;
                showSpecialModeMessage('rotate_cancel', null, 1500);
            } else {
                // Activate rotate mode. Deactivate all other modes.
                gameState.specialModes.clearLineMode = false;
                gameState.specialModes.hintMode = false;
                gameState.specialModes.flipMode = false;
                gameState.specialModes.rotateMode = true;
                gameState.specialModes.isWaitingForRotate = true;
                showSpecialModeMessage('rotate', null, 2000);
            }
            // Update UI for all cases
            updateSpecialActionButtons();
            attachPieceEventListeners();
        }
    }

    // Undo Button Handler
    function handleUndoAction(e) {
        if (gameState.undoTokens > 0) {
            // Show visual feedback
            const undoBtn = e?.currentTarget || document.getElementById('undoBtn');
            if (undoBtn) {
                undoBtn.classList.add('active-mode');
                setTimeout(() => undoBtn.classList.remove('active-mode'), 300);
            }
            
            gameState.undoTokens--; // Consume the token immediately

            if (logic.undoLastMove()) {
                // State was successfully restored. Now update the UI to reflect it.
                render.updateGridDisplay();
                render.updatePiecesDisplay();
                render.updateScoreDisplay();
                updateSpecialActionButtons(); // This will show the new token count
                attachPieceEventListeners();

                showSpecialModeMessage('undo', 'Last move undone!', 2000);
            } else {
                // The undo failed (no history), so refund the token.
                gameState.undoTokens++;
                updateSpecialActionButtons(); // Also update UI on failure
                showSpecialModeMessage('error', 'No moves to undo!', 2000);
            }
        }
    }

    // Clear Line Button Handler
    function handleClearLineAction() {
        if (gameState.clearLineTokens > 0) {
            // Toggle clear line mode
            const activating = !gameState.specialModes.clearLineMode;
            // Deactivate all other modes
            gameState.specialModes.rotateMode = false;
            gameState.specialModes.flipMode = false;
            gameState.specialModes.hintMode = false;
            gameState.specialModes.clearLineMode = activating;
            gameState.specialModes.isWaitingForRotate = false;
            gameState.specialModes.isWaitingForFlip = false;
            gameState.specialModes.isWaitingForSelection = activating; // Set flag for grid cell click detection

            if (activating) {
                render.highlightClearableLines(); // Show which lines can be cleared
                showSpecialModeMessage('clearLine'); // Show the instructional message
            } else {
                render.clearLineHighlights(); // Remove highlights
                showSpecialModeMessage('clearLine_cancel', 'Clear line mode cancelled.', 2000);
            }
            // Update button styles and piece draggability
            updateSpecialActionButtons();
            attachPieceEventListeners();
        }
    }

    // Flip Button Handler (Enter flip mode, then click piece to rotate 180°)
    function handleFlipAction(e) {
        if (gameState.flipTokens > 0) {
            // If already in flip mode, clicking again cancels it.
            if (gameState.specialModes.flipMode) {
                gameState.specialModes.flipMode = false;
                gameState.specialModes.isWaitingForFlip = false;
                showSpecialModeMessage('flip_cancel', 'Flip mode cancelled', 1500);
            } else {
                // Activate flip mode. Deactivate all other modes.
                gameState.specialModes.rotateMode = false;
                gameState.specialModes.clearLineMode = false;
                gameState.specialModes.flipMode = true;
                gameState.specialModes.isWaitingForFlip = true;
                showSpecialModeMessage('flip', 'Click a piece to flip it', 2000);
            }
            // Update UI for all cases
            updateSpecialActionButtons();
            attachPieceEventListeners();
        }
    }


    // Wire up buttons (legacy + FAB variants)
    const legacyRotateBtn = document.getElementById('rotateBtn');
    if (legacyRotateBtn) {
        legacyRotateBtn.addEventListener('click', handleRotateAction);
        legacyRotateBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleRotateAction(e);
        });
    }

    const fabRotateBtn = document.getElementById('fabRotate');
    if (fabRotateBtn) {
        fabRotateBtn.addEventListener('click', handleRotateAction);
        fabRotateBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleRotateAction(e);
        });
    }

    const legacyUndoBtn = document.getElementById('undoBtn');
    if (legacyUndoBtn) {
        legacyUndoBtn.addEventListener('click', handleUndoAction);
        legacyUndoBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleUndoAction(e);
        });
    }

    const fabUndoBtn = document.getElementById('fabUndo');
    if (fabUndoBtn) {
        fabUndoBtn.addEventListener('click', handleUndoAction);
        fabUndoBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleUndoAction(e);
        });
    }

    const legacyClearLineBtn = document.getElementById('clearLineBtn');
    if (legacyClearLineBtn) {
        legacyClearLineBtn.addEventListener('click', handleClearLineAction);
        legacyClearLineBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleClearLineAction(e);
        });
    }

    const fabClearLineBtn = document.getElementById('fabClearLine');
    if (fabClearLineBtn) {
        fabClearLineBtn.addEventListener('click', handleClearLineAction);
        fabClearLineBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleClearLineAction(e);
        });
    }

    const legacyFlipBtn = document.getElementById('flipBtn');
    if (legacyFlipBtn) {
        legacyFlipBtn.addEventListener('click', handleFlipAction);
        legacyFlipBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleFlipAction(e);
        });
    }

    const fabFlipBtn = document.getElementById('fabFlip');
    if (fabFlipBtn) {
        fabFlipBtn.addEventListener('click', handleFlipAction);
        fabFlipBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleFlipAction(e);
        });
    }



    specialActionListenersAttached = true;
}

whenDomReady(setupSpecialActionButtons);

// --- Event Listener Setup ---

// Global event delegation for piece clicks
function handleDelegatedPieceClick(event) {
    // Find the piece element
    const pieceElement = event.target.closest('.piece');
    
    if (!pieceElement || pieceElement.classList.contains('empty')) {
        return;
    }
    
    // Call the original handler with modified event
    const syntheticEvent = {
        ...event,
        target: pieceElement,
        currentTarget: pieceElement
    };
    
    handlePieceClick(syntheticEvent);
}

// Touch event delegation for mobile piece interactions
function handleDelegatedPieceTouch(event) {
    // Only handle if we're in a special mode where drag is disabled
    const inSpecialMode = gameState.specialModes.rotateMode || gameState.specialModes.flipMode || gameState.specialModes.clearLineMode || gameState.specialModes.hintMode;
    if (!inSpecialMode) {
        return; // Let touchstart handler handle normal drag
    }
    
    // Prevent default to avoid ghost clicks
    event.preventDefault();
    
    // Find the piece element
    const pieceElement = event.target.closest('.piece');
    
    if (!pieceElement || pieceElement.classList.contains('empty')) {
        return;
    }
    
    // Call the original handler with modified event
    const syntheticEvent = {
        ...event,
        target: pieceElement,
        currentTarget: pieceElement
    };
    
    handlePieceClick(syntheticEvent);
}

function attachPieceEventListeners() {
    // Setup event delegation on pieces container
    const piecesContainer = document.querySelector('.pieces-container');
    if (piecesContainer) {
        // Always remove existing listener first to prevent duplicates
        piecesContainer.removeEventListener('click', handleDelegatedPieceClick);
        piecesContainer.addEventListener('click', handleDelegatedPieceClick);
        
        // Add touch event delegation for mobile special modes
        piecesContainer.removeEventListener('touchend', handleDelegatedPieceTouch);
        piecesContainer.addEventListener('touchend', handleDelegatedPieceTouch, { passive: false });
    }
    
    // Still attach drag listeners directly to pieces
    const pieces = document.querySelectorAll('.piece:not(.empty)');
    
    pieces.forEach((piece, index) => {
        
        // Disable drag on pieces if in special modes to allow clicks
        const shouldDisableDrag = gameState.specialModes.rotateMode || gameState.specialModes.flipMode || gameState.specialModes.clearLineMode || gameState.specialModes.hintMode;
        // Always disable HTML5 drag to avoid conflicts with custom mouse handling
        piece.setAttribute('draggable', 'false');
        
        // ALWAYS remove existing listeners first to prevent memory leaks
        piece.removeEventListener('dragstart', handleDragStart);
        piece.removeEventListener('mousedown', handleDragStart);
        piece.removeEventListener('touchstart', handleDragStart);
        
        // Add drag listeners only when not in special modes
        if (!shouldDisableDrag) {
            // Don't add dragstart listener - we're using custom mouse handling
            piece.addEventListener('mousedown', handleDragStart);
            piece.addEventListener('touchstart', handleTouchStart, { passive: false });
        }
        
    });
    
    // Mark listeners as attached
    listenersAttached = true;
}

// Entry point of the application

// --- THEME SETUP (ADDED SECTION) ---
function setupLegacyLandingFlow() {
    if (legacyLandingSetupDone) {
        return;
    }

    render.cacheDOMElements();
    render.createGridDOM();

    const initialTheme = localStorage.getItem('blokusTheme') || 'default';
    if (initialTheme === 'magic-universe') {
        activateMagicUniverseBackground();
    }

    updateLandingPageStats();

    const dom = render.dom;

    // Game Mode Selection Handlers - kept for backward compatibility with older landing layout
    const classicModeCard = document.getElementById('classicMode');
    const collectionModeCard = document.getElementById('collectionMode');
    const feedbackElement = document.querySelector('.feedback');

    if (classicModeCard && collectionModeCard) {
        const savedMode = localStorage.getItem('selectedGameMode');
        if (savedMode) {
            selectGameMode(savedMode);
        }

        function selectGameMode(mode) {
            selectedGameMode = mode;

            localStorage.setItem('selectedGameMode', selectedGameMode);

            if (feedbackElement) {
                feedbackElement.style.display = 'none';
                feedbackElement.textContent = '';
            }

            document.querySelectorAll('.card.selectable').forEach(card => {
                card.classList.remove('selected');
            });

            if (mode === 'classic') {
                classicModeCard.classList.add('selected');
            } else if (mode === 'collection') {
                collectionModeCard.classList.add('selected');
            }

            if (dom.startButton) {
                dom.startButton.classList.remove('hidden');
                dom.startButton.disabled = false;
                dom.startButton.innerHTML = `<i class="fas fa-play-circle"></i> Start ${mode === 'classic' ? 'Classic' : 'Collection'}`;
                dom.startButton.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    dom.startButton.style.transform = 'scale(1)';
                }, 300);
            }
        }

        // Legacy event listeners remain disabled intentionally (handled via landing.js)
    }

    if (dom.gameOverRestartButton) {
        dom.gameOverRestartButton.addEventListener('click', () => {
            // Hide special-actions container when returning to landing
            const specialActions = document.querySelector('.special-actions');
            if (specialActions) specialActions.classList.add('hidden');

            dom.landingPage.classList.remove('hidden');
            dom.gameContainer.classList.add('hidden');

            initializeGame();
        });
    }

    document.body.addEventListener('click', audio.initAudioContext, { once: true });
    document.body.addEventListener('touchstart', audio.initAudioContext, { once: true });

    legacyLandingSetupDone = true;
}

whenDomReady(setupLegacyLandingFlow);

document.addEventListener('touchmove', function(event) {
    if (gameState.dragState && gameState.dragState.isDragging && event.scale !== 1) {
        event.preventDefault();
    }
}, { passive: false });

// --- FUNCTIONS FOR SPECIAL MODES ---

function attachGridEventListeners() {
    // Attach drag & drop listeners to the main grid container
    if (dom.gameGrid) {
        // Remove existing listeners first to prevent duplicates
        dom.gameGrid.removeEventListener('dragover', handleDragOver);
        dom.gameGrid.removeEventListener('drop', handleDrop);
        dom.gameGrid.removeEventListener('dragend', handleDragEnd);
        
        // Add drag & drop listeners
        dom.gameGrid.addEventListener('dragover', handleDragOver);
        dom.gameGrid.addEventListener('drop', handleDrop);
        dom.gameGrid.addEventListener('dragend', handleDragEnd);
    }
    
    // Add global dragend listener to handle drops outside the grid
    document.removeEventListener('dragend', handleDragEnd);
    document.addEventListener('dragend', handleDragEnd);
    
    // Add global mouseup listener as backup for desktop drag operations
    document.removeEventListener('mouseup', handleDragEndFallback);
    document.addEventListener('mouseup', handleDragEndFallback);
    
    // Attach click listeners to individual grid cells (for special modes)
    const gridCells = document.querySelectorAll('.grid-cell');
    gridCells.forEach(cell => {
        // Remove existing listener first to prevent duplicates
        cell.removeEventListener('click', handleGridCellClick);
        cell.addEventListener('click', handleGridCellClick);
    });
}

function handleGridCellClick(event) {
    if (!gameState.specialModes.clearLineMode || !gameState.specialModes.isWaitingForSelection) return;
    
    // Find the actual grid-cell (could be .grid-cell-block that was clicked)
    let cell = event.target;
    if (!cell.classList.contains('grid-cell')) {
        cell = cell.closest('.grid-cell');
    }
    
    if (!cell || !cell.classList.contains('grid-cell')) {
        return;
    }
    
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    // Save state for undo
    logic.saveGameState();
    gameState.clearLineTokens--;

    // Pastro të gjitha qelizat në rresht dhe kolonë
    const clearedCells = [];
    const clearedRows = [];
    const clearedCols = [];
    
    // Check if entire row should be cleared
    let shouldClearRow = false;
    for (let c = 0; c < gameState.grid[0].length; c++) {
        if (gameState.grid[row][c] !== 0) {
            shouldClearRow = true;
            break;
        }
    }
    
    // Check if entire column should be cleared
    let shouldClearCol = false;
    for (let r = 0; r < gameState.grid.length; r++) {
        if (gameState.grid[r][col] !== 0) {
            shouldClearCol = true;
            break;
        }
    }

    if (!shouldClearRow && !shouldClearCol) {
        // Asgjë për t'u pastruar - kthe token-in dhe dil shpejt pa hedhur gabime
        gameState.clearLineTokens++;
        updateSpecialActionButtons();
        showSpecialModeMessage('clearLine_cancel', 'Nuk ka linja të mbushura në këtë qelizë.', 2000);
        gameState.specialModes.clearLineMode = false;
        gameState.specialModes.isWaitingForSelection = false;
        render.clearLineHighlights();
        return;
    }
    
    // Mark rows/cols to clear; don't mutate grid now. We'll clear per-line in animation callbacks.
    if (shouldClearRow) {
        clearedRows.push(row);
        for (let c = 0; c < gameState.grid[0].length; c++) {
            if (gameState.grid[row][c] !== 0) {
                clearedCells.push({ row, col: c, animationColor: 'rgba(198,140,83,1)' });
            }
        }
    }
    if (shouldClearCol) {
        clearedCols.push(col);
        for (let r = 0; r < gameState.grid.length; r++) {
            if (gameState.grid[r][col] !== 0) {
                if (!clearedCells.some(cell => cell.row === r && cell.col === col)) {
                    clearedCells.push({ row: r, col, animationColor: 'rgba(198,140,83,1)' });
                }
            }
        }
    }

    // Do NOT immediately update the grid DOM: keep previous visuals so the canvas
    // animation can sample the filled cell colors and produce identical visuals
    updateSpecialActionButtons();

    // Use the new canvas animation system for clear line effect
    if (clearedRows.length > 0 || clearedCols.length > 0) {
        const clearResult = {
            cellsToAnimate: clearedCells,
            pointsEarned: 0, // No points for manual clear
            comboCount: 1,
            totalLinesCleared: clearedRows.length + clearedCols.length,
            clearedRows: clearedRows,
            clearedCols: clearedCols,
            // Post animation hook will update DOM/UI once canvas completes
            _postAnimation: () => {
                render.updateGridDisplay();
                updateSpecialActionButtons();
            }
        };
        
        // Use the same animation system as natural line clears
        handleLineClearEffects(clearResult);
    }

    showSpecialModeMessage('clearLine_success', `Row ${row + 1} and Column ${col + 1} cleared!`, 2000);
    audio.playClearSound(1);

    // Reset clear line mode pas veprimit
    gameState.specialModes.clearLineMode = false;
    gameState.specialModes.isWaitingForSelection = false;
    updateSpecialActionButtons();
    render.clearLineHighlights();
}

// --- HELPER FUNCTIONS FOR SPECIAL MESSAGES ---
function showSpecialModeMessage(type, message, autoHideDelay = null) {
    // Creates or updates the special mode message
    let messageElement = document.getElementById('specialModeMessage');
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.id = 'specialModeMessage';
        messageElement.className = 'special-mode-message';
        document.body.appendChild(messageElement);
    }
    
    // Clear any existing timeout
    if (messageElement.hideTimeout) {
        clearTimeout(messageElement.hideTimeout);
        messageElement.hideTimeout = null;
    }
    
    // Enhanced message mapping with better instructions
    const englishMessages = {
        rotate: 'ROTATE MODE: Click any piece to rotate it',
        rotate_cancel: 'Rotate mode cancelled',
        clearLine: 'CLEAR LINE MODE: Click any cell in a complete row/column to clear it',
        clearLine_success: 'Line cleared successfully!',
        clearLine_cancel: 'Clear line mode cancelled',
        undo: 'Last move undone successfully!',
        swap: 'All pieces swapped successfully!',
        error: 'Action failed - please try again'
    };
    const displayMsg = message || englishMessages[type] || 'Special action activated';
    
    messageElement.textContent = displayMsg;
    messageElement.className = `special-mode-message ${type}`;
    messageElement.classList.remove('hidden');
    
    // Auto-hide if delay is specified
    if (autoHideDelay) {
        messageElement.hideTimeout = setTimeout(() => {
            messageElement.classList.add('hidden');
            messageElement.hideTimeout = null;
        }, autoHideDelay);
    }
}

// Eksporto funksionin globalisht për përdorim në gameLogic.js
window.showSpecialModeMessage = showSpecialModeMessage;

// --- FUNCTIONS FOR GAME STATE MANAGEMENT ---
// DELETED: Redundant undoLastMove, saveGameState, loadGameState, and other game logic functions.
// All game logic has been centralized in `gameLogic.js` to avoid conflicts and bugs.
// The event listeners in this file now correctly call functions from the `logic` module.

function populateInitialPieces() {
    const pieceShapes = [
        [ // First shape
            [1, 1, 1],
            [0, 1, 0],
            [0, 1, 0]
        ],
        [ // Second shape
            [0, 2, 2],
            [0, 2, 0],
            [0, 2, 0]
        ],
        [ // Third shape
            [3, 3, 0],
            [0, 3, 3],
            [0, 0, 0]
        ],
        [ // Fourth shape
            [0, 4, 0],
            [4, 4, 4],
            [0, 0, 0]
        ],
        [ // Fifth shape
            [5, 5, 5],
            [5, 0, 0],
            [0, 0, 0]
        ],
        [ // Sixth shape
            [0, 0, 6],
            [0, 6, 6],
            [0, 6, 0]
        ],
        [ // Seventh shape
            [7, 0, 0],
            [7, 7, 7],
            [0, 0, 0]
        ]
    ];

    // Populate current pieces with random shapes from pieceShapes
    gameState.currentPieces = gameState.currentPieces.map((piece, index) => {
        const shapeIndex = index % pieceShapes.length;
        return {
            currentShape: pieceShapes[shapeIndex],
            previousPosition: { row: -1, col: -1 },
            isEmpty: false
        };
    });
}

// --- FUNCTIONS FOR REFILLING THE GAME WITH NEW PIECES ---
function refillPieces() {
    gameState.currentPieces = gameState.currentPieces.map(piece => {
        if (piece.isEmpty) {
            // Create a new piece with a random shape
            const randomShapeIndex = Math.floor(Math.random() * gameState.availableShapes.length);
            const newShape = gameState.availableShapes[randomShapeIndex];
            return {
                currentShape: newShape,
                previousPosition: { row: -1, col: -1 },
                isEmpty: false
            };
        }
        return piece;
    });
}

// --- FUNCTIONS FOR APPLYING THEMES ---
function applyTheme(themeName) {
    const root = document.documentElement;
    root.className = ''; // Remove any existing class
    root.classList.add(`theme-${themeName}`);
}

// --- FUNCTIONS FOR ROTATING A SPECIFIC PIECE ---
function rotateSpecificPiece(pieceIndex) {
    const piece = gameState.currentPieces[pieceIndex];
    if (!piece || piece.isEmpty) return false;
    
    // Save state before rotation for undo
    logic.saveGameState();
    
    // Rotate the piece shape in the correct direction
    const newShape = piece.currentShape[0].map((val, index) => 
        piece.currentShape.map(row => row[index]).reverse()
    );
    
    // Check if the new placement is valid
    if (logic.isValidPlacement(newShape, piece.previousPosition.row, piece.previousPosition.col)) {
        piece.currentShape = newShape;
        render.updatePiecesDisplay();
        return true;
    } else {
        // If rotation is not valid, revert to original shape
        logic.undoLastMove();
        return false;
    }
}

// --- FUNCTIONS FOR PLAYING WITH SPECIAL CARDS ---
function playCardEffect(cardName) {
    switch(cardName) {
        case 'doubleScore':
            gameState.score *= 2;
            render.updateScoreDisplay();
            showSpecialModeMessage('score', 'Points doubled!', 2000);
            break;
        case 'resetGrid':
            logic.saveGameState();
            gameState.grid = logic.createEmptyGrid();
            logic.clearAllCaches();
            render.updateGridDisplay();
            showSpecialModeMessage('grid', 'Grid reset!', 2000);
            break;
        case 'extraRotate':
            gameState.rotateTokens++;
            updateSpecialActionButtons();
            showSpecialModeMessage('rotate', 'Extra rotate granted!', 2000);
            break;
        case 'swapPieces':
            logic.saveGameState();
            logic.populateInitialPieces();
            render.updatePiecesDisplay();
            showSpecialModeMessage('swap', 'Pieces swapped!', 2000);
            break;
        case 'clearLine': {
            const randomRow = Math.floor(Math.random() * GRID_ROWS);
            
            if (logic.clearRowOrColumn(randomRow, true)) {
                // Use animation system instead of direct updateGridDisplay
                const clearResult = {
                    clearedRows: [randomRow],
                    clearedCols: [],
                    totalLinesCleared: 1,
                    comboCount: 1,
                    pointsEarned: 100
                };
                handleLineClearEffects(clearResult, () => {
                    showSpecialModeMessage('clearLine', `Row ${randomRow + 1} cleared!`, 2000);
                });
            }
            break;
        }
        case 'horizontalClear': {
            const randomRow = Math.floor(Math.random() * GRID_ROWS);
            
            if (logic.clearRowOrColumn(randomRow, true)) {
                // Use animation system
                const clearResult = {
                    clearedRows: [randomRow],
                    clearedCols: [],
                    totalLinesCleared: 1,
                    comboCount: 1,
                    pointsEarned: 100
                };
                handleLineClearEffects(clearResult, () => {
                    showSpecialModeMessage('clearLine', `Row ${randomRow + 1} cleared horizontally!`, 2000);
                });
            }
            break;
        }
        case 'verticalClear': {
            const randomCol = Math.floor(Math.random() * GRID_COLS);
            
            if (logic.clearRowOrColumn(randomCol, false)) {
                // Use animation system
                const clearResult = {
                    clearedRows: [],
                    clearedCols: [randomCol],
                    totalLinesCleared: 1,
                    comboCount: 1,
                    pointsEarned: 100
                };
                handleLineClearEffects(clearResult, () => {
                    showSpecialModeMessage('clearLine', `Column ${randomCol + 1} cleared vertically!`, 2000);
                });
            }
            break;
        }
        case 'fullClear':
            logic.saveGameState();
            gameState.grid = logic.createEmptyGrid();
            logic.clearAllCaches();
            render.updateGridDisplay();
            showSpecialModeMessage('clearLine', 'Entire grid cleared!', 2000);
            break;
        case 'rowShift': {
            const randomCol = Math.floor(Math.random() * GRID_COLS);
            const direction = Math.random() < 0.5 ? 1 : -1;
            logic.saveGameState();
            if (logic.shiftColumn(randomCol, direction)) {
                render.updateGridDisplay();
                showSpecialModeMessage('shift', `Column ${randomCol + 1} shifted ${direction === 1 ? 'up' : 'down'}!`, 2000);
            }
            break;
        }
        default:
            break;
    }
}

/**
 * Comprehensive cleanup function to remove all event listeners and DOM elements
 * Call this when restarting the game or when the page is about to unload
 */
function cleanupGameResources() {
    // Clean up touch listeners
    cleanupTouchListeners();
    
    // Clean up global drag listeners
    document.removeEventListener('dragend', handleDragEnd);
    document.removeEventListener('mouseup', handleDragEndFallback);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mouseleave', handleMouseUp);
    if ('onpointerup' in window) {
        document.removeEventListener('pointerup', handleMouseUp);
    }
    
    // Clean up any remaining particles
    if (typeof render.cleanupOldParticles === 'function') {
        render.cleanupOldParticles();
    }
    
    // Clean up floating score elements
    if (typeof render.cleanupOldFloatingScores === 'function') {
        render.cleanupOldFloatingScores();
    }
    
    // Clean up any remaining floating score elements manually
    document.querySelectorAll('.floating-score').forEach(element => {
        element.remove();
    });
    
    // Clean up unlock progress indicator
    const unlockProgress = document.getElementById('unlock-progress');
    if (unlockProgress) {
        unlockProgress.remove();
    }
    
    // Clean up highlights and visual states
    render.clearHighlights();
    render.clearLineHighlights();
    
    // Reset listener attachment tracking
    listenersAttached = false;
    
    // Reset drag state completely
    if (gameState.dragState) {
        resetDragState();
    }
}

// Clean up resources when page unloads
window.addEventListener('beforeunload', cleanupGameResources);

// Track if listeners are already attached to prevent duplicate attachments
let listenersAttached = false;
document.addEventListener('lines:cleared', () => import('./nativeBridge.js').then(m=>m.hapticSuccess&&m.hapticSuccess()).catch(()=>{}));
document.addEventListener('combo:achieved', e => import('./nativeBridge.js').then(m=>{ if(e.detail?.lines>=3 && m.hapticHeavy) m.hapticHeavy(); else if(m.hapticSuccess) m.hapticSuccess(); }).catch(()=>{}));
document.addEventListener('game:over', () => import('./nativeBridge.js').then(m=>m.hapticHeavy&&m.hapticHeavy()).catch(()=>{}));

// DEBUG: Log dimensionet e .game-container në desktop
window.addEventListener('DOMContentLoaded', () => {
  if (window.innerWidth >= 900) {
    const gc = document.querySelector('.game-container');
    if (gc) {
      const rect = gc.getBoundingClientRect();
      // Debug logs removed for production
    }
  }
});

// Handle responsive CSS reload when viewport crosses breakpoints (for DevTools testing)
let lastBreakpoint = window.innerWidth <= 768 ? 'mobile' : 'desktop';
let resizeDebounce;

window.addEventListener('resize', () => {
    clearTimeout(resizeDebounce);
    resizeDebounce = setTimeout(() => {
        const currentBreakpoint = window.innerWidth <= 768 ? 'mobile' : 'desktop';
        
        if (currentBreakpoint !== lastBreakpoint) {
            // Breakpoint changed - force CSS re-evaluation
            const mobileCssLink = document.querySelector('link[href*="mobile.css"]');
            const desktopCssLink = document.querySelector('link[href*="desktop.css"]');
            
            if (currentBreakpoint === 'mobile' && mobileCssLink) {
                // Force mobile.css to re-apply by toggling media attribute
                mobileCssLink.media = 'all';
                setTimeout(() => mobileCssLink.media = '(max-width:768px)', 0);
            } else if (currentBreakpoint === 'desktop' && desktopCssLink) {
                // Force desktop.css to re-apply
                desktopCssLink.media = 'all';
                setTimeout(() => desktopCssLink.media = '(min-width:769px)', 0);
            }
            
            // Force layout recalculation
            requestAnimationFrame(() => {
                const gameContainer = document.querySelector('.game-container');
                const gameArea = document.querySelector('.game-area');
                const gameGrid = document.getElementById('gameGrid');
                
                [gameContainer, gameArea, gameGrid].forEach(el => {
                    if (el) void el.offsetHeight;
                });
            });
            
            lastBreakpoint = currentBreakpoint;
        }
    }, 300);
});
