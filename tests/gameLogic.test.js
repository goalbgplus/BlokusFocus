import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';

let initializeState;
let gameState;
let createEmptyGrid;
let rotatePiece;
let isValidPlacement;
let checkAndClearLines;
let updateGameOverState;
let placePieceOnGrid;
let GRID_ROWS;
let GRID_COLS;

let storage;
const sortCoords = (coords) => [...coords].sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));

function installLocalStorageMock() {
  storage = new Map();
  const localStorageMock = {
    getItem: vi.fn((key) => (storage.has(key) ? storage.get(key) : null)),
    setItem: vi.fn((key, value) => storage.set(key, String(value))),
    removeItem: vi.fn((key) => storage.delete(key)),
    clear: vi.fn(() => storage.clear()),
    key: vi.fn((index) => Array.from(storage.keys())[index] ?? null),
    get length() {
      return storage.size;
    }
  };

  vi.stubGlobal('localStorage', localStorageMock);
  return localStorageMock;
}

beforeAll(async () => {
  installLocalStorageMock();
  ({ initializeState, gameState, createEmptyGrid } = await import('../js/state.js'));
  ({ rotatePiece, isValidPlacement, checkAndClearLines, updateGameOverState, placePieceOnGrid } = await import('../js/gameLogic.js'));
  ({ GRID_ROWS, GRID_COLS } = await import('../js/constants.js'));
});

beforeEach(() => {
  storage.clear();
  localStorage.setItem('selectedGameMode', 'collection');
  localStorage.setItem('blokusHighScore', '0');
  initializeState();
});

afterAll(() => {
  if (typeof vi.unstubAllGlobals === 'function') {
    vi.unstubAllGlobals();
  } else {
    delete globalThis.localStorage;
  }
});

describe('game logic core flows', () => {
  it('initializes game state with empty grid and default tokens', () => {
    expect(gameState.grid).toHaveLength(GRID_ROWS);
    expect(gameState.grid[0]).toHaveLength(GRID_COLS);
    expect(gameState.score).toBe(0);
    expect(gameState.rotateTokens).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(gameState.currentPieces)).toBe(true);
  });

  it('rotates a piece clockwise and normalizes its coordinates', () => {
    const piece = { currentShape: [[0, 0], [1, 0]], id: 1, size: 2 };
    const rotated = rotatePiece(piece);
    expect(sortCoords(rotated.currentShape)).toEqual([[0, 0], [0, 1]]);
  });

  it('validates placement bounds and collision rules', () => {
    const shape = [[0, 0], [1, 0]];

    expect(isValidPlacement(shape, 0, 0)).toBe(true);

    gameState.grid[0][0] = 9;
    expect(isValidPlacement(shape, 0, 0)).toBe(false);

    expect(isValidPlacement(shape, GRID_ROWS - 1, GRID_COLS - 1)).toBe(false);
  });

  it('awards score and combo when clearing a full row', () => {
    gameState.score = 0;
    gameState.combo.count = 0;
    gameState.grid[0] = Array(GRID_COLS).fill(1);

    const result = checkAndClearLines(1);

    expect(result).not.toBeNull();
    expect(result?.clearedRows).toContain(0);
    expect(result?.pointsEarned).toBeGreaterThan(0);
    expect(gameState.combo.count).toBe(1);
    expect(gameState.score).toBe(result?.pointsEarned);
  });

  it('updates game over flag based on available moves', () => {
    const singleCellPiece = { currentShape: [[0, 0]], color: 1, size: 1 };
    gameState.currentPieces = [singleCellPiece];
    gameState.grid = createEmptyGrid();

    updateGameOverState();
    expect(gameState.isGameOver).toBe(false);

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        gameState.grid[r][c] = 1;
      }
    }

    updateGameOverState();
    expect(gameState.isGameOver).toBe(true);
  });

  it('places a piece on grid and increases score by piece size', () => {
    const piece = { currentShape: [[0, 0], [0, 1]], color: 2, size: 2 };

    placePieceOnGrid(piece, 0, 0);

    expect(gameState.grid[0][0]).toBe(2);
    expect(gameState.grid[0][1]).toBe(2);
    expect(gameState.score).toBe(piece.size);
  });
});
