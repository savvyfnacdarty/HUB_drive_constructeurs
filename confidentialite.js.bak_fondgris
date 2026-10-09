// Mention de confidentialité du HUB Drive constructeurs — incluse sur toutes les pages.
(function () {
  function add() {
    if (document.getElementById("hub-confidentialite")) return;
    var f = document.createElement("div");
    f.id = "hub-confidentialite";
    f.setAttribute("role", "note");
    f.style.cssText = "clear:both;box-sizing:border-box;width:100%;margin:24px 0 0;padding:10px 16px;" +
      "background:#f3f3f3;border-top:1px solid #d9d9d9;color:#555;font:12px/1.45 system-ui,Arial,sans-serif;text-align:center";
    f.innerHTML = "<b>Usage interne Fnac Darty</b> – Documents constructeurs et SAV réservés aux collaborateurs. " +
      "Ne pas diffuser, copier ou transmettre à des tiers sans l’accord du constructeur concerné et de Fnac Darty. " +
      "Documentation propriété des constructeurs, usage SAV uniquement.";
    document.body.appendChild(f);
  }
  if (document.body) add(); else document.addEventListener("DOMContentLoaded", add);
})();
