let __perfLite=false;document.addEventListener('perf:lite',()=>{__perfLite=true});
// === Kodi për backgroundEffects.js ===

function createMagicStars() {
    const container = document.getElementById('magicStars');
    if (!container) return;
    container.innerHTML = ''; // Pastron yjet e vjetër
    const colors = ['rgba(255, 200, 255, 0.9)', 'rgba(200, 220, 255, 0.9)', 'rgba(255, 220, 200, 0.9)'];
    for (let i = 0; i < (__perfLite ? 8 : 25); i++) {
        const star = document.createElement('div');
        star.className = 'magic-star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        const size = Math.random() * 5 + 3;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.background = colors[Math.floor(Math.random() * colors.length)];
        star.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(star);
    }
}

function createSpecialShapes() {
    const container = document.getElementById('specialShapes');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < (__perfLite ? 4 : 10); i++) {
        const shape = document.createElement('div');
        shape.className = Math.random() > 0.5 ? 'star-shape' : 'heart-shape';
        shape.style.left = `${Math.random() * 100}%`;
        shape.style.top = `${Math.random() * 100}%`;
        const color = `hsl(${Math.random() * 60 + 300}, 80%, 80%)`;
        shape.style.background = color;
        shape.style.animationDelay = `${Math.random() * 10}s`;
        shape.style.animationDuration = `${Math.random() * 10 + 10}s`;
        container.appendChild(shape);
    }
}

function createSparkles() {
    const container = document.getElementById('sparkles');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < (__perfLite ? 10 : 30); i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = `${Math.random() * 100}%`;
        sparkle.style.top = `${Math.random() * 100}%`;
        sparkle.style.animationDelay = `${Math.random() * 30}s`;
        sparkle.style.animationDuration = `${Math.random() * 30 + 45}s`; // 45-75 seconds for gentle snow
        const size = Math.random() * 4 + 2;
        sparkle.style.width = `${size}px`;
        sparkle.style.height = `${size}px`;
        container.appendChild(sparkle);
    }
}

// Këto dy funksione do t'i thërrasësh nga main.js për të ndezur ose fikur sfondin
export function activateMagicUniverseBackground() {
    const bgContainer = document.querySelector('.magic-universe-background');
    if (bgContainer) {
        bgContainer.style.display = 'block';
    }
    createMagicStars();
    createSpecialShapes();
    createSparkles();
}

export function deactivateMagicUniverseBackground() {
    const bgContainer = document.querySelector('.magic-universe-background');
    if (bgContainer) {
        bgContainer.style.display = 'none'; // Hide the background when deactivated
    }
}

function __pb(){const c=document.querySelector('.magic-universe-background'); if(c) c.classList.add('paused');}
function __rb(){const c=document.querySelector('.magic-universe-background'); if(c) c.classList.remove('paused');}
document.addEventListener('visibilitychange',()=>{document.hidden?__pb():__rb()});
document.addEventListener('app:pause',__pb);document.addEventListener('app:resume',__rb);
