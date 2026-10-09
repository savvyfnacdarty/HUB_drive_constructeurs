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
