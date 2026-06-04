/* ============================================================
   Lausanne Football Weight Room 2026
   Leaderboard + Today's Workout logic
   ============================================================ */

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

// Clean ratio (clean / bodyweight) — coach's scale uses gold / bronze / dev
function cleanTier(r) {
  if (r >= 1.33) return "gold";
  if (r >= 1.25) return "bronze";
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

// ---- Build the leaderboard ----------------------------------------------
function computeRows() {
  return PLAYERS.map((p) => {
    const hasData =
      p.b != null && p.s != null && p.c != null && p.bwt != null && p.bwt > 0;
    const si = hasData ? (p.b + p.s + p.c) / p.bwt : null;
    return { ...p, hasData, si };
  }).sort((a, b) => {
    // Players with data first, ranked by SI descending.
    if (a.hasData && !b.hasData) return -1;
    if (!a.hasData && b.hasData) return 1;
    if (!a.hasData && !b.hasData) return a.name.localeCompare(b.name);
    return b.si - a.si;
  });
}

function liftCell(value, bwt, tierFn) {
  const td = document.createElement("td");
  td.className = "lift-cell";
  const wrap = document.createElement("span");
  wrap.className = "lift-val";
  wrap.append(document.createTextNode(value));
  wrap.append(starFor(tierFn(value / bwt), false));
  td.append(wrap);
  return td;
}

function renderBoard() {
  const rows = computeRows();
  const tbody = document.getElementById("board-body");
  tbody.innerHTML = "";

  let rank = 0;
  rows.forEach((p) => {
    const tr = document.createElement("tr");

    if (!p.hasData) {
      tr.className = "no-data";
      tr.innerHTML = `
        <td class="rank">–</td>
        <td class="name-col"><span class="player-name">${escapeHtml(p.name)}</span></td>
        <td class="dash">—</td><td class="dash">—</td>
        <td class="dash">—</td><td class="dash">—</td><td class="dash">—</td>`;
      tbody.append(tr);
      return;
    }

    rank += 1;
    const tier = siTier(p.si);
    tr.className = "g-" + tier;

    // rank
    const tdRank = document.createElement("td");
    tdRank.className = "rank";
    tdRank.textContent = rank;
    tr.append(tdRank);

    // name + group star
    const tdName = document.createElement("td");
    tdName.className = "name-col";
    const nameWrap = document.createElement("span");
    nameWrap.className = "player-name";
    nameWrap.append(starFor(tier, true));
    nameWrap.append(document.createTextNode(p.name));
    tdName.append(nameWrap);
    tr.append(tdName);

    // lifts with per-lift stars
    tr.append(liftCell(p.b, p.bwt, benchTier));
    tr.append(liftCell(p.s, p.bwt, squatTier));
    tr.append(liftCell(p.c, p.bwt, cleanTier));

    // bodyweight
    const tdBwt = document.createElement("td");
    tdBwt.textContent = p.bwt;
    tr.append(tdBwt);

    // SI
    const tdSi = document.createElement("td");
    tdSi.className = "si-cell";
    tdSi.append(starFor(tier, false));
    tdSi.append(document.createTextNode(" " + p.si.toFixed(2)));
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

// ---- Today's Workout (saved in the browser) ------------------------------
const GROUPS = ["gold", "silver", "bronze", "green"];
const WORKOUT_KEY = "lfwr-workout-2026";

function loadWorkout() {
  try {
    return JSON.parse(localStorage.getItem(WORKOUT_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveWorkout(data) {
  localStorage.setItem(WORKOUT_KEY, JSON.stringify(data));
}

function renderWorkout() {
  const data = loadWorkout();
  const dateEl = document.getElementById("workout-date");
  dateEl.textContent = data.date
    ? "Workout for " + data.date
    : "Today's Workout";

  GROUPS.forEach((g) => {
    document.getElementById("disp-" + g).textContent = "";
    const disp = document.getElementById("disp-" + g);
    const ta = document.getElementById("ta-" + g);
    const text = (data[g] || "").trim();
    ta.value = data[g] || "";
    if (text) {
      disp.textContent = text;
      disp.classList.remove("empty");
    } else {
      disp.textContent = "No workout posted yet.";
      disp.classList.add("empty");
    }
  });
}

function setupWorkout() {
  const editBtn = document.getElementById("edit-workout");
  const saveBtn = document.getElementById("save-workout");
  const cancelBtn = document.getElementById("cancel-workout");
  const flash = document.getElementById("save-flash");

  function setMode(editing) {
    document.getElementById("workout-display").style.display = editing ? "none" : "";
    document.getElementById("workout-edit").style.display = editing ? "" : "none";
    editBtn.style.display = editing ? "none" : "";
  }

  editBtn.addEventListener("click", () => {
    renderWorkout(); // make sure textareas reflect saved values
    setMode(true);
  });

  cancelBtn.addEventListener("click", () => setMode(false));

  saveBtn.addEventListener("click", () => {
    const data = { date: new Date().toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric", year: "numeric" }) };
    GROUPS.forEach((g) => { data[g] = document.getElementById("ta-" + g).value; });
    saveWorkout(data);
    renderWorkout();
    setMode(false);
    flash.classList.add("show");
    setTimeout(() => flash.classList.remove("show"), 1800);
  });

  renderWorkout();
  setMode(false);
}

// ---- Boot ----------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  renderBoard();
  setupWorkout();
});
