# Citrus Blitz — Blade Fruit Slicer Arcade

A fast, juicy, browser-based fruit-slicing arcade mini-game built with vanilla HTML5, Canvas 2D, and procedural Web Audio API. Designed for desktop, tablet, and mobile browsers with zero external runtime dependencies.

```
  ____ _ _                      ____  _ _ _       
 / ___(_) |_ _ __ _   _ ___   | __ )| (_) |_ ____
| |   | | __| '__| | | / __|  |  _ \| | | __|_  /
| |___| | |_| |  | |_| \__ \  | |_) | | | |_ / / 
 \____|_|\__|_|   \__,_|___/  |____/|_|_|\__/___|
          ARCADE FRUIT SLICER EDITION
```

---

## 🌟 Features & Highlights

- **Dynamic Slice Physics**: Fruits fly with parabolic trajectories, realistic gravity, and angular spin. When sliced, fruits cleanly cleave in half along the exact cut angle and fly apart with normal velocity.
- **Vibrant Procedural Vector Graphics**: 100% original, generated in canvas (Watermelon, Orange, Lemon, Strawberry, Kiwi, Pineapple, Dragonfruit, and rare Golden Starfruit). No external image assets or copyright issues.
- **Avoid the Bombs!**: Ticking iron bombs with burning fuse sparks. Slicing a bomb detonates an explosion with screen shake, shockwave flash, and a -10s penalty (Arcade) or lost life (Classic).
- **Combo Multiplier System**: Slice 2 or more fruits in a single fluid swipe stroke to trigger combo multipliers (Double Slice, 3x Combo, 4x Mega Combo, and 5x Blade Frenzy) with custom fanfare and fiery blade trails.
- **Multi-Touch & Smooth Pointer Tracking**: Independent pointer tracking allows multi-finger slicing on mobile devices without cross-screen jump artifacts.
- **100% Procedural Web Audio Engine**: Blade swooshes, juicy splatters, bomb fuses, explosions, and musical combo chimes synthesized using the browser's Web Audio API. No external audio files to download.
- **Sound Mute / Volume Toggle**: Quick sound toggle button and `M` key shortcut, with audio preferences remembered via `localStorage`.
- **Accidental Scroll Prevention**: `touch-action: none` on the play area stops accidental mobile pull-to-refresh or page swiping while slashing.
- **Two Game Modes**:
  - **⚡ Arcade Blitz**: 60-second high-score sprint. Slicing starfruit adds +5s bonus time; bombs deduct 10s and 10 points.
  - **❤️ Classic Survival**: 3 strikes/lives. Missing a fruit or slicing a bomb costs 1 life.
- **Persistent High Scores**: High scores for each mode are saved locally.
- **Responsive & High-DPI Ready**: Scales automatically across phones (even 320px width), tablets, and desktops using `window.devicePixelRatio` for sharp Retina graphics.
- **Keyboard Shortcuts**:
  - `Space` or `P` : Pause / Resume
  - `R` : Restart Game
  - `M` : Toggle Sound On/Off
  - `Esc` : Close Modals / Pause

---

## 🚀 Running Locally

Because this project uses vanilla HTML5, CSS, and JavaScript, it can be tested in multiple ways without any compilation step.

### Option A: Using NPM / Node.js
```bash
# 1. Install dependencies (optional, serves static files)
npm install

# 2. Run local development server
npm run dev
# or
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option B: Using Python's Built-in Server
If you have Python installed:
```bash
python -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

### Option C: Direct Browser Opening
Simply double-click `index.html` or open it with Chrome, Firefox, Safari, or Edge.

---

## ☁️ Deploying to Vercel

Citrus Blitz is 100% static and ready for instant deployment on Vercel's free tier.

### Method 1: Deploy via GitHub (Recommended)
1. Initialize Git and commit the files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Citrus Blitz fruit slicer game"
   git branch -M main
   ```
2. Create a new repository on [GitHub](https://github.com/new).
3. Link and push to your GitHub repo:
   ```bash
   git remote add origin YOUR_GITHUB_REPOSITORY_URL
   git push -u origin main
   ```
4. Visit [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..." > "Project"**.
5. Select and import your GitHub repository.
6. Settings:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./`
   - **Build Command**: *(leave empty)*
   - **Output Directory**: `./` (or leave empty)
7. Click **Deploy**. Your game will be live at `https://your-project.vercel.app`!

### Method 2: Deploy with Vercel CLI
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy preview
vercel

# 4. Deploy to production
vercel --prod
```

For more detailed settings, see [DEPLOYMENT.md](file:///c:/Users/parmesh/Desktop/mini%20game/DEPLOYMENT.md).

---

## 📁 File Structure

```
├── index.html                 # Game layout, HUD, overlays, and canvas
├── style.css                  # Responsive arcade styling, glassmorphism UI, animations
├── js/
│   ├── audio.js               # Synthesized Web Audio engine (blade slash, splat, boom, combo chime, mute)
│   ├── fruit.js               # Procedural vector fruit definitions, halves, and bombs
│   ├── particles.js           # Juice splash droplets, background splatter decals, blade sparks, confetti
│   ├── blade.js               # Glowing neon blade swipe trail with spline interpolation
│   └── game.js                # Core game loop, collision detection, physics, wave spawning, state machine
├── package.json               # Lightweight development helper scripts
├── vercel.json                # Vercel configuration for static routing and headers
├── .gitignore                 # Standard git ignore file
├── README.md                  # Project overview and local testing guide
└── DEPLOYMENT.md              # Exact Vercel deployment settings and instructions
```

---

## 📜 License

MIT License — free for personal and educational use.
