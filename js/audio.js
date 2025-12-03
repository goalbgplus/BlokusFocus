// js/audio.js
// Menaxhon të gjithë logjikën për tingujt dhe feedback-un haptik.

import { gameState } from './state.js'; // Importo gjendjen për të kontrolluar pauzën/game over

let audioContext;
let isAudioInitialized = false;

/**
 * Inicializon AudioContext. Duhet të thirret vetëm një herë pas interaksionit
 * të parë të përdoruesit për të respektuar politikat e browser-ave.
 */
export function initAudioContext() {
    if (isAudioInitialized) return;
    try {
        // Krijo AudioContext. Përdor 'webkit' për pajtueshmëri me Safari më të vjetër.
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        isAudioInitialized = true;
    } catch (e) {
        // Audio initialization failed - continue silently
    }
}

/**
 * Funksion i brendshëm, i përgjithshëm për të luajtur një notë muzikore.
 * @param {number} frequency Frekuenca e notës në Hz.
 * @param {number} duration Kohëzgjatja në sekonda.
 * @param {number} volume Volumi (0.0 deri 1.0).
 * @param {string} type Tipi i valës ('sine', 'square', 'sawtooth', 'triangle').
 */
function playTone(frequency, duration, volume, type = 'sine', { allowWhenInactive = false } = {}) {
    if (!isAudioInitialized || !audioContext) return;
    
    // Check if sound is enabled
    const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    if (!soundEnabled) return;
    
    // Mos luaj tinguj në pauzë/game over, përveç rasteve kur kërkohet shprehimisht
    if ((gameState.isPaused || gameState.isGameOver) && !allowWhenInactive) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

/**
 * Aktivizon vibrimin në pajisjet që e suportojnë.
 * @param {number|number[]} duration Kohëzgjatja e vibrimit në milisekonda.
 */
export function playHapticFeedback(duration = 50) {
    // Check if vibration is enabled
    const vibrationEnabled = localStorage.getItem('vibrationEnabled') !== 'false';
    if (!vibrationEnabled) return;
    
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(duration);
    }
}


// --- Tingujt specifikë të lojës ---

export const playPlaceSound = () => {
    playTone(440, 0.1, 0.3, 'square');
    playHapticFeedback(30);
};

export const playClearSound = (numLines) => {
    playTone(600 + (numLines * 50), 0.15, 0.4, 'triangle');
    playHapticFeedback([50, 30, 50]);
};

export const playComboSound = (comboCount) => {
    playTone(800 + (comboCount * 100), 0.2, 0.5, 'sine');
};

export const playGameOverSound = () => {
    // Luaj tingullin edhe nëse loja është në pauzë
    initAudioContext();
    if (!audioContext) return;
    playTone(200, 0.5, 0.5, 'sawtooth', { allowWhenInactive: true });
    setTimeout(() => playTone(150, 0.5, 0.5, 'sawtooth', { allowWhenInactive: true }), 200);
};

export const playRotateSound = () => {
    playTone(1200, 0.05, 0.1, 'sine');
    playHapticFeedback(20);
}
/**
 * UI button click sound effect
 */
export const playUIButtonSound = () => {
    // Ensure audio context is initialized on user gesture
    initAudioContext();
    // Resume context if suspended (common on browsers) so sound plays reliably
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    // Simple click tone and light haptic feedback
    playTone(400, 0.05, 0.3, 'square', { allowWhenInactive: true });
    playHapticFeedback(20);
};

// Specialized sound for pause action
export const playPauseSound = () => {
    initAudioContext();
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    playTone(250, 0.1, 0.3, 'triangle', { allowWhenInactive: true });
    playHapticFeedback(30);
};

// Specialized sound for resume action
export const playResumeSound = () => {
    initAudioContext();
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    playTone(550, 0.1, 0.3, 'triangle', { allowWhenInactive: true });
    playHapticFeedback(30);
};

// Specialized sound for restart action
export const playRestartSound = () => {
    initAudioContext();
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    playTone(700, 0.1, 0.3, 'sawtooth', { allowWhenInactive: true });
    playHapticFeedback(40);
};

// Gentle sound for piece appearance animation
export const playPieceAppearSound = () => {
    initAudioContext();
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    // Soft, pleasant tone for piece entrance
    playTone(660, 0.08, 0.15, 'sine');
    playHapticFeedback(15);
};