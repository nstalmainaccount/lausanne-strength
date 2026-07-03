# ⚔ Lance Fein Glazing System

A white-label **comment curation system** with a Likert scale measured in **Lances**.
Build a Glazing System, get a shareable link + a one-line embed snippet, and drop it
into any website as a popup — like a Google Form, but for glazing.

Lives at `/glaze/` alongside the Lausanne weight-room site in this repo. Pure static
files — no backend, no build step.

## Pages

| File | What it is |
|---|---|
| `index.html` | Landing page: How-It-Works docs + the **System Builder** |
| `widget.html` | The curation widget itself (standalone via direct link, or inside the popup) |
| `embed.js` | One-line script site owners paste in — adds a floating button + popup overlay |
| `demo.html` | A fake third-party website ("Fein's Family Bakery") with the embed installed |

## The rules (Glazing Basics)

- Scores run from **+ Five Lances** to **− Five Lances**; **Zero Lances** is neutral.
- Every number in the system is expressed in Lances: *One Lance, Two Lances, Negative One Lance.*
- **Zero, One, or Negative One Lance** → a gentle glaze → the rater **earns One Lance Point**.
- **Beyond ± One Lance** (± Two through ± Five) → heavy glazing → the rater **loses One Lance Point**.
- The comment's author receives your Lances toward their **Lance Score** either way.
- Authors are hidden behind **GLAZE FOR MORE ®** until you score their comment.
- Up to **Three Personas** per browser, each with independent Lance Credit.

## White-labeling

The builder encodes the entire system configuration (name, brand color, scale, seed
comments) into a URL-safe token. That token travels inside the link and the embed
snippet, so a single deployment serves unlimited white-labeled systems — nothing to
provision per customer.

```html
<script src="https://YOUR-DEPLOY/glaze/embed.js"
        data-glaze-config="eyJpZCI6..."
        data-glaze-label="⚔ Glaze our comments"
        data-glaze-color="#7a4a21"
        async></script>
```

## Persistence

Ratings, personas, and posted comments persist in the **widget origin's
localStorage**, keyed per system ID — so a visitor's Lance Credit follows them across
every site embedding the same deployment. This is a beta/demo persistence model; a
shared backend (e.g. the same Upstash KV pattern used by `/api/data.js`) is the
natural next step if cross-device scores are needed.
