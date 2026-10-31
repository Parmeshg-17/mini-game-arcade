/**
 * Hidden Hunt — Worlds, Levels, and Object Metadata Catalog
 * Defines the 3 themed worlds, 15 individual levels, precise normalized object coordinates,
 * hint locations, difficulty tiers, and achievement criteria.
 */
(function(exports) {
  'use strict';

  const WORLDS = [
    {
      id: 'library',
      name: 'The Old Library',
      description: 'A vintage, mysterious archive of antique books, astronomical charts, and hidden curiosities.',
      palette: {
        primary: '#ffd166',
        secondary: '#d5ff55',
        bg: '#1a1510',
        card: '#292119'
      },
      levels: [
        {
          id: 'lib_1',
          number: 1,
          title: 'The Reading Room',
          parTime: 90, // seconds for 3-star speed in Timed Mode
          objects: [
            { id: 'key', name: 'Golden Skeleton Key', icon: '🗝️', x: 0.28, y: 0.62, radius: 0.045, hint: 'Resting on the mahogany desk ledger' },
            { id: 'hourglass', name: 'Brass Hourglass', icon: '⏳', x: 0.72, y: 0.44, radius: 0.045, hint: 'Placed upon the upper right study shelf' },
            { id: 'quill', name: 'Antique Feather Quill', icon: '🪶', x: 0.46, y: 0.58, radius: 0.045, hint: 'Beside the open reading book' },
            { id: 'globe', name: 'Celestial Globe', icon: '🌐', x: 0.85, y: 0.32, radius: 0.055, hint: 'Top right shelf corner stand' },
            { id: 'book', name: 'Green Leather Grimoire', icon: '📗', x: 0.15, y: 0.35, radius: 0.045, hint: 'Tucked between left tall volumes' }
          ]
        },
        {
          id: 'lib_2',
          number: 2,
          title: 'The Forgotten Bookshelf',
          parTime: 85,
          objects: [
            { id: 'pocket_watch', name: 'Brass Pocket Watch', icon: '⏱️', x: 0.64, y: 0.52, radius: 0.045, hint: 'Hanging over the oak shelf ledge' },
            { id: 'lens', name: 'Magnifying Glass', icon: '🔍', x: 0.32, y: 0.70, radius: 0.045, hint: 'Resting on the lower research table' },
            { id: 'seal', name: 'Wax Stamp Seal', icon: '🛡️', x: 0.48, y: 0.38, radius: 0.045, hint: 'Next to the archive card catalog' },
            { id: 'scroll', name: 'Rolled Map Parchment', icon: '📜', x: 0.82, y: 0.68, radius: 0.045, hint: 'Tucked inside the document cylinder' },
            { id: 'inkwell', name: 'Silver Inkwell', icon: '🖋️', x: 0.20, y: 0.56, radius: 0.045, hint: 'On the left writing surface' }
          ]
        },
        {
          id: 'lib_3',
          number: 3,
          title: "The Collector's Desk",
          parTime: 80,
          objects: [
            { id: 'astrolabe', name: 'Astrolabe Disc', icon: '🧭', x: 0.55, y: 0.48, radius: 0.050, hint: 'Centered near the brass star chart' },
            { id: 'brooch', name: 'Cameo Brooch', icon: '💎', x: 0.25, y: 0.65, radius: 0.045, hint: 'In the velvet jewelry tray' },
            { id: 'calipers', name: 'Brass Calipers', icon: '📐', x: 0.75, y: 0.58, radius: 0.045, hint: 'Measuring the architectural draft' },
            { id: 'prism', name: 'Crystal Prism', icon: '🔮', x: 0.38, y: 0.36, radius: 0.045, hint: 'Refracting light on the upper shelf' },
            { id: 'stamp', name: 'Antique Postage Stamp', icon: '✉️', x: 0.88, y: 0.42, radius: 0.040, hint: 'Affixed to the vintage airmail envelope' }
          ]
        },
        {
          id: 'lib_4',
          number: 4,
          title: 'The Secret Archive',
          parTime: 75,
          objects: [
            { id: 'sundial', name: 'Pocket Sundial', icon: '☀️', x: 0.30, y: 0.45, radius: 0.045, hint: 'Near the window ray beam' },
            { id: 'cipher', name: 'Cipher Cylinder', icon: '🔐', x: 0.70, y: 0.62, radius: 0.045, hint: 'Resting on the encrypted journal' },
            { id: 'coin', name: 'Ancient Bronze Coin', icon: '🪙', x: 0.45, y: 0.72, radius: 0.040, hint: 'Hidden beside the stack of deeds' },
            { id: 'glasses', name: 'Reading Spectacles', icon: '👓', x: 0.18, y: 0.60, radius: 0.045, hint: 'Folded on top of the open folio' },
            { id: 'bookmark', name: 'Silk Ribbon Bookmark', icon: '🔖', x: 0.84, y: 0.38, radius: 0.045, hint: 'Draped out of the top archive codex' }
          ]
        },
        {
          id: 'lib_5',
          number: 5,
          title: 'The Locked Study',
          parTime: 70,
          objects: [
            { id: 'keyring', name: 'Master Key Ring', icon: '🔑', x: 0.50, y: 0.50, radius: 0.050, hint: 'Hanging from the central drawer keyhole' },
            { id: 'musicbox', name: 'Mechanical Music Box', icon: '📻', x: 0.22, y: 0.42, radius: 0.050, hint: 'Wind-up box on the cedar side stand' },
            { id: 'monocular', name: 'Brass Monocular', icon: '🔭', x: 0.78, y: 0.35, radius: 0.045, hint: 'Aimed toward the vaulted skylight' },
            { id: 'candle', name: 'Red Wax Candle', icon: '🕯️', x: 0.35, y: 0.68, radius: 0.045, hint: 'Flickering in the pewter candlestick' },
            { id: 'journal', name: 'Embossed Leather Journal', icon: '📕', x: 0.65, y: 0.74, radius: 0.045, hint: 'Closed book with golden latch' }
          ]
        }
      ]
    },
    {
      id: 'forest',
      name: 'Mystery Forest',
      description: 'An enchanted woodland glowing with fairy flora, mossy stone relics, and mystical wildlife.',
      palette: {
        primary: '#38bdf8',
        secondary: '#d5ff55',
        bg: '#0f1710',
        card: '#162419'
      },
      levels: [
        {
          id: 'for_1',
          number: 1,
          title: 'The Forest Entrance',
          parTime: 90,
          objects: [
            { id: 'acorn', name: 'Golden Acorn', icon: '🌰', x: 0.26, y: 0.72, radius: 0.045, hint: 'Nestled in the root moss' },
            { id: 'lantern', name: 'Firefly Lantern', icon: '🏮', x: 0.75, y: 0.36, radius: 0.050, hint: 'Hanging from the twisted oak bough' },
            { id: 'rune', name: 'Carved Stone Rune', icon: '🪨', x: 0.42, y: 0.55, radius: 0.045, hint: 'Embedded in the ancient boundary monolith' },
            { id: 'butterfly', name: 'Blue Morpho Butterfly', icon: '🦋', x: 0.60, y: 0.25, radius: 0.045, hint: 'Resting upon the wild fern frond' },
            { id: 'mushroom', name: 'Glowing Forest Mushroom', icon: '🍄', x: 0.16, y: 0.65, radius: 0.045, hint: 'Sprouting at the base of the hollow birch' }
          ]
        },
        {
          id: 'for_2',
          number: 2,
          title: 'The Mushroom Garden',
          parTime: 85,
          objects: [
            { id: 'toadstool', name: 'Scarlet Toadstool', icon: '🍄', x: 0.35, y: 0.58, radius: 0.045, hint: 'Under the shade of the weeping willow' },
            { id: 'snail', name: 'Spiral Forest Snail', icon: '🐌', x: 0.68, y: 0.70, radius: 0.040, hint: 'Slowly climbing the damp moss log' },
            { id: 'whistle', name: 'Carved Bird Whistle', icon: '🪈', x: 0.82, y: 0.45, radius: 0.045, hint: 'Tucked inside the tree knot cavity' },
            { id: 'spiderweb', name: 'Dewdrop Spiderweb', icon: '🕸️', x: 0.18, y: 0.30, radius: 0.050, hint: 'Spun between two low hazel branches' },
            { id: 'pinecone', name: 'Spruce Pinecone', icon: '🌲', x: 0.52, y: 0.40, radius: 0.045, hint: 'Resting on the pine needle carpet' }
          ]
        },
        {
          id: 'for_3',
          number: 3,
          title: 'The Hidden Waterfall',
          parTime: 80,
          objects: [
            { id: 'amulet', name: 'River Pebble Amulet', icon: '🧿', x: 0.48, y: 0.68, radius: 0.045, hint: 'Washed ashore near the waterfall pool' },
            { id: 'lily', name: 'Glowing Water Lily', icon: '🪷', x: 0.28, y: 0.78, radius: 0.045, hint: 'Floating serenely on the crystal pond' },
            { id: 'dragonfly', name: 'Emerald Dragonfly', icon: '🪰', x: 0.72, y: 0.32, radius: 0.045, hint: 'Hovering above the mist spray' },
            { id: 'flute', name: 'Bamboo Flute', icon: '🎋', x: 0.85, y: 0.60, radius: 0.045, hint: 'Leaning against the wet river rock' },
            { id: 'quartz', name: 'Clear Quartz Cluster', icon: '💎', x: 0.15, y: 0.52, radius: 0.045, hint: 'Gleaming in the rock crevice' }
          ]
        },
        {
          id: 'for_4',
          number: 4,
          title: 'The Forgotten Treehouse',
          parTime: 75,
          objects: [
            { id: 'ladder', name: 'Rope Ladder Rung', icon: '🪜', x: 0.24, y: 0.45, radius: 0.045, hint: 'Hanging down the trunk side' },
            { id: 'canteen', name: 'Tin Travel Canteen', icon: '🍶', x: 0.65, y: 0.62, radius: 0.045, hint: 'Draped over the rustic timber bench' },
            { id: 'bell', name: 'Bronze Canopy Bell', icon: '🔔', x: 0.40, y: 0.28, radius: 0.045, hint: 'Tied to the look-out canopy branch' },
            { id: 'bear', name: 'Wooden Bear Figurine', icon: '🧸', x: 0.80, y: 0.52, radius: 0.045, hint: 'Sitting on the treehouse porch railing' },
            { id: 'slingshot', name: 'Forked Slingshot', icon: '🎯', x: 0.36, y: 0.75, radius: 0.045, hint: 'Hooked onto the tool rack peg' }
          ]
        },
        {
          id: 'for_5',
          number: 5,
          title: 'The Enchanted Grove',
          parTime: 70,
          objects: [
            { id: 'chime', name: 'Wind Chime Tube', icon: '🎐', x: 0.50, y: 0.32, radius: 0.045, hint: 'Suspended from the center sacred bough' },
            { id: 'leaf_pendant', name: 'Silver Leaf Pendant', icon: '🍃', x: 0.74, y: 0.65, radius: 0.045, hint: 'Tangled in the creeping ivy vine' },
            { id: 'crystal', name: 'Moonstone Geode', icon: '🔮', x: 0.22, y: 0.60, radius: 0.045, hint: 'Nestled inside the fairy circle ring' },
            { id: 'feather', name: 'Owl Night Feather', icon: '🪶', x: 0.38, y: 0.48, radius: 0.045, hint: 'Caught on the thorny bramble stem' },
            { id: 'basket', name: 'Woven Herb Basket', icon: '🧺', x: 0.62, y: 0.75, radius: 0.050, hint: 'Gathered on the clover lawn' }
          ]
        }
      ]
    },
    {
      id: 'pirate',
      name: "Pirate's Treasure",
      description: 'A daring high-seas odyssey through captain cabins, rigging decks, and secret cavern vaults.',
      palette: {
        primary: '#ff784f',
        secondary: '#ffd166',
        bg: '#12141a',
        card: '#1a1f29'
      },
      levels: [
        {
          id: 'pir_1',
          number: 1,
          title: 'The Pirate Cabin',
          parTime: 90,
          objects: [
            { id: 'spyglass', name: 'Brass Spyglass', icon: '🔭', x: 0.66, y: 0.40, radius: 0.050, hint: 'Extending across the navigation map' },
            { id: 'hat', name: "Captain's Tricorn Hat", icon: '🎩', x: 0.32, y: 0.35, radius: 0.055, hint: 'Resting on the peg above the sea bunk' },
            { id: 'cutlass', name: 'Steel Cutlass Sword', icon: '⚔️', x: 0.82, y: 0.60, radius: 0.050, hint: 'Sheathed beside the porthole window' },
            { id: 'barrel', name: 'Oak Grog Barrel', icon: '🛢️', x: 0.18, y: 0.68, radius: 0.055, hint: 'Lashed down in the lower cabin corner' },
            { id: 'doubloon', name: 'Golden Doubloon', icon: '🪙', x: 0.48, y: 0.72, radius: 0.040, hint: 'Glittering near the floorboard seam' }
          ]
        },
        {
          id: 'pir_2',
          number: 2,
          title: 'The Treasure Deck',
          parTime: 85,
          objects: [
            { id: 'helm', name: "Ship's Helm Wheel", icon: '☸️', x: 0.52, y: 0.30, radius: 0.055, hint: 'Commanding the raised quarterdeck' },
            { id: 'pulley', name: 'Rigging Block Pulley', icon: '⚙️', x: 0.78, y: 0.24, radius: 0.045, hint: 'Lashed to the mainmast stay ropes' },
            { id: 'anchor', name: 'Heavy Iron Anchor', icon: '뛢', x: 0.20, y: 0.58, radius: 0.055, hint: 'Resting against the starboard bulwark' },
            { id: 'flag', name: 'Jolly Roger Banner', icon: '🏴‍☠️', x: 0.36, y: 0.22, radius: 0.050, hint: 'Fluttering on the yardarm halyard' },
            { id: 'pipe', name: "Brass Bosun's Whistle", icon: '🎺', x: 0.62, y: 0.65, radius: 0.045, hint: 'Lying on the coiled hemp rope circle' }
          ]
        },
        {
          id: 'pir_3',
          number: 3,
          title: "The Captain's Quarters",
          parTime: 80,
          objects: [
            { id: 'chart', name: 'Nautical Island Chart', icon: '🗺️', x: 0.50, y: 0.55, radius: 0.050, hint: 'Pinned down on the war table' },
            { id: 'pistol', name: 'Flintlock Sea Pistol', icon: '🔫', x: 0.25, y: 0.62, radius: 0.045, hint: 'Resting inside the open gun rack case' },
            { id: 'compass', name: 'Antique Mariner Compass', icon: '🧭', x: 0.75, y: 0.50, radius: 0.045, hint: 'Mounted inside the brass gimbal case' },
            { id: 'bottle', name: 'Message in a Bottle', icon: '🍾', x: 0.85, y: 0.72, radius: 0.045, hint: 'Corked green bottle on the sideboard' },
            { id: 'cap_seal', name: "Wax Fleet Signet", icon: '🔏', x: 0.38, y: 0.42, radius: 0.045, hint: 'Beside the sealing wax stick' }
          ]
        },
        {
          id: 'pir_4',
          number: 4,
          title: 'The Forgotten Island',
          parTime: 75,
          objects: [
            { id: 'shovel', name: 'Iron Trench Shovel', icon: '⛏️', x: 0.30, y: 0.65, radius: 0.050, hint: 'Stuck into the sandy beach dune' },
            { id: 'shell', name: 'Nautilus Sea Shell', icon: '🐚', x: 0.70, y: 0.74, radius: 0.045, hint: 'Washed beside the driftwood log' },
            { id: 'oar', name: 'Weathered Rowboat Oar', icon: '🛶', x: 0.84, y: 0.42, radius: 0.050, hint: 'Propped against the palm tree trunk' },
            { id: 'parrot_feather', name: 'Scarlet Macaw Feather', icon: '🪶', x: 0.55, y: 0.28, radius: 0.045, hint: 'Drifting on the tropical palm frond' },
            { id: 'island_map', name: 'X-Marks Parchment', icon: '📜', x: 0.16, y: 0.48, radius: 0.045, hint: 'Weighted down by three beach pebbles' }
          ]
        },
        {
          id: 'pir_5',
          number: 5,
          title: 'The Treasure Chamber',
          parTime: 70,
          objects: [
            { id: 'chest', name: 'Jeweled Treasure Chest', icon: '🧰', x: 0.50, y: 0.58, radius: 0.060, hint: 'Centerpiece overflowing with gold' },
            { id: 'crown', name: 'Ruby Monarch Crown', icon: '👑', x: 0.28, y: 0.42, radius: 0.045, hint: 'Perched on the ancient stone stalagmite' },
            { id: 'necklace', name: 'Emerald Chain Necklace', icon: '📿', x: 0.72, y: 0.68, radius: 0.045, hint: 'Draped over the silver bullion bars' },
            { id: 'goblet', name: 'Engraved Gold Goblet', icon: '🏆', x: 0.38, y: 0.75, radius: 0.045, hint: 'Standing upright among the coin piles' },
            { id: 'skull', name: 'Golden Skull Talisman', icon: '💀', x: 0.76, y: 0.38, radius: 0.045, hint: 'Embedded high in the cavern rock shrine' }
          ]
        }
      ]
    }
  ];

  const ACHIEVEMENTS = [
    { id: 'first_discovery', name: 'First Discovery', desc: 'Complete your first hidden object level.', icon: '🎯' },
    { id: 'sharp_eyes', name: 'Sharp Eyes', desc: 'Find 5 objects in a row without making an error.', icon: '👁️' },
    { id: 'perfect_hunt', name: 'Perfect Hunt', desc: 'Finish any level with 100% search accuracy.', icon: '⭐' },
    { id: 'library_explorer', name: 'Library Explorer', desc: 'Master all 5 levels of The Old Library.', icon: '📚' },
    { id: 'forest_detective', name: 'Forest Detective', desc: 'Complete all 5 scenes of Mystery Forest.', icon: '🌲' },
    { id: 'treasure_hunter', name: 'Treasure Hunter', desc: "Uncover every treasure in Pirate's Treasure.", icon: '🏴‍☠️' },
    { id: 'master_observer', name: 'Master Observer', desc: 'Conquer all 15 initial scenes across all 3 worlds.', icon: '🏆' },
    { id: 'daily_scout', name: 'Daily Scout', desc: 'Successfully solve a Daily Hunt challenge.', icon: '📅' }
  ];

  exports.WORLDS = WORLDS;
  exports.ACHIEVEMENTS = ACHIEVEMENTS;

})(typeof exports === 'undefined' ? (window.HiddenHuntData = {}) : exports);
