// Galaxy Row Clear Animation Adapter
// Integrated into the game's row-clear flow
// Blocks use piece styling; particles emerge from cells without touching grid
// VERSION: 3.0 (Dynamic color system - theme-aware)

import { GRID_ROWS, GRID_COLS } from '../constants.js';
import { getBaseColor } from '../gameLogic.js';

// Time to call onComplete callback (non-blocking, decoupled from visual duration)
const LOGIC_DELAY_MS = 80;

// Time to wait before cleaning up DOM (matches visual animation end - 1000ms for faster, smoother experience)
const VISUAL_CLEANUP_DELAY_MS = 1000;

/**
 * Get the frame color - prioritize placedPieceColor if provided
 * @param {number} placedPieceColor - Color number (1-7) or null
 * @param {string} dominantColor - Fallback if placedPieceColor not provided
 * @returns {string} - Hex color code
 */
function getFrameColor(placedPieceColor, dominantColor) {
    const isDarkTheme = document.body.getAttribute('data-theme') === 'dark';
    
    // Support two types for placedPieceColor:
    // - number (1-7) -> palette index, use getBaseColor
    // - string (hex or rgb) -> use directly as base color
    if ((typeof placedPieceColor === 'number' && placedPieceColor >= 1 && placedPieceColor <= 7) || (typeof placedPieceColor === 'string' && placedPieceColor)) {
        let baseColor = typeof placedPieceColor === 'number' ? getBaseColor(placedPieceColor) : placedPieceColor;
        
        // Adaptive lightening for dark theme based on color brightness
        if (isDarkTheme) {
            const brightness = getColorBrightness(baseColor);
            
            // Adaptive lightening strategy:
            // - Dark colors (< 100 brightness): lighten 40%
            // - Medium colors (100-180): lighten 25%
            // - Light colors (180-220): lighten 10%
            // - Very light colors (> 220): no lightening (already visible)
            let lightenPercent = 0;
            if (brightness < 100) {
                lightenPercent = 40;
            } else if (brightness < 180) {
                lightenPercent = 25;
            } else if (brightness < 220) {
                lightenPercent = 10;
            }
            // else: ngjyra është tashmë shumë e lehtë, mos e ndriço
            
            if (lightenPercent > 0) {
                baseColor = lightenColor(baseColor, lightenPercent);
            }
        }
        
        return baseColor;
    }
    return dominantColor; // Fallback to dominant color from grid
}

/**
 * Extract colors from grid cells and adapt for current theme
 * If placedPieceColor is provided, use ONLY that color for all particles (unified design)
 * Otherwise extract actual colors from cells
 * @param {NodeList} cellElements - All grid cells
 * @param {number} rowOrColIndex - The row/column index to extract colors from
 * @param {boolean} isRow - True if extracting from row, false if from column
 * @param {number} placedPieceColor - Color number (1-7) of the piece that caused the clear, or null
 * @returns {Object} - {colors: Array<string>, dominantColor: string}
 */
function extractCellColors(cellElements, rowOrColIndex, isRow, placedPieceColor = null) {
    const isDarkTheme = document.body.getAttribute('data-theme') === 'dark';
    
    // If placedPieceColor is provided, use ONLY that color for unified effect
    if (placedPieceColor && placedPieceColor >= 1 && placedPieceColor <= 7) {
        let pieceColor = getBaseColor(placedPieceColor);
        
        // Lighten for dark theme if needed
        if (isDarkTheme) {
            const brightness = getColorBrightness(pieceColor);
            let lightenPercent = 0;
            if (brightness < 100) {
                lightenPercent = 40;
            } else if (brightness < 180) {
                lightenPercent = 25;
            } else if (brightness < 220) {
                lightenPercent = 10;
            }
            if (lightenPercent > 0) {
                pieceColor = lightenColor(pieceColor, lightenPercent);
            }
        }
        
        // Return same color repeated + cyan accent for sparkle
        // All particles will use the piece color for unified design
        return { 
            colors: [pieceColor, pieceColor, pieceColor, '#22d3ee'], 
            dominantColor: pieceColor 
        };
    }
    
    // Original logic: extract colors from actual grid cells
    const colorCount = {};
    const colors = [];
    
    cellElements.forEach((cell, idx) => {
        const cellPos = isRow ? Math.floor(idx / GRID_COLS) : idx % GRID_COLS;
        if (cellPos === rowOrColIndex) {
            const blockWrapper = cell.querySelector('.grid-cell-block');
            if (!blockWrapper) return;
            
            // Find filled-X class to get color number
            const filledClass = Array.from(blockWrapper.classList).find(cls => cls.startsWith('filled-'));
            if (filledClass) {
                const colorNumber = parseInt(filledClass.replace('filled-', ''));
                let baseColor = getBaseColor(colorNumber);
                
                // Lighten colors for dark theme to maintain visibility
                if (isDarkTheme) {
                    baseColor = lightenColor(baseColor, 20);
                }
                
                colors.push(baseColor);
                colorCount[baseColor] = (colorCount[baseColor] || 0) + 1;
            }
        }
    });
    
    // Find dominant color (most frequent)
    let dominantColor = '#60a5fa'; // Default cyan-blue
    let maxCount = 0;
    for (const [color, count] of Object.entries(colorCount)) {
        if (count > maxCount) {
            maxCount = count;
            dominantColor = color;
        }
    }
    
    // Add cyan accent for sparkle effect (complements most colors)
    colors.push('#22d3ee');
    
    // If no colors found, use theme-appropriate defaults
    if (colors.length === 1) {
        const defaults = isDarkTheme 
            ? ['#60a5fa', '#22d3ee', '#a78bfa']
            : ['#3b82f6', '#06b6d4', '#8b5cf6'];
        return { colors: defaults, dominantColor: defaults[0] };
    }
    
    return { colors, dominantColor };
}

/**
 * Lighten a hex color by a percentage
 * @param {string} hex - Hex color code
 * @param {number} percent - Percentage to lighten (0-100)
 * @returns {string} - Lightened hex color
 */
function lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * (percent / 100)));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * (percent / 100)));
    const b = Math.min(255, (num & 0xff) + Math.round(255 * (percent / 100)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Calculate color brightness (0-255 scale)
 * @param {string} hex - Hex color code
 * @returns {number} - Brightness value (0-255)
 */
function getColorBrightness(hex) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16) & 0xff;
    const g = (num >> 8) & 0xff;
    const b = num & 0xff;
    // Use perceived brightness formula (human eye sensitivity)
    return (r * 0.299 + g * 0.587 + b * 0.114);
}

function getGridCellBorderRadius(gameGrid) {
    const fallbackVar = getComputedStyle(document.documentElement).getPropertyValue('--grid-cell-radius')?.trim();
    const fallback = fallbackVar && fallbackVar.length ? fallbackVar : '8px';

    if (!gameGrid) {
        return fallback;
    }

    try {
        const sampleCell = gameGrid.querySelector('.grid-cell');
        if (sampleCell) {
            const computed = window.getComputedStyle(sampleCell).borderRadius;
            if (computed && computed.trim().length) {
                return computed;
            }
        }
    } catch (err) {
        console.warn('[galaxyRowClear] Failed to read grid cell border radius', err);
    }

    return fallback;
}

/**
 * Trigger a subtle shake on the main game area to emphasize clears.
 * @param {number} duration - ms to keep the shake class applied (default 380ms)
 */
function triggerGameAreaShake(duration = 380) {
    try {
        // Prefer animating the inner grid element because some mobile CSS
        // pins `.game-area` with `transform: translate(...) !important` which
        // can prevent transform-based animations from being visible. Animating
        // `.game-grid` (the actual grid) avoids that conflict. Fall back to
        // `.game-grid-container` if present, otherwise `.game-area`.
        const container = document.querySelector('.game-area .game-grid') || document.querySelector('.game-area .game-grid-container') || document.querySelector('.game-area');
        if (!container) return;
        const normalCls = 'ext-game-area-shake';
        const strongCls = 'ext-game-area-shake-strong';
        // Default to normal shake unless caller set data-strong attribute on container
        const useStrong = container.getAttribute('data-ext-shake-strong') === '1';
        // Debug: log invocation so we can verify shake is fired for rows/cols
        try {
        } catch (logErr) {
            // ignore logging errors in older browsers
        }
        const cls = useStrong ? strongCls : normalCls;
        container.classList.add(cls);
        // Remove class when the CSS animation ends so duration is controlled by CSS
        const onAnimEnd = (ev) => {
            try {
                // Only respond to animationend from the container itself
                if (ev && ev.target !== container) return;
            } catch (e) {}
            try {
                container.classList.remove(cls);
                container.removeEventListener('animationend', onAnimEnd);
                // Clear the transient strong marker so future calls compute correctly
                try { container.removeAttribute('data-ext-shake-strong'); } catch (e) {}
            } catch (e) {
                // swallow cleanup errors
            }
        };
        // Use once:true so listener auto-removes in older browsers; we also remove in handler for safety
        container.addEventListener('animationend', onAnimEnd, { once: true });
    } catch (e) {
        console.warn('triggerGameAreaShake error', e);
    }
}

/**
 * Plays Galaxy Row Clear animation at specified row
 * NON-BLOCKING: onComplete fires at LOGIC_DELAY_MS (~150ms) instead of waiting for full animation
 * Visual effects (bar, particles, block collapse) continue for full VISUAL_CLEANUP_DELAY_MS (~900ms)
 * 
 * @param {number} rowIndex - The row to animate
 * @param {HTMLElement} gameGrid - The game grid DOM element
 * @param {HTMLElement} gameAreaParent - The parent container (usually .game-area)
 * @param {Function} onComplete - Callback fired quickly to resume game logic (not blocked by animation)
 * @param {number} placedPieceColor - The color number (1-7) of the piece that caused the clear
 */
export function playGalaxyRowClear(rowIndex, gameGrid, gameAreaParent, onComplete, placedPieceColor = null) {
    if (!gameGrid || rowIndex < 0 || rowIndex >= GRID_ROWS) {
        if (onComplete) onComplete();
        return;
    }

    const cellElements = gameGrid.querySelectorAll('.grid-cell');
    
    // Create and play clear bar animation
    createClearBar(rowIndex, gameGrid, gameAreaParent, placedPieceColor);
    const animatedBlocks = [];
    cellElements.forEach((cell, idx) => {
        const cellRow = Math.floor(idx / GRID_COLS);
        if (cellRow === rowIndex) {
            const blockWrapper = cell.querySelector('.grid-cell-block');
            if (!blockWrapper) return;
            
            const isFilled = Array.from(blockWrapper.classList).some(cls => cls.startsWith('filled-'));
            if (isFilled) {
                // Reset animation and apply it
                blockWrapper.classList.remove('ext-galaxy-block-collapse');
                void blockWrapper.offsetWidth; // Trigger reflow
                blockWrapper.classList.add('ext-galaxy-block-collapse');
                animatedBlocks.push(blockWrapper);
            }
        }
    });

    // Trigger shake after we've determined how many blocks are animating so
    // we can scale duration/intensity to match the collapse animation.
    try {
        const blockCount = animatedBlocks.length;
        // Use a short, CSS-driven shake duration (JS no longer controls removal)
        const shakeDuration = 380;
        // If many blocks clear, use a stronger shake
        const isStrong = blockCount >= 6;
        // mark container so triggerGameAreaShake picks the strong class
        const target = document.querySelector('.game-area .game-grid') || document.querySelector('.game-area .game-grid-container') || document.querySelector('.game-area');
        if (target) target.setAttribute('data-ext-shake-strong', isStrong ? '1' : '0');
        triggerGameAreaShake(shakeDuration);
    } catch (e) {
        console.warn('shake trigger failed', e);
    }

    // EARLY CALLBACK: Fire onComplete quickly to unblock game logic
    // This allows the game to continue immediately while animations run on GPU
    setTimeout(() => {
        if (onComplete) onComplete();
    }, LOGIC_DELAY_MS);

    // LATE CLEANUP: Remove filled classes and animation class after visual effects complete
    // This happens in background and doesn't block game flow
    setTimeout(() => {
        cellElements.forEach((cell, idx) => {
            const cellRow = Math.floor(idx / GRID_COLS);
            if (cellRow === rowIndex) {
                const blockWrapper = cell.querySelector('.grid-cell-block');
                if (!blockWrapper) return;
                
                // Remove animation class to stop animation
                blockWrapper.classList.remove('ext-galaxy-block-collapse');
                
                // Remove all filled-* classes from the block wrapper
                Array.from(blockWrapper.classList).forEach(cls => {
                    if (cls.startsWith('filled-')) {
                        blockWrapper.classList.remove(cls);
                    }
                });
            }
        });
    }, VISUAL_CLEANUP_DELAY_MS);
}

/**
 * Plays Galaxy Column Clear animation at specified column
 * NON-BLOCKING: onComplete fires at LOGIC_DELAY_MS (~150ms) instead of waiting for full animation
 * Visual effects (bar, particles, block collapse) continue for full VISUAL_CLEANUP_DELAY_MS (~900ms)
 * 
 * @param {number} colIndex - The column to animate
 * @param {HTMLElement} gameGrid - The game grid DOM element
 * @param {HTMLElement} gameAreaParent - The parent container
 * @param {Function} onComplete - Callback fired quickly to resume game logic (not blocked by animation)
 * @param {number} placedPieceColor - The color number (1-7) of the piece that caused the clear
 */
export function playGalaxyColClear(colIndex, gameGrid, gameAreaParent, onComplete, placedPieceColor = null) {
    if (!gameGrid || colIndex < 0 || colIndex >= GRID_COLS) {
        if (onComplete) onComplete();
        return;
    }

    const cellElements = gameGrid.querySelectorAll('.grid-cell');
    
    // Create and play clear bar animation
    createClearBarColumn(colIndex, gameGrid, gameAreaParent, placedPieceColor);

    // Animate the filled blocks directly (no copies needed)
    const animatedBlocks = [];
    cellElements.forEach((cell, idx) => {
        const cellCol = idx % GRID_COLS;
        if (cellCol === colIndex) {
            const blockWrapper = cell.querySelector('.grid-cell-block');
            if (!blockWrapper) return;
            
            const isFilled = Array.from(blockWrapper.classList).some(cls => cls.startsWith('filled-'));
            if (isFilled) {
                // Reset animation and apply it
                blockWrapper.classList.remove('ext-galaxy-block-collapse');
                void blockWrapper.offsetWidth; // Trigger reflow
                blockWrapper.classList.add('ext-galaxy-block-collapse');
                animatedBlocks.push(blockWrapper);
            }
        }
    });

    // Trigger shake after we've determined how many blocks are animating so
    // we can scale duration/intensity to match the collapse animation.
    try {
        const blockCount = animatedBlocks.length;
        const shakeDuration = 380;
        const isStrong = blockCount >= 6;
        const target = document.querySelector('.game-area .game-grid') || document.querySelector('.game-area .game-grid-container') || document.querySelector('.game-area');
        if (target) target.setAttribute('data-ext-shake-strong', isStrong ? '1' : '0');
        triggerGameAreaShake(shakeDuration);
    } catch (e) {
        console.warn('shake trigger failed', e);
    }

    // EARLY CALLBACK: Fire onComplete quickly to unblock game logic
    // This allows the game to continue immediately while animations run on GPU
    setTimeout(() => {
        if (onComplete) onComplete();
    }, LOGIC_DELAY_MS);

    // LATE CLEANUP: Remove filled classes and animation class after visual effects complete
    // This happens in background and doesn't block game flow
    setTimeout(() => {
        cellElements.forEach((cell, idx) => {
            const cellCol = idx % GRID_COLS;
            if (cellCol === colIndex) {
                const blockWrapper = cell.querySelector('.grid-cell-block');
                if (!blockWrapper) return;
                
                // Remove animation class to stop animation
                blockWrapper.classList.remove('ext-galaxy-block-collapse');
                
                // Remove all filled-* classes from the block wrapper
                Array.from(blockWrapper.classList).forEach(cls => {
                    if (cls.startsWith('filled-')) {
                        blockWrapper.classList.remove(cls);
                    }
                });
            }
        });
    }, VISUAL_CLEANUP_DELAY_MS);
}

/**
 * Creates and animates the clear bar for a row
 * @private
 */
function createClearBar(rowIndex, gameGrid, gameAreaParent, placedPieceColor = null) {
    if (!gameAreaParent || !gameGrid) return;

    const gridRect = gameGrid.getBoundingClientRect();
    const parentRect = gameAreaParent.getBoundingClientRect();
    const gridStyle = getComputedStyle(gameGrid);

    // Get exact grid parameters
    const cellSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid-cell-size')) || 40;
    const gap = parseFloat(gridStyle.gap) || 0;
    const gridPaddingLeft = parseFloat(gridStyle.paddingLeft) || 0;
    const gridPaddingTop = parseFloat(gridStyle.paddingTop) || 0;
    const gridBorderLeft = parseFloat(gridStyle.borderLeftWidth) || 0;
    const gridBorderTop = parseFloat(gridStyle.borderTopWidth) || 0;

    // Get first cell element to calculate exact position
    const cellElements = gameGrid.querySelectorAll('.grid-cell');
    if (cellElements.length === 0) return;
    
    const firstCell = cellElements[0];
    const firstCellRect = firstCell.getBoundingClientRect();
    
    // Calculate the Y position of the target row
    let targetCellIndex = rowIndex * GRID_COLS;
    if (cellElements.length > targetCellIndex) {
        const targetCell = cellElements[targetCellIndex];
        const targetCellRect = targetCell.getBoundingClientRect();
        
        const topInParent = targetCellRect.top - parentRect.top;
        const leftInParent = firstCellRect.left - parentRect.left;
        const barWidth = firstCellRect.width * GRID_COLS + gap * (GRID_COLS - 1);

        const barBorderRadius = getGridCellBorderRadius(gameGrid);

        const barContainer = document.createElement('div');
        barContainer.className = 'ext-galaxy-clear-bar-container';
        barContainer.style.position = 'absolute';
        barContainer.style.top = topInParent + 'px';
        barContainer.style.left = leftInParent + 'px';
        barContainer.style.width = barWidth + 'px';
        barContainer.style.height = firstCellRect.height + 'px';
        barContainer.style.borderRadius = barBorderRadius;

        const inner = document.createElement('div');
        inner.className = 'ext-galaxy-clear-bar-inner';
        inner.style.borderRadius = barBorderRadius;

        // Adaptive particle count based on device
        let particleCount = 30;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isLowEnd = (navigator.hardwareConcurrency || 4) <= 4;
        if (isMobile) {
            particleCount = isLowEnd ? 15 : 22;
        }

        // Extract colors from the actual grid cells being cleared
        // Pass placedPieceColor to use unified piece color if available
        const { colors, dominantColor } = extractCellColors(cellElements, rowIndex, true, placedPieceColor);
        
        // Get frame color from the piece that caused the clear, or use dominant grid color
        const frameColor = getFrameColor(placedPieceColor, dominantColor);
        
        // Apply frame color as border with strong inner glow only
        inner.style.border = `2px solid ${frameColor}`;
        inner.style.background = `radial-gradient(ellipse at center, ${frameColor}15, transparent)`;
        inner.style.boxShadow = `
            inset 0 0 40px ${frameColor}80,
            inset 0 0 30px ${frameColor}70,
            inset 0 0 20px ${frameColor}60,
            inset 0 0 10px ${frameColor}40
        `;

        for (let i = 0; i < particleCount; i++) {
            const p = document.createElement('div');
            p.className = 'ext-galaxy-particle';

            // Make particles smaller on mobile to avoid large squares inside the frame
            const baseSize = isMobile ? (4 + Math.random() * 6) : (8 + Math.random() * 12);
            const size = Math.round(baseSize);
            const color = colors[Math.floor(Math.random() * colors.length)];
            const left = Math.random() * 100;

            const dur = (isMobile ? 700 : 900) + Math.random() * (isMobile ? 400 : 600);  // slightly faster on mobile
            const delay = Math.random() * 150;

            const dxStart = (Math.random() - 0.5) * (isMobile ? 12 : 20);
            const dyStart = (Math.random() - 0.5) * (isMobile ? 6 : 10);

            const direction = Math.random() > 0.5 ? 1 : -1;
            const dxEnd = direction * ((isMobile ? 30 : 50) + Math.random() * (isMobile ? 40 : 80));
            const dyEnd = (Math.random() - 0.5) * (isMobile ? 18 : 30);

            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.backgroundColor = color;
            p.style.color = color;
            p.style.left = left + '%';
            p.style.top = '50%';
            p.style.marginTop = (-size / 2) + 'px';
            p.style.borderRadius = Math.max(2, Math.round(size * 0.25)) + 'px';

            p.style.animationDuration = dur + 'ms';
            p.style.animationDelay = delay + 'ms';

            p.style.setProperty('--ext-dx-start', dxStart + 'px');
            p.style.setProperty('--ext-dy-start', dyStart + 'px');
            p.style.setProperty('--ext-dx-end', dxEnd + 'px');
            p.style.setProperty('--ext-dy-end', dyEnd + 'px');

            inner.appendChild(p);
        }

        barContainer.appendChild(inner);
        gameAreaParent.appendChild(barContainer);

        // Clean up after animation
        setTimeout(() => {
            if (barContainer.parentNode) {
                barContainer.remove();
            }
        }, 1500);
    }
}

/**
 * Creates and animates the clear bar for a column (vertical variant)
 * @private
 */
function createClearBarColumn(colIndex, gameGrid, gameAreaParent, placedPieceColor = null) {
    if (!gameAreaParent || !gameGrid) return;

    const gameAreaRect = gameAreaParent.getBoundingClientRect();
    const gridStyle = getComputedStyle(gameGrid);
    
    // Get cell elements
    const cellElements = gameGrid.querySelectorAll('.grid-cell');
    if (cellElements.length === 0) return;

    // Get the first cell and target cell to calculate positions
    const firstCell = cellElements[0];
    const firstCellRect = firstCell.getBoundingClientRect();
    
    // Calculate the X position of the target column
    let targetCellIndex = colIndex;
    if (cellElements.length > targetCellIndex) {
        const targetCell = cellElements[targetCellIndex];
        const targetCellRect = targetCell.getBoundingClientRect();
        
        // Calculate height (all rows)
        const lastCell = cellElements[cellElements.length - 1];
        const lastCellRect = lastCell.getBoundingClientRect();
        const gap = parseFloat(gridStyle.gap) || 0;
        const barHeight = (lastCellRect.bottom - firstCellRect.top) + gap;

        const leftInParent = targetCellRect.left - gameAreaRect.left;
        const topInParent = firstCellRect.top - gameAreaRect.top;

        const barBorderRadius = getGridCellBorderRadius(gameGrid);

        const barContainer = document.createElement('div');
        barContainer.className = 'ext-galaxy-clear-bar-container';
        barContainer.style.position = 'absolute';
        barContainer.style.left = leftInParent + 'px';
        barContainer.style.top = topInParent + 'px';
        barContainer.style.width = firstCellRect.width + 'px';
        barContainer.style.height = barHeight + 'px';
        barContainer.style.borderRadius = barBorderRadius;

        const inner = document.createElement('div');
        inner.className = 'ext-galaxy-clear-bar-inner';
        inner.style.width = '100%';
        inner.style.height = '100%';
        inner.style.borderRadius = barBorderRadius;

        // Adaptive particle count based on device
        let particleCount = 30;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isLowEnd = (navigator.hardwareConcurrency || 4) <= 4;
        if (isMobile) {
            particleCount = isLowEnd ? 15 : 22;
        }

        // Extract colors from the actual grid cells being cleared
        // Pass placedPieceColor to use unified piece color if available
        const { colors, dominantColor } = extractCellColors(cellElements, colIndex, false, placedPieceColor);
        
        // Get frame color from the piece that caused the clear, or use dominant grid color
        const frameColor = getFrameColor(placedPieceColor, dominantColor);
        
        // Apply frame color as border with strong inner glow
        inner.style.border = `2px solid ${frameColor}`;
        inner.style.background = `radial-gradient(ellipse at center, ${frameColor}15, transparent)`;
        inner.style.boxShadow = `
            inset 0 0 40px ${frameColor}80,
            inset 0 0 30px ${frameColor}70,
            inset 0 0 20px ${frameColor}60,
            inset 0 0 10px ${frameColor}40
        `;

        for (let i = 0; i < particleCount; i++) {
            const p = document.createElement('div');
            p.className = 'ext-galaxy-particle';

            const baseSize = isMobile ? (4 + Math.random() * 6) : (8 + Math.random() * 12);
            const size = Math.round(baseSize);
            const color = colors[Math.floor(Math.random() * colors.length)];
            const top = Math.random() * 100;

            const dur = (isMobile ? 700 : 900) + Math.random() * (isMobile ? 400 : 600);
            const delay = Math.random() * 150;

            const dxStart = (Math.random() - 0.5) * (isMobile ? 8 : 10);
            const dyStart = (Math.random() - 0.5) * (isMobile ? 12 : 20);

            const direction = Math.random() > 0.5 ? 1 : -1;
            const dxEnd = (Math.random() - 0.5) * (isMobile ? 18 : 30);
            const dyEnd = direction * ((isMobile ? 30 : 50) + Math.random() * (isMobile ? 40 : 80));

            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.backgroundColor = color;
            p.style.color = color;
            p.style.left = '50%';
            p.style.marginLeft = (-size / 2) + 'px';
            p.style.top = top + '%';
            p.style.borderRadius = Math.max(2, Math.round(size * 0.25)) + 'px';

            p.style.animationDuration = dur + 'ms';
            p.style.animationDelay = delay + 'ms';

            p.style.setProperty('--ext-dx-start', dxStart + 'px');
            p.style.setProperty('--ext-dy-start', dyStart + 'px');
            p.style.setProperty('--ext-dx-end', dxEnd + 'px');
            p.style.setProperty('--ext-dy-end', dyEnd + 'px');

            inner.appendChild(p);
        }

        barContainer.appendChild(inner);
        gameAreaParent.appendChild(barContainer);

        setTimeout(() => {
            if (barContainer.parentNode) {
                barContainer.remove();
            }
        }, 1500);
    }
}
