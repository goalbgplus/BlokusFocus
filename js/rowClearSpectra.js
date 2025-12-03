// Row clear animation - Galaxy Row Clear integration with grid isolation

import { playGalaxyRowClear, playGalaxyColClear } from './animationAdapters/galaxyRowClear.js';

const LINE_DELAY = 110;          // ms between lines when not sync
const OVERLAY_HOST_ID = 'rowClearOverlay';
let overlayHostElement = null;

function ensureOverlayHost(host = document.querySelector('.game-area') || document.body) {
  if (!host) return null;
  if (!overlayHostElement) {
    overlayHostElement = document.getElementById(OVERLAY_HOST_ID) || document.createElement('div');
    overlayHostElement.id = OVERLAY_HOST_ID;
    overlayHostElement.setAttribute('aria-hidden', 'true');
  }
  if (overlayHostElement.parentElement !== host) {
    host.appendChild(overlayHostElement);
  }
  return overlayHostElement;
}

function alignOverlayHost(gridRect, host) {
  const overlay = ensureOverlayHost(host);
  if (!overlay || !gridRect || !host) return overlay;
  const hostRect = host.getBoundingClientRect();
  overlay.style.position = 'absolute';
  overlay.style.left = `${gridRect.left - hostRect.left}px`;
  overlay.style.top = `${gridRect.top - hostRect.top}px`;
  overlay.style.width = `${gridRect.width}px`;
  overlay.style.height = `${gridRect.height}px`;
  return overlay;
}

export function animateRowClearSpectra({
  ctx,
  rows,
  blockSize,
  boardSize,
  getCellColor,   // (r,c)=>color (unused for animation core but kept for API compat)
  renderBase,     // () => redraw board below canvas; kept to avoid regressions
  onLogicalClear, // (rowIndex)=>void
  onDone          // ()=>void
}) {
  if (!rows || !rows.length) { onDone && onDone(); return; }

  // Align canvas to grid at 1x to reduce pixel cost
  const canvas = ctx?.canvas;
  const gameGrid = document.getElementById('gameGrid');
  const metrics = computeGridMetrics(gameGrid, canvas);

  // Build per-line data once (DOM lookups once, no per-frame layout)
  const totalCols = boardSize;
  const lines = rows.map((rowIndex, order) => buildRowData({
    rowIndex,
    order,
    boardSize: totalCols,
    metrics,
    gameGrid
  }));

  const tasks = lines.map(line => new Promise(resolve => {
    setTimeout(() => runRowAnimation({
      line,
      metrics,
      onLogicalClear,
      onResolved: resolve
    }), line.delay);
  }));

  Promise.all(tasks).then(() => {
    onDone && onDone();
  });
}

// Combined lightweight line clear for rows and columns to match existing integration
export function animateLineClearSpectra({
  ctx,
  rows = [],
  cols = [],
  boardSize,
  onClearRow,
  onClearCol,
  onDone,
  syncStart = false,
  placedPieceColor = null
}) {
  const canvas = ctx?.canvas;
  const gameGrid = document.getElementById('gameGrid');
  const metrics = computeGridMetrics(gameGrid, canvas);

  const tasks = [];

  // Rows
  rows.forEach((rowIndex, order) => {
    const line = buildRowData({ rowIndex, order: syncStart ? 0 : order, boardSize, metrics, gameGrid });
    tasks.push(new Promise(resolve => {
      setTimeout(() => runRowAnimation({
        line,
        metrics,
        onLogicalClear: (r) => onClearRow && onClearRow(r),
        onResolved: resolve,
        placedPieceColor
      }), line.delay);
    }));
  });

  // Columns
  cols.forEach((colIndex, order) => {
    const line = buildColData({ colIndex, order: syncStart ? 0 : (rows.length + order), boardSize, metrics, gameGrid });
    tasks.push(new Promise(resolve => {
      setTimeout(() => runColAnimation({
        line,
        metrics,
        onLogicalClear: (c) => onClearCol && onClearCol(c),
        onResolved: resolve,
        placedPieceColor
      }), line.delay);
    }));
  });

  if (!tasks.length) { onDone && onDone(); return; }

  Promise.all(tasks).then(() => {
    onDone && onDone();
  });
}

function buildColData({ colIndex, order, boardSize, metrics, gameGrid }) {
  const cells = [];
  if (metrics && gameGrid) {
    const totalRows = Math.floor(gameGrid.children.length / boardSize) || boardSize;
    for (let r = 0; r < totalRows; r++) {
      const element = gameGrid.children[r * boardSize + colIndex];
      if (!element) continue;
      
      // Only include filled cells (blocks) that will be cleared
      const isFilled = Array.from(element.classList).some(cls => cls.startsWith('filled-'));
      if (!isFilled) continue;
      
      const { x, y } = cellCenter(r, colIndex, metrics);
      const overlay = createCellOverlay(element);
      cells.push({ element, centerX: x, centerY: y, overlay });
    }
  }
  return {
    colIndex,
    cells,
    delay: order * LINE_DELAY,
    cleared: false
  };
}

function runColAnimation({ line, metrics, particleEngine, onLogicalClear, onResolved, placedPieceColor }) {
  // Play Galaxy Column Clear animation
  const gameGrid = document.getElementById('gameGrid');
  const gameArea = document.querySelector('.game-area');
  
  playGalaxyColClear(line.colIndex, gameGrid, gameArea, () => {
    // Perform logical clear AFTER animation
    if (!line.cleared) {
      onLogicalClear && onLogicalClear(line.colIndex);
      line.cleared = true;
    }
    cleanupLineOverlays(line);
    onResolved();
  }, placedPieceColor);
}

function runRowAnimation({ line, metrics, particleEngine, onLogicalClear, onResolved, placedPieceColor }) {
  // Play Galaxy Row Clear animation
  const gameGrid = document.getElementById('gameGrid');
  const gameArea = document.querySelector('.game-area');
  
  playGalaxyRowClear(line.rowIndex, gameGrid, gameArea, () => {
    // Perform logical clear AFTER animation
    if (!line.cleared) {
      onLogicalClear && onLogicalClear(line.rowIndex);
      line.cleared = true;
    }
    cleanupLineOverlays(line);
    onResolved();
  }, placedPieceColor);
}

function buildRowData({ rowIndex, order, boardSize, metrics, gameGrid }) {
  const cells = [];
  if (gameGrid) {
    for (let c = 0; c < boardSize; c++) {
      const element = gameGrid.children[rowIndex * boardSize + c];
      if (!element) continue;
      
      // Only include filled cells (blocks) that will be cleared
      const isFilled = Array.from(element.classList).some(cls => cls.startsWith('filled-'));
      if (!isFilled) continue;
      
      if (metrics) {
        const { x, y } = cellCenter(rowIndex, c, metrics);
        const overlay = createCellOverlay(element);
        cells.push({ element, centerX: x, centerY: y, overlay });
      } else {
        cells.push({ element, centerX: 0, centerY: 0, overlay: null });
      }
    }
  }
  return {
    rowIndex,
    cells,
    delay: order * LINE_DELAY,
    cleared: false
  };
}

function computeGridMetrics(gameGrid, canvas) {
  if (!gameGrid || !canvas) return null;
  const gridRect = gameGrid.getBoundingClientRect();
  const host = canvas.offsetParent || document.querySelector('.game-area') || document.body;
  const hostRect = host.getBoundingClientRect();
  const style = getComputedStyle(gameGrid);

  const padLeft = parseFloat(style.paddingLeft) || 0;
  const padRight = parseFloat(style.paddingRight) || 0;
  const padTop = parseFloat(style.paddingTop) || 0;
  const padBottom = parseFloat(style.paddingBottom) || 0;
  const gap = parseFloat(style.getPropertyValue('--grid-gap')) || parseFloat(style.gap) || 0;

  // Align canvas in CSS pixels (no DPR scaling)
  canvas.style.position = 'absolute';
  canvas.style.left = `${gridRect.left - hostRect.left}px`;
  canvas.style.top = `${gridRect.top - hostRect.top}px`;
  canvas.style.width = `${gridRect.width}px`;
  canvas.style.height = `${gridRect.height}px`;
  canvas.width = Math.round(gridRect.width);
  canvas.height = Math.round(gridRect.height);
  canvas.getContext('2d')?.setTransform(1, 0, 0, 1, 0, 0);

  alignOverlayHost(gridRect, host);

  return {
    padLeft, padRight, padTop, padBottom,
    colGap: gap, rowGap: gap,
    canvasWidth: Math.round(gridRect.width),
    canvasHeight: Math.round(gridRect.height)
  };
}

function cellCenter(row, col, metrics) {
  const width = metrics.canvasWidth - metrics.padLeft - metrics.padRight;
  const height = metrics.canvasHeight - metrics.padTop - metrics.padBottom;
  const gameGrid = document.getElementById('gameGrid');
  const cols = gameGrid ? (getComputedStyle(gameGrid).gridTemplateColumns.split(' ').length) : 10;
  const rows = gameGrid ? (getComputedStyle(gameGrid).gridTemplateRows.split(' ').length) : 10;
  const cellW = cols ? (width - metrics.colGap * (cols - 1)) / cols : 0;
  const cellH = rows ? (height - metrics.rowGap * (rows - 1)) / rows : 0;
  const x = metrics.padLeft + col * (cellW + metrics.colGap) + cellW / 2;
  const y = metrics.padTop + row * (cellH + metrics.rowGap) + cellH / 2;
  return { x, y };
}

function createCellOverlay(element) {
  if (!element) return null;
  
  const host = overlayHostElement?.parentElement || document.querySelector('.game-area') || document.body;
  const grid = document.getElementById('gameGrid');
  const gridRect = grid?.getBoundingClientRect() || null;
  alignOverlayHost(gridRect, host);
  const overlayHost = overlayHostElement || ensureOverlayHost(host);
  if (!overlayHost) return null;
  
  const hostRect = overlayHost.getBoundingClientRect();
  if (!hostRect.width || !hostRect.height) return null;
  
  // Batch getComputedStyle() call - vetëm një herë
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  
  // Lexo të gjitha ngjyrat në një pass
  const colorDark1 = style.getPropertyValue('--color-dark-1') || '#14b8a6';
  const colorDark2 = style.getPropertyValue('--color-dark-2') || '#0f766e';
  const colorCoreLight = style.getPropertyValue('--color-core-light') || 'rgba(173, 255, 219, 0.8)';
  const colorCoreMid = style.getPropertyValue('--color-core-mid') || 'rgba(81, 238, 176, 0.5)';
  const colorBevelLight = style.getPropertyValue('--color-bevel-light') || 'rgba(255,255,255,0.2)';
  const colorBevelDark = style.getPropertyValue('--color-bevel-dark') || 'rgba(0,0,0,0.4)';
  const borderRadius = style.borderRadius || '25%';
  
  // Krijo overlay
  const overlay = document.createElement('div');
  overlay.className = 'cell-clear-overlay';
  
  // Poziciono dhe vendos madhësinë
  overlay.style.left = `${rect.left - hostRect.left}px`;
  overlay.style.top = `${rect.top - hostRect.top}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  overlay.style.borderRadius = borderRadius;
  
  // Vendos të gjitha CSS variablat në një batch
  overlay.style.setProperty('--color-dark-1', colorDark1);
  overlay.style.setProperty('--color-dark-2', colorDark2);
  overlay.style.setProperty('--color-core-light', colorCoreLight);
  overlay.style.setProperty('--color-core-mid', colorCoreMid);
  overlay.style.setProperty('--color-bevel-light', colorBevelLight);
  overlay.style.setProperty('--color-bevel-dark', colorBevelDark);
  overlay.style.setProperty('--overlay-color', colorDark1);
  overlay.style.setProperty('--row-clear-color', colorDark1);
  
  // Vendos background gradient
  overlay.style.background = `linear-gradient(135deg, ${colorDark1}, ${colorDark2})`;
  
  overlayHost.appendChild(overlay);
  return overlay;
}

function cleanupLineOverlays(line) {
  if (!line || !line.cells) return;
  line.cells.forEach(cell => {
    // Rikthe opacity-n e blloqeve origjinale
    if (cell && cell.element) {
      cell.element.style.opacity = '';
    }
    // Fshi overlay-t
    if (cell && cell.overlay) {
      cell.overlay.remove();
      cell.overlay = null;
    }
  });
  cleanupOverlayHostIfEmpty();
}

function cleanupOverlayHostIfEmpty() {
  if (!overlayHostElement) return;
  if (overlayHostElement.childElementCount > 0) return;
  const parent = overlayHostElement.parentElement;
  overlayHostElement.remove();
  overlayHostElement = null;
  if (parent && parent.hasChildNodes()) return;
}


