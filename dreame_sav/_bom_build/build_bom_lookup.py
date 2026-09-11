#!/usr/bin/env python3
"""Construit data/bom_lookup.json à partir de l'export « Page web (.zip) » du Google Sheet
« BOM Quick Lookup » (Dreame). Usage : python build_bom_lookup.py export.zip [sortie.json]
La même logique existe en JS dans bom_lookup.html (bouton « Mettre à jour »)."""
import sys, json, zipfile, io, re, datetime
from bs4 import BeautifulSoup, NavigableString, Tag

SHEET_ID = '15u69yfrqn3HqEwoemv8_UUgd-74wPeFdJhsD0YMc4dQ'

def cell_items(td):
    """Renvoie la liste des segments d'une cellule : {'t': texte, 'u': lien|None}."""
    items = []
    buf = []
    def flush():
        s = ' '.join(''.join(buf).split())
        if s: items.append({'t': s, 'u': None})
        buf.clear()
    def walk(node):
        for ch in node.children:
            if isinstance(ch, NavigableString):
                buf.append(str(ch))
            elif isinstance(ch, Tag):
                if ch.name == 'br':
                    flush()
                elif ch.name == 'a' and ch.get('href'):
                    flush()
                    t = ' '.join(ch.get_text(' ').split())
                    if t: items.append({'t': t, 'u': ch['href']})
                elif ch.name in ('svg', 'script', 'style'):
                    continue
                else:
                    walk(ch)
    walk(td)
    flush()
    return items

def grid_rows(table):
    """Aplati le tableau HTML en grille en tenant compte des rowspan/colspan."""
    grid = []
    spans = {}  # (r,c) -> td
    for r, tr in enumerate(table.find_all('tr')):
        row = []
        c = 0
        cells = [x for x in tr.find_all(['td', 'th'], recursive=False) if 'row-headers-background' not in (x.get('class') or [])]
        for td in cells:
            while (r, c) in spans:
                row.append(spans.pop((r, c))); c += 1
            rs = int(td.get('rowspan', 1) or 1); cs = int(td.get('colspan', 1) or 1)
            row.append(td)
            for dr in range(rs):
                for dc in range(cs):
                    if dr == 0 and dc == 0: continue
                    spans[(r + dr, c + dc)] = td
            c += cs
        while (r, c) in spans:
            row.append(spans.pop((r, c))); c += 1
        grid.append(row)
    return grid

def parse_sheet(name, html):
    s = BeautifulSoup(html, 'html.parser')
    table = s.find('table')
    rows = grid_rows(table)
    # ligne d'en-tête = première ligne contenant « Model »
    hdr_i = next(i for i, r in enumerate(rows) if any(td.get_text(strip=True).lower() == 'model' for td in r))
    headers = [td.get_text(' ', strip=True).lower() for td in rows[hdr_i]]
    def col(*names):
        for n in names:
            for i, h in enumerate(headers):
                if h.startswith(n): return i
        return None
    ci = {'no': col('no'), 'brand': col('brand'), 'cat': col('catagory', 'category'), 'model': col('model'),
          'project': col('project'), 'bom': col('bom'), 'repair': col('repair'), 'notif': col('technical')}
    known = {v for v in ci.values() if v is not None}
    fam = {'name': name, 'general': {'bom': [], 'repair': [], 'notif': [], 'extra': []}, 'rows': []}
    prev = None
    for r in rows[hdr_i + 1:]:
        def txt(k):
            i = ci.get(k)
            return ' '.join(r[i].get_text(' ').split()) if i is not None and i < len(r) else ''
        def lines(k):
            i = ci.get(k)
            return [x.strip() for x in r[i].get_text('\n').split('\n') if x.strip()] if i is not None and i < len(r) else []
        def items(k):
            i = ci.get(k)
            return cell_items(r[i]) if i is not None and i < len(r) else []
        model = txt('model'); project = lines('project')
        extra = []
        for i, td in enumerate(r):
            if i not in known:
                extra += [x for x in cell_items(td) if x['u']]
        if model.upper() == 'ALL' or (not model and project and project[0].upper() == 'ALL'):
            fam['general'] = {'bom': items('bom'), 'repair': items('repair'), 'notif': items('notif'), 'extra': extra}
            continue
        bom, repair, notif = items('bom'), items('repair'), items('notif')
        if not model and not project and not bom and not repair and not notif:
            continue
        row = {'no': txt('no'), 'brand': txt('brand'), 'cat': txt('cat'),
               'model': [x for x in lines('model')], 'project': project,
               'bom': bom, 'repair': repair, 'notif': notif, 'extra': extra}
        if not row['model'] and prev is not None:
            # ligne de continuation (modèle en cellule fusionnée non exportée) → hérite du modèle précédent
            row['model'] = list(prev['model']); row['cont'] = True
        fam['rows'].append(row); prev = row
    return fam

def main():
    src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else 'bom_lookup.json'
    z = zipfile.ZipFile(src)
    fams = []
    for n in z.namelist():
        if not n.lower().endswith('.html'): continue
        fams.append(parse_sheet(n[:-5], z.read(n).decode('utf-8')))
    data = {'source': 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit',
            'sheetId': SHEET_ID,
            'generated': datetime.date.today().isoformat(),
            'families': fams}
    json.dump(data, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for f in fams:
        print(f"{f['name']:35s} {len(f['rows']):4d} lignes  BOM:{sum(len(r['bom']) for r in f['rows'])}")

if __name__ == '__main__':
    main()
