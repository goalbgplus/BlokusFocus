// Modal Manager

// Settings modal
export function showSettingsModal(e) {
    const modal = document.getElementById('settingsModal');
    if (!modal) {
        return;
    }

    modal.style.display = 'flex';

    // Attach event listeners to setting checkboxes
    const soundCheckbox = document.getElementById('toggleSound');
    const musicCheckbox = document.getElementById('toggleMusic');
    const vibrationCheckbox = document.getElementById('toggleVibration');

    if (soundCheckbox) {
        soundCheckbox.addEventListener('change', (ev) => {
            localStorage.setItem('soundEnabled', ev.target.checked);
        });
    }

    if (musicCheckbox) {
        musicCheckbox.addEventListener('change', (ev) => {
            localStorage.setItem('musicEnabled', ev.target.checked);
        });
    }

    if (vibrationCheckbox) {
        vibrationCheckbox.addEventListener('change', (ev) => {
            localStorage.setItem('vibrationEnabled', ev.target.checked);
            // Test vibration
            if (ev.target.checked && window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(100);
            }
        });
    }

    // Close modal when clicking outside the content area
    const handleBackdropClick = (ev) => {
        // Only close if click is directly on modal (backdrop), not on content
        const modalContent = modal.querySelector('.settings-modal-content');
        if (modalContent && modalContent.contains(ev.target)) {
            return;
        }
        
        closeSettingsModal();
    };

    // Remove any old handler first
    if (modal._backdropHandler) {
        modal.removeEventListener('click', modal._backdropHandler);
    }

    modal._backdropHandler = handleBackdropClick;
    modal.addEventListener('click', handleBackdropClick);
}

export function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (!modal) {
        return;
    }

    modal.style.display = 'none';

    // Remove backdrop click handler
    if (modal._backdropHandler) {
        modal.removeEventListener('click', modal._backdropHandler);
        modal._backdropHandler = null;
    }
}

// Generic content modal
export function showModal(html) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    if (modal && modalBody) {
        modal.style.display = 'flex';
        modalBody.innerHTML = html;
    }
}

export function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Predefined content modals
export function showHowToPlay() {
    showModal(
        "<h2>How to Play</h2><p>Place blocks to fill lines and score points. <br> Use strategy to avoid blocking yourself! <br> <b>Classic:</b> Pure points. <br><b>Collection:</b> Unlock new shapes. <br>Can you beat your high score?</p>"
    );
}

export function showContact() {
    showModal(
        "<h2>Contact</h2><p>For any questions or feedback, please email:<br><b><a href='mailto:info@blokusblast.com'>info@blokusblast.com</a></b></p>"
    );
}

export function showAchievements() {
    showModal(
        "<h2>Achievements</h2><ul style='text-align:left;padding-left:0;list-style:none;'><li>🏆 High Score: <b>3,400</b></li><li>🔓 All Pieces Unlocked!</li><li>🔥 10x Streak Bonus</li><li>💎 Discovered Secret Mode</li></ul>"
    );
}
// Close with Escape key
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

// Initialize settings from localStorage
export function initializeSettings() {
    const soundCheckbox = document.getElementById('toggleSound');
    const musicCheckbox = document.getElementById('toggleMusic');
    const vibrationCheckbox = document.getElementById('toggleVibration');

    // Load from localStorage or default to true
    if (soundCheckbox) {
        const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        soundCheckbox.checked = soundEnabled;
    }

    if (musicCheckbox) {
        const musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
        musicCheckbox.checked = musicEnabled;
    }

    if (vibrationCheckbox) {
        const vibrationEnabled = localStorage.getItem('vibrationEnabled') !== 'false';
        vibrationCheckbox.checked = vibrationEnabled;
    }
}

// Expose to global scope for inline handlers
window.showSettingsModal = showSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.showModal = showModal;
window.closeModal = closeModal;
window.showHowToPlay = showHowToPlay;
window.showContact = showContact;
window.showAchievements = showAchievements;
