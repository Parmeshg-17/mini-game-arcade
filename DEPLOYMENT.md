# Vercel Deployment Guide — Mini Game Arcade

This guide explains the exact settings required to deploy **Mini Game Arcade** to [Vercel](https://vercel.com) as a static web application.

---

## 📋 Vercel Project Configuration

`vercel.json` is configured in the repository root with `"outputDirectory": "."`, meaning Vercel automatically detects and serves all static assets directly from the root without requiring any manual dashboard adjustments.

| Setting | Value | Notes |
| :--- | :--- | :--- |
| **Framework Preset** | `Other` | Mini Game Arcade is pure static HTML/CSS/JS |
| **Root Directory** | `./` | Root folder containing `index.html` |
| **Build Command** | *(Auto / Empty)* | Executes `npm run build` safely |
| **Output Directory** | `.` | Defined in `vercel.json` as `"outputDirectory": "."` |
| **Install Command** | *(Auto / Empty)* | Zero external runtime packages needed |
| **Node.js Version** | 18.x or 20.x (Default) | Default setting is fine |

---

## 🚀 Step-by-Step Deployment Options

### Method A: Connect via GitHub (Automatic CI/CD)

1. **Verify your local repository**:
   ```bash
   git status
   ```
2. **Commit and push all files to GitHub**:
   ```bash
   git add .
   git commit -m "Fix: Configure vercel.json outputDirectory for root static deployment"
   git push origin main
   ```
3. **Automatic Redeployment**:
   - Vercel automatically detects the push on branch `main` and starts a new deployment.
   - With `"outputDirectory": "."` configured in `vercel.json`, the deployment will succeed instantly.

---

### Method B: Deploy using Vercel CLI (Direct Terminal)

```bash
# 1. Install CLI (if not already installed)
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy directly to production
vercel --prod
```

---

## 🔍 Pre-Deployment Verification Checklist

- [x] `vercel.json` has `"outputDirectory": "."` configured to serve the root directory.
- [x] All JavaScript, CSS, SVG, and HTML files use relative paths (`./css/arcade.css`, `./js/arcade.js`).
- [x] No hardcoded `localhost` or local absolute paths (e.g. `C:\...`).
- [x] Zero external image files or audio files required (100% procedural vector graphics and Web Audio API).
- [x] High scores persist across browser reloads using `localStorage`.
