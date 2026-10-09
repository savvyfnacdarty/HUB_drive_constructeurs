# -*- coding: utf-8 -*-
"""Construit Tineco/data/tineco_faq.js (FAQ panne : produit -> symptôme -> causes) à partir du chapitre « Repair Guide » des manuels
convertis (Tineco/manuels/*.html) et des traductions FR (outils/faq_sources/tr*.txt, numérotées comme uniq.json).
Pour régénérer après mise à jour des manuels : relancer docx_vers_html.py, puis extraire les lignes (voir faq_sources/), compléter les
traductions manquantes, puis lancer ce script. Usage : python3 build_faq.py <dossier hub>"""
import re,json,sys,os,glob,html
hub=sys.argv[1]; src=os.path.join(hub,'Tineco','outils','faq_sources')
rows=json.load(open(os.path.join(src,'faq_rows.json'),encoding='utf-8'))
U=json.load(open(os.path.join(src,'uniq.json'),encoding='utf-8'))
fr={}
for f in sorted(glob.glob(os.path.join(src,'tr*.txt'))):
    for l in open(f,encoding='utf-8'):
        l=l.rstrip('\n')
        if '|' in l: i,t=l.split('|',1); fr[int(i)]=t.strip()
key=lambda s:re.sub(r'\s+',' ',s).strip().lower().rstrip('.;， ')
k2i={key(s):i for i,s in U}; en={i:s for i,s in U}
HEAD={'failure cause','failure phenomenon','failure system','failure mode','repair solution','spare parts','spare parts name','[img]'}
hubjs=open(os.path.join(hub,'Tineco','data','tineco_manuels_hub.js'),encoding='utf-8').read()
H=json.loads(re.search(r'MANUAL_HUB = (\{.*\});',hubjs,re.S).group(1))
slug2name={v.split('/')[-1]:k for k,v in H.items()}
T=[];tid={}
def t(s):
    s=s.strip()
    if not s or key(s) in HEAD: return -1
    i=k2i[key(s)]
    if i not in tid: tid[i]=len(T); T.append([en[i],fr.get(i) or en[i]])
    return tid[i]
manuals=[]; miss=set()
for f,rs in sorted(rows.items()):
    name=slug2name.get(f)
    if not name: print('manuel inconnu',f); continue
    out=[]
    for r in rs:
        if key(r[2]) in HEAD or key(r[1]) in HEAD or key(r[0]) in HEAD: continue
        a=[t(x) for x in r]
        if a[1]<0 or (a[2]<0 and a[3]<0): continue
        out.append(a)
    page=open(os.path.join(hub,'Tineco','manuels',f),encoding='utf-8').read()
    anc=re.findall(r'<h1 id="([^"]*(?:repair-guide|repair-sop)[^"]*)"',page,re.I)
    manuals.append({'n':name,'p':H[name],'a':anc[0] if anc else '','r':out})
for i in tid:
    if i not in fr: miss.add(i)
print(len(manuals),'manuels;',sum(len(m['r']) for m in manuals),'lignes;',len(T),'libellés;',len(miss),'sans traduction FR')
with open(os.path.join(hub,'Tineco','data','tineco_faq.js'),'w',encoding='utf-8') as fo:
    fo.write('/* FAQ panne Tineco : chapitre « Repair Guide » des manuels (généré par Tineco/outils/build_faq.py — ne pas éditer à la main).\n   FAQ_T = libellés [anglais, français] ; FAQ = manuels {n nom, p page hub, a ancre, r lignes [système, symptôme, cause, solution, pièce] (indices dans FAQ_T, -1 = vide)}. */\n')
    fo.write('const FAQ_T = '+json.dumps(T,ensure_ascii=False,separators=(',',':'))+';\n')
    fo.write('const FAQ = '+json.dumps(manuals,ensure_ascii=False,separators=(',',':'))+';\n')
