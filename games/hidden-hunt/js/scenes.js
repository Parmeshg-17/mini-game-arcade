/**
 * Hidden Hunt — Premium Procedural SVG Scene Art Director
 * Generates rich, atmospheric, painterly 2D vector game environments (1000x600 viewBox)
 * with cinematic lighting, depth layering, antique furniture, and exact target placement.
 */
(function(exports) {
  'use strict';

  // --- World 1 Scene Generator: The Old Library (The Reading Room) ---
  function renderLibraryScene(level) {
    return `
      <!-- Room Base: Deep Walnut Wood Paneling & Vintage Damask Pattern -->
      <rect width="1000" height="600" fill="#130e0a" />
      
      <!-- Upper Wall Wallpaper with Victorian Damask Flourish -->
      <g opacity="0.12" stroke="#e6b85c" stroke-width="1.2" fill="none">
        <path d="M 50,40 Q 100,10 150,40 T 250,40 T 350,40 T 450,40 T 550,40 T 650,40 T 750,40 T 850,40 T 950,40" />
        <path d="M 50,100 Q 100,70 150,100 T 250,100 T 350,100 T 450,100 T 550,100 T 650,100 T 750,100 T 850,100 T 950,100" />
        <path d="M 50,160 Q 100,130 150,160 T 250,160 T 350,160 T 450,160 T 550,160 T 650,160 T 750,160 T 850,160 T 950,160" />
      </g>

      <!-- Wainscoting Lower Wood Wall Rails -->
      <rect y="310" width="1000" height="110" fill="#1e140d" stroke="#362215" stroke-width="2" />
      <g stroke="#120c08" stroke-width="2">
        <line x1="80" y1="310" x2="80" y2="420" />
        <line x1="220" y1="310" x2="220" y2="420" />
        <line x1="420" y1="310" x2="420" y2="420" />
        <line x1="580" y1="310" x2="580" y2="420" />
        <line x1="780" y1="310" x2="780" y2="420" />
        <line x1="920" y1="310" x2="920" y2="420" />
      </g>

      <!-- Center Antique Brick Fireplace with Warm Hearth Glow -->
      <g transform="translate(410, 150)">
        <!-- Fireplace Outer Hearth Mantle (Stone & Carved Mahogany) -->
        <path d="M 0,270 L 0,30 L -15,30 L -15,10 L 195,10 L 195,30 L 180,30 L 180,270 Z" fill="#2d1c14" stroke="#4a2f22" stroke-width="2.5" />
        <!-- Fireplace Mantle Shelf -->
        <rect x="-20" y="0" width="220" height="14" rx="3" fill="#42291c" stroke="#5a3928" stroke-width="2" />
        <!-- Brick Chamber Opening -->
        <path d="M 25,270 L 25,90 Q 90,65 155,90 L 155,270 Z" fill="#0d0906" stroke="#2a180f" stroke-width="3" />
        
        <!-- Glowing Embers & Log Fire Inside Hearth -->
        <radialGradient id="fire-glow" cx="50%" cy="80%" r="65%">
          <stop offset="0%" stop-color="#ff9933" stop-opacity="0.9" />
          <stop offset="40%" stop-color="#cc4400" stop-opacity="0.6" />
          <stop offset="85%" stop-color="#661100" stop-opacity="0.2" />
          <stop offset="100%" stop-color="#0d0906" stop-opacity="0" />
        </radialGradient>
        <circle cx="90" cy="220" r="75" fill="url(#fire-glow)" />
        <!-- Firewood Logs -->
        <ellipse cx="90" cy="245" rx="36" ry="10" fill="#29150b" />
        <path d="M 65,250 L 115,225" stroke="#3d2113" stroke-width="6" stroke-linecap="round" />
        <path d="M 115,250 L 65,225" stroke="#3d2113" stroke-width="6" stroke-linecap="round" />
        <!-- Dancing Fire Flames -->
        <path d="M 75,245 Q 85,190 90,180 Q 95,210 105,245 Q 90,255 75,245 Z" fill="#ffd166" filter="url(#hh-glow)" />
        <path d="M 82,245 Q 88,205 92,200 Q 96,215 100,245 Z" fill="#ffffff" />

        <!-- Gilded Frame Oil Painting above Mantle -->
        <g transform="translate(15, -110)">
          <rect x="0" y="0" width="150" height="95" rx="3" fill="#1b2520" stroke="#b8860b" stroke-width="4" />
          <rect x="4" y="4" width="142" height="87" fill="#0f1917" stroke="#ffd166" stroke-width="1" />
          <!-- Painting Canvas: Majestic Sailing Ship at Sea -->
          <path d="M 20,70 Q 75,60 130,70 L 130,85 L 20,85 Z" fill="#1a353d" />
          <polygon points="75,25 75,65 95,65" fill="#f4f2e9" opacity="0.8" />
          <polygon points="75,32 75,65 60,65" fill="#d5dfd8" opacity="0.7" />
          <line x1="75" y1="20" x2="75" y2="70" stroke="#8b5a2b" stroke-width="2" />
        </g>

        <!-- Antique Brass Mantle Clock -->
        <g transform="translate(72, -18)">
          <path d="M 0,16 Q 18,0 36,16 L 34,18 L 2,18 Z" fill="#b8860b" />
          <circle cx="18" cy="9" r="7" fill="#f4f2e9" stroke="#b8860b" stroke-width="1.5" />
          <line x1="18" y1="9" x2="18" y2="5" stroke="#000" stroke-width="1" />
          <line x1="18" y1="9" x2="22" y2="9" stroke="#000" stroke-width="1" />
        </g>
      </g>

      <!-- Right Wall Arched Gothic Window with Rich Velvet Drapes -->
      <g transform="translate(615, 30)">
        <!-- Window Arch & Glass Panes -->
        <path d="M 15,190 L 15,65 Q 65,5 115,65 L 115,190 Z" fill="#0d1b2a" stroke="#2c3e50" stroke-width="3" />
        <!-- Window Leaded Glass Lattice -->
        <line x1="65" y1="15" x2="65" y2="190" stroke="#1b2838" stroke-width="2" />
        <line x1="15" y1="90" x2="115" y2="90" stroke="#1b2838" stroke-width="2" />
        <line x1="15" y1="140" x2="115" y2="140" stroke="#1b2838" stroke-width="2" />
        <!-- Soft Night Sky Twilight & Stars -->
        <circle cx="45" cy="55" r="1.5" fill="#ffd166" />
        <circle cx="85" cy="40" r="2" fill="#ffffff" />
        <circle cx="95" cy="80" r="1.5" fill="#ffd166" />
        
        <!-- Heavy Emerald Velvet Curtains with Gold Tiebacks -->
        <path d="M 0,0 C 25,60 15,130 5,200 L 25,200 C 35,130 45,60 15,0 Z" fill="#152b1b" stroke="#0e1f13" stroke-width="2" />
        <path d="M 130,0 C 105,60 115,130 125,200 L 105,200 C 95,130 85,60 115,0 Z" fill="#152b1b" stroke="#0e1f13" stroke-width="2" />
        <rect x="2" y="125" width="8" height="5" rx="2" fill="#e6b85c" />
        <rect x="120" y="125" width="8" height="5" rx="2" fill="#e6b85c" />
      </g>

      <!-- Left Grand Bookshelf (Coordinates X: 20 to 250, Y: 30 to 420) -->
      <g fill="#271911" stroke="#3d271b" stroke-width="2">
        <rect x="20" y="30" width="225" height="390" rx="4" />
        <!-- Carved Crown Molding -->
        <rect x="14" y="24" width="237" height="12" rx="2" fill="#362215" stroke="#4a3020" stroke-width="1.5" />
        <!-- Shelves Interior Backing -->
        <rect x="30" y="42" width="205" height="75" fill="#160e09" />
        <rect x="30" y="126" width="205" height="85" fill="#160e09" />
        <rect x="30" y="220" width="205" height="85" fill="#160e09" />
        <rect x="30" y="314" width="205" height="96" fill="#160e09" />
      </g>

      <!-- Left Bookshelf Books & Curiosities -->
      <g>
        <!-- Top Shelf Books -->
        <rect x="36" y="52" width="14" height="65" fill="#7a2828" rx="2" />
        <rect x="52" y="48" width="18" height="69" fill="#1d3b2b" rx="2" />
        <rect x="72" y="55" width="22" height="62" fill="#b07d1e" rx="2" />
        <rect x="96" y="50" width="16" height="67" fill="#442a5a" rx="2" />
        <rect x="114" y="54" width="20" height="63" fill="#6e2d1b" rx="2" />
        <rect x="136" y="46" width="24" height="71" fill="#1c334d" rx="2" />
        <!-- Tilted Book -->
        <g transform="rotate(14 175 60)">
          <rect x="165" y="48" width="16" height="66" fill="#7a2828" rx="2" />
        </g>
        <!-- Brass Bookend -->
        <path d="M 205,80 L 225,80 L 225,117 L 205,117 Z" fill="#b8860b" />

        <!-- Shelf 2 Books (Tier where Green Grimoire sits at X=150, Y=210) -->
        <rect x="36" y="138" width="20" height="73" fill="#4d1c1c" rx="2" />
        <rect x="58" y="132" width="22" height="79" fill="#2d3b4d" rx="2" />
        <rect x="82" y="142" width="18" height="69" fill="#8c6a28" rx="2" />
        <rect x="102" y="136" width="24" height="75" fill="#362244" rx="2" />
        <!-- Rolled Parchment Scrolls on Right of Shelf 2 -->
        <ellipse cx="195" cy="195" rx="14" ry="14" fill="#f4f2e9" stroke="#c4beaa" stroke-width="2" />
        <ellipse cx="215" cy="198" rx="12" ry="12" fill="#f3ebd7" stroke="#c4beaa" stroke-width="2" />

        <!-- Shelf 3 & 4 Heavy Ensembles -->
        <rect x="36" y="232" width="26" height="73" fill="#1d2e1b" rx="2" />
        <rect x="64" y="226" width="24" height="79" fill="#5a2222" rx="2" />
        <rect x="90" y="238" width="28" height="67" fill="#1b2f42" rx="2" />
        <!-- Antique Brass Scale on Shelf 3 -->
        <path d="M 160,250 L 180,250 M 170,240 L 170,305 M 155,305 L 185,305" stroke="#e6b85c" stroke-width="2" fill="none" />
      </g>

      <!-- Right Grand Bookshelf & Collector's Cabinet (Coordinates X: 750 to 980) -->
      <g fill="#271911" stroke="#3d271b" stroke-width="2">
        <rect x="745" y="30" width="225" height="390" rx="4" />
        <rect x="739" y="24" width="237" height="12" rx="2" fill="#362215" stroke="#4a3020" stroke-width="1.5" />
        <rect x="755" y="42" width="205" height="75" fill="#160e09" />
        <rect x="755" y="126" width="205" height="85" fill="#160e09" />
        <rect x="755" y="220" width="205" height="85" fill="#160e09" />
        <rect x="755" y="314" width="205" height="96" fill="#160e09" />
      </g>

      <!-- Right Shelf Collectibles & Volumes -->
      <g>
        <!-- Top Shelf Right -->
        <rect x="765" y="50" width="22" height="67" fill="#1c334d" rx="2" />
        <rect x="789" y="56" width="18" height="61" fill="#7a2828" rx="2" />
        <rect x="809" y="48" width="24" height="69" fill="#1d3b2b" rx="2" />
        <rect x="835" y="52" width="20" height="65" fill="#b07d1e" rx="2" />
        <rect x="857" y="58" width="18" height="59" fill="#442a5a" rx="2" />
        
        <!-- Shelf 2 (Where Celestial Globe sits at X=850, Y=192) -->
        <rect x="765" y="140" width="24" height="71" fill="#5a2222" rx="2" />
        <rect x="791" y="135" width="20" height="76" fill="#1d2e1b" rx="2" />

        <!-- Shelf 3 (Where Hourglass sits at X=720, Y=264) -->
        <rect x="840" y="235" width="26" height="70" fill="#2d3b4d" rx="2" />
        <rect x="868" y="228" width="22" height="77" fill="#8c6a28" rx="2" />
        <rect x="892" y="238" width="24" height="67" fill="#4d1c1c" rx="2" />
      </g>

      <!-- Flooring: Parquet Herringbone Planks & Oriental Crimson Rug -->
      <g>
        <rect y="415" width="1000" height="185" fill="#1f140d" stroke="#2e1d13" stroke-width="2" />
        <!-- Floor Herringbone Lines -->
        <g stroke="#140c07" stroke-width="2" opacity="0.45">
          <line x1="0" y1="455" x2="1000" y2="455" />
          <line x1="0" y1="495" x2="1000" y2="495" />
          <line x1="0" y1="535" x2="1000" y2="535" />
          <line x1="0" y1="575" x2="1000" y2="575" />
        </g>
        <!-- Luxurious Persian Medallion Area Rug -->
        <ellipse cx="500" cy="510" rx="360" ry="75" fill="#661c1c" stroke="#e6b85c" stroke-width="3" stroke-dasharray="14,6" />
        <ellipse cx="500" cy="510" rx="320" ry="60" fill="#4a1212" stroke="#b8860b" stroke-width="1.5" />
        <ellipse cx="500" cy="510" rx="140" ry="25" fill="#5c1616" stroke="#e6b85c" stroke-width="1.5" />
        <polygon points="500,490 520,510 500,530 480,510" fill="#e6b85c" opacity="0.75" />
      </g>

      <!-- Boston Fern Plant in Ornamental Brass Planter (Bottom-Left Foreground) -->
      <g transform="translate(60, 410)">
        <!-- Brass Pedestal Urn -->
        <path d="M 0,90 L 40,90 L 32,50 L 8,50 Z" fill="#b8860b" stroke="#705206" stroke-width="2" />
        <ellipse cx="20" cy="50" rx="16" ry="6" fill="#8c6608" />
        <!-- Arching Fern Fronds -->
        <path d="M 20,50 Q -25,20 -40,35 Q -10,35 15,50" fill="#2d5234" />
        <path d="M 20,50 Q 5,0 -10,-10 Q 0,20 18,50" fill="#396842" />
        <path d="M 20,50 Q 30,-5 45,-15 Q 35,20 22,50" fill="#2d5234" />
        <path d="M 20,50 Q 65,15 80,30 Q 50,35 25,50" fill="#396842" />
      </g>

      <!-- Antique Brass Telescope on Tripod (Right Floor Foreground) -->
      <g transform="translate(710, 320)">
        <!-- Mahogany Tripod Legs -->
        <line x1="25" y1="65" x2="-10" y2="170" stroke="#362215" stroke-width="4" stroke-linecap="round" />
        <line x1="25" y1="65" x2="25" y2="175" stroke="#362215" stroke-width="4" stroke-linecap="round" />
        <line x1="25" y1="65" x2="60" y2="170" stroke="#362215" stroke-width="4" stroke-linecap="round" />
        <!-- Brass Mount Ring -->
        <circle cx="25" cy="65" r="7" fill="#e6b85c" stroke="#997000" stroke-width="1.5" />
        <!-- Brass Barrel -->
        <g transform="rotate(-28 25 65)">
          <rect x="-35" y="60" width="90" height="11" rx="2" fill="#e6b85c" stroke="#b8860b" stroke-width="1.5" />
          <rect x="55" y="58" width="14" height="15" rx="2" fill="#d49b29" stroke="#997000" stroke-width="1.5" />
          <circle cx="69" cy="65" r="6" fill="#38bdf8" opacity="0.6" />
        </g>
      </g>

      <!-- Center Master Partner's Writing Desk (Coordinates X: 210 to 790, Y: 335 to 480) -->
      <g>
        <!-- Desk Drop Shadow on Persian Rug -->
        <ellipse cx="500" cy="485" rx="310" ry="22" fill="#000000" opacity="0.5" />
        <!-- Solid Mahogany Carved Desk Surface Base -->
        <path d="M 210,360 L 790,360 L 830,470 L 170,470 Z" fill="#3d2618" stroke="#573722" stroke-width="3" />
        <!-- Carved Base Pedestals -->
        <rect x="200" y="470" width="80" height="60" fill="#291910" stroke="#3d2618" stroke-width="2" />
        <rect x="720" y="470" width="80" height="60" fill="#291910" stroke="#3d2618" stroke-width="2" />
        <line x1="200" y1="500" x2="280" y2="500" stroke="#e6b85c" stroke-width="1" opacity="0.5" />
        <line x1="720" y1="500" x2="800" y2="500" stroke="#e6b85c" stroke-width="1" opacity="0.5" />

        <!-- Green Leather Writing Inlay Surface with Gold Foil Tooling -->
        <polygon points="245,372 755,372 790,458 210,458" fill="#1b2e21" stroke="#e6b85c" stroke-width="2" />
        <polygon points="255,378 745,378 778,452 222,452" fill="#17261c" stroke="#b8860b" stroke-width="1" stroke-dasharray="4,2" />

        <!-- Classic Banker's Lamp (Left on Desk) -->
        <g transform="translate(350, 315)">
          <path d="M 0,55 L 20,55 L 16,50 L 4,50 Z" fill="#b8860b" />
          <path d="M 10,50 L 10,25 Q 10,15 20,15" stroke="#e6b85c" stroke-width="4" fill="none" />
          <!-- Emerald Green Glass Shade -->
          <ellipse cx="28" cy="15" rx="20" ry="8" fill="#1b5e20" stroke="#e6b85c" stroke-width="1.5" filter="url(#hh-glow)" />
          <ellipse cx="28" cy="18" rx="16" ry="4" fill="#ffd166" opacity="0.8" />
        </g>

        <!-- Antique Brass Magnifying Glass on Desk (Right side) -->
        <g transform="translate(630, 415) rotate(-35)">
          <circle cx="0" cy="0" r="14" fill="#38bdf8" opacity="0.45" stroke="#e6b85c" stroke-width="3" />
          <line x1="0" y1="14" x2="0" y2="38" stroke="#5a381e" stroke-width="4.5" stroke-linecap="round" />
        </g>
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

      <!-- Waterfall Stream in Center-Left -->
      <path d="M 440,240 Q 470,360 430,480 Q 400,540 450,600 L 580,600 Q 520,530 540,460 Q 560,340 520,240 Z" fill="#1b4542" opacity="0.75" />
      <g stroke="#38bdf8" stroke-width="1.5" opacity="0.5" stroke-dasharray="8,6">
        <line x1="480" y1="260" x2="470" y2="480" />
        <line x1="500" y1="250" x2="490" y2="490" />
      </g>

      <!-- Mighty Ancient Twisted Oak Trees (Foreground Left & Right) -->
      <g fill="#211812" stroke="#140f0b" stroke-width="3">
        <path d="M -20,600 C 60,420 40,220 120,60 C 130,20 90,-20 80,-40 L -40,-40 Z" />
        <path d="M 40,520 Q 180,550 280,600 L 40,600 Z" fill="#261c15" />
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
        <circle cx="0" cy="-10" r="30" fill="#ffd166" />
        <path d="M -80,10 Q 0,0 80,10 L 80,80 L -80,80 Z" fill="#143642" />
        <circle cx="0" cy="0" r="80" fill="none" stroke="#b8860b" stroke-width="12" />
        <circle cx="0" cy="0" r="74" fill="none" stroke="#2b1f09" stroke-width="2" />
        <circle cx="-65" cy="0" r="3" fill="#2b1f09" /><circle cx="65" cy="0" r="3" fill="#2b1f09" /><circle cx="0" cy="-65" r="3" fill="#2b1f09" /><circle cx="0" cy="65" r="3" fill="#2b1f09" />
      </g>

      <!-- Ship Cabin Heavy Oak Timber Walls -->
      <g stroke="#261b12" stroke-width="3">
        <rect x="0" y="0" width="180" height="600" fill="#362519" />
        <rect x="820" y="0" width="180" height="600" fill="#362519" />
        <line x1="0" y1="120" x2="180" y2="120" stroke="#1f140c" stroke-width="2" />
        <line x1="0" y1="240" x2="180" y2="240" stroke="#1f140c" stroke-width="2" />
        <line x1="0" y1="360" x2="180" y2="360" stroke="#1f140c" stroke-width="2" />
        <line x1="820" y1="120" x2="1000" y2="120" stroke="#1f140c" stroke-width="2" />
        <line x1="820" y1="240" x2="1000" y2="240" stroke="#1f140c" stroke-width="2" />
        <line x1="820" y1="360" x2="1000" y2="360" stroke="#1f140c" stroke-width="2" />
      </g>

      <!-- Rigging Ropes -->
      <g stroke="#8c6a46" stroke-width="2.5" opacity="0.7">
        <line x1="120" y1="0" x2="260" y2="380" />
        <line x1="150" y1="0" x2="290" y2="380" />
        <line x1="880" y1="0" x2="740" y2="380" />
        <line x1="850" y1="0" x2="710" y2="380" />
      </g>

      <!-- Deck Floor & Rug -->
      <rect y="400" width="1000" height="200" fill="#2d1f15" stroke="#1d130c" stroke-width="3" />
      <ellipse cx="500" cy="510" rx="360" ry="70" fill="#661a1a" stroke="#ffd166" stroke-width="2" stroke-dasharray="10,5" />
      <ellipse cx="500" cy="510" rx="320" ry="55" fill="#4d1212" />

      <!-- Captain's Solid Oak Table -->
      <path d="M 240,360 L 760,360 L 800,480 L 200,480 Z" fill="#422a1c" stroke="#5e3c28" stroke-width="3" />
      <rect x="220" y="480" width="35" height="100" fill="#2b1a10" />
      <rect x="745" y="480" width="35" height="100" fill="#2b1a10" />
    `;
  }

  // --- Specific Target Object Vector Renderers with High Texture Fidelity ---
  function renderTargetObjectGraphic(obj, cx, cy) {
    const id = obj.id;
    switch (id) {
      // Library Targets
      case 'key':
      case 'keyring':
        return `
          <!-- Golden Skeleton Key at exact coordinate -->
          <g transform="translate(${cx}, ${cy}) rotate(-30)" filter="url(#hh-glow-gold)">
            <!-- Bow / Keyring Head -->
            <circle cx="0" cy="0" r="13" fill="none" stroke="#e6b85c" stroke-width="3.8" />
            <circle cx="0" cy="0" r="6.5" fill="none" stroke="#ffd166" stroke-width="2" />
            <circle cx="0" cy="0" r="2.5" fill="#e6b85c" />
            <polygon points="0,-13 -3,-8 3,-8" fill="#e6b85c" />
            <!-- Shaft with Brass Collars -->
            <rect x="-2.2" y="13" width="4.4" height="28" fill="#e6b85c" rx="1" />
            <rect x="-3.5" y="15" width="7" height="3" fill="#ffd166" rx="1" />
            <!-- Ornate Bit / Teeth -->
            <path d="M 2.2,30 H 12 V 35 H 2.2 Z M 2.2,37 H 9 V 41 H 2.2 Z" fill="#e6b85c" />
          </g>
        `;
      case 'hourglass':
        return `
          <!-- Brass Hourglass with Flowing Golden Sand -->
          <g transform="translate(${cx}, ${cy})" filter="url(#hh-glow-gold)">
            <rect x="-16" y="-22" width="32" height="6" fill="#b8860b" stroke="#e6b85c" stroke-width="1.5" rx="2" />
            <rect x="-16" y="16" width="32" height="6" fill="#b8860b" stroke="#e6b85c" stroke-width="1.5" rx="2" />
            <!-- Glass Bulbs with Soft Reflection -->
            <path d="M -12,-16 C -12,0 0,-3 0,0 C 0,3 -12,0 -12,16 L 12,16 C 12,0 0,3 0,0 C 0,-3 12,0 12,-16 Z" fill="#38bdf8" opacity="0.35" stroke="#b8860b" stroke-width="2" />
            <!-- Upper Sand Reserve & Trickle -->
            <polygon points="-8,-15 8,-15 0,-4" fill="#ffd166" />
            <line x1="0" y1="-3" x2="0" y2="8" stroke="#ffd166" stroke-width="1.5" stroke-dasharray="2,2" />
            <polygon points="-9,15 9,15 0,5" fill="#ffd166" />
            <!-- Brass Support Pillars -->
            <line x1="-13" y1="-16" x2="-13" y2="16" stroke="#e6b85c" stroke-width="2.5" />
            <line x1="13" y1="-16" x2="13" y2="16" stroke="#e6b85c" stroke-width="2.5" />
          </g>
        `;
      case 'quill':
      case 'feather':
      case 'parrot_feather':
        return `
          <!-- Antique Feather Quill with Silver Nib -->
          <g transform="translate(${cx}, ${cy}) rotate(35)" filter="url(#hh-glow-gold)">
            <!-- Feather Vane -->
            <path d="M 0,22 Q -12,0 0,-30 Q 12,0 0,22 Z" fill="#f3ebdd" stroke="#8c6a46" stroke-width="1.5" />
            <line x1="0" y1="22" x2="0" y2="-30" stroke="#e6b85c" stroke-width="1.8" />
            <!-- Fine Barb Feather Texture -->
            <line x1="0" y1="-15" x2="-8" y2="-8" stroke="#c4beaa" stroke-width="1" />
            <line x1="0" y1="-5" x2="8" y2="2" stroke="#c4beaa" stroke-width="1" />
            <line x1="0" y1="5" x2="-7" y2="12" stroke="#c4beaa" stroke-width="1" />
            <!-- Silver Writing Nib -->
            <polygon points="0,22 -2.5,32 2.5,32" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1" />
            <circle cx="0" cy="24" r="1" fill="#000" />
          </g>
        `;
      case 'globe':
      case 'astrolabe':
      case 'sundial':
        return `
          <!-- Celestial Star Globe on Brass Gimbal -->
          <g transform="translate(${cx}, ${cy})" filter="url(#hh-glow-gold)">
            <!-- Wooden Turned Pedestal -->
            <path d="M -12,32 L 12,32 L 8,24 L -8,24 Z" fill="#3d2618" stroke="#291910" stroke-width="1.5" />
            <line x1="0" y1="24" x2="0" y2="0" stroke="#b8860b" stroke-width="3" />
            <!-- Brass Meridian Semi-Circle Ring -->
            <path d="M -24,-8 A 25 25 0 0 0 0,24 L 0,28" stroke="#e6b85c" stroke-width="3" fill="none" />
            <!-- Celestial Sphere Globe -->
            <circle cx="0" cy="0" r="21" fill="#1b394a" stroke="#e6b85c" stroke-width="2" />
            <!-- Equator & Star Map Grid Lines -->
            <ellipse cx="0" cy="0" rx="21" ry="8" fill="none" stroke="#ffd166" stroke-width="1.5" opacity="0.8" />
            <line x1="0" y1="-21" x2="0" y2="21" stroke="#ffd166" stroke-width="1.5" opacity="0.8" />
            <!-- Constellation Star Dots -->
            <circle cx="-7" cy="-7" r="1.5" fill="#ffffff" />
            <circle cx="6" cy="-10" r="1.8" fill="#ffd166" />
            <circle cx="10" cy="4" r="1.5" fill="#ffffff" />
            <circle cx="-8" cy="8" r="1.5" fill="#ffd166" />
          </g>
        `;
      case 'book':
      case 'journal':
        return `
          <!-- Green Leather Grimoire with Golden Embossed Talisman -->
          <g transform="translate(${cx}, ${cy}) rotate(-12)" filter="url(#hh-glow-gold)">
            <!-- Leather Cover -->
            <rect x="-18" y="-24" width="36" height="48" rx="4" fill="#1b4d2e" stroke="#e6b85c" stroke-width="2.5" />
            <!-- Book Spine Binding Ribs -->
            <rect x="-18" y="-24" width="7" height="48" rx="2" fill="#143b23" stroke="#e6b85c" stroke-width="1" />
            <!-- Gold Tooling Border & Talisman Center -->
            <rect x="-8" y="-19" width="22" height="38" rx="2" fill="none" stroke="#ffd166" stroke-width="1.2" stroke-dasharray="3,1" />
            <circle cx="3" cy="0" r="6.5" fill="#143b23" stroke="#e6b85c" stroke-width="1.8" />
            <polygon points="3,-4 6,3 0,3" fill="#e6b85c" />
            <!-- Silk Bookmark Ribbon hanging out -->
            <path d="M 3,24 Q 8,30 5,36" stroke="#e77c68" stroke-width="3" fill="none" stroke-linecap="round" />
          </g>
        `;
      case 'pocket_watch':
      case 'compass':
        return `
          <g transform="translate(${cx}, ${cy})" filter="url(#hh-glow-gold)">
            <circle cx="0" cy="0" r="16" fill="#1b2018" stroke="#e6b85c" stroke-width="3" />
            <circle cx="0" cy="-18" r="4.5" fill="none" stroke="#e6b85c" stroke-width="2" />
            <circle cx="0" cy="0" r="12" fill="#f3ebdd" />
            <line x1="0" y1="0" x2="0" y2="-8" stroke="#111" stroke-width="2" stroke-linecap="round" />
            <line x1="0" y1="0" x2="6" y2="0" stroke="#e77c68" stroke-width="1.5" stroke-linecap="round" />
          </g>
        `;
      case 'lens':
      case 'monocular':
      case 'spyglass':
        return `
          <g transform="translate(${cx}, ${cy}) rotate(-45)" filter="url(#hh-glow-gold)">
            <circle cx="0" cy="-14" r="15" fill="#38bdf8" opacity="0.5" stroke="#e6b85c" stroke-width="3.5" />
            <line x1="0" y1="1" x2="0" y2="30" stroke="#5a381e" stroke-width="5" stroke-linecap="round" />
            <line x1="-1" y1="1" x2="-1" y2="7" stroke="#e6b85c" stroke-width="5.5" />
          </g>
        `;
      case 'scroll':
      case 'chart':
      case 'island_map':
        return `
          <g transform="translate(${cx}, ${cy}) rotate(15)" filter="url(#hh-glow-gold)">
            <rect x="-24" y="-14" width="48" height="28" rx="4" fill="#f3ebdd" stroke="#b5ad96" stroke-width="1.5" />
            <path d="M -18,-5 Q 0,-10 18,-5 M -18,4 Q 0,0 18,4" stroke="#8a3b3b" stroke-width="1.5" stroke-dasharray="3,2" fill="none" />
            <text x="6" y="7" font-size="11" font-weight="bold" fill="#e77c68">✕</text>
          </g>
        `;
      case 'acorn':
      case 'pinecone':
        return `
          <g transform="translate(${cx}, ${cy})" filter="url(#hh-glow-gold)">
            <path d="M -10,-5 Q 0,-15 10,-5 Z" fill="#523924" stroke="#362315" stroke-width="1.5" />
            <line x1="0" y1="-10" x2="0" y2="-17" stroke="#523924" stroke-width="2" />
            <path d="M -9,-5 C -12,12 12,12 9,-5 Z" fill="#e6b85c" stroke="#8c6a28" stroke-width="1.5" />
          </g>
        `;
      case 'lantern':
        return `
          <g transform="translate(${cx}, ${cy})" filter="url(#hh-glow-gold)">
            <path d="M -12,-16 L 12,-16 L 15,14 L -15,14 Z" fill="#1f3829" stroke="#e6b85c" stroke-width="2" />
            <rect x="-8" y="-12" width="16" height="22" fill="#ffd166" opacity="0.95" rx="3" />
            <circle cx="0" cy="-22" r="5" fill="none" stroke="#e6b85c" stroke-width="2" />
          </g>
        `;
      case 'butterfly':
      case 'dragonfly':
        return `
          <g transform="translate(${cx}, ${cy})" filter="url(#hh-glow-gold)">
            <ellipse cx="-10" cy="-7" rx="9" ry="7" fill="#38bdf8" />
            <ellipse cx="10" cy="-7" rx="9" ry="7" fill="#38bdf8" />
            <ellipse cx="-8" cy="6" rx="7" ry="5" fill="#2098cc" />
            <ellipse cx="8" cy="6" rx="7" ry="5" fill="#2098cc" />
            <line x1="0" y1="-14" x2="0" y2="12" stroke="#0f1910" stroke-width="2.5" />
          </g>
        `;
      case 'mushroom':
      case 'toadstool':
        return `
          <g transform="translate(${cx}, ${cy})" filter="url(#hh-glow-gold)">
            <rect x="-3" y="0" width="6" height="15" fill="#f3ebdd" rx="2" />
            <path d="M -14,0 Q 0,-20 14,0 Z" fill="#e77c68" stroke="#c4431d" stroke-width="1.5" />
            <circle cx="-5" cy="-8" r="2" fill="#ffffff" /><circle cx="4" cy="-6" r="2.5" fill="#ffffff" />
          </g>
        `;
      case 'crystal':
      case 'quartz':
      case 'amulet':
        return `
          <g transform="translate(${cx}, ${cy})" filter="url(#hh-glow-gold)">
            <polygon points="0,-18 10,-6 6,14 -6,14 -10,-6" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5" />
            <line x1="0" y1="-18" x2="0" y2="14" stroke="#ffffff" stroke-width="1" opacity="0.8" />
          </g>
        `;
      case 'hat':
        return `
          <g transform="translate(${cx}, ${cy})" filter="url(#hh-glow-gold)">
            <path d="M -24,8 Q 0,-18 24,8 L 18,16 Q 0,0 -18,16 Z" fill="#1b1c1e" stroke="#e6b85c" stroke-width="2" />
            <circle cx="0" cy="5" r="4" fill="#ffffff" />
          </g>
        `;
      case 'cutlass':
      case 'pistol':
        return `
          <g transform="translate(${cx}, ${cy}) rotate(25)" filter="url(#hh-glow-gold)">
            <path d="M 0,-25 Q 12,0 0,16 L -4,14 Q 6,0 -4,-23 Z" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1.5" />
            <circle cx="0" cy="22" r="5" fill="#b8860b" />
            <path d="M -5,16 Q -12,22 -2,28 L 2,28 Q 12,22 5,16 Z" fill="#e6b85c" />
          </g>
        `;
      case 'chest':
        return `
          <g transform="translate(${cx}, ${cy})" filter="url(#hh-glow-gold)">
            <rect x="-24" y="-8" width="48" height="28" rx="4" fill="#523824" stroke="#e6b85c" stroke-width="2.5" />
            <path d="M -24,-8 Q 0,-24 24,-8 Z" fill="#69482e" stroke="#e6b85c" stroke-width="2.5" />
            <circle cx="0" cy="5" r="4" fill="#e6b85c" />
            <line x1="-12" y1="-16" x2="-12" y2="20" stroke="#e6b85c" stroke-width="2" />
            <line x1="12" y1="-16" x2="12" y2="20" stroke="#e6b85c" stroke-width="2" />
          </g>
        `;
      case 'crown':
      case 'necklace':
      case 'goblet':
      case 'skull':
        return `
          <g transform="translate(${cx}, ${cy})" filter="url(#hh-glow-gold)">
            <polygon points="-16,10 -16,-6 -8,2 0,-10 8,2 16,-6 16,10" fill="#e6b85c" stroke="#b8860b" stroke-width="2" />
            <circle cx="0" cy="2" r="3" fill="#e77c68" />
            <circle cx="-9" cy="4" r="2.5" fill="#38bdf8" />
            <circle cx="9" cy="4" r="2.5" fill="#8ccb79" />
          </g>
        `;
      case 'barrel':
      case 'anchor':
      case 'helm':
        return `
          <g transform="translate(${cx}, ${cy})" filter="url(#hh-glow-gold)">
            <circle cx="0" cy="0" r="16" fill="none" stroke="#5c3e29" stroke-width="5" />
            <circle cx="0" cy="0" r="7" fill="#e6b85c" />
            <line x1="-22" y1="0" x2="22" y2="0" stroke="#5c3e29" stroke-width="4" />
            <line x1="0" y1="-22" x2="0" y2="22" stroke="#5c3e29" stroke-width="4" />
          </g>
        `;
      default:
        return `
          <g transform="translate(${cx}, ${cy})" filter="url(#hh-glow-gold)">
            <polygon points="0,-15 12,0 0,15 -12,0" fill="#e6b85c" stroke="#ffd166" stroke-width="2" />
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

    // Render target objects with exact metadata coordinates
    const targetsMarkup = level.objects.map(obj => {
      const cx = obj.x * 1000;
      const cy = obj.y * 600;
      const isFound = foundSet.has(obj.id);

      return `
        <g id="obj-${obj.id}" data-id="${obj.id}" class="scene-target-group ${isFound ? 'found' : ''}" style="cursor: pointer;">
          <!-- Generous Transparent Hitbox Detection Pad -->
          <circle cx="${cx}" cy="${cy}" r="${obj.radius * 1000 * 1.35}" fill="transparent" stroke="none" />
          
          <!-- Visual Target Object Artwork -->
          <g class="target-art-wrap ${isFound ? 'art-found' : ''}">
            ${renderTargetObjectGraphic(obj, cx, cy)}
          </g>

          <!-- Discovered Marker Ring & Star Burst -->
          <g class="discovery-ring" style="display: ${isFound ? 'block' : 'none'};">
            <circle cx="${cx}" cy="${cy}" r="${obj.radius * 1000 * 0.95}" fill="none" stroke="#e6b85c" stroke-width="3" filter="url(#hh-glow-gold)" stroke-dasharray="5,3" />
            <circle cx="${cx + 15}" cy="${cy - 15}" r="8.5" fill="#8ccb79" stroke="#11110f" stroke-width="1.5" />
            <text x="${cx + 15}" y="${cy - 11.5}" font-size="10" font-weight="900" fill="#11110f" text-anchor="middle">✓</text>
          </g>
        </g>
      `;
    }).join('\n');

    return `
      <svg id="hidden-hunt-svg" viewBox="0 0 1000 600" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="hh-glow-gold" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Ambient Room Backdrop -->
        <g id="scene-backdrop">
          ${backdrop}
        </g>

        <!-- Target Objects -->
        <g id="scene-targets">
          ${targetsMarkup}
        </g>

        <!-- Hint Marker Animated Beacon Overlay -->
        <g id="scene-hint-pin" style="display: none; pointer-events: none;">
          <circle id="hint-ring" cx="0" cy="0" r="34" fill="none" stroke="#e6b85c" stroke-width="3.5" filter="url(#hh-glow-gold)">
            <animate attributeName="r" values="20;50;20" dur="1.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <polygon id="hint-arrow" points="0,-38 -9,-55 9,-55" fill="#e6b85c" filter="url(#hh-glow-gold)">
            <animate attributeName="transform" type="translate" values="0,0; 0,-8; 0,0" dur="1.2s" repeatCount="indefinite" />
          </polygon>
        </g>
      </svg>
    `;
  }

  exports.buildSceneSvg = buildSceneSvg;

})(typeof exports === 'undefined' ? (window.HiddenHuntScenes = {}) : exports);
