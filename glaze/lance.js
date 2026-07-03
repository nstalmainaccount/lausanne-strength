/* ============================================================
   Lance Fein Glazing System — shared helpers
   Every number in this system is expressed in Lances.
   ============================================================ */

var LFGS = (function () {
  var ONES = [
    "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
    "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen",
    "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ];
  var TENS = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty",
    "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  // Spell out an integer in words. Handles -999..999, falls back to digits.
  function words(n) {
    n = Math.round(n);
    if (n < 0) return "Negative " + words(-n);
    if (n < 20) return ONES[n];
    if (n < 100) {
      var t = TENS[Math.floor(n / 10)];
      var r = n % 10;
      return r ? t + "-" + ONES[r] : t;
    }
    if (n < 1000) {
      var h = ONES[Math.floor(n / 100)] + " Hundred";
      var rem = n % 100;
      return rem ? h + " " + words(rem) : h;
    }
    return String(n);
  }

  // "One Lance", "Two Lances", "Negative One Lance", "Zero Lances"
  function lances(n) {
    return words(n) + " " + (Math.abs(Math.round(n)) === 1 ? "Lance" : "Lances");
  }

  // Short badge form, still worded: "Twelve L", "Negative Two L"
  function lanceBadge(n) {
    return words(n) + " L";
  }

  // Signed dropdown label: "+ Three Lances" / "− Three Lances" / "Zero Lances (Neutral)"
  function lanceOption(n) {
    if (n === 0) return "Zero Lances (Neutral)";
    var w = lances(Math.abs(n));
    return (n > 0 ? "+ " : "− ") + w;
  }

  /* The heart of the Glazing System's credit mechanic:
     Zero, One, or Negative One Lance  -> a gentle glaze, earns One Lance Point.
     Anything beyond One Lance either way -> heavy glazing, costs One Lance Point. */
  function creditDelta(score) {
    return Math.abs(score) <= 1 ? 1 : -1;
  }

  /* URL-safe config encoding so a Glazing System travels inside its link,
     exactly like a Google Form — no backend required. */
  function encodeConfig(obj) {
    var json = JSON.stringify(obj);
    var b64 = btoa(unescape(encodeURIComponent(json)));
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function decodeConfig(s) {
    if (!s) return null;
    try {
      var b64 = s.replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(decodeURIComponent(escape(atob(b64))));
    } catch (e) {
      return null;
    }
  }

  function randomId() {
    var chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    var id = "";
    for (var i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Relative time, worded: "Three Days Ago", "Moments Ago"
  function agoWords(ts) {
    var days = Math.floor((Date.now() - ts) / 86400000);
    if (days <= 0) return "Moments Ago";
    return words(days) + " " + (days === 1 ? "Day" : "Days") + " Ago";
  }

  return {
    words: words,
    lances: lances,
    lanceBadge: lanceBadge,
    lanceOption: lanceOption,
    creditDelta: creditDelta,
    encodeConfig: encodeConfig,
    decodeConfig: decodeConfig,
    randomId: randomId,
    escapeHtml: escapeHtml,
    agoWords: agoWords,
  };
})();
