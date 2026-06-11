# iOS Shortcut: share Instagram reels into ReelKeeper

iOS/Safari does **not** let a PWA register as a native share target, so we use a
Shortcut as the bridge: Instagram → Share → your Shortcut → opens ReelKeeper at
`/add?url=…`, which auto-saves the reel.

> Replace `https://YOUR-DOMAIN/` below with wherever you uploaded the app. If you
> deployed into a subfolder, include it (e.g. `https://YOUR-DOMAIN/reels/`).

## One-time setup

1. **Install the PWA first.** In Safari open your ReelKeeper URL → Share →
   **Add to Home Screen**. (This gives it more persistent storage.)
2. Open the **Shortcuts** app → **+** to create a new shortcut.
3. Tap the shortcut's **(i)** / settings → **Show in Share Sheet** = ON.
   - Under **Share Sheet Types**, leave **URLs** (and optionally **Text**) enabled.
4. Add these actions in order:

   **Action 1 — Receive input**
   - "Receive **URLs** and **Text** from **Share Sheet**".

   **Action 2 — Get URLs from Input** (handles cases where IG shares text containing the link)
   - Add action **Get URLs from Input** → input = **Shortcut Input**.

   **Action 3 — Text**
   - Add a **Text** action with this exact content:
     ```
     https://YOUR-DOMAIN/add?url=[URLs]
     ```
     Insert the `URLs` variable (from Action 2) where `[URLs]` is shown.

   **Action 4 — URL Encode** (recommended)
   - Add **URL Encode**? Simpler: skip — IG reel URLs are already URL-safe.

   **Action 5 — Open URLs**
   - Add **Open URLs** → input = the **Text** from Action 3.

5. Name it **"Save to ReelKeeper"** and pick an icon.

## Daily use

1. In Instagram, open a reel → tap **Share (paper-plane)** → **Share to…** →
   scroll to **Save to ReelKeeper**.
2. ReelKeeper opens, saves the reel to your Inbox, and shows the quick-edit panel.

## Fallback (no Shortcut)

In ReelKeeper tap **+ Add reel** and paste the reel link. Same result.

## Notes & gotchas

- The reel must be **public** to later play via the embed.
- If "Open URLs" opens Safari instead of the installed PWA, that's expected on some
  iOS versions — the page still works; for the installed-app experience, make sure
  you added ReelKeeper to the Home Screen (step 1).
