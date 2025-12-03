/**
 * FAB (Floating Action Button) Manager
 * Manages the horizontal FAB menu with glass morphism effects
 */

class FABManager {
    constructor() {
        this.isMenuOpen = false;
        this.fabMain = null;
        this.fabOptions = null;
        this.fabIcon = null;
        this.init();
    }

    init() {
        this.fabMain = document.getElementById('fabMain');
        this.fabOptions = document.getElementById('fabOptions');
        this.fabIcon = document.getElementById('fabIcon');

        if (!this.fabMain || !this.fabOptions || !this.fabIcon) {
            return;
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Main FAB toggle
        this.fabMain.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleMenu();
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && 
                !this.fabMain.contains(e.target) && 
                !this.fabOptions.contains(e.target)) {
                this.closeMenu();
            }
        });

        // Prevent closing when clicking menu items
        this.fabOptions.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Close menu after action (optional)
        this.fabOptions.addEventListener('click', (e) => {
            if (e.target.closest('.fab-option')) {
                // Delay closing to allow action to complete
                setTimeout(() => this.closeMenu(), 300);
            }
        });
    }

    toggleMenu() {
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        this.isMenuOpen = true;
        this.fabMain.classList.add('active');
        this.fabOptions.classList.add('active');
        this.fabIcon.classList.remove('fa-wand-magic-sparkles');
        this.fabIcon.classList.add('fa-times');
    }

    closeMenu() {
        this.isMenuOpen = false;
        this.fabMain.classList.remove('active');
        this.fabOptions.classList.remove('active');
        this.fabIcon.classList.remove('fa-times');
        this.fabIcon.classList.add('fa-wand-magic-sparkles');
    }

    // Update badge counts
    updateBadge(buttonId, count) {
        const badgeElement = document.querySelector(`#${buttonId} .fab-badge`);
        if (badgeElement) {
            badgeElement.textContent = count;
        }
    }

    // Set button disabled state
    setButtonDisabled(buttonId, disabled) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = disabled;
            button.style.opacity = disabled ? '0.4' : '1';
        }
    }

    // Set active mode for buttons
    setActiveMode(buttonId, active) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.toggle('active-mode', active);
        }
    }

    // Add container show/hide methods
    showContainer() {
        const container = document.querySelector('.fab-container');
        if (container) container.style.display = 'flex';
    }

    hideContainer() {
        const container = document.querySelector('.fab-container');
        if (container) container.style.display = 'none';
    }
}

// Export for use in other modules
export default FABManager;
