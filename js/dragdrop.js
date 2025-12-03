/* dragdrop.js - Mobile-optimized drag & drop for block puzzle game
   Performance optimizations:
   - RAF-based drag loop (60fps smooth motion)
   - Math-based hit-testing (no elementFromPoint per frame)
   - Cached grid metrics
   - Tracked highlight cells (no DOM queries to clear)
   - Lightweight onPointerMove (only updates state)
   - GPU-friendly translate3d transforms
   - Separate rotation handling
*/

(function () {
  const GRID_ID = 'gameGrid';
  const CLONE_ID = 'draggedPieceClone';
  const PIECE_SELECTOR = '.piece';
  const CELL_SELECTOR = '.grid-cell';
  const HIGHLIGHT_CLASS = 'dd-highlight';
  const INVALID_CLASS = 'dd-invalid';
  const OCCUPIED_CLASS = 'occupied';
  const DRAGGING_CLASS = 'dd-dragging';

  // Grid state
  let grid = null;
  let gridCols = 0;
  let gridRows = 0;
  let gridCells = [];
  let cloneEl = null;

  // Current drag state
  let dragging = null;
  let currentTargetCells = null;

  // RAF-based drag loop state
  let dragPointerId = null;
  let dragLastX = 0;
  let dragLastY = 0;
  let dragRafId = null;
  let dragGridRect = null;
  let dragCellSize = 0;
  let lastHoverRow = null;
  let lastHoverCol = null;
  let highlightedCells = [];

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    grid = document.getElementById(GRID_ID);
    if (!grid) {
      console.warn('DragDrop: #gameGrid not found');
      return;
    }
    cloneEl = document.getElementById(CLONE_ID);
    if (!cloneEl) {
      console.warn('DragDrop: #draggedPieceClone not found, creating one');
      cloneEl = createCloneContainer();
    }
    annotateGridCells();
    attachPieceListeners();
    window.addEventListener('keydown', (e) => {
      if (!dragging) return;
      if (e.key.toLowerCase() === 'r') {
        rotateDraggingPiece();
      }
    });
  }

  function createCloneContainer() {
    const c = document.createElement('div');
    c.id = CLONE_ID;
    document.body.appendChild(c);
    return c;
  }

  function annotateGridCells() {
    const styles = getComputedStyle(grid);
    const cols = styles.gridTemplateColumns ? styles.gridTemplateColumns.split(' ').length : 0;
    gridCols = cols || Math.max(1, Math.round(Math.sqrt(grid.children.length)));
    gridCells = Array.from(grid.querySelectorAll(CELL_SELECTOR));
    gridCells.forEach((cell, i) => {
      const row = Math.floor(i / gridCols);
      const col = i % gridCols;
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
    });
    gridRows = Math.ceil(gridCells.length / gridCols);
  }

  function attachPieceListeners() {
    const piecesContainer = document.getElementById('piecesContainer');
    if (!piecesContainer) {
      console.warn('DragDrop: #piecesContainer not found');
      return;
    }
    
    const pieces = piecesContainer.querySelectorAll(PIECE_SELECTOR);
    pieces.forEach(piece => {
      piece.style.touchAction = 'none';
      piece.addEventListener('pointerdown', onPiecePointerDown);
      piece.addEventListener('dblclick', (e) => {
        e.preventDefault();
        rotatePieceElement(piece);
      });
    });
  }

  function onPiecePointerDown(e) {
    if (e.button && e.button !== 0) return;
    const pieceEl = e.currentTarget;
    e.preventDefault();
    pieceEl.setPointerCapture(e.pointerId);

    const shape = parsePoints(pieceEl.dataset.points || pieceEl.dataset.shape || '');
    let finalShape = shape;
    if (!shape.length) {
      const fallback = shapeFromElement(pieceEl);
      if (fallback.length) {
        finalShape = fallback;
      } else {
        console.warn('DragDrop: piece has no `data-points` and fallback failed', pieceEl);
        return;
      }
    }

    // Prepare drag state
    dragging = prepareDragging(pieceEl, finalShape, e);
    dragPointerId = e.pointerId;
    dragLastX = e.clientX;
    dragLastY = e.clientY;

    // Cache grid metrics ONCE for this drag
    dragGridRect = grid.getBoundingClientRect();
    dragCellSize = dragGridRect.width / gridCols;
    lastHoverRow = null;
    lastHoverCol = null;
    highlightedCells = [];

    // Add dragging state to body to disable transitions
    document.body.classList.add('dragging');

    // Start RAF-based drag loop
    dragRafId = requestAnimationFrame(dragFrame);

    // Attach pointer listeners
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', onPointerUp, { once: true });
    document.addEventListener('pointercancel', onPointerCancel, { once: true });
  }

  function prepareDragging(pieceEl, shape, pointerEvent) {
    const rect = pieceEl.getBoundingClientRect();
    const offsetX = pointerEvent.clientX - rect.left;
    const offsetY = pointerEvent.clientY - rect.top;

    cloneEl.innerHTML = '';
    cloneEl.className = '';
    const clone = pieceEl.cloneNode(true);
    clone.removeAttribute('id');
    clone.style.pointerEvents = 'none';
    cloneEl.appendChild(clone);
    cloneEl.classList.add(DRAGGING_CLASS);
    cloneEl.style.position = 'fixed';
    cloneEl.style.left = '0px';
    cloneEl.style.top = '0px';
    cloneEl.style.zIndex = 9999;
    cloneEl.style.display = 'block';
    cloneEl.style.transform = `translate3d(${pointerEvent.clientX - offsetX}px, ${pointerEvent.clientY - offsetY}px, 0)`;

    return {
      pieceEl,
      clone,
      shape: shape.map(p => ({ x: p.x, y: p.y })),
      offset: { x: offsetX, y: offsetY },
      rotation: 0
    };
  }

  // Light onPointerMove: only update drag state, no DOM
  function onPointerMove(e) {
    if (!dragging || e.pointerId !== dragPointerId) return;
    if (e.cancelable) {
      e.preventDefault();
    }
    dragLastX = e.clientX;
    dragLastY = e.clientY;

    // DRAG LATENCY FIX: Update clone position directly inside pointermove (no RAF delay)
    const instantX = dragLastX - dragging.offset.x;
    const instantY = dragLastY - dragging.offset.y;
    cloneEl.style.transform = `translate3d(${instantX}px, ${instantY}px, 0)`;
  }

  // RAF-based drag loop: smooth 60fps motion + smart highlight updates
  function dragFrame() {
    if (!dragging) {
      dragRafId = null;
      return;
    }

    // DRAG LATENCY FIX: clone transform already updated in onPointerMove

    // Math-based hit-testing: convert pointer to grid coordinates
    const localX = dragLastX - dragGridRect.left;
    const localY = dragLastY - dragGridRect.top;

    // Check bounds
    if (localX < 0 || localY < 0 || localX >= dragGridRect.width || localY >= dragGridRect.height) {
      clearHighlights();
      currentTargetCells = null;
      lastHoverRow = null;
      lastHoverCol = null;
      dragRafId = requestAnimationFrame(dragFrame);
      return;
    }

    // Calculate grid cell indices
    const col = Math.floor(localX / dragCellSize);
    const row = Math.floor(localY / dragCellSize);

    // Only recalculate if hover cell changed
    if (row === lastHoverRow && col === lastHoverCol) {
      dragRafId = requestAnimationFrame(dragFrame);
      return;
    }

    lastHoverRow = row;
    lastHoverCol = col;

    // Compute target cells
    const pts = transformedShape(dragging.shape, dragging.rotation);
    const targetCells = [];
    let valid = true;

    for (const pt of pts) {
      const r = row + pt.y;
      const c = col + pt.x;

      if (r < 0 || c < 0 || r >= gridRows || c >= gridCols) {
        valid = false;
        break;
      }

      const idx = r * gridCols + c;
      const target = gridCells[idx];
      if (!target) {
        valid = false;
        break;
      }

      if (target.classList.contains(OCCUPIED_CLASS)) {
        valid = false;
        break;
      }

      targetCells.push(target);
    }

    updateHighlights(targetCells, valid);
    currentTargetCells = valid ? targetCells : null;

    dragRafId = requestAnimationFrame(dragFrame);
  }

  function onPointerUp(e) {
    if (e.pointerId !== dragPointerId) return;
    if (currentTargetCells && dragging) {
      placePiece(dragging, currentTargetCells);
      if (dragging.pieceEl && dragging.pieceEl.parentElement) {
        dragging.pieceEl.parentElement.removeChild(dragging.pieceEl);
      }
    }
    cleanupDrag();
  }

  function onPointerCancel(e) {
    if (e.pointerId !== dragPointerId) return;
    cleanupDrag();
  }

  function cleanupDrag() {
    if (dragging && dragging.pieceEl) {
      try {
        if (dragging.pieceEl.releasePointerCapture) {
          dragging.pieceEl.releasePointerCapture(dragPointerId);
        }
      } catch (err) {
        // ignore
      }
    }

    if (dragRafId !== null) {
      cancelAnimationFrame(dragRafId);
      dragRafId = null;
    }

    clearHighlights();
    cloneEl.style.display = 'none';
    cloneEl.innerHTML = '';
    cloneEl.className = '';

    dragging = null;
    currentTargetCells = null;
    dragPointerId = null;
    dragLastX = 0;
    dragLastY = 0;
    dragGridRect = null;
    dragCellSize = 0;
    lastHoverRow = null;
    lastHoverCol = null;

    document.removeEventListener('pointermove', onPointerMove);
    document.body.classList.remove('dragging');
  }

  function placePiece(dragInfo, cells) {
    cells.forEach((cell) => {
      const block = document.createElement('div');
      block.className = 'placed-block';
      const sample = dragInfo.pieceEl.querySelector('.block, .cell');
      if (sample) {
        const s = getComputedStyle(sample);
        block.style.background = s.backgroundColor || s.background || '';
      }
      cell.appendChild(block);
      cell.classList.add(OCCUPIED_CLASS);
    });
    const ev = new CustomEvent('piecePlaced', { detail: { cells } });
    grid.dispatchEvent(ev);
  }

  function updateHighlights(cells, valid) {
    clearHighlights();
    if (!cells || !cells.length) return;

    cells.forEach(c => c.classList.add(HIGHLIGHT_CLASS));
    if (!valid) {
      cells.forEach(c => c.classList.add(INVALID_CLASS));
    }
    highlightedCells = cells.slice();
  }

  function clearHighlights() {
    highlightedCells.forEach(c => c.classList.remove(HIGHLIGHT_CLASS, INVALID_CLASS));
    highlightedCells = [];
  }

  function parsePoints(str) {
    if (!str) return [];
    str = str.trim();
    if (str.startsWith('[')) {
      try {
        const arr = JSON.parse(str);
        return arr.map(([x, y]) => ({ x: Number(x), y: Number(y) }));
      } catch (err) {
        return [];
      }
    }
    return str.split(';').map(s => {
      const [x, y] = s.split(',').map(t => t && t.trim());
      return { x: Number(x || 0), y: Number(y || 0) };
    }).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  }

  function shapeFromElement(el) {
    const children = Array.from(el.children);
    if (!children.length) return [];
    const originRect = el.getBoundingClientRect();
    const pts = children.map(ch => {
      const rc = ch.getBoundingClientRect();
      const x = Math.round((rc.left - originRect.left) / (rc.width || 1));
      const y = Math.round((rc.top - originRect.top) / (rc.height || 1));
      return { x, y };
    });
    const minX = Math.min(...pts.map(p => p.x));
    const minY = Math.min(...pts.map(p => p.y));
    return pts.map(p => ({ x: p.x - minX, y: p.y - minY }));
  }

  function transformedShape(shape, rotationDeg) {
    const r = ((rotationDeg % 360) + 360) % 360;
    if (r === 0) return shape;
    if (r === 90) return shape.map(p => ({ x: p.y, y: -p.x }));
    if (r === 180) return shape.map(p => ({ x: -p.x, y: -p.y }));
    if (r === 270) return shape.map(p => ({ x: -p.y, y: p.x }));
    return shape;
  }

  function rotateDraggingPiece() {
    if (!dragging) return;
    dragging.rotation = (dragging.rotation + 90) % 360;
    if (dragging.clone) {
      dragging.clone.style.transform = `rotate(${dragging.rotation}deg)`;
    }
  }

  function rotatePieceElement(pieceEl) {
    const raw = pieceEl.dataset.points || pieceEl.dataset.shape;
    const points = parsePoints(raw);
    const rotated = points.map(p => ({ x: p.y, y: -p.x }));
    const minX = Math.min(...rotated.map(p => p.x));
    const minY = Math.min(...rotated.map(p => p.y));
    const normalized = rotated.map(p => `${p.x - minX},${p.y - minY}`).join(';');
    pieceEl.dataset.points = normalized;
  }

})();
