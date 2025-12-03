// Rendering and UI update functions

import { gameState } from './state.js';
import { GRID_ROWS, GRID_COLS } from './constants.js';
import { pieceUnlockSystem } from './pieceUnlockSystem.js';
import * as audio from './audio.js';

// ✅ PERFORMANCE: Object Pool to reduce Garbage Collection pauses
class AnimationPool {
    constructor(size = 100) {
        this.pool = Array.from({ length: size }, () => ({ r: 0, c: 0, delay: 0 }));
        this.index = 0;
    }
    acquire() {
        const item = this.pool[this.index];
        this.index = (this.index + 1) % this.pool.length;
        return item;
    }
}
const animPool = new AnimationPool();

// Element Cache
const dom = {};
let cellElements = [];
// Cache për highlighted cells për performance
let highlightedCells = new Set();
// Track current highlight state to avoid redundant updates
let lastHighlightedCells = new Set();
let lastHighlightClass = '';
let lastPieceColor = '';
const PIECE_ANIMATION_DURATION = 950;




/**
 * Gjen të gjitha elementet e nevojshme nga DOM-i dhe i ruan në objektin 'dom'.
 */
export function cacheDOMElements() {
    const ids = [
        'landingPage', 'startButton', 'gameGrid', 'piecesContainer', 'score',
        'highscore-display', 'restartButton', 'pauseButton', 'settingsButton',
        'gameOverMessage', 'gameOverRestartButton', 'darkModeToggleGame',
        'particles-overlay', 'comboMessage', 'themeSelectorContainer', 'draggedPieceClone',
        'pieces-unlocked', 'achievements-count', 'finalScore', 'gameOverHighScore'
    ];
    ids.forEach(id => dom[id] = document.getElementById(id));
    dom.gameContainer = document.querySelector('.game-container');
    
    // Note: createUnlockProgressIndicator() moved to initializeState based on game mode
}

/**
 * Krijon indicator për unlock progress
 */
function createUnlockProgressIndicator() {
    // Remove existing progress indicator if it exists
    const existingProgress = document.getElementById('unlock-progress');
    if (existingProgress) {
        existingProgress.remove();
    }
    
    
    const progressDiv = document.createElement('div');
    progressDiv.id = 'unlock-progress';
    progressDiv.className = 'unlock-progress';
    progressDiv.innerHTML = `
        <h4>🔓 Piece Collection</h4>
        <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
        </div>
        <div class="progress-text" id="progress-text">7/30 pieces unlocked</div>
        <div class="progress-text" id="next-unlock-text">Next unlock: 1000 points</div>
    `;
    document.body.appendChild(progressDiv);
    dom.unlockProgress = progressDiv;
    // Close progress indicator on click
    const onClickOutside = (e) => {
        if (!progressDiv.contains(e.target)) {
            cleanup();
        }
    };
    const cleanup = () => {
        if (progressDiv.parentNode) {
            progressDiv.remove();
        }
        document.removeEventListener('click', onClickOutside);
        if (autoDismissId) {
            clearTimeout(autoDismissId);
        }
    };
    progressDiv.addEventListener('click', cleanup);
    // Auto-dismiss after 3 seconds
    const autoDismissId = setTimeout(() => {
        cleanup();
    }, 3000);
    // Close on click outside progress indicator
    document.addEventListener('click', onClickOutside);
    
    // Update initial progress
    updateUnlockProgress();
}

/**
 * Krijon rrjetën e qelizave në DOM vetëm një herë. Kjo është thelbësore për performancën.
 */
export function createGridDOM() {
    dom.gameGrid.innerHTML = '';
    cellElements = [];
    for (let r = 0; r < GRID_ROWS; r++) {
        const rowElements = [];
        for (let c = 0; c < GRID_COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            // Create a block wrapper inside the cell - this is what we animate
            const blockWrapper = document.createElement('div');
            blockWrapper.classList.add('grid-cell-block');
            cell.appendChild(blockWrapper);
            
            dom.gameGrid.appendChild(cell);
            rowElements.push(cell);
        }
        cellElements.push(rowElements);
    }
}

/**
 * Krijon elementin HTML për një pjesë të vetme.
 */
function createPieceElement(pieceData, index) {
    const pieceElement = document.createElement('div');
    pieceElement.classList.add('piece');
    pieceElement.dataset.pieceIndex = index;

    if (!pieceData) {
        pieceElement.classList.add('empty');
        pieceElement.dataset.pieceId = '';
        return pieceElement;
    }
    
    // Add piece ID for tracking changes
    pieceElement.dataset.pieceId = pieceData.id ? pieceData.id.toString() : '';
    
    pieceElement.setAttribute('draggable', 'true');
    const pieceGrid = createPieceGridElement(pieceData);
    pieceElement.appendChild(pieceGrid);
    
    return pieceElement;
}

/**
 * Krijon rrjetën vizuale për një pjesë (përdoret për pjesët në raft dhe për klonin).
 */
function createPieceGridElement(pieceData) {
    const pieceGrid = document.createElement('div');
    pieceGrid.classList.add('piece-grid');

    let maxRow = 0, maxCol = 0;
    pieceData.currentShape.forEach(([r, c]) => {
        maxRow = Math.max(maxRow, r);
        maxCol = Math.max(maxCol, c);
    });

    pieceGrid.style.gridTemplateRows = `repeat(${maxRow + 1}, var(--piece-block-size))`;
    pieceGrid.style.gridTemplateColumns = `repeat(${maxCol + 1}, var(--piece-block-size))`;

    const visualGrid = Array.from({ length: maxRow + 1 }, () => Array(maxCol + 1).fill(0));
    pieceData.currentShape.forEach(([r, c]) => { visualGrid[r][c] = pieceData.color; });

    for (let r = 0; r <= maxRow; r++) {
        for (let c = 0; c <= maxCol; c++) {
            const block = document.createElement('div');
            block.classList.add('piece-block');
            if (visualGrid[r][c] !== 0) {
                block.classList.add(`color-${visualGrid[r][c]}`);
                block.dataset.shapeRow = r;
                block.dataset.shapeCol = c;
            } else {
                block.style.visibility = 'hidden';
            }
            pieceGrid.appendChild(block);
        }
    }
    
    return pieceGrid;
}

function hasPieceChanged(existingElement, newPieceData) {
    const shouldBeEmpty = !newPieceData;
    const isCurrentlyEmpty = !existingElement || existingElement.classList.contains('empty');

    if (shouldBeEmpty || isCurrentlyEmpty) {
        return shouldBeEmpty !== isCurrentlyEmpty;
    }

    const existingId = existingElement.dataset.pieceId || '';
    const nextId = newPieceData.id ? newPieceData.id.toString() : '';
    return existingId !== nextId;
}

function animatePieceEntry(pieceElement, index, { isInitialLoad = false, allowSound = true } = {}) {
    if (!pieceElement || pieceElement.classList.contains('empty')) {
        return;
    }

    pieceElement.classList.add('new-piece');

    if (isInitialLoad) {
        const delay = index * 150;
        pieceElement.style.animationDelay = `${delay}ms`;
        if (allowSound) {
            setTimeout(() => audio.playPieceAppearSound(), delay);
        }
        setTimeout(() => {
            pieceElement.classList.remove('new-piece');
            pieceElement.style.animationDelay = '';
        }, PIECE_ANIMATION_DURATION + delay);
        return;
    }

    if (allowSound) {
        audio.playPieceAppearSound();
    }
    setTimeout(() => {
        pieceElement.classList.remove('new-piece');
    }, PIECE_ANIMATION_DURATION);
}

function rebuildPiecesContainer({ animateAll = false } = {}) {
    if (!dom.piecesContainer) {
        return;
    }

    dom.piecesContainer.innerHTML = '';
    gameState.currentPieces.forEach((pieceData, index) => {
        const pieceElement = createPieceElement(pieceData, index);
        dom.piecesContainer.appendChild(pieceElement);
        if (animateAll) {
            animatePieceEntry(pieceElement, index, { isInitialLoad: true, allowSound: true });
        }
    });
}

// --- Main Render Functions ---

/**
 * ✅ PERFORMANCE: Batched DOM updates to prevent Layout Thrashing
 * PHASE 1: READ all DOM state without modifications
 * PHASE 2: WRITE all changes in batch (single layout recalculation)
 */
export function updateGridDisplay() {
    const updates = []; // Store changes temporarily

    // PHASE 1: READ ONLY (Do not touch DOM)
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            const cellValue = gameState.grid[r][c];
            const cellElement = cellElements[r][c];
            
            // Check if wrapper exists without creating it yet
            let blockWrapper = cellElement.firstChild;
            let needsCreation = !blockWrapper;
            
            updates.push({
                cellElement,
                blockWrapper, 
                needsCreation,
                cellValue,
                // Calculate class here, not during write
                newClass: cellValue !== 0 ? `filled-${cellValue}` : null
            });
        }
    }

    // PHASE 2: WRITE ONLY (Apply changes)
    updates.forEach(({ cellElement, blockWrapper, needsCreation, cellValue, newClass }) => {
        if (needsCreation) {
            blockWrapper = document.createElement('div');
            blockWrapper.classList.add('grid-cell-block');
            cellElement.appendChild(blockWrapper);
        }

        // Reset classes
        blockWrapper.className = 'grid-cell-block';

        // Add new class if needed
        if (newClass) {
            blockWrapper.classList.add(newClass);
        }
    });
}

/**
 * Clears lastPlacement after one render cycle to avoid re-animating
 */
export function clearPlacementFlag() {
    // Reset lastPlacementCells to avoid re-triggering animation
    gameState.lastPlacementCells = [];
}
/**
 * Animon qelizat e sapo vendosura me një efekt vale fluid dhe organik.
 * @param {Array<{r:number, c:number}>} cells - Vargu i pozicioneve të qelizave për t'u animuar.
 */
export function animatePlacement(cells) {
    if (!Array.isArray(cells) || cells.length === 0) return;

    let centerR = 0;
    let centerC = 0;
    cells.forEach(({ r, c }) => {
        centerR += r;
        centerC += c;
    });
    centerR /= cells.length;
    centerC /= cells.length;

    const cellsWithDelay = cells.map(({ r, c }) => {
        // ✅ Use pool instead of creating new object
        const obj = animPool.acquire(); 
        
        // Simple distance calculation for ripple effect
        // Assuming grid center is roughly 4,4 (adjust if grid size differs)
        const distance = Math.hypot(r - 4, c - 4); 
        
        obj.r = r;
        obj.c = c;
        obj.delay = distance * 30; 
        return obj;
    });

    cells.forEach(({ r, c }) => {
        const cell = cellElements[r]?.[c];
        if (!cell) return;
        const blockWrapper = cell.querySelector('.grid-cell-block');
        if (!blockWrapper) return;
        blockWrapper.classList.remove('placed');
        blockWrapper.style.animation = 'none';
        void blockWrapper.offsetWidth;
    });

    cellsWithDelay.forEach(({ r, c, delay }) => {
        const cell = cellElements[r]?.[c];
        if (!cell) return;
        const blockWrapper = cell.querySelector('.grid-cell-block');
        if (!blockWrapper) return;

        const jitter = (Math.random() - 0.5) * 14;
        const finalDelay = Math.max(0, delay + jitter);

        blockWrapper.style.animation = '';
        blockWrapper.style.animationDelay = `${finalDelay}ms`;
        blockWrapper.classList.add('placed');

        blockWrapper.addEventListener('animationend', () => {
            blockWrapper.classList.remove('placed');
            blockWrapper.style.animationDelay = '';
        }, { once: true });
    });
}

/**
 * Përditëson pamjen e pjesëve në dispozitiv.
 */
export function updatePiecesDisplay(isInitialLoad = false) {
    if (!dom.piecesContainer || !Array.isArray(gameState.currentPieces)) {
        return;
    }

    const renderedPieces = Array.from(dom.piecesContainer.children);
    const nextPieces = gameState.currentPieces;

    if (isInitialLoad || renderedPieces.length !== nextPieces.length) {
        rebuildPiecesContainer({ animateAll: isInitialLoad });
        return;
    }

    const changedIndices = [];
    for (let i = 0; i < nextPieces.length; i++) {
        if (hasPieceChanged(renderedPieces[i], nextPieces[i])) {
            changedIndices.push(i);
        }
    }

    if (changedIndices.length === 0) {
        return;
    }

    let soundPlayed = false;
    changedIndices.forEach((index) => {
        const newPieceData = nextPieces[index];
        const newElement = createPieceElement(newPieceData, index);
        const reference = renderedPieces[index];

        if (reference && reference.parentNode === dom.piecesContainer) {
            reference.replaceWith(newElement);
        } else if (dom.piecesContainer.children[index]) {
            dom.piecesContainer.replaceChild(newElement, dom.piecesContainer.children[index]);
        } else {
            dom.piecesContainer.appendChild(newElement);
        }

        if (newPieceData) {
            const allowSound = !soundPlayed;
            animatePieceEntry(newElement, index, { allowSound, isInitialLoad: false });
            if (allowSound) {
                soundPlayed = true;
            }
        }
    });
}

/**
 * Përditëson shfaqjen e pikëve dhe pikëve më të larta.
 */
export function updateScoreDisplay() {
    // Update current score text
    dom.score.textContent = gameState.score;
    // Pop animation on score change
    const scoreEl = dom.score;
    if (scoreEl) {
        scoreEl.classList.remove('score-animated');
        void scoreEl.offsetWidth; // force reflow to restart animation
        scoreEl.classList.add('score-animated');
    }
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('blokusHighScore', gameState.highScore);
    }
    // Update high score only in landing page, not during game
    if (dom['highscore-display']) {
        dom['highscore-display'].textContent = gameState.highScore;
    }
}
/**
 * Përditëson unlock progress indicator
 */
function updateUnlockProgress() {
    const gameMode = localStorage.getItem('selectedGameMode') || 'collection';
    
    // Only update progress in Collection Mode
    if (gameMode !== 'collection') {
        return;
    }
    
    const progressInfo = pieceUnlockSystem.getProgressInfo();
    
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const nextUnlockText = document.getElementById('next-unlock-text');
    
    if (progressFill) {
        progressFill.style.width = `${progressInfo.percentage}%`;
    }
    
    if (progressText) {
        progressText.textContent = `${progressInfo.unlockedCount}/${progressInfo.totalPieces} pieces unlocked`;
    }
    
    if (nextUnlockText && progressInfo.nextUnlock) {
        nextUnlockText.textContent = `Next: ${progressInfo.nextUnlock.name} (${progressInfo.nextUnlock.remaining} points)`;
    } else if (nextUnlockText) {
        nextUnlockText.textContent = "🎉 All pieces unlocked!";
    }
}


// --- UI Panels and Messages ---

/**
 * Update overlays - now only handles game over screen
 */
export function updateOverlays() {
    try {
        const showGameOver = gameState.isGameOver;

        if (dom.gameOverMessage) {
            dom.gameOverMessage.classList.toggle('hidden', !showGameOver);
            
            // If showing game over, attach the Play Again listener
            if (showGameOver) {
                setTimeout(() => {
                    const playAgainBtn = document.getElementById('gameOverRestartButton');
                    
                    if (playAgainBtn) {
                        // Remove existing listeners
                        playAgainBtn.onclick = null;
                        const newBtn = playAgainBtn.cloneNode(true);
                        playAgainBtn.parentNode.replaceChild(newBtn, playAgainBtn);
                        
                        newBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Import necessary modules and restart game
                            import('./state.js').then(({ initializeState }) => {
                                import('./gameLogic.js').then((logic) => {
                                    // Hide game over message
                                    dom.gameOverMessage.classList.add('hidden');
                                    
                                    // Reset game state
                                    initializeState();
                                    logic.populateInitialPieces();
                                    
                                    // Update displays
                                    updateGridDisplay();
                                    updatePiecesDisplay();
                                    updateScoreDisplay();
                                    updateOverlays();
                                    
                                    // Re-attach piece event listeners using main.js function
                                    setTimeout(() => {
                                        if (window.attachPieceEventListeners) {
                                            window.attachPieceEventListeners();
                                        } else {
                                            // Fallback: try to call the function from main module
                                            import('./main.js').then((main) => {
                                                if (main.attachPieceEventListeners) {
                                                    main.attachPieceEventListeners();
                                                }
                                            });
                                        }
                                    }, 200);
                                    
                                }).catch(err => console.log('Error loading gameLogic:', err));
                            }).catch(err => console.log('Error loading state:', err));
                        });
                        
                    }
                }, 100);
            }
        }

        // Only dim background when game over overlay is active, not when paused
        if (showGameOver) {
            if (dom.piecesContainer) dom.piecesContainer.style.opacity = '0.5';
            if (dom.gameGrid) dom.gameGrid.style.opacity = '0.5';
        } else {
            if (dom.piecesContainer) dom.piecesContainer.style.opacity = '1';
            if (dom.gameGrid) dom.gameGrid.style.opacity = '1';
        }
    } catch (error) {
        // Silent error handling - continue operation
    }
}

export function showGameOverMessage() {
    // Update final score and high score in game over screen
    if (dom.finalScore) {
        dom.finalScore.textContent = gameState.score;
    }
    if (dom.gameOverHighScore) {
        dom.gameOverHighScore.textContent = gameState.highScore;
    }
    
    dom.gameOverMessage.classList.remove('hidden');
    dom.piecesContainer.style.opacity = '0.5';
    
    // Attach play again listener
    setTimeout(() => {
        const playAgainBtn = document.getElementById('gameOverRestartButton');
        
        if (playAgainBtn) {
            // Remove any existing listeners
            playAgainBtn.onclick = null;
            const newBtn = playAgainBtn.cloneNode(true);
            playAgainBtn.parentNode.replaceChild(newBtn, playAgainBtn);
            
            // Add new listener - reload page to restart game
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                location.reload();
            });
        }
    }, 500);
}

export function hideGameOverMessage() {
    dom.gameOverMessage.classList.add('hidden');
    dom.piecesContainer.style.opacity = '1';
}

export function updateControlButtons() {
    if (dom.pauseButton) {
        dom.pauseButton.disabled = gameState.isGameOver;
        dom.pauseButton.innerHTML = gameState.isPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
        dom.pauseButton.title = gameState.isPaused ? 'Resume Game' : 'Pause Game';
        dom.pauseButton.setAttribute('aria-label', gameState.isPaused ? 'Resume Game' : 'Pause Game');
    }
    
    if (dom.restartButton) {
        dom.restartButton.disabled = gameState.isGameOver;
        // Explicitly show or hide restart button based on pause state
        if (gameState.isPaused) {
            dom.restartButton.classList.remove('hidden');
        } else {
            dom.restartButton.classList.add('hidden');
        }
    }
}
// Shfaq mesazh combo spektakolar
export function showComboMessage(comboCount) {
    const comboMsg = dom.comboMessage;
    comboMsg.textContent = comboCount >= 5 ? `SPEKTAKOLARE! COMBO x${comboCount}` : `Combo x${comboCount}`;
    comboMsg.classList.remove('hidden');
    if (comboCount >= 5) comboMsg.classList.add('spectacular');
    setTimeout(() => {
        comboMsg.classList.add('hidden');
        comboMsg.classList.remove('spectacular');
    }, 1200);
}


/**
 * Clean up old floating score elements to prevent memory leaks
 */
export function cleanupOldFloatingScores() {
    const floatingScores = document.querySelectorAll('.floating-score');
    const now = Date.now();
    const maxAge = 5000; // 5 seconds max age
    
    floatingScores.forEach(element => {
        const created = parseInt(element.dataset.created);
        if (created && (now - created) > maxAge) {
            element.remove();
        }
    });
}

// --- Drag & Drop Visuals (nga dragVisuals.js) ---

/**
 * Krijon klonin vizual të pjesës që tërhiqet.
 */
export function createDraggedPieceClone(pieceData) {
    if (!dom.draggedPieceClone) {
        console.warn('draggedPieceClone element not found in DOM');
        return;
    }
    
    const pieceGrid = createPieceGridElement(pieceData);
    dom.draggedPieceClone.innerHTML = '';
    // Mark the clone container so CSS can easily exclude it from grid animations
    dom.draggedPieceClone.setAttribute('data-clone', 'true');
    // Mark inner blocks so they can be targeted precisely if needed
    pieceGrid.querySelectorAll('.piece-block').forEach(b => b.classList.add('clone-block'));
    dom.draggedPieceClone.appendChild(pieceGrid);
    dom.draggedPieceClone.classList.remove('hidden', 'shake');
    dom.draggedPieceClone.classList.add('show');
    
    // Cache geometry metrics for smoother drag calculations
    let blockSize = 30;
    const cloneBlock = dom.draggedPieceClone.querySelector('.piece-block');
    if (cloneBlock) {
        const rect = cloneBlock.getBoundingClientRect();
        blockSize = rect.width;
    }

    let gap = 0;
    const cloneGrid = dom.draggedPieceClone.querySelector('.piece-grid');
    if (cloneGrid) {
        const computed = getComputedStyle(cloneGrid);
        const gapValue = computed.gap || computed.gridGap;
        const parsedGap = parseFloat(gapValue);
        if (!Number.isNaN(parsedGap)) {
            gap = parsedGap;
        }
    }

    const cloneStyle = getComputedStyle(dom.draggedPieceClone);
    const paddingX = parseFloat(cloneStyle.paddingLeft) || 0;
    const paddingY = parseFloat(cloneStyle.paddingTop) || 0;

    Object.assign(gameState.dragState, {
        blockSize,
        gap,
        paddingX,
        paddingY,
        metricsCached: true,
    });
    // debug logs removed for production
}

export function hideDraggedPieceClone() {
    dom.draggedPieceClone.classList.remove('show');
}

export function shakeDraggedPieceClone(duration) {
    dom.draggedPieceClone.classList.add('shake');
    setTimeout(() => {
        dom.draggedPieceClone.classList.remove('shake');
    }, duration);
}

/**
 * Përditëson pozicionin e klonit të tërhequr për të ndjekur kursorin/gishtin,
 * duke marrë parasysh padding-un për pozicionim të saktë të bllokut të ankorës.
 * OPTIMIZED: Avoids offsetWidth/offsetHeight reads which force reflow
 */
export function updateDraggedPiecePosition(clientX, clientY) {
    if (!dom.draggedPieceClone) return;
    if (!dom.draggedPieceClone.classList.contains('show')) return;
    // Çaktivizo çdo transformim ekzistues
    dom.draggedPieceClone.style.transform = 'none';
    const { offsetX, offsetY } = gameState.dragState;
    
    let { blockSize, gap, paddingX, paddingY, metricsCached, cloneWidth, cloneHeight } = gameState.dragState;

    if (!metricsCached) {
        let measuredBlockSize = blockSize;
        const cloneBlock = dom.draggedPieceClone.querySelector('.piece-block');
        if (cloneBlock) {
            const rect = cloneBlock.getBoundingClientRect();
            measuredBlockSize = rect.width;
        }

        let measuredGap = gap;
        const cloneGrid = dom.draggedPieceClone.querySelector('.piece-grid');
        if (cloneGrid) {
            const computed = getComputedStyle(cloneGrid);
            const gapValue = computed.gap || computed.gridGap;
            const parsedGap = parseFloat(gapValue);
            if (!Number.isNaN(parsedGap)) {
                measuredGap = parsedGap;
            }
        }

        const cloneStyle = getComputedStyle(dom.draggedPieceClone);
        const measuredPaddingX = parseFloat(cloneStyle.paddingLeft) || 0;
        const measuredPaddingY = parseFloat(cloneStyle.paddingTop) || 0;
        
        // CRITICAL: Cache clone dimensions ONCE to avoid offsetWidth/offsetHeight reflows during drag
        const measuredWidth = dom.draggedPieceClone.offsetWidth || 80;
        const measuredHeight = dom.draggedPieceClone.offsetHeight || 80;

        Object.assign(gameState.dragState, {
            blockSize: measuredBlockSize || 30,
            gap: !Number.isNaN(measuredGap) ? measuredGap : 0,
            paddingX: measuredPaddingX,
            paddingY: measuredPaddingY,
            metricsCached: true,
            cloneWidth: measuredWidth,
            cloneHeight: measuredHeight,
        });

        ({ blockSize, gap, paddingX, paddingY, cloneWidth, cloneHeight } = gameState.dragState);
    }

    if (!blockSize || blockSize <= 0) {
        blockSize = 30;
    }
    if (!Number.isFinite(gap)) {
        gap = 0;
    }
    if (!Number.isFinite(paddingX)) {
        paddingX = 0;
    }
    if (!Number.isFinite(paddingY)) {
        paddingY = 0;
    }

    // Llogaritjet e pozicionit - vendos gishtin në qendrën e bllokut të ankorës
    const anchorXInClone = paddingX + (offsetX * (blockSize + gap)) + (blockSize / 2);
    const anchorYInClone = paddingY + (offsetY * (blockSize + gap)) + (blockSize / 2);
    
    // Përdor metodën absolute të pozicionimit
    const rawLeft = clientX - anchorXInClone;
    const rawTop = clientY - anchorYInClone;
    
    // FIX: HEQJE e viewport clamping - kloni duhet të lëvizë lirshëm në screen
    // Viewport clamping po e bënte klonin ndalohet brenda ekranit dhe nuk shfaqej në qelizat e poshtme të gridës
    // Tani clone lëviz lirshëm me pointer pa klamping artificial
    // Ghost preview (highlighted cells) po punojnë saktë sepse janë grid-cell-based
    
    // OPTIMIZATION: Përdor transform translate3d për hardware acceleration
    // Kjo është shumë më e shpejtë se left/top në mobile
    // Use setProperty with 'important' to override any stylesheet rules that might
    // force transform to 'none' (some legacy CSS used '!important'). This ensures
    // the inline transform is applied on all browsers.
    // DRAG LATENCY FIX: Direct translate3d keeps clone perfectly in sync with pointer
    dom.draggedPieceClone.style.setProperty('transform', `translate3d(${rawLeft}px, ${rawTop}px, 0)`, 'important');
    dom.draggedPieceClone.style.left = '0';
    dom.draggedPieceClone.style.top = '0';
}

/**
 * Pastron të gjitha highlight-et dhe hijet nga rrjeta.
 * OPTIMIZED: Përdor cache në vend të querySelectorAll për performance më të mirë
 */
export function clearHighlights() {
    highlightedCells.forEach(cell => {
        // Remove highlight classes from the cell itself
        cell.classList.remove('highlight', 'invalid-highlight');
        
        // Clean up ghost + color classes from the inner block wrapper
        const blockWrapper = cell.querySelector('.grid-cell-block');
        if (blockWrapper) {
            blockWrapper.classList.remove('ghost');
            if (lastPieceColor) {
                blockWrapper.classList.remove(`filled-${lastPieceColor}`);
            }
        }
        
        // Clear any inline background styles
        cell.style.backgroundColor = '';
    });
    // Clear cache
    highlightedCells.clear();
}

/**
 * Shfaq hijen e pjesës në rrjetë ku do të vendoset.
 * OPTIMIZED: Përdor cache dhe redukton DOM manipulations
 */
export function showGhostAndHighlight(piece, startRow, startCol, isValid) {
    clearHighlights();
    const highlightClass = isValid ? 'highlight' : 'invalid-highlight';
    
    // Cache the piece color for cleanup later
    lastPieceColor = piece.color;
    lastHighlightClass = highlightClass;
    
    piece.currentShape.forEach(([r, c]) => {
        const gridRow = startRow + r;
        const gridCol = startCol + c;
        if (gridRow >= 0 && gridRow < GRID_ROWS && gridCol >= 0 && gridCol < GRID_COLS) {
            const cell = cellElements[gridRow][gridCol];
            if (!cell) return;
            
            const blockWrapper = cell.querySelector('.grid-cell-block');
            if (!blockWrapper) return;
            
            // Check if the underlying blockWrapper is already filled on the grid
            const isGridFilled = Array.from(blockWrapper.classList).some(cls => cls.startsWith('filled-'));
            
            // Only draw ghost/highlight on empty grid blocks
            if (!isGridFilled) {
                cell.classList.add(highlightClass);
                if (isValid) {
                    // Apply ghost class + filled color for the 3D designed appearance
                    // The filled-* class provides the 3D block design, ghost makes it semi-transparent
                    blockWrapper.classList.add('ghost', `filled-${piece.color}`);
                }
                // Track the cell for fast cleanup later
                highlightedCells.add(cell);
            }
        }
    });
}


/**
 * Përditëson emrin e temës që shfaqet në faqe
 * @param {string} themeName - Emri i temës
 */
/**
 * Krijon elementet dinamikë për temën "Future Galaxies"
 */
/**
 * Krijon elementet dinamikë për temën "Future Galaxies - Universi i Pafund"
 */
function createGalaxyElements() {
    // Krijo yjet e afërt
    const closeStars = document.createElement('div');
    closeStars.className = 'close-stars galaxy-element';
    closeStars.style.overflow = 'hidden';
    document.body.appendChild(closeStars);

    // Krijo nebula efektet
    const nebula1 = document.createElement('div');
    nebula1.className = 'nebula-1 galaxy-element';
    document.body.appendChild(nebula1);

    const nebula2 = document.createElement('div');
    nebula2.className = 'nebula-2 galaxy-element';
    document.body.appendChild(nebula2);

    // Krijo yje kryesore me shkëlqim
    const celestialBodies = document.createElement('div');
    celestialBodies.className = 'galaxy-element';
    celestialBodies.style.position = 'fixed';
    celestialBodies.style.top = '0';
    celestialBodies.style.left = '0';
    celestialBodies.style.width = '100%';
    celestialBodies.style.height = '100%';
    celestialBodies.style.pointerEvents = 'none';
    
    // Krijo 40 yje kryesore
    for (let i = 0; i < 40; i++) {
        const star = document.createElement('div');
        star.className = 'celestial-star';
        
        // Pozicionim
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        
        // Madhësi dhe shkëlqim
        const size = Math.random() * 1.2 + 0.3;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        // Animacion personalizuar
        star.style.animationDelay = `${Math.random() * 5}s`;
        star.style.animationDuration = `${Math.random() * 5 + 5}s`;
        
        // Shto efekte 3D të lehta
        star.style.transform = `translateZ(${Math.random() * 100}px)`;
        
        celestialBodies.appendChild(star);
    }
    document.body.appendChild(celestialBodies);

    // Krijo comets
    const comets = [
        { top: '20%', left: '10%', delay: '3s' },
        { top: '70%', left: '30%', delay: '8s' }
    ];

    comets.forEach(cometData => {
        const comet = document.createElement('div');
        comet.className = 'comet galaxy-element';
        comet.style.top = cometData.top;
        comet.style.left = cometData.left;
        comet.style.animationDelay = cometData.delay;
        document.body.appendChild(comet);
    });

    // Krijo starfield me Canvas për realism maksimal
    createStarfield();
    
    // Krijo efekte dinamike
    createDynamicEffects();
}

/**
 * Krijon yje shtesë me Canvas për realism
 */
function createStarfield() {
    const canvas = document.createElement('canvas');
    canvas.className = 'starfield-canvas galaxy-element';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '-4';
    document.body.appendChild(canvas);
    
    // Inicializo canvas
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Vizato yje të vegjël
    for (let i = 0; i < 2000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const opacity = Math.random();
        const radius = Math.random() * 0.5;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
    }
    
    // Përditëso kur ndryshon madhësia
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

/**
 * Krijon efekte dinamike
 */
function createDynamicEffects() {
    // Krijo disa yje pulsuese të mëdhenj
    for (let i = 0; i < 5; i++) {
        const pulsar = document.createElement('div');
        pulsar.className = 'celestial-star galaxy-element';
        pulsar.style.left = `${10 + (i * 20)}%`;
        pulsar.style.top = `${15 + (i * 10)}%`;
        pulsar.style.width = '2px';
        pulsar.style.height = '2px';
        pulsar.style.boxShadow = '0 0 10px 5px rgba(255,255,255,0.7)';
        pulsar.style.animation = 'pulsar-glow 3s ease-in-out infinite';
        pulsar.style.zIndex = '-3';
        document.body.appendChild(pulsar);
    }
}

 /**
 * Highlights grid lines that can be cleared
 */
export function highlightClearableLines() {
    clearLineHighlights();
    
    // Check all rows
    for (let r = 0; r < GRID_ROWS; r++) {
        if (gameState.grid[r].every(cell => cell !== 0)) {
            for (let c = 0; c < GRID_COLS; c++) {
                cellElements[r][c].classList.add('clearable-line');
            }
        }
    }
    
    // Check all columns
    for (let c = 0; c < GRID_COLS; c++) {
        let isColFull = true;
        for (let r = 0; r < GRID_ROWS; r++) {
            if (gameState.grid[r][c] === 0) {
                isColFull = false;
                break;
            }
        }
        if (isColFull) {
            for (let r = 0; r < GRID_ROWS; r++) {
                cellElements[r][c].classList.add('clearable-line');
            }
        }
    }
}

/**
 * Removes clearable line highlights
 */
export function clearLineHighlights() {
    document.querySelectorAll('.grid-cell.clearable-line').forEach(cell => {
        cell.classList.remove('clearable-line');
    });
}

/**
 * Periodic cleanup function to remove old particles that may have been missed
 * This prevents memory leaks from accumulating DOM elements
 */
export function cleanupOldParticles() {
    if (!dom['particles-overlay']) return;
    
    const overlay = dom['particles-overlay'];
    const particles = overlay.querySelectorAll('.particle');
    const now = Date.now();
    const maxAge = 5000; // 5 seconds max age
    
    particles.forEach(particle => {
        const created = parseInt(particle.dataset.created);
        if (created && (now - created) > maxAge) {
            // Clear timeout if it exists
            const timeoutId = particle.dataset.timeoutId;
            if (timeoutId) {
                clearTimeout(parseInt(timeoutId));
            }
            particle.remove();
        }
    });
}

// Run periodic cleanup every 10 seconds
setInterval(cleanupOldParticles, 10000);



export { dom, createUnlockProgressIndicator };

