#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Synchronisation mensuelle des FAQ Ecovacs (DEEBOT / WINBOT / GOAT)
Source : https://help.ecovacs.com/fr/support

Deux façons de l'utiliser :
  1) Direct   : python sync_ecovacs.py
     (le PC télécharge lui-même les ~121 pages produit du site)
  2) Instantané navigateur (si le réseau de l'entreprise bloque le script) :
     - ouvrir https://help.ecovacs.com/fr/support dans Chrome/Edge
     - F12 > Console > coller le contenu de collecteur_navigateur.js > Entrée
     - un fichier snapshot_ecovacs_AAAA-MM-JJ.json est téléchargé
     - python sync_ecovacs.py --snapshot "C:\\chemin\\snapshot_ecovacs_AAAA-MM-JJ.json"

Options :
  --simuler     n'écrit rien, affiche seulement les différences
  --baseline    met à jour les empreintes sans les consigner comme « modifiées »
  --data-dir X  dossier des données (test)

Ce que fait le script : compare avec data/ecovacs_faq.json, ajoute les écarts
(NOUVELLE / MODIFIEE / SUPPRIMEE / PRODUIT_NOUVEAU / PRODUIT_RETIRE / TITRE_A_TRADUIRE)
à data/journal_synchro.csv, régénère data/ecovacs_faq.json et .js,
et sauvegarde l'ancienne version dans 00_Sauvegardes_BAK/.
Les titres sont déjà en français sur le site ; ceux qui ne le seraient pas se
corrigent dans data/_traductions.json  ({"id": "titre français"}).
"""
import argparse, csv, datetime, hashlib, io, json, os, re, shutil, sys, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

BASE = "https://help.ecovacs.com"
UA = {"User-Agent": "Mozilla/5.0 (HUB-Drive-Constructeurs sync)"}
HERE = os.path.dirname(os.path.abspath(__file__))
FAMILLES = ("DEEBOT", "WINBOT", "GOAT")
ND = re.compile(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', re.S)
# détection simple de titres NON français (italien / allemand / anglais) par comptage de mots
MOTS_ETR = re.compile(r"\b(perch[eé]|può|della|delle|nello|esegue|attività|pavimenti|possibile|utilizzare|soluzioni|mappa|è|che|nicht|warum|wie|und|ist|wird|wenn|kann|why|how|what|does|can|the|is|are|with|when|my)\b", re.I)
MOTS_FR = re.compile(r"\b(pourquoi|comment|quel|quelle|quels|que|qu|faire|peut|peut-il|est|et|sur|avec|pour|dans|ne|pas|les|des|du|au|aux|un|une|le|la|mon|ma|mes|il|elle|ou|lors)\b", re.I)


def titre_etranger(t):
    return len(MOTS_ETR.findall(t)) > len(MOTS_FR.findall(t))


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read().decode("utf-8", "replace")


def h6(txt):
    return hashlib.sha1((txt or "").encode("utf-8")).hexdigest()[:6]


YT = re.compile(r"(?:youtu\.be/|embed/|v=|shorts/)([\w-]{11})")


def yt_id(url):
    m = YT.search(url or "")
    return m.group(1) if m else None


def titre_video(t):
    return re.sub(r"\s+", " ", re.sub(r"^\s*\d+\s+", "", (t or "").replace("\uff1f", "?"))).strip()


def page_data(alias):
    m = ND.search(get(f"{BASE}/fr/support/{alias}"))
    return json.loads(m.group(1))["props"]["pageProps"]["pageData"]


def collecter():
    """Instantané complet depuis le site (même format que le collecteur navigateur)."""
    html = get(f"{BASE}/fr/support")
    aliases = []
    for a in re.findall(r'href="(?:https://help\.ecovacs\.com)?/fr/support/([a-z0-9][a-z0-9\-]*)["?#]', html):
        if a not in aliases and a != "search":
            aliases.append(a)
    print(f"{len(aliases)} pages candidates sur la page support (les pages non-produit sont ignorées)")
    if len(aliases) < 60:
        sys.exit("Trop peu de produits détectés : la structure du site a peut-être changé. Utilisez le collecteur navigateur.")

    def un(alias):
        try:
            pd = page_data(alias)
            pi = pd.get("product_info") or {}
            if pi.get("category") not in FAMILLES:
                return dict(alias=alias, ignore=True)  # page non-produit (garantie, contact…)
            seen, faq = set(), []
            for f in pd.get("faq_list") or []:
                if f["id"] in seen:
                    continue
                seen.add(f["id"])
                faq.append([f["id"], h6(f.get("answer")), (f.get("question") or "").strip()])
            vseen, vid = set(), []
            for v in pd.get("video_list") or []:
                y = yt_id(v.get("video_url"))
                if y and y not in vseen:
                    vseen.add(y)
                    vid.append([y, titre_video(v.get("title"))])
            return dict(alias=alias, id=pi["id"], famille=pi["category"], nom=pi["name"], faq=faq, vid=vid)
        except Exception as e:  # noqa
            return dict(alias=alias, erreur=str(e))

    with ThreadPoolExecutor(6) as ex:
        res = [r for r in ex.map(un, aliases) if not r.get("ignore")]
    return {"date": str(datetime.date.today()), "produits": res}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--snapshot")
    ap.add_argument("--simuler", action="store_true")
    ap.add_argument("--baseline", action="store_true")
    ap.add_argument("--data-dir", default=os.path.join(HERE, "..", "data"))
    a = ap.parse_args()
    dd = os.path.abspath(a.data_dir)
    old = json.load(open(os.path.join(dd, "ecovacs_faq.json"), encoding="utf-8"))
    trad = {}
    tp = os.path.join(dd, "_traductions.json")
    if os.path.exists(tp):
        trad = json.load(open(tp, encoding="utf-8"))

    if a.snapshot:
        snap = json.load(open(a.snapshot, encoding="utf-8"))
    else:
        try:
            snap = collecter()
        except (urllib.error.URLError, OSError) as e:
            sys.exit(f"Site injoignable depuis ce PC ({e}).\nUtilisez le collecteur navigateur (voir LISEZMOI_synchro.md).")

    erreurs = [p["alias"] for p in snap["produits"] if "erreur" in p]
    ok = [p for p in snap["produits"] if "erreur" not in p]
    if erreurs:
        print("Pages en erreur :", ", ".join(erreurs))
    if len(ok) < 0.9 * len(old["produits"]):
        sys.exit(f"Instantané incomplet ({len(ok)} produits pour {len(old['produits'])} connus) : rien n'est modifié.")

    # --- nouvel état -------------------------------------------------------
    oldprod = {p["alias"]: p for p in old["produits"]}
    newfaq, newprods = {}, []
    for p in ok:
        ids = []
        for fid, h, t in p["faq"]:
            fid = str(fid)
            if fid not in ids:
                ids.append(fid)
            if fid not in newfaq:
                newfaq[fid] = {"t": trad.get(fid, t), "h": h, "o": t}
        newprods.append(dict(alias=p["alias"], id=p["id"], famille=p["famille"], nom=p["nom"], faq=[int(i) for i in ids]))
    # produits en erreur : on garde l'ancien contenu (pas de suppression à tort)
    for al in erreurs:
        if al in oldprod:
            newprods.append(oldprod[al])
            for i in oldprod[al]["faq"]:
                newfaq.setdefault(str(i), old["faq"].get(str(i), {"t": "?", "h": ""}))
    # --- vidéos (identifiées par l'id YouTube) -----------------------------
    tvp = os.path.join(dd, "_traductions_videos.json")
    trad_v = json.load(open(tvp, encoding="utf-8")) if os.path.exists(tvp) else {}
    oldv = old.get("videos", [])
    oldy = [v["y"] for v in oldv]
    vtitle = {v["y"]: v["t"] for v in oldv}
    pvy, present, vnew = {}, [], {}
    for p in ok:
        ys = []
        for y, t in p.get("vid", []):
            if y not in ys:
                ys.append(y)
            if y not in present:
                present.append(y)
            if y not in vtitle and y not in vnew:
                vnew[y] = (trad_v.get(y) or t, y in trad_v)
        pvy[p["alias"]] = ys
    for al in erreurs:
        if al in oldprod:
            ys = [oldy[i] for i in oldprod[al].get("vid", [])]
            pvy[al] = ys
            present += [y for y in ys if y not in present]
    pset = set(present)
    vorder = [y for y in oldy if y in pset] + [y for y in present if y not in set(oldy)]
    for y, (t, _) in vnew.items():
        vtitle[y] = t
    for y in vorder:  # une traduction ajoutée dans _traductions_videos.json prime toujours
        if y in trad_v:
            vtitle[y] = trad_v[y]
    vidx = {y: i for i, y in enumerate(vorder)}
    videos = [{"y": y, "t": vtitle[y]} for y in vorder]
    for p in newprods:
        p["vid"] = [vidx[y] for y in pvy.get(p["alias"], [])]
    # ordre : ancien ordre d'abord, puis nouveaux produits
    ordre = {p["alias"]: i for i, p in enumerate(old["produits"])}
    newprods.sort(key=lambda p: ordre.get(p["alias"], 10 ** 6))

    # --- différences -------------------------------------------------------
    today = str(datetime.date.today())
    nomp = {p["alias"]: p["nom"] for p in newprods}
    models_of = {}
    for p in newprods:
        for i in p["faq"]:
            models_of.setdefault(str(i), []).append(p["nom"])
    fam_of = {}
    for p in newprods:
        for i in p["faq"]:
            fam_of.setdefault(str(i), p["famille"])
    rows = []
    for fid, f in newfaq.items():
        o = old["faq"].get(fid)
        mod = " | ".join(models_of.get(fid, [])[:6])
        if o is None:
            rows.append((today, "NOUVELLE", fid, fam_of.get(fid, ""), f["t"], mod, ""))
        elif o["h"] != f["h"] and not a.baseline:
            rows.append((today, "MODIFIEE", fid, fam_of.get(fid, ""), f["t"], mod, "réponse modifiée"))
    for fid, o in old["faq"].items():
        if fid not in newfaq:
            rows.append((today, "SUPPRIMEE", fid, "", o["t"], "", ""))
    for al, p in {p["alias"]: p for p in newprods}.items():
        if al not in oldprod:
            rows.append((today, "PRODUIT_NOUVEAU", "", p["famille"], p["nom"], "", f"{len(p['faq'])} FAQ"))
    for al, p in oldprod.items():
        if al not in {x["alias"] for x in newprods}:
            rows.append((today, "PRODUIT_RETIRE", "", p["famille"], p["nom"], "", ""))
    for fid, f in newfaq.items():
        t = f["t"]
        if titre_etranger(t):
            rows.append((today, "TITRE_A_TRADUIRE", fid, fam_of.get(fid, ""), t, "", "ajouter dans _traductions.json"))

    mods_v = {}
    for p in newprods:
        for i in p["vid"]:
            mods_v.setdefault(videos[i]["y"], []).append(p["nom"])
    for y, (t, traduit) in vnew.items():
        rows.append((today, "VIDEO_NOUVELLE", y, "", t, " | ".join(mods_v.get(y, [])[:6]), "https://youtu.be/" + y))
        if not traduit:
            rows.append((today, "TITRE_VIDEO_A_TRADUIRE", y, "", t, "", "ajouter {id YouTube: titre FR} dans _traductions_videos.json"))
    for y in oldy:
        if y not in pset:
            rows.append((today, "VIDEO_SUPPRIMEE", y, "", vtitle.get(y, ""), "", ""))
    cnt = {}
    for r in rows:
        cnt[r[1]] = cnt.get(r[1], 0) + 1
    print(f"Produits : {len(newprods)} | FAQ : {len(newfaq)} | liens : {sum(len(p['faq']) for p in newprods)} | vidéos : {len(videos)}")
    print("Écarts :", cnt if cnt else "aucun")
    for r in rows[:25]:
        print("  ", r[1], r[2], r[4][:90])
    if len(rows) > 25:
        print(f"   ... (+{len(rows) - 25}, voir le journal)")
    if a.simuler:
        print("(simulation : rien écrit)")
        return

    # --- écriture ----------------------------------------------------------
    bak = os.path.join(dd, "..", "..", "00_Sauvegardes_BAK", "Ecovacs_data_" + today.replace("-", ""))
    os.makedirs(bak, exist_ok=True)
    for fn in ("ecovacs_faq.json", "ecovacs_faq.js", "journal_synchro.csv", "_traductions_videos.json"):
        if os.path.exists(os.path.join(dd, fn)):
            shutil.copy2(os.path.join(dd, fn), bak)
    out = {"source": old["source"], "maj": today, "algo_hash": old["algo_hash"], "produits": newprods,
           "faq": {k: {"t": v["t"], "h": v["h"]} for k, v in newfaq.items()}, "videos": videos}
    s = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
    open(os.path.join(dd, "ecovacs_faq.json"), "w", encoding="utf-8").write(s)
    open(os.path.join(dd, "ecovacs_faq.js"), "w", encoding="utf-8").write("window.ECOVACS_DATA=" + s + ";\n")
    jp = os.path.join(dd, "journal_synchro.csv")
    new = not os.path.exists(jp)
    with open(jp, "a", encoding="utf-8-sig", newline="") as fh:
        w = csv.writer(fh, delimiter=";")
        if new:
            w.writerow(["date", "type", "id", "famille", "titre", "modeles", "detail"])
        for r in rows:
            w.writerow(r)
        if not rows:
            w.writerow([today, "RAS", "", "", "Synchronisation sans écart", "", f"{len(newfaq)} FAQ"])
    print("OK — données et journal mis à jour. Sauvegarde :", os.path.relpath(bak))


if __name__ == "__main__":
    main()
