# -*- coding: utf-8 -*-
"""Convertit les manuels de réparation Tineco (.docx) en pages HTML lisibles dans le hub (Tineco/manuels/).
Usage : python3 docx_vers_html.py <dossier des .docx> <dossier du hub>
 - images réduites (1000 px max) et converties en WebP ; EMF/WMF convertis en PNG via LibreOffice
 - génère Tineco/manuels/<slug>.html + Tineco/manuels/<slug>/img/ + Tineco/data/tineco_manuels_hub.js (nom du manuel -> page)
Prérequis : pandoc, Pillow, (soffice pour les images EMF)."""
import sys,os,re,glob,json,subprocess,shutil,unicodedata,html,tempfile
from PIL import Image
src,hub=sys.argv[1],sys.argv[2]
out=os.path.join(hub,'Tineco','manuels'); os.makedirs(out,exist_ok=True)
MAXW=1000
def slug(n):
    s=unicodedata.normalize('NFKD',n).encode('ascii','ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+','-',s).strip('-')[:70]
TPL=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'manuel_template.html'),encoding='utf-8').read()
index={}; tot=0
ONLY=os.environ.get('SEULEMENT')
for f in sorted(glob.glob(os.path.join(src,'*.docx'))):
    name=os.path.basename(f)[:-5]; sl=slug(name)
    if ONLY and ONLY not in name: continue
    tmp=tempfile.mkdtemp()
    h=subprocess.run(['pandoc',f,'-t','html5','--wrap=none','--extract-media='+tmp],capture_output=True,text=True,check=True).stdout
    imgdir=os.path.join(out,sl,'img'); shutil.rmtree(os.path.join(out,sl),ignore_errors=True); os.makedirs(imgdir,exist_ok=True)
    cache={}
    def conv(m):
        global tot
        p=m.group(1); full=os.path.join(tmp,p)
        if p in cache: return 'src="%s"'%cache[p]
        try:
            ext=os.path.splitext(p)[1].lower()
            if ext in('.emf','.wmf'):
                d=tempfile.mkdtemp(); subprocess.run(['soffice','--headless','--convert-to','png','--outdir',d,full],capture_output=True,timeout=120)
                full=os.path.join(d,os.path.splitext(os.path.basename(full))[0]+'.png')
            im=Image.open(full)
            if getattr(im,'is_animated',False): im.seek(0)
            if im.width>MAXW: im=im.resize((MAXW,round(im.height*MAXW/im.width)),Image.LANCZOS)
            im=im.convert('RGBA' if im.mode in('RGBA','LA','P') and 'transparency' in im.info or im.mode in('RGBA','LA') else 'RGB')
            fn='i%03d.webp'%(len(cache)+1); im.save(os.path.join(imgdir,fn),'WEBP',quality=74,method=4)
            cache[p]='%s/img/%s'%(sl,fn)
        except Exception as e:
            print('  image ignorée',name,p,e); cache[p]=''
        return 'src="%s"'%cache[p] if cache[p] else 'src="" alt="(image indisponible)"'
    h=re.sub(r'src="([^"]+)"',conv,h)
    h=re.sub(r'<img ',r'<img loading="lazy" ',h)
    # table des matières depuis les titres h1/h2 (le sommaire Word recopié par pandoc est retiré)
    toc=[]
    def hd(m):
        lvl,i,t=m.group(1),m.group(2),m.group(3); txt=html.unescape(re.sub(r'<[^>]+>','',t)).strip()
        if txt: toc.append((lvl,i,txt))
        return m.group(0)
    re.sub(r'<h([12]) id="([^"]+)"[^>]*>(.*?)</h\1>',hd,h,flags=re.S)
    tocs=''.join('<a class="l%s" href="#%s">%s</a>'%(l,i,html.escape(t)) for l,i,t in toc)
    page=TPL.replace('{{TITLE}}',html.escape(name)).replace('{{TOC}}',tocs).replace('{{BODY}}',h).replace('{{DOCX}}',html.escape(os.path.basename(f)))
    open(os.path.join(out,sl+'.html'),'w',encoding='utf-8').write(page)
    sz=sum(os.path.getsize(os.path.join(imgdir,x)) for x in os.listdir(imgdir)); tot+=sz
    index[name]='Tineco/manuels/%s.html'%sl
    print('%-90s %3d images %6.1f Mo'%(name,len(cache),sz/1e6)); shutil.rmtree(tmp,ignore_errors=True)
prev=os.path.join(hub,'Tineco','data','tineco_manuels_hub.js')
if os.path.exists(prev):
    old=json.loads(re.search(r'MANUAL_HUB = (\{.*\});',open(prev,encoding='utf-8').read(),re.S).group(1)); old.update(index); index=old
open(prev,'w',encoding='utf-8').write(
 '/* Manuels de réparation convertis en HTML dans le hub (généré par Tineco/outils/docx_vers_html.py). Nom du manuel -> page. */\nconst MANUAL_HUB = '+json.dumps(index,ensure_ascii=False,indent=1)+';\n')
print('Total images : %.1f Mo'%(tot/1e6))
