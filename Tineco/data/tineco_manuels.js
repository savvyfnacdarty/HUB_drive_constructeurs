/* Correspondance modèle usine -> manuel de réparation et liens SAVVY (extrait de l'ancien catalogue tineco.html, 07/10/2026). À tenir à jour ici. */
const MANUAL_BY_FACTORY_MODEL = {
  "CL1762":"iFloor and iFloor 2 Series Repair Manual",
  "CL1879":"Floor One S3 Series repair manual V1.1",
  "CL2011":"iFLOOR 3 BREEZE Series Repair Manual",
  "CL2019":"Floor One S5 & S6 & iFloor 5 Series Repair Manual",
  "CL2020":"Floor One S5 combo Series Repair Manual v1240724",
  "CL2029":"Floor One S5 Steam Series repair manual V1.0",
  "CL2041":"iFloor and iFloor 2 Series Repair Manual",
  "CL2043":"Carpet One /iCarpet  Repair Manual",
  "CL2123":"Floor One S7 Pro Series Repair Manual",
  "CL2138":"Carpet one spot series &iCarpet Spot  repair manual",
  "CL2203":"Floor One S7 Steam Series Repair Manual",
  "CL2220":"Floor One S7 combo&switch Series repair manual V1.1",
  "CL2221":"Yoniev U5 & U5S & U7s  Repair Manual",
  "CL2223":"Floor One S5 & S6 & iFloor 5 Series Repair Manual",
  "CL2315":"Yoniev U5 & U5S & U7s  Repair Manual",
  "CL2316":"Floor One S5 combo Series Repair Manual v1240724",
  "CL2321":"Carpet One /iCarpet  Repair Manual",
  "CL2325":"Yoniev U5 & U5S & U7s  Repair Manual",
  "CL2328":"Floor One Stretch S6 Series &i6 Stretch Repair Manual",
  "CL2331":"Floor One S5 & S6 & iFloor 5 Series Repair Manual",
  "CL2335":"Floor One S7 Pro Series Repair Manual",
  "CL2343":"Floor one S9&S7 Artist Repair Manual",
  "CL2347":"Floor One S5 & S6 & iFloor 5 Series Repair Manual",
  "CL2348":"Floor one Switch S6 S7 stretch Series Repair Manual",
  "CL2371":"Floor One S5 & S6 & iFloor 5 Series Repair Manual",
  "CL2376":"Floor One S7 & i5 Stretch Series Repair Manual",
  "CL2378":"GO H2O MAX &  i FLOOR Y2 Series Repair Manual",
  "CL2411":"Floor one iFLOOR Y3 Y5 Stretch &Yoniev U9 & iFLOOR U5Stretch Repair Manual",
  "CL2415":"Carpet one spot series &iCarpet Spot  repair manual",
  "CL2426":"Floor one Switch S6 S7 stretch Series Repair Manual",
  "CL2453":"Floor One S5 & S6 & iFloor 5 Series Repair Manual",
  "CL2457":"Floor One S5 & S6 & iFloor 5 Series Repair Manual",
  "CL2458":"Floor One Stretch S6 Series &i6 Stretch Repair Manual",
  "CL2501":"Floor One Stretch S6 Series &i6 Stretch Repair Manual",
  "CL2533":"Floor One Stretch S6 Series &i6 Stretch Repair Manual",
  "CL2535":"Floor One Stretch S6 Series &i6 Stretch Repair Manual",
  "CL2540":"Floor one S9&S7 Artist Repair Manual",
  "CL2543":"Floor one Switch S6 S7 stretch Series& Breeze Repair Manual"
};

// Un lien SharePoint par manuel (plusieurs modèles peuvent partager le même manuel).
// Liens reconstruits depuis "LIENS SHAREPOINT.xlsx" + l'URL de base du site fournie.
// Certains rapprochements sont approximatifs (noms de fichiers ne correspondant pas
// exactement au nom du manuel dans le fichier de correspondance) : voir la note dans
// la bannière de chaque appareil concerné pour vérification.
const MANUAL_LINKS = {
  "Carpet One /iCarpet  Repair Manual": "https://groupefnac.sharepoint.com/sites/SAVVY_FNACDARTY/Documents%20partages/Tineco/Floor%20washer/1.Repair%20Manual/Carpet%20One%20Series%20Repair%20Manual%20240812.docx",
  "Carpet one spot series &iCarpet Spot  repair manual": "https://groupefnac.sharepoint.com/sites/SAVVY_FNACDARTY/Documents%20partages/Tineco/Floor%20washer/1.Repair%20Manual/Carpet%20one%20spot%20series%20repair%20manual.docx",
  "Floor One S3 Series repair manual V1.1": "https://groupefnac.sharepoint.com/sites/SAVVY_FNACDARTY/Documents%20partages/Tineco/Floor%20washer/1.Repair%20Manual/FloorOne%20S3%20Series%20Repair%20Manual.docx",
  "Floor One S5 & S6 & iFloor 5 Series Repair Manual": "https://groupefnac.sharepoint.com/sites/SAVVY_FNACDARTY/Documents%20partages/Tineco/Repair%20Manual%20for%20LMR%20Supplementary%20Model/Floor%20One%20S5%20and%20S6%20Series%20Repair%20Manual%20240619%20v1.4.docx",
  "Floor One S5 Steam Series repair manual V1.0": "https://groupefnac.sharepoint.com/sites/SAVVY_FNACDARTY/Documents%20partages/Tineco/Floor%20washer/1.Repair%20Manual/IFLOOR%205%20STEAM%20Series%20Repair%20Manual%20240620%20v1.0.docx",
  "Floor One S5 combo Series Repair Manual v1240724": "https://groupefnac.sharepoint.com/sites/SAVVY_FNACDARTY/Documents%20partages/Tineco/Repair%20Manual%20for%20LMR%20Supplementary%20Model/Floor%20One%20S5%20combo%20Series%20Repair%20Manual%20v1240724.docx",
  "Floor One S7 & i5 Stretch Series Repair Manual": "https://groupefnac.sharepoint.com/sites/SAVVY_FNACDARTY/Documents%20partages/Tineco/Floor%20washer/1.Repair%20Manual/Floor%20One%20S7%20%26%20i5%20Stretch%20Series%20Repair%20Manual.docx",
  "Floor One S7 Pro Series Repair Manual": "https://groupefnac.sharepoint.com/sites/SAVVY_FNACDARTY/Documents%20partages/Tineco/Floor%20washer/1.Repair%20Manual/Floor%20One%20S7%20Pro%20Series%20Repair%20Manual%20240730.docx",
  "Floor One S7 Steam Series Repair Manual": "https://groupefnac.sharepoint.com/sites/SAVVY_FNACDARTY/Documents%20partages/Tineco/Floor%20washer/1.Repair%20Manual/Floor%20One%20S7%20Steam%20Series%20Repair%20Manual.docx",
  "Floor One S7 combo&switch Series repair manual V1.1": "https://groupefnac.sharepoint.com/sites/SAVVY_FNACDARTY/Documents%20partages/Tineco/Floor%20washer/1.Repair%20Manual/Floor%20One%20S7%20combo%26switch%20Series%20repair%20manual%20V1.1.docx",
  "Floor One Stretch S6 Series &i6 Stretch Repair Manual": "https://groupefnac.sharepoint.com/sites/SAVVY_FNACDARTY/Documents%20partages/Tineco/Floor%20washer/1.Repair%20Manual/Floor%20One%20Stretch%20S6%20Series%20Repair%20Manual.docx",
  "Floor one S9&S7 Artist Repair Manual": "https://groupefnac.sharepoint.com/sites/SAVVY_FNACDARTY/Documents%20partages/Tineco/Floor%20washer/1.Repair%20Manual/Floor%20one%20S9%20Artist%20Repair%20Manual%200409%20update.docx",
  "Floor one Switch S6 S7 stretch Series Repair Manual": "https://groupefnac.sharepoint.com/sites/SAVVY_FNACDARTY/Documents%20partages/Tineco/Floor%20washer/1.Repair%20Manual/Floor%20one%20Switch%20S6%20S7%20stretch%20Series%20Repair%20Manual%200409%20update.docx",
  "Floor one Switch S6 S7 stretch Series& Breeze Repair Manual": "https://groupefnac.sharepoint.com/sites/SAVVY_FNACDARTY/Documents%20partages/Tineco/Floor%20washer/1.Repair%20Manual/Floor%20one%20Switch%20S6%20S7%20stretch%20Series%20Repair%20Manual%200409%20update.docx",
  "Floor one iFLOOR Y3 Y5 Stretch &Yoniev U9 & iFLOOR U5Stretch Repair Manual": "https://groupefnac.sharepoint.com/sites/SAVVY_FNACDARTY/Documents%20partages/Tineco/Floor%20washer/1.Repair%20Manual/Floor%20one%20iFLOOR%20Y3%20Y5%20Stretch%20%26Yoniev%20U9%20%26%20iFLOOR%20U5Stretch%20Repair%20Manual.docx",
  "GO H2O MAX &  i FLOOR Y2 Series Repair Manual": "https://groupefnac.sharepoint.com/sites/SAVVY_FNACDARTY/Documents%20partages/Tineco/Floor%20washer/1.Repair%20Manual/GO%20H2O%20MAX%20Series%20Repair%20Manual%20240814.docx",
  "Yoniev U5 & U5S & U7s  Repair Manual": "https://groupefnac.sharepoint.com/sites/SAVVY_FNACDARTY/Documents%20partages/Tineco/Floor%20washer/Yoniev%20U5%26U5S%26U7s/Yoniev%20U7s/Yoniev%20U7s%20CL2325ABC%20Repair%20Manual.docx",
  "iFLOOR 3 BREEZE Series Repair Manual": "https://groupefnac.sharepoint.com/sites/SAVVY_FNACDARTY/Documents%20partages/Tineco/Floor%20washer/1.Repair%20Manual/iFLOOR%203%20BREEZE%20Series%20Repair%20Manual%20240816.docx",
  "iFloor and iFloor 2 Series Repair Manual": "https://groupefnac.sharepoint.com/sites/SAVVY_FNACDARTY/Documents%20partages/Tineco/Repair%20Manual%20for%20LMR%20Supplementary%20Model/iFloor%20and%20iFloor%202%20Series%20Repair%20Manual.docx"
};

// Rapprochements fichier/manuel non garantis à 100% (nom de fichier SharePoint ne
// correspondant pas exactement au nom du manuel) : à vérifier avant usage.
const APPROX_MANUALS = new Set([
  "Carpet One /iCarpet  Repair Manual",
  "GO H2O MAX &  i FLOOR Y2 Series Repair Manual",
  "Yoniev U5 & U5S & U7s  Repair Manual",
  "Floor one Switch S6 S7 stretch Series& Breeze Repair Manual"
]);
