/* ============================================================
   Lance Fein Glazing System — white-label embed script

   Drop this one line into ANY website to add a Glazing System
   popup (built with the builder at /glaze/):

   <script src="https://YOUR-DEPLOY/glaze/embed.js"
           data-glaze-config="<encoded config>"
           data-glaze-label="Glaze our comments"
           async></script>

   It adds a floating launcher button; clicking it opens the
   widget in a centered popup overlay (iframe), like a Google
   Form embed. All branding comes from the encoded config, so
   the same script white-labels to any site.
   ============================================================ */

(function () {
  var script = document.currentScript;
  if (!script) return;

  var config = script.getAttribute("data-glaze-config") || "";
  var label = script.getAttribute("data-glaze-label") || "⚔ Glaze this page";
  var color = script.getAttribute("data-glaze-color") || "#3d7be8";
  var base = script.src.replace(/embed\.js.*$/, "");
  var widgetUrl = base + "widget.html?embed=1" + (config ? "&c=" + encodeURIComponent(config) : "");

  var overlay = null;

  function openWidget() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.setAttribute("style", [
      "position:fixed", "inset:0", "background:rgba(20,22,26,0.55)",
      "z-index:2147483646", "display:flex", "align-items:center",
      "justify-content:center", "padding:18px",
    ].join(";"));

    var frame = document.createElement("iframe");
    frame.src = widgetUrl;
    frame.title = "Lance Fein Glazing System";
    frame.setAttribute("style", [
      "width:min(560px,100%)", "height:min(700px,100%)", "border:none",
      "border-radius:10px", "background:#f2f3f5",
      "box-shadow:0 18px 60px rgba(0,0,0,0.4)",
    ].join(";"));

    overlay.appendChild(frame);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeWidget();
    });
    document.body.appendChild(overlay);
  }

  function closeWidget() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
  }

  window.addEventListener("message", function (e) {
    if (e.data && e.data.lfgs === "close") closeWidget();
  });

  function makeLauncher() {
    var btn = document.createElement("button");
    btn.textContent = label;
    btn.setAttribute("aria-haspopup", "dialog");
    btn.setAttribute("style", [
      "position:fixed", "right:22px", "bottom:22px", "z-index:2147483645",
      "background:" + color, "color:#fff", "border:none", "border-radius:28px",
      "padding:13px 22px", "font-size:15px", "font-weight:600",
      "font-family:Roboto,'Segoe UI',Helvetica,Arial,sans-serif",
      "cursor:pointer", "box-shadow:0 6px 22px rgba(0,0,0,0.28)",
    ].join(";"));
    btn.addEventListener("click", openWidget);
    document.body.appendChild(btn);
  }

  if (document.body) makeLauncher();
  else document.addEventListener("DOMContentLoaded", makeLauncher);
})();
