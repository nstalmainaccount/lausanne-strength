/* ============================================================
   Lance Fein Glazing System — the widget
   Runs standalone (direct link) or inside the embed popup.

   Scoring rules ("Glazing Basics"):
   - Scale runs from + Five Lances down to − Five Lances,
     Zero Lances being neutral.
   - Giving Zero, One, or Negative One Lance is a gentle glaze:
     the rater EARNS One Lance Point.
   - Giving anything beyond One Lance either way is heavy glazing:
     the rater LOSES One Lance Point.
   - The author of the comment receives your lances toward their
     Lance Score either way.
   - Authors are hidden behind GLAZE FOR MORE ® until you score.
   ============================================================ */

(function () {
  var params = new URLSearchParams(location.search);
  var embedded = params.get("embed") === "1";

  var DEFAULT_CFG = {
    id: "demo",
    name: "Lance Fein Glazing System",
    itemLabel: "comments",
    color: "#3d7be8",
    scale: 5,
    seed: [
      { author: "Expansive", base: 4, title: "I'm stanning for The Expanse", text: "What a time to be alive! Chrisjen Avasarala is the greatest political operator ever put to screen." },
      { author: "DoughBoy", base: 7, title: "Best glaze in town", text: "The maple glaze on these is criminally underrated. I would walk Ten miles for one." },
      { author: "SkepticalSue", base: -2, title: "Not convinced", text: "Everyone is glazing this place way too hard. It is fine. Just fine. Zero Lances from me." },
    ],
  };

  var cfg = LFGS.decodeConfig(params.get("c")) || DEFAULT_CFG;
  cfg.scale = Math.min(5, Math.max(1, parseInt(cfg.scale, 10) || 5));
  cfg.color = /^#[0-9a-fA-F]{3,8}$/.test(cfg.color || "") ? cfg.color : "#3d7be8";
  document.documentElement.style.setProperty("--brand", cfg.color);
  document.title = cfg.name + " — Lance Fein Glazing System";

  var STORE_KEY = "lfgs:" + cfg.id;

  /* ---------- store ---------- */
  function seedComments() {
    var seeds = (cfg.seed && cfg.seed.length ? cfg.seed : DEFAULT_CFG.seed);
    var now = Date.now();
    return seeds.map(function (s, i) {
      return {
        id: "seed" + i,
        author: s.author,
        title: s.title || "",
        text: s.text,
        created: now - (i + 2) * 86400000 * 3,
        total: 0,
        scores: {},   // persona -> lances given
        replies: [],
      };
    });
  }

  function seedAuthors() {
    var seeds = (cfg.seed && cfg.seed.length ? cfg.seed : DEFAULT_CFG.seed);
    var a = {};
    seeds.forEach(function (s) { a[s.author] = { score: s.base || 0 }; });
    return a;
  }

  function loadStore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* fall through to fresh store */ }
    return {
      comments: seedComments(),
      authors: seedAuthors(),
      personas: {},          // name -> { credit }
      activePersona: null,
    };
  }

  function saveStore() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* storage full/blocked */ }
  }

  var store = loadStore();

  /* ---------- personas ---------- */
  function personaNames() { return Object.keys(store.personas); }

  function activePersona() {
    if (store.activePersona && store.personas[store.activePersona]) return store.activePersona;
    var names = personaNames();
    return names.length ? names[0] : null;
  }

  function createPersona() {
    if (personaNames().length >= 3) {
      toast("You may create up to Three Personas — that is the limit.");
      return null;
    }
    var name = prompt("Name your Persona (this is how you appear when glazing):");
    if (!name) return null;
    name = name.replace(/^@+/, "").replace(/[^\w .-]/g, "").trim().slice(0, 24);
    if (!name) return null;
    if (!store.personas[name]) store.personas[name] = { credit: 0 };
    store.activePersona = name;
    if (!store.authors[name]) store.authors[name] = { score: 0 };
    saveStore();
    render();
    return name;
  }

  function requirePersona() {
    var p = activePersona();
    if (p) return p;
    return createPersona();
  }

  /* ---------- scoring ---------- */
  var pendingScores = {}; // commentId -> chosen lances (not yet saved)

  function saveScore(comment) {
    var persona = requirePersona();
    if (!persona) return;
    var n = pendingScores[comment.id];
    if (typeof n !== "number") return;
    if (comment.scores[persona] !== undefined) return; // one glaze per persona

    comment.scores[persona] = n;
    comment.total += n;
    if (!store.authors[comment.author]) store.authors[comment.author] = { score: 0 };
    store.authors[comment.author].score += n;

    var delta = LFGS.creditDelta(n);
    store.personas[persona].credit += delta;
    saveStore();
    delete pendingScores[comment.id];
    render();

    var gave = "You gave " + LFGS.lances(n) + ".";
    toast(delta > 0
      ? gave + " A gentle glaze — you earned One Lance Point."
      : gave + " Heavy glazing — that cost you One Lance Point.");
  }

  /* ---------- rendering ---------- */
  var openReplies = {}; // commentId -> bool

  function h(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }

  function scoreDropdown(comment) {
    var opts = ['<option value="" selected disabled>GLAZE FOR MORE ® ▾</option>'];
    for (var i = cfg.scale; i >= -cfg.scale; i--) {
      var sel = pendingScores[comment.id] === i ? " selected" : "";
      opts.push('<option value="' + i + '"' + sel + ">" + LFGS.escapeHtml(LFGS.lanceOption(i)) + "</option>");
    }
    var el = h('<select class="glaze-select" aria-label="Glaze this comment">' + opts.join("") + "</select>");
    el.addEventListener("change", function () {
      pendingScores[comment.id] = parseInt(el.value, 10);
      render();
    });
    return el;
  }

  function renderRibbon(comment, persona) {
    var ribbon = h('<div class="ribbon"></div>');
    ribbon.style.background = cfg.color;
    var myScore = persona !== null ? comment.scores[persona] : undefined;

    if (myScore === undefined) {
      // Author invisible until you glaze — GLAZE FOR MORE ®
      ribbon.appendChild(scoreDropdown(comment));

      var pending = pendingScores[comment.id];
      var box = h('<div class="score-box">' +
        (typeof pending === "number" ? LFGS.escapeHtml(LFGS.lanceBadge(pending)) : "·") +
        "</div>");
      ribbon.appendChild(box);

      var save = h('<button class="save-btn" title="Save your glaze">💾 Save</button>');
      save.disabled = typeof pending !== "number";
      save.addEventListener("click", function () { saveScore(comment); });
      ribbon.appendChild(save);

      ribbon.appendChild(h('<div class="pill">' + comment.replies.length + " 💬</div>"));
    } else {
      // Revealed: author, their Lance Score, your glaze, total, replies
      var author = store.authors[comment.author] || { score: 0 };
      ribbon.appendChild(h(
        '<span class="author-chip">@' + LFGS.escapeHtml(comment.author) +
        ' <span class="lance-badge">' + LFGS.escapeHtml(LFGS.lanceBadge(author.score)) + "</span></span>"
      ));
      ribbon.appendChild(h('<div class="score-box" title="Your glaze">' + LFGS.escapeHtml(LFGS.lanceBadge(myScore)) + "</div>"));
      ribbon.appendChild(h('<div class="pill" title="Total lances on this comment">' + LFGS.escapeHtml(LFGS.lanceBadge(comment.total)) + "</div>"));
      ribbon.appendChild(h('<div class="pill">' + comment.replies.length + " 💬</div>"));

      var replyBtn = h('<button class="pill" title="Reply">↩</button>');
      replyBtn.addEventListener("click", function () {
        openReplies[comment.id] = !openReplies[comment.id];
        render();
      });
      ribbon.appendChild(replyBtn);
    }
    return ribbon;
  }

  function renderComment(comment, persona) {
    var el = h('<div class="comment"></div>');
    el.appendChild(renderRibbon(comment, persona));

    var body = h('<div class="comment-body"></div>');
    if (comment.title) body.appendChild(h('<div class="ctitle">' + LFGS.escapeHtml(comment.title) + "</div>"));
    body.appendChild(h('<div class="cmeta">' + LFGS.escapeHtml(LFGS.agoWords(comment.created)) + "</div>"));
    body.appendChild(h('<div class="ctext">' + LFGS.escapeHtml(comment.text) + "</div>"));

    if (comment.replies.length) {
      var wrap = h('<div class="replies"></div>');
      comment.replies.forEach(function (r) {
        wrap.appendChild(h('<div class="reply"><span class="rwho">@' + LFGS.escapeHtml(r.author) + "</span> " + LFGS.escapeHtml(r.text) + "</div>"));
      });
      body.appendChild(wrap);
    }

    if (openReplies[comment.id]) {
      var form = h('<div class="reply-form"><input type="text" placeholder="Write a reply…" maxlength="500" /><button class="save-btn">Reply</button></div>');
      var input = form.querySelector("input");
      form.querySelector("button").addEventListener("click", function () {
        var text = input.value.trim();
        var p = requirePersona();
        if (!text || !p) return;
        comment.replies.push({ author: p, text: text, created: Date.now() });
        openReplies[comment.id] = false;
        saveStore();
        render();
      });
      body.appendChild(form);
    }

    el.appendChild(body);
    return el;
  }

  function render() {
    var shell = document.getElementById("shell");
    shell.innerHTML = "";
    var persona = activePersona();

    /* header */
    var header = h(
      '<div class="widget-header">' +
      '<div><div class="wtitle">⚔ ' + LFGS.escapeHtml(cfg.name) + "</div>" +
      '<div class="wsub">Powered by the Lance Fein Glazing System — curating ' + LFGS.escapeHtml(cfg.itemLabel) + "</div></div>" +
      "</div>"
    );
    header.style.background = cfg.color;
    if (embedded) {
      var close = h('<button class="widget-close" aria-label="Close">✕</button>');
      close.addEventListener("click", function () {
        parent.postMessage({ lfgs: "close" }, "*");
      });
      header.appendChild(close);
    }
    shell.appendChild(header);

    /* persona bar */
    var pbar = h('<div class="persona-bar"><span>Glazing as:</span></div>');
    var names = personaNames();
    if (names.length) {
      var sel = document.createElement("select");
      names.forEach(function (n) {
        var o = document.createElement("option");
        o.value = n;
        o.textContent = "@" + n;
        if (n === persona) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener("change", function () {
        store.activePersona = sel.value;
        saveStore();
        render();
      });
      pbar.appendChild(sel);
    } else {
      pbar.appendChild(h("<span><i>no persona yet</i></span>"));
    }
    if (names.length < 3) {
      var add = h('<button class="btn-ghost btn">+ New Persona</button>');
      add.addEventListener("click", createPersona);
      pbar.appendChild(add);
    }
    shell.appendChild(pbar);

    /* credit bar */
    var credit = persona ? store.personas[persona].credit : 0;
    var received = persona && store.authors[persona] ? store.authors[persona].score : 0;
    shell.appendChild(h(
      '<div class="credit-bar">Lance Credit: <b>' +
      LFGS.escapeHtml(persona ? LFGS.lances(credit) : "—") +
      "</b>" +
      (persona ? " &nbsp;·&nbsp; Lance Score received: <b>" + LFGS.escapeHtml(LFGS.lances(received)) + "</b>" : "") +
      "</div>"
    ));

    /* comments */
    var list = h('<div class="comments"></div>');
    if (!store.comments.length) {
      list.appendChild(h('<div class="comment"><div class="comment-body"><div class="ctext"><i>Nothing to glaze yet. Be the first.</i></div></div></div>'));
    }
    store.comments.forEach(function (c) { list.appendChild(renderComment(c, persona)); });

    /* new comment box */
    var form = h(
      '<div class="new-comment">' +
      '<textarea placeholder="Add your own comment for others to glaze…" maxlength="2000"></textarea>' +
      '<button class="btn btn-primary">Post Comment</button>' +
      "</div>"
    );
    var ta = form.querySelector("textarea");
    var postBtn = form.querySelector("button");
    postBtn.style.background = cfg.color;
    postBtn.addEventListener("click", function () {
      var text = ta.value.trim();
      var p = requirePersona();
      if (!text || !p) return;
      store.comments.unshift({
        id: "c" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
        author: p,
        title: "",
        text: text,
        created: Date.now(),
        total: 0,
        scores: {},
        replies: [],
      });
      saveStore();
      render();
    });
    list.appendChild(form);
    shell.appendChild(list);

    /* rules footer */
    shell.appendChild(h(
      '<div class="rules-note">⚔ <b>Glazing Basics:</b> score from + ' +
      LFGS.escapeHtml(LFGS.lances(cfg.scale)) + " to − " + LFGS.escapeHtml(LFGS.lances(cfg.scale)) +
      ". Giving Zero Lances, One Lance, or Negative One Lance earns you <b>One Lance Point</b>. " +
      "Anything beyond One Lance either way costs you <b>One Lance Point</b>. " +
      "Authors stay hidden behind GLAZE FOR MORE ® until you score.</div>"
    ));
  }

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 3600);
  }

  render();
})();
