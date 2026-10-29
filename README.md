# Mini Game Arcade

A fast, modern, responsive browser arcade website showcasing lightweight, original HTML5 mini-games built with vanilla web technologies (HTML5, Canvas 2D, Web Audio API). Deployable instantly as a static site on Vercel with zero backend or API keys required.

```
  __  __ _       _    ____                            _                     _      
 |  \/  (_)_ __ (_)  / ___| __ _ _ __ ___   ___      / \   _ __ ___ __ _  __| | ___ 
 | |\/| | | '_ \| | | |  _ / _` | '_ ` _ \ / _ \    / _ \ | '__/ __/ _` |/ _` |/ _ \
 | |  | | | | | | | | |_| | (_| | | | | | |  __/   / ___ \| | | (_| (_| | (_| |  __/
 |_|  |_|_|_| |_|_|  \____|\__,_|_| |_| |_|\___|  /_/   \_\_|  \___\__,_|\__,_|\___|
```

---

## 🌟 Key Features

- **Responsive Arcade Homepage**: Sleek dark-mode aesthetic with live search filtering, category pills, and dynamic game cards.
- **Dedicated Playable Game Pages**: Each game runs on its own dedicated route (`games/<game-id>/index.html`) with a "← Back to Arcade" breadcrumb navigation bar, full playfield, and complete controls guide.
- **Featured Games**:
  - **Citrus Blitz**: Original procedural fruit-slicing arcade game with realistic slicing physics, glowing blade swipe trails, Web Audio procedural sounds, combo multipliers, and bomb-avoidance mechanics.
  - **Tic Tac Toe**: Clean neon arcade strategy game with **Me vs Bot** (Casual & unbeatable Mastermind Minimax AI) and **2 Players** local pass & play, laser strike animations, match timer, move counter, and persistent scoreboard.
  - **Memory Match**: Crisp 3D card-matching challenge with 3 difficulty modes (**Easy** 8 cards, **Medium** 16 cards, **Hard** 24 cards), 12 bespoke vector icons, match timer, move counter, 3-star ratings, and personal best records.
  - **Brick Breaker**: Action-packed retro breakout arcade with 3 progressive waves, angle-deflecting paddle physics, multi-ball chaos, expanding paddle power-ups, particle shatter explosions, and combo multipliers.
  - **Bubble Pop**: Addictive bubble-bursting arcade puzzle with tactile Web Audio pops, cascading gravity physics, column compression, 5x combo streaks, star performance ratings, and Classic & 60s Blitz Rush modes.
  - **Space Dodge**: High-octane sci-fi space reflex game where you pilot an agile cyber starship through dense asteroid belts, dodge plasma comets, collect golden crystals, deploy kinetic energy shields, and trigger room-clearing EMP shockwaves across 3 progressive sectors or Endless Hyperspace.
  - **Number Puzzle**: Classic sliding tile puzzle (15-Puzzle) where players slide numbered tiles into numerical order from 1 to 15 with the blank space in the bottom-right corner. Features 3 grid sizes (3×3, 4×4, 5×5), guaranteed 100% solvability, multi-tile slide chains, stopwatch timer, move counter, and personal best tracking.
  - **Tap Challenge**: High-adrenaline reflex and finger speed arena with 3 competitive modes (**Reflex Rush** 30s target reaction, **Number Sprint** speed 1–16 sequence rush, and **CPS Frenzy** 10s click speed test), combo multipliers up to 5x, real-time CPS gauge, touch/keyboard matrix controls, and 3-star performance ratings.
  - **Block Puzzle**: Addictive 8×8 polyomino board puzzle where players fit geometric shapes onto the grid to blast complete rows and columns. Features **Classic Endless**, **10-Line Target Challenge**, and **90s Timed Blitz** with combo multiplier cascades, ghost placement previews, and high score tracking.
  - **Stack Rush**: An innovative 3D Tetris-style arcade puzzle where you rotate the bottom platform instead of the falling block! Guide pieces into place, clear complete horizontal 3×3 layers, trigger multi-layer combos, and earn gems to unlock visual themes (Cyber Neon, Obsidian Gold, Retro Synth, Matrix Jade). Features **Classic Endless**, **5-Layer Challenge**, and **60s Blitz Rush** with Next block 3D preview and responsive touch/keyboard controls.
- **Comprehensive Policy & Info Pages**: Dedicated, fully populated [About](file:///c:/Users/parmesh/Desktop/mini%20game/about.html), [Contact](file:///c:/Users/parmesh/Desktop/mini%20game/contact.html) (with working client-side validation), [Privacy Policy](file:///c:/Users/parmesh/Desktop/mini%20game/privacy.html), and [Terms of Service](file:///c:/Users/parmesh/Desktop/mini%20game/terms.html) pages.
- **Zero Dependencies & Zero Build Step**: 100% vanilla HTML5, CSS3, and JavaScript. Lightning-fast loads and zero Vercel build failures.
- **Privacy-First**: No tracking cookies, no accounts, and no servers. High scores and mute settings are stored strictly in `localStorage`.

---

## 🕹️ How to Add a New Game (Step-by-Step)

Mini Game Arcade was designed from the ground up to make adding new games straightforward and modular.

### Step 1: Create the Game Directory
Create a dedicated folder for your new game under `games/`:
```bash
games/
└── memory-match/
    ├── index.html       # Game playfield with Back to Arcade navigation
    ├── style.css        # Game-specific styles
    └── js/
        └── game.js      # Game logic
```

### Step 2: Add an Original Vector Thumbnail
Create an SVG or PNG illustration in `assets/games/`:
```bash
assets/games/memory-match.svg
```

### Step 3: Register the Game in `js/games-data.js`
Open [js/games-data.js](file:///c:/Users/parmesh/Desktop/mini%20game/js/games-data.js) and add your new game configuration to the `ARCADE_GAMES` array:

```javascript
{
  id: 'memory-match',
  title: 'Memory Match',
  category: 'Puzzle',
  tags: ['memory', 'puzzle', 'cards', 'brain', 'casual'],
  badge: 'New',
  tagline: 'Flip cards and match pairs against the clock.',
  description: 'A polished card-matching memory challenge with accessible keyboard and touch controls.',
  route: 'games/memory-match/index.html',
  thumbnail: 'assets/games/memory-match.svg',
  controlsSummary: 'Click or tap cards to flip. R to Restart.',
  features: ['Timer', 'Move Counter', 'Keyboard & Touch']
}
```

### Step 4: Verify with Automated QA
Run the automated test runner to ensure routes, DOM elements, and asset links are valid:
```bash
npm test
```

The new game card will automatically appear on the homepage with working search and category filters!

---

## 🚀 Running Locally

Because this project is built with static web standards, you can test it locally using any of these methods:

### Option 1: Using Node / NPM
```bash
# Start local static server at http://localhost:3000
npm start
# or
npm run dev
```

### Option 2: Using Python
```bash
python -m http.server 8000
```
Open `http://localhost:8000`.

### Option 3: Direct Browser Launch
Open [index.html](file:///c:/Users/parmesh/Desktop/mini%20game/index.html) directly in any web browser.

---

## ☁️ Deploying to Vercel

### Method 1: Push to GitHub (Recommended)
1. Commit your files:
   ```bash
   git add .
   git commit -m "Add Mini Game Arcade multi-page website"
   git push -u origin main
   ```
2. In the [Vercel Dashboard](https://vercel.com/dashboard), import your repository.
3. Keep default settings (**Framework**: `Other`, **Root Directory**: `./`, **Build Command**: empty, **Output Directory**: `./`).
4. Click **Deploy**.

### Method 2: Deploy with Vercel CLI
```bash
npm install -g vercel
vercel
vercel --prod
```

For more details, see [DEPLOYMENT.md](file:///c:/Users/parmesh/Desktop/mini%20game/DEPLOYMENT.md).

---

## 📁 Project Structure

```
├── index.html                 # Mini Game Arcade Homepage
├── about.html                 # About Mini Game Arcade
├── contact.html               # Contact & FAQ page with working validation
├── privacy.html               # Comprehensive Privacy Policy
├── terms.html                 # Terms of Service
├── css/
│   └── arcade.css             # Arcade global styles & design system
├── js/
│   ├── games-data.js          # Central games registry & categories
│   └── arcade.js              # Homepage search, category filters, and mobile drawer
├── assets/
│   └── games/
│       └── citrus-blitz.svg   # Original vector game thumbnail
├── games/
│   └── citrus-blitz/          # Dedicated playable fruit-slicing game
│       ├── index.html         # Playable page with Back to Arcade nav & controls guide
│       ├── style.css          # Game stylesheet
│       └── js/                # Game logic, audio, particles, blade, fruit models
├── test-runner.js             # Automated QA test suite
├── package.json               # NPM scripts (start, dev, build, test)
├── vercel.json                # Vercel static routing and security headers
├── README.md                  # Project overview and new game guide
└── DEPLOYMENT.md              # Vercel deployment guide
```

---

## 📜 License

MIT License — free for personal and educational use.
