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
   * Complete 15-level dynamic raster artwork asset map
   * Every level has its dedicated high-resolution painterly WebP environment illustration.
   */
  const LEVEL_ASSET_MAP = {
    // World 1: The Old Library
    'lib_1': '/games/hidden-hunt/assets/the-old-library.webp',
    'lib_2': '/games/hidden-hunt/assets/library-forgotten-bookshelf.webp',
    'lib_3': '/games/hidden-hunt/assets/library-collectors-desk.webp',
    'lib_4': '/games/hidden-hunt/assets/library-secret-archive.webp',
    'lib_5': '/games/hidden-hunt/assets/library-locked-study.webp',

    // World 2: Mystery Forest
    'for_1': '/games/hidden-hunt/assets/mystery-forest.webp',
    'for_2': '/games/hidden-hunt/assets/forest-mushroom-garden.webp',
    'for_3': '/games/hidden-hunt/assets/forest-hidden-waterfall.webp',
    'for_4': '/games/hidden-hunt/assets/forest-forgotten-treehouse.webp',
    'for_5': '/games/hidden-hunt/assets/forest-enchanted-grove.webp',

    // World 3: Pirate's Treasure
    'pir_1': '/games/hidden-hunt/assets/pirate-cabin.webp',
    'pir_2': '/games/hidden-hunt/assets/pirate-treasure-deck.webp',
    'pir_3': '/games/hidden-hunt/assets/pirate-captains-quarters.webp',
    'pir_4': '/games/hidden-hunt/assets/pirate-forgotten-island.webp',
    'pir_5': '/games/hidden-hunt/assets/pirate-treasure-chamber.webp'
  };

  /**
   * Resolves the raster artwork path for a given world & level
   */
  function getSceneImageSource(worldId, levelId) {
    if (levelId && LEVEL_ASSET_MAP[levelId]) {
      return LEVEL_ASSET_MAP[levelId];
    }
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
          <animate attributeName="opacity" values="0.1;0.45;0.1" dur="4.8s" repeatCount="indefinite" />
        </circle>
      </g>
    `;
  }

  /**
   * Builds the complete SVG viewport with painterly raster background,
   * atmospheric lighting, and high-precision interactive discovery hitboxes.
   */
  function renderScene(worldId, levelId, objects, foundObjectIds) {
    const imgSrc = getSceneImageSource(worldId, levelId);
    const foundSet = new Set(foundObjectIds || []);

    // Generate discovery target zones
    const targetElements = (objects || []).map(obj => {
      const isFound = foundSet.has(obj.id);
      const cx = Math.round(obj.x * SCENE_WIDTH);
      const cy = Math.round(obj.y * SCENE_HEIGHT);
      const radius = Math.round((obj.radius || 0.05) * SCENE_WIDTH);

      return `
        <g class="hh-target-zone ${isFound ? 'is-found' : ''}" 
           data-object-id="${obj.id}" 
           data-name="${obj.name}"
           role="button" 
           tabindex="${isFound ? '-1' : '0'}"
           aria-label="${isFound ? obj.name + ' (Found)' : obj.name}"
           aria-disabled="${isFound}">
          <!-- Invisible high-precision clickable area -->
          <circle class="hh-hit-area" 
                  cx="${cx}" 
                  cy="${cy}" 
                  r="${radius}" 
                  fill="rgba(0,0,0,0.001)" 
                  cursor="pointer" />
          
          <!-- Animated Golden Halo & Sparkles on Discovery -->
          <g class="hh-found-marker" opacity="${isFound ? '1' : '0'}">
            <circle cx="${cx}" cy="${cy}" r="${radius + 10}" 
                    fill="none" stroke="#ffd166" stroke-width="4" stroke-dasharray="8 4" opacity="0.85">
              <animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="8s" repeatCount="indefinite" />
            </circle>
            <circle cx="${cx}" cy="${cy}" r="${radius}" 
                    fill="none" stroke="#d5ff55" stroke-width="3" opacity="0.9" />
            <circle cx="${cx}" cy="${cy}" r="6" fill="#ffd166" />
          </g>

          <!-- Hint Pulse Marker (toggled via active-hint class) -->
          <g class="hh-hint-marker" display="none">
            <circle cx="${cx}" cy="${cy}" r="${radius + 15}" fill="none" stroke="#38bdf8" stroke-width="5" opacity="0.9">
              <animate attributeName="r" values="${radius + 5};${radius + 35};${radius + 5}" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.1;1" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="${cx}" cy="${cy}" r="${radius}" fill="rgba(56, 189, 248, 0.25)" />
          </g>
        </g>
      `;
    }).join('\n');

    return `
      <svg id="hh-scene-svg" 
           viewBox="0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}" 
           preserveAspectRatio="xMidYMid slice" 
           xmlns="http://www.w3.org/2000/svg"
           role="img"
           aria-label="Hidden Hunt Scene: Find hidden objects in the scene">
        <defs>
          <filter id="cinematic-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.6" />
          </filter>
        </defs>

        <!-- Base Masterpiece Painterly Background Image -->
        <image id="hh-master-bg" 
               href="${imgSrc}" 
               x="0" 
               y="0" 
               width="${SCENE_WIDTH}" 
               height="${SCENE_HEIGHT}" 
               preserveAspectRatio="xMidYMid slice" />

        <!-- Atmospheric dynamic lighting overlay -->
        ${renderAtmosphere(worldId)}

        <!-- Interactive Discovery Target Zones -->
        <g id="hh-targets-group" class="hh-targets-layer">
          ${targetElements}
        </g>
      </svg>
    `;
  }

  exports.SCENE_WIDTH = SCENE_WIDTH;
  exports.SCENE_HEIGHT = SCENE_HEIGHT;
  exports.getSceneImageSource = getSceneImageSource;
  exports.renderScene = renderScene;

})(typeof exports === 'undefined' ? (window.HiddenHuntScenes = {}) : exports);
