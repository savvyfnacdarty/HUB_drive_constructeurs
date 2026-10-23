# Narwal — suivi et synchronisation mensuelle des FAQ et vidéos

Sources :
- **https://fr.narwal.com** (en français) : FAQ générale (livraison, retours, paiement, garantie), guides produits (Freo Z10, Z Ultra, X Ultra, X Plus), vidéos tutoriels.
- **https://support.narwal.com** (centre d'aide Zendesk, **en anglais seulement**) : dépannage, accessoires, application, manuels, vidéos. Les titres sont traduits en français ici ; les articles s'ouvrent sur le site officiel en anglais.

État initial (23/10/2026) : **33 modèles/rubriques · 334 FAQ (192 du centre d'aide, 142 de fr.narwal.com) · 340 associations · 234 vidéos tutoriels**.

## Contenu du dossier
| Fichier | Rôle |
|---|---|
| `narwal_faq.html` | Page du hub (couleurs Narwal : noir/blanc) : onglets **FAQ** et **Vidéos tutoriels** (lecture YouTube dans la page), recherche, filtre par famille et par modèle |
| `data/narwal_faq.js` / `.json` | Données lues par la page (modèles, titres FR, empreinte de chaque réponse) |
| `data/_traductions.json` | Titres FR des articles du centre d'aide (et des rares titres de fr.narwal.com en allemand) : `{"id": "titre français"}` |
| `data/_traductions_videos.json` | Titres FR des vidéos, indexés par identifiant YouTube : `{"id YouTube": "titre français"}` |
| `data/journal_synchro.csv` | Historique des écarts à chaque synchro (ouvrir avec Excel) |
| `outils/sync_narwal.py` + `.bat` | Synchronisation (comparaison, journal, régénération des données) |
| `outils/collecteur_navigateur.js` | Plan B : collecte depuis le navigateur si le PC ne peut pas joindre les sites |

## Procédure mensuelle (≈ 2 minutes)
**Méthode A — directe** : double-cliquer sur `outils/sync_narwal.bat`.

**Méthode B — via le navigateur** (si A affiche « Site injoignable ») :
1. Ouvrir https://support.narwal.com/hc/en-us dans Chrome ou Edge.
2. F12 → onglet *Console* → coller tout le contenu de `outils/collecteur_navigateur.js` → Entrée.
3. Un fichier `snapshot_narwal_AAAA-MM-JJ.json` se télécharge. Le glisser-déposer sur `sync_narwal.bat`.

Puis lancer `sync_github.bat` du hub pour publier. Les anciennes données sont sauvegardées automatiquement dans `00_Sauvegardes_BAK/Narwal_data_AAAAMMJJ/`.

## Traduire les nouveaux titres
Le centre d'aide est en anglais : chaque **nouvel article** apparaît dans le journal avec le type `TITRE_A_TRADUIRE` (titre anglais). Ajouter `{"id": "titre français"}` dans `data/_traductions.json`, puis relancer la synchro (le titre est alors corrigé). Même principe pour les vidéos (`TITRE_VIDEO_A_TRADUIRE` → `data/_traductions_videos.json`). Tant que ce n'est pas fait, le titre reste en anglais dans la page.

## Lire le journal
`NOUVELLE` (FAQ ajoutée) · `MODIFIEE` (réponse changée) · `SUPPRIMEE` · `PRODUIT_NOUVEAU` / `PRODUIT_RETIRE` · `TITRE_A_TRADUIRE` · `VIDEO_NOUVELLE` / `VIDEO_SUPPRIMEE` · `TITRE_VIDEO_A_TRADUIRE`.
Options du script : `--simuler` (n'écrit rien), `--baseline` (met à jour les empreintes sans journaliser de « modifiée »).

## Points d'attention
- Le centre d'aide est la version **américaine** (anglais) : certains articles citent des modèles vendus en Amérique du Nord (S10 Pro, S20 Pro, S30, « Liste des modèles — Amérique du Nord »).
- Narwal Freo 20, Freo Z10 Turbo, Flow 2 et les deux variantes « Auto Refill & Drainage » n'ont que des **vidéos** (pas de FAQ dédiée) ; Freo X10 Pro n'a qu'une vidéo.
- Les guides produits de fr.narwal.com ne couvrent que 4 modèles (Freo Z10, Z Ultra, X Ultra, X Plus). Quelques questions y sont en doublon d'un modèle à l'autre (même titre, réponse identique ou non) : elles sont fusionnées quand la réponse est identique.
- Les manuels du centre d'aide sont des images : ils sont listés dans « Manuels » et s'ouvrent sur le site officiel.
- Si le script s'arrête sur « structure modifiée ? », fr.narwal.com a changé de mise en page : utiliser la méthode B et prévenir pour adapter les outils.
