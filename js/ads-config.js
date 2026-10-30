/**
 * Mini Game Arcade - Centralized Google AdSense Configuration
 * 
 * Non-secret client-side configuration for AdSense Publisher ID and manual Ad Slot IDs.
 * In Preparation Mode: 'enabled' is set to false and slots are empty until ad units
 * are created in the Google AdSense console and configured by the site administrator.
 */

(function (window) {
  'use strict';

  var DEFAULT_CONFIG = {
    // Official AdSense Publisher Client ID
    client: 'ca-pub-6654460587836639',

    // Master toggle: Set to true once AdSense approves your domain and ad slots are active
    enabled: false,

    // Debug outline: Only renders on localhost when debug is true, never in production
    debug: false,

    // Manual Ad Slot IDs (Create in AdSense -> Ads -> By ad unit -> Display ad)
    slots: {
      homeTop: '',     // ADSENSE_HOME_TOP_SLOT: Responsive leaderboard below Hero
      homeList: '',    // ADSENSE_HOME_LIST_SLOT: Responsive display banner below Game Grid
      gameBottom: ''   // ADSENSE_GAME_BOTTOM_SLOT: Bottom banner below Game Controls & FAQs
    }
  };

  // Allow runtime override via window.ARCADE_ADS_OVERRIDE if supplied
  var overrides = window.ARCADE_ADS_OVERRIDE || {};
  window.ADSENSE_CONFIG = Object.assign({}, DEFAULT_CONFIG, overrides);

})(typeof window !== 'undefined' ? window : this);
