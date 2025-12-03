// js/constants.js

// --- Grid Dimensions ---
export const GRID_ROWS = 10;
export const GRID_COLS = 10;

// --- Timing & Animations (in milliseconds) ---
export const COMBO_MESSAGE_DURATION = 1500;
export const GRID_CLEAR_ANIMATION_DELAY = 300;
export const GRID_RENDER_AFTER_CLEAR_DELAY = 400; // Duhet të jetë > GRID_CLEAR_ANIMATION_DELAY
export const INVALID_PLACEMENT_SHAKE_DURATION = 400;

// --- Piece Definitions ---
// Pieces are now managed by PieceUnlockSystem
// This maintains backward compatibility while allowing dynamic piece management
export const PIECE_SHAPES = [
    { shape: [[0, 0]], color: 1, size: 1, name: '1x1' },
    { shape: [[0, 0], [0, 1]], color: 2, size: 2, name: '1x2' },
    { shape: [[0, 0], [1, 0]], color: 2, size: 2, name: '2x1' },
    { shape: [[0, 0], [0, 1], [0, 2]], color: 3, size: 3, name: '1x3' },
    { shape: [[0, 0], [1, 0], [2, 0]], color: 3, size: 3, name: '3x1' },
    { shape: [[0, 0], [0, 1], [0, 2], [0, 3]], color: 4, size: 4, name: '1x4' },
    { shape: [[0, 0], [1, 0], [2, 0], [3, 0]], color: 4, size: 4, name: '4x1' },
    { shape: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], color: 5, size: 5, name: '1x5' },
    { shape: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], color: 5, size: 5, name: '5x1' },
    { shape: [[0, 0], [0, 1], [1, 0], [1, 1]], color: 6, size: 4, name: '2x2' },
    { shape: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]], color: 7, size: 9, name: '3x3'},
    { shape: [[0, 0], [1, 0], [2, 0], [2, 1]], color: 1, size: 4, name: 'L4_1' },
    { shape: [[0, 0], [1, 0], [0, 1], [0, 2]], color: 1, size: 4, name: 'L4_2' },
    { shape: [[0, 1], [1, 0], [1, 1], [1, 2]], color: 2, size: 4, name: 'T4' },
    { shape: [[0, 0], [0, 1], [1, 1], [1, 2]], color: 3, size: 4, name: 'Z4' },
    { shape: [[0, 1], [1, 0], [1, 1], [2, 0]], color: 3, size: 4, name: 'Z4_vert' }
];

// --- Theming ---
