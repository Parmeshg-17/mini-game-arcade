/**
 * Jigpic Solitaire — Scenic Artwork Vector Engine
 * Generates handcrafted vector illustrations for each picturesque scene
 * and renders individual jigsaw puzzle blocks via SVG viewBox slicing.
 */
(function() {
  'use strict';

  const SCENE_ARTWORKS = {
    'alpine-sunrise': {
      width: 600,
      height: 600,
      rows: 3,
      cols: 3,
      renderSvg: function() {
        return `
          <!-- Sky Gradient -->
          <defs>
            <linearGradient id="sky-alpine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#fdba74" />
              <stop offset="45%" stop-color="#fed7aa" />
              <stop offset="70%" stop-color="#e0e7ff" />
              <stop offset="100%" stop-color="#bfdbfe" />
            </linearGradient>
            <linearGradient id="sun-glow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#fffbeb" />
              <stop offset="60%" stop-color="#fde047" />
              <stop offset="100%" stop-color="#f59e0b" />
            </linearGradient>
            <linearGradient id="water-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#93c5fd" />
              <stop offset="50%" stop-color="#60a5fa" />
              <stop offset="100%" stop-color="#1e3a8a" />
            </linearGradient>
          </defs>

          <!-- Sky Base -->
          <rect width="600" height="420" fill="url(#sky-alpine)" />

          <!-- Sun Rays -->
          <g opacity="0.35">
            <polygon points="300,240 180,0 240,0" fill="#fde047" />
            <polygon points="300,240 360,0 420,0" fill="#fde047" />
            <polygon points="300,240 0,100 0,160" fill="#fde047" />
            <polygon points="300,240 600,100 600,160" fill="#fde047" />
          </g>

          <!-- Golden Morning Sun -->
          <circle cx="300" cy="240" r="75" fill="url(#sun-glow)" opacity="0.95" />

          <!-- Distant Mist & Peaks -->
          <polygon points="50,330 180,140 310,330" fill="#64748b" opacity="0.85" />
          <polygon points="155,175 180,140 205,175 190,195 168,195" fill="#f8fafc" />

          <polygon points="280,330 420,110 560,330" fill="#475569" opacity="0.9" />
          <polygon points="390,158 420,110 450,158 435,180 405,180" fill="#f8fafc" />

          <polygon points="170,330 300,170 430,330" fill="#334155" />
          <polygon points="275,202 300,170 325,202 312,220 288,220" fill="#f8fafc" />

          <!-- Pine Ridge & Foothills -->
          <path d="M0,370 Q150,320 300,350 T600,340 L600,430 L0,430 Z" fill="#1e293b" />
          <path d="M0,390 Q200,360 400,380 T600,370 L600,430 L0,430 Z" fill="#0f172a" />

          <!-- Silhouette Pine Trees -->
          <g fill="#022c22">
            <!-- Row of Pines along ridge -->
            <polygon points="80,380 65,410 95,410" />
            <polygon points="80,365 70,390 90,390" />
            <polygon points="130,370 115,405 145,405" />
            <polygon points="130,355 120,385 140,385" />
            <polygon points="210,375 195,412 225,412" />
            <polygon points="270,360 252,405 288,405" />
            <polygon points="340,372 325,410 355,410" />
            <polygon points="410,365 392,408 428,408" />
            <polygon points="480,375 465,412 495,412" />
            <polygon points="530,362 512,406 548,406" />
          </g>

          <!-- Alpine Lake Water -->
          <rect y="420" width="600" height="180" fill="url(#water-grad)" />

          <!-- Mountain & Sun Water Reflections -->
          <g opacity="0.45">
            <ellipse cx="300" cy="450" rx="90" ry="24" fill="#fde047" />
            <ellipse cx="300" cy="490" rx="60" ry="18" fill="#fb923c" />
            <polygon points="300,440 200,560 400,560" fill="#1e293b" opacity="0.6" />
          </g>

          <!-- Water Waves / Ripples -->
          <g stroke="#e0f2fe" stroke-width="2" stroke-linecap="round" opacity="0.65">
            <line x1="120" y1="460" x2="240" y2="460" />
            <line x1="360" y1="475" x2="490" y2="475" />
            <line x1="80" y1="510" x2="220" y2="510" />
            <line x1="280" y1="530" x2="440" y2="530" />
            <line x1="180" y1="565" x2="350" y2="565" />
          </g>

          <!-- Flying Eagles in sky -->
          <path d="M120,80 Q130,70 140,80 Q150,70 160,80" stroke="#334155" stroke-width="2.5" fill="none" stroke-linecap="round" />
          <path d="M440,65 Q448,56 456,65 Q464,56 472,65" stroke="#334155" stroke-width="2" fill="none" stroke-linecap="round" />
        `;
      }
    },

    'lavender-cottage': {
      width: 800,
      height: 600,
      rows: 3,
      cols: 4,
      renderSvg: function() {
        return `
          <defs>
            <linearGradient id="sky-lavender" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#fbcfe8" />
              <stop offset="50%" stop-color="#fef08a" />
              <stop offset="100%" stop-color="#fed7aa" />
            </linearGradient>
            <linearGradient id="roof-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#b91c1c" />
              <stop offset="100%" stop-color="#7f1d1d" />
            </linearGradient>
            <linearGradient id="field-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#a7f3d0" />
              <stop offset="100%" stop-color="#86efac" />
            </linearGradient>
          </defs>

          <!-- Sky -->
          <rect width="800" height="340" fill="url(#sky-lavender)" />

          <!-- Distant Countryside Rolling Hills -->
          <ellipse cx="200" cy="340" rx="320" ry="100" fill="#6ee7b7" opacity="0.6" />
          <ellipse cx="650" cy="330" rx="300" ry="90" fill="#34d399" opacity="0.6" />
          <ellipse cx="400" cy="350" rx="420" ry="110" fill="#10b981" opacity="0.7" />

          <!-- Background Green Meadow -->
          <rect y="310" width="800" height="290" fill="url(#field-grad)" />

          <!-- Stone Country Cottage (Right-Center) -->
          <g transform="translate(420, 160)">
            <!-- Chimney -->
            <rect x="180" y="20" width="30" height="60" fill="#991b1b" stroke="#7f1d1d" stroke-width="2" />
            <!-- Chimney Smoke Curls -->
            <path d="M195,15 Q210,0 200,-20 T225,-50 T215,-80" stroke="#f1f5f9" stroke-width="6" fill="none" opacity="0.6" stroke-linecap="round" />

            <!-- Main Roof Pitch -->
            <polygon points="120,0 10,95 230,95" fill="url(#roof-grad)" stroke="#450a0a" stroke-width="2" />
            <!-- Cottage Stone Walls -->
            <rect x="25" y="95" width="190" height="135" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2" />

            <!-- Stone Wall Details -->
            <rect x="35" y="115" width="22" height="12" rx="3" fill="#e2e8f0" />
            <rect x="80" y="105" width="28" height="14" rx="3" fill="#e2e8f0" />
            <rect x="160" y="125" width="32" height="14" rx="3" fill="#e2e8f0" />
            <rect x="45" y="175" width="26" height="12" rx="3" fill="#e2e8f0" />

            <!-- Windows with Warm Amber Glow -->
            <rect x="45" y="120" width="38" height="42" rx="4" fill="#fef08a" stroke="#475569" stroke-width="3" />
            <line x1="64" y1="120" x2="64" y2="162" stroke="#475569" stroke-width="2" />
            <line x1="45" y1="141" x2="83" y2="141" stroke="#475569" stroke-width="2" />

            <rect x="145" y="120" width="38" height="42" rx="4" fill="#fef08a" stroke="#475569" stroke-width="3" />
            <line x1="164" y1="120" x2="164" y2="162" stroke="#475569" stroke-width="2" />
            <line x1="145" y1="141" x2="183" y2="141" stroke="#475569" stroke-width="2" />

            <!-- Rustic Wooden Door -->
            <path d="M96,155 Q115,145 134,155 L134,230 L96,230 Z" fill="#78350f" stroke="#451a03" stroke-width="2" />
            <circle cx="126" cy="195" r="3" fill="#fbbf24" />

            <!-- Ivy Climbing Up Wall -->
            <path d="M25,230 Q35,160 25,120 Q40,110 32,80" stroke="#15803d" stroke-width="4" fill="none" />
            <circle cx="30" cy="140" r="6" fill="#16a34a" />
            <circle cx="22" cy="115" r="5" fill="#22c55e" />
            <circle cx="35" cy="90" r="5" fill="#16a34a" />
          </g>

          <!-- Cobblestone Pathway -->
          <path d="M535,390 Q480,470 420,600 L320,600 Q400,470 515,390 Z" fill="#94a3b8" opacity="0.8" />
          <g fill="#cbd5e1" opacity="0.7">
            <ellipse cx="490" cy="420" rx="14" ry="7" />
            <ellipse cx="460" cy="450" rx="18" ry="8" />
            <ellipse cx="430" cy="490" rx="22" ry="10" />
            <ellipse cx="380" cy="540" rx="26" ry="12" />
            <ellipse cx="350" cy="580" rx="30" ry="14" />
          </g>

          <!-- Lavender Rows (Deep purples & violets leading across left & foreground) -->
          <g>
            <!-- Row 1 -->
            <path d="M0,380 Q180,360 380,410 L370,440 Q180,380 0,410 Z" fill="#a855f7" />
            <path d="M0,370 Q180,350 380,400 L370,410 Q180,360 0,380 Z" fill="#c084fc" />

            <!-- Row 2 -->
            <path d="M0,430 Q220,400 420,470 L400,510 Q200,430 0,470 Z" fill="#9333ea" />
            <path d="M0,420 Q220,390 420,460 L410,470 Q210,400 0,430 Z" fill="#c084fc" />

            <!-- Row 3 (Foreground lush blooms) -->
            <path d="M0,500 Q200,460 360,560 L340,600 Q180,500 0,550 Z" fill="#7e22ce" />
            <path d="M0,490 Q200,450 360,550 L350,560 Q190,460 0,500 Z" fill="#a855f7" />

            <!-- Right side lavender patch -->
            <path d="M570,420 Q680,400 800,410 L800,470 Q680,440 560,450 Z" fill="#9333ea" />
            <path d="M550,470 Q670,450 800,480 L800,560 Q670,510 520,530 Z" fill="#7e22ce" />
            <path d="M500,540 Q650,510 800,560 L800,600 L460,600 Z" fill="#6b21a8" />
          </g>

          <!-- Rustic Wooden Fence on left -->
          <g stroke="#78350f" stroke-width="4" stroke-linecap="round">
            <line x1="40" y1="360" x2="40" y2="400" />
            <line x1="90" y1="365" x2="90" y2="405" />
            <line x1="140" y1="370" x2="140" y2="410" />
            <line x1="25" y1="375" x2="155" y2="385" stroke-width="3" />
            <line x1="25" y1="395" x2="155" y2="405" stroke-width="3" />
          </g>
        `;
      }
    },

    'autumn-lake': {
      width: 800,
      height: 600,
      rows: 3,
      cols: 4,
      renderSvg: function() {
        return `
          <defs>
            <linearGradient id="sky-autumn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#f97316" />
              <stop offset="40%" stop-color="#fbbf24" />
              <stop offset="80%" stop-color="#fef08a" />
              <stop offset="100%" stop-color="#fed7aa" />
            </linearGradient>
            <linearGradient id="lake-autumn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#f59e0b" />
              <stop offset="40%" stop-color="#b45309" />
              <stop offset="100%" stop-color="#1e293b" />
            </linearGradient>
          </defs>

          <!-- Sunset Sky -->
          <rect width="800" height="320" fill="url(#sky-autumn)" />

          <!-- Distant Amber Hills -->
          <ellipse cx="250" cy="320" rx="350" ry="100" fill="#9a3412" opacity="0.6" />
          <ellipse cx="600" cy="320" rx="300" ry="90" fill="#7c2d12" opacity="0.7" />

          <!-- Golden & Scarlet Autumn Trees on Shoreline -->
          <!-- Left Tree Cluster (Brilliant orange and red maples) -->
          <g>
            <!-- Tree trunks -->
            <rect x="80" y="240" width="16" height="85" fill="#451a03" />
            <rect x="140" y="250" width="14" height="75" fill="#451a03" />
            <rect x="220" y="260" width="18" height="65" fill="#451a03" />

            <!-- Foliage Canopy -->
            <circle cx="88" cy="200" r="60" fill="#ef4444" opacity="0.9" />
            <circle cx="70" cy="180" r="45" fill="#f97316" />
            <circle cx="105" cy="170" r="45" fill="#eab308" />

            <circle cx="147" cy="210" r="50" fill="#f97316" opacity="0.95" />
            <circle cx="160" cy="190" r="40" fill="#facc15" />

            <circle cx="229" cy="230" r="55" fill="#dc2626" opacity="0.9" />
            <circle cx="215" cy="210" r="42" fill="#ea580c" />
          </g>

          <!-- Right Tree Cluster -->
          <g>
            <rect x="680" y="230" width="18" height="95" fill="#451a03" />
            <rect x="740" y="240" width="16" height="85" fill="#451a03" />

            <circle cx="689" cy="180" r="65" fill="#eab308" opacity="0.9" />
            <circle cx="670" cy="160" r="48" fill="#f97316" />
            <circle cx="710" cy="160" r="48" fill="#ef4444" />

            <circle cx="748" cy="200" r="55" fill="#f97316" opacity="0.95" />
          </g>

          <!-- Autumn Lake Water -->
          <rect y="315" width="800" height="285" fill="url(#lake-autumn)" />

          <!-- Water Reflections of Trees & Sun -->
          <g opacity="0.5">
            <ellipse cx="90" cy="380" rx="70" ry="35" fill="#ef4444" />
            <ellipse cx="150" cy="390" rx="55" ry="30" fill="#f97316" />
            <ellipse cx="230" cy="400" rx="60" ry="30" fill="#dc2626" />
            <ellipse cx="690" cy="380" rx="70" ry="35" fill="#eab308" />
            <ellipse cx="750" cy="390" rx="60" ry="30" fill="#f97316" />
            <ellipse cx="400" cy="350" rx="180" ry="25" fill="#fde047" opacity="0.6" />
          </g>

          <!-- Wooden Dock Pier Extending into Water (Center-Left) -->
          <g transform="translate(320, 370)">
            <!-- Dock Pilings / Posts -->
            <rect x="0" y="20" width="10" height="70" fill="#292524" />
            <rect x="70" y="30" width="10" height="80" fill="#292524" />
            <rect x="140" y="45" width="10" height="90" fill="#292524" />

            <!-- Wooden Pier Boards -->
            <polygon points="-40,0 150,55 140,75 -50,15" fill="#78350f" stroke="#451a03" stroke-width="2" />
            <!-- Board lines -->
            <line x1="-15" y1="9" x2="-5" y2="28" stroke="#451a03" stroke-width="2" />
            <line x1="25" y1="23" x2="35" y2="42" stroke="#451a03" stroke-width="2" />
            <line x1="65" y1="37" x2="75" y2="56" stroke="#451a03" stroke-width="2" />
            <line x1="105" y1="51" x2="115" y2="70" stroke="#451a03" stroke-width="2" />

            <!-- Lantern on dock post -->
            <circle cx="145" cy="35" r="8" fill="#fef08a" opacity="0.9" />
            <rect x="141" y="28" width="8" height="14" fill="none" stroke="#1c1917" stroke-width="2" />

            <!-- Classic Wooden Rowboat tied to dock -->
            <g transform="translate(130, 80)">
              <ellipse cx="60" cy="35" rx="60" ry="18" fill="#854d0e" stroke="#451a03" stroke-width="2" />
              <ellipse cx="60" cy="33" rx="52" ry="12" fill="#a16207" />
              <!-- Seats -->
              <rect x="35" y="27" width="10" height="12" fill="#713f12" />
              <rect x="75" y="27" width="10" height="12" fill="#713f12" />
              <!-- Oar -->
              <line x1="20" y1="10" x2="80" y2="45" stroke="#451a03" stroke-width="3" stroke-linecap="round" />
            </g>
          </g>

          <!-- Water Ripples -->
          <g stroke="#fed7aa" stroke-width="2" stroke-linecap="round" opacity="0.7">
            <line x1="60" y1="460" x2="160" y2="460" />
            <line x1="200" y1="510" x2="340" y2="510" />
            <line x1="580" y1="480" x2="720" y2="480" />
            <line x1="480" y1="540" x2="640" y2="540" />
            <line x1="300" y1="570" x2="480" y2="570" />
          </g>

          <!-- Floating Autumn Leaves on Water -->
          <circle cx="180" cy="480" r="4" fill="#ef4444" />
          <circle cx="260" cy="530" r="5" fill="#f97316" />
          <circle cx="620" cy="500" r="4" fill="#eab308" />
          <circle cx="540" cy="560" r="5" fill="#dc2626" />
        `;
      }
    },

    'forest-waterfall': {
      width: 800,
      height: 800,
      rows: 4,
      cols: 4,
      renderSvg: function() {
        return `
          <defs>
            <linearGradient id="forest-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#dcfce7" />
              <stop offset="50%" stop-color="#bbf7d0" />
              <stop offset="100%" stop-color="#86efac" />
            </linearGradient>
            <linearGradient id="cascade-water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#e0f2fe" />
              <stop offset="30%" stop-color="#bae6fd" />
              <stop offset="70%" stop-color="#7dd3fc" />
              <stop offset="100%" stop-color="#38bdf8" />
            </linearGradient>
            <linearGradient id="pool-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0284c7" />
              <stop offset="60%" stop-color="#0369a1" />
              <stop offset="100%" stop-color="#075985" />
            </linearGradient>
          </defs>

          <!-- Sky & Upper Canopy Backdrop -->
          <rect width="800" height="800" fill="url(#forest-sky)" />

          <!-- Sunbeams filtering through forest canopy -->
          <g opacity="0.3">
            <polygon points="400,0 200,600 270,600" fill="#fef08a" />
            <polygon points="400,0 350,600 420,600" fill="#fef08a" />
            <polygon points="400,0 520,600 600,600" fill="#fef08a" />
          </g>

          <!-- Dense Forest Foliage & Branches (Top & Sides) -->
          <g fill="#14532d">
            <ellipse cx="120" cy="80" rx="160" ry="90" />
            <ellipse cx="680" cy="70" rx="170" ry="85" />
            <ellipse cx="400" cy="40" rx="200" ry="70" />
          </g>
          <g fill="#166534">
            <ellipse cx="80" cy="150" rx="130" ry="80" />
            <ellipse cx="720" cy="140" rx="140" ry="80" />
          </g>
          <g fill="#15803d">
            <ellipse cx="140" cy="220" rx="100" ry="70" />
            <ellipse cx="660" cy="210" rx="110" ry="75" />
          </g>

          <!-- Massive Cliff Face Rocks (Center) -->
          <polygon points="180,240 620,240 680,620 120,620" fill="#334155" />
          <!-- Rock texture facets -->
          <polygon points="180,240 340,240 310,420 150,420" fill="#475569" />
          <polygon points="460,240 620,240 650,420 490,420" fill="#1e293b" />
          <polygon points="150,420 310,420 280,620 120,620" fill="#1e293b" />
          <polygon points="490,420 650,420 680,620 520,620" fill="#475569" />

          <!-- Moss Overgrowth on rocks -->
          <path d="M180,250 Q280,230 350,260 T480,250 L470,290 Q360,270 190,280 Z" fill="#65a30d" />
          <path d="M520,380 Q590,360 660,390 L650,430 Q580,400 510,420 Z" fill="#4d7c0f" />
          <path d="M140,520 Q220,500 280,530 L270,570 Q200,540 130,560 Z" fill="#65a30d" />

          <!-- Cascading Azure Waterfall (Center stream) -->
          <g>
            <!-- Waterfall main column -->
            <polygon points="340,240 460,240 490,620 310,620" fill="url(#cascade-water)" />
            <!-- White water foam & surge lines -->
            <g stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.85">
              <line x1="360" y1="260" x2="355" y2="400" />
              <line x1="385" y1="250" x2="380" y2="460" />
              <line x1="400" y1="270" x2="400" y2="520" />
              <line x1="415" y1="250" x2="420" y2="480" />
              <line x1="440" y1="260" x2="445" y2="420" />

              <line x1="345" y1="420" x2="335" y2="600" />
              <line x1="375" y1="460" x2="370" y2="610" />
              <line x1="425" y1="480" x2="430" y2="610" />
              <line x1="460" y1="430" x2="470" y2="600" />
            </g>

            <!-- Tiered rock shelf ledge break -->
            <polygon points="325,410 475,410 490,435 310,435" fill="#1e293b" />
            <!-- Water spray / froth over shelf -->
            <ellipse cx="400" cy="430" rx="95" ry="16" fill="#f0f9ff" opacity="0.9" />
          </g>

          <!-- Plunge Pool at base -->
          <rect y="600" width="800" height="200" fill="url(#pool-grad)" />

          <!-- Big Waterfall Impact Splash & Foam Cloud -->
          <g fill="#f0f9ff" opacity="0.9">
            <ellipse cx="400" cy="620" rx="140" ry="32" />
            <circle cx="330" cy="610" r="28" />
            <circle cx="400" cy="600" r="34" />
            <circle cx="470" cy="610" r="28" />
            <circle cx="360" cy="590" r="22" />
            <circle cx="440" cy="590" r="22" />
          </g>

          <!-- Water Droplet Spray Particles -->
          <g fill="#e0f2fe" opacity="0.85">
            <circle cx="310" cy="560" r="5" />
            <circle cx="490" cy="550" r="6" />
            <circle cx="335" cy="530" r="4" />
            <circle cx="465" cy="520" r="5" />
            <circle cx="280" cy="600" r="6" />
            <circle cx="520" cy="590" r="6" />
          </g>

          <!-- Subtle Mist Rainbow Arc -->
          <path d="M260,620 Q400,480 540,620" stroke="#fef08a" stroke-width="10" fill="none" opacity="0.35" />
          <path d="M265,620 Q400,490 535,620" stroke="#a7f3d0" stroke-width="8" fill="none" opacity="0.3" />
          <path d="M270,620 Q400,500 530,620" stroke="#bfdbfe" stroke-width="8" fill="none" opacity="0.3" />

          <!-- Foreground River Rocks & Ferns -->
          <g fill="#475569">
            <ellipse cx="80" cy="720" rx="90" ry="50" />
            <ellipse cx="720" cy="730" rx="100" ry="55" />
            <ellipse cx="220" cy="770" rx="70" ry="35" />
            <ellipse cx="580" cy="760" rx="80" ry="40" />
          </g>

          <!-- Fern Leaves on bank -->
          <g fill="#16a34a">
            <path d="M20,670 Q60,640 100,680 Q60,670 20,670 Z" />
            <path d="M30,690 Q80,660 120,700 Q75,690 30,690 Z" />
            <path d="M780,680 Q740,650 700,690 Q740,680 780,680 Z" />
            <path d="M770,700 Q720,670 680,710 Q725,700 770,700 Z" />
          </g>

          <!-- Pool Concentric Wave Ripples -->
          <g stroke="#7dd3fc" stroke-width="2.5" fill="none" opacity="0.6">
            <ellipse cx="400" cy="650" rx="180" ry="28" />
            <ellipse cx="400" cy="690" rx="250" ry="38" />
            <ellipse cx="400" cy="735" rx="310" ry="46" />
          </g>
        `;
      }
    }
  };

  /**
   * Renders the complete artwork SVG string for a given scene.
   */
  function getFullArtworkSvg(sceneId) {
    const artwork = SCENE_ARTWORKS[sceneId];
    if (!artwork) return '';
    return `
      <svg class="jig-scene-svg" viewBox="0 0 ${artwork.width} ${artwork.height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        ${artwork.renderSvg()}
      </svg>
    `;
  }

  /**
   * Renders an individual puzzle piece block SVG string.
   * Uses SVG viewBox slicing to focus on the exact cell region.
   */
  function getPieceSvg(sceneId, pieceIndex) {
    const artwork = SCENE_ARTWORKS[sceneId];
    if (!artwork) return '';

    const cols = artwork.cols;
    const rows = artwork.rows;
    const cellW = artwork.width / cols;
    const cellH = artwork.height / rows;

    const row = Math.floor(pieceIndex / cols);
    const col = pieceIndex % cols;

    const minX = col * cellW;
    const minY = row * cellH;

    return `
      <svg class="jig-piece-slice-svg" viewBox="${minX} ${minY} ${cellW} ${cellH}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        ${artwork.renderSvg()}
      </svg>
    `;
  }

  const Scenes = {
    SCENE_ARTWORKS,
    getFullArtworkSvg,
    getPieceSvg
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Scenes;
  }
  if (typeof window !== 'undefined') {
    window.JigpicScenes = Scenes;
  }
})();
