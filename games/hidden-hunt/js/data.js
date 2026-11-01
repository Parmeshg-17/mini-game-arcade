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
            { id: 'pocket_watch', name: 'Brass Carriage Clock', icon: '⏱️', x: 0.21, y: 0.42, radius: 0.055, hint: 'Antique clock resting in the mahogany bookshelf nook' },
            { id: 'painting', name: 'Tall Ship Painting', icon: '🖼️', x: 0.30, y: 0.40, radius: 0.065, hint: 'Gilded oil painting hanging on the library wall' },
            { id: 'telescope', name: 'Brass Telescope', icon: '🔭', x: 0.50, y: 0.52, radius: 0.055, hint: 'Mounted on wooden tripod near the arched window' },
            { id: 'candlestick', name: 'Brass Candlestick', icon: '🕯️', x: 0.71, y: 0.64, radius: 0.050, hint: 'Polished candlestick on the side shelf' },
            { id: 'lens', name: 'Magnifying Glass', icon: '🔍', x: 0.83, y: 0.82, radius: 0.055, hint: 'Resting flat on the desk papers in the foreground' }
          ]
        },
        {
          id: 'lib_3',
          number: 3,
          title: "The Collector's Desk",
          parTime: 80,
          objects: [
            { id: 'armchair', name: 'Tufted Leather Armchair', icon: '🛋️', x: 0.27, y: 0.62, radius: 0.070, hint: 'Vintage tufted wingback armchair beside the bookshelves' },
            { id: 'urn', name: 'Grecian Ceramic Urn', icon: '🏺', x: 0.09, y: 0.43, radius: 0.050, hint: 'Decorative ceramic urn on the upper shelf' },
            { id: 'scroll', name: 'Tied Document Scroll', icon: '📜', x: 0.57, y: 0.50, radius: 0.050, hint: 'Rolled parchment bundle on the study desk' },
            { id: 'carpet', name: 'Persian Rug Border', icon: '🧶', x: 0.22, y: 0.92, radius: 0.065, hint: 'Intricate floral weave carpet on the wooden floor' },
            { id: 'inkpot', name: 'Blue Glazed Inkpot', icon: '🖋️', x: 0.67, y: 0.56, radius: 0.048, hint: 'Glazed porcelain ink vessel on the writing desk' }
          ]
        },
        {
          id: 'lib_4',
          number: 4,
          title: 'The Secret Archive',
          parTime: 75,
          objects: [
            { id: 'window', name: 'Gothic Leaded Window', icon: '🪟', x: 0.87, y: 0.28, radius: 0.065, hint: 'Gothic arched leaded window letting in amber moonlight' },
            { id: 'drapes', name: 'Crimson Velvet Drape', icon: '🎋', x: 0.61, y: 0.42, radius: 0.055, hint: 'Deep crimson velvet curtain framing the archive arch' },
            { id: 'log', name: 'Charcoal Hearth Fire', icon: '🔥', x: 0.56, y: 0.81, radius: 0.060, hint: 'Warm glowing embers in the hearth brazier' },
            { id: 'bookstack', name: 'Stack of Leather Volumes', icon: '📚', x: 0.15, y: 0.73, radius: 0.055, hint: 'Tall stack of antique leather-bound tomes on the floor' },
            { id: 'drawer', name: 'Carved Brass Drawer Handle', icon: '🏷️', x: 0.80, y: 0.79, radius: 0.050, hint: 'Ornate brass pull on the archive oak card catalog' }
          ]
        },
        {
          id: 'lib_5',
          number: 5,
          title: 'The Locked Study',
          parTime: 70,
          objects: [
            { id: 'ship', name: 'Sailing Vessel Frigate', icon: '⛵', x: 0.59, y: 0.51, radius: 0.055, hint: 'Exquisite miniature galleon displayed in the study bookcase' },
            { id: 'compass', name: 'Brass Star Astrolabe', icon: '🧭', x: 0.26, y: 0.71, radius: 0.050, hint: 'Gleaming celestial instrument on the study desk ledge' },
            { id: 'ledger', name: 'Open Reading Ledger', icon: '📖', x: 0.85, y: 0.66, radius: 0.060, hint: 'Heavy hand-bound leather codex resting open on the study table' },
            { id: 'scrimshaw', name: 'Decorative Shell Trinket', icon: '🐚', x: 0.48, y: 0.76, radius: 0.048, hint: 'Intricately etched nautilus shell curio on the desk' },
            { id: 'bookend', name: 'Oak Griffin Bookend', icon: '🪵', x: 0.08, y: 0.52, radius: 0.050, hint: 'Carved heraldic griffin supporting ancient tomes on the left shelf' }
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
            { id: 'celtic_cross', name: 'Celtic Stone Cross', icon: '✝️', x: 0.330, y: 0.440, radius: 0.065, hint: 'Weathered stone Celtic monument overgrown with moss in the glade' },
            { id: 'firefly', name: 'Golden Firefly Cluster', icon: '✨', x: 0.180, y: 0.450, radius: 0.055, hint: 'Glowing golden firefly cluster hovering above the forest flora' },
            { id: 'willow', name: 'Weeping Willow Boughs', icon: '🌿', x: 0.800, y: 0.150, radius: 0.065, hint: 'Cascading verdant willow branches catching dappled canopy sunlight' },
            { id: 'mossy_log', name: 'Hollow Mossy Log', icon: '🪵', x: 0.510, y: 0.840, radius: 0.065, hint: 'Ancient moss-covered fallen log lying across the forest floor' },
            { id: 'purple_shroom', name: 'Purple Luminescent Fungi', icon: '🍄', x: 0.850, y: 0.720, radius: 0.055, hint: 'Vibrant cluster of bioluminescent violet mushrooms at the base of the tree' }
          ]
        },
        {
          id: 'for_3',
          number: 3,
          title: 'The Hidden Waterfall',
          parTime: 80,
          objects: [
            { id: 'quartz', name: 'Clear Quartz Cluster', icon: '💎', x: 0.180, y: 0.490, radius: 0.055, hint: 'Clear quartz & amethyst crystal cluster embedded on the grotto rock shelf' },
            { id: 'lily', name: 'Glowing Water Lily', icon: '🪷', x: 0.270, y: 0.830, radius: 0.055, hint: 'Radiant water lily blossom floating on the crystal waterfall pool' },
            { id: 'amulet', name: 'River Jade Amulet', icon: '🧿', x: 0.580, y: 0.860, radius: 0.050, hint: 'Carved spiral green jade amulet resting on the mossy foreground rock' },
            { id: 'dragonfly', name: 'Emerald Dragonfly', icon: '🪰', x: 0.850, y: 0.330, radius: 0.050, hint: 'Iridescent emerald dragonfly perched along the river reeds' },
            { id: 'flute', name: 'Bamboo Flute', icon: '🎋', x: 0.870, y: 0.780, radius: 0.055, hint: 'Hand-carved bamboo flute tied with cord leaning against the rocks' }
          ]
        },
        {
          id: 'for_4',
          number: 4,
          title: 'The Forgotten Treehouse',
          parTime: 75,
          objects: [
            { id: 'ladder', name: 'Rope Ladder Rung', icon: '🪜', x: 0.160, y: 0.460, radius: 0.060, hint: 'Hemp rope ladder with wooden rungs dangling down the tree trunk' },
            { id: 'bell', name: 'Bronze Canopy Bell', icon: '🔔', x: 0.643, y: 0.105, radius: 0.050, hint: 'Antique cast-bronze ship bell mounted under the treehouse canopy eaves' },
            { id: 'canteen', name: 'Leather Travel Canteen', icon: '🍶', x: 0.712, y: 0.410, radius: 0.050, hint: 'Vintage embossed leather & pewter canteen hanging from the timber peg' },
            { id: 'bear', name: 'Carved Bear Figurine', icon: '🧸', x: 0.688, y: 0.825, radius: 0.050, hint: 'Carved cedar bear figurine standing upright on the deck planking' },
            { id: 'slingshot', name: 'Forked Oak Slingshot', icon: '🎯', x: 0.832, y: 0.740, radius: 0.050, hint: 'Y-shaped oak slingshot hooked over the horizontal deck railing' }
          ]
        },
        {
          id: 'for_5',
          number: 5,
          title: 'The Enchanted Grove',
          parTime: 70,
          objects: [
            { id: 'chime', name: 'Wind Chime Tube', icon: '🎐', x: 0.148, y: 0.388, radius: 0.055, hint: 'Tiered bamboo and seashell wind chime hanging from the sacred tree branch' },
            { id: 'leaf_pendant', name: 'Silver Leaf Pendant', icon: '🍃', x: 0.170, y: 0.778, radius: 0.055, hint: 'Sterling silver filigree oak leaf pendant resting on the mossy boulder' },
            { id: 'crystal', name: 'Lapis Lazuli Geode', icon: '🔮', x: 0.418, y: 0.434, radius: 0.050, hint: 'Glowing deep-blue lapis lazuli crystal geode nestled in the tree trunk hollow' },
            { id: 'feather', name: 'Owl Night Feather', icon: '🪶', x: 0.903, y: 0.625, radius: 0.050, hint: 'Barred iridescent night owl feather caught in the flowering thorn foliage' },
            { id: 'basket', name: 'Woven Herb Basket', icon: '🧺', x: 0.762, y: 0.840, radius: 0.055, hint: 'Woven sweetgrass foraging basket sitting on the mossy pond bank' }
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
            { id: 'cutlass', name: 'Pirate Cutlass Sword', icon: '⚔️', x: 0.615, y: 0.610, radius: 0.065, hint: 'Curved steel blade resting against the ship bulkhead' },
            { id: 'sextant', name: 'Brass Navigational Sextant', icon: '📐', x: 0.385, y: 0.590, radius: 0.050, hint: 'Precision brass sighting tool on the nautical chart' },
            { id: 'stern_window', name: 'Stern Gallery Window', icon: '🪟', x: 0.525, y: 0.350, radius: 0.065, hint: 'Arched glass panes overlooking the stormy sea' },
            { id: 'lantern', name: 'Brass Ship Lantern', icon: '🏮', x: 0.330, y: 0.170, radius: 0.055, hint: 'Swinging gimbal storm lantern hanging from the deck beam' },
            { id: 'skull_flag', name: 'Jolly Roger Ship Flag', icon: '🏴‍☠️', x: 0.042, y: 0.420, radius: 0.060, hint: 'Black skull-and-crossbones banner hanging along the shrouds' }
          ]
        },
        {
          id: 'pir_3',
          number: 3,
          title: "The Captain's Quarters",
          parTime: 80,
          objects: [
            { id: 'chart', name: 'Nautical Island Chart', icon: '🗺️', x: 0.350, y: 0.555, radius: 0.055, hint: 'Yellowed Caribbean sea chart laid out on the planning table' },
            { id: 'pistol', name: 'Flintlock Sea Pistol', icon: '🔫', x: 0.415, y: 0.685, radius: 0.050, hint: 'Ornate silver-inlaid flintlock dueling pistol on the credenza' },
            { id: 'compass', name: 'Antique Mariner Compass', icon: '🧭', x: 0.718, y: 0.772, radius: 0.050, hint: 'Mounted inside the brass gimbal case beside the logbook' },
            { id: 'bottle', name: 'Message in a Bottle', icon: '🍾', x: 0.910, y: 0.665, radius: 0.055, hint: 'Corked emerald rum bottle resting on the sea chest' },
            { id: 'cap_seal', name: 'Wax Fleet Signet', icon: '🔏', x: 0.076, y: 0.776, radius: 0.050, hint: 'Heavy brass and gold signet ring on the ledger' }
          ]
        },
        {
          id: 'pir_4',
          number: 4,
          title: 'The Forgotten Island',
          parTime: 75,
          objects: [
            { id: 'shovel', name: 'Iron Trench Shovel', icon: '⛏️', x: 0.220, y: 0.580, radius: 0.055, hint: 'Rusty iron trench shovel plunged upright near the driftwood' },
            { id: 'shell', name: 'Nautilus Sea Shell', icon: '🐚', x: 0.718, y: 0.772, radius: 0.050, hint: 'Iridescent spiral mother-of-pearl nautilus shell washed ashore' },
            { id: 'oar', name: 'Weathered Rowboat Oar', icon: '🛶', x: 0.076, y: 0.776, radius: 0.050, hint: 'Weathered ash oar resting on the sand bank' },
            { id: 'parrot_feather', name: 'Scarlet Macaw Feather', icon: '🪶', x: 0.415, y: 0.685, radius: 0.050, hint: 'Vivid scarlet & gold feather caught in the tropical fronds' },
            { id: 'island_map', name: 'X-Marks Parchment', icon: '📜', x: 0.350, y: 0.555, radius: 0.055, hint: 'Burned-edge treasure parchment weighted down by stones' }
          ]
        },
        {
          id: 'pir_5',
          number: 5,
          title: 'The Treasure Chamber',
          parTime: 70,
          objects: [
            { id: 'chest', name: 'Jeweled Treasure Chest', icon: '🧰', x: 0.910, y: 0.665, radius: 0.060, hint: 'Massive iron-banded chest overflowing with rubies and pearls' },
            { id: 'crown', name: 'Ruby Monarch Crown', icon: '👑', x: 0.718, y: 0.772, radius: 0.050, hint: 'Antique royal gold crown studded with red cabochon rubies' },
            { id: 'necklace', name: 'Emerald Chain Necklace', icon: '📿', x: 0.415, y: 0.685, radius: 0.050, hint: 'Heavy braided gold chain choker with emerald pendant' },
            { id: 'goblet', name: 'Engraved Gold Goblet', icon: '🏆', x: 0.350, y: 0.555, radius: 0.050, hint: 'Filigree solid-gold wine goblet standing on the treasure pile' },
            { id: 'skull', name: 'Golden Skull Talisman', icon: '💀', x: 0.076, y: 0.776, radius: 0.050, hint: 'Gilded human skull relic with gemstone eye sockets' }
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
