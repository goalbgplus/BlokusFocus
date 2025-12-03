// Generate stars for game background
// Initialize game background effects
export function initGameBackground() {
    // Generate initial stars
    generateStars();
    // Regenerate stars on resize for responsiveness
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(generateStars, 300);
    });
}

function generateStars() {
    // Clear existing stars
    const starsContainer = document.getElementById('gameStars');
    
    if (starsContainer) {
        starsContainer.innerHTML = '';
        
        // Responsive star count
        const isMobile = window.innerWidth <= 768;
        const starCount = isMobile ? 80 : 200;
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            
            // Random position
            const top = Math.random() * 100;
            const left = Math.random() * 100;
            
            star.style.top = `${top}%`;
            star.style.left = `${left}%`;
            
            // Random size - smaller for mobile
            const maxSize = isMobile ? 3 : 5;
            const size = Math.random() * maxSize;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            
            // Random animation delay
            star.style.animationDelay = `${Math.random() * 5}s`;
            
            starsContainer.appendChild(star);
        }
    }
}