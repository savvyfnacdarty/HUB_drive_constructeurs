# Compteur de consultations — HUB Drive Constructeurs

Mesure privée du nombre de consultations : **total cumulé + détail par page**.
Le compteur n'est **pas visible** par les utilisateurs du HUB — seul le tableau de bord l'affiche.

---

## 1. Créer le compte (5 minutes, une seule fois)

1. Aller sur **https://www.goatcounter.com/signup**
2. Renseigner :
   - **Code** : `hub-drive-fnac` (c'est ce code qui donne l'adresse du tableau de bord)
   - **Email** : ton adresse
   - **Mot de passe**
3. Valider.

Ton tableau de bord est alors accessible sur **https://hub-drive-fnac.goatcounter.com**

## 2. Rendre le tableau de bord privé

Dans **Settings → Site settings** :

- décocher **« Make statistics publicly available »**

Sans cette étape, n'importe qui connaissant l'adresse pourrait voir les chiffres.

## 3. Activer le compteur sur les pages — ✅ FAIT

Le script est inséré et configuré sur le code `hub-drive-fnac` dans les **11 pages** du HUB :

**Racine**

- `index.html`
- `laurastar.html`
- `roborock.html`
- `tineco.html`

**dreame_sav/**

- `dreame.html`
- `bulletin_service.html`
- `pem.html`
- `index_fault_codes.html`
- `calibration_index_MAJ.html`
- `lecteur_bom.html`
- `bit_test_single.html`

```html
<script data-goatcounter="https://hub-drive-fnac.goatcounter.com/count"
        async src="//gc.zgo.at/count.js"></script>
```

Il ne reste qu'à faire **commit + push** pour publier sur GitHub Pages.

## 4. Lire les résultats

Sur **https://hub-drive-fnac.goatcounter.com** :

| Ce que tu cherches | Où le trouver |
|---|---|
| Total cumulé toutes pages | Chiffre en haut du tableau de bord |
| Détail par page constructeur | Liste **Pages** — une ligne par fichier (`/HUB_drive_constructeurs/laurastar.html`, `/roborock.html`…) |
| Visiteurs uniques vs vues | Colonnes **Visits** et **Pageviews** |
| Évolution dans le temps | Sélecteur de période en haut (jour / semaine / mois / année) |
| Appareils, navigateurs | Onglets en bas de page |

L'historique est **conservé sans limite de durée**, contrairement aux statistiques GitHub (14 jours).

---

## Notes

- **Pas de cookie**, pas de donnée personnelle collectée → aucun bandeau de consentement RGPD nécessaire.
- Poids ajouté aux pages : **~3,5 Ko**, chargement asynchrone, aucun impact sur l'affichage.
- Si le script est bloqué par le réseau Fnac (domaine `gc.zgo.at`), les pages continuent de fonctionner normalement — seul le comptage est perdu. À vérifier après le premier déploiement : ouvre une page, puis regarde si la visite apparaît dans le tableau de bord sous 1 à 2 minutes.
- **Gratuit** pour un usage non commercial. Pour un usage professionnel déclaré, l'offre Business est à 15 $/mois, ou l'auto-hébergement est gratuit.

## Alternative si le domaine est bloqué

Microsoft Clarity (`clarity.microsoft.com`) — gratuit sans restriction d'usage, tableau de bord privé, mais utilise des cookies (bandeau de consentement à prévoir). Dis-le moi et je remplace le script.
