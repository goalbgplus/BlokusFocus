// Tutorial Animation System for "How to Play" feature
// This module handles all the logic for the tutorial modal and animation

let tutorialPlayed = false;

export function showTutorialModal() {
    const shouldRun = !tutorialPlayed;
    tutorialPlayed = true;
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    const modalHTML = `
        <div class="modal-content tutorial-modal">
            <h2>How to Play</h2>
            <div class="tutorial-container">
                <div class="tutorial-score" id="tutorial-score">Score: 0</div>
                <div class="tutorial-grid" id="tutorial-grid"></div>
                <div class="tutorial-piece-area">
                    <div class="tutorial-piece" id="tutorial-piece">
                        <div class="p-block"></div><div class="p-block"></div><div class="p-block"></div><div class="p-block"></div>
                    </div>
                    <div class="tutorial-finger" id="tutorial-finger"><i class="fa-solid fa-hand-pointer"></i></div>
                </div>
            </div>
            <button class="modal-close-btn">Got it!</button>
        </div>`;

    modalOverlay.innerHTML = modalHTML;
    document.body.appendChild(modalOverlay);
    document.body.classList.add('no-scroll');  // Disable body scrolling
    
    // Close modal handlers
    const closeModal = () => { 
        if (document.body.contains(modalOverlay)) { 
            document.body.removeChild(modalOverlay);
            document.body.classList.remove('no-scroll'); // Re-enable scrolling
        }
    };
    
    modalOverlay.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => { 
        if(e.target === modalOverlay) closeModal(); 
    });

    // Start the animation only once
    if (shouldRun) runTutorialAnimation();
}

function runTutorialAnimation() {
    const grid = document.getElementById('tutorial-grid');
    const scoreEl = document.getElementById('tutorial-score');
    const pieceContainer = document.getElementById('tutorial-piece');
    const finger = document.getElementById('tutorial-finger');
    
    if(!grid || !scoreEl || !pieceContainer || !finger) return;

    // Initialize grid with 100 cells
    initializeTutorialGrid(grid);
    
    // Create pre-filled row (missing 4 blocks in the middle)
    setupPrefilledRow(grid);
    
    // Initialize the falling piece
    initializeTutorialPiece(pieceContainer);
    
    // Start the animation sequence
    startAnimationSequence(grid, scoreEl, pieceContainer, finger);
}

function createTutorialBlock(colorTheme) {
    const block = document.createElement('div');
    block.className = 'block';
    
    const defaultTheme = {
        dark1: '#d64e1f', 
        dark2: '#a3320f',
        coreLight: 'rgba(255, 187, 166, 0.8)',
        coreMid: 'rgba(255, 137, 98, 0.5)',
        bevelLight: 'rgba(255, 255, 255, 0.2)',
        bevelDark: 'rgba(80, 24, 0, 0.4)',
        highlight: 'rgba(230, 240, 255, 0.5)'
    };
    
    const theme = colorTheme || defaultTheme;
    
    block.style.setProperty('--color-dark-1', theme.dark1);
    block.style.setProperty('--color-dark-2', theme.dark2);
    block.style.setProperty('--color-core-light', theme.coreLight);
    block.style.setProperty('--color-core-mid', theme.coreMid);
    block.style.setProperty('--color-bevel-light', theme.bevelLight);
    block.style.setProperty('--color-bevel-dark', theme.bevelDark);
    block.style.setProperty('--color-highlight', theme.highlight);
    
    return block;
}

function initializeTutorialGrid(grid) {
    grid.innerHTML = '';
    
    // Create 100 cells (10x10 grid)
    const cells = Array.from({ length: 100 }, () => {
        const cell = document.createElement('div');
        cell.classList.add('grid-cell');
        grid.appendChild(cell);
        return cell;
    });
    
    // Store cells reference for later use
    grid._cells = cells;
}

function setupPrefilledRow(grid) {
    const cells = grid._cells;
    const rowToFill = 5; // Row 6 (0-indexed)
    
    // Fill the row except for positions 3, 4, 5, 6 (where the piece will fit)
    const tealTheme = {
        dark1: '#14b8a6', 
        dark2: '#0f766e',
        coreLight: 'rgba(166, 246, 237, 0.8)',
        coreMid: 'rgba(109, 235, 224, 0.5)',
        bevelLight: 'rgba(255, 255, 255, 0.2)',
        bevelDark: 'rgba(0, 77, 70, 0.4)',
        highlight: 'rgba(255, 255, 240, 0.5)'
    };
    
    for(let i = 0; i < 10; i++) {
        if (i < 3 || i > 6) { // Skip the middle 4 positions
            cells[rowToFill * 10 + i].appendChild(createTutorialBlock(tealTheme));
        }
    }
}

function initializeTutorialPiece(pieceContainer) {
    pieceContainer.innerHTML = '';
    
    // Create 4 blocks for the I-piece (tetromino)
    for(let i = 0; i < 4; i++) {
        const block = createTutorialBlock(); // Uses default orange theme
        pieceContainer.appendChild(block);
    }
}

function startAnimationSequence(grid, scoreEl, pieceContainer, finger) {
    const cells = grid._cells;
    
    // Phase 1: Show finger (500ms)
    setTimeout(() => { 
        finger.style.opacity = '1'; 
        finger.style.transform = 'translate(0, 0)'; 
    }, 500);
    
    // Phase 2: Scale down piece slightly (1500ms)
    setTimeout(() => { 
        pieceContainer.style.transform = 'scale(0.9)'; 
    }, 1500);
    
    // Phase 3: Move piece and finger to target position (2000ms)
    setTimeout(() => { 
        const targetCellRect = cells[53].getBoundingClientRect(); // Row 5, Column 3
        const pieceRect = pieceContainer.getBoundingClientRect();

        const deltaX = targetCellRect.left - pieceRect.left;
        const deltaY = targetCellRect.top - pieceRect.top;
        
        finger.style.transform = `translate(${deltaX}px, ${deltaY}px)`; 
        pieceContainer.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }, 2000);

    // Phase 4: Place piece and hide moving elements (3500ms)
    setTimeout(() => {
        pieceContainer.style.opacity = '0';
        finger.style.opacity = '0';
        
        // Place blocks in the grid
        const targetIndexes = [53, 54, 55, 56]; // 4 consecutive cells in row 5
        targetIndexes.forEach(index => {
           cells[index].appendChild(createTutorialBlock());
        });
    }, 3500);

    // Phase 5: Clear the completed row (4200ms)
    setTimeout(() => {
        const rowToFill = 5;
        for(let i = 0; i < 10; i++) {
            const cell = cells[rowToFill * 10 + i];
            const block = cell.querySelector('.block');
            if (block) {
                block.classList.add('clearing');
            }
        }
    }, 4200);

    // Phase 6: Update score (4700ms)
    setTimeout(() => {
        scoreEl.textContent = `Score: 100`;
        scoreEl.classList.add('updated');
    }, 4700);
    
    // Phase 7: Remove score animation (5000ms)
    setTimeout(() => { 
        scoreEl.classList.remove('updated'); 
    }, 5000);
    
    // Phase 8: Reset for loop (6000ms)
    setTimeout(() => {
        resetTutorialAnimation(grid, scoreEl, pieceContainer, finger);
    }, 6000);
}

function resetTutorialAnimation(grid, scoreEl, pieceContainer, finger) {
    // Reset score
    scoreEl.textContent = 'Score: 0';
    scoreEl.classList.remove('updated');
    
    // Reset piece position and visibility
    pieceContainer.style.transform = 'scale(1)';
    pieceContainer.style.opacity = '1';
    
    // Reset finger
    finger.style.opacity = '0';
    finger.style.transform = 'translate(0, 50px)';
    
    // Clear and rebuild grid
    initializeTutorialGrid(grid);
    setupPrefilledRow(grid);
    initializeTutorialPiece(pieceContainer);
    
    // Restart animation
    setTimeout(() => {
        startAnimationSequence(grid, scoreEl, pieceContainer, finger);
    }, 1000);
}

// Export the main function for use in landing.js
export { createTutorialBlock };
