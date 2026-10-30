# Contrôle avant publication du HUB — lancé par publier.bat (ou seul, sans rien modifier) :
#   python _outils/controle_publication.py
# Code de sortie 1 s'il y a un problème BLOQUANT, 0 sinon. Les AVERTISSEMENTS n'empêchent pas de publier.
import collections, os, re, subprocess, sys, urllib.parse

# Pages volontairement sans auth-guard.js
SANS_GARDE = {
    "capture.html",            # page du téléphone : n'est pas connectée au hub
    "login.html",              # page de connexion
    "tineco_catalogue.html",   # simple redirection
    "tineco_recherche.html",   # simple redirection
}
MAX_GITHUB = 100 * 2**20    # au-delà, GitHub refuse le fichier
MAX_CONSEIL = 25 * 2**20    # au-delà, le fichier ne passerait plus sur Cloudflare Pages
SUPPRESSIONS_SUSPECTES = 20


def git(*args):
    return subprocess.check_output(["git", "-c", "core.quotepath=false", *args]).decode("utf-8")


def changements():
    """Fichiers modifiés ou nouveaux, et fichiers supprimés, par rapport au dernier commit."""
    modifies, supprimes = set(), set()
    champs = git("status", "--porcelain", "-z", "--untracked-files=all").split("\0")
    i = 0
    while i < len(champs):
        ligne = champs[i]
        i += 1
        if not ligne:
            continue
        etat, chemin = ligne[:2], ligne[3:]
        if "R" in etat:
            i += 1  # l'ancien nom suit dans la sortie -z
        (supprimes if "D" in etat else modifies).add(chemin)
    return modifies, supprimes


def cible(page, lien):
    return os.path.normpath(os.path.join(os.path.dirname(page), urllib.parse.unquote(lien))).replace(os.sep, "/")


def liens_de(page, texte):
    liens = re.findall(r'''(?:href|src)\s*=\s*["']([^"'#?]+)''', texte)
    if page == "index.html":  # les tuiles sont écrites en JavaScript
        liens += re.findall(r'"([^"\s]+\.(?:html|png|webp|jpg))"', texte)
    return [l.strip() for l in liens if not re.match(r"^[a-z]+:|^//|^/|^\$|^\{|.*\+|.*\$\{", l.strip(), re.I)]


def main():
    bloquants, avertissements = [], []
    fichiers = [f for f in git("ls-files", "-co", "--exclude-standard", "-z").split("\0") if f and os.path.isfile(f)]
    connus, en_minuscules = set(fichiers), {f.lower() for f in fichiers}
    modifies, supprimes = changements()

    for f in fichiers:
        nom = os.path.basename(f)
        if f.startswith("00_") or re.search(r"\.bak(\d|[-_.]|$)", nom) or nom.startswith("~$"):
            bloquants.append(f"Fichier interdit (sauvegarde ou dossier interne) : {f}")
        taille = os.path.getsize(f)
        if taille > MAX_GITHUB:
            bloquants.append(f"Fichier de plus de 100 Mo, refusé par GitHub : {f}")
        elif taille > MAX_CONSEIL:
            avertissements.append(f"Fichier volumineux ({taille // 2**20} Mo) : {f}")
        if f in modifies and re.search(r"tarif", nom, re.I):
            avertissements.append(f"Document de tarifs, visible sans connexion une fois publié : {f}")

    for page in (f for f in fichiers if f.lower().endswith(".html")):
        texte = open(page, encoding="utf-8", errors="replace").read()
        if page not in SANS_GARDE:
            gardes = re.findall(r'''src=["']([^"']*auth-guard\.js)''', texte)
            if not gardes:
                bloquants.append(f"Protection absente (auth-guard.js) : {page}")
            elif cible(page, gardes[0]) != "auth-guard.js":
                bloquants.append(f"Protection mal reliée ({gardes[0]}) : {page}")
        for lien in liens_de(page, texte):
            p = cible(page, lien)
            if p in connus or os.path.isdir(p):
                continue
            motif = "majuscules/minuscules différentes" if p.lower() in en_minuscules else "fichier absent"
            message = f"Lien cassé ({motif}) : {page} -> {lien}"
            # Un lien cassé bloque seulement si la page fait partie de ce qu'on publie
            (bloquants if page in modifies else avertissements).append(message)

    if len(supprimes) > SUPPRESSIONS_SUSPECTES:
        avertissements.append(f"{len(supprimes)} fichiers seront supprimés du site : vérifie que c'est voulu")

    afficher("BLOQUANT", bloquants)
    afficher("AVERTISSEMENT", avertissements)
    par_dossier = collections.Counter(f.split("/")[0] if "/" in f else "(racine)" for f in modifies | supprimes)
    print(f"Changements a publier : {len(modifies)} modifie(s) ou nouveau(x), {len(supprimes)} supprime(s)")
    for dossier, n in par_dossier.most_common():
        print(f"   {n:5}  {dossier}")
    if bloquants:
        print(f"\nCONTROLE ECHOUE : {len(bloquants)} probleme(s) bloquant(s). Rien n'est publie.")
        return 1
    print(f"\nCONTROLE OK ({len(fichiers)} fichiers, {len(avertissements)} avertissement(s)).")
    return 0


def afficher(niveau, messages, limite=25):
    for m in messages[:limite]:
        print(f"[{niveau}] {m}")
    if len(messages) > limite:
        print(f"[{niveau}] ... et {len(messages) - limite} autre(s)")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.exit(main())
