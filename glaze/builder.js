/* ============================================================
   Lance Fein Glazing System — builder
   Encodes the whole system config into a URL-safe token so the
   widget can be white-labeled into any site with one link.
   ============================================================ */

(function () {
  function $(id) { return document.getElementById(id); }

  function parseSeed(raw) {
    return raw
      .split("\n")
      .map(function (line) { return line.trim(); })
      .filter(Boolean)
      .map(function (line) {
        var parts = line.split("|").map(function (p) { return p.trim(); });
        if (parts.length >= 3) {
          return { author: parts[0] || "Anonymous", base: parseInt(parts[1], 10) || 0, text: parts.slice(2).join(" | ") };
        }
        if (parts.length === 2) {
          return { author: parts[0] || "Anonymous", base: 0, text: parts[1] };
        }
        return { author: "Anonymous", base: 0, text: parts[0] };
      });
  }

  function build() {
    var cfg = {
      id: LFGS.randomId(),
      name: $("f-name").value.trim() || "Lance Fein Glazing System",
      itemLabel: $("f-items").value,
      color: $("f-color").value,
      scale: parseInt($("f-scale").value, 10) || 5,
    };
    var seed = parseSeed($("f-seed").value);
    if (seed.length) cfg.seed = seed;

    var token = LFGS.encodeConfig(cfg);
    var base = location.href.replace(/[^/]*(?:[?#].*)?$/, "");
    var link = base + "widget.html?c=" + token;
    var snippet =
      '<script src="' + base + 'embed.js"\n' +
      '        data-glaze-config="' + token + '"\n' +
      '        data-glaze-label="⚔ ' + cfg.name.replace(/"/g, "&quot;") + '"\n' +
      '        data-glaze-color="' + cfg.color + '"\n' +
      "        async><\/script>";

    $("o-link").value = link;
    $("o-open").href = link;
    $("o-embed").value = snippet;
    $("o-preview").src = "widget.html?embed=0&c=" + token;
    $("output").style.display = "block";
    $("output").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  $("f-build").addEventListener("click", build);

  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var src = $(btn.getAttribute("data-copy"));
      src.select ? src.select() : null;
      navigator.clipboard.writeText(src.value).then(function () {
        var note = $("note-" + btn.getAttribute("data-copy"));
        if (note) {
          note.textContent = "Copied ✓";
          setTimeout(function () { note.textContent = ""; }, 2000);
        }
      });
    });
  });
})();
