// Centralized game logic. All duplicate or legacy comments removed for clarity.

import { gameState, initializeState } from './state.js';
import { PIECE_SHAPES, GRID_ROWS, GRID_COLS } from './constants.js';
import { aiHintEngine } from './aiHints.js';
import { pieceUnlockSystem } from './pieceUnlockSystem.js';

export { createEmptyGrid } from './state.js';

// Cache për DOM elements - për optimizimin e performancës
const domCache = new Map();
// Cache për placement calculations
const placementCache = new Map();
export function clearRowOrColumn(index, isRow = true) {
    if (typeof index !== 'number') {
        return false;
    }

    if (isRow) {
        if (index < 0 || index >= GRID_ROWS) {
            return false;
        }
        for (let col = 0; col < GRID_COLS; col++) {
            gameState.grid[index][col] = 0;
        }
    } else {
        if (index < 0 || index >= GRID_COLS) {
            return false;
        }
        for (let row = 0; row < GRID_ROWS; row++) {
            gameState.grid[row][index] = 0;
        }
    }

    placementCache.clear();
    gameState.lastPlacementCells = [];
    return true;
}

export function shiftColumn(columnIndex, direction = 1) {
    if (columnIndex < 0 || columnIndex >= GRID_COLS) {
        return false;
    }

    const normalizedDirection = direction >= 0 ? 1 : -1;
    const values = [];
    for (let row = 0; row < GRID_ROWS; row++) {
        values.push(gameState.grid[row][columnIndex]);
    }

    if (normalizedDirection === 1) {
        const first = values.shift();
        values.push(first ?? 0);
    } else {
        const last = values.pop();
        values.unshift(last ?? 0);
    }

    for (let row = 0; row < GRID_ROWS; row++) {
        gameState.grid[row][columnIndex] = values[row];
    }

    placementCache.clear();
    gameState.lastPlacementCells = [];
    return true;
}

/**
 * Pastron të gjitha cache-et
 */
export function clearAllCaches() {
    domCache.clear();
    placementCache.clear();
}

/**
 * Merr një grid cell nga cache ose DOM
 * @param {number} row - Rreshti
 * @param {number} col - Kolona
 * @returns {HTMLElement|null} - Elementi i grid cell-it
 */
function getCachedGridCell(row, col) {
    const key = `cell-${row}-${col}`;
    if (!domCache.has(key)) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            domCache.set(key, cell);
        }
        return cell;
    }
    return domCache.get(key);
}

/**
 * Pastron cache-in e DOM elements
 */
export function clearDOMCache() {
    domCache.clear();
}

/**
 * Validon bounds më efikasishëm
 * @param {number} row - Rreshti
 * @param {number} col - Kolona
 * @returns {boolean} - True nëse është në bounds
 */
function isInBounds(row, col) {
    return row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS;
}

/**
 * Zgjedh një formë të rastësishme nga pjesët e disponueshme.
 * @returns {object} Një objekt i ri pjese.
 */
export function getRandomPiece() {
    // Unified piece selection: always use unlock system
    const availablePieces = pieceUnlockSystem.getAvailablePieces();
    
    if (availablePieces.length === 0) {
        // Fallback to PIECE_SHAPES if unlock system fails
        let piece = { ...PIECE_SHAPES[Math.floor(Math.random() * PIECE_SHAPES.length)], id: Date.now() + Math.random() };
        piece.currentShape = piece.shape;
        piece.size = piece.shape.length;  // Add size for fallback case too
        // Apply random rotations for varied orientation
        for (let i = 0, r = Math.floor(Math.random() * 4); i < r; i++) {
            piece = rotatePiece(piece);
        }
        return piece;
    }
    
    // Select random piece from available unlocked pieces
    const randomIndex = Math.floor(Math.random() * availablePieces.length);
    const selectedPiece = availablePieces[randomIndex];
    
    // Create piece instance
    let piece = {
        ...selectedPiece,
        id: Date.now() + Math.random(),
        currentShape: selectedPiece.shape,
        size: selectedPiece.shape.length  // Add size based on shape length
    };
    // Apply random rotations for varied orientation
    for (let i = 0, r = Math.floor(Math.random() * 4); i < r; i++) {
        piece = rotatePiece(piece);
    }
    return piece;
}

/**
 * Mbush raftin e pjesëve me 3 pjesë të reja.
 */
export function populateInitialPieces() {
    gameState.currentPieces = [];
    for (let i = 0; i < 3; i++) {
        gameState.currentPieces.push(getRandomPiece());
    }
}

/**
 * Zëvendëson një pjesë të përdorur me një të re.
 * @param {number} index - Indeksi i pjesës që do të zëvendësohet.
 */
export function replaceUsedPiece(index) {
    gameState.currentPieces[index] = getRandomPiece();
}

/**
 * Rrotullon formën e një pjese 90 gradë.
 * @param {object} pieceData - Objekti i pjesës që do të rrotullohet.
 * @returns {object} - Objekti i pjesës me formën e rrotulluar.
 */
export function rotatePiece(pieceData) {
    if (!pieceData || !pieceData.currentShape) return pieceData;

    // Gjej dimensionet e formës aktuale
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    pieceData.currentShape.forEach(([r, c]) => {
        minR = Math.min(minR, r); maxR = Math.max(maxR, r);
        minC = Math.min(minC, c); maxC = Math.max(maxC, c);
    });
    const height = maxR - minR;

    // Apliko rrotullimin
    const newShape = pieceData.currentShape.map(([r, c]) => [(c - minC), (height - (r - minR))]);

    // Normalizo formën e re që të fillojë nga (0,0)
    let newMinR = Infinity, newMinC = Infinity;
    newShape.forEach(([r, c]) => {
        newMinR = Math.min(newMinR, r);
        newMinC = Math.min(newMinC, c);
    });

    const normalizedShape = newShape.map(([r, c]) => [r - newMinR, c - newMinC]);
    
    return { ...pieceData, currentShape: normalizedShape };
}

/**
 * Pasqyron një pjesë horizontalisht (flip majtas-djathtas)
 * @param {object} pieceData - Objekti i pjesës
 * @returns {object} - Pjesë e pasqyruar
 */
export function flipPieceHorizontally(pieceData) {
    if (!pieceData || !pieceData.currentShape) return pieceData;

    // Gjej dimensionet e formës aktuale
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    pieceData.currentShape.forEach(([r, c]) => {
        minR = Math.min(minR, r); maxR = Math.max(maxR, r);
        minC = Math.min(minC, c); maxC = Math.max(maxC, c);
    });
    const width = maxC - minC;

    // Apliko pasqyrimin horizontal: c -> (width - (c - minC))
    const newShape = pieceData.currentShape.map(([r, c]) => [r, width - (c - minC)]);

    // Normalizo formën e re që të fillojë nga (0,0)
    let newMinR = Infinity, newMinC = Infinity;
    newShape.forEach(([r, c]) => {
        newMinR = Math.min(newMinR, r);
        newMinC = Math.min(newMinC, c);
    });

    const normalizedShape = newShape.map(([r, c]) => [r - newMinR, c - newMinC]);
    
    return { ...pieceData, currentShape: normalizedShape };
}


/**
 * Kontrollon nëse një pjesë mund të vendoset në një pozicion të caktuar në rrjetë.
 * @param {array} pieceShape - Forma e pjesës.
 * @param {number} startRow - Rreshti fillestar.
 * @param {number} startCol - Kolona fillestare.
 * @returns {boolean} - True nëse vendosja është e vlefshme.
 */
export function isValidPlacement(pieceShape, startRow, startCol) {
    for (const [r, c] of pieceShape) {
        const gridRow = startRow + r;
        const gridCol = startCol + c;
        if (
            !isInBounds(gridRow, gridCol) ||
            gameState.grid[gridRow][gridCol] !== 0
        ) {
            return false;
        }
    }
    return true;
}

/**
 * Vendos një pjesë në rrjetë (vetëm në modelin e të dhënave).
 * @param {object} piece - Objekti i pjesës.
 * @param {number} startRow - Rreshti ku vendoset.
 * @param {number} startCol - Kolona ku vendoset.
 */
export function placePieceOnGrid(piece, startRow, startCol) {
    piece.currentShape.forEach(([r, c]) => {
        gameState.grid[startRow + r][startCol + c] = piece.color;
    });
    gameState.score += piece.size;
    // Pastro cache-in kur grid-i ndryshon
    placementCache.clear();
}

/**
 * Kontrollon dhe pastron rreshtat dhe kolonat e plota.
 * @param {number} placedPieceColor - Ngjyra e pjesës që sapo u vendos dhe shkaktoi pastrimin
 * @returns {object|null} - Objekt me të dhëna për efektet vizuale, ose null nëse nuk pastrohet gjë.
 */
export function checkAndClearLines(placedPieceColor = null) {
  const beforeClearScore = (typeof gameState !== 'undefined' && gameState.score) || 0;

    const clearedRows = [];
    const clearedCols = [];

    // Gjej rreshtat e plotë
    for (let r = 0; r < GRID_ROWS; r++) {
        if (gameState.grid[r].every(cell => cell !== 0)) {
            clearedRows.push(r);
        }
    }

    // Gjej kolonat e plota
    for (let c = 0; c < GRID_COLS; c++) {
        let isColFull = true;
        for (let r = 0; r < GRID_ROWS; r++) {
            if (gameState.grid[r][c] === 0) {
                isColFull = false;
                break;
            }
        }
        if (isColFull) {
            clearedCols.push(c);
        }
    }    const totalLinesCleared = clearedRows.length + clearedCols.length;
    if (totalLinesCleared === 0) {
        gameState.combo.count = 0; // Reset combo if no lines cleared
        return null;
    }

    // Përcakto ngjyrën për animacion - përdor ngjyrën e pjesës së fundit nëse është dhënë
    const animationColor = placedPieceColor ? getBaseColor(placedPieceColor) : 'rgba(133, 76, 19, 1)';

    // Mblidh të dhënat për efektet vizuale
    const clearedCellsSet = new Set();
    
    clearedRows.forEach(r => { 
        for (let c = 0; c < GRID_COLS; c++) {
            clearedCellsSet.add(JSON.stringify({ row: r, col: c }));
        }
    });
    
    clearedCols.forEach(c => { 
        for (let r = 0; r < GRID_ROWS; r++) {
            clearedCellsSet.add(JSON.stringify({ row: r, col: c }));
        }
    });
    
    const cellsToAnimate = Array.from(clearedCellsSet).map(str => {
        const cell = JSON.parse(str);
        return {
            ...cell,
            animationColor: animationColor // Përdor ngjyrën e pjesës së fundit për të gjitha qelizat
        };
    });

    // Llogarit pikët dhe combo
    gameState.combo.count++;
    const pointsEarned = calculateLineClearScore(totalLinesCleared, gameState.combo.count);
    gameState.score += pointsEarned;

    // Mos pastro menjëherë rrjetën këtu; lejo animacionin të përfundojë.
    // Pastrimi kryhet në shtresën e UI-së (main.js) sapo të përfundojë animacioni për secilin rresht/kolonë.

    const result = {
        cellsToAnimate,
        pointsEarned,
        comboCount: gameState.combo.count,
        totalLinesCleared,
        clearedRows,
        clearedCols,
        placedPieceColor: placedPieceColor  // Include the piece color that caused the clear
    };
    // Pastro cache-in kur grid-i ndryshon
    placementCache.clear();
    return result;
}

/**
 * Llogarit pikët për pastrimin e rreshtave, duke përfshirë bonusin e combo-s.
 * Shton bonus spektakular për combo >= 5.
 */
function calculateLineClearScore(lines, combo) {
    let baseScore = 0;
    if (lines === 1) baseScore = 100;
    else if (lines === 2) baseScore = 250;
    else if (lines === 3) baseScore = 500;
    else if (lines === 4) baseScore = 800;
    else if (lines >= 5) baseScore = 1000 + (lines - 4) * 200;
    
    let comboBonus = combo > 1 ? (combo - 1) * 50 : 0;
    // Bonus spektakular për combo shumë të larta
    if (combo >= 5) comboBonus += 500 + (combo - 5) * 100;
    return baseScore + comboBonus;
}

/**
 * Kontrollon nëse ka ndonjë lëvizje të mundshme për lojtarin.
 * Logjika hibride: kontrollon formën aktuale + rrotullimet nëse ka token.
 * Përditëson gameState.isGameOver.
 */
export function updateGameOverState() {
    // Kontrollo vetëm nëse ka pjesë aktive në raft
    const activePieces = gameState.currentPieces.filter(p => p);
    if (activePieces.length === 0) {
        gameState.isGameOver = false; // Nuk ka pjesë, nuk mund të jetë game over
        return;
    }

    for (const piece of activePieces) {
        // 1. Provo formën aktuale (pa rrotullim)
        if (canPieceBePlaced(piece.currentShape)) {
            gameState.isGameOver = false;
            return;
        }
        
        // 2. Nëse ka token rrotullimi, provo edhe rrotullimet
        if (gameState.rotateTokens > 0) {
            let shape = piece.currentShape;
            for (let rot = 1; rot < 4; rot++) { // Fillo nga rrotullimi 1 (0 është aktuale)
                shape = rotatePiece({ ...piece, currentShape: shape }).currentShape;
                if (canPieceBePlaced(shape)) {
                    gameState.isGameOver = false;
                    return;
                }
            }
        }
    }

    // Nëse arrijmë këtu, asnjë pjesë nuk mund të vendoset
    gameState.isGameOver = true;
}

// --- SISTEMA E RE PËR VEPRIME SPECIALE ---

/**
 * Ruan gjendjen aktuale të lojës për undo functionality
 */
export function saveGameState() {
    const currentState = {
        grid: gameState.grid.map(row => [...row]), // Deep copy
        score: gameState.score,
        currentPieces: gameState.currentPieces.map(piece => {
            if (!piece) return null;
            return {
                ...piece,
                currentShape: Array.isArray(piece.currentShape) ? [...piece.currentShape] : piece.currentShape
            };
        }),
        combo: { ...gameState.combo },
        rotateTokens: gameState.rotateTokens,
        undoTokens: gameState.undoTokens,
        clearLineTokens: gameState.clearLineTokens,
        swapTokens: gameState.swapTokens,
        timestamp: Date.now()
    };
    
    gameState.gameHistory.push(currentState);
    
    // Ruaj vetëm 10 hapat e fundit për të menaxhuar memorjen
    if (gameState.gameHistory.length > 10) {
        gameState.gameHistory.shift();
    }
}

/**
 * Kthen lojën në gjendjen e mëparshme
 * @returns {boolean} true nëse undo u krye me sukses
 */
export function undoLastMove() {
    if (gameState.gameHistory.length === 0) {
        return false;
    }
    
    const previousState = gameState.gameHistory.pop();
    
    // Rivendos gjendjen e mëparshme
    gameState.grid = previousState.grid;
    gameState.score = previousState.score;
    gameState.currentPieces = previousState.currentPieces;
    gameState.combo = previousState.combo;
    gameState.rotateTokens = previousState.rotateTokens;
    gameState.undoTokens = previousState.undoTokens;
    gameState.clearLineTokens = previousState.clearLineTokens;
    gameState.swapTokens = previousState.swapTokens;
    
    return true;
}

/**
 * Kontrollon nëse një rresht ose kolonë është e plotë
 * @param {number} index - Indeksi i rreshtit ose kolonës
 * @param {boolean} isRow - true për rresht, false për kolonë
 * @returns {boolean}
 */
export function isLineComplete(index, isRow) {
    if (isRow) {
        return gameState.grid[index].every(cell => cell !== 0);
    } else {
        return gameState.grid.every(row => row[index] !== 0);
    }
}

/**
 * Merr koordinatat e të gjitha qelizave në një rresht ose kolonë
 * @param {number} index - Indeksi i rreshtit ose kolonës
 * @param {boolean} isRow - true për rresht, false për kolonë
 * @returns {Array} Array me koordinatat {row, col}
 */
export function getLineCells(index, isRow) {
    const cells = [];
    if (isRow) {
        for (let c = 0; c < GRID_COLS; c++) {
            cells.push({ row: index, col: c });
        }
    } else {
        for (let r = 0; r < GRID_ROWS; r++) {
            cells.push({ row: r, col: index });
        }
    }
    return cells;
}

/**
 * Rrotullon një pjesë specifike duke përdorur token
 * @param {number} pieceIndex - Indeksi i pjesës për t'u rrotulluar
 * @returns {boolean} true nëse rrotullimi u krye me sukses
 */
export function rotateSpecificPiece(pieceIndex) {
    if (gameState.rotateTokens <= 0 || !gameState.currentPieces[pieceIndex]) {
        return false;
    }
    
    gameState.currentPieces[pieceIndex] = rotatePiece(gameState.currentPieces[pieceIndex]);
    // Change ID to force UI update since only shape changed
    gameState.currentPieces[pieceIndex].id = Date.now() + Math.random();
    
    return true;
}

/**
 * Funksion ndihmës që kontrollon nëse një formë mund të vendoset në grid
 * @param {array} shape - Forma për të kontrolluar
 * @returns {boolean} - True nëse forma mund të vendoset diku
 */
function canPieceBePlaced(shape) {
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            if (isValidPlacement(shape, r, c)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Konverton numrin e ngjyrës në ngjyrë CSS.
 * @param {number} colorNumber - Numri i ngjyrës nga gameState.grid
 * @returns {string} - Ngjyra CSS (hex code)
 */
export function getBaseColor(colorNumber) {
    switch(colorNumber) {
        case 1: return '#0072ff'; // Blu i thellë
        case 2: return '#56ab2f'; // Jeshile e gjallë
        case 3: return '#6b4f2a'; // Dark bronze
        case 4: return '#fc4a1a'; // Portokalli i zjarrtë
        case 5: return '#333399'; // Purpurë/Lejla
        case 6: return '#fecfef'; // Rozë e butë
        case 7: return '#fed6e3'; // Rozë e lehtë
        default: return '#FFD700'; // Default ari
    }
}

/**
 * Gjen të gjitha pozicionet e mundshme ku mund të vendoset një pjesë.
 * @param {object} piece - Pjesa që do të vendoset
 * @returns {array} - Lista e pozicioneve të mundshme {row, col}
 */
export function findValidPlacements(piece) {
    const validPlacements = [];
    const shape = piece.currentShape || piece.shape;
    
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            if (isValidPlacement(shape, row, col)) {
                validPlacements.push({ row, col });
            }
        }
    }
    
    return validPlacements;
}

/**
 * Gjen vendet më të mira strategjike për vendosjen e një pjese (me caching)
 * @param {Object} piece - Pjesa për të cilën duam të gjejmë vendet më të mira
 * @returns {Array} Array me vendet më të mira të renditura sipas strategjisë
 */
export function findBestPlacements(piece) {
    // Krijo cache key bazuar në piece shape dhe grid state
    const shapeKey = JSON.stringify(piece.currentShape || piece.shape);
    const gridChecksum = calculateGridChecksum();
    const cacheKey = `${shapeKey}-${gridChecksum}`;
    
    // Kontrollo cache
    if (placementCache.has(cacheKey)) {
        return placementCache.get(cacheKey);
    }
    
    const allValidPlacements = findValidPlacements(piece);
    const shape = piece.currentShape || piece.shape;
    
    if (allValidPlacements.length === 0) {
        placementCache.set(cacheKey, []);
        return [];
    }
    
    // Vlerëso çdo vendosje dhe jep pikë strategjike
    const scoredPlacements = allValidPlacements.map(placement => {
        const { row, col } = placement;
        const score = calculatePlacementScore(shape, row, col);
        return { ...placement, score };
    });
    
    // Renditi sipas pikëve (më të mirët në fillim)
    scoredPlacements.sort((a, b) => b.score - a.score);
    
    // Merr vetëm 5-8 vendet më të mira (jo të gjitha)
    const bestPlacements = scoredPlacements.slice(0, Math.min(8, Math.max(3, Math.ceil(scoredPlacements.length * 0.2))));
    
    // Ruaj në cache
    placementCache.set(cacheKey, bestPlacements);
    
    return bestPlacements;
}

/**
 * Kalkulon një checksum të shpejtë për grid state
 * @returns {string} - Checksum i grid-it
 */
function calculateGridChecksum() {
    let hash = 0;
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            hash = ((hash << 5) - hash + gameState.grid[r][c]) >>> 0; // 32-bit rolling hash
        }
    }
    return hash.toString(16);
}

/**
 * Kalkulon score-n për një placement specifik
 * @param {Array} shape - Forma e pjesës
 * @param {number} row - Rreshti
 * @param {number} col - Kolona
 * @returns {number} - Score i placement-it
 */
function calculatePlacementScore(shape, row, col) {
    let score = 0;
    
    // 1. BONUS për vendosje në qoshe (strategjike për lojë)
    const isCorner = (row === 0 || row === GRID_ROWS - 1) && (col === 0 || col === GRID_COLS - 1);
    if (isCorner) score += 50;
    
    // 2. BONUS për vendosje pranë mureve
    const nearWall = (row === 0 || row === GRID_ROWS - 1 || col === 0 || col === GRID_COLS - 1);
    if (nearWall) score += 30;
    
    // 3. BONUS për vendosje që mund të kompletojnë rreshta/kolona
    const completionBonus = calculateCompletionPotential(shape, row, col);
    score += completionBonus * 20;
    
    // 4. BONUS për vendosje pranë pjesëve ekzistuese (konsolidim)
    const adjacencyBonus = calculateAdjacencyBonus(shape, row, col);
    score += adjacencyBonus * 15;
    
    // 5. PENALITET për vendosje në mes (më pak strategjike)
    const isCenter = row > 2 && row < GRID_ROWS - 3 && col > 2 && col < GRID_COLS - 3;
    if (isCenter) score -= 20;
    
    return score;
}

/**
 * Kalkulon potencialin për kompletimin e rreshtave/kolonave
 */
function calculateCompletionPotential(shape, startRow, startCol) {
    let potential = 0;
    
    // Kontrollo për çdo rresht që prekon kjo pjesë
    const occupiedRows = new Set();
    const occupiedCols = new Set();
    
    shape.forEach(([r, c]) => {
        const gridRow = startRow + r;
        const gridCol = startCol + c;
        if (isInBounds(gridRow, gridCol)) {
            occupiedRows.add(gridRow);
            occupiedCols.add(gridCol);
        }
    });
    
    // Kontrollo sa të mbushura janë rreshtat/kolonat
    occupiedRows.forEach(row => {
        let filledCells = 0;
        for (let col = 0; col < GRID_COLS; col++) {
            if (gameState.grid[row][col] !== 0) filledCells++;
        }
        const fillPercentage = filledCells / GRID_COLS;
        if (fillPercentage > 0.6) potential += fillPercentage * 2; // Bonus i lartë për rreshta pothuajse të mbushur
    });
    
    occupiedCols.forEach(col => {
        let filledCells = 0;
        for (let row = 0; row < GRID_ROWS; row++) {
            if (gameState.grid[row][col] !== 0) filledCells++;
        }
        const fillPercentage = filledCells / GRID_ROWS;
        if (fillPercentage > 0.6) potential += fillPercentage * 2; // Bonus i lartë për kolona pothuajse të mbushura
    });
    
    return potential;
}

/**
 * Kalkulon bonusin për vendosje pranë pjesëve ekzistuese
 */
function calculateAdjacencyBonus(shape, startRow, startCol) {
    let adjacentCount = 0;
    
    shape.forEach(([r, c]) => {
        const gridRow = startRow + r;
        const gridCol = startCol + c;
        
        if (isInBounds(gridRow, gridCol)) {
            // Kontrollo qelizat përreth
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            directions.forEach(([dr, dc]) => {
                const checkRow = gridRow + dr;
                const checkCol = gridCol + dc;
                if (isInBounds(checkRow, checkCol) &&
                    gameState.grid[checkRow][checkCol] !== 0) {
                    adjacentCount++;
                }
            });
        }
    });
    
    return adjacentCount;
}

