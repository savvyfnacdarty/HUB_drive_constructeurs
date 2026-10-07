#!/usr/bin/env python3
"""Tableau de documentation Tineco : Excel (source éditable) -> JSON (lu par tineco.html).

Usage :  python xlsx_vers_json.py  [Tineco_Tableau_documentation.xlsx]  [data/tineco_documentation.json]
Colonnes attendues (feuille « Documentation ») : voir l'en-tête du fichier Excel.
Les références techniques sont séparées par « ; ». Seules les colonnes de lien/libellé sont lues,
la colonne « Recherche » est recalculée.
"""
import sys, re, json, datetime, unicodedata, urllib.parse
from pathlib import Path
import openpyxl

base = Path(__file__).resolve().parent.parent
xlsx = Path(sys.argv[1]) if len(sys.argv) > 1 else base / "data" / "Tineco_Tableau_documentation.xlsx"
out = Path(sys.argv[2]) if len(sys.argv) > 2 else base / "data" / "tineco_documentation.json"

def norm(x):
    x = unicodedata.normalize("NFKD", x).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", x).strip()

def link(label, url):
    label = (label or "").strip(); url = (url or "").strip()
    if not label and not url:
        return None
    p = urllib.parse.unquote(url.split("?")[0])
    p = p.split("Documents partages/", 1)[-1] if "Documents partages/" in p else p
    m = re.search(r"/:([a-z]):/", url)
    t = {"w": "docx", "x": "xlsx", "b": "pdf", "p": "pptx", "v": "video", "f": "dossier"}.get(m.group(1) if m else "", "")
    return {"label": label, "url": url, "path": p, "type": t}

ws = openpyxl.load_workbook(xlsx, data_only=True)["Documentation"]
head = [str(c.value or "").strip() for c in ws[1]]
col = {h: i for i, h in enumerate(head)}
need = ["Référence commerciale", "Références techniques", "Famille", "Modèle usine",
        "Manuel – libellé", "Manuel – lien", "Pièces 1 – libellé", "Pièces 1 – lien", "Pièces 2 – libellé", "Pièces 2 – lien"]
missing = [h for h in need if h not in col]
if missing:
    sys.exit("Colonnes manquantes : " + ", ".join(missing))

rows = []
for r in ws.iter_rows(min_row=2, values_only=True):
    g = lambda h: (r[col[h]] if r[col[h]] is not None else "")
    com = str(g("Référence commerciale")).strip()
    if not com:
        continue
    refs, seen = [x.strip() for x in str(g("Références techniques")).split(";") if x.strip()], []
    [seen.append(x) for x in refs if x not in seen]
    man = link(str(g("Manuel – libellé")), str(g("Manuel – lien")))
    par = [l for l in (link(str(g("Pièces 1 – libellé")), str(g("Pièces 1 – lien"))),
                       link(str(g("Pièces 2 – libellé")), str(g("Pièces 2 – lien")))) if l]
    d = {"id": len(rows) + 1, "commercial": com, "techRefs": seen, "family": str(g("Famille")).strip(),
         "factoryModel": str(g("Modèle usine")).strip(), "manual": man, "parts": par}
    d["search"] = norm(" ".join([com, " ".join(seen), d["factoryModel"],
                                 " ".join(l["label"] for l in ([man] if man else []) + par)]))
    rows.append(d)

meta = {"source": "SAVVY – « TINECO – Documentation technique et correspondance entre références commerciales et techniques » (Tableau de documentation)",
        "extracted": datetime.date.today().isoformat(), "count": len(rows),
        "note": "Rechercher par référence technique (plaque signalétique) : plusieurs documentations peuvent exister pour une même référence commerciale."}
if out.exists():
    try: meta["articleUpdated"] = json.load(open(out, encoding="utf-8"))["meta"].get("articleUpdated", "")
    except Exception: pass
json.dump({"meta": meta, "rows": rows}, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{len(rows)} lignes -> {out}")
