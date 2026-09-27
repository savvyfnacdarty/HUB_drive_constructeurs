# Hub Beko SAV — site GitHub Pages

Site statique 100 % HTML généré depuis le Drive « ProgTest & Bulletins Techniques ».
Chaque PDF est une page HTML (pages en image, texte sélectionnable, zones cliquables recréées).

## Mise en ligne (GitHub Pages)
1. Pousser le contenu de ce dossier à la racine du dépôt (branche `main`).
2. GitHub → Settings → Pages → Source : « Deploy from a branch » → `main` / `(root)`.
3. Le site est servi à `https://<compte>.github.io/<depot>/`.

## Mise à jour après une synchro du Drive
Depuis le dossier parent : relancer `_build_hub/build_site.py` (phases `render` puis `html`).
Seuls les PDF nouveaux ou modifiés sont re-rendus.
