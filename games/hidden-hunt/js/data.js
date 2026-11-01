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
            { id: 'key', name: 'Golden Skeleton Key', icon: '🗝️', x: 0.50, y: 0.88, radius: 0.055, hint: 'Resting on the mahogany desk surface below the open ledger' },
            { id: 'hourglass', name: 'Brass Hourglass', icon: '⏳', x: 0.22, y: 0.39, radius: 0.048, hint: 'Upright on the middle shelf of the left bookcase' },
            { id: 'quill', name: 'Antique Feather Quill', icon: '🪶', x: 0.58, y: 0.68, radius: 0.052, hint: 'Inside the ceramic inkpot beside the open ledger' },
            { id: 'globe', name: 'Celestial Globe', icon: '🌐', x: 0.91, y: 0.62, radius: 0.065, hint: 'Large brass armillary sphere on the right desk corner' },
            { id: 'book', name: 'Green Leather Grimoire', icon: '📗', x: 0.69, y: 0.50, radius: 0.050, hint: 'Emerald green book with gold filigree on the right shelf beside the telescope' }
          ]
        },
        {
          id: 'lib_2',
          number: 2,
          title: 'The Forgotten Bookshelf',
          parTime: 85,
          objects: [
            { id: 'pocket_watch', name: 'Brass Carriage Clock', icon: '⏱️', x: 0.485, y: 0.33, radius: 0.045, hint: 'Antique clock on the center fireplace mantel' },
            { id: 'lens', name: 'Magnifying Glass', icon: '🔍', x: 0.64, y: 0.85, radius: 0.045, hint: 'Resting on the open ledger desk papers' },
            { id: 'painting', name: 'Tall Ship Painting', icon: '🖼️', x: 0.475, y: 0.20, radius: 0.065, hint: 'Gilded oil painting above the fireplace' },
            { id: 'telescope', name: 'Brass Telescope', icon: '🔭', x: 0.78, y: 0.52, radius: 0.055, hint: 'Mounted on tripod near the window' },
            { id: 'candlestick', name: 'Brass Candlestick', icon: '🕯️', x: 0.58, y: 0.34, radius: 0.045, hint: 'Candlestick on the fireplace mantel shelf' }
          ]
        },
        {
          id: 'lib_3',
          number: 3,
          title: "The Collector's Desk",
          parTime: 80,
          objects: [
            { id: 'armchair', name: 'Tufted Leather Armchair', icon: '🛋️', x: 0.16, y: 0.68, radius: 0.070, hint: 'Vintage wingback chair on the oriental rug' },
            { id: 'urn', name: 'Grecian Ceramic Urn', icon: '🏺', x: 0.27, y: 0.19, radius: 0.045, hint: 'White decorative urn on the upper left shelf' },
            { id: 'scroll', name: 'Tied Document Scroll', icon: '📜', x: 0.25, y: 0.30, radius: 0.045, hint: 'Rolled parchment bundle on the middle shelf' },
            { id: 'carpet', name: 'Persian Rug Border', icon: '🧶', x: 0.22, y: 0.92, radius: 0.055, hint: 'Intricate floral weave on the wooden floor' },
            { id: 'inkpot', name: 'White Glazed Inkpot', icon: '🖋️', x: 0.555, y: 0.78, radius: 0.045, hint: 'Square ceramic ink vessel on the desk' }
          ]
        },
        {
          id: 'lib_4',
          number: 4,
          title: 'The Secret Archive',
          parTime: 75,
          objects: [
            { id: 'window', name: 'Leaded Glass Window', icon: '🪟', x: 0.88, y: 0.32, radius: 0.065, hint: 'Gothic arched window with moonlight glow' },
            { id: 'drapes', name: 'Emerald Velvet Drape', icon: '🎋', x: 0.80, y: 0.22, radius: 0.055, hint: 'Deep green velvet curtain cascade' },
            { id: 'log', name: 'Fireplace Hearth Fire', icon: '🔥', x: 0.48, y: 0.65, radius: 0.060, hint: 'Warm glowing embers in the brick fireplace' },
            { id: 'bookstack', name: 'Stack of Leather Volumes', icon: '📚', x: 0.31, y: 0.73, radius: 0.050, hint: 'Pile of antique books beside the hearth' },
            { id: 'drawer', name: 'Carved Brass Drawer Handle', icon: '🏷️', x: 0.83, y: 0.96, radius: 0.045, hint: 'Ornate brass pull on the desk drawer' }
          ]
        },
        {
          id: 'lib_5',
          number: 5,
          title: 'The Locked Study',
          parTime: 70,
          objects: [
            { id: 'ship', name: 'Sailing Vessel Frigate', icon: '⛵', x: 0.475, y: 0.19, radius: 0.055, hint: 'Majestic frigate canvas above the hearth' },
            { id: 'compass', name: 'Brass Star Astrolabe', icon: '🧭', x: 0.38, y: 0.32, radius: 0.045, hint: 'Golden sphere instrument on the mantel corner' },
            { id: 'ledger', name: 'Open Reading Ledger', icon: '📖', x: 0.72, y: 0.80, radius: 0.065, hint: 'Wide open leather research journal on the desk' },
            { id: 'scrimshaw', name: 'Decorative Shell Trinket', icon: '🐚', x: 0.42, y: 0.35, radius: 0.040, hint: 'Carved cameo on the fireplace shelf' },
            { id: 'bookend', name: 'Oak Carved Bookend', icon: '🪵', x: 0.14, y: 0.39, radius: 0.045, hint: 'Supporting the heavy leather tomes on the left' }
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
            { id: 'fairy_lantern', name: 'Fairy Lantern', icon: '🏮', x: 0.225, y: 0.335, radius: 0.050, hint: 'Warm glowing brass lantern hanging from the mossy branch' },
            { id: 'wooden_acorn', name: 'Carved Wooden Acorn', icon: '🌰', x: 0.642, y: 0.645, radius: 0.050, hint: 'Carved acorn trinket on the mossy rock beside the stream' },
            { id: 'blue_butterfly', name: 'Blue Morpho Butterfly', icon: '🦋', x: 0.182, y: 0.765, radius: 0.055, hint: 'Vibrant azure butterfly resting on the lower-left fern' },
            { id: 'golden_mushroom', name: 'Golden Mushroom', icon: '🍄', x: 0.755, y: 0.515, radius: 0.050, hint: 'Glistening golden mushroom on the gnarled tree roots' },
            { id: 'dewdrop_vial', name: 'Crystal Dewdrop Vial', icon: '🧪', x: 0.552, y: 0.895, radius: 0.048, hint: 'Clear potion bottle with elixir among the river stones' }
          ]
        },
        {
          id: 'for_2',
          number: 2,
          title: 'The Mushroom Garden',
          parTime: 85,
          objects: [
            { id: 'celtic_cross', name: 'Celtic Stone Cross', icon: '✝️', x: 0.345, y: 0.440, radius: 0.065, hint: 'Carved stone monument covered in flowering vines' },
            { id: 'firefly', name: 'Golden Firefly Cluster', icon: '✨', x: 0.210, y: 0.485, radius: 0.045, hint: 'Dancing fireflies beside the stone ruin' },
            { id: 'willow', name: 'Weeping Willow Boughs', icon: '🌿', x: 0.810, y: 0.150, radius: 0.065, hint: 'Sunlit hanging leafy canopy' },
            { id: 'mossy_log', name: 'Hollow Mossy Log', icon: '🪵', x: 0.410, y: 0.820, radius: 0.060, hint: 'Fallen tree trunk bridging the forest brook' },
            { id: 'purple_shroom', name: 'Purple Luminescent Fungi', icon: '🍄', x: 0.895, y: 0.665, radius: 0.050, hint: 'Bioluminescent mushrooms glowing near right tree trunk' }
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
            { id: 'doubloon', name: 'Spanish Silver Doubloon', icon: '🪙', x: 0.076, y: 0.776, radius: 0.050, hint: 'Resting flat on the wooden rum barrel lid' },
            { id: 'treasure_map', name: 'Rolled Treasure Map', icon: '📜', x: 0.350, y: 0.555, radius: 0.055, hint: 'Yellowed parchment map tied with red twine on the chart table' },
            { id: 'pirate_compass', name: 'Jeweled Pirate Compass', icon: '🧭', x: 0.415, y: 0.685, radius: 0.050, hint: 'Ornate brass compass with inlaid rubies on the chart table' },
            { id: 'skull_brooch', name: 'Golden Skull Brooch', icon: '💀', x: 0.718, y: 0.772, radius: 0.045, hint: 'Gold skull badge pinned to the pirate tricorn hat on the chair' },
            { id: 'message_bottle', name: 'Glass Message Bottle', icon: '🍾', x: 0.910, y: 0.665, radius: 0.055, hint: 'Antique green rum bottle with cork on the iron-banded chest' }
          ]
        },
        {
          id: 'pir_2',
          number: 2,
          title: 'The Treasure Deck',
          parTime: 85,
          objects: [
            { id: 'cutlass', name: 'Pirate Cutlass Sword', icon: '⚔️', x: 0.615, y: 0.610, radius: 0.065, hint: 'Curved steel blade lying on the captain desk' },
            { id: 'sextant', name: 'Brass Navigational Sextant', icon: '📐', x: 0.385, y: 0.590, radius: 0.050, hint: 'Triangular brass sighting tool on the nautical chart' },
            { id: 'stern_window', name: 'Stern Gallery Window', icon: '🪟', x: 0.525, y: 0.350, radius: 0.065, hint: 'Arched glass panes overlooking the moonlit ocean' },
            { id: 'lantern', name: 'Brass Ship Lantern', icon: '🏮', x: 0.330, y: 0.170, radius: 0.055, hint: 'Swinging brass gimbal lantern from ceiling beam' },
            { id: 'skull_flag', name: 'Jolly Roger Ship Flag', icon: '🏴‍☠️', x: 0.042, y: 0.420, radius: 0.060, hint: 'Black skull-and-crossbones banner hanging on left wall' }
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
            { id: 'cap_seal', name: 'Wax Fleet Signet', icon: '🔏', x: 0.38, y: 0.42, radius: 0.045, hint: 'Beside the sealing wax stick' }
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
