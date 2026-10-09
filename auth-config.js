// Configuration Firebase — à remplacer par les valeurs de TON projet
// (Console Firebase > Paramètres du projet > Tes applications > Configuration)
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyDfBDJKsmAxAKpxWQIyAXhh6BWapwY078g",
  authDomain: "hub-drive-constructeurs.firebaseapp.com",
  projectId: "hub-drive-constructeurs",
  appId: "1:255332541896:web:bafe37aaeecb3a670e8cfd"
};

// Déconnexion obligatoire quotidienne : la connexion n'est valable que le jour (heure de Paris)
// où le mot de passe a été saisi. Dès le lendemain, nouvelle connexion exigée.
// Mettre HUB_SESSION_QUOTIDIENNE à false pour désactiver.
window.HUB_SESSION_QUOTIDIENNE = true;
window.hubSessionExpiree = function (user) {
  if (!window.HUB_SESSION_QUOTIDIENNE || !user || !user.metadata || !user.metadata.lastSignInTime) return false;
  var jour = function (d) { return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(d); };
  return jour(new Date(user.metadata.lastSignInTime)) !== jour(new Date());
};
