// Landing-custom.js - migrated behavior from user's provided HTML
document.addEventListener('DOMContentLoaded', function() {
    const starsContainer = document.getElementById('stars');
    if (starsContainer) {
        for (let i = 0; i < 150; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            const top = Math.random() * 100; const left = Math.random() * 100;
            star.style.top = `${top}%`; star.style.left = `${left}%`;
            const size = Math.random() * 2 + 1;
            star.style.width = `${size}px`; star.style.height = `${size}px`;
            star.style.animationDelay = `${Math.random() * 4}s`;
            starsContainer.appendChild(star);
        }
    }

    function animatePieceShowcase() {
        const step = 33.3;
        const classicShowcase = document.querySelector('[data-mode="classic"] .piece-showcase');
        const collectionShowcase = document.querySelector('[data-mode="collection"] .piece-showcase');
        if (!classicShowcase || !collectionShowcase) return;
        const classicBlocks = classicShowcase.querySelectorAll('.block');
        const collectionBlocks = collectionShowcase.querySelectorAll('.block');
        const colorPalettes = [
            { dark1: '#2a7dcc', dark2: '#164d85', coreLight: 'rgba(168, 208, 255, 0.8)', coreMid: 'rgba(94, 174, 255, 0.5)', bevelLight: 'rgba(255, 255, 255, 0.2)', bevelDark: 'rgba(15, 52, 92, 0.4)', highlight: 'rgba(255, 235, 225, 0.5)' },
            { dark1: '#d64e1f', dark2: '#a3320f', coreLight: 'rgba(255, 187, 166, 0.8)', coreMid: 'rgba(255, 137, 98, 0.5)', bevelLight: 'rgba(255, 255, 255, 0.2)', bevelDark: 'rgba(80, 24, 0, 0.4)', highlight: 'rgba(230, 240, 255, 0.5)' },
            { dark1: '#34c759', dark2: '#1d8a3c', coreLight: 'rgba(170, 255, 195, 0.8)', coreMid: 'rgba(117, 255, 150, 0.5)', bevelLight: 'rgba(255, 255, 255, 0.2)', bevelDark: 'rgba(0, 74, 15, 0.4)', highlight: 'rgba(255, 255, 230, 0.5)' },
            { dark1: '#705ce1', dark2: '#4d38ba', coreLight: 'rgba(213, 204, 255, 0.8)', coreMid: 'rgba(175, 159, 255, 0.5)', bevelLight: 'rgba(255, 255, 255, 0.2)', bevelDark: 'rgba(38, 23, 105, 0.4)', highlight: 'rgba(230, 255, 235, 0.5)' },
            { dark1: '#cd5498', dark2: '#9e3670', coreLight: 'rgba(250, 187, 218, 0.8)', coreMid: 'rgba(246, 137, 195, 0.5)', bevelLight: 'rgba(255, 255, 255, 0.2)', bevelDark: 'rgba(77, 21, 52, 0.4)', highlight: 'rgba(230, 255, 235, 0.5)' },
            { dark1: '#d4c22b', dark2: '#a0920c', coreLight: 'rgba(255, 255, 171, 0.8)', coreMid: 'rgba(255, 255, 122, 0.5)', bevelLight: 'rgba(255, 255, 255, 0.2)', bevelDark: 'rgba(77, 69, 0, 0.4)', highlight: 'rgba(235, 230, 255, 0.5)' }
        ];
        const classicShapes = [
            { name: 'cross', coords: [ {t:0,l:step}, {t:step,l:0}, {t:step,l:step}, {t:step,l:step*2}, {t:step*2,l:step} ], colorIndex: 0 },
            { name: 'ushape', coords: [ {t:0,l:0}, {t:step,l:0}, {t:step,l:step}, {t:step,l:step*2}, {t:0,l:step*2} ], colorIndex: 1 },
            { name: 'fshape_new', coords: [ {t:step, l:0}, {t:0, l:step}, {t:step, l:step}, {t:step*2, l:step}, {t:step, l:step*2} ], colorIndex: 2 }
        ];
        const collectionShapes = [
            { name: 'lshape', coords: [ {t:0,l:0}, {t:step,l:0}, {t:step*2,l:0}, {t:step*2,l:step} ], colorIndex: 3 },
            { name: 'square', coords: [ {t:0,l:0}, {t:0,l:step}, {t:step,l:0}, {t:step,l:step} ], colorIndex: 4 },
            { name: 'tshape', coords: [ {t:0,l:step}, {t:step,l:0}, {t:step,l:step}, {t:step,l:step*2} ], colorIndex: 5 }
        ];
        let classicIndex = 0; let collectionIndex = 0;
        const applyShape = (blocks, shape) => {
            const colorTheme = colorPalettes[shape.colorIndex];
            const gatherPoint = { t: step, l: step };
            blocks.forEach((block, i) => {
                block.style.transitionDelay = `${i * 30}ms`;
                if (block.style.opacity !== '0') {
                   block.style.top = `${gatherPoint.t}%`;
                   block.style.left = `${gatherPoint.l}%`;
                }
            });
            setTimeout(() => {
                blocks.forEach((block, i) => {
                    block.style.transitionDelay = `${i * 60}ms`;
                    block.style.setProperty('--color-dark-1', colorTheme.dark1);
                    block.style.setProperty('--color-dark-2', colorTheme.dark2);
                    block.style.setProperty('--color-core-light', colorTheme.coreLight);
                    block.style.setProperty('--color-core-mid', colorTheme.coreMid);
                    block.style.setProperty('--color-bevel-light', colorTheme.bevelLight);
                    block.style.setProperty('--color-bevel-dark', colorTheme.bevelDark);
                    block.style.setProperty('--color-highlight', colorTheme.highlight);
                    if (shape.coords[i]) {
                        block.style.opacity = '1';
                        block.style.top = `${shape.coords[i].t}%`;
                        block.style.left = `${shape.coords[i].l}%`;
                    } else { block.style.opacity = '0'; }
                });
            }, 750);
        };
        applyShape(classicBlocks, classicShapes[0]);
        applyShape(collectionBlocks, collectionShapes[0]);
        setInterval(() => { classicIndex = (classicIndex + 1) % classicShapes.length; applyShape(classicBlocks, classicShapes[classicIndex]); }, 2500);
        setInterval(() => { collectionIndex = (collectionIndex + 1) % collectionShapes.length; applyShape(collectionBlocks, collectionShapes[collectionIndex]); }, 2500);
    }
    animatePieceShowcase();

    function showModal(type, content) {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        let modalHTML = '';
        if (type === 'tutorial') {
            modalHTML = `\n                        <div class="modal-content">\n                            <h2>How to Play</h2>\n                            <div class="tutorial-container">\n                                <div class="tutorial-score" id="tutorial-score">Points: 0</div>\n                                <div class="tutorial-grid" id="tutorial-grid"></div>\n                                <div class="tutorial-piece-area">\n                                    <div class="tutorial-piece" id="tutorial-piece">\n                                        <div class="p-block"></div><div class="p-block"></div><div class="p-block"></div><div class="p-block"></div>\n                                    </div>\n                                    <div class="tutorial-finger" id="tutorial-finger"><i class="fa-solid fa-hand-pointer"></i></div>\n                                </div>\n                            </div>\n                            <button class="modal-close-btn">Got it!</button>\n                        </div>`;
        } else {
             modalHTML = `<div class="modal-content"><h2>${type}</h2><p>${content}</p><button class="modal-close-btn">Mbyll</button></div>`;
        }
        modalOverlay.innerHTML = modalHTML;
        document.body.appendChild(modalOverlay);
        const closeModal = () => { if (document.body.contains(modalOverlay)) { document.body.removeChild(modalOverlay); }};
        modalOverlay.querySelector('.modal-close-btn').addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => { if(e.target === modalOverlay) closeModal(); });
        if (type === 'tutorial') { runTutorialAnimation(); }
    }

    function runTutorialAnimation() {
        const grid = document.getElementById('tutorial-grid');
        const scoreEl = document.getElementById('tutorial-score');
        const piece = document.getElementById('tutorial-piece');
        const finger = document.getElementById('tutorial-finger');
        if(!grid || !scoreEl || !piece || !finger) return;
        let score = 0; grid.innerHTML = ''; let cells = [];
        for(let i=0; i<100; i++) { const cell = document.createElement('div'); cell.classList.add('grid-cell'); grid.appendChild(cell); cells.push(cell); }
        const rowToFill = 5; for(let i = 0; i < 10; i++) { if (i < 3 || i > 6) { cells[rowToFill * 10 + i].classList.add('filled'); } }
        setTimeout(() => { finger.style.opacity = '1'; finger.style.transform = 'translate(0, 0)'; }, 500);
        setTimeout(() => { piece.style.transform = 'translateY(-30px)'; }, 1500);
        setTimeout(() => { finger.style.transform = 'translate(0px, -135px)'; piece.style.transform = 'translate(0px, -165px)';}, 2000);
        setTimeout(() => {
            piece.style.display = 'none';
            const targetCells = [cells[53], cells[54], cells[55], cells[56]];
            targetCells.forEach(c => { c.classList.add('filled'); c.style.cssText = `background: linear-gradient(145deg, #e53e3e, #c53030); border-color: rgba(255, 255, 255, 0.3);`; });
            finger.style.opacity = '0';
        }, 3500);
        setTimeout(() => { for(let i = 0; i < 10; i++) { cells[rowToFill * 10 + i].classList.add('clearing'); } }, 4000);
        setTimeout(() => { score = 100; scoreEl.textContent = `Points: ${score}`; scoreEl.classList.add('updated'); }, 4500);
        setTimeout(() => { scoreEl.classList.remove('updated'); }, 4800);
    }

    const themeToggleButton = document.getElementById('theme-toggle');
    if (themeToggleButton) {
        const moonIcon = themeToggleButton.querySelector('.icon-moon');
        const sunIcon = themeToggleButton.querySelector('.icon-sun');
        themeToggleButton.addEventListener('click', () => { 
            const isDarkMode = moonIcon && moonIcon.style.display !== 'none';
            if (isDarkMode) { if (moonIcon) moonIcon.style.display = 'none'; if (sunIcon) sunIcon.style.display = 'inline-block'; } else { if (moonIcon) moonIcon.style.display = 'inline-block'; if (sunIcon) sunIcon.style.display = 'none'; }
            showModal('Change Theme', 'Light/Dark mode will be available soon!');
        });
    }

    const howToPlayButton = document.getElementById('how-to-play-btn'); if (howToPlayButton) howToPlayButton.addEventListener('click', () => { showModal('tutorial'); });
    const contactButton = document.getElementById('contact-btn'); if (contactButton) contactButton.addEventListener('click', () => { showModal('Contact', 'For any questions, contact us at: contact@blokusblast.com'); });

    const modeButtons = document.querySelectorAll('.mode-button.selectable');
    let isLoading = false;
    modeButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (isLoading) return;
            isLoading = true;
            const selectedMode = this.dataset.mode;
            modeButtons.forEach(btn => { btn.classList.add('loading'); if (btn !== this) { btn.style.opacity = '0.5'; } });
            this.classList.add('selected');
            const iconContainer = this.querySelector('.icon');
            if (iconContainer) iconContainer.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="font-size: 2.5rem;"></i>`;
            setTimeout(() => {
                showModal('Starting Game', `Get ready for ${selectedMode} mode!`);
                setTimeout(() => { location.reload(); }, 2000);
            }, 1500);
        });
    });

    const tipElement = document.getElementById('gemini-tip');
    const inspireBtn = document.getElementById('gemini-inspire-btn');
    const getNewTip = async () => {
        if (!tipElement || !inspireBtn) return;
        tipElement.textContent = 'Generating...';
        inspireBtn.disabled = true;
        const apiKey = ""; 
        if (!apiKey) { tipElement.textContent = 'Try using larger pieces first! 😉'; inspireBtn.disabled = false; return; }
        try { /* omitted API call - keeps fallback behavior */ tipElement.textContent = 'Try blocking your opponent in a corner! 🚀'; } catch (error) { tipElement.textContent = 'Try blocking your opponent in a corner! 🚀'; } finally { inspireBtn.disabled = false; }
    };
    if (inspireBtn) { inspireBtn.addEventListener('click', getNewTip); getNewTip(); }
});
