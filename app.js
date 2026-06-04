/* ============================================================
   Lausanne Football Weight Room 2026
   Leaderboard + Today's Workout + Coach Edit Mode
   ============================================================ */

const EDIT_PASSWORD = "football123";
const DATA_KEY = "lfwr-data-2026";       // coach edits to player numbers
const WORKOUT_KEY = "lfwr-workout-2026";  // posted workouts
const GROUPS = ["gold", "silver", "bronze", "green"];

let editMode = false;

// ---- Tier definitions ----------------------------------------------------
// Overall Strength Index (SI) = (bench + squat + clean) / body weight
function siTier(si) {
  if (si >= 5.5) return "gold";
  if (si >= 4.6) return "silver";
  if (si >= 4.0) return "bronze";
  return "green"; // developmental
}

// Bench ratio (bench / bodyweight)
function benchTier(r) {
  if (r >= 1.5)  return "gold";
  if (r >= 1.35) return "silver";
  if (r >= 1.25) return "bronze";
  return "green";
}

// Squat ratio (squat / bodyweight)
function squatTier(r) {
  if (r >= 2.4)  return "gold";
  if (r >= 2.0)  return "silver";
  if (r >= 1.75) return "bronze";
  return "green";
}

// Clean ratio (clean / bodyweight)
function cleanTier(r) {
  if (r >= 1.33) return "gold";
  if (r >= 1.25) return "silver";
  if (r >= 1.0)  return "bronze";
  return "green";
}

const TIER_NAME = {
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
  green: "Developmental",
};

function starFor(tier, big) {
  const span = document.createElement("span");
  span.className = "star " + tier + (big ? " big" : "");
  span.textContent = "★";
  span.title = TIER_NAME[tier];
  return span;
}

// ---- Player data + coach overrides --------------------------------------
function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(DATA_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveOverride(name, field, value) {
  const overrides = loadOverrides();
  overrides[name] = overrides[name] || {};
  overrides[name][field] = value;
  localStorage.setItem(DATA_KEY, JSON.stringify(overrides));
}

// Merge base roster (data.js) with any coach edits saved in this browser.
function getPlayers() {
  const overrides = loadOverrides();
  return PLAYERS.map((p) => {
    const o = overrides[p.name] || {};
    const merged = {
      name: p.name,
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
  input.dataset.name = player.name;
  input.dataset.field = field;
  input.addEventListener("change", onEditChange);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") input.blur(); });
  wrap.append(input);

  // live star preview (only meaningful when both this value and bwt exist)
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
  saveOverride(input.dataset.name, input.dataset.field, value);
  renderBoard(); // recompute SI, re-sort ranks, refresh all stars
}

function renderBoard() {
  const players = getPlayers();
  const tbody = document.getElementById("board-body");
  tbody.innerHTML = "";

  let rank = 0;
  players.forEach((p) => {
    const tr = document.createElement("tr");

    // No data + not editing -> a "needs numbers" row at the bottom.
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

    // rank
    const tdRank = document.createElement("td");
    tdRank.className = "rank";
    tdRank.textContent = ranked ? rank : "–";
    tr.append(tdRank);

    // name + group star
    const tdName = document.createElement("td");
    tdName.className = "name-col";
    const nameWrap = document.createElement("span");
    nameWrap.className = "player-name";
    if (ranked) nameWrap.append(starFor(siTier(p.si), true));
    nameWrap.append(document.createTextNode(p.name));
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

    // SI
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
function loadWorkout() {
  try {
    return JSON.parse(localStorage.getItem(WORKOUT_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function renderWorkout() {
  const data = loadWorkout();
  document.getElementById("workout-date").textContent =
    data.date ? "Workout for " + data.date : "Today's Workout";
  document.getElementById("workout-note").textContent = editMode
    ? "Type each group's lift of the day, then Save & Post."
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
      ta.id = "ta-" + g;
      ta.value = data[g] || "";
      ta.placeholder = "Lift of the day for the " + TIER_NAME[g] + " group…";
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

  const actions = document.getElementById("workout-actions");
  actions.innerHTML = "";
  if (editMode) {
    const save = document.createElement("button");
    save.className = "btn primary";
    save.textContent = "Save & Post Workout";
    save.addEventListener("click", saveWorkout);
    actions.append(save);
  }
}

function saveWorkout() {
  const data = loadWorkout();
  data.date = new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  GROUPS.forEach((g) => {
    const ta = document.getElementById("ta-" + g);
    if (ta) data[g] = ta.value;
  });
  localStorage.setItem(WORKOUT_KEY, JSON.stringify(data));
  renderWorkout();
  const flash = document.getElementById("save-flash");
  flash.classList.add("show");
  setTimeout(() => flash.classList.remove("show"), 1800);
}

// ---- Edit mode toggle (password gated) -----------------------------------
function setupEditToggle() {
  const btn = document.getElementById("edit-toggle");
  const banner = document.getElementById("edit-banner");

  btn.addEventListener("click", () => {
    if (editMode) {
      editMode = false;
    } else {
      const entry = prompt("Enter coach password to unlock edit mode:");
      if (entry === null) return; // cancelled
      if (entry !== EDIT_PASSWORD) {
        alert("Incorrect password.");
        return;
      }
      editMode = true;
    }
    btn.textContent = editMode ? "🔓 Lock Edit Mode" : "🔒 Unlock Edit Mode";
    btn.classList.toggle("on", editMode);
    banner.classList.toggle("show", editMode);
    renderBoard();
    renderWorkout();
  });
}

// ---- Boot ----------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupEditToggle();
  renderBoard();
  renderWorkout();
});
