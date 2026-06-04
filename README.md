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
- **Today's Workout tab** — coaches tap **Edit Workout** to post the lift of the
  day for the Gold, Silver, Bronze, and Developmental groups.

## Star / group levels

| Star | Strength Index | Bench (×bwt) | Squat (×bwt) | Clean (×bwt) |
|------|----------------|--------------|--------------|--------------|
| 🟡 Gold | 5.5+ | 1.50+ | 2.40+ | 1.33+ |
| ⚪ Silver | 4.6–5.4 | 1.35–1.49 | 2.00–2.20 | — |
| 🟤 Bronze | 4.0–4.5 | 1.25–1.34 | 1.75–1.99 | 1.25–1.32 |
| 🟢 Developmental | under 4.0 | 1.24 & under | under 1.75 | 1.24 & under |

> Per your scale, the **Clean** uses Gold / Bronze / Developmental only.

## Updating player data

Edit **`data.js`**. Each player is one line:

```js
{ name: "Player Name", b: 315, s: 540, c: 290, bwt: 240 },
```

`b` = bench, `s` = squat, `c` = clean, `bwt` = body weight. Use `null` for any
value not recorded yet (those players drop to the bottom). The Strength Index and
all stars recalculate automatically — no other changes needed.

## Running / hosting

It's plain HTML/CSS/JS — no build step.

- **Locally:** open `index.html` in a browser, or run `python3 -m http.server`
  and visit <http://localhost:8000>.
- **Hosting:** drop these files on any static host (GitHub Pages, Netlify, etc.).

## Note on "Today's Workout"

The posted workout is currently saved in the **browser** it was entered on
(via `localStorage`). That's perfect for the coach's phone/laptop showing it in
the weight room. If you want every player to see the same posted workout from
their own phones, that needs a small shared backend — easy to add as a next step.
