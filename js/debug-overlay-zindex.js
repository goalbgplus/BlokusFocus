// DEBUG: Log all elements at pointer position and their z-index
window.addEventListener('click', function(e) {
    const x = e.clientX;
    const y = e.clientY;
    const elements = document.elementsFromPoint(x, y);
    elements.forEach(el => {
        const z = window.getComputedStyle(el).zIndex;
    });
});

// DEBUG: Log z-index and pointer-events for all direct children of body
window.addEventListener('DOMContentLoaded', () => {
    Array.from(document.body.children).forEach(el => {
        const z = window.getComputedStyle(el).zIndex;
        const pe = window.getComputedStyle(el).pointerEvents;
    });
});
