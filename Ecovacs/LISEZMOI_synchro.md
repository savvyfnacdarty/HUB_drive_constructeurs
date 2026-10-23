# Ecovacs — suivi et synchronisation mensuelle des FAQ

Source : https://help.ecovacs.com/fr/support — familles **DEEBOT** (87 modèles), **WINBOT** (14), **GOAT** (20).
État initial (21/10/2026) : **121 modèles · 2 155 FAQ · 3 990 associations modèle↔FAQ · 590 vidéos tutoriels (1 333 associations)**. Titres en français.

## Contenu du dossier
| Fichier | Rôle |
|---|---|
| `ecovacs_faq.html` | Page du hub (couleurs Ecovacs) : onglets **FAQ** et **Vidéos tutoriels** (lecture YouTube directement dans la page), recherche, filtre par famille et par modèle |
| `data/ecovacs_faq.js` / `.json` | Données lues par la page (modèles, titres FR, empreinte de chaque réponse) |
| `data/_traductions.json` | Corrections de titres de FAQ restés en langue étrangère : `{"id": "titre français"}` |
| `data/_traductions_videos.json` | Titres français des vidéos, indexés par identifiant YouTube : `{"id YouTube": "titre français"}` |
| `data/journal_synchro.csv` | Historique des écarts à chaque synchro (ouvrir avec Excel) |
| `outils/sync_ecovacs.py` + `.bat` | Synchronisation (comparaison, journal, régénération des données) |
| `outils/collecteur_navigateur.js` | Plan B : collecte depuis le navigateur si le PC ne peut pas joindre le site |

## Procédure mensuelle (≈ 2 minutes)
**Méthode A — directe** : double-cliquer sur `outils/sync_ecovacs.bat`.

**Méthode B — via le navigateur** (si A affiche « Site injoignable ») :
1. Ouvrir https://help.ecovacs.com/fr/support dans Chrome ou Edge.
2. F12 → onglet *Console* → coller tout le contenu de `outils/collecteur_navigateur.js` → Entrée.
3. Un fichier `snapshot_ecovacs_AAAA-MM-JJ.json` se télécharge (≈ 1 min). Le glisser-déposer sur `sync_ecovacs.bat`.

Puis lancer `sync_github.bat` du hub pour publier. Les anciennes données sont sauvegardées automatiquement dans `00_Sauvegardes_BAK/Ecovacs_data_AAAAMMJJ/`.

## Lire le journal
`NOUVELLE` (FAQ ajoutée) · `MODIFIEE` (réponse changée) · `SUPPRIMEE` · `PRODUIT_NOUVEAU` / `PRODUIT_RETIRE` · `TITRE_A_TRADUIRE` (titre de FAQ en langue étrangère : ajouter l'id dans `_traductions.json`, puis relancer la synchro) · `VIDEO_NOUVELLE` / `VIDEO_SUPPRIMEE` · `TITRE_VIDEO_A_TRADUIRE` (nouvelle vidéo au titre anglais : ajouter `{"id YouTube": "titre FR"}` dans `_traductions_videos.json`, puis relancer la synchro).
Options : `--simuler` (n'écrit rien), `--baseline` (met à jour les empreintes sans journaliser de « modifiée »).

## Points d'attention
- 46 modèles n'ont **aucune FAQ** sur le site : ils apparaissent dans le filtre FAQ seulement s'ils en ont ; idem pour les vidéos (77 modèles ont des vidéos).
- La fiche **DEEBOT T50 PRO OMNI Gen3 Blanc** expose sur le site une liste anormale (≈ 890 FAQ de tous modèles mélangés) : les FAQ qui ne figurent que là apparaissent donc rattachées à ce seul modèle.
- 25 titres étaient en italien/allemand sur le site : traduits dans `_traductions.json` (corrigés à chaque synchro).
- Les titres de vidéos étaient en anglais sur le site : ils sont traduits en français ici. Une vidéo (lien Feishu, non YouTube) et deux entrées sans lien ne sont pas reprises.
- Les manuels PDF du site ne sont pas repris.
