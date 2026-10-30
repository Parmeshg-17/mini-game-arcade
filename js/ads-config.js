/**
 * Mini Game Arcade - Centralized Google AdSense Configuration
 * 
 * Non-secret client-side configuration for AdSense Publisher ID and manual Ad Slot IDs.
 * Fully configured with active production slot units.
 */

(function (window) {
  'use strict';

  var DEFAULT_CONFIG = {
    // Official AdSense Publisher Client ID
    client: 'ca-pub-6654460587836639',

    // Master toggle: Enabled with active AdSense display ad slots
    enabled: true,

    // Debug outline: Only renders on localhost when debug is true, never in production
    debug: false,

    // Configured Ad Slot IDs
    slots: {
      homeTop: '9639138053',     // Home Top Leaderboard (Responsive Leaderboard below Hero)
      homeList: '6863754725',    // Home Games Feed Banner (Responsive display banner below Game Grid)
      gameBottom: '2158222958'   // Game Page Bottom Unit (Bottom banner below Game Controls & FAQs)
    }
  };

  // Allow runtime override via window.ARCADE_ADS_OVERRIDE if supplied
  var overrides = window.ARCADE_ADS_OVERRIDE || {};
  window.ADSENSE_CONFIG = Object.assign({}, DEFAULT_CONFIG, overrides);

})(typeof window !== 'undefined' ? window : this);
