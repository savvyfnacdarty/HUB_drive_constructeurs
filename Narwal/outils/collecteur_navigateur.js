/* Collecteur Narwal — à coller dans la console (F12) sur https://support.narwal.com/hc/en-us
   Lit le centre d'aide Zendesk (support.narwal.com, via son API publique) ET les pages FR de fr.narwal.com
   (FAQ générale, guides produits, vidéos tutoriels).
   Télécharge snapshot_narwal_AAAA-MM-JJ.json (même format que sync_narwal.py --snapshot). */
(async () => {
  if (location.host !== 'support.narwal.com') { console.log('Ouvrez d\'abord https://support.narwal.com/hc/en-us puis recollez le script.'); return; }
  const FR = 'https://fr.narwal.com';
  const enc = new TextEncoder();
  const sha1 = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-1', enc.encode(s || '')))].map(b => b.toString(16).padStart(2, '0')).join('');
  const h6 = async s => (await sha1(s)).slice(0, 6);
  const h8 = async s => (await sha1(s)).slice(0, 8);
  const norm = s => (s || '').replace(/\s+/g, ' ').trim();
  const slug = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const ytid = u => { const m = (u || '').match(/(?:youtu\.be\/|embed\/|v=|shorts\/)([\w-]{11})/); return m ? m[1] : null; };
  const FAM_R = 'Robots Freo / Flow', FAM_S = 'Série S (Vacuum Mop)', FAM_A = 'Application', FAM_C = 'Commande & SAV', FAM_M = 'Manuels';

  // ---------- Zendesk ----------
  const pages = async u => { let o = [], n = u; while (n) { const r = await (await fetch(n)).json(); const k = Object.keys(r).find(x => Array.isArray(r[x])); o = o.concat(r[k]); n = r.next_page; } return o; };
  const cats = await pages('/api/v2/help_center/en-us/categories.json?per_page=100');
  const secs = await pages('/api/v2/help_center/en-us/sections.json?per_page=100');
  const arts = await pages('/api/v2/help_center/en-us/articles.json?per_page=100');
  if (arts.length < 100) throw new Error('Centre d\'aide : trop peu d\'articles (' + arts.length + ')');
  const catName = {}; cats.forEach(c => catName[c.id] = c.name.trim());
  const sec = {}; secs.forEach(s => sec[s.id] = { name: s.name.trim(), cat: catName[s.category_id] });

  const prods = new Map();
  const prod = (alias, nom, famille, extra) => { if (!prods.has(alias)) prods.set(alias, Object.assign({ alias, famille, nom, faq: [], vid: [] }, extra || {})); return prods.get(alias); };
  const modele = name => { const base = name.replace(/\s*\|\s*Vacuum Mop\s*$/, '').replace(/^Narwal\s+/, '').replace(/\s+Series$/, '').trim(); return prod('z-' + slug(base), 'Narwal ' + base, /^S\d/.test(base) ? FAM_S : FAM_R); };
  const GEN = { 'General': 'Général', 'Troubleshooting': 'Dépannage', 'Accessories and Maintenance': 'Accessoires et entretien' };
  const CMD = { 'Payments': 'Paiement', 'Return & Refund': 'Retours et remboursements', 'Shipping & Delivery': 'Livraison', 'Warranty': 'Garantie', 'Others': 'Autres' };
  const MAN = { 'Narwal Freo App': 'Application', 'Robot Vacuums': 'Robots Freo / Flow', 'Vacuum Mop': 'Série S (Vacuum Mop)', 'Important Safety Instructions': 'Consignes de sécurité' };
  const app = () => prod('z-app', 'Application Narwal Freo', FAM_A);
  function classer(cat, s) {
    if (cat === 'Order & Service') return [prod('z-cmd-' + slug(s), 'Commande & SAV – ' + (CMD[s] || s), FAM_C), 'faq'];
    if (cat === 'Manuals and Download') return [prod('z-man-' + slug(s), 'Manuels – ' + (MAN[s] || s), FAM_M), 'faq'];
    if (cat === 'Narwal Freo App') return [app(), s === 'Instruction Video' ? 'vid' : 'faq'];
    if (cat === 'Tutorials Videos') return [s === 'Narwal Freo App' ? app() : modele(s), 'vid'];
    if (cat === 'Robot Vacuums') return [GEN[s] ? prod('z-rob-' + slug(s), 'Robots – ' + GEN[s], FAM_R) : modele(s), 'faq'];
    if (cat === 'Vacuum Mop') return [GEN[s] ? prod('z-ser-' + slug(s), 'Série S – ' + GEN[s], FAM_S) : modele(s), 'faq'];
    return [prod('z-autre-' + slug(cat + '-' + s), cat + ' – ' + s, cat), 'faq'];
  }
  for (const a of arts) {
    if (a.draft) continue;
    const s = sec[a.section_id]; if (!s) continue;
    const [p, type] = classer(s.cat, s.name);
    if (type === 'faq') {
      const id = 'z' + a.id;
      if (!p.faq.some(f => f[0] === id)) p.faq.push([id, await h6(a.body), norm(a.title)]);
    } else {
      const ys = [...new Set([...(a.body || '').matchAll(/(?:youtu\.be\/|embed\/|v=|shorts\/)([\w-]{11})/g)].map(m => m[1]))];
      ys.forEach((y, k) => { if (!p.vid.some(v => v[0] === y)) p.vid.push([y, norm(a.title) + (k ? ' (' + (k + 1) + ')' : ''), 'en']); });
    }
  }

  // ---------- fr.narwal.com ----------
  const doc = async u => { const r = await fetch(u); if (!r.ok) throw new Error(u + ' → HTTP ' + r.status); return new DOMParser().parseFromString(await r.text(), 'text/html'); };
  const used = {};
  const frFid = async (q, h, sg) => { let id = 'f' + await h8(q); if (used[id] && used[id] !== h) id = 'f' + await h8(sg + '|' + q); used[id] = h; return id; };
  const frAcc = async (d, p, sg) => {
    for (const acc of d.querySelectorAll('.accordion')) {
      const t = acc.querySelector('.title'), r = acc.querySelector('.description'); if (!t || !r) continue;
      const q = norm(t.textContent), h = await h6(norm(r.textContent));
      if (!q || p.faq.some(f => f[2] === q)) continue;
      p.faq.push([await frFid(q, h, sg), h, q]);
    }
  };
  // FAQ générale
  const pg = prod('f-faq-generale', 'Commande & SAV – FAQ fr.narwal.com', FAM_C, { u: FR + '/pages/faq-new' });
  await frAcc(await doc(FR + '/pages/faq-new'), pg, 'faq-new');
  // Guides produits (modèles découverts dans l'onglet de la page)
  const nav = (d, re, generic) => { const o = new Map(); d.querySelectorAll('a').forEach(a => { const h = a.getAttribute('href') || '', t = norm(a.textContent); if (re.test(h) && t && !generic.test(t)) o.set(h.replace(FR, '').split('?')[0], t); }); return [...o]; };
  const d0 = await doc(FR + '/pages/product-help-freo-z10');
  const guides = nav(d0, /product-help-/, /^Guides? produits?$/i);
  if (guides.length < 3) throw new Error('Guides produits FR : navigation introuvable');
  for (const [href, t] of guides) {
    const base = t.replace(/^Narwal\s+/, '');
    const p = prod('z-' + slug(base), 'Narwal ' + base, /^S\d/.test(base) ? FAM_S : FAM_R);
    p.u = FR + href;
    await frAcc(href.endsWith('freo-z10') ? d0 : await doc(FR + href), p, href.split('/').pop());
  }
  // Vidéos tutoriels FR
  const v0 = await doc(FR + '/pages/tutorial-videos-narwal-freo-x-ultra');
  const vids = nav(v0, /tutorial-videos/, /^Tutoriels? vid[ée]os?$/i);
  if (vids.length < 4) throw new Error('Vidéos FR : navigation introuvable');
  for (const [href, t] of vids) {
    const base = t.replace(/^Narwal\s+/, '');
    const p = prod('z-' + slug(base), 'Narwal ' + base, /^S\d/.test(base) ? FAM_S : FAM_R);
    const d = href.endsWith('tutorial-videos-narwal-freo-x-ultra') ? v0 : await doc(FR + href);
    for (const f of d.querySelectorAll('iframe[src*="youtube"]')) {
      const y = ytid(f.getAttribute('src')); if (!y) continue;
      if (p.vid.some(v => v[0] === y)) continue;               // le titre du centre d'aide (Zendesk) prime
      let ti = norm(f.getAttribute('title'));
      if (!ti || /^youtube video player$/i.test(ti)) {          // titre générique : on prend le texte affiché sous la vidéo
        const c = f.closest('.col-12'), cc = c ? c.cloneNode(true) : null;
        if (cc) cc.querySelectorAll('style,script,component,svg,iframe,img,noscript').forEach(e => e.remove());
        ti = norm(cc ? cc.textContent : '') || y;
      }
      p.vid.push([y, ti, 'fr']);
    }
  }

  const res = [...prods.values()];
  const ids = new Set(), ys = new Set();
  res.forEach(p => { p.faq.forEach(f => ids.add(f[0])); p.vid.forEach(v => ys.add(v[0])); });
  console.log('Produits ' + res.length + ' | FAQ uniques ' + ids.size + ' | liens ' + res.reduce((n, p) => n + p.faq.length, 0) + ' | vidéos uniques ' + ys.size);
  const d = new Date().toISOString().slice(0, 10);
  window.__SNAP = { date: d, produits: res };
  if (window.__NO_DL) return;
  const blob = new Blob([JSON.stringify(window.__SNAP)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'snapshot_narwal_' + d + '.json'; document.body.appendChild(a); a.click(); a.remove();
})();
