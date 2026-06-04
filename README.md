# Lausanne Football Weight Room 2026

A simple, static website for the Lausanne Collegiate School football strength &
conditioning program. Players can see their lifts, their **Strength Index (SI)**,
and where they rank against their teammates — plus the lift of the day for their
group.

## What's here

- **Leaderboard tab** — every player ranked by Strength Index, highest to lowest.
  - `SI = (Bench + Squat + Clean) ÷ Body Weight`
  - A colored star next to each name shows the player's overall group.
  - Each lift (bench / squat / clean) gets its own colored star based on how it
    compares to the player's body weight.
  - Players without recorded numbers are listed at the bottom.
  - A legend at the bottom explains every level.
- **Today's Workout tab** — coaches post the lift of the day for the Gold,
  Silver, Bronze, and Developmental groups.
- **Coach Edit Mode** — click **🔒 Unlock Edit Mode**, enter the password
  (`football123`), and the Bench / Squat / Clean / Body Weight values become
  editable. The Strength Index, ranking order, and all stars recalculate live as
  you type. Click **Publish to everyone** to save — the changes (and posted
  workouts) are shared with every player through a small serverless API
  (`api/data.js`), so everyone sees the same leaderboard.

## Star / group levels

| Star | Strength Index | Bench (×bwt) | Squat (×bwt) | Clean (×bwt) |
|------|----------------|--------------|--------------|--------------|
| 🟡 Gold | 5.5+ | 1.50+ | 2.40+ | 1.33+ |
| ⚪ Silver | 4.6–5.4 | 1.35–1.49 | 2.00–2.20 | 1.25–1.32 |
| 🟤 Bronze | 4.0–4.5 | 1.25–1.34 | 1.75–1.99 | 1.00–1.24 |
| 🟢 Developmental | under 4.0 | 1.24 & under | under 1.75 | under 1.00 |

## Updating player data

Edit **`data.js`**. Each player is one line:

```js
{ name: "Player Name", b: 315, s: 540, c: 290, bwt: 240 },
```

`b` = bench, `s` = squat, `c` = clean, `bwt` = body weight. Use `null` for any
value not recorded yet (those players drop to the bottom). The Strength Index and
all stars recalculate automatically — no other changes needed.

## Running / hosting

The front end is plain HTML/CSS/JS. Shared saving uses one serverless function
(`api/data.js`) plus a small key-value store, which is why it's deployed on
**Vercel**. See **[DEPLOY.md](DEPLOY.md)** for the full step-by-step.

- **Live editing for everyone:** a coach edits + clicks *Publish to everyone*,
  the data is written to a shared store, and every player sees it.
- **Offline / pre-setup:** if the store isn't reachable, the site still shows the
  last data it loaded (cached in the browser) and tells the coach edits weren't
  shared yet.

## Files

- `index.html`, `styles.css` — the page
- `data.js` — the roster + seed numbers (edit to add/remove players)
- `app.js` — leaderboard, stars, edit mode, publishing
- `api/data.js` — the shared read/write API (runs on Vercel)
