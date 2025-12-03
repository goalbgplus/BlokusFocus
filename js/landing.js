// import updateLandingPageStats from main.js removed to enable lazy-loading of game code
import { showTutorialModal } from './tutorialAnimation.js';

// Initialize landing page behaviors
export function initLanding() {
    
    // Animation and interaction logic from new design
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
        let classicIndex = 0; 
        let collectionIndex = 0;
        
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
                    } else { 
                        block.style.opacity = '0'; 
                    }
                });
            }, 750);
        };
        
        applyShape(classicBlocks, classicShapes[0]);
        applyShape(collectionBlocks, collectionShapes[0]);
        
        setInterval(() => {
            classicIndex = (classicIndex + 1) % classicShapes.length;
            applyShape(classicBlocks, classicShapes[classicIndex]);
        }, 2500);
        setInterval(() => {
            collectionIndex = (collectionIndex + 1) % collectionShapes.length;
            applyShape(collectionBlocks, collectionShapes[collectionIndex]);
        }, 2500);
    }

    function showModal(type, content) {
        if (type === 'tutorial') {
            showTutorialModal();
            return;
        }
        
        // Handle other modal types (like contact)
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        const modalHTML = `<div class="modal-content"><h2>${type}</h2><p>${content}</p><button class="modal-close-btn">Close</button></div>`;
        modalOverlay.innerHTML = modalHTML;
        document.body.appendChild(modalOverlay);
        
        const closeModal = () => { if (document.body.contains(modalOverlay)) { document.body.removeChild(modalOverlay); }};
        modalOverlay.querySelector('.modal-close-btn').addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => { if(e.target === modalOverlay) closeModal(); });
    }

    
    // Hide special-actions until game starts
    const specialActions = document.querySelector('.special-actions');
    if (specialActions) specialActions.classList.add('hidden');
    // Initialize animations and stats
    animatePieceShowcase();
    // Inline stats update to avoid loading main.js
    (function updateLandingPageStatsInline() {
        const highScoreEl = document.getElementById('highscore-display');
        if (highScoreEl) {
            highScoreEl.textContent = localStorage.getItem('blokusHighScore') || '0';
        }
        const piecesUnlockedEl = document.getElementById('pieces-unlocked');
        if (piecesUnlockedEl) {
            let count = 7;
            const score = parseInt(localStorage.getItem('blokusHighScore') || '0');
            if (score >= 2000) count += 6;
            if (score >= 4000) count += 6;
            if (score >= 6000) count += 6;
            if (score >= 8000) count += 5;
            piecesUnlockedEl.textContent = Math.min(count, 30);
        }
    })();

    // Animate stats counters
    const stats = document.querySelectorAll('.stat-value');
    stats.forEach(stat => {
        const target = +stat.getAttribute('data-target') || parseInt(stat.textContent);
        let current = 0;
        const increment = target / 100;
        const updateCount = () => {
            if (current < target) {
                current += increment;
                stat.innerText = Math.ceil(current);
                requestAnimationFrame(updateCount);
            } else {
                stat.innerText = target;
            }
        };
        setTimeout(() => {
            updateCount();
        }, 500); 
    });
    
    // Button event handlers
    const howToPlayButton = document.getElementById('how-to-play-btn');
    if (howToPlayButton) {
        howToPlayButton.addEventListener('click', () => { 
            showModal('tutorial'); 
        });
    }

    const contactButton = document.getElementById('contact-btn');
    if (contactButton) {
        contactButton.addEventListener('click', () => { 
            showModal('Contact', 'For any questions, contact us at: contact@blokusblast.com'); 
        });
    }
    
    // Mode selection with loading animation and game start
    const modeButtons = document.querySelectorAll('.mode-button.selectable');
    let hasLoadedOnce = false;
    modeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const selectedMode = this.dataset.mode;
            localStorage.setItem('selectedGameMode', selectedMode);
            const landingPage = document.getElementById('landingPage');
            const gameContainer = document.querySelector('.game-container');
            if (!hasLoadedOnce) {
                // Lazy-load game code modules
                import('./main.js').then(({ initMain }) => {
                    initMain();
                }).catch(console.error);
                // Vetëm spinner në buton, pa modal
                const iconContainer = this.querySelector('.icon');
                if (iconContainer) {
                    iconContainer.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="font-size: 2.5rem;"></i>`;
                }
                setTimeout(() => {
                    if (landingPage && gameContainer) {
                        landingPage.classList.add('hidden');
                        document.body.classList.remove('landing-page');
                        gameContainer.classList.remove('hidden');
                        window.selectedGameMode = selectedMode;
                        // Show special-actions container
                        const specialActions = document.querySelector('.special-actions');
                        if (specialActions) specialActions.classList.remove('hidden');
                        if (typeof window.initializeGame === 'function') {
                            window.initializeGame();
                        }
                    }
                    hasLoadedOnce = true;
                }, 1500);
            } else {
                // Fut direkt në lojë pa animacion
                if (landingPage && gameContainer) {
                    landingPage.classList.add('hidden');
                    gameContainer.classList.remove('hidden');
                    window.selectedGameMode = selectedMode;
                        // Show special-actions container
                        const specialActions = document.querySelector('.special-actions');
                        if (specialActions) specialActions.classList.remove('hidden');
                    if (typeof window.initializeGame === 'function') {
                        window.initializeGame();
                    }
                }
            }
        });
    });

} // end initLanding
