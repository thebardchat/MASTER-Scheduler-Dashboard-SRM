# Cloudflare Pages — Setup Walkthrough

One-time setup. Connects this repo to Cloudflare Pages so every push to
`main` auto-deploys the dispatch dashboard **and** the Pedal-to-the-Metal
showcase.

---

## What you'll end up with

After setup, two live URLs (plus preview URLs on branches):

| Page | URL |
|------|-----|
| Master Scheduler Dashboard | `https://pedal-to-the-metal.pages.dev/` |
| Pedal-to-the-Metal Showcase | `https://pedal-to-the-metal.pages.dev/pedal-to-the-metal/` |

(Replace `pedal-to-the-metal` with whatever project name you pick in step 5.)

---

## Click-by-click

### 1. Open the Cloudflare dashboard
<https://dash.cloudflare.com> → sign in.

### 2. Navigate to Pages
Left sidebar → **Workers & Pages** → **Create** button → **Pages** tab
→ **Connect to Git**.

### 3. Authorize GitHub (first time only)
Let Cloudflare read the `thebardchat` org. You can scope it to just the
master-scheduler repo if you want.

### 4. Pick the repo
`thebardchat/MASTER-Scheduler-Dashboard-SRM` → **Begin setup**.

### 5. Build configuration

Enter **exactly** these values:

| Field | Value |
|---|---|
| Project name | `pedal-to-the-metal` *(becomes the subdomain — pick anything)* |
| Production branch | `main` |
| Framework preset | `Vite` *(or "None" — either works)* |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | *leave blank* |
| Environment variables | *none needed* |

### 6. Save and Deploy
First build takes about 60 seconds. Watch the deploy log — if it fails,
it's almost always a missing npm dep or a Node version mismatch.

### 7. Verify

Open both URLs:
- `https://<project-name>.pages.dev/` — should show the dispatch dashboard.
- `https://<project-name>.pages.dev/pedal-to-the-metal/` — should show the
  showcase with animated truck lights and scrolling ticker.

---

## What happens after setup

- `git push origin main` → Cloudflare auto-builds and deploys.
- Every branch and PR gets its own preview URL (handy for showing
  Curtis / Hollingshead a change before it goes live).
- Build logs are in the Cloudflare dashboard under the project's
  **Deployments** tab.

---

## Custom domain (optional, later)

If you want `pedaltothemetal.srmconcrete.com` or similar:

1. Cloudflare Pages project → **Custom Domains** tab → **Set up a custom
   domain**.
2. Type the domain → Cloudflare walks you through the DNS records.
3. If the domain is already on Cloudflare DNS, it auto-wires. Otherwise
   you add a CNAME at your registrar.

---

## Why the Vite config already works

`vite.config.js` sets:

```js
base: process.env.GITHUB_PAGES ? '/MASTER-Scheduler-Dashboard-SRM/' : '/',
```

Cloudflare Pages does **not** set `GITHUB_PAGES`, so the build uses
`base: '/'`, which is what a Pages subdomain wants. No edits needed.

`public/pedal-to-the-metal/` is copied verbatim to `dist/pedal-to-the-metal/`
by Vite's public-folder convention, so the showcase ships alongside the
main app automatically.

---

## If something breaks

| Symptom | Cause | Fix |
|---|---|---|
| 404 on assets | Wrong `base` path | Confirm `GITHUB_PAGES` env var is NOT set in Pages build settings |
| Build fails on `vite: not found` | Missing `npm ci` in build | Build command stays `npm run build` — Cloudflare runs `npm ci` automatically from `package-lock.json` |
| Showcase 404s | Public folder didn't copy | `ls dist/pedal-to-the-metal/` locally — should have three files. If not, `npm run build` isn't finishing. |
| PWA service worker caches old version | `vite-plugin-pwa` set to `autoUpdate` | Hard reload (Ctrl+Shift+R) once; subsequent visits get the new SW automatically. |

---

## GitHub Pages vs Cloudflare Pages

We're keeping both. GitHub Pages (`thebardchat.github.io/MASTER-Scheduler-Dashboard-SRM/`)
stays as the secondary / failover target via `npm run deploy`. Cloudflare
Pages becomes the primary because:

- Faster global CDN edge
- Preview URLs per branch/PR
- Free custom domains with auto-HTTPS
- Deploy-on-push (no manual `gh-pages` step)

---

*Last updated: 2026-04-24 · Session 5*
