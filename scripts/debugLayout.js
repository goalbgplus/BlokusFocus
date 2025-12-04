/**
 * Debug Layout Script for Blokus Grid
 * Helps diagnose mobile layout issues on GitHub Pages vs local dev
 * 
 * Usage:
 *   - Automatically runs on load and resize
 *   - Manual: window.debugLayout() or window.debugOverflow()
 */
(function () {
  'use strict';

  const CSS_VARS = [
    '--grid-cell-size',
    '--piece-block-size',
    '--game-grid-gap',
    '--game-grid-padding',
    '--game-grid-border',
    '--game-grid-content-size',
    '--game-grid-total-size',
    '--game-shell-max-width',
    '--view-height',
    '--mobile-grid-max-size'
  ];

  const CRITICAL_SELECTORS = [
    '.game-grid',
    '.game-area',
    '.game-grid-container',
    '.game-container',
    '.pieces-container',
    '.special-actions'
  ];

  function getSelector(el) {
    if (el.id) return `#${el.id}`;
    if (el.className && typeof el.className === 'string') {
      return '.' + el.className.trim().split(/\s+/).join('.');
    }
    return el.tagName.toLowerCase();
  }

  function debugLayout() {
    console.group('%c🎯 LAYOUT DEBUG', 'font-size: 14px; font-weight: bold; color: #4CAF50;');

    // Environment info
    console.log('%c📍 Environment:', 'font-weight: bold;', {
      href: window.location.href,
      isGitHubPages: window.location.hostname.includes('github.io'),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      },
      isMobile: window.innerWidth <= 768
    });

    // CSS Variables check
    console.group('%c🎨 CSS Variables', 'font-weight: bold;');
    const rootStyles = getComputedStyle(document.documentElement);
    const varsStatus = {};

    CSS_VARS.forEach(varName => {
      const value = rootStyles.getPropertyValue(varName).trim();
      varsStatus[varName] = value || '(empty)';

      if (!value) {
        console.error(`❌ ${varName} is EMPTY – layout will break!`);
      } else if (value === '0' || value === '0px') {
        console.error(`❌ ${varName} is ZERO (${value}) – grid will collapse!`);
      } else {
        console.log(`✅ ${varName}: ${value}`);
      }
    });
    console.groupEnd();

    // Critical elements check
    console.group('%c📏 Element Dimensions', 'font-weight: bold;');
    
    CRITICAL_SELECTORS.forEach(selector => {
      const el = document.querySelector(selector);
      
      if (!el) {
        console.warn(`⚠️ ${selector} not found in DOM`);
        return;
      }

      const rect = el.getBoundingClientRect();
      const styles = getComputedStyle(el);
      
      const info = {
        width: rect.width,
        height: rect.height,
        display: styles.display,
        position: styles.position,
        visibility: styles.visibility,
        opacity: styles.opacity
      };

      if (rect.width === 0 || rect.height === 0) {
        console.error(`❌ COLLAPSED: ${selector}`, info);
        console.error(`   → Parent: ${getSelector(el.parentElement)}`);
        console.error(`   → Check: width/height CSS, display property, or parent constraints`);
      } else if (rect.width < 50 || rect.height < 50) {
        console.warn(`⚠️ TINY: ${selector}`, info);
      } else {
        console.log(`✅ ${selector}:`, info);
      }
    });
    console.groupEnd();

    // Check if mobile CSS is loaded
    console.group('%c📱 Mobile CSS Check', 'font-weight: bold;');
    const mobileSheets = [...document.styleSheets].filter(sheet => {
      try {
        return sheet.href && sheet.href.includes('mobile');
      } catch (e) {
        return false;
      }
    });

    if (window.innerWidth <= 768) {
      if (mobileSheets.length > 0) {
        console.log('✅ Mobile stylesheet loaded:', mobileSheets.map(s => s.href));
      } else {
        console.error('❌ Mobile stylesheet NOT loaded but viewport is mobile width!');
      }
    } else {
      console.log('ℹ️ Desktop viewport – mobile CSS check skipped');
    }
    console.groupEnd();

    console.groupEnd(); // End LAYOUT DEBUG
  }

  function debugOverflow() {
    console.group('%c📦 OVERFLOW DEBUG', 'font-size: 14px; font-weight: bold; color: #FF9800;');

    const viewportWidth = document.documentElement.clientWidth;
    const bodyScrollWidth = document.body.scrollWidth;

    console.log('Viewport width:', viewportWidth);
    console.log('Body scroll width:', bodyScrollWidth);

    if (bodyScrollWidth > viewportWidth) {
      console.error(`❌ HORIZONTAL SCROLL DETECTED: body is ${bodyScrollWidth - viewportWidth}px wider than viewport`);
    } else {
      console.log('✅ No horizontal scroll on body');
    }

    // Find all overflowing elements
    const allElements = document.querySelectorAll('body *');
    const offenders = [];

    allElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      
      // Check if element extends beyond viewport
      if (rect.right > viewportWidth + 1 || rect.left < -1) {
        offenders.push({
          element: el,
          selector: getSelector(el),
          rect: {
            left: rect.left,
            right: rect.right,
            width: rect.width
          },
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          overflow: {
            left: rect.left < 0 ? Math.abs(rect.left) : 0,
            right: rect.right > viewportWidth ? rect.right - viewportWidth : 0
          }
        });
      }
    });

    if (offenders.length === 0) {
      console.log('✅ No elements overflow beyond viewport');
    } else {
      console.warn(`⚠️ ${offenders.length} elements overflow:`);
      
      // Group by overflow amount (worst first)
      offenders
        .sort((a, b) => (b.overflow.left + b.overflow.right) - (a.overflow.left + a.overflow.right))
        .slice(0, 20) // Limit to top 20
        .forEach((item, i) => {
          console.warn(`${i + 1}. ${item.selector}`, {
            overflowLeft: item.overflow.left.toFixed(1) + 'px',
            overflowRight: item.overflow.right.toFixed(1) + 'px',
            elementWidth: item.rect.width.toFixed(1) + 'px',
            position: `left: ${item.rect.left.toFixed(1)}, right: ${item.rect.right.toFixed(1)}`
          });
        });

      if (offenders.length > 20) {
        console.warn(`... and ${offenders.length - 20} more elements`);
      }
    }

    console.groupEnd();
  }

  function debugAll() {
    console.clear();
    console.log('%c🔍 BLOKUS LAYOUT DEBUGGER', 'font-size: 18px; font-weight: bold; color: #2196F3; background: #E3F2FD; padding: 8px 16px; border-radius: 4px;');
    console.log('Timestamp:', new Date().toISOString());
    console.log('');
    
    debugLayout();
    console.log('');
    debugOverflow();
    
    console.log('');
    console.log('%c💡 TIP: Run window.debugLayout() or window.debugOverflow() anytime', 'color: #666; font-style: italic;');
  }

  // Auto-run on load
  if (document.readyState === 'complete') {
    setTimeout(debugAll, 100);
  } else {
    window.addEventListener('load', () => setTimeout(debugAll, 100));
  }

  // Run on resize (debounced)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      console.log('%c🔄 Resize detected – re-running debug...', 'color: #666;');
      debugAll();
    }, 500);
  });

  // Expose globally
  window.debugLayout = debugLayout;
  window.debugOverflow = debugOverflow;
  window.debugAll = debugAll;

  console.log('%c📌 Debug helpers loaded: debugLayout(), debugOverflow(), debugAll()', 'color: #4CAF50;');
})();
