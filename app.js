/* ============================================================
   Lausanne Football Weight Room 2026
   Leaderboard + Today's Workout + Coach Edit Mode

   Data is shared for everyone through /api/data (see api/data.js).
   - Anyone who opens the site reads the latest saved numbers/workout.
   - A coach unlocks edit mode with the password, makes changes, and
     hits Publish — which saves to the shared store so every player
     sees it on their next visit/refresh.
   ============================================================ */

const EDIT_PASSWORD = "football123";
const API_URL = "/api/data";
const DRAFT_KEY = "lfwr-cache-2026";   // local cache / offline fallback
const GROUPS = ["gold", "silver", "bronze", "green"];

let editMode = false;
let coachPassword = null;               // kept in memory only, for publishing
// Shared state:
//   players = { "Name": {b,s,c,bwt}, ... }  numeric overrides (keyed by roster name)
//   names   = { "Roster Name": "Corrected Name", ... }  typo fixes
//   workout = { date, gold, silver, bronze, green }
let state = { players: {}, workout: {}, names: {} };
let storageConfigured = true;

// ---- Tier definitions ----------------------------------------------------
// Overall Strength Index (SI) = (bench + squat + clean) / body weight
function siTier(si) {
  if (si >= 5.5) return "gold";
  if (si >= 4.6) return "silver";
  if (si >= 4.0) return "bronze";
  return "green"; // developmental
}
function benchTier(r) {
  if (r >= 1.5)  return "gold";
  if (r >= 1.35) return "silver";
  if (r >= 1.25) return "bronze";
  return "green";
}
function squatTier(r) {
  if (r >= 2.4)  return "gold";
  if (r >= 2.0)  return "silver";
  if (r >= 1.75) return "bronze";
  return "green";
}
function cleanTier(r) {
  if (r >= 1.33) return "gold";
  if (r >= 1.25) return "silver";
  if (r >= 1.0)  return "bronze";
  return "green";
}

const TIER_NAME = {
  gold: "Gold", silver: "Silver", bronze: "Bronze", green: "Developmental",
};

function starFor(tier, big) {
  const span = document.createElement("span");
  span.className = "star " + tier + (big ? " big" : "");
  span.textContent = "★";
  span.title = TIER_NAME[tier];
  return span;
}

// ---- Shared state load/save ---------------------------------------------
async function loadState() {
  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    const data = await res.json();
    state = {
      players: data.players || {},
      workout: data.workout || {},
      names: data.names || {},
    };
    storageConfigured = data.configured !== false;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  } catch (e) {
    // Offline or API not reachable -> fall back to last known cache.
    try {
      const cached = JSON.parse(localStorage.getItem(DRAFT_KEY));
      if (cached) state = {
        players: cached.players || {},
        workout: cached.workout || {},
        names: cached.names || {},
      };
    } catch (_) { /* ignore */ }
  }
}

function cacheLocally() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
}

async function publish() {
  if (!coachPassword) coachPassword = EDIT_PASSWORD;
  setPublishStatus("Publishing…", "");
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: coachPassword,
        players: state.players,
        workout: state.workout,
        names: state.names,
      }),
    });
    if (res.status === 401) {
      setPublishStatus("Wrong password — couldn't publish.", "err");
      return false;
    }
    if (res.status === 503) {
      setPublishStatus("Saved on this device, but the shared store isn't set up yet.", "err");
      return false;
    }
    if (!res.ok) {
      setPublishStatus("Couldn't publish (server error).", "err");
      return false;
    }
    setPublishStatus("✓ Published — everyone will see it on refresh.", "ok");
    return true;
  } catch (e) {
    setPublishStatus("Saved on this device, but couldn't reach the server.", "err");
    return false;
  }
}

function setPublishStatus(msg, kind) {
  const el = document.getElementById("publish-status");
  if (!el) return;
  el.textContent = msg;
  el.className = "publish-status " + (kind || "");
}

// ---- Player data (roster + shared overrides) ----------------------------
function getPlayers() {
  const overrides = state.players || {};
  const names = state.names || {};
  return PLAYERS.map((p) => {
    const o = overrides[p.name] || {};
    const merged = {
      key: p.name,                          // stable roster key (never changes)
      name: names[p.name] || p.name,        // display name (typo-corrected)
      b: o.b !== undefined ? o.b : p.b,
      s: o.s !== undefined ? o.s : p.s,
      c: o.c !== undefined ? o.c : p.c,
      bwt: o.bwt !== undefined ? o.bwt : p.bwt,
    };
    const hasData =
      merged.b != null && merged.s != null &&
      merged.c != null && merged.bwt != null && merged.bwt > 0;
    merged.hasData = hasData;
    merged.si = hasData ? (merged.b + merged.s + merged.c) / merged.bwt : null;
    return merged;
  }).sort((a, b) => {
    if (a.hasData && !b.hasData) return -1;
    if (!a.hasData && b.hasData) return 1;
    if (!a.hasData && !b.hasData) return a.name.localeCompare(b.name);
    return b.si - a.si;
  });
}

function setOverride(name, field, value) {
  state.players[name] = state.players[name] || {};
  state.players[name][field] = value;
  cacheLocally();
}

function setNameOverride(key, name) {
  if (!name || name === key) {
    delete state.names[key];   // back to the original roster name
  } else {
    state.names[key] = name;
  }
  cacheLocally();
}

// ---- Leaderboard rendering ----------------------------------------------
function liftDisplayCell(value, bwt, tierFn) {
  const td = document.createElement("td");
  td.className = "lift-cell";
  const wrap = document.createElement("span");
  wrap.className = "lift-val";
  wrap.append(document.createTextNode(value));
  wrap.append(starFor(tierFn(value / bwt), false));
  td.append(wrap);
  return td;
}

function liftInputCell(player, field, bwt, tierFn) {
  const td = document.createElement("td");
  td.className = "lift-cell editing";
  const wrap = document.createElement("span");
  wrap.className = "lift-val";

  const input = document.createElement("input");
  input.type = "number";
  input.className = "edit-input";
  input.value = player[field] != null ? player[field] : "";
  input.dataset.name = player.key;
  input.dataset.field = field;
  input.addEventListener("change", onEditChange);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") input.blur(); });
  wrap.append(input);

  if (tierFn && player[field] != null && bwt != null && bwt > 0) {
    wrap.append(starFor(tierFn(player[field] / bwt), false));
  }
  td.append(wrap);
  return td;
}

function onEditChange(e) {
  const input = e.target;
  const raw = input.value.trim();
  const value = raw === "" ? null : Number(raw);
  if (raw !== "" && (Number.isNaN(value) || value < 0)) {
    input.value = "";
    return;
  }
  setOverride(input.dataset.name, input.dataset.field, value);
  renderBoard(); // recompute SI, re-sort ranks, refresh all stars
  setPublishStatus("Unpublished changes — hit Publish to share with everyone.", "warn");
}

function onNameChange(e) {
  setNameOverride(e.target.dataset.key, e.target.value.trim());
  // No re-render needed — a name change doesn't affect ranking, and
  // re-rendering would steal focus while the coach is still typing.
  setPublishStatus("Unpublished changes — hit Publish to share with everyone.", "warn");
}

function renderBoard() {
  const players = getPlayers();
  const tbody = document.getElementById("board-body");
  tbody.innerHTML = "";

  let rank = 0;
  players.forEach((p) => {
    const tr = document.createElement("tr");

    if (!p.hasData && !editMode) {
      tr.className = "no-data";
      tr.innerHTML = `
        <td class="rank">–</td>
        <td class="name-col"><span class="player-name">${escapeHtml(p.name)}</span></td>
        <td class="dash">—</td><td class="dash">—</td>
        <td class="dash">—</td><td class="dash">—</td><td class="dash">—</td>`;
      tbody.append(tr);
      return;
    }

    const ranked = p.hasData;
    if (ranked) rank += 1;
    tr.className = ranked ? "g-" + siTier(p.si) : "no-data";

    const tdRank = document.createElement("td");
    tdRank.className = "rank";
    tdRank.textContent = ranked ? rank : "–";
    tr.append(tdRank);

    const tdName = document.createElement("td");
    tdName.className = "name-col";
    const nameWrap = document.createElement("span");
    nameWrap.className = "player-name";
    if (ranked) nameWrap.append(starFor(siTier(p.si), true));
    if (editMode) {
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.className = "edit-input name-input";
      nameInput.value = p.name;
      nameInput.dataset.key = p.key;
      nameInput.addEventListener("change", onNameChange);
      nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") nameInput.blur(); });
      nameWrap.append(nameInput);
    } else {
      nameWrap.append(document.createTextNode(p.name));
    }
    tdName.append(nameWrap);
    tr.append(tdName);

    if (editMode) {
      tr.append(liftInputCell(p, "b", p.bwt, p.hasData ? benchTier : null));
      tr.append(liftInputCell(p, "s", p.bwt, p.hasData ? squatTier : null));
      tr.append(liftInputCell(p, "c", p.bwt, p.hasData ? cleanTier : null));
      tr.append(liftInputCell(p, "bwt", null, null));
    } else {
      tr.append(liftDisplayCell(p.b, p.bwt, benchTier));
      tr.append(liftDisplayCell(p.s, p.bwt, squatTier));
      tr.append(liftDisplayCell(p.c, p.bwt, cleanTier));
      const tdBwt = document.createElement("td");
      tdBwt.textContent = p.bwt;
      tr.append(tdBwt);
    }

    const tdSi = document.createElement("td");
    tdSi.className = "si-cell";
    if (ranked) {
      tdSi.append(starFor(siTier(p.si), false));
      tdSi.append(document.createTextNode(" " + p.si.toFixed(2)));
    } else {
      tdSi.append(document.createTextNode("—"));
    }
    tr.append(tdSi);

    tbody.append(tr);
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// ---- Tabs ----------------------------------------------------------------
function setupTabs() {
  const buttons = document.querySelectorAll("nav.tabs button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.target).classList.add("active");
    });
  });
}

// ---- Today's Workout -----------------------------------------------------
function renderWorkout() {
  const data = state.workout || {};
  document.getElementById("workout-date").textContent =
    data.date ? "Workout for " + data.date : "Today's Workout";
  document.getElementById("workout-note").textContent = editMode
    ? "Type each group's lift of the day, then Publish."
    : "";

  const grid = document.getElementById("workout-grid");
  grid.innerHTML = "";

  GROUPS.forEach((g) => {
    const card = document.createElement("div");
    card.className = "wcard " + g;

    const h = document.createElement("h3");
    h.append(starFor(g, true));
    h.append(document.createTextNode(" " + TIER_NAME[g] + " Group"));
    card.append(h);

    const body = document.createElement("div");
    body.className = "body";

    if (editMode) {
      const ta = document.createElement("textarea");
      ta.value = data[g] || "";
      ta.placeholder = "Lift of the day for the " + TIER_NAME[g] + " group…";
      ta.addEventListener("input", () => {
        state.workout[g] = ta.value;
        cacheLocally();
        setPublishStatus("Unpublished changes — hit Publish to share with everyone.", "warn");
      });
      body.append(ta);
    } else {
      const disp = document.createElement("div");
      disp.className = "display";
      const text = (data[g] || "").trim();
      if (text) {
        disp.textContent = text;
      } else {
        disp.textContent = "No workout posted yet.";
        disp.classList.add("empty");
      }
      body.append(disp);
    }
    card.append(body);
    grid.append(card);
  });
}

async function publishWorkout() {
  // stamp the date when a workout is posted
  const hasText = GROUPS.some((g) => (state.workout[g] || "").trim());
  if (hasText) {
    state.workout.date = new Date().toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
  }
  cacheLocally();
  const ok = await publish();
  if (ok) renderWorkout();
}

// ---- Coach tools / edit toggle (password gated) --------------------------
function renderCoachTools() {
  const bar = document.getElementById("coach-tools");
  bar.innerHTML = "";
  if (!editMode) { bar.classList.remove("show"); return; }
  bar.classList.add("show");

  const publishBtn = document.createElement("button");
  publishBtn.className = "btn primary";
  publishBtn.textContent = "Publish to everyone";
  publishBtn.addEventListener("click", publishWorkout);
  bar.append(publishBtn);

  const status = document.createElement("span");
  status.id = "publish-status";
  status.className = "publish-status";
  if (!storageConfigured) {
    status.textContent = "Shared store not set up yet — edits won't reach players until it is.";
    status.classList.add("warn");
  }
  bar.append(status);
}

function setupEditToggle() {
  const btn = document.getElementById("edit-toggle");
  const banner = document.getElementById("edit-banner");

  btn.addEventListener("click", () => {
    if (editMode) {
      editMode = false;
      coachPassword = null;
    } else {
      const entry = prompt("Enter coach password to unlock edit mode:");
      if (entry === null) return;
      if (entry !== EDIT_PASSWORD) { alert("Incorrect password."); return; }
      editMode = true;
      coachPassword = entry;
    }
    btn.textContent = editMode ? "🔓 Lock Edit Mode" : "🔒 Unlock Edit Mode";
    btn.classList.toggle("on", editMode);
    banner.classList.toggle("show", editMode);
    renderCoachTools();
    renderBoard();
    renderWorkout();
  });
}

// ---- Boot ----------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  setupTabs();
  setupEditToggle();
  renderBoard();      // show roster immediately
  renderWorkout();
  await loadState();  // then fill in shared numbers/workout
  renderBoard();
  renderWorkout();
});
