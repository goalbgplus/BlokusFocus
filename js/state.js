// State structure for the game. Comments cleaned for clarity.

import { GRID_ROWS, GRID_COLS } from './constants.js';

export function createEmptyGrid(rows = GRID_ROWS, cols = GRID_COLS) {
    return Array.from({ length: rows }, () => Array(cols).fill(0));
}

function getDefaultDragState() {
    return {
        isDragging: false,
        pieceIndex: -1,
        pieceSourceElement: null,
        offsetX: 0,
        offsetY: 0,
        touchIdentifier: null,
    touchOffsetY: 0,
        lastTargetRow: undefined,
        lastTargetCol: undefined,
        blockSize: 30,
        gap: 0,
        paddingX: 0,
        paddingY: 0,
        metricsCached: false,
        cloneWidth: 80,
        cloneHeight: 80,
        startX: 0,
        startY: 0,
        startTime: 0,
        hasMoved: false,
        // Grid metrics caching for performance optimization (used in getCellFromPoint)
        gridMetricsCached: false,
        gridRect: { left: 0, top: 0 },
        cellSize: 0,
        step: 0,
        gridPadL: 0,
        gridPadT: 0,
        gridBordL: 0,
        gridBordT: 0,
    };
}

// Objekti kryesor i gjendjes
export const gameState = {
    grid: [],
    score: 0,
    highScore: 0,
    isGameOver: false,
    isPaused: false,
    currentPieces: [],
    combo: {
        count: 0,
        timeoutId: null
    },
    dragState: getDefaultDragState(),
    rotateTokens: 0,
    undoTokens: 0,
    clearLineTokens: 0,
    flipTokens: 0,
    swapTokens: 0,
    // Cells of the most recently placed piece for animation
    lastPlacementCells: [],
    // Shtuar për veprime speciale
    gameHistory: [], // Për undo functionality
    specialModes: {
        rotateMode: false,
        undoMode: false, // Player can undo one move
        clearLineMode: false,
        flipMode: false, // Player can flip piece 180°
        isWaitingForRotate: false,
        isWaitingForFlip: false
    }
};

/**
 * Mbush një përqindje të caktuar të fushës me blloqe rastësore
 * @param {array} grid - matrica e lojës
 * @param {number} ratio - përqindja (0-1) e blloqeve fillestare
 */
function fillRandomBlocks(grid, ratio) {
    const rows = grid.length;
    const cols = grid[0].length;
    const total = rows * cols;
    const toFill = Math.floor(total * ratio);
    let filled = 0;
    while (filled < toFill) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        if (grid[r][c] === 0) {
            // vendos ngjyrë rastësore 1-7
            grid[r][c] = Math.ceil(Math.random() * 7);
            filled++;
        }
    }
}

// Funksion ndihmës për të resetuar combo
export function resetCombo() {
    if (gameState.combo.timeoutId) {
        clearTimeout(gameState.combo.timeoutId);
    }
    gameState.combo.count = 0;
    gameState.combo.timeoutId = null;
}

// Funksion ndihmës për të resetuar dragState
export function resetDragState() {
    gameState.dragState = getDefaultDragState();
}

// Funksion për të vendosur pikët
export function setScore(newScore) {
    gameState.score = newScore;
}

// Funksion për të vendosur highScore
export function setHighScore(newHighScore) {
    gameState.highScore = newHighScore;
}

// Funksion për të inicializuar ose resetuar gjendjen e lojës
export function initializeState() {
    // Ruaj high score, reset-o gjithçka tjetër
    const currentHighScore = localStorage.getItem('blokusHighScore') ? parseInt(localStorage.getItem('blokusHighScore')) : 0;

    gameState.grid = createEmptyGrid();
    setScore(0);
    setHighScore(currentHighScore);
    gameState.isGameOver = false;
    gameState.isPaused = false;
    gameState.currentPieces = [];
    resetCombo();
    resetDragState();
    
    // Reset special action states
    gameState.gameHistory = [];
    gameState.specialModes = {
        rotateMode: false,
        undoMode: false, // Player can undo one move
        clearLineMode: false,
        flipMode: false, // Player can flip piece 180°
        isWaitingForRotate: false,
        isWaitingForFlip: false
    };
    
    // Në Classic Mode, mbush rastësisht një përqindje të fushës me blloqe parazgjedhje
    const selectedMode = localStorage.getItem('selectedGameMode') || 'collection';
    if (selectedMode === 'classic') {
        fillRandomBlocks(gameState.grid, 0.2);
    }
    // Starting tokens for all players (mobile, desktop, production)
    // Players earn additional tokens during gameplay as rewards
    // Every 1000 points = 1 rotate token
    // Every 2000 points = 1 undo token
    // Combo >= 4 = 1 clear line token
    // Every 3000 points = 1 hint token
    // Flip tokens are earned through special events/milestones
    gameState.rotateTokens = 1;
    gameState.undoTokens = 1;
    gameState.clearLineTokens = 1;
    gameState.flipTokens = 1;
    gameState.swapTokens = 0;
    // Reset placement animation cells
    gameState.lastPlacementCells = [];
}