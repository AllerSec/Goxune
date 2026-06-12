/* ============================================================
   GOXUNE · lang-redirect.js
   Root entry point. Detects visitor language from the browser
   and redirects to /es/, /en/, /eu/ or /fr/.
   - Honors a previously chosen language (localStorage).
   - NEVER auto-selects Euskara (eu) by default; eu is opt-in only.
   - Defaults to Spanish (es) when locale is unknown.
   ============================================================ */
(function () {
  var SUPPORTED = ["es", "en", "eu", "fr"];
  var DEFAULT = "es";

  function pick() {
    // 1) explicit prior choice wins
    try {
      var saved = localStorage.getItem("gx_lang");
      if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    } catch (e) {}

    // 2) detect from browser languages
    var langs = navigator.languages || [navigator.language || navigator.userLanguage || ""];
    for (var i = 0; i < langs.length; i++) {
      var code = (langs[i] || "").toLowerCase().slice(0, 2);
      // Euskara is intentionally excluded from auto-detection.
      if (code === "en") return "en";
      if (code === "fr") return "fr";
      if (code === "es" || code === "ca" || code === "gl") return "es"; // Spain locales → Spanish
    }
    // 3) fallback
    return DEFAULT;
  }

  var target = pick() + "/";
  // Preserve any hash so deep links survive the redirect.
  location.replace(target + (location.hash || ""));
})();
