// Progressive Piece Unlock System
// Sistem i hapjes graduale të pjesëve bazuar në pikë dhe achievements

import { gameState } from './state.js';

/**
 * Sistema e hapjes graduale të pjesëve
 */
export class PieceUnlockSystem {
    constructor() {
        this.unlockedPieces = this.loadUnlockedPieces();
        this.lastScore = 0;
    }

    /**
     * Kontrollon për unlock të rinj bazuar në pikët aktuale
     */
    checkForUnlocks(currentScore) {
        const newUnlocks = [];
        
        // Check each tier
        const tiers = this.getUnlockTiers();
        
        for (const tier of tiers) {
            if (currentScore >= tier.requiredScore && !this.unlockedPieces.includes(tier.id)) {
                this.unlockedPieces.push(tier.id);
                newUnlocks.push(tier);
            }
        }
        
        if (newUnlocks.length > 0) {
            this.saveUnlockedPieces();
            this.showUnlockNotification(newUnlocks);
        }
        
        return newUnlocks;
    }

    /**
     * Merr të gjitha pjesët e disponueshme për përdorim
     */
    getAvailablePieces() {
        const allPieces = this.getAllPieceDefinitions();
        return allPieces.filter(piece => 
            piece.tier === 'starter' || this.unlockedPieces.includes(piece.id)
        );
    }

    /**
     * Definon tier-at e unlock-ave
     */
    getUnlockTiers() {
        return [
            // Tier 2 - Bronze (1000 pikë)
            { id: 'bronze1', requiredScore: 1000, name: 'P-Shape', tier: 'bronze' },
            { id: 'bronze2', requiredScore: 1000, name: 'U-Shape', tier: 'bronze' },
            { id: 'bronze3', requiredScore: 1000, name: 'Y-Shape', tier: 'bronze' },
            { id: 'bronze4', requiredScore: 1000, name: 'F-Shape', tier: 'bronze' },
            { id: 'bronze5', requiredScore: 1000, name: 'N-Shape', tier: 'bronze' },
            
            // Tier 3 - Silver (3000 pikë)
            { id: 'silver1', requiredScore: 3000, name: 'V-Shape', tier: 'silver' },
            { id: 'silver2', requiredScore: 3000, name: 'W-Shape', tier: 'silver' },
            { id: 'silver3', requiredScore: 3000, name: 'Cross', tier: 'silver' },
            { id: 'silver4', requiredScore: 3000, name: 'Plus', tier: 'silver' },
            { id: 'silver5', requiredScore: 3000, name: 'Corner', tier: 'silver' },
            { id: 'silver6', requiredScore: 3000, name: 'Step', tier: 'silver' },
            
            // Tier 4 - Gold (7000 pikë)
            { id: 'gold1', requiredScore: 7000, name: 'Spiral', tier: 'gold' },
            { id: 'gold2', requiredScore: 7000, name: 'Diamond', tier: 'gold' },
            { id: 'gold3', requiredScore: 7000, name: 'Arrow', tier: 'gold' },
            { id: 'gold4', requiredScore: 7000, name: 'Bridge', tier: 'gold' },
            { id: 'gold5', requiredScore: 7000, name: 'Claw', tier: 'gold' },
            { id: 'gold6', requiredScore: 7000, name: 'Wave', tier: 'gold' },
            
            // Tier 5 - Platinum (15000 pikë)
            { id: 'platinum1', requiredScore: 15000, name: 'Master-1', tier: 'platinum' },
            { id: 'platinum2', requiredScore: 15000, name: 'Master-2', tier: 'platinum' },
            { id: 'platinum3', requiredScore: 15000, name: 'Master-3', tier: 'platinum' },
            { id: 'platinum4', requiredScore: 15000, name: 'Master-4', tier: 'platinum' },
            { id: 'platinum5', requiredScore: 15000, name: 'Master-5', tier: 'platinum' },
            { id: 'platinum6', requiredScore: 15000, name: 'Master-6', tier: 'platinum' }
        ];
    }

    /**
     * Merr milestones për unlock
     */
    getUnlockMilestones() {
        return [
            { id: 'bronze', requiredScore: 1000, name: 'Bronze Tier', tierName: 'bronze' },
            { id: 'silver', requiredScore: 3000, name: 'Silver Tier', tierName: 'silver' },
            { id: 'gold', requiredScore: 7000, name: 'Gold Tier', tierName: 'gold' },
            { id: 'platinum', requiredScore: 15000, name: 'Platinum Tier', tierName: 'platinum' }
        ];
    }

    /**
     * Të gjitha pjesët e lojës - 30 total
     */
    getAllPieceDefinitions() {
        return [
            // TIER 1 - STARTER (7 pjesë klasike)
            { id: 'I', name: 'I-Line', shape: [[0, 0], [0, 1], [0, 2], [0, 3]], color: 1, tier: 'starter' },
            { id: 'O', name: 'O-Square', shape: [[0, 0], [0, 1], [1, 0], [1, 1]], color: 2, tier: 'starter' },
            { id: 'T', name: 'T-Shape', shape: [[0, 1], [1, 0], [1, 1], [1, 2]], color: 3, tier: 'starter' },
            { id: 'S', name: 'S-Shape', shape: [[0, 1], [0, 2], [1, 0], [1, 1]], color: 4, tier: 'starter' },
            { id: 'Z', name: 'Z-Shape', shape: [[0, 0], [0, 1], [1, 1], [1, 2]], color: 5, tier: 'starter' },
            { id: 'J', name: 'J-Shape', shape: [[0, 0], [1, 0], [1, 1], [1, 2]], color: 6, tier: 'starter' },
            { id: 'L', name: 'L-Shape', shape: [[0, 2], [1, 0], [1, 1], [1, 2]], color: 7, tier: 'starter' },
            
            // TIER 2 - BRONZE (5 pjesë të reja)
            { id: 'bronze1', name: 'P-Shape', shape: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]], color: 1, tier: 'bronze' },
            { id: 'bronze2', name: 'U-Shape', shape: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]], color: 2, tier: 'bronze' },
            { id: 'bronze3', name: 'Y-Shape', shape: [[0, 1], [1, 0], [1, 1], [2, 1], [3, 1]], color: 3, tier: 'bronze' },
            { id: 'bronze4', name: 'F-Shape', shape: [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]], color: 4, tier: 'bronze' },
            { id: 'bronze5', name: 'N-Shape', shape: [[0, 1], [1, 0], [1, 1], [2, 0], [3, 0]], color: 5, tier: 'bronze' },
            
            // TIER 3 - SILVER (6 pjesë intermediate)
            { id: 'silver1', name: 'V-Shape', shape: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], color: 6, tier: 'silver' },
            { id: 'silver2', name: 'W-Shape', shape: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]], color: 7, tier: 'silver' },
            { id: 'silver3', name: 'Cross', shape: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]], color: 1, tier: 'silver' },
            { id: 'silver4', name: 'Plus', shape: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]], color: 2, tier: 'silver' },
            { id: 'silver5', name: 'Corner', shape: [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]], color: 3, tier: 'silver' },
            { id: 'silver6', name: 'Step', shape: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]], color: 4, tier: 'silver' },
            
            // TIER 4 - GOLD (6 pjesë advanced)
            { id: 'gold1', name: 'Spiral', shape: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 0], [2, 2]], color: 5, tier: 'gold' },
            { id: 'gold2', name: 'Diamond', shape: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]], color: 6, tier: 'gold' },
            { id: 'gold3', name: 'Arrow', shape: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1], [3, 1]], color: 7, tier: 'gold' },
            { id: 'gold4', name: 'Bridge', shape: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2]], color: 1, tier: 'gold' },
            { id: 'gold5', name: 'Claw', shape: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]], color: 2, tier: 'gold' },
            { id: 'gold6', name: 'Wave', shape: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2], [2, 3]], color: 3, tier: 'gold' },
            
            // TIER 5 - PLATINUM (6 pjesë master)
            { id: 'platinum1', name: 'Master-1', shape: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 0], [2, 2]], color: 4, tier: 'platinum' },
            { id: 'platinum2', name: 'Master-2', shape: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 0], [2, 2]], color: 5, tier: 'platinum' },
            { id: 'platinum3', name: 'Master-3', shape: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2], [2, 1]], color: 6, tier: 'platinum' },
            { id: 'platinum4', name: 'Master-4', shape: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 1], [3, 1]], color: 7, tier: 'platinum' },
            { id: 'platinum5', name: 'Master-5', shape: [[0, 1], [1, 0], [1, 1], [2, 1], [2, 2], [3, 1]], color: 1, tier: 'platinum' },
            { id: 'platinum6', name: 'Master-6', shape: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 1]], color: 2, tier: 'platinum' }
        ];
    }

    /**
     * Shfaq notification për unlock të rinj
     */
    showUnlockNotification(newUnlocks) {
        const tierNames = {
            bronze: 'BRONZE TIER',
            silver: 'SILVER TIER', 
            gold: 'GOLD TIER',
            platinum: 'PLATINUM TIER'
        };

        const tierEmojis = {
            bronze: '🥉',
            silver: '🥈', 
            gold: '🥇',
            platinum: '💎'
        };

        const groupedByTier = {};
        newUnlocks.forEach(unlock => {
            if (!groupedByTier[unlock.tier]) {
                groupedByTier[unlock.tier] = [];
            }
            groupedByTier[unlock.tier].push(unlock);
        });

        Object.keys(groupedByTier).forEach(tier => {
            const pieces = groupedByTier[tier];
            const message = `${tierEmojis[tier]} ${tierNames[tier]} UNLOCKED!\n${pieces.length} new pieces available: ${pieces.map(p => p.name).join(', ')}`;
            
            this.displayUnlockNotification(message, tier);
        });
    }

    /**
     * Shfaq notification në UI
     */
    displayUnlockNotification(message, tier) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `unlock-notification unlock-${tier}`;
        notification.innerHTML = `
            <div class="unlock-content">
                <h3>🎉 NEW PIECES UNLOCKED!</h3>
                <p>${message}</p>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 500);
        }, 4000);

        // Play unlock sound if available
        this.playUnlockSound();
    }

    /**
     * Play unlock sound
     */
    playUnlockSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LGeSYELYTO8teMOAcabLvs5Z0TAA4A');
            audio.volume = 0.3;
            audio.play();
        } catch (e) {
            // Ignore audio errors
        }
    }

    /**
     * Merr informacion për unlock-un e ardhshëm
     */
    getNextUnlock() {
        const currentScore = gameState?.score || 0;
        const milestones = this.getUnlockMilestones();

        for (const milestone of milestones) {
            if (currentScore < milestone.requiredScore) {
                return {
                    name: milestone.name,
                    requiredScore: milestone.requiredScore,
                    remaining: Math.max(0, milestone.requiredScore - currentScore)
                };
            }
        }

        return null; // All unlocked
    }

    /**
     * Load unlocked pieces nga localStorage
     */
    loadUnlockedPieces() {
        try {
            return JSON.parse(localStorage.getItem('blocustema_unlockedPieces') || '[]');
        } catch {
            return [];
        }
    }

    /**
     * Save unlocked pieces në localStorage
     */
    saveUnlockedPieces() {
        localStorage.setItem('blocustema_unlockedPieces', JSON.stringify(this.unlockedPieces));
    }

    /**
     * Merr informacionin e progresit të unlock-eve
     */
    getProgressInfo() {
        const totalPieces = 30;
        
        // Count actual unlocked pieces, not just tier unlocks
        const availablePieces = this.getAvailablePieces();
        const unlockedCount = availablePieces.length;
        const percentage = (unlockedCount / totalPieces) * 100;
        const nextUnlock = this.getNextUnlock();

        return {
            totalPieces,
            unlockedCount,
            percentage: Math.round(percentage),
            nextUnlock
        };
    }

    /**
     * Reset të gjitha unlock-et (për testing)
     */
    resetUnlocks() {
        this.unlockedPieces = [];
        this.saveUnlockedPieces();
    }
}

// Export instance
export const pieceUnlockSystem = new PieceUnlockSystem();
