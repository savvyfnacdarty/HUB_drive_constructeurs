// Bandeau pied de page du HUB Drive constructeurs — inclus sur toutes les pages.
// Un seul bloc noir : ligne « Espace interne Fnac Darty » (footer de la page, ou créée ici
// si la page n'en a pas) + mention de confidentialité juste dessous, sur le même fond noir.
(function () {
  var NOIR = "#000";
  function add() {
    if (document.getElementById("hub-confidentialite")) return;

    // Footer existant de la page (dernier <footer> du document)
    var foots = document.getElementsByTagName("footer");
    var foot = foots.length ? foots[foots.length - 1] : null;

    if (foot && foot.parentNode !== document.body) document.body.appendChild(foot); // ex. iRobot : footer dans un conteneur étroit
    if (foot) {
      // Le footer existant passe en noir, pleine largeur, collé à la mention
      var s = foot.style;
      s.setProperty("background", NOIR, "important");
      s.setProperty("color", "#fff", "important");
      s.setProperty("max-width", "none", "important");
      s.setProperty("width", "100%", "important");
      s.setProperty("box-sizing", "border-box", "important");
      s.setProperty("margin", "24px 0 0", "important");
      s.setProperty("padding", "14px 16px 6px", "important");
      s.setProperty("border", "0", "important");
      s.setProperty("text-align", "center", "important");
      s.setProperty("justify-content", "center", "important");
    }

    var f = document.createElement("div");
    f.id = "hub-confidentialite";
    f.setAttribute("role", "note");
    f.style.cssText = "clear:both;box-sizing:border-box;width:100%;margin:" + (foot ? "0" : "24px 0 0") + ";" +
      "padding:" + (foot ? "0 16px 14px" : "14px 16px") + ";background:" + NOIR + ";border:0;color:#bdbdbd;" +
      "font:12px/1.45 system-ui,Arial,sans-serif;text-align:center";
    f.innerHTML = (foot ? "" : "<div style=\"color:#fff;font-size:.8rem;padding-bottom:6px\">Espace interne <span style=\"color:#EEA31E;font-weight:600\">Fnac Darty</span></div>") +
      "<b style=\"color:#fff\">Usage interne Fnac Darty</b> – Documents constructeurs et SAV réservés aux collaborateurs. " +
      "Ne pas diffuser, copier ou transmettre à des tiers sans l’accord du constructeur concerné et de Fnac Darty. " +
      "Documentation propriété des constructeurs, usage SAV uniquement.";

    if (foot && foot.parentNode) foot.parentNode.insertBefore(f, foot.nextSibling);
    else document.body.appendChild(f);
  }
  if (document.body) add(); else document.addEventListener("DOMContentLoaded", add);
})();

// Bouton « Confidentialité » dans le bandeau rouge (en haut à droite) + infobulle au survol.
(function () {
  var TEXTE = "Usage interne Fnac Darty – Documents constructeurs et SAV réservés aux collaborateurs. " +
    "Ne pas diffuser, copier ou transmettre à des tiers sans l’accord du constructeur concerné et de Fnac Darty. " +
    "Documentation propriété des constructeurs, usage SAV uniquement.";

  function addBtn() {
    if (document.getElementById("hub-info-conf")) return;
    // Bandeau rouge : selon les pages (index = <header>, autres = .hubbar / .fdtop / .fdbar)
    var bar = document.querySelector(".hubbar") || document.querySelector(".fdtop") ||
      document.querySelector(".fdbar .fdin") || document.querySelector(".fdbar") || document.querySelector("body > header");
    if (!bar) return;

    var st = document.createElement("style");
    st.textContent =
      "#hub-info-conf{position:relative;margin-left:auto;flex:0 0 auto;font:600 13px/1 system-ui,Arial,sans-serif;z-index:10000}" +
      "#hub-info-conf button{display:inline-flex;align-items:center;gap:6px;cursor:help;border:1.5px solid rgba(255,255,255,.85);" +
      "background:rgba(255,255,255,.12);color:#fff;border-radius:999px;padding:6px 12px;font:inherit}" +
      "#hub-info-conf button:hover,#hub-info-conf button:focus-visible{background:#fff;color:#b92d28;outline:none}" +
      "#hub-info-conf .hic{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;" +
      "border:1.5px solid currentColor;font:700 11px/1 Georgia,serif}" +
      "#hub-info-conf .htip{display:none;position:absolute;right:0;top:calc(100% + 10px);width:320px;max-width:calc(100vw - 24px);" +
      "background:#000;color:#fff;padding:12px 14px;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.35);" +
      "font:400 12.5px/1.5 system-ui,Arial,sans-serif;text-align:left;white-space:normal;cursor:default}" +
      "#hub-info-conf .htip b{display:block;margin-bottom:4px;color:#EEA31E}" +
      "#hub-info-conf .htip:before{content:'';position:absolute;right:22px;top:-6px;border:6px solid transparent;border-top:0;border-bottom-color:#000}" +
      "#hub-info-conf:hover .htip,#hub-info-conf:focus-within .htip,#hub-info-conf.open .htip{display:block}" +
      "@media (max-width:600px){#hub-info-conf .hlbl{display:none}#hub-info-conf button{padding:6px}}" +
      "@media print{#hub-info-conf{display:none!important}}";
    document.head.appendChild(st);

    var w = document.createElement("div");
    w.id = "hub-info-conf";
    if (bar.querySelector(".qs")) w.style.marginLeft = "0";
    w.innerHTML = "<button type=\"button\" aria-label=\"Informations de confidentialité\" aria-describedby=\"hub-info-tip\">" +
      "<span class=\"hic\">i</span><span class=\"hlbl\">Confidentialité</span></button>" +
      "<div class=\"htip\" id=\"hub-info-tip\" role=\"tooltip\"><b>Informations de confidentialité</b>" + TEXTE + "</div>";
    // Le bandeau peut être un lien (<a>) : le bouton ne doit pas déclencher la navigation
    w.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); w.classList.toggle("open"); });
    document.addEventListener("click", function (e) { if (!w.contains(e.target)) w.classList.remove("open"); });
    bar.appendChild(w);
  }
  if (document.body) addBtn(); else document.addEventListener("DOMContentLoaded", addBtn);
})();

// Flèche « remonter en haut de page » sur toutes les pages (sauf celles qui en ont déjà une : Beko).
(function () {
  function addTop() {
    if (document.getElementById("hub-totop") || document.querySelector(".totop")) return;
    var b = document.createElement("button");
    b.id = "hub-totop"; b.type = "button"; b.textContent = "↑";
    b.setAttribute("aria-label", "Haut de page"); b.title = "Haut de page";
    b.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:9990;width:44px;height:44px;border-radius:50%;border:0;" +
      "background:#D4151B;color:#fff;font:700 20px/1 system-ui,Arial,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.3);cursor:pointer;display:none";
    b.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    var st = document.createElement("style");
    st.textContent = "@media print{#hub-totop{display:none!important}}";
    document.head.appendChild(st);
    function upd() { b.style.display = (window.pageYOffset || document.documentElement.scrollTop) > 300 ? "block" : "none"; }
    window.addEventListener("scroll", upd, { passive: true }); upd();
    document.body.appendChild(b);
  }
  if (document.body) addTop(); else document.addEventListener("DOMContentLoaded", addTop);
})();

// Bouton « Déconnexion » dans le bandeau rouge (à droite du bouton Confidentialité), sur toutes les pages.
// Appelle hubLogout() défini par auth-guard.js ; invisible en local (garde désactivé) ou tant que l'auth n'est pas prête.
(function () {
  function addLogout() {
    if (document.getElementById("hub-logout")) return;
    var bar = document.querySelector(".hubbar") || document.querySelector(".fdtop") ||
      document.querySelector(".fdbar .fdin") || document.querySelector(".fdbar") || document.querySelector("body > header");

    var st = document.createElement("style");
    st.textContent =
      "#hub-logout{display:none;align-items:center;gap:6px;cursor:pointer;flex:0 0 auto;margin-left:8px;border:1.5px solid rgba(255,255,255,.85);" +
      "background:rgba(255,255,255,.12);color:#fff;border-radius:999px;padding:6px 12px;font:600 13px/1 system-ui,Arial,sans-serif;z-index:10000}" +
      "#hub-logout:hover,#hub-logout:focus-visible{background:#fff;color:#b92d28;outline:none}" +
      "#hub-logout.hub-logout-fixed{position:fixed;top:10px;right:10px;margin:0;background:#D4151B;border-color:#D4151B;box-shadow:0 2px 8px rgba(0,0,0,.3)}" +
      "#hub-logout.hub-logout-fixed:hover{background:#fff;color:#D4151B}" +
      "@media (max-width:600px){#hub-logout .hlbl{display:none}#hub-logout{padding:6px 8px}}" +
      "@media print{#hub-logout{display:none!important}}";
    document.head.appendChild(st);

    var b = document.createElement("button");
    b.id = "hub-logout"; b.type = "button"; b.title = "Se déconnecter du hub";
    b.setAttribute("aria-label", "Se déconnecter du hub");
    b.innerHTML = "<span aria-hidden=\"true\">⏻</span><span class=\"hlbl\">Déconnexion</span>";
    // Le bandeau peut être un lien (<a>) : ne pas déclencher la navigation
    b.addEventListener("click", function (e) {
      e.preventDefault(); e.stopPropagation();
      if (window.hubLogout) window.hubLogout();
    });
    if (bar) bar.appendChild(b);
    else { b.className = "hub-logout-fixed"; document.body.appendChild(b); }

    // Affichage dès que l'authentification est active (hubLogout défini par auth-guard.js)
    var essais = 0;
    var t = setInterval(function () {
      if (window.hubLogout) { b.style.display = "inline-flex"; clearInterval(t); }
      else if (++essais > 100) clearInterval(t);
    }, 300);
  }
  if (document.body) addLogout(); else document.addEventListener("DOMContentLoaded", addLogout);
})();
