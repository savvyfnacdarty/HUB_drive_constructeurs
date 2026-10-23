/* Collecteur Ecovacs — à coller dans la console (F12) sur https://help.ecovacs.com/fr/support
   Télécharge snapshot_ecovacs_AAAA-MM-JJ.json (même format que sync_ecovacs.py --snapshot). */
(async () => {
  const sha6 = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s || '')))]
    .map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 6);
  const aliases = [...new Set([...document.querySelectorAll('a')]
    .map(a => (a.getAttribute('href') || '').replace(location.origin, '').split('?')[0].split('#')[0].replace(/\/+$/, ''))
    .filter(h => /^\/fr\/support\/[^\/]+$/.test(h)).map(h => h.split('/')[3]))].filter(a => a !== 'search');
  console.log(aliases.length + ' pages candidates à lire (les pages non-produit seront ignorées)…');
  const un = async alias => {
    try {
      const t = await (await fetch('/fr/support/' + alias)).text();
      const nd = JSON.parse(t.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)[1]);
      const pd = nd.props.pageProps.pageData, pi = pd.product_info || {}, seen = new Set(), faq = [];
      if (!['DEEBOT', 'WINBOT', 'GOAT'].includes(pi.category)) return { alias, ignore: true };
      for (const f of pd.faq_list || []) {
        if (seen.has(f.id)) continue; seen.add(f.id);
        faq.push([f.id, await sha6(f.answer), (f.question || '').trim()]);
      }
      const ytid = u => { const m = (u || '').match(/(?:youtu\.be\/|embed\/|v=|shorts\/)([\w-]{11})/); return m ? m[1] : null; };
      const vseen = new Set(), vid = [];
      for (const v of pd.video_list || []) {
        const y = ytid(v.video_url); if (!y || vseen.has(y)) continue; vseen.add(y);
        vid.push([y, (v.title || '').replace(/^\s*\d+\s+/, '').replace(/\uff1f/g, '?').replace(/\s+/g, ' ').trim()]);
      }
      return { alias, id: pi.id, famille: pi.category, nom: pi.name, faq, vid };
    } catch (e) { return { alias, erreur: String(e) }; }
  };
  const res0 = []; let i = 0;
  await Promise.all(Array.from({ length: 6 }, async () => { while (i < aliases.length) { const a = aliases[i++]; res0.push(await un(a)); } }));
  const res = res0.filter(p => !p.ignore);
  res.sort((a, b) => aliases.indexOf(a.alias) - aliases.indexOf(b.alias));
  const ids = new Set(); res.forEach(p => (p.faq || []).forEach(f => ids.add(f[0])));
  const vids = new Set(); res.forEach(p => (p.vid || []).forEach(v => vids.add(v[0])));
  console.log('Produits ' + res.length + ' | erreurs ' + res.filter(p => p.erreur).length + ' | FAQ uniques ' + ids.size + ' | vidéos uniques ' + vids.size);
  const d = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify({ date: d, produits: res })], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'snapshot_ecovacs_' + d + '.json'; document.body.appendChild(a); a.click(); a.remove();
})();
