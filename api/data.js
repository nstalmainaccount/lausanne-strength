/* ============================================================
   Shared data API for the Lausanne Football Weight Room site.
   Runs as a Vercel serverless function.

   GET  /api/data           -> returns the shared state for everyone
   POST /api/data {password, players, workout}
                            -> saves the shared state (password protected)

   Storage uses an Upstash-compatible Redis REST store
   (this is what "Vercel KV" / Vercel Marketplace > Upstash provides).
   When you connect the store to the project, Vercel sets the env vars
   automatically — no code changes needed.

   Optional env var:
     EDIT_PASSWORD  -> coach password (defaults to "football123")
   ============================================================ */

const KV_URL =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const KV_TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const EDIT_PASSWORD = process.env.EDIT_PASSWORD || "football123";
const STATE_KEY = "lfwr-state-2026";
const EMPTY = { players: {}, workout: {} };

async function redis(command) {
  const res = await fetch(KV_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error("KV request failed: " + res.status);
  const json = await res.json();
  return json.result;
}

async function readState() {
  const raw = await redis(["GET", STATE_KEY]);
  if (!raw) return { ...EMPTY };
  try {
    const parsed = JSON.parse(raw);
    return {
      players: parsed.players || {},
      workout: parsed.workout || {},
    };
  } catch (e) {
    return { ...EMPTY };
  }
}

async function writeState(state) {
  await redis(["SET", STATE_KEY, JSON.stringify(state)]);
}

module.exports = async (req, res) => {
  const configured = Boolean(KV_URL && KV_TOKEN);

  // ---- READ (public) ----
  if (req.method === "GET") {
    if (!configured) {
      return res.status(200).json({ ...EMPTY, configured: false });
    }
    try {
      const state = await readState();
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ ...state, configured: true });
    } catch (e) {
      return res.status(200).json({ ...EMPTY, configured: true, error: "read_failed" });
    }
  }

  // ---- WRITE (coach password required) ----
  if (req.method === "POST") {
    if (!configured) {
      return res.status(503).json({
        error: "storage_not_configured",
        message:
          "Connect an Upstash/Vercel KV store to this project so edits can be saved.",
      });
    }

    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    if (body.password !== EDIT_PASSWORD) {
      return res.status(401).json({ error: "bad_password" });
    }

    const state = {
      players: body.players && typeof body.players === "object" ? body.players : {},
      workout: body.workout && typeof body.workout === "object" ? body.workout : {},
    };

    try {
      await writeState(state);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: "write_failed" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "method_not_allowed" });
};
