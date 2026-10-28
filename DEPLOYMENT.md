# Vercel Deployment Guide — Citrus Blitz Mini-Game

This guide explains the exact settings required to deploy **Citrus Blitz** to [Vercel](https://vercel.com) as a static web application.

---

## 📋 Vercel Project Configuration

| Setting | Value | Notes |
| :--- | :--- | :--- |
| **Framework Preset** | `Other` | Citrus Blitz is pure static HTML/CSS/JS |
| **Root Directory** | `./` | Root folder containing `index.html` |
| **Build Command** | *(None / Empty)* | No build compilation required |
| **Output Directory** | `./` (or leave empty) | Serves files directly from the repository root |
| **Install Command** | *(None / Empty)* | No npm packages required in production |
| **Node.js Version** | 18.x or 20.x (Default) | Default setting is fine |

---

## 🚀 Step-by-Step Deployment Options

### Method A: Connect via GitHub (Automatic CI/CD)

1. **Verify your local repository**:
   ```bash
   git status
   ```
2. **Commit and push all files**:
   ```bash
   git add .
   git commit -m "Citrus Blitz initial release"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   git push -u origin main
   ```
3. **Import to Vercel**:
   - Go to [https://vercel.com/new](https://vercel.com/new)
   - Select your Git provider (GitHub)
   - Click **Import** next to your repository
4. **Configure Project**:
   - Project Name: `citrus-blitz` (or any custom name)
   - Framework Preset: Select `Other`
   - Keep Build and Output settings as default (or empty)
5. **Deploy**:
   - Click **Deploy**
   - In less than 15 seconds, your game is live at `https://citrus-blitz.vercel.app`!

---

### Method B: Deploy using Vercel CLI (Direct Terminal)

If you have Node.js installed, you can deploy in one command without Git:

1. **Install Vercel CLI globally**:
   ```bash
   npm install -g vercel
   ```

2. **Authenticate with Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy to Preview**:
   ```bash
   vercel
   ```
   Answer the interactive prompts:
   - *Set up and deploy?* **Y**
   - *Which scope?* Select your account
   - *Link to existing project?* **N**
   - *What's your project's name?* `citrus-blitz`
   - *In which directory is your code located?* `./`

4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

---

## 🔍 Pre-Deployment Verification Checklist

Before publishing, verify the following:

- [x] All JavaScript, CSS, and HTML files use relative paths (`./js/game.js`, `./style.css`).
- [x] No hardcoded `localhost` or local absolute paths (e.g. `C:\...`).
- [x] Zero external image files or audio files required (100% procedural vector graphics and Web Audio API).
- [x] Touch controls and mouse swiping work cleanly with `touch-action: none`.
- [x] Sound toggle works without breaking browser autoplay security policies.
- [x] Both Arcade Blitz (60s timer) and Classic Survival (3 lives) modes start, score, pause, restart, and game over properly.
- [x] High scores persist across browser reloads using `localStorage`.
