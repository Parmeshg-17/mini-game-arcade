/**
 * Mini Game Arcade - Google AdSense Reusable Ad Controller
 * 
 * Manages policy-compliant display ad unit initialization, duplicate push prevention,
 * responsive containers, and graceful fallback handling in preparation mode.
 */
(function (window, document) {
  'use strict';

  function isProductionHost() {
    var host = window.location.hostname;
    return host !== 'localhost' && host !== '127.0.0.1' && !host.endsWith('.local');
  }

  function initAdUnit(container) {
    if (!container) return;

    var config = window.ADSENSE_CONFIG || {};
    var placement = container.dataset.adPlacement; // 'home-top', 'home-list', 'game-bottom'
    var slotId = container.dataset.adSlot || (config.slots && config.slots[placement]);

    // Safety Check 1: Master switch must be explicitly enabled
    if (!config.enabled) {
      handleDisabledState(container, placement, 'AdSense disabled (Preparation Mode)');
      return;
    }

    // Safety Check 2: Publisher ID must be present and well-formed
    if (!config.client || typeof config.client !== 'string' || !config.client.startsWith('ca-pub-')) {
      handleDisabledState(container, placement, 'Missing or invalid Publisher Client ID');
      return;
    }

    // Safety Check 3: Slot ID must be configured with a non-empty string
    if (!slotId || typeof slotId !== 'string' || slotId.trim() === '') {
      handleDisabledState(container, placement, 'No Slot ID configured for placement: ' + placement);
      return;
    }

    // Safety Check 4: Page eligibility check (never render on 404/error pages)
    if (document.body.classList.contains('error-page') || window.location.pathname === '/404' || window.location.pathname.endsWith('404.html')) {
      container.style.display = 'none';
      return;
    }

    // Safety Check 5: Duplicate initialization prevention
    var ins = container.querySelector('ins.adsbygoogle');
    if (!ins) {
      // Build discrete accessible label
      var label = document.createElement('span');
      label.className = 'arcade-ad-label';
      label.setAttribute('aria-hidden', 'true');
      label.textContent = container.dataset.adLabel || 'ADVERTISEMENT';
      container.appendChild(label);

      // Create responsive <ins> element
      ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.dataset.adClient = config.client;
      ins.dataset.adSlot = slotId.trim();
      ins.dataset.adFormat = container.dataset.adFormat || 'auto';
      ins.dataset.fullWidthResponsive = container.dataset.fullWidthResponsive || 'true';

      container.appendChild(ins);
    }

    // Check if already processed by Google AdSense
    if (ins.dataset.adsbygoogleStatus === 'done' || ins.getAttribute('data-adsbygoogle-status') === 'done') {
      return;
    }

    // Push into AdSense Queue safely with try/catch
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      container.classList.add('arcade-ad-active');
      container.style.display = 'block';
    } catch (err) {
      console.warn('[AdSense] Initialization error for placement (' + placement + '):', err);
    }
  }

  function handleDisabledState(container, placement, reason) {
    var config = window.ADSENSE_CONFIG || {};

    // In local development, if debug mode is explicitly set to true, render a subtle outline indicator
    if (config.debug && !isProductionHost()) {
      container.classList.add('arcade-ad-debug');
      container.innerHTML = '<div class="arcade-ad-debug-inner">' +
        '<span class="arcade-ad-debug-tag">ADSENSE PLACEHOLDER: ' + (placement || 'UNNAMED') + '</span>' +
        '<span class="arcade-ad-debug-reason">' + reason + '</span>' +
        '</div>';
      container.style.display = 'block';
    } else {
      // In production or when debug is false: completely collapse and hide container
      container.style.display = 'none';
      container.setAttribute('aria-hidden', 'true');
    }
  }

  function initAllAdUnits() {
    var containers = document.querySelectorAll('[data-ad-placement]');
    for (var i = 0; i < containers.length; i++) {
      initAdUnit(containers[i]);
    }
  }

  // Run on DOMContentLoaded or immediately if DOM is already ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllAdUnits);
  } else {
    initAllAdUnits();
  }

  // Expose API for dynamic route updates or manual refresh
  window.ArcadeAdUnits = {
    init: initAllAdUnits,
    initUnit: initAdUnit
  };

})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : {});
