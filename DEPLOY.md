# Deploying to the internet (Vercel)

This gets the site live with **shared editing** — when a coach edits numbers or
posts a workout and clicks **Publish to everyone**, every player sees it.

It's free. Two storage env vars get added automatically when you connect the
store. Total time: ~5–10 minutes, all in the browser.

## Step 1 — Put the code on the main branch (one time)

The site currently lives on the branch `claude/eloquent-pasteur-k1dN4`. Merge it
into `main` (open a pull request on GitHub and merge it, or tell me and I'll open
the PR for you). Vercel will deploy whatever is on `main`.

## Step 2 — Import the repo into Vercel

1. Go to <https://vercel.com> and sign in with your GitHub account.
2. **Add New… → Project**, pick the `lausanne-strength` repo, click **Import**.
3. Leave all build settings as the defaults (it's a static site with an `/api`
   folder — Vercel detects this automatically). Click **Deploy**.

At this point the leaderboard is already live and viewable. The last thing is to
turn on saving.

## Step 3 — Add the shared store (so edits save for everyone)

1. In your Vercel project, open the **Storage** tab.
2. **Create Database → KV (Upstash / Redis)** → give it any name → **Create**.
3. When asked, **Connect** it to this project (all environments). This
   automatically adds the `KV_REST_API_URL` and `KV_REST_API_TOKEN` env vars.
4. Go to **Settings → Deployments** (or the **Deployments** tab) and
   **Redeploy** the latest deployment so it picks up the new env vars.

That's it. Open the site, click **🔒 Unlock Edit Mode**, enter the password
(`football123`), change some numbers, and hit **Publish to everyone**. Open the
site on another phone and you'll see the change.

## Changing the coach password

The default password is `football123`. To change it:

- In Vercel: **Settings → Environment Variables** → add `EDIT_PASSWORD` =
  your new password → redeploy.
- In the code: update `EDIT_PASSWORD` near the top of `app.js` to the same value
  and commit. (This value lives in the page, so don't treat it as a hard secret —
  it just keeps players from casually editing.)

## Adding / removing players on the roster

Edit `data.js` (one line per player) and commit. New players show up on the
board automatically. Coaches then fill in their numbers through Edit Mode.

## Local testing (optional)

Install the Vercel CLI and run `vercel dev` in this folder to test the site +
the `/api/data` function locally. Plain `open index.html` works too, but the
shared save/load only runs when the `/api` function is available.
