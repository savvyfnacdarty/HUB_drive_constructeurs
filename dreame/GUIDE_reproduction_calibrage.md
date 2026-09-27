# Guide de reproduction — Onglet « Calibrage » Dreame / Mova

Ce document décrit **tout ce qu'il faut** pour reproduire l'onglet calibrage
(`calibration_index_MAJ.html`) dans un nouveau dossier avec ta propre structure.

Le principe : **une seule page HTML** qui lit **deux fichiers Excel** au chargement.
Tu ne touches jamais au code au quotidien — tu mets à jour les Excel, la page se
met à jour toute seule.

---

## 1. Fichiers nécessaires

| Fichier | Rôle | Obligatoire |
|---|---|---|
| `calibration_index_MAJ.html` | La page (le code) | ✅ |
| `Calibration tips.xlsx` | Quels calibrages sont requis par modèle / Project ID | ✅ |
| `Calibration_procedures_TEMPLATE.xlsx` | Manipulations + illustrations (procédures) | ✅ |
| `assets/shared.css` | Feuille de style commune (header, thème clair/sombre…) | ✅ |
| Les images `.png` / vidéos `.mp4` | Illustrations affichées dans les procédures | ✅ |

Dépendances externes (chargées automatiquement depuis Internet, rien à installer) :
SheetJS (lecture des `.xlsx`), jsPDF + AutoTable (rapport PDF), lecteur Vimeo.

---

## 2. Structure de dossier recommandée

```
mon-dossier/                         (= racine du site, ex. dossier "dreame")
├── calibration_index_MAJ.html
├── Calibration tips.xlsx            ← à la racine
├── Calibration_procedures_TEMPLATE.xlsx  ← à la racine
├── assets/
│   └── shared.css
└── images/
    ├── gyroscope_1.png
    ├── LDS_Calibration_1.png
    ├── Calibration_double_camera_1.png
    └── … (toutes les autres images)
```

> C'est une **recommandation**, pas une obligation : la page sait chercher les
> images et les Excel à plusieurs endroits (voir §5). Adapte selon ta structure.

---

## 3. Comment la page fonctionne

Au chargement, la page :

1. **télécharge `Calibration tips.xlsx`** → construit la liste des modèles et,
   pour chacun, coche les calibrages requis (✅) + les valeurs LDS.
2. **télécharge `Calibration_procedures_TEMPLATE.xlsx`** → construit le contenu
   de chaque procédure (accès, action, étapes, remarques) + les images/vidéos.
3. affiche une barre de statut de synchro (✅ vert = Excel lus, ⚠️ orange =
   données de secours utilisées).

Si un Excel n'est **pas joignable** (ex. ouverture locale en `file://`), la page
bascule sur un **jeu de secours intégré** au HTML. Ce secours contient les
données figées au moment de la génération — donc **tes dernières modifs Excel
n'apparaissent que si l'Excel est réellement lu** (→ héberger sur GitHub Pages).

---

## 4. Schéma des fichiers Excel

### 4.1 `Calibration tips.xlsx` — feuille 1

Les **5 premières lignes** sont des en-têtes/explications. Les données modèles
commencent **ligne 6**. Colonnes (ordre = indispensable) :

| Col | Contenu | Utilisé pour |
|---|---|---|
| A | Modèle (ex. `X50 Ultra`) | Recherche + titre |
| B | Project code (ex. `R9446`) | Recherche |
| C | Gyroscope (IMU) — `√` si requis | Calibrage IMU |
| D | SACLE Calibration — `√` si requis | Calibrage SACLE (LDS élévateur) |
| E–I | Valeurs LDS : HC/S40, S67, 06N, X, Y | Tableau valeurs LDS |
| J | Line laser — `√` | Calibrage laser linéaire |
| K | Dual-camera — `√` | Calibrage double caméra |
| L | Pairing — `√` | Couplage station/robot |
| M | Tof Cliff Sensor — `√` | Capteur falaise TOF |
| N | Edge tof — `√` | TOF de bord |
| O | Current Calibration — `√` | Calibrage courant |
| P | SACLE (moteurs) — `√` | Moteurs brosse/serpillière |
| Q | Texte reset usine | Bandeau « restaurer paramètres d'usine » |

**Règle :** un `√` dans la cellule = calibrage requis. Le texte à côté du `√`
devient une note affichée.

### 4.2 `Calibration_procedures_TEMPLATE.xlsx` — feuille « Procédures »

Une **ligne par type de calibrage** (à partir de la ligne 5). Colonnes :

| Col | Titre | Rôle |
|---|---|---|
| A | Type de calibrage | **NE PAS renommer** — sert de clé de rapprochement |
| B | Accès | Où trouver le calibrage dans l'app |
| C | Action | La manip principale |
| D | Étapes détaillées | Le déroulé pas à pas |
| E | Captures écran associées | **Noms d'images** séparés par `;` (+ liens Vimeo) |
| F | Remarques | Précautions, cas particuliers |

**Rapprochement automatique** (colonne A → procédure), par mots-clés :

| Si la colonne A contient… | Procédure |
|---|---|
| `accès au mode` / `mode calibration` | Accès (bloc bleu) |
| `gyroscope` / `imu` | Gyroscope (IMU) |
| `sacle` / `scale` | SACLE |
| `lds` … `calibration` | LDS |
| `line laser` | Laser linéaire |
| `double` | Double caméra |
| `pairing` / `wifi station` | Couplage station/robot |
| `cliff` | Capteur falaise TOF |
| `edge` | TOF de bord |
| `current` | Courant |

**Colonne E (images) :** on ne met que le **nom du fichier**, ex.
`gyroscope_1.png ; gyroscope_2.png ;`. Le dossier est géré par le HTML (§5).
Un lien Vimeo (`https://vimeo.com/123456`) est automatiquement transformé en
lecteur vidéo intégré.

---

## 5. Adapter les chemins à TA structure

Tout se règle dans **3 lignes** au début du `<script>` de `calibration_index_MAJ.html`.

### Images

```js
const IMG_BASES = ["","images/","images/calibrage-acces/","Doc_calibration/"];
```

La page essaie ces dossiers **dans l'ordre** jusqu'à trouver l'image (repli
automatique). Mets **en premier** le dossier où sont réellement tes images.
Exemples :
- images à la **racine** → garde `""` en premier ;
- images dans **`images/`** → mets `"images/"` en premier.

### Fichiers Excel

```js
const TIPS_URLS = ["Calibration tips.xlsx","images/calibrage-acces/Calibration tips.xlsx","Doc_calibration/Calibration tips.xlsx"];
const PROC_URLS = ["Calibration_procedures_TEMPLATE.xlsx","images/calibrage-acces/Calibration_procedures_TEMPLATE.xlsx","Doc_calibration/Calibration_procedures_TEMPLATE.xlsx"];
```

Même logique : mets en premier le chemin réel de chaque Excel. Par défaut ils
sont cherchés **à la racine**, à côté du HTML.

> Astuce : le seul lien entre l'Excel et les images, c'est le **nom de fichier**.
> Déplacer les images ne demande donc **aucune modification de l'Excel**, juste
> l'ordre de `IMG_BASES`.

---

## 6. Mise en forme du texte (gras / couleur)

À taper **directement dans les cellules Excel** (la mise en forme Excel native
n'est pas lue — seul le texte compte) :

| Pour obtenir… | Écrire dans la cellule |
|---|---|
| **gras** | `**texte**` ou `__texte__` |
| rouge | `[[rouge]]texte[[/]]` |
| vert | `[[vert]]texte[[/]]` |
| orange | `[[orange]]texte[[/]]` |
| bleu | `[[bleu]]texte[[/]]` |
| violet / gris / noir | `[[violet]]…[[/]]`, `[[gris]]…[[/]]`, `[[noir]]…[[/]]` |
| gras **+** couleur | `**[[rouge]]texte[[/]]**` |

Tolérant : majuscules, espaces (`[[ rouge ]]`), noms anglais (`red`, `green`,
`blue`…) et fermeture `[[fin]]` sont acceptés. Un nom de couleur inconnu enlève
simplement les balises.

---

## 7. Déploiement (GitHub Pages)

1. Mets les fichiers (§1) dans ton dépôt, en respectant ta structure (§2).
2. Vérifie l'ordre des chemins (§5) selon l'emplacement réel des images/Excel.
3. Pousse sur GitHub. GitHub Pages sert le dossier.
4. Ouvre la page → **Ctrl + F5** (vide le cache).

**Mettre à jour le contenu ensuite :** il suffit de remplacer un `.xlsx` dans le
dépôt (et d'ajouter les nouvelles images). Aucune modification du HTML.

---

## 8. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| Barre de statut ⚠️ orange « données de secours » | L'Excel n'a pas pu être lu (ouverture locale `file://`) | Tester **sur GitHub Pages**, pas en local |
| Mes dernières modifs Excel n'apparaissent pas | Mode secours, ou cache navigateur | GitHub Pages + Ctrl + F5 |
| Images cassées | Mauvais dossier | Mettre le bon dossier **en premier** dans `IMG_BASES` |
| Balises `**…**` affichées telles quelles | HTML pas à jour, ou page en mode secours | Ré-uploader le HTML + tester sur GitHub Pages |
| Un calibrage n'a pas de procédure | Mot-clé colonne A non reconnu | Vérifier le libellé de la colonne A (§4.2) |

---

## 9. Résumé express

- **2 Excel** pilotent tout : `tips` = quels calibrages, `procedures` = comment.
- **Images** = juste le nom de fichier dans l'Excel ; le dossier est dans `IMG_BASES`.
- **Mise en forme** = balises `**gras**` / `[[couleur]]…[[/]]` dans les cellules.
- **Toujours tester sur GitHub Pages** + Ctrl + F5, jamais en local.
