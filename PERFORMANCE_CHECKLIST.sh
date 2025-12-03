#!/usr/bin/env bash
# 🚀 PERFORMANCE OPTIMIZATION - QUICK REFERENCE CHECKLIST
# 
# This file serves as a quick reference for implementing all performance fixes
# Run each section in order, testing after each step

echo "========================================="
echo "🎮 BLOKUS GRID - PERFORMANCE AUDIT FIX"
echo "========================================="
echo ""

# ============================================================================
# PHASE 1: CSS FIXES (5 MINUTES) → +8fps
# ============================================================================
echo "🔴 PHASE 1: CSS Optimizations (CRITICAL)"
echo "=================================="
echo ""
echo "Steps:"
echo "1. Open css/style.css"
echo "2. FIND and REMOVE (or comment out) these lines:"
echo "   - backdrop-filter: blur(4px) [Line ~118-119]"
echo "   - backdrop-filter: blur(4px) [Line ~366]"
echo "   - backdrop-filter: blur(12px) [Line ~433]"
echo "   - filter: blur(3px) [Line ~133]"
echo ""
echo "3. REPLACE with higher opacity backgrounds:"
echo ""
cat << 'EOF'
.settings-modal-content {
    background: rgba(24, 24, 24, 0.98) !important;
    border: 1px solid rgba(255, 255, 255, 0.12);
}
.glass-effect {
    background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
    border: 1px solid rgba(255, 255, 255, 0.15);
}
.game-overlay-inner {
    background: rgba(0, 0, 0, 0.88);
}
.action-btn.active-mode {
    box-shadow: 0 0 16px rgba(255, 215, 0, 0.5);
    transform: scale(1.02);
    will-change: transform, box-shadow;
}
EOF
echo ""
echo "4. Save and reload browser"
echo "5. Expected FPS: 30 → 38fps"
echo ""
echo "✅ PHASE 1 STATUS: [ ] Complete"
echo ""

# ============================================================================
# PHASE 2: DOM BATCHING (30 MINUTES) → +10fps
# ============================================================================
echo "🟠 PHASE 2: DOM Optimization (HIGH PRIORITY)"
echo "=========================================="
echo ""
echo "Steps:"
echo "1. Backup render.js:"
echo "   cp js/render.js js/render.js.backup"
echo ""
echo "2. REPLACE updateGridDisplay() function in render.js (Line ~239)"
echo "   Copy from: RENDER_OPTIMIZATIONS.js (lines 50-100)"
echo ""
echo "3. ADD blockWrapper cache function:"
echo "   Copy from: RENDER_OPTIMIZATIONS.js (lines 110-130)"
echo ""
echo "4. UPDATE createGridDOM() to call cacheBlockWrappers():"
cat << 'EOF'
// Add at end of createGridDOM():
cacheBlockWrappers();
EOF
echo ""
echo "5. REPLACE showGhostAndHighlight() function (Line ~788)"
echo "   Copy from: RENDER_OPTIMIZATIONS.js (lines 220-260)"
echo ""
echo "6. Test: Drag pieces, place a piece, verify smooth highlight"
echo "7. Expected FPS: 38 → 48fps"
echo ""
echo "✅ PHASE 2 STATUS: [ ] Complete"
echo ""

# ============================================================================
# PHASE 3: OBJECT POOLING (45 MINUTES) → +5fps
# ============================================================================
echo "🟠 PHASE 3: Animation Optimization (HIGH PRIORITY)"
echo "=================================================="
echo ""
echo "Steps:"
echo "1. ADD AnimationDataPool class to render.js"
echo "   Copy from: RENDER_OPTIMIZATIONS.js (lines 140-180)"
echo ""
echo "2. REPLACE animatePlacement() function (Line ~310)"
echo "   Copy from: RENDER_OPTIMIZATIONS.js (lines 190-230)"
echo ""
echo "3. Test: Place multiple pieces in succession"
echo "4. Check DevTools: GC pauses should be <50ms"
echo "5. Expected FPS: 48 → 53fps"
echo ""
echo "✅ PHASE 3 STATUS: [ ] Complete"
echo ""

# ============================================================================
# PHASE 4: EVENT LISTENERS (10 MINUTES) → +3fps
# ============================================================================
echo "🟡 PHASE 4: Event Listener Optimization (MEDIUM PRIORITY)"
echo "========================================================"
echo ""
echo "Steps:"
echo "1. Find touchmove listener in js/main.js (Line ~846)"
echo "   Current: addEventListener('touchmove', handleTouchMove, { passive: false })"
echo ""
echo "2. Check if handleTouchMove() uses preventDefault()"
echo "   - If YES: Keep { passive: false }"
echo "   - If NO: Change to { passive: true }"
echo ""
echo "3. Find other event listeners and add { passive: true }:"
echo "   - scroll listeners"
echo "   - resize listeners"
echo "   - Any listeners that DON'T call preventDefault()"
echo ""
echo "4. Test: Drag pieces, should feel smoother"
echo "5. Expected FPS: 53 → 56fps"
echo ""
echo "✅ PHASE 4 STATUS: [ ] Complete"
echo ""

# ============================================================================
# PHASE 5: CLEANUP (5 MINUTES) → Stability
# ============================================================================
echo "🟡 PHASE 5: Memory Cleanup (NICE-TO-HAVE)"
echo "======================================"
echo ""
echo "Steps:"
echo "1. UPDATE cleanupOldFloatingScores() in js/render.js (Line ~580)"
echo "   Copy from: RENDER_OPTIMIZATIONS.js (lines 280-300)"
echo ""
echo "2. Test: Play for 30 minutes, memory should stay stable"
echo "3. Expected: Memory doesn't grow over time"
echo ""
echo "✅ PHASE 5 STATUS: [ ] Complete"
echo ""

# ============================================================================
# TESTING CHECKLIST
# ============================================================================
echo ""
echo "===================="
echo "✅ TESTING CHECKLIST"
echo "===================="
echo ""
echo "Desktop Testing (should see 60fps):"
echo "[ ] Drag piece - smooth highlight, no lag"
echo "[ ] Place piece - instant grid update"
echo "[ ] Open settings - no blur effect"
echo "[ ] Line clear animation - smooth, no stutters"
echo ""
echo "Mobile Testing (target 45-50fps):"
echo "[ ] Drag piece - should be playable"
echo "[ ] Place piece - grid updates smoothly"
echo "[ ] Multiple placements - no GC stutters"
echo "[ ] Battery drain - <1% per 5 minutes"
echo ""
echo "DevTools Performance Profile:"
echo "[ ] Main thread work < 16ms per frame"
echo "[ ] Paint time < 3ms"
echo "[ ] No yellow (layout) bars in timeline"
echo "[ ] GC pauses < 50ms"
echo ""

# ============================================================================
# ROLLBACK INSTRUCTIONS
# ============================================================================
echo ""
echo "===================="
echo "🔄 ROLLBACK (If issues)"
echo "===================="
echo ""
echo "To revert all changes:"
echo ""
echo "# Restore JavaScript"
echo "cp js/render.js.backup js/render.js"
echo ""
echo "# Restore CSS"
echo "git checkout css/style.css"
echo ""
echo "# Clear cache and reload"
echo "localStorage.clear()"
echo "# Then Ctrl+Shift+R in browser"
echo ""

# ============================================================================
# PERFORMANCE PROFILING SCRIPT
# ============================================================================
echo ""
echo "===================="
echo "📊 PROFILING SCRIPT"
echo "===================="
echo ""
echo "Add this to your console to measure FPS:"
echo ""
cat << 'EOF'
// Paste this in Chrome DevTools Console:
let frames = 0;
let lastTime = Date.now();

function measureFPS() {
    const now = Date.now();
    const elapsed = now - lastTime;
    
    if (elapsed >= 1000) {
        const fps = Math.round(frames * 1000 / elapsed);
        console.log(`FPS: ${fps}`);
        frames = 0;
        lastTime = now;
    }
}

function rafLoop() {
    frames++;
    measureFPS();
    requestAnimationFrame(rafLoop);
}

rafLoop();
EOF
echo ""

# ============================================================================
# FINAL CHECKLIST
# ============================================================================
echo ""
echo "=========================================="
echo "✅ FINAL IMPLEMENTATION CHECKLIST"
echo "=========================================="
echo ""
echo "Before Starting:"
echo "[ ] Read PERFORMANCE_AUDIT_SUMMARY.md"
echo "[ ] Read IMPLEMENTATION_GUIDE.md"
echo "[ ] Backup js/render.js"
echo ""
echo "Phase 1 (CSS):"
echo "[ ] Removed backdrop-filter declarations"
echo "[ ] Increased modal opacity"
echo "[ ] Simplified box-shadows"
echo "[ ] Added will-change to active-mode buttons"
echo "[ ] Tested desktop: 60fps maintained"
echo ""
echo "Phase 2 (DOM):"
echo "[ ] Replaced updateGridDisplay() with batch version"
echo "[ ] Added blockWrapper cache"
echo "[ ] Updated showGhostAndHighlight() to use cache"
echo "[ ] Tested mobile: FPS improved to 48fps"
echo ""
echo "Phase 3 (Animation):"
echo "[ ] Added AnimationDataPool class"
echo "[ ] Replaced animatePlacement() with pooling version"
echo "[ ] Verified GC pauses reduced to <50ms"
echo ""
echo "Phase 4 (Events):"
echo "[ ] Added { passive: true } to scroll listeners"
echo "[ ] Updated touchmove listener"
echo "[ ] Tested drag smoothness"
echo ""
echo "Phase 5 (Memory):"
echo "[ ] Updated cleanupOldFloatingScores()"
echo "[ ] Verified memory stable over 30min"
echo ""
echo "Verification:"
echo "[ ] Chrome DevTools shows <16ms main thread work"
echo "[ ] Paint time <3ms"
echo "[ ] No memory leaks"
echo "[ ] Mobile FPS 45-50fps"
echo "[ ] Desktop FPS 55-60fps"
echo ""
echo "=========================================="
echo "🚀 OPTIMIZATION COMPLETE!"
echo "=========================================="
