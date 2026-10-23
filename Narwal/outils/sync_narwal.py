#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Synchronisation mensuelle des FAQ et vidéos Narwal
Sources :
  - https://support.narwal.com  (centre d'aide Zendesk, en anglais : titres traduits ici en français)
  - https://fr.narwal.com       (FAQ générale, guides produits et vidéos tutoriels, en français)

Deux façons de l'utiliser :
  1) Direct   : python sync_narwal.py
     (le PC lit lui-même l'API du centre d'aide et les pages fr.narwal.com)
  2) Instantané navigateur (si le réseau de l'entreprise bloque le script) :
     - ouvrir https://support.narwal.com/hc/en-us dans Chrome/Edge
     - F12 > Console > coller le contenu de collecteur_navigateur.js > Entrée
     - un fichier snapshot_narwal_AAAA-MM-JJ.json est téléchargé
     - python sync_narwal.py --snapshot "C:\\chemin\\snapshot_narwal_AAAA-MM-JJ.json"

Options :
  --simuler     n'écrit rien, affiche seulement les différences
  --baseline    met à jour les empreintes sans les consigner comme « modifiées »
  --init        première construction des données (aucun fichier data/narwal_faq.json existant)
  --data-dir X  dossier des données (test)

Ce que fait le script : compare avec data/narwal_faq.json, ajoute les écarts
(NOUVELLE / MODIFIEE / SUPPRIMEE / PRODUIT_NOUVEAU / PRODUIT_RETIRE / TITRE_A_TRADUIRE /
VIDEO_NOUVELLE / VIDEO_SUPPRIMEE / TITRE_VIDEO_A_TRADUIRE) à data/journal_synchro.csv,
régénère data/narwal_faq.json et .js, et sauvegarde l'ancienne version dans 00_Sauvegardes_BAK/.
Les titres anglais se traduisent dans data/_traductions.json ({"id": "titre français"})
et data/_traductions_videos.json ({"id YouTube": "titre français"}).
"""
import argparse, csv, datetime, hashlib, json, os, re, shutil, sys, unicodedata, urllib.request, urllib.error
from html.parser import HTMLParser

ZD = "https://support.narwal.com"
FR = "https://fr.narwal.com"
UA = {"User-Agent": "Mozilla/5.0 (HUB-Drive-Constructeurs sync)"}
HERE = os.path.dirname(os.path.abspath(__file__))
FAM_R, FAM_S, FAM_A, FAM_C, FAM_M = "Robots Freo / Flow", "Série S (Vacuum Mop)", "Application", "Commande & SAV", "Manuels"

MOTS_ETR = re.compile(r"\b(perch[eé]|può|della|delle|nello|che|è|nicht|warum|wie|und|ist|wird|wenn|kann|die|der|das|anleitung|karte|roboter|installieren|entfernen|reinigen|reinigung|why|how|what|does|can|the|is|are|with|when|my|to|of|guide|install|remove|clean)\b", re.I)
MOTS_FR = re.compile(r"\b(pourquoi|comment|quel|quelle|quels|que|qu|faire|peut|peut-il|est|et|sur|avec|pour|dans|ne|pas|les|des|du|au|aux|un|une|le|la|mon|ma|mes|il|elle|ou|lors|guide|de|d)\b", re.I)


def titre_etranger(t):
    return len(MOTS_ETR.findall(t)) > len(MOTS_FR.findall(t))


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read().decode("utf-8", "replace")


def sha1(s):
    return hashlib.sha1((s or "").encode("utf-8")).hexdigest()


def h6(s):
    return sha1(s)[:6]


def h8(s):
    return sha1(s)[:8]


def norm(s):
    return re.sub(r"\s+", " ", s or "").strip()


def slug(s):
    s = unicodedata.normalize("NFD", (s or "").lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


YT = re.compile(r"(?:youtu\.be/|embed/|v=|shorts/)([\w-]{11})")


def ytid(u):
    m = YT.search(u or "")
    return m.group(1) if m else None


# ---------------------------------------------------------------- mini DOM (pages fr.narwal.com)
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}


class Node:
    def __init__(self, tag, attrs, parent):
        self.tag, self.attrs, self.parent, self.kids = tag, dict(attrs), parent, []

    def classes(self):
        return (self.attrs.get("class") or "").split()


class Tree(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("#root", [], None)
        self.cur = self.root

    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs, self.cur)
        self.cur.kids.append(n)
        if tag not in VOID:
            self.cur = n

    def handle_startendtag(self, tag, attrs):
        self.cur.kids.append(Node(tag, attrs, self.cur))

    def handle_endtag(self, tag):
        n = self.cur
        while n is not None and n.tag != tag:
            n = n.parent
        if n is not None and n.parent is not None:
            self.cur = n.parent

    def handle_data(self, data):
        self.cur.kids.append(data)


def parse(html):
    t = Tree()
    t.feed(html)
    return t.root


def walk(n):
    for k in n.kids:
        if isinstance(k, Node):
            yield k
            yield from walk(k)


def text(n, skip=()):
    out = []

    def rec(x):
        for k in x.kids:
            if isinstance(k, Node):
                if k.tag not in skip:
                    rec(k)
            else:
                out.append(k)

    rec(n)
    return "".join(out)


def first(n, cls):
    return next((x for x in walk(n) if cls in x.classes()), None)


def closest(n, cls):
    p = n.parent
    while p is not None:
        if cls in p.classes():
            return p
        p = p.parent
    return None


# ---------------------------------------------------------------- collecte directe (même logique que collecteur_navigateur.js)
def collecter():
    prods = {}

    def prod(alias, nom, famille, **extra):
        if alias not in prods:
            prods[alias] = dict(alias=alias, famille=famille, nom=nom, faq=[], vid=[], **extra)
        return prods[alias]

    def pages(url):
        out = []
        while url:
            r = json.loads(get(url))
            k = next(x for x in r if isinstance(r[x], list))
            out += r[k]
            url = r.get("next_page")
        return out

    cats = pages(ZD + "/api/v2/help_center/en-us/categories.json?per_page=100")
    secs = pages(ZD + "/api/v2/help_center/en-us/sections.json?per_page=100")
    arts = pages(ZD + "/api/v2/help_center/en-us/articles.json?per_page=100")
    if len(arts) < 100:
        sys.exit(f"Centre d'aide : trop peu d'articles ({len(arts)}) : la structure a peut-être changé. Utilisez le collecteur navigateur.")
    catname = {c["id"]: c["name"].strip() for c in cats}
    sec = {s["id"]: (s["name"].strip(), catname.get(s["category_id"])) for s in secs}

    def modele(name):
        base = re.sub(r"\s*\|\s*Vacuum Mop\s*$", "", name)
        base = re.sub(r"^Narwal\s+", "", base)
        base = re.sub(r"\s+Series$", "", base).strip()
        return prod("z-" + slug(base), "Narwal " + base, FAM_S if re.match(r"^S\d", base) else FAM_R)

    GEN = {"General": "Général", "Troubleshooting": "Dépannage", "Accessories and Maintenance": "Accessoires et entretien"}
    CMD = {"Payments": "Paiement", "Return & Refund": "Retours et remboursements", "Shipping & Delivery": "Livraison", "Warranty": "Garantie", "Others": "Autres"}
    MAN = {"Narwal Freo App": "Application", "Robot Vacuums": "Robots Freo / Flow", "Vacuum Mop": "Série S (Vacuum Mop)", "Important Safety Instructions": "Consignes de sécurité"}

    def app():
        return prod("z-app", "Application Narwal Freo", FAM_A)

    def classer(cat, s):
        if cat == "Order & Service":
            return prod("z-cmd-" + slug(s), "Commande & SAV – " + CMD.get(s, s), FAM_C), "faq"
        if cat == "Manuals and Download":
            return prod("z-man-" + slug(s), "Manuels – " + MAN.get(s, s), FAM_M), "faq"
        if cat == "Narwal Freo App":
            return app(), ("vid" if s == "Instruction Video" else "faq")
        if cat == "Tutorials Videos":
            return (app() if s == "Narwal Freo App" else modele(s)), "vid"
        if cat == "Robot Vacuums":
            return (prod("z-rob-" + slug(s), "Robots – " + GEN[s], FAM_R) if s in GEN else modele(s)), "faq"
        if cat == "Vacuum Mop":
            return (prod("z-ser-" + slug(s), "Série S – " + GEN[s], FAM_S) if s in GEN else modele(s)), "faq"
        return prod("z-autre-" + slug(f"{cat}-{s}"), f"{cat} – {s}", cat or "Autre"), "faq"

    for a in arts:
        if a.get("draft") or a["section_id"] not in sec:
            continue
        s, cat = sec[a["section_id"]]
        p, typ = classer(cat, s)
        if typ == "faq":
            fid = "z%d" % a["id"]
            if not any(f[0] == fid for f in p["faq"]):
                p["faq"].append([fid, h6(a.get("body")), norm(a["title"])])
        else:
            ys = list(dict.fromkeys(YT.findall(a.get("body") or "")))
            for k, y in enumerate(ys):
                if not any(v[0] == y for v in p["vid"]):
                    p["vid"].append([y, norm(a["title"]) + (f" ({k + 1})" if k else ""), "en"])

    # ---- fr.narwal.com
    used = {}

    def fr_fid(q, h, sg):
        i = "f" + h8(q)
        if i in used and used[i] != h:
            i = "f" + h8(sg + "|" + q)
        used[i] = h
        return i

    def fr_acc(root, p, sg):
        for acc in [x for x in walk(root) if "accordion" in x.classes()]:
            t, r = first(acc, "title"), first(acc, "description")
            if t is None or r is None:
                continue
            q, h = norm(text(t)), h6(norm(text(r)))
            if not q or any(f[2] == q for f in p["faq"]):
                continue
            p["faq"].append([fr_fid(q, h, sg), h, q])

    def doc(url):
        return parse(get(url))

    def nav(root, rx, generic):
        out = {}
        for a in [x for x in walk(root) if x.tag == "a"]:
            href, t = a.attrs.get("href") or "", norm(text(a))
            if re.search(rx, href) and t and not re.match(generic, t, re.I):
                out[href.replace(FR, "").split("?")[0]] = t
        return list(out.items())

    pg = prod("f-faq-generale", "Commande & SAV – FAQ fr.narwal.com", FAM_C, u=FR + "/pages/faq-new")
    fr_acc(doc(FR + "/pages/faq-new"), pg, "faq-new")
    d0 = doc(FR + "/pages/product-help-freo-z10")
    guides = nav(d0, r"product-help-", r"^Guides? produits?$")
    if len(guides) < 3:
        sys.exit("Guides produits FR : navigation introuvable (structure modifiée ?). Utilisez le collecteur navigateur.")
    for href, t in guides:
        base = re.sub(r"^Narwal\s+", "", t)
        p = prod("z-" + slug(base), "Narwal " + base, FAM_S if re.match(r"^S\d", base) else FAM_R)
        p["u"] = FR + href
        fr_acc(d0 if href.endswith("freo-z10") else doc(FR + href), p, href.split("/")[-1])
    v0 = doc(FR + "/pages/tutorial-videos-narwal-freo-x-ultra")
    vids = nav(v0, r"tutorial-videos", r"^Tutoriels? vid[ée]os?$")
    if len(vids) < 4:
        sys.exit("Vidéos FR : navigation introuvable (structure modifiée ?). Utilisez le collecteur navigateur.")
    for href, t in vids:
        base = re.sub(r"^Narwal\s+", "", t)
        p = prod("z-" + slug(base), "Narwal " + base, FAM_S if re.match(r"^S\d", base) else FAM_R)
        d = v0 if href.endswith("tutorial-videos-narwal-freo-x-ultra") else doc(FR + href)
        for f in [x for x in walk(d) if x.tag == "iframe" and "youtube" in (x.attrs.get("src") or "")]:
            y = ytid(f.attrs.get("src"))
            if not y or any(v[0] == y for v in p["vid"]):
                continue
            ti = norm(f.attrs.get("title"))
            if not ti or ti.lower() == "youtube video player":
                c = closest(f, "col-12")
                ti = norm(text(c, skip=("style", "script", "component", "svg", "iframe", "img", "noscript"))) if c is not None else ""
                ti = ti or y
            p["vid"].append([y, ti, "fr"])
    return {"date": str(datetime.date.today()), "produits": list(prods.values())}


# ---------------------------------------------------------------- comparaison / écriture
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--snapshot")
    ap.add_argument("--simuler", action="store_true")
    ap.add_argument("--baseline", action="store_true")
    ap.add_argument("--init", action="store_true")
    ap.add_argument("--data-dir", default=os.path.join(HERE, "..", "data"))
    a = ap.parse_args()
    dd = os.path.abspath(a.data_dir)
    dpath = os.path.join(dd, "narwal_faq.json")
    if os.path.exists(dpath) and not a.init:
        old = json.load(open(dpath, encoding="utf-8"))
    elif a.init:
        old = {"source": "https://support.narwal.com + https://fr.narwal.com", "maj": "", "algo_hash": "sha1(reponse brute UTF-8)[:6]", "produits": [], "faq": {}, "videos": []}
    else:
        sys.exit("Aucune donnée existante (data/narwal_faq.json). Première construction : ajouter --init.")

    def lire(fn):
        p = os.path.join(dd, fn)
        return json.load(open(p, encoding="utf-8")) if os.path.exists(p) else {}

    trad, trad_v = lire("_traductions.json"), lire("_traductions_videos.json")

    if a.snapshot:
        snap = json.load(open(a.snapshot, encoding="utf-8"))
    else:
        try:
            snap = collecter()
        except (urllib.error.URLError, OSError) as e:
            sys.exit(f"Site injoignable depuis ce PC ({e}).\nUtilisez le collecteur navigateur (voir LISEZMOI_synchro.md).")
    ok = snap["produits"]
    if old["produits"] and len(ok) < 0.9 * len(old["produits"]):
        sys.exit(f"Instantané incomplet ({len(ok)} produits pour {len(old['produits'])} connus) : rien n'est modifié.")

    # --- FAQ ------------------------------------------------------------
    oldprod = {p["alias"]: p for p in old["produits"]}
    newfaq, newprods = {}, []
    for p in ok:
        ids = []
        for fid, h, t in p["faq"]:
            if fid not in ids:
                ids.append(fid)
            if fid not in newfaq:
                newfaq[fid] = {"t": trad.get(fid, t), "h": h, "o": t}
        d = dict(alias=p["alias"], famille=p["famille"], nom=p["nom"], faq=ids)
        if p.get("u"):
            d["u"] = p["u"]
        newprods.append(d)
    # --- vidéos (identifiées par l'id YouTube) ----------------------------
    oldv = old.get("videos", [])
    oldy = [v["y"] for v in oldv]
    vtitle = {v["y"]: v["t"] for v in oldv}
    pvy, present, vnew = {}, [], {}
    for p in ok:
        ys = []
        for v in p.get("vid", []):
            y, t = v[0], v[1]
            src = v[2] if len(v) > 2 else "en"
            if y not in ys:
                ys.append(y)
            if y not in present:
                present.append(y)
            if y not in vtitle and y not in vnew:
                vnew[y] = (trad_v.get(y) or t, y in trad_v, src, t)
        pvy[p["alias"]] = ys
    pset = set(present)
    vorder = [y for y in oldy if y in pset] + [y for y in present if y not in set(oldy)]
    for y, (t, _, _, _) in vnew.items():
        vtitle[y] = t
    for y in vorder:  # une traduction ajoutée dans _traductions_videos.json prime toujours
        if y in trad_v:
            vtitle[y] = trad_v[y]
    vidx = {y: i for i, y in enumerate(vorder)}
    videos = [{"y": y, "t": vtitle[y]} for y in vorder]
    for p in newprods:
        p["vid"] = [vidx[y] for y in pvy.get(p["alias"], [])]
    ordre = {p["alias"]: i for i, p in enumerate(old["produits"])}
    newprods.sort(key=lambda p: ordre.get(p["alias"], 10 ** 6))

    # --- différences ------------------------------------------------------
    today = str(datetime.date.today())
    models_of, fam_of = {}, {}
    for p in newprods:
        for i in p["faq"]:
            models_of.setdefault(i, []).append(p["nom"])
            fam_of.setdefault(i, p["famille"])
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
    for p in newprods:
        if p["alias"] not in oldprod:
            rows.append((today, "PRODUIT_NOUVEAU", "", p["famille"], p["nom"], "", f"{len(p['faq'])} FAQ"))
    nouv = {p["alias"] for p in newprods}
    for al, p in oldprod.items():
        if al not in nouv:
            rows.append((today, "PRODUIT_RETIRE", "", p["famille"], p["nom"], "", ""))
    for fid, f in newfaq.items():
        if fid not in trad and (fid.startswith("z") or titre_etranger(f["o"])):
            rows.append((today, "TITRE_A_TRADUIRE", fid, fam_of.get(fid, ""), f["o"], "", "ajouter {id: titre FR} dans _traductions.json"))
    mods_v = {}
    for p in newprods:
        for i in p["vid"]:
            mods_v.setdefault(videos[i]["y"], []).append(p["nom"])
    for y, (t, traduit, src, brut) in vnew.items():
        rows.append((today, "VIDEO_NOUVELLE", y, "", t, " | ".join(mods_v.get(y, [])[:6]), "https://youtu.be/" + y))
        if not traduit and (src == "en" or titre_etranger(brut)):
            rows.append((today, "TITRE_VIDEO_A_TRADUIRE", y, "", brut, "", "ajouter {id YouTube: titre FR} dans _traductions_videos.json"))
    for y in oldy:
        if y not in pset:
            rows.append((today, "VIDEO_SUPPRIMEE", y, "", vtitle.get(y, ""), "", ""))
    if a.init:
        rows = [(today, "INITIAL", "", "", "Import initial", "", f"{len(newprods)} produits / {len(newfaq)} FAQ / {sum(len(p['faq']) for p in newprods)} liens / {len(videos)} vidéos")]
        rows += [r for r in [(today, "TITRE_A_TRADUIRE", fid, fam_of.get(fid, ""), f["o"], "", "ajouter {id: titre FR} dans _traductions.json")
                             for fid, f in newfaq.items() if fid not in trad and (fid.startswith("z") or titre_etranger(f["o"]))]]
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

    # --- écriture ---------------------------------------------------------
    os.makedirs(dd, exist_ok=True)
    bak = os.path.join(dd, "..", "..", "00_Sauvegardes_BAK", "Narwal_data_" + today.replace("-", ""))
    saved = False
    for fn in ("narwal_faq.json", "narwal_faq.js", "journal_synchro.csv", "_traductions.json", "_traductions_videos.json"):
        if os.path.exists(os.path.join(dd, fn)):
            os.makedirs(bak, exist_ok=True)
            shutil.copy2(os.path.join(dd, fn), bak)
            saved = True
    out = {"source": old["source"], "maj": today, "algo_hash": old["algo_hash"], "produits": newprods,
           "faq": {k: {"t": v["t"], "h": v["h"]} for k, v in newfaq.items()}, "videos": videos}
    s = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
    open(dpath, "w", encoding="utf-8").write(s)
    open(os.path.join(dd, "narwal_faq.js"), "w", encoding="utf-8").write("window.NARWAL_DATA=" + s + ";\n")
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
    print("OK — données et journal mis à jour." + (" Sauvegarde : " + os.path.relpath(bak) if saved else ""))


if __name__ == "__main__":
    main()
