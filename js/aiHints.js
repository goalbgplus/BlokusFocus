// AI-Enhanced Hints System për lojën Tetris/Blokus
// Ky sistem analizon stilin e lojës së përdoruesit dhe jep hints inteligjente

import { gameState } from './state.js';
import { GRID_ROWS, GRID_COLS } from './constants.js';

/**
 * AI-Powered Hint Engine që mëson nga lojërat e përdoruesit
 */
export class AIHintEngine {
    constructor() {
        this.userPlayStyle = this.loadUserPlayStyle();
        this.gameAnalytics = this.loadGameAnalytics();
        this.learningData = this.loadLearningData();
    }

    /**
     * Gjëneron hints inteligjente bazuar në AI analysis
     */
    generateSmartHints(piece, currentGrid) {
        const context = this.analyzeGameContext(currentGrid);
        const userPreferences = this.analyzeUserPreferences();
        const strategicSituations = this.identifyStrategicSituations(currentGrid);
        
        // Multi-layered analysis
        const hints = [
            ...this.analyzeLineCompletionPotential(piece, currentGrid),
            ...this.analyzeFutureSpaceOptimization(piece, currentGrid),
            ...this.analyzeComboSetupOpportunities(piece, currentGrid),
            ...this.analyzeDefensivePositioning(piece, currentGrid),
            ...this.analyzeRiskMitigation(piece, currentGrid)
        ];

        // AI Weight Application bazuar në user behavior
        const weightedHints = this.applyAIWeights(hints, context, userPreferences);
        
        // Machine Learning Optimization
        const optimizedHints = this.applyMLOptimization(weightedHints, strategicSituations);
        
        return this.selectBestHints(optimizedHints, 3);
    }

    /**
     * Analizon kontekstin aktual të lojës
     */
    analyzeGameContext(grid) {
        const occupiedCells = this.calculateOccupancy(grid);
        const fragmentationLevel = this.calculateFragmentation(grid);
        const riskLevel = this.calculateRiskLevel(grid);
        const opportunityScore = this.calculateOpportunityScore(grid);
        
        return {
            gamePhase: this.determineGamePhase(occupiedCells),
            urgencyLevel: this.calculateUrgencyLevel(riskLevel, occupiedCells),
            spaceEfficiency: this.calculateSpaceEfficiency(grid),
            strategicPriority: this.determineStrategicPriority(fragmentationLevel, opportunityScore)
        };
    }

    /**
     * Analizon preferencat e përdoruesit bazuar në historikun e lojërave
     */
    analyzeUserPreferences() {
        const playHistory = this.userPlayStyle.recentMoves || [];
        
        return {
            preferredStrategy: this.identifyPreferredStrategy(playHistory),
            riskTolerance: this.calculateRiskTolerance(playHistory),
            planningHorizon: this.calculatePlanningHorizon(playHistory),
            efficiencyFocus: this.calculateEfficiencyFocus(playHistory)
        };
    }

    /**
     * Advanced Line Completion Analysis me AI prediction
     */
    analyzeLineCompletionPotential(piece, grid) {
        const hints = [];
        const shape = piece.currentShape || piece.shape;
        
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (this.isValidPlacement(shape, r, c, grid)) {
                    const analysis = this.analyzeLinePotential(shape, r, c, grid);
                    
                    if (analysis.score > 0.6) { // Threshold për hints të mirë
                        hints.push({
                            row: r,
                            col: c,
                            type: 'line_completion',
                            score: analysis.score,
                            confidence: analysis.confidence,
                            reasoning: analysis.reasoning,
                            futureOpportunities: analysis.futureOpportunities
                        });
                    }
                }
            }
        }
        
        return hints;
    }

    /**
     * Future Space Optimization Analysis
     */
    analyzeFutureSpaceOptimization(piece, grid) {
        const hints = [];
        const shape = piece.currentShape || piece.shape;
        
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (this.isValidPlacement(shape, r, c, grid)) {
                    // Simulo vendosjen dhe analizoj të ardhmen
                    const futureGrid = this.simulatePlacement(shape, r, c, grid);
                    const spaceOptimization = this.calculateSpaceOptimization(futureGrid);
                    const flexibilityScore = this.calculateFlexibilityScore(futureGrid);
                    
                    if (spaceOptimization.score > 0.7) {
                        hints.push({
                            row: r,
                            col: c,
                            type: 'space_optimization',
                            score: spaceOptimization.score,
                            confidence: flexibilityScore,
                            reasoning: `Optimizes future space usage: ${spaceOptimization.benefits}`,
                            futureFlexibility: flexibilityScore
                        });
                    }
                }
            }
        }
        
        return hints;
    }

    /**
     * Combo Setup Analysis me predictive modeling
     */
    analyzeComboSetupOpportunities(piece, grid) {
        const hints = [];
        const shape = piece.currentShape || piece.shape;
        
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (this.isValidPlacement(shape, r, c, grid)) {
                    const comboAnalysis = this.predictComboOpportunities(shape, r, c, grid);
                    
                    if (comboAnalysis.potentialCombos > 1) {
                        hints.push({
                            row: r,
                            col: c,
                            type: 'combo_setup',
                            score: comboAnalysis.totalScore,
                            confidence: comboAnalysis.confidence,
                            reasoning: `Sets up ${comboAnalysis.potentialCombos}-line combo`,
                            comboDetails: comboAnalysis.details
                        });
                    }
                }
            }
        }
        
        return hints;
    }

    /**
     * Defensive Positioning Analysis
     */
    analyzeDefensivePositioning(piece, grid) {
        const hints = [];
        const shape = piece.currentShape || piece.shape;
        const riskAreas = this.identifyRiskAreas(grid);
        
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (this.isValidPlacement(shape, r, c, grid)) {
                    const defenseScore = this.calculateDefenseScore(shape, r, c, grid, riskAreas);
                    
                    if (defenseScore.score > 0.6) {
                        hints.push({
                            row: r,
                            col: c,
                            type: 'defensive',
                            score: defenseScore.score,
                            confidence: defenseScore.reliability,
                            reasoning: defenseScore.explanation,
                            riskMitigation: defenseScore.mitigatedRisks
                        });
                    }
                }
            }
        }
        
        return hints;
    }

    /**
     * Risk Mitigation Analysis
     */
    analyzeRiskMitigation(piece, grid) {
        const hints = [];
        const criticalAreas = this.identifyCriticalAreas(grid);
        const shape = piece.currentShape || piece.shape;
        
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (this.isValidPlacement(shape, r, c, grid)) {
                    const riskAnalysis = this.analyzeGameOverRisk(shape, r, c, grid);
                    
                    if (riskAnalysis.riskReduction > 0.5) {
                        hints.push({
                            row: r,
                            col: c,
                            type: 'risk_mitigation',
                            score: riskAnalysis.score,
                            confidence: riskAnalysis.confidence,
                            reasoning: `Reduces game over risk by ${Math.round(riskAnalysis.riskReduction * 100)}%`,
                            riskFactors: riskAnalysis.factors
                        });
                    }
                }
            }
        }
        
        return hints;
    }

    /**
     * Aplikon pesha AI bazuar në kontekstin e lojës
     */
    applyAIWeights(hints, context, userPreferences) {
        return hints.map(hint => {
            let adjustedScore = hint.score;
            
            // Context-based weights
            switch (context.gamePhase) {
                case 'early':
                    if (hint.type === 'space_optimization') adjustedScore *= 1.3;
                    break;
                case 'middle':
                    if (hint.type === 'combo_setup') adjustedScore *= 1.2;
                    break;
                case 'late':
                    if (hint.type === 'risk_mitigation') adjustedScore *= 1.5;
                    break;
            }
            
            // User preference weights
            if (userPreferences.preferredStrategy === 'aggressive' && hint.type === 'combo_setup') {
                adjustedScore *= 1.2;
            }
            if (userPreferences.riskTolerance === 'low' && hint.type === 'defensive') {
                adjustedScore *= 1.3;
            }
            
            return { ...hint, adjustedScore };
        });
    }

    /**
     * Machine Learning Optimization
     */
    applyMLOptimization(hints, strategicSituations) {
        // Simulate neural network weights based on historical data
        const neuralWeights = this.calculateNeuralWeights(strategicSituations);
        
        return hints.map(hint => {
            const features = this.extractHintFeatures(hint);
            const mlScore = this.calculateMLScore(features, neuralWeights);
            
            return {
                ...hint,
                mlScore,
                finalScore: (hint.adjustedScore * 0.7) + (mlScore * 0.3)
            };
        });
    }

    /**
     * Zgjedh hints-et më të mira
     */
    selectBestHints(hints, count = 3) {
        // Sort by final score
        hints.sort((a, b) => b.finalScore - a.finalScore);
        
        // Ensure diversity in hint types
        const diverseHints = this.ensureHintDiversity(hints.slice(0, count * 2));
        
        return diverseHints.slice(0, count);
    }

    /**
     * Siguron diversitet në llojet e hints-ave
     */
    ensureHintDiversity(hints) {
        const typesSeen = new Set();
        const diverseHints = [];
        
        for (const hint of hints) {
            if (!typesSeen.has(hint.type) || diverseHints.length < 2) {
                diverseHints.push(hint);
                typesSeen.add(hint.type);
            }
        }
        
        // Fill remaining slots with best remaining hints
        const remaining = hints.filter(h => !diverseHints.includes(h));
        diverseHints.push(...remaining.slice(0, 3 - diverseHints.length));
        
        return diverseHints;
    }

    /**
     * Ruaj të dhënat e të mësuarit për përmirësim të vazhdueshëm
     */
    recordUserDecision(presentedHints, chosenHint, outcome) {
        this.learningData.decisions.push({
            timestamp: Date.now(),
            hints: presentedHints,
            chosen: chosenHint,
            outcome: outcome, // success, failure, ignored
            gameContext: this.analyzeGameContext(gameState.grid)
        });
        
        // Update user play style
        this.updateUserPlayStyle(chosenHint, outcome);
        
        // Save to localStorage
        this.saveLearningData();
    }

    // Utility methods për AI calculations
    calculateOccupancy(grid) {
        let occupied = 0;
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (grid[r][c] !== 0) occupied++;
            }
        }
        return occupied / (GRID_ROWS * GRID_COLS);
    }
    
    calculateFragmentation(grid) {
        let fragments = 0;
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (grid[r][c] === 0) {
                    // Count isolated empty cells
                    const neighbors = [
                        [r-1, c], [r+1, c], [r, c-1], [r, c+1]
                    ];
                    const emptyNeighbors = neighbors.filter(([nr, nc]) => 
                        nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS && grid[nr][nc] === 0
                    ).length;
                    if (emptyNeighbors < 2) fragments++;
                }
            }
        }
        return Math.min(fragments / (GRID_ROWS * GRID_COLS), 1);
    }
    
    calculateRiskLevel(grid) {
        const occupancy = this.calculateOccupancy(grid);
        const fragmentation = this.calculateFragmentation(grid);
        return Math.min((occupancy * 0.7) + (fragmentation * 0.3), 1);
    }
    
    calculateOpportunityScore(grid) {
        let opportunities = 0;
        // Check for almost complete lines
        for (let r = 0; r < GRID_ROWS; r++) {
            const emptyCells = grid[r].filter(cell => cell === 0).length;
            if (emptyCells <= 2 && emptyCells > 0) opportunities++;
        }
        for (let c = 0; c < GRID_COLS; c++) {
            let emptyCells = 0;
            for (let r = 0; r < GRID_ROWS; r++) {
                if (grid[r][c] === 0) emptyCells++;
            }
            if (emptyCells <= 2 && emptyCells > 0) opportunities++;
        }
        return Math.min(opportunities / 10, 1);
    }
    
    determineGamePhase(occupancy) {
        if (occupancy < 0.3) return 'early';
        if (occupancy < 0.7) return 'middle';
        return 'late';
    }
    
    calculateUrgencyLevel(riskLevel, occupancy) {
        return Math.min(riskLevel + (occupancy * 0.3), 1);
    }
    
    calculateSpaceEfficiency(grid) {
        const occupancy = this.calculateOccupancy(grid);
        const fragmentation = this.calculateFragmentation(grid);
        return Math.max(0, occupancy - (fragmentation * 0.5));
    }
    
    determineStrategicPriority(fragmentation, opportunity) {
        if (fragmentation > 0.6) return 'cleanup';
        if (opportunity > 0.5) return 'completion';
        return 'expansion';
    }
    
    identifyPreferredStrategy(playHistory) {
        if (playHistory.length === 0) return 'balanced';
        // Simple heuristic - more moves = more aggressive
        return playHistory.length > 50 ? 'aggressive' : 'defensive';
    }
    
    calculateRiskTolerance(playHistory) {
        // Default to medium risk tolerance
        return 'medium';
    }
    
    calculatePlanningHorizon(playHistory) {
        return playHistory.length > 30 ? 'long-term' : 'short-term';
    }
    
    calculateEfficiencyFocus(playHistory) {
        return 0.7; // Default efficiency focus
    }
    
    analyzeLinePotential(shape, row, col, grid) {
        let score = 0;
        let confidence = 0.5;
        let reasoning = '';
        let futureOpportunities = 0;
        
        // Check if this placement would complete lines
        const testGrid = this.simulatePlacement(shape, row, col, grid);
        const completedLines = this.countCompletedLines(testGrid) - this.countCompletedLines(grid);
        
        if (completedLines > 0) {
            score = 0.8 + (completedLines * 0.1);
            confidence = 0.9;
            reasoning = `Completes ${completedLines} line(s)`;
            futureOpportunities = completedLines * 2;
        } else {
            // Check for almost complete lines
            const almostComplete = this.countAlmostCompleteLines(testGrid);
            if (almostComplete > 0) {
                score = 0.6;
                confidence = 0.7;
                reasoning = `Sets up ${almostComplete} line(s) for completion`;
                futureOpportunities = almostComplete;
            }
        }
        
        return { score, confidence, reasoning, futureOpportunities };
    }
    
    calculateSpaceOptimization(grid) {
        const efficiency = this.calculateSpaceEfficiency(grid);
        const benefits = efficiency > 0.7 ? 'high space efficiency' : 'moderate space usage';
        return { score: efficiency, benefits };
    }
    
    calculateFlexibilityScore(grid) {
        const fragmentation = this.calculateFragmentation(grid);
        return Math.max(0, 1 - fragmentation);
    }
    
    simulatePlacement(shape, row, col, grid) {
        const testGrid = grid.map(r => [...r]);
        shape.forEach(([sr, sc]) => {
            const gridRow = row + sr;
            const gridCol = col + sc;
            if (gridRow >= 0 && gridRow < GRID_ROWS && gridCol >= 0 && gridCol < GRID_COLS) {
                testGrid[gridRow][gridCol] = 1; // Temporary value
            }
        });
        return testGrid;
    }
    
    countCompletedLines(grid) {
        let completed = 0;
        // Check rows
        for (let r = 0; r < GRID_ROWS; r++) {
            if (grid[r].every(cell => cell !== 0)) completed++;
        }
        // Check columns
        for (let c = 0; c < GRID_COLS; c++) {
            let columnComplete = true;
            for (let r = 0; r < GRID_ROWS; r++) {
                if (grid[r][c] === 0) {
                    columnComplete = false;
                    break;
                }
            }
            if (columnComplete) completed++;
        }
        return completed;
    }
    
    countAlmostCompleteLines(grid) {
        let almostComplete = 0;
        // Check rows
        for (let r = 0; r < GRID_ROWS; r++) {
            const emptyCells = grid[r].filter(cell => cell === 0).length;
            if (emptyCells <= 2 && emptyCells > 0) almostComplete++;
        }
        // Check columns
        for (let c = 0; c < GRID_COLS; c++) {
            let emptyCells = 0;
            for (let r = 0; r < GRID_ROWS; r++) {
                if (grid[r][c] === 0) emptyCells++;
            }
            if (emptyCells <= 2 && emptyCells > 0) almostComplete++;
        }
        return almostComplete;
    }
    
    predictComboOpportunities(shape, row, col, grid) {
        const testGrid = this.simulatePlacement(shape, row, col, grid);
        const currentLines = this.countCompletedLines(grid);
        const newLines = this.countCompletedLines(testGrid);
        const potentialCombos = newLines - currentLines;
        
        return {
            potentialCombos,
            totalScore: potentialCombos * 0.8,
            confidence: potentialCombos > 0 ? 0.8 : 0.3,
            details: `${potentialCombos} potential combo lines`
        };
    }
    
    identifyRiskAreas(grid) {
        const riskAreas = [];
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (grid[r][c] === 0) {
                    const surroundingOccupied = this.countSurroundingOccupied(grid, r, c);
                    if (surroundingOccupied >= 3) {
                        riskAreas.push({ row: r, col: c, risk: surroundingOccupied / 4 });
                    }
                }
            }
        }
        return riskAreas;
    }
    
    countSurroundingOccupied(grid, row, col) {
        const neighbors = [
            [row-1, col], [row+1, col], [row, col-1], [row, col+1]
        ];
        return neighbors.filter(([r, c]) => 
            r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS && grid[r][c] !== 0
        ).length;
    }
    
    calculateDefenseScore(shape, row, col, grid, riskAreas) {
        let score = 0.5;
        let reliability = 0.6;
        let explanation = 'Standard placement';
        let mitigatedRisks = 0;
        
        // Check if placement fills risky areas
        shape.forEach(([sr, sc]) => {
            const gridRow = row + sr;
            const gridCol = col + sc;
            const risk = riskAreas.find(area => area.row === gridRow && area.col === gridCol);
            if (risk) {
                score += risk.risk * 0.2;
                mitigatedRisks++;
            }
        });
        
        if (mitigatedRisks > 0) {
            explanation = `Fills ${mitigatedRisks} risky gap(s)`;
            reliability = 0.8;
        }
        
        return { score, reliability, explanation, mitigatedRisks };
    }
    
    identifyCriticalAreas(grid) {
        const critical = [];
        const occupancy = this.calculateOccupancy(grid);
        if (occupancy > 0.7) {
            // In late game, all empty spaces are critical
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < GRID_COLS; c++) {
                    if (grid[r][c] === 0) {
                        critical.push({ row: r, col: c });
                    }
                }
            }
        }
        return critical;
    }
    
    analyzeGameOverRisk(shape, row, col, grid) {
        const currentRisk = this.calculateRiskLevel(grid);
        const testGrid = this.simulatePlacement(shape, row, col, grid);
        const newRisk = this.calculateRiskLevel(testGrid);
        const riskReduction = Math.max(0, currentRisk - newRisk);
        
        return {
            score: 0.5 + (riskReduction * 0.5),
            confidence: riskReduction > 0.1 ? 0.8 : 0.4,
            riskReduction,
            factors: ['space optimization', 'fragmentation reduction']
        };
    }
    
    calculateNeuralWeights(strategicSituations) {
        // Simplified neural network weights simulation
        return {
            lineCompletion: 0.8,
            spaceOptimization: 0.6,
            comboSetup: 0.7,
            defensive: 0.5,
            riskMitigation: 0.9
        };
    }
    
    extractHintFeatures(hint) {
        return {
            score: hint.score || 0,
            confidence: hint.confidence || 0.5,
            type: hint.type || 'unknown',
            position: [hint.row || 0, hint.col || 0]
        };
    }
    
    calculateMLScore(features, weights) {
        const typeWeight = weights[features.type] || 0.5;
        return (features.score * 0.4) + (features.confidence * 0.3) + (typeWeight * 0.3);
    }
    
    ensureHintDiversity(hints) {
        const typesSeen = new Set();
        const diverseHints = [];
        
        for (const hint of hints) {
            if (!typesSeen.has(hint.type) || diverseHints.length < 2) {
                diverseHints.push(hint);
                typesSeen.add(hint.type);
            }
        }
        
        // Fill remaining slots with best remaining hints
        const remaining = hints.filter(h => !diverseHints.includes(h));
        diverseHints.push(...remaining.slice(0, 3 - diverseHints.length));
        
        return diverseHints;
    }
    
    recordUserDecision(presentedHints, chosenHint, outcome) {
        if (!this.learningData.decisions) {
            this.learningData.decisions = [];
        }
        
        this.learningData.decisions.push({
            timestamp: Date.now(),
            hints: presentedHints,
            chosen: chosenHint,
            outcome: outcome,
            gameContext: this.analyzeGameContext(gameState.grid)
        });
        
        this.updateUserPlayStyle(chosenHint, outcome);
        this.saveLearningData();
    }
    
    updateUserPlayStyle(chosenHint, outcome) {
        if (!this.userPlayStyle.preferences) {
            this.userPlayStyle.preferences = {};
        }
        
        const hintType = chosenHint?.type || 'unknown';
        if (!this.userPlayStyle.preferences[hintType]) {
            this.userPlayStyle.preferences[hintType] = { count: 0, success: 0 };
        }
        
        this.userPlayStyle.preferences[hintType].count++;
        if (outcome === 'success') {
            this.userPlayStyle.preferences[hintType].success++;
        }
    }
    
    analyzeRecentPerformance() {
        const recentMoves = this.gameAnalytics.recentMoves || [];
        if (recentMoves.length === 0) {
            return { averageSuccess: 0.5 };
        }
        
        const successes = recentMoves.filter(move => move.success).length;
        return { averageSuccess: successes / recentMoves.length };
    }
    
    calculateGameDuration() {
        return gameState.startTime ? Date.now() - gameState.startTime : 0;
    }
    
    identifyStrategicSituations(grid) {
        return {
            occupancy: this.calculateOccupancy(grid),
            fragmentation: this.calculateFragmentation(grid),
            opportunities: this.calculateOpportunityScore(grid)
        };
    }
    
    isValidPlacement(shape, row, col, grid) {
        for (const [sr, sc] of shape) {
            const gridRow = row + sr;
            const gridCol = col + sc;
            if (gridRow < 0 || gridRow >= GRID_ROWS || gridCol < 0 || gridCol >= GRID_COLS) {
                return false;
            }
            if (grid[gridRow][gridCol] !== 0) {
                return false;
            }
        }
        return true;
    }
    
    // Data persistence methods
    loadUserPlayStyle() {
        return JSON.parse(localStorage.getItem('aiHints_userStyle') || '{}');
    }
    
    loadGameAnalytics() {
        return JSON.parse(localStorage.getItem('aiHints_analytics') || '{"recentMoves": [], "performance": []}');
    }
    
    loadLearningData() {
        return JSON.parse(localStorage.getItem('aiHints_learningData') || '{"decisions": [], "patterns": {}}');
    }
    
    saveLearningData() {
        localStorage.setItem('aiHints_learningData', JSON.stringify(this.learningData));
        localStorage.setItem('aiHints_userStyle', JSON.stringify(this.userPlayStyle));
        localStorage.setItem('aiHints_analytics', JSON.stringify(this.gameAnalytics));
    }
}

// Export për përdorim në gameLogic.js
export const aiHintEngine = new AIHintEngine();
