// Color Burst Effect System
export class ColorBurstEffect {
    constructor() {
        this.isActive = false;
        this.particles = [];
        this.clickCount = 0;
        this.requiredClicks = 3;
        this.clickTimeout = null;
        this.colors = [
            '#ff0096', // Hot pink
            '#ff6900', // Orange  
            '#ffd700', // Gold
            '#00bfff', // Deep sky blue
            '#8a2be2', // Blue violet
            '#32cd32', // Lime green
            '#ff4500', // Orange red
            '#ff1493', // Deep pink
            '#00ced1', // Dark turquoise
            '#ff69b4'  // Hot pink
        ];
        this.init();
    }

    init() {
        // Create color burst container
        this.container = document.createElement('div');
        this.container.className = 'color-burst-container';
        document.body.appendChild(this.container);

        // Add click event to logo
        const logo = document.querySelector('.logo');
        if (logo) {
            logo.addEventListener('click', (e) => this.handleLogoClick(e));
            
            // Add visual hint
            logo.style.cursor = 'pointer';
            logo.setAttribute('title', 'Blokus – Triple Click for Color Burst! 🎨 (0/3)');
        }
    }

    handleLogoClick(event) {
        if (this.isActive) return;
        
        this.clickCount++;
        const logo = event.target.closest('.logo');
        
        // Clear previous timeout
        if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
        }
        
        // Update title to show progress
        logo.setAttribute('title', `Blokus – Triple Click for Color Burst! 🎨 (${this.clickCount}/3)`);
        
        // Add visual feedback for each click
        this.addClickFeedback(logo, this.clickCount);
        
        if (this.clickCount >= this.requiredClicks) {
            // Trigger the color burst!
            logo.setAttribute('title', 'Blokus – Color Burst Activated! ✨');
            this.triggerColorBurst(event);
            this.resetClickCount();
        } else {
            // Reset click count after 2 seconds if not completed
            this.clickTimeout = setTimeout(() => {
                this.resetClickCount();
                logo.setAttribute('title', 'Blokus – Triple Click for Color Burst! 🎨 (0/3)');
            }, 2000);
        }
    }
    
    resetClickCount() {
        this.clickCount = 0;
        if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
            this.clickTimeout = null;
        }
    }
    
    addClickFeedback(logo, clickNumber) {
        // Add a subtle bounce effect for each click
        logo.style.transform = `scale(${1 + (clickNumber * 0.05)})`;
        logo.style.filter = `drop-shadow(0 0 ${clickNumber * 5}px rgba(255, 229, 59, ${clickNumber * 0.3}))`;
        
        // Reset transform after animation
        setTimeout(() => {
            logo.style.transform = '';
            logo.style.filter = '';
        }, 200);
        
        // Create small click indicator
        const clickIndicator = document.createElement('div');
        clickIndicator.textContent = clickNumber;
        clickIndicator.style.cssText = `
            position: absolute;
            top: -30px;
            right: -10px;
            background: #ff0096;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            animation: click-bounce 0.5s ease-out;
            pointer-events: none;
            z-index: 1000;
        `;
        
        logo.style.position = 'relative';
        logo.appendChild(clickIndicator);
        
        // Remove indicator after animation
        setTimeout(() => clickIndicator.remove(), 500);
    }

    triggerColorBurst(event) {
        if (this.isActive) return;
        
        this.isActive = true;
        const logo = event.target.closest('.logo');
        const rect = logo.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Logo flash effect
        logo.classList.add('color-burst-active');
        setTimeout(() => logo.classList.remove('color-burst-active'), 800);

        // Create ripple effect
        this.createRipple(centerX, centerY);

        // Create rainbow wave
        this.createRainbowWave();

        // Create particle explosion
        this.createParticleExplosion(centerX, centerY);

        // Create sparkle trails
        this.createSparkleTrails(centerX, centerY);

        // Play sound if available
        this.playSound();

        // Reset after animation
        setTimeout(() => {
            this.cleanup();
            this.isActive = false;
        }, 2500);
    }

    createRipple(x, y) {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const ripple = document.createElement('div');
                ripple.className = 'color-burst-ripple';
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;
                ripple.style.transform = 'translate(-50%, -50%)';
                this.container.appendChild(ripple);

                setTimeout(() => ripple.remove(), 1500);
            }, i * 200);
        }
    }

    createRainbowWave() {
        const wave = document.createElement('div');
        wave.className = 'rainbow-wave';
        document.body.appendChild(wave);

        setTimeout(() => wave.remove(), 1500);
    }

    createParticleExplosion(centerX, centerY) {
        const particleCount = window.innerWidth <= 768 ? 25 : 40;
        
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = `color-burst-particle ${this.getRandomSize()}`;
                
                // Random color
                const color = this.colors[Math.floor(Math.random() * this.colors.length)];
                particle.style.background = `radial-gradient(circle, ${color}, ${color}88)`;
                particle.style.boxShadow = `0 0 10px ${color}`;
                
                // Position at logo center
                particle.style.left = `${centerX}px`;
                particle.style.top = `${centerY}px`;
                particle.style.transform = 'translate(-50%, -50%)';
                
                // Random direction and distance
                const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
                const distance = 100 + Math.random() * 200;
                const endX = centerX + Math.cos(angle) * distance;
                const endY = centerY + Math.sin(angle) * distance;
                
                // Animate to end position
                particle.style.setProperty('--end-x', `${endX - centerX}px`);
                particle.style.setProperty('--end-y', `${endY - centerY}px`);
                
                // Custom animation
                particle.style.animation = `color-burst-explosion 2s ease-out forwards`;
                particle.style.animationDelay = `${Math.random() * 0.3}s`;
                
                this.container.appendChild(particle);
                this.particles.push(particle);

                setTimeout(() => {
                    particle.remove();
                    const index = this.particles.indexOf(particle);
                    if (index > -1) this.particles.splice(index, 1);
                }, 2000);
            }, i * 20);
        }
    }

    createSparkleTrails(centerX, centerY) {
        const sparkleCount = window.innerWidth <= 768 ? 15 : 25;
        
        for (let i = 0; i < sparkleCount; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'color-burst-sparkle';
                
                const color = this.colors[Math.floor(Math.random() * this.colors.length)];
                sparkle.style.color = color;
                
                // Random position around logo
                const offsetX = (Math.random() - 0.5) * 400;
                const offsetY = (Math.random() - 0.5) * 400;
                sparkle.style.left = `${centerX + offsetX}px`;
                sparkle.style.top = `${centerY + offsetY}px`;
                sparkle.style.transform = 'translate(-50%, -50%)';
                
                this.container.appendChild(sparkle);

                setTimeout(() => sparkle.remove(), 1200);
            }, Math.random() * 800);
        }
    }

    getRandomSize() {
        const rand = Math.random();
        if (rand < 0.3) return 'small';
        if (rand < 0.7) return 'medium';
        return 'large';
    }

    playSound() {
        // Create a simple audio context for a satisfying "pop" sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Audio not supported, that's okay
        }
    }

    cleanup() {
        // Remove any remaining particles
        this.particles.forEach(particle => particle.remove());
        this.particles = [];
        
        // Clean up container
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
    }

    // Public method to trigger effect programmatically
    trigger() {
        const logo = document.querySelector('.logo');
        if (logo) {
            this.triggerColorBurst({ target: logo });
        }
    }
}
// Named export of ColorBurstEffect
