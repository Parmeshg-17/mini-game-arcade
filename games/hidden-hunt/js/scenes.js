/**
 * Hidden Hunt — Procedural SVG Scene Art Director
 * Generates 15 illustrated vector game environments (1000x600 viewBox)
 * with multi-layered environmental depth and exact visual object placement.
 */
(function(exports) {
  'use strict';

  function escapeXml(str) {
    return String(str).replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[m];
    });
  }

  // --- World 1 Scene Generator: The Old Library ---
  function renderLibraryScene(level) {
    const isStudy = level.id === 'lib_5' || level.id === 'lib_3';
    return `
      <!-- Base Library Wallpaper & Wooden Flooring -->
      <rect width="1000" height="600" fill="#1b140e" />
      <rect y="420" width="1000" height="180" fill="#2a1e15" stroke="#3d2a1d" stroke-width="2" />
      <!-- Floor Planks -->
      <g stroke="#1a110a" stroke-width="2" opacity="0.6">
        <line x1="0" y1="460" x2="1000" y2="460" />
        <line x1="0" y1="500" x2="1000" y2="500" />
        <line x1="0" y1="540" x2="1000" y2="540" />
        <line x1="250" y1="420" x2="250" y2="460" /><line x1="600" y1="460" x2="600" y2="500" /><line x1="380" y1="500" x2="380" y2="540" />
      </g>
      
      <!-- Stately Arched Library Windows with Light Beams -->
      <g opacity="0.25">
        <path d="M 420,40 Q 500,0 580,40 L 580,320 L 420,320 Z" fill="#ffd166" />
        <line x1="500" y1="10" x2="500" y2="320" stroke="#ffd166" stroke-width="3" />
        <line x1="420" y1="160" x2="580" y2="160" stroke="#ffd166" stroke-width="3" />
        <!-- Sunlight Cone -->
        <polygon points="420,40 580,40 850,600 200,600" fill="url(#hh-sunbeam-grad)" opacity="0.4" />
      </g>

      <!-- Grand Bookshelves on Left & Right Flanks -->
      <g fill="#332217" stroke="#4d3324" stroke-width="2">
        <!-- Left Tall Shelf -->
        <rect x="30" y="50" width="220" height="420" rx="4" />
        <rect x="40" y="60" width="200" height="85" fill="#20150d" />
        <rect x="40" y="160" width="200" height="85" fill="#20150d" />
        <rect x="40" y="260" width="200" height="85" fill="#20150d" />
        <rect x="40" y="360" width="200" height="90" fill="#20150d" />

        <!-- Right Tall Shelf -->
        <rect x="750" y="50" width="220" height="420" rx="4" />
        <rect x="760" y="60" width="200" height="85" fill="#20150d" />
        <rect x="760" y="160" width="200" height="85" fill="#20150d" />
        <rect x="760" y="260" width="200" height="85" fill="#20150d" />
        <rect x="760" y="360" width="200" height="90" fill="#20150d" />
      </g>

      <!-- Books on Shelves (Decorative) -->
      <g opacity="0.85">
        <!-- Left Books -->
        <rect x="48" y="75" width="16" height="68" fill="#8b3a3a" rx="2" />
        <rect x="66" y="70" width="20" height="73" fill="#2a4d3a" rx="2" />
        <rect x="88" y="78" width="18" height="65" fill="#b8860b" rx="2" />
        <rect x="108" y="72" width="22" height="71" fill="#4a3b68" rx="2" />
        <rect x="132" y="80" width="15" height="63" fill="#8b5a2b" rx="2" />

        <!-- Right Books -->
        <rect x="768" y="175" width="20" height="68" fill="#3a5a78" rx="2" />
        <rect x="790" y="170" width="18" height="73" fill="#8b3a3a" rx="2" />
        <rect x="810" y="180" width="22" height="63" fill="#b8860b" rx="2" />
        <rect x="834" y="172" width="19" height="71" fill="#2a4d3a" rx="2" />
        <rect x="855" y="176" width="24" height="67" fill="#683a4b" rx="2" />
      </g>

      <!-- Center Heavy Carved Mahogany Library Table -->
      <g>
        <path d="M 220,380 L 780,380 L 820,490 L 180,490 Z" fill="#3d281a" stroke="#523824" stroke-width="3" />
        <rect x="230" y="490" width="30" height="90" fill="#2c1d13" />
        <rect x="740" y="490" width="30" height="90" fill="#2c1d13" />
        <!-- Table Rim Gold Inlay -->
        <line x1="200" y1="480" x2="800" y2="480" stroke="#ffd166" stroke-width="1.5" opacity="0.6" />
      </g>

      <!-- Hanging Brass Chandelier -->
      <g transform="translate(500, 30)">
        <line x1="0" y1="0" x2="0" y2="70" stroke="#b8860b" stroke-width="3" />
        <ellipse cx="0" cy="70" rx="80" ry="16" fill="none" stroke="#ffd166" stroke-width="3" />
        <circle cx="-50" cy="65" r="4" fill="#ffd166" filter="url(#hh-glow)" />
        <circle cx="0" cy="68" r="5" fill="#ffd166" filter="url(#hh-glow)" />
        <circle cx="50" cy="65" r="4" fill="#ffd166" filter="url(#hh-glow)" />
      </g>
    `;
  }

  // --- World 2 Scene Generator: Mystery Forest ---
  function renderForestScene(level) {
    return `
      <!-- Deep Twilight Forest Backdrop -->
      <rect width="1000" height="600" fill="#0d160f" />
      <radialGradient id="forest-mist" cx="50%" cy="30%" r="60%">
        <stop offset="0%" stop-color="#1e3d29" stop-opacity="0.8" />
        <stop offset="60%" stop-color="#0f2115" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#0a120b" stop-opacity="0.9" />
      </radialGradient>
      <rect width="1000" height="600" fill="url(#forest-mist)" />

      <!-- Distant Moonlit Silhouette Trees -->
      <g fill="#081009" opacity="0.6">
        <path d="M 0,380 Q 80,120 160,380 L 160,500 L 0,500 Z" />
        <path d="M 300,420 Q 380,80 460,420 L 460,520 L 300,520 Z" />
        <path d="M 680,400 Q 760,100 840,400 L 840,510 L 680,510 Z" />
      </g>

      <!-- Waterfall Stream in Center-Left (if applicable) -->
      <path d="M 440,240 Q 470,360 430,480 Q 400,540 450,600 L 580,600 Q 520,530 540,460 Q 560,340 520,240 Z" fill="#1b4542" opacity="0.75" />
      <g stroke="#38bdf8" stroke-width="1.5" opacity="0.5" stroke-dasharray="8,6">
        <line x1="480" y1="260" x2="470" y2="480" />
        <line x1="500" y1="250" x2="490" y2="490" />
      </g>

      <!-- Mighty Ancient Twisted Oak Trees (Foreground Left & Right) -->
      <g fill="#211812" stroke="#140f0b" stroke-width="3">
        <!-- Left Tree Trunk -->
        <path d="M -20,600 C 60,420 40,220 120,60 C 130,20 90,-20 80,-40 L -40,-40 Z" />
        <!-- Giant Roots -->
        <path d="M 40,520 Q 180,550 280,600 L 40,600 Z" fill="#261c15" />

        <!-- Right Tree Trunk & Overhanging Branch -->
        <path d="M 1020,600 C 940,450 960,240 880,50 C 870,10 920,-20 940,-40 L 1040,-40 Z" />
        <path d="M 880,180 Q 680,160 550,220 Q 560,250 680,210 Q 820,220 920,260 Z" fill="#241a13" />
      </g>

      <!-- Rich Forest Floor & Moss Mounds -->
      <path d="M 0,480 Q 250,440 500,470 Q 750,450 1000,490 L 1000,600 L 0,600 Z" fill="#152617" stroke="#223b25" stroke-width="2" />
      <ellipse cx="260" cy="540" rx="90" ry="25" fill="#1f3822" />
      <ellipse cx="740" cy="520" rx="110" ry="30" fill="#1f3822" />

      <!-- Glowing Fairy Fireflies & Spores -->
      <g fill="#d5ff55" filter="url(#hh-glow)" opacity="0.8">
        <circle cx="280" cy="220" r="2.5" />
        <circle cx="340" cy="180" r="3" />
        <circle cx="620" cy="290" r="2.5" />
        <circle cx="710" cy="230" r="3.5" />
        <circle cx="820" cy="340" r="2" />
        <circle cx="190" cy="380" r="2.5" />
      </g>
    `;
  }

  // --- World 3 Scene Generator: Pirate's Treasure ---
  function renderPirateScene(level) {
    return `
      <!-- Galleon Timber Hull / Tropical Cavern Base -->
      <rect width="1000" height="600" fill="#11151c" />

      <!-- Porthole Window View of Ocean Sunset -->
      <g transform="translate(500, 150)">
        <circle cx="0" cy="0" r="80" fill="#ff784f" />
        <!-- Ocean Horizon & Sun -->
        <circle cx="0" cy="-10" r="30" fill="#ffd166" />
        <path d="M -80,10 Q 0,0 80,10 L 80,80 L -80,80 Z" fill="#143642" />
        <!-- Brass Rim Ring & Rivets -->
        <circle cx="0" cy="0" r="80" fill="none" stroke="#b8860b" stroke-width="12" />
        <circle cx="0" cy="0" r="74" fill="none" stroke="#2b1f09" stroke-width="2" />
        <circle cx="-65" cy="0" r="3" fill="#2b1f09" /><circle cx="65" cy="0" r="3" fill="#2b1f09" /><circle cx="0" cy="-65" r="3" fill="#2b1f09" /><circle cx="0" cy="65" r="3" fill="#2b1f09" />
      </g>

      <!-- Ship Cabin Heavy Oak Timber Walls -->
      <g stroke="#261b12" stroke-width="3">
        <rect x="0" y="0" width="180" height="600" fill="#362519" />
        <rect x="820" y="0" width="180" height="600" fill="#362519" />
        <!-- Wall Planks Lines -->
        <line x1="0" y1="120" x2="180" y2="120" stroke="#1f140c" stroke-width="2" />
        <line x1="0" y1="240" x2="180" y2="240" stroke="#1f140c" stroke-width="2" />
        <line x1="0" y1="360" x2="180" y2="360" stroke="#1f140c" stroke-width="2" />
        <line x1="820" y1="120" x2="1000" y2="120" stroke="#1f140c" stroke-width="2" />
        <line x1="820" y1="240" x2="1000" y2="240" stroke="#1f140c" stroke-width="2" />
        <line x1="820" y1="360" x2="1000" y2="360" stroke="#1f140c" stroke-width="2" />
      </g>

      <!-- Rigging Ropes & Hanging Lantern -->
      <g stroke="#8c6a46" stroke-width="2.5" opacity="0.7">
        <line x1="120" y1="0" x2="260" y2="380" />
        <line x1="150" y1="0" x2="290" y2="380" />
        <line x1="880" y1="0" x2="740" y2="380" />
        <line x1="850" y1="0" x2="710" y2="380" />
      </g>

      <!-- Deck Floor & Persian War Carpet -->
      <rect y="400" width="1000" height="200" fill="#2d1f15" stroke="#1d130c" stroke-width="3" />
      <!-- Ornate Rug -->
      <ellipse cx="500" cy="510" rx="360" ry="70" fill="#661a1a" stroke="#ffd166" stroke-width="2" stroke-dasharray="10,5" />
      <ellipse cx="500" cy="510" rx="320" ry="55" fill="#4d1212" />

      <!-- Captain's Solid Oak Table -->
      <path d="M 240,360 L 760,360 L 800,480 L 200,480 Z" fill="#422a1c" stroke="#5e3c28" stroke-width="3" />
      <rect x="220" y="480" width="35" height="100" fill="#2b1a10" />
      <rect x="745" y="480" width="35" height="100" fill="#2b1a10" />
    `;
  }

  // --- Specific Target Object Vector Renderers ---
  function renderTargetObjectGraphic(obj, cx, cy) {
    const id = obj.id;
    switch (id) {
      // Library Targets
      case 'key':
      case 'keyring':
        return `
          <g transform="translate(${cx}, ${cy}) rotate(-35)" filter="url(#hh-glow)">
            <circle cx="0" cy="0" r="11" fill="none" stroke="#ffd166" stroke-width="3.5" />
            <circle cx="0" cy="0" r="5" fill="none" stroke="#ffd166" stroke-width="1.5" />
            <rect x="-2" y="11" width="4" height="26" fill="#ffd166" rx="1" />
            <rect x="2" y="27" width="9" height="4" fill="#ffd166" />
            <rect x="2" y="33" width="7" height="4" fill="#ffd166" />
          </g>
        `;
      case 'hourglass':
        return `
          <g transform="translate(${cx}, ${cy})">
            <rect x="-14" y="-20" width="28" height="5" fill="#b8860b" rx="2" />
            <rect x="-14" y="15" width="28" height="5" fill="#b8860b" rx="2" />
            <path d="M -10,-15 C -10,0 0,-2 0,0 C 0,2 -10,0 -10,15 L 10,15 C 10,0 0,2 0,0 C 0,-2 10,0 10,-15 Z" fill="#ffd166" opacity="0.6" stroke="#b8860b" stroke-width="1.5" />
            <polygon points="-6,12 6,12 0,4" fill="#ffd166" />
          </g>
        `;
      case 'quill':
      case 'feather':
      case 'parrot_feather':
        return `
          <g transform="translate(${cx}, ${cy}) rotate(40)">
            <path d="M 0,20 Q -8,0 0,-26 Q 8,0 0,20 Z" fill="#d5ff55" stroke="#223311" stroke-width="1.5" />
            <line x1="0" y1="20" x2="0" y2="-26" stroke="#ffffff" stroke-width="1.2" />
            <polygon points="0,20 -1.5,28 1.5,28" fill="#ffd166" />
          </g>
        `;
      case 'globe':
      case 'astrolabe':
      case 'sundial':
        return `
          <g transform="translate(${cx}, ${cy})">
            <circle cx="0" cy="0" r="20" fill="#224455" stroke="#b8860b" stroke-width="2.5" />
            <ellipse cx="0" cy="0" rx="20" ry="7" fill="none" stroke="#ffd166" stroke-width="1.5" />
            <line x1="0" y1="-20" x2="0" y2="20" stroke="#ffd166" stroke-width="1.5" />
            <path d="M -24,0 A 24 24 0 0 0 0,24 L 0,32 L -12,32 L 12,32" stroke="#b8860b" stroke-width="2.5" fill="none" />
          </g>
        `;
      case 'book':
      case 'journal':
        return `
          <g transform="translate(${cx}, ${cy}) rotate(-10)">
            <rect x="-16" y="-22" width="32" height="44" rx="3" fill="#2a4d3a" stroke="#ffd166" stroke-width="2" />
            <line x1="-12" y1="-18" x2="12" y2="-18" stroke="#ffd166" stroke-width="1.5" />
            <circle cx="0" cy="0" r="6" fill="none" stroke="#ffd166" stroke-width="1.5" />
          </g>
        `;
      case 'pocket_watch':
      case 'compass':
        return `
          <g transform="translate(${cx}, ${cy})">
            <circle cx="0" cy="0" r="15" fill="#1b2018" stroke="#ffd166" stroke-width="3" />
            <circle cx="0" cy="-17" r="4" fill="none" stroke="#ffd166" stroke-width="2" />
            <line x1="0" y1="0" x2="0" y2="-9" stroke="#d5ff55" stroke-width="2" />
            <line x1="0" y1="0" x2="7" y2="0" stroke="#ff784f" stroke-width="1.5" />
          </g>
        `;
      case 'lens':
      case 'monocular':
      case 'spyglass':
        return `
          <g transform="translate(${cx}, ${cy}) rotate(-45)">
            <circle cx="0" cy="-12" r="14" fill="#38bdf8" opacity="0.6" stroke="#b8860b" stroke-width="3.5" />
            <line x1="0" y1="2" x2="0" y2="28" stroke="#5a381e" stroke-width="4.5" stroke-linecap="round" />
            <line x1="-1" y1="2" x2="-1" y2="7" stroke="#ffd166" stroke-width="5" />
          </g>
        `;
      case 'scroll':
      case 'chart':
      case 'island_map':
        return `
          <g transform="translate(${cx}, ${cy}) rotate(15)">
            <rect x="-24" y="-14" width="48" height="28" rx="4" fill="#f4f2e9" stroke="#b5ad96" stroke-width="1.5" />
            <path d="M -18,-5 Q 0,-10 18,-5 M -18,4 Q 0,0 18,4" stroke="#8a3b3b" stroke-width="1.5" stroke-dasharray="3,2" fill="none" />
            <text x="6" y="7" font-size="10" font-weight="bold" fill="#ff784f">✕</text>
          </g>
        `;

      // Forest Targets
      case 'acorn':
      case 'pinecone':
        return `
          <g transform="translate(${cx}, ${cy})">
            <path d="M -10,-5 Q 0,-15 10,-5 Z" fill="#523924" stroke="#362315" stroke-width="1.5" />
            <line x1="0" y1="-10" x2="0" y2="-17" stroke="#523924" stroke-width="2" />
            <path d="M -9,-5 C -12,12 12,12 9,-5 Z" fill="#ffd166" stroke="#8c6a28" stroke-width="1.5" filter="url(#hh-glow)" />
          </g>
        `;
      case 'lantern':
        return `
          <g transform="translate(${cx}, ${cy})">
            <path d="M -12,-16 L 12,-16 L 15,14 L -15,14 Z" fill="#1f3829" stroke="#ffd166" stroke-width="2" />
            <rect x="-8" y="-12" width="16" height="22" fill="#d5ff55" filter="url(#hh-glow)" opacity="0.9" rx="3" />
            <circle cx="0" cy="-22" r="5" fill="none" stroke="#ffd166" stroke-width="2" />
          </g>
        `;
      case 'butterfly':
      case 'dragonfly':
        return `
          <g transform="translate(${cx}, ${cy})">
            <ellipse cx="-10" cy="-7" rx="9" ry="7" fill="#38bdf8" filter="url(#hh-glow)" />
            <ellipse cx="10" cy="-7" rx="9" ry="7" fill="#38bdf8" filter="url(#hh-glow)" />
            <ellipse cx="-8" cy="6" rx="7" ry="5" fill="#2098cc" />
            <ellipse cx="8" cy="6" rx="7" ry="5" fill="#2098cc" />
            <line x1="0" y1="-14" x2="0" y2="12" stroke="#0f1910" stroke-width="2.5" />
          </g>
        `;
      case 'mushroom':
      case 'toadstool':
        return `
          <g transform="translate(${cx}, ${cy})">
            <rect x="-3" y="0" width="6" height="15" fill="#f4f2e9" rx="2" />
            <path d="M -14,0 Q 0,-20 14,0 Z" fill="#ff784f" filter="url(#hh-glow)" stroke="#c4431d" stroke-width="1.5" />
            <circle cx="-5" cy="-8" r="2" fill="#ffffff" /><circle cx="4" cy="-6" r="2.5" fill="#ffffff" /><circle cx="0" cy="-14" r="1.5" fill="#ffffff" />
          </g>
        `;
      case 'crystal':
      case 'quartz':
      case 'amulet':
        return `
          <g transform="translate(${cx}, ${cy})">
            <polygon points="0,-18 10,-6 6,14 -6,14 -10,-6" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5" filter="url(#hh-glow)" />
            <line x1="0" y1="-18" x2="0" y2="14" stroke="#ffffff" stroke-width="1" opacity="0.8" />
          </g>
        `;

      // Pirate Targets
      case 'hat':
        return `
          <g transform="translate(${cx}, ${cy})">
            <path d="M -24,8 Q 0,-18 24,8 L 18,16 Q 0,0 -18,16 Z" fill="#1b1c1e" stroke="#ffd166" stroke-width="2" />
            <circle cx="0" cy="5" r="4" fill="#ffffff" />
          </g>
        `;
      case 'cutlass':
      case 'pistol':
        return `
          <g transform="translate(${cx}, ${cy}) rotate(25)">
            <path d="M 0,-25 Q 12,0 0,16 L -4,14 Q 6,0 -4,-23 Z" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1.5" />
            <circle cx="0" cy="22" r="5" fill="#b8860b" />
            <path d="M -5,16 Q -12,22 -2,28 L 2,28 Q 12,22 5,16 Z" fill="#ffd166" />
          </g>
        `;
      case 'chest':
        return `
          <g transform="translate(${cx}, ${cy})" filter="url(#hh-glow)">
            <rect x="-24" y="-8" width="48" height="28" rx="4" fill="#523824" stroke="#ffd166" stroke-width="2.5" />
            <path d="M -24,-8 Q 0,-24 24,-8 Z" fill="#69482e" stroke="#ffd166" stroke-width="2.5" />
            <circle cx="0" cy="5" r="4" fill="#ffd166" />
            <line x1="-12" y1="-16" x2="-12" y2="20" stroke="#ffd166" stroke-width="2" />
            <line x1="12" y1="-16" x2="12" y2="20" stroke="#ffd166" stroke-width="2" />
          </g>
        `;
      case 'crown':
      case 'necklace':
      case 'goblet':
      case 'skull':
        return `
          <g transform="translate(${cx}, ${cy})" filter="url(#hh-glow)">
            <polygon points="-16,10 -16,-6 -8,2 0,-10 8,2 16,-6 16,10" fill="#ffd166" stroke="#b8860b" stroke-width="2" />
            <circle cx="0" cy="2" r="3" fill="#ff784f" />
            <circle cx="-9" cy="4" r="2.5" fill="#38bdf8" />
            <circle cx="9" cy="4" r="2.5" fill="#d5ff55" />
          </g>
        `;
      case 'barrel':
      case 'anchor':
      case 'helm':
        return `
          <g transform="translate(${cx}, ${cy})">
            <circle cx="0" cy="0" r="16" fill="none" stroke="#5c3e29" stroke-width="5" />
            <circle cx="0" cy="0" r="7" fill="#ffd166" />
            <line x1="-22" y1="0" x2="22" y2="0" stroke="#5c3e29" stroke-width="4" />
            <line x1="0" y1="-22" x2="0" y2="22" stroke="#5c3e29" stroke-width="4" />
          </g>
        `;

      // Fallback default sparkling curious artifact
      default:
        return `
          <g transform="translate(${cx}, ${cy})" filter="url(#hh-glow)">
            <polygon points="0,-15 12,0 0,15 -12,0" fill="#ffd166" stroke="#d5ff55" stroke-width="2" />
            <circle cx="0" cy="0" r="4" fill="#ffffff" />
          </g>
        `;
    }
  }

  /**
   * Generates complete SVG document markup for a given level
   */
  function buildSceneSvg(world, level, foundIds = []) {
    const foundSet = new Set(foundIds);
    let backdrop = '';

    if (world.id === 'library') {
      backdrop = renderLibraryScene(level);
    } else if (world.id === 'forest') {
      backdrop = renderForestScene(level);
    } else {
      backdrop = renderPirateScene(level);
    }

    // Render target objects
    const targetsMarkup = level.objects.map(obj => {
      const cx = obj.x * 1000;
      const cy = obj.y * 600;
      const isFound = foundSet.has(obj.id);

      return `
        <g id="obj-${obj.id}" data-id="${obj.id}" class="scene-target-group ${isFound ? 'found' : ''}" style="cursor: pointer;">
          <!-- Clickable Transparent Hitbox Detection Pad -->
          <circle cx="${cx}" cy="${cy}" r="${obj.radius * 1000 * 1.3}" fill="transparent" stroke="none" />
          
          <!-- Visual Target Object Artwork -->
          <g class="target-art-wrap ${isFound ? 'art-found' : ''}">
            ${renderTargetObjectGraphic(obj, cx, cy)}
          </g>

          <!-- Discovered Marker Ring -->
          <g class="discovery-ring" style="display: ${isFound ? 'block' : 'none'};">
            <circle cx="${cx}" cy="${cy}" r="${obj.radius * 1000 * 0.9}" fill="none" stroke="#d5ff55" stroke-width="3" filter="url(#hh-glow)" stroke-dasharray="4,3" />
            <circle cx="${cx + 14}" cy="${cy - 14}" r="8" fill="#d5ff55" />
            <text x="${cx + 14}" y="${cy - 11}" font-size="10" font-weight="bold" fill="#0b0d0a" text-anchor="middle">✓</text>
          </g>
        </g>
      `;
    }).join('\n');

    return `
      <svg id="hidden-hunt-svg" viewBox="0 0 1000 600" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="hh-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="hh-sunbeam-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffd166" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#ffd166" stop-opacity="0" />
          </linearGradient>
        </defs>

        <!-- Background Artwork -->
        <g id="scene-backdrop">
          ${backdrop}
        </g>

        <!-- Interactive Target Objects -->
        <g id="scene-targets">
          ${targetsMarkup}
        </g>

        <!-- Hint Marker Overlay Container -->
        <g id="scene-hint-pin" style="display: none; pointer-events: none;">
          <circle id="hint-ring" cx="0" cy="0" r="32" fill="none" stroke="#d5ff55" stroke-width="4" filter="url(#hh-glow)">
            <animate attributeName="r" values="20;45;20" dur="1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1s" repeatCount="indefinite" />
          </circle>
          <polygon id="hint-arrow" points="0,-35 -8,-50 8,-50" fill="#ffd166" filter="url(#hh-glow)">
            <animate attributeName="transform" type="translate" values="0,0; 0,-8; 0,0" dur="1s" repeatCount="indefinite" />
          </polygon>
        </g>
      </svg>
    `;
  }

  exports.buildSceneSvg = buildSceneSvg;

})(typeof exports === 'undefined' ? (window.HiddenHuntScenes = {}) : exports);
