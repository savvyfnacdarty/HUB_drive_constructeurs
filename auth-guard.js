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
      // En cas d'échec de chargement, on réaffiche pour ne pas bloquer (mode dégradé)
      document.documentElement.style.visibility = "";
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
        firebase.auth().onAuthStateChanged(function (user) {
          if (user) {
            document.documentElement.style.visibility = "";
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
