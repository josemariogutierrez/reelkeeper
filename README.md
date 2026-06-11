# ReelKeeper

A client-only **Progressive Web App** to save, organize, tag, search, and **map**
Instagram reels — then revisit them later. It's a smart *index*, not a video host:

- **Online:** a saved reel plays via Instagram's official embed.
- **Offline:** browse all your lists, tags, notes, locations, and the map. (Video
  itself needs a connection — Instagram embeds can't be cached.)

Everything you save lives **locally on your device** (IndexedDB). No backend, no
accounts. Back it up with the JSON export.

## Features

- **Capture** a reel by sharing it from Instagram
  - **Android:** the installed PWA appears in IG's native share sheet (Web Share Target).
  - **iOS:** a one-time Shortcut bridges the share sheet → see [`IOS_SHORTCUT.md`](./IOS_SHORTCUT.md).
  - **Anywhere:** paste a link via **+ Add reel**.
- **Lists** — a reel can live in multiple lists. **Global tags.** Free-text **notes**.
- **Search** across title, tags, notes, and location.
- **Locations** — address search (OpenStreetMap/Nominatim) + draggable pin.
- **Map view per list** — see all located reels; tap a pin → open the reel.
- **Offline-first** — app shell precached; recently-viewed map tiles cached too.
- **Backup** — JSON export/import; `persist()` to resist iOS data eviction.

## Tech

React + TypeScript · Vite · `vite-plugin-pwa` (Workbox) · Dexie (IndexedDB) ·
Leaflet + react-leaflet · OpenStreetMap tiles + Nominatim geocoding.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
```

The PWA/service worker is enabled in dev too (`devOptions.enabled`).

## Build

```bash
npm run build    # generates icons, type-checks, builds to dist/
npm run preview  # serve the production build locally
```

`npm run build` outputs a fully static site to **`dist/`**.

## Deploy to GitHub Pages (recommended)

Free HTTPS, automatic builds on push. A GitHub Actions workflow
(`.github/workflows/deploy.yml`) builds the site and publishes it — you never
upload files by hand.

### One-time setup
1. Create a GitHub repo and push this project (see below).
2. In the repo: **Settings → Pages → Build and deployment → Source = GitHub Actions**.
3. Push to `main`. The workflow builds and deploys automatically.
4. Your app lives at **`https://<you>.github.io/<repo>/`**.

```bash
git init && git add -A && git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

### How the subpath is handled
Project sites serve from `/<repo>/`, so the build needs a matching `base`. The
workflow sets it automatically from the repo name:

```yaml
env:
  VITE_BASE: /${{ github.event.repository.name }}/
```

You don't set anything by hand. The app's `start_url`, `scope`, service-worker
scope, and Android `share_target` action are all derived from this base.

### SPA deep links
GitHub Pages has no server-side rewrites, so a direct hit to
`/<repo>/reel/123` would 404. The build copies `index.html` → `404.html`
(`postbuild` script); GitHub serves that for unknown paths, the app boots, and
React Router renders the right screen. No extra config needed.

> **iOS Shortcut URL** becomes `https://<you>.github.io/<repo>/add?url=…` — update
> the URL in [`IOS_SHORTCUT.md`](./IOS_SHORTCUT.md) accordingly.

> **User/org site** (`<you>.github.io` repo, served at the root): there's no
> subpath, so set `VITE_BASE: /` in the workflow instead of the repo-name line.

## Alternative: any static host (cPanel, Netlify, etc.)

`npm run build` (root) or `VITE_BASE=/subfolder/ npm run build` outputs a static
site to `dist/`. Upload its contents. **HTTPS is required** for the PWA. On Apache
add a `.htaccess` rewrite (or rely on the `404.html` fallback that's already built):

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## Caveats (by design)

- Only **public** reels embed. Private/removed reels show an "Open in Instagram" fallback.
- **No offline video** — Instagram embeds require a live connection.
- **iOS storage eviction** — unused PWAs can have local data cleared (~7 days). Export
  backups regularly; the app requests persistent storage on launch.
- **Nominatim** has light usage limits — fine for personal use; searches are debounced.
