// Garde d'authentification Firebase — à inclure en premier dans le <head> de chaque page :
//   <script src="auth-guard.js"></script>          (pages à la racine)
//   <script src="../auth-guard.js"></script>       (pages dans un sous-dossier)
(function () {
  var src = document.currentScript && document.currentScript.src;
  if (!src) return;
  var base = src.replace(/auth-guard\.js.*$/, "");

  // Bypass en local : fichier ouvert directement (file://) ou servi depuis localhost
  var isLocal = location.protocol === "file:" ||
    /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if (isLocal) return;

  // Masque la page tant que l'authentification n'est pas confirmée
  document.documentElement.style.visibility = "hidden";

  function load(url, cb) {
    var s = document.createElement("script");
    s.src = url;
    s.onload = cb;
    s.onerror = function () {
      // Mode strict : si l'authentification ne peut pas être vérifiée, la page reste inaccessible
      document.documentElement.style.visibility = "";
      document.body.innerHTML = '<div style="font:16px system-ui,Arial,sans-serif;max-width:520px;margin:15vh auto;padding:24px;text-align:center">' +
        '<h2 style="color:#D4151B">Accès impossible</h2><p>Le service d\'authentification est injoignable. ' +
        'Vérifiez votre connexion (réseau Fnac Darty / VPN) puis rechargez la page.</p></div>';
    };
    document.head.appendChild(s);
  }

  load("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js", function () {
    load("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js", function () {
      load(base + "auth-config.js", function () {
        if (!window.FIREBASE_CONFIG || /REMPLACER/.test(window.FIREBASE_CONFIG.apiKey)) {
          // Config non renseignée : on n'active pas la protection
          document.documentElement.style.visibility = "";
          return;
        }
        firebase.initializeApp(window.FIREBASE_CONFIG);
        var from = encodeURIComponent(location.pathname + location.search);
        function expulser() {
          document.documentElement.style.visibility = "hidden";
          firebase.auth().signOut().then(function () {
            location.replace(base + "login.html?expired=1&from=" + from);
          });
        }
        firebase.auth().onAuthStateChanged(function (user) {
          if (user && window.hubSessionExpiree && window.hubSessionExpiree(user)) {
            expulser();
          } else if (user) {
            document.documentElement.style.visibility = "";
            // Page restée ouverte au-delà de minuit : re-vérification périodique
            var verif = function () {
              var u = firebase.auth().currentUser;
              if (u && window.hubSessionExpiree(u)) expulser();
            };
            setInterval(verif, 60000);
            document.addEventListener("visibilitychange", function () {
              if (!document.hidden) verif();
            });
          } else {
            location.replace(base + "login.html?from=" + encodeURIComponent(location.pathname + location.search));
          }
        });
        // Déconnexion disponible partout : hubLogout()
        window.hubLogout = function () {
          firebase.auth().signOut().then(function () {
            location.href = base + "login.html";
          });
        };
      });
    });
  });
})();
