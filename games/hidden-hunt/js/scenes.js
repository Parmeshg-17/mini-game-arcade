/**
 * Hidden Hunt — Masterpiece Environment Scene Art Director & Interactive Layer
 * Renders high-resolution painterly 2D environment background illustrations (1920x1080, 16:9)
 * with atmospheric depth lighting, natural shadows, particles, and calibrated interactive discovery layers.
 */
(function(exports) {
  'use strict';

  const SCENE_WIDTH = 1920;
  const SCENE_HEIGHT = 1080;

  /**
   * Resolves the raster artwork path for a given world
   */
  function getSceneImageSource(worldId) {
    if (worldId === 'forest') {
      return '/games/hidden-hunt/assets/mystery-forest.webp';
    }
    if (worldId === 'pirate') {
      return '/games/hidden-hunt/assets/pirate-cabin.webp';
    }
    return '/games/hidden-hunt/assets/the-old-library.webp';
  }

  /**
   * Renders atmospheric ambient motion and lighting layers
   */
  function renderAtmosphere(worldId) {
    if (worldId === 'forest') {
      return `
        <!-- Mystery Forest Atmosphere: Fireflies & Twilight Canopy Rays -->
        <g class="hh-atmosphere-layer" pointer-events="none">
          <!-- Soft Fairy Fireflies -->
          <circle cx="280" cy="420" r="3" fill="#ffd166" opacity="0.8">
            <animate attributeName="opacity" values="0.2;0.9;0.2" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="cy" values="420;410;420" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="430" cy="510" r="2.5" fill="#38bdf8" opacity="0.7">
            <animate attributeName="opacity" values="0.3;0.85;0.3" dur="3.1s" repeatCount="indefinite" />
          </circle>
          <circle cx="790" cy="380" r="3" fill="#ffd166" opacity="0.85">
            <animate attributeName="opacity" values="0.1;0.95;0.1" dur="2.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="1480" cy="440" r="3.2" fill="#d5ff55" opacity="0.75">
            <animate attributeName="opacity" values="0.2;0.9;0.2" dur="3.5s" repeatCount="indefinite" />
          </circle>
        </g>
      `;
    }

    if (worldId === 'pirate') {
      return `
        <!-- Pirate's Treasure Atmosphere: Swinging Lantern Warmth & Sea Glimmer -->
        <g class="hh-atmosphere-layer" pointer-events="none">
          <radialGradient id="lantern-glow-left" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffb703" stop-opacity="0.28" />
            <stop offset="60%" stop-color="#fb8500" stop-opacity="0.10" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
          <circle cx="635" cy="200" r="180" fill="url(#lantern-glow-left)">
            <animate attributeName="opacity" values="0.8;1.0;0.8" dur="2.8s" repeatCount="indefinite" />
          </circle>
          <radialGradient id="lantern-glow-right" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffb703" stop-opacity="0.28" />
            <stop offset="60%" stop-color="#fb8500" stop-opacity="0.10" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
          <circle cx="1485" cy="205" r="180" fill="url(#lantern-glow-right)">
            <animate attributeName="opacity" values="1.0;0.75;1.0" dur="3.2s" repeatCount="indefinite" />
          </circle>
        </g>
      `;
    }

    // Default: The Old Library
    return `
      <!-- The Old Library Atmosphere: Hearth Fire Embers & Ambient Dust Motes -->
      <g class="hh-atmosphere-layer" pointer-events="none">
        <!-- Hearth Warmth Breathing Pulse -->
        <radialGradient id="library-hearth-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ff7b00" stop-opacity="0.26" />
          <stop offset="50%" stop-color="#cc4400" stop-opacity="0.12" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
        <circle cx="915" cy="690" r="160" fill="url(#library-hearth-glow)">
          <animate attributeName="opacity" values="0.85;1.15;0.85" dur="3s" repeatCount="indefinite" />
          <animate attributeName="r" values="150;170;150" dur="3s" repeatCount="indefinite" />
        </circle>

        <!-- Subtle Floating Dust Particles drifting in the light -->
        <circle cx="1080" cy="520" r="2.2" fill="#ffd166" opacity="0.45">
          <animate attributeName="cy" values="520;505;520" dur="4.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur="4.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="860" cy="420" r="1.8" fill="#ffd166" opacity="0.4">
          <animate attributeName="cy" values="420;435;420" dur="5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.15;0.5;0.15" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="1320" cy="610" r="2.0" fill="#f4f2e9" opacity="0.35">
          <animate attributeName="cy" values="610;595;610" dur="4.8s" repeatCount="indefinite" />
        </circle>
      </g>
    `;
  }

  /**
   * Builds the complete SVG container embedding the high-res painterly background
   * and calibrated discovery overlay.
   */
  function buildSceneSvg(world, level, foundIds = [], hintTargetId = null) {
    const foundSet = new Set(foundIds);
    const imgSrc = getSceneImageSource(world.id);
    const atmosphereMarkup = renderAtmosphere(world.id);

    // Target object discovery markers (rendered over found items)
    const targetsMarkup = level.objects.map(obj => {
      const isFound = foundSet.has(obj.id);
      const cx = Math.round(obj.x * SCENE_WIDTH);
      const cy = Math.round(obj.y * SCENE_HEIGHT);
      const r = Math.max(34, Math.round((obj.radius || 0.05) * SCENE_WIDTH));

      return `
        <g id="obj-${obj.id}" class="scene-target-marker ${isFound ? 'found' : ''}" transform="translate(${cx}, ${cy})" style="cursor: pointer;">
          <!-- Hitbox Target Area (transparent) -->
          <circle cx="0" cy="0" r="${r}" fill="transparent" />

          <!-- Discovery Visual Confirmation (Shown when object is claimed) -->
          <g class="discovery-ring" style="display: ${isFound ? 'block' : 'none'}; pointer-events: none;">
            <!-- Outer Golden Glow Ring -->
            <circle cx="0" cy="0" r="${r}" fill="none" stroke="#d5ff55" stroke-width="3" filter="url(#hh-glow-lime)" opacity="0.9" />
            <!-- Inner Soft Fill Tint -->
            <circle cx="0" cy="0" r="${r}" fill="rgba(213, 255, 85, 0.12)" />
            <!-- Verified Checkmark Badge -->
            <circle cx="${r * 0.7}" cy="-${r * 0.7}" r="15" fill="#161411" stroke="#d5ff55" stroke-width="2" />
            <text x="${r * 0.7}" y="-${r * 0.7 - 5}" font-family="Space Grotesk, sans-serif" font-size="14" font-weight="900" fill="#d5ff55" text-anchor="middle">✓</text>
          </g>
        </g>
      `;
    }).join('');

    return `
      <svg id="hidden-hunt-svg" viewBox="0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}" class="hh-scene-svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <defs>
          <filter id="hh-glow-gold" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="hh-glow-lime" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- High-Resolution Painterly Environment Artwork -->
        <image id="scene-bg-img" href="${imgSrc}" x="0" y="0" width="${SCENE_WIDTH}" height="${SCENE_HEIGHT}" preserveAspectRatio="xMidYMid slice" />

        <!-- Atmospheric Depth & Particle Layer -->
        ${atmosphereMarkup}

        <!-- Interactive Discovery Layer -->
        <g id="scene-targets">
          ${targetsMarkup}
        </g>

        <!-- Hint Marker Animated Beacon Overlay -->
        <g id="scene-hint-pin" style="display: none; pointer-events: none;">
          <!-- Pulsating Outer Golden Spotlight -->
          <circle id="hint-ring" cx="0" cy="0" r="50" fill="none" stroke="#e6b85c" stroke-width="4" filter="url(#hh-glow-gold)">
            <animate attributeName="r" values="30;70;30" dur="1.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite" />
          </circle>
          <!-- Pulsing Target Crosshair Pin -->
          <circle cx="0" cy="0" r="8" fill="#ffd166" filter="url(#hh-glow-gold)">
            <animate attributeName="r" values="6;10;6" dur="0.7s" repeatCount="indefinite" />
          </circle>
          <polygon id="hint-arrow" points="0,-48 -14,-72 14,-72" fill="#ffd166" filter="url(#hh-glow-gold)">
            <animate attributeName="transform" type="translate" values="0,0; 0,-12; 0,0" dur="1.2s" repeatCount="indefinite" />
          </polygon>
        </g>
      </svg>
    `;
  }

  exports.SCENE_WIDTH = SCENE_WIDTH;
  exports.SCENE_HEIGHT = SCENE_HEIGHT;
  exports.getSceneImageSource = getSceneImageSource;
  exports.buildSceneSvg = buildSceneSvg;

})(typeof exports === 'undefined' ? (window.HiddenHuntScenes = {}) : exports);
