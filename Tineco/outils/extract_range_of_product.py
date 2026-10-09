import zipfile,re,glob,json,sys,os
from xml.etree import ElementTree as ET
W='{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
def ctext(tc):
    return ' '.join(''.join(t.text or '' for t in p.iter(W+'t')).strip() for p in tc.iter(W+'p')).strip()
def tables(path):
    root=ET.fromstring(zipfile.ZipFile(path).read('word/document.xml'))
    for tbl in root.iter(W+'tbl'):
        yield [[ctext(tc) for tc in tr.findall(W+'tc')] for tr in tbl.findall(W+'tr')]
src=sys.argv[1]; out=sys.argv[2]
res=[];log=[]
for f in sorted(glob.glob(os.path.join(src,'*.docx'))):
    name=os.path.basename(f); n=0
    for rows in tables(f):
        hi=None
        for i,r in enumerate(rows[:3]):
            if any('Factory' in c for c in r): hi=i;break
        if hi is None: continue
        h=[c.strip() for c in rows[hi]]
        for r in rows[hi+1:]:
            d=dict(zip(h,r))
            if not any(r): continue
            res.append({'manuel':name,**{k:v for k,v in d.items() if k}}); n+=1
    log.append((name,n))
json.dump(res,open(out,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
for l in log: print(l)
print(len(res)); print(set(tuple(k for k in r) for r in res))

# ---- étape 2 : génère Tineco/data/tineco_range_of_product.js (argv[3] = tineco_manuels.js, argv[4] = sortie .js)
if len(sys.argv)>4:
    mj=open(sys.argv[3],encoding='utf-8').read()
    i=mj.index('const MANUAL_LINKS'); j=mj.index('};',i)
    links=dict(re.findall(r'^\s*"([^"]+)":\s*"(https[^"]+)"',mj[i:j],re.M))
    nz=lambda s:re.sub(r'[^a-z0-9]+','',s.lower())
    byn={nz(k):k for k in links}
    # rapprochements manuels (nom du .docx -> clé de MANUAL_LINKS) quand le nom a changé : signalés « approx »
    MAN={'Carpet One Series Repair Manual 240812':'Carpet One /iCarpet  Repair Manual',
         'Carpet one spot series repair manual':'Carpet one spot series &iCarpet Spot  repair manual',
         'iCarpet spot Repair manual':'Carpet one spot series &iCarpet Spot  repair manual',
         'Floor One Stretch S6 Series &i6 Stretch &S6 S7 Stretch Steam&S7MAX&S5MAX Repair Manual':'Floor One Stretch S6 Series &i6 Stretch Repair Manual'}
    mans=[];idx={};rows=[];seen=set()
    for x in res:
        m=x['manuel'][:-5]
        if m not in idx:
            if nz(m) in byn: u,ap=links[byn[nz(m)]],0
            elif m in MAN: u,ap=links[MAN[m]],1
            else: u,ap='',0
            idx[m]=len(mans); mans.append({'n':m,'u':u,'a':ap})
        k=(x.get('Product Name','').strip(),x.get('Factory Serial Model','').strip(),x.get('SKU','').strip(),idx[m])
        if k in seen: continue
        seen.add(k)
        note=(x.get('Note') or x.get('Remark') or '').strip()
        rows.append([k[0],k[1],k[2],note,k[3]])
    with open(sys.argv[4],'w',encoding='utf-8') as fo:
        fo.write('/* Tableaux « Range of Product » des manuels de réparation Tineco (généré par Tineco/outils/extract_range_of_product.py le 09/10/2026 — ne pas éditer à la main).\n   ROP_MANUALS = manuels (n = nom, u = lien SAVVY, a = 1 si rapprochement approximatif) ; ROP = [nom produit, Factory Serial Model, SKU, note, index du manuel]. */\n')
        fo.write('const ROP_MANUALS = '+json.dumps(mans,ensure_ascii=False)+';\n')
        fo.write('const ROP = '+json.dumps(rows,ensure_ascii=False,separators=(',',':')).replace('],[','],\n[')+';\n')
    print(len(rows),'lignes uniques;',len(mans),'manuels;',sum(1 for m in mans if m['u']),'avec lien')
