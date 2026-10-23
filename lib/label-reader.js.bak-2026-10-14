/* Lecture d'une étiquette (photo) : modèle, IMEI 1 / IMEI 2, N° de série.
   1) codes-barres / QR (si le navigateur sait les lire)  2) OCR (Tesseract.js, chargé à la demande).
   Ne remplace jamais une case déjà remplie : les autres valeurs lues sont proposées sous forme de pastilles. */
(function (w) {
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- analyse du texte lu ---------- */
  function luhn(s) { var sum = 0, alt = false, i, n; for (i = s.length - 1; i >= 0; i--) { n = +s.charAt(i); if (alt) { n *= 2; if (n > 9) n -= 9; } sum += n; alt = !alt; } return sum % 10 === 0; }

  var DIG = { O: "0", o: "0", Q: "0", D: "0", I: "1", l: "1", "|": "1", i: "1", S: "5", s: "5", B: "8", Z: "2", z: "2", G: "6", g: "9", q: "9" };
  function fixDigits(s) { return s.replace(/[A-Za-z|]/g, function (c) { return DIG[c] || c; }); }
  function sufAfter(t, end) { var m = /^\s*\/\s*([0-9OoIl]{2})(?![0-9A-Za-z])/.exec(t.slice(end)); return m ? fixDigits(m[1]) : ""; }
  function parseImeis(t) {
    var out = [], seen = {}, m;
    function add(raw, slot, force, suf) {
      var d = raw.replace(/\D/g, "");
      if (d.length !== 15) return;
      if (seen[d]) { if (suf && !seen[d].suf) seen[d].suf = suf; return; }
      var ok = luhn(d);
      if (!ok && !force) return;
      var o = { v: d, ok: ok, slot: slot || 0, suf: suf || "" }; seen[d] = o; out.push(o);
    }
    /* après le mot IMEI (tolère IMEl, IME1, lMEI…, chiffres confondus avec des lettres) ; suffixe « / 01 » conservé */
    var re = /[I1l|]\s?M\s?E\s?[I1l|]\s*(?:\/\s*MEID)?\s*([12])?\s*[:#.\-\/;]*\s*((?:[0-9OoQDIl|SBZG][ \-]?){15,17})/g;
    while ((m = re.exec(t))) {
      var f = fixDigits(m[2]).replace(/\D/g, ""), sf = f.length >= 17 ? f.slice(15, 17) : sufAfter(t, m.index + m[0].length);
      add(f.slice(0, 15), m[1] ? +m[1] : 0, true, sf);
    }
    /* tout groupe de 15 chiffres valide (clé de Luhn) */
    var re2 = /(?:^|[^0-9A-Za-z])((?:[0-9OoIl|SBZ][ \-]?){14}[0-9OoIl|SBZ])(?=[^0-9A-Za-z]|$)/g;
    while ((m = re2.exec(t))) add(fixDigits(m[1]), 0, false, sufAfter(t, m.index + m[0].length));
    var re3 = /(\d[ \-]?){15,}/g;
    while ((m = re3.exec(t))) { var dd = m[0].replace(/\D/g, ""); for (var k = 0; k + 15 <= dd.length && k < 6; k++) add(dd.substr(k, 15), 0, false, dd.length === 17 && k === 0 ? dd.slice(15) : (dd.length === 15 ? sufAfter(t, m.index + m[0].length) : "")); }
    return out;
  }

  var STOP = /^(IMEI|IMEI1|IMEI2|MEID|EID|SERIAL|S\/N|SN|N°|NO|FCC|FCCID|ID|MADE|IN|CE|DATE|INPUT|OUTPUT|RATED|AC|DC|V|W|HZ|BATTERY|CAPACITY|COLOR|COLOUR|STORAGE|EAN|UPC|SKU|PN|P\/N|FNAC|DARTY)$/;
  function parseModels(t) {
    var out = [], seen = {}, m;
    function add(s, w) {
      s = (s || "").replace(/\s+/g, " ").trim().replace(/[.,;:\-\/]+$/, "");
      if (s.length < 3 || s.length > 34 || seen[s] || /^\d+$/.test(s)) return;
      seen[s] = 1; out.push({ v: s, w: w });
    }
    var U = t.toUpperCase().replace(/[|]/g, " ");
    var mk = [
      /\bIPHONE\s*(?:SE|XR|XS\s*MAX|XS|X|\d{1,2})(?:\s*(?:PRO\s*MAX|PRO|PLUS|MINI|E))?\b/g,
      /\bGALAXY\s+[A-Z]{1,2}\d{1,3}(?:\s*(?:ULTRA|PLUS|\+|FE|5G))*\b/g,
      /\bPIXEL\s*\d{1,2}[A-Z]?(?:\s*(?:PRO\s*XL|PRO|XL|A))?\b/g
    ];
    function pretty(x) {
      return x.split(/\s+/).map(function (t) {
        if (t === "IPHONE") return "iPhone";
        if (/^(GALAXY|PIXEL|PRO|MAX|ULTRA|PLUS|MINI)$/.test(t)) return t.charAt(0) + t.slice(1).toLowerCase();
        return t;
      }).join(" ").replace(/^iPhone(\d)/, "iPhone $1");
    }
    mk.forEach(function (r) { while ((m = r.exec(U))) add(pretty(m[0]), 3); });
    var re = /(?:MOD[ÈE]LE?|MODEL(?:\s*(?:NO|NUMBER|NAME))?|MOD\.|TYPE|PRODUCT\s*NAME|PRODUIT|R[ÉE]F(?:[ÉE]RENCE)?\.?|ARTICLE)\s*(?:N°|NO\.?|#)?\s*[:#=.\-]?\s*([A-Z0-9][A-Z0-9\-\/\.\+]{1,}(?: [A-Z0-9][A-Z0-9\-\/\.\+]{0,}){0,2})/g;
    while ((m = re.exec(U))) {
      var toks = m[1].split(" "), keep = [], i;
      for (i = 0; i < toks.length; i++) { if (STOP.test(toks[i]) || toks[i].length > 16) break; keep.push(toks[i]); }
      if (keep.length) add(keep.join(" "), 2);
    }
    var sm = /\bSM-[A-Z]\d{3,4}[A-Z]{0,2}(?:\/[A-Z]{1,3})?\b/g;
    while ((m = sm.exec(U))) add(m[0], 2);
    out.sort(function (a, b) { return b.w - a.w; });
    return out;
  }

  function parseSerials(t, exclude) {
    var out = [], seen = {};
    function add(s) {
      s = (s || "").toUpperCase().replace(/^[-.]+|[-.]+$/g, "");
      if (s.length < 6 || s.length > 28 || seen[s] || exclude[s]) return;
      if (/^\d{15}$/.test(s) && luhn(s)) return;
      seen[s] = 1; out.push(s);
    }
    var re = /(?:S\s*\/?\s*N|SERIAL(?:\s*(?:NO|NUMBER|N°))?|NUM[ÉE]?RO\s+DE\s+S[ÉE]RIE|N\s*°?\s*DE\s*S[ÉE]RIE|S[ÉE]RIE)\s*[:#.\-]?\s*([A-Z0-9][A-Z0-9\-]{5,})/gi, m;
    while ((m = re.exec(t))) add(m[1]);
    (t.toUpperCase().match(/[A-Z0-9][A-Z0-9\-]{7,}/g) || []).forEach(function (x) {
      if (/\d/.test(x) && /[A-Z]/.test(x)) add(x);
    });
    return out;
  }

  function parse(text) {
    var imeis = parseImeis(text), models = parseModels(text), ex = {};
    models.forEach(function (x) { ex[x.v.replace(/ /g, "")] = 1; ex[x.v] = 1; x.v.split("/").forEach(function (q) { ex[q] = 1; }); });
    imeis.forEach(function (x) { ex[x.v] = 1; });
    return { imeis: imeis, models: models, serials: parseSerials(text, ex) };
  }


  /* ---------- chargement des moteurs (hébergés dans lib/, repli sur CDN) ---------- */
  var BASE = (function () {
    var s = document.currentScript && document.currentScript.src;
    if (!s) { var a = document.getElementsByTagName("script"), i; for (i = a.length - 1; i >= 0; i--) if (/label-reader\.js/.test(a[i].src)) { s = a[i].src; break; } }
    return s ? s.replace(/[^\/]*$/, "") : new URL("lib/", document.baseURI).href;
  })();
  var D = null; /* diagnostic de la lecture en cours */
  function log(s) { if (D) D.steps.push(s); }
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = function () { rej(new Error("load " + src)); }; document.head.appendChild(s);
    });
  }
  function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }

  var workerP = null, idleT = null;
  function getWorker() {
    clearTimeout(idleT);
    if (workerP) return workerP;
    var opts = { workerPath: BASE + "tesseract/worker.min.js", corePath: BASE + "tesseract/", langPath: BASE + "tesseract/", gzip: true, workerBlobURL: false };
    workerP = (w.Tesseract ? Promise.resolve() : loadScript(BASE + "tesseract/tesseract.min.js"))
      .then(function () { return w.Tesseract.createWorker("eng", 1, opts); })
      .then(function (wk) { log("OCR : moteur local chargé"); return wk; }, function (e) {
        log("OCR : moteur local indisponible (" + (e && e.message || e) + "), essai via Internet");
        return (w.Tesseract ? Promise.resolve() : loadScript("https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.0/tesseract.min.js"))
          .then(function () { return w.Tesseract.createWorker("eng", 1); })
          .then(function (wk) { log("OCR : moteur Internet chargé"); return wk; });
      });
    workerP.catch(function () { workerP = null; });
    return workerP;
  }
  function idleKill() { clearTimeout(idleT); idleT = setTimeout(function () { if (workerP) { workerP.then(function (k) { k.terminate(); }); workerP = null; } }, 90000); }
  function loadZX() {
    if (w.ZXing) return Promise.resolve();
    return loadScript(BASE + "zxing.min.js").then(function () {}, function () { log("Codes-barres : lecteur indisponible"); });
  }

  /* ---------- images ---------- */
  function dims(im) { return [im.naturalWidth || im.width, im.naturalHeight || im.height]; }
  function cut(src, sx, sy, sw, sh, maxSide, gray, minSide, pol) {
    var s = maxSide / Math.max(sw, sh);
    if (minSide && s > 1 && Math.max(sw, sh) < minSide) s = Math.min(3, minSide / Math.max(sw, sh));
    if (!minSide) s = Math.min(1, s);
    var c = document.createElement("canvas"); c.width = Math.max(8, Math.round(sw * s)); c.height = Math.max(8, Math.round(sh * s));
    var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
    x.imageSmoothingQuality = "high"; x.drawImage(src, sx, sy, sw, sh, 0, 0, c.width, c.height);
    if (gray) {
      var d = x.getImageData(0, 0, c.width, c.height), p = d.data, i, g, h = new Array(256), lo = 0, hi = 255, n = c.width * c.height, a = 0;
      for (i = 0; i < 256; i++) h[i] = 0;
      for (i = 0; i < p.length; i += 4) { g = Math.round(.299 * p[i] + .587 * p[i + 1] + .114 * p[i + 2]); p[i] = g; h[g]++; }
      for (lo = 0; lo < 255 && (a += h[lo]) < n * .01; lo++);
      for (a = 0, hi = 255; hi > 0 && (a += h[hi]) < n * .01; hi--);
      var k = hi - lo > 40 ? 255 / (hi - lo) : 1;
      /* polarité : texte clair sur fond sombre (écran de téléphone, *#06#) → on inverse pour l'OCR */
      var sum = 0; for (i = 0; i < 256; i++) sum += h[i] * i;
      var inv = pol === 1 || (!pol && sum / n < 125);
      for (i = 0; i < p.length; i += 4) { g = Math.max(0, Math.min(255, (p[i] - lo) * k)); if (inv) g = 255 - g; p[i] = p[i + 1] = p[i + 2] = g; }
      c.inverted = inv;
      x.putImageData(d, 0, 0);
    }
    return c;
  }
  /* zone la plus "chargée" en détails (texte + codes-barres) : permet de rogner une petite étiquette dans une grande photo */
  function findRegion(im) {
    var wh = dims(im), W = wh[0], H = wh[1], sm = cut(im, 0, 0, W, H, 480, false), cw = sm.width, ch = sm.height;
    var p = sm.getContext("2d").getImageData(0, 0, cw, ch).data, g = new Float32Array(cw * ch), i, x, y;
    for (i = 0; i < cw * ch; i++) g[i] = .299 * p[i * 4] + .587 * p[i * 4 + 1] + .114 * p[i * 4 + 2];
    var GX = 20, GY = Math.max(8, Math.round(20 * ch / cw)), e = new Float32Array(GX * GY), cwid = cw / GX, chei = ch / GY;
    for (y = 1; y < ch - 1; y++) for (x = 1; x < cw - 1; x++) {
      var v = Math.abs(g[y * cw + x + 1] - g[y * cw + x - 1]) + Math.abs(g[(y + 1) * cw + x] - g[(y - 1) * cw + x]);
      if (v > 40) e[Math.min(GY - 1, Math.floor(y / chei)) * GX + Math.min(GX - 1, Math.floor(x / cwid))] += v;
    }
    var mx = 0; for (i = 0; i < e.length; i++) if (e[i] > mx) mx = e[i];
    if (!mx) return null;
    var on = [], seen = {}, best = null, bs = -1;
    for (i = 0; i < e.length; i++) on[i] = e[i] > mx * .12;
    for (i = 0; i < e.length; i++) {
      if (!on[i] || seen[i]) continue;
      var st = [i], sum = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; seen[i] = 1;
      while (st.length) {
        var c = st.pop(), cx = c % GX, cy = (c / GX) | 0; sum += e[c];
        if (cx < x0) x0 = cx; if (cx > x1) x1 = cx; if (cy < y0) y0 = cy; if (cy > y1) y1 = cy;
        for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
          var nx = cx + dx, ny = cy + dy, n = ny * GX + nx;
          if (nx >= 0 && ny >= 0 && nx < GX && ny < GY && on[n] && !seen[n]) { seen[n] = 1; st.push(n); }
        }
      }
      if (sum > bs) { bs = sum; best = [x0, y0, x1, y1]; }
    }
    if (!best) return null;
    var px = Math.max(1, Math.round(GX * .05)), py = Math.max(1, Math.round(GY * .07));
    var rx0 = Math.max(0, best[0] - px), ry0 = Math.max(0, best[1] - py), rx1 = Math.min(GX, best[2] + 1 + px), ry1 = Math.min(GY, best[3] + 1 + py);
    var r = { x: rx0 / GX * W, y: ry0 / GY * H, w: (rx1 - rx0) / GX * W, h: (ry1 - ry0) / GY * H };
    /* écran de téléphone / grande page de texte (Réglages > Informations) : le recadrage couperait les valeurs alignées à droite → image entière */
    if (r.w * r.h > .4 * W * H || r.w > .6 * W && r.h > .6 * H) return null;
    return r;
  }

  /* ---------- codes-barres ---------- */
  function zxDecode(reader, c) {
    try {
      var lum = new w.ZXing.HTMLCanvasElementLuminanceSource(c), bmp = new w.ZXing.BinaryBitmap(new w.ZXing.HybridBinarizer(lum));
      var r = reader.decode(bmp); return r && r.getText ? r.getText() : null;
    } catch (e) { return null; }
  }
  /* accentuation de netteté (masque flou) : rattrape les photos légèrement floues avant lecture des codes-barres */
  function sharpen(src, rad, amt) {
    var w0 = src.width, h0 = src.height, c = document.createElement("canvas"); c.width = w0; c.height = h0;
    var x = c.getContext("2d"); x.drawImage(src, 0, 0);
    var d = x.getImageData(0, 0, w0, h0), p = d.data, n = w0 * h0, g = new Float32Array(n), t = new Float32Array(n), bl = new Float32Array(n), k = [], s = 0, i, j, xx, yy, a, q, R = rad * 2;
    for (i = 0; i < n; i++) g[i] = p[i * 4];
    for (j = -R; j <= R; j++) { var v = Math.exp(-j * j / (2 * rad * rad)); k.push(v); s += v; }
    for (yy = 0; yy < h0; yy++) for (xx = 0; xx < w0; xx++) { a = 0; for (j = -R; j <= R; j++) { q = xx + j; q = q < 0 ? 0 : q > w0 - 1 ? w0 - 1 : q; a += g[yy * w0 + q] * k[j + R]; } t[yy * w0 + xx] = a / s; }
    for (yy = 0; yy < h0; yy++) for (xx = 0; xx < w0; xx++) { a = 0; for (j = -R; j <= R; j++) { q = yy + j; q = q < 0 ? 0 : q > h0 - 1 ? h0 - 1 : q; a += t[q * w0 + xx] * k[j + R]; } bl[yy * w0 + xx] = a / s; }
    for (i = 0; i < n; i++) { var o = g[i] + amt * (g[i] - bl[i]); o = o < 0 ? 0 : o > 255 ? 255 : o; p[i * 4] = p[i * 4 + 1] = p[i * 4 + 2] = o; p[i * 4 + 3] = 255; }
    x.putImageData(d, 0, 0); return c;
  }
  function scanCodes(im, region, budgetMs) {
    var found = {}, t0 = Date.now(), WH = dims(im), jobs = [];
    return loadZX().then(function () {
      if (!w.ZXing) return [];
      var Z = w.ZXing, hints = new Map(), F = Z.BarcodeFormat;
      hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [F.CODE_128, F.CODE_39, F.CODE_93, F.EAN_13, F.EAN_8, F.ITF, F.QR_CODE, F.DATA_MATRIX, F.CODABAR]);
      hints.set(Z.DecodeHintType.TRY_HARDER, true);
      var reader = new Z.MultiFormatReader(); reader.setHints(hints);
      var srcs = [];
      if (region) srcs.push([region.x, region.y, region.w, region.h, 2600]);
      srcs.push([0, 0, WH[0], WH[1], 3200]);
      srcs.forEach(function (s, si) {
        var base = cut(im, s[0], s[1], s[2], s[3], s[4], false, 1400), bw = base.width, bh = base.height, hh = Math.max(60, Math.round(bh / 4)), y;
        var g = { full: si > 0 && !!region, list: [base] };
        for (y = 0; y + hh <= bh + 1; y += Math.round(hh / 2)) { var c = document.createElement("canvas"); c.width = bw; c.height = Math.min(hh, bh - y); c.getContext("2d").drawImage(base, 0, y, bw, c.height, 0, 0, bw, c.height); g.list.push(c); }
        jobs.push(g);
      });
      var cfgs = [[0, 0], [2, 3], [3, 5]], ci = 0, gi = 0, i = 0;
      function next() {
        if (Date.now() - t0 > budgetMs) return Promise.resolve();
        var g = jobs[gi];
        if (!g || i >= g.list.length) {
          i = 0; gi++;
          if (gi < jobs.length && jobs[gi].full && Object.keys(found).length) gi++; /* zone repérée et code trouvé : inutile de refaire l'image entière */
          if (gi >= jobs.length) { gi = 0; ci++; if (ci >= cfgs.length || Object.keys(found).length >= 3) return Promise.resolve(); }
          return next();
        }
        var c = g.list[i++], cf = cfgs[ci];
        if (cf[0]) { if (c.width * c.height > 3e6) return next(); c = sharpen(c, cf[0], cf[1]); }
        var v = zxDecode(reader, c);
        if (v) found[v.trim()] = 1;
        return tick().then(next);
      }
      return next();
    }).then(function () {
      if ("BarcodeDetector" in w) {
        return new BarcodeDetector().detect(im).then(function (r) { r.forEach(function (x) { if (x.rawValue) found[String(x.rawValue).trim()] = 1; }); }).catch(function () {});
      }
    }).then(function () {
      if (Object.keys(found).length || typeof w.qrFromImg !== "function") return;
      return w.qrFromImg(im).then(function (v) { if (v) found[String(v).trim()] = 1; }).catch(function () {});
    }).then(function () { return Object.keys(found); });
  }

  /* ---------- affichage / remplissage ---------- */
  function box() { return $("snRes"); }
  function diagNode() {
    if (!D) return null;
    var d = document.createElement("details"); d.className = "lrdiag"; d.style.cssText = "margin-top:4px;font-size:11px";
    var s = document.createElement("summary"); s.textContent = "Voir le texte lu (diagnostic)"; s.style.cursor = "pointer"; d.appendChild(s);
    var pre = document.createElement("pre"); pre.style.cssText = "white-space:pre-wrap;max-height:180px;overflow:auto;background:#f4f4f4;padding:4px;margin:2px 0;user-select:text";
    pre.textContent = "Étapes : " + D.steps.join(" | ") + "\nCodes-barres : " + (D.codes.length ? D.codes.join(" ; ") : "aucun") + "\n\n--- texte OCR ---\n" + (D.text.trim() || "(vide)");
    d.appendChild(pre); return d;
  }
  function say(msg, err, keepDiag) {
    var b = box(); if (!b) return; b.innerHTML = ""; var s = document.createElement("span"); s.className = err ? "err" : ""; s.textContent = msg; b.appendChild(s);
    if (keepDiag) { var dn = diagNode(); if (dn) b.appendChild(dn); }
  }
  function mdl() { return $("mdlInp"); }
  function setIfEmpty(el, v) { if (el && !el.value && v) { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); return true; } return false; }
  function chip(label, fn) {
    var b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = label;
    b.onclick = function () { fn(); }; return b;
  }
  function fmt(x) { return x.v + (x.suf ? " / " + x.suf : ""); }
  function setImei(x) { var v = fmt(x), a = $("imei1"), b = $("imei2"); if (!a) return; if (a.value.indexOf(x.v) === 0 || (b && b.value.indexOf(x.v) === 0)) return; if (!a.value) a.value = v; else if (b && !b.value) b.value = v; else a.value = v; }

  function show(res, filled) {
    var b = box(); if (!b) return; b.innerHTML = "";
    var parts = [];
    if (filled.model) parts.push("modèle " + filled.model);
    if (filled.imei1) parts.push("IMEI 1 " + filled.imei1);
    if (filled.imei2) parts.push("IMEI 2 " + filled.imei2);
    if (filled.sn) parts.push("N° de série " + filled.sn);
    var head = document.createElement("span");
    head.textContent = (parts.length ? "Lu : " + parts.join(" · ") + " — vérifiez les valeurs. " : "Les champs déjà remplis ne sont pas modifiés. Valeurs lues, à choisir si besoin : ");
    b.appendChild(head);
    var n = 0;
    res.models.forEach(function (x) { if (n < 6 && x.v !== filled.model) { n++; b.appendChild(chip("Modèle : " + x.v, function () { if (mdl()) mdl().value = x.v; })); } });
    if ($("imei1")) res.imeis.forEach(function (x) { if (fmt(x) !== filled.imei1 && fmt(x) !== filled.imei2) b.appendChild(chip("IMEI" + (x.ok ? "" : " ⚠") + " : " + fmt(x), function () { setImei(x); })); });
    res.serials.slice(0, 6).forEach(function (s) { if (s !== filled.sn) b.appendChild(chip("N° série : " + s, function () { var i = $("snInp"); if (i) i.value = s; })); });
    if (res.imeis.some(function (x) { return !x.ok; })) { var w2 = document.createElement("div"); w2.className = "err"; w2.textContent = "⚠ IMEI dont la clé de contrôle est invalide : probablement un chiffre mal lu, à vérifier sur l'étiquette (ou *#06#)."; b.appendChild(w2); }
    var dn = diagNode(); if (dn) b.appendChild(dn);
  }

  function apply(res) {
    var filled = {}, sn = $("snInp"), good = res.imeis.filter(function (x) { return x.ok; });
    var s1 = good.filter(function (x) { return x.slot === 1; })[0], s2 = good.filter(function (x) { return x.slot === 2; })[0];
    var rest = good.filter(function (x) { return x !== s1 && x !== s2; });
    var i1 = s1 || rest.shift(), i2 = s2 || rest.shift();
    if ($("imei1") && i1 && setIfEmpty($("imei1"), fmt(i1))) filled.imei1 = fmt(i1);
    if ($("imei2") && i2 && setIfEmpty($("imei2"), fmt(i2))) filled.imei2 = fmt(i2);
    if (mdl() && res.models[0] && setIfEmpty(mdl(), res.models[0].v)) filled.model = res.models[0].v;
    if (sn && res.serials[0] && setIfEmpty(sn, res.serials[0])) filled.sn = res.serials[0];
    show(res, filled);
    return filled;
  }

  /* ---------- fusion codes-barres + texte ---------- */
  function lev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = [i]; } for (j = 1; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
    return d[m][n];
  }
  function merge(text, codes) {
    var extraText = "", snCodes = [];
    codes.forEach(function (v) {
      var digits = v.replace(/\D/g, "");
      if (/^\d{15}$/.test(digits) && luhn(digits)) extraText += "\nIMEI " + digits + "\n";
      else if (/^\d{17}$/.test(digits) && luhn(digits.slice(0, 15))) extraText += "\nIMEI " + digits.slice(0, 15) + " / " + digits.slice(15) + "\n";
      else if (/^\d{15}$/.test(digits)) { /* code-barres 15 chiffres sans clé valide : non retenu */ }
      else if (typeof w.snFromQr === "function" && /^[a-z]+:|^https?:|[=&]/i.test(v)) { var sn = w.snFromQr(v); if (sn) snCodes.push(sn.toUpperCase()); }
      else if (/^[A-Za-z0-9][A-Za-z0-9\-\/ ]{5,27}$/.test(v) && !/^\d{12,14}$/.test(v)) snCodes.push(v.replace(/\s+/g, "").toUpperCase());
    });
    var res = parse(text + extraText), ocrSn = res.serials.slice(), fin = [];
    var ex = {}; res.imeis.forEach(function (x) { ex[x.v] = 1; }); res.models.forEach(function (x) { ex[x.v.replace(/ /g, "")] = 1; });
    /* écart : IMEI / EID / MEID mal lus (ex. « IMEI 3531… » lu « NEL 2E21… ») ne sont pas des numéros de série */
    function junk(x) {
      var d = x.replace(/\D/g, "").length, i;
      if (x.length >= 13 && d / x.length >= .8) return true;
      for (i = 0; i < res.imeis.length; i++) if (Math.abs(x.length - 15) <= 3 && lev(x, res.imeis[i].v) <= 5) return true;
      return false;
    }
    ocrSn = ocrSn.filter(function (x) { return !junk(x); });
    snCodes = snCodes.filter(function (x) { return !junk(x); });
    /* écran *#06# (IMEI / EID / MEID, jamais de N° de série) : aucune valeur « sans libellé » n'est retenue, sinon du bruit remplirait la case et bloquerait la 2e photo */
    if (!/S\s*\/\s*N|SERIAL|S[ÉE]RIE/i.test(text) && (/\bM?EID\b/i.test(text) || res.imeis.length >= 2)) { ocrSn = []; snCodes = []; }
    snCodes = snCodes.filter(function (s) { return !ex[s] && !/^SM-?[A-Z]\d{3}/.test(s); });
    /* un code-barres proche d'une valeur lue par OCR la corrige (le code-barres fait foi) */
    var used = {};
    ocrSn.forEach(function (o) {
      var bst = null, bd = 99;
      snCodes.forEach(function (c) { var dd = lev(o, c); if (dd < bd) { bd = dd; bst = c; } });
      if (bst && bd <= Math.max(2, Math.floor(o.length / 4))) { if (fin.indexOf(bst) < 0) fin.push(bst); used[bst] = 1; }
    });
    var labelled = ocrSn.length ? ocrSn[0] : null;
    if (!fin.length || (labelled && lev(labelled, fin[0]) > 3)) {
      /* aucun recoupement : on propose d'abord les codes-barres (fiables), puis l'OCR */
      snCodes.forEach(function (c) { if (fin.indexOf(c) < 0) fin.push(c); });
    }
    ocrSn.forEach(function (o) { if (fin.indexOf(o) < 0) fin.push(o); });
    res.serials = fin;
    return res;
  }

  /* ---------- lecture ---------- */
  var busy = false;
  function wantImei() { return !!$("imei1"); }
  function enough(text, codes) {
    var r = merge(text, codes), imeiOk = r.imeis.some(function (x) { return x.ok; });
    return (wantImei() ? imeiOk : true) && r.serials.length > 0;
  }
  function ocrPass(canvas, psm) {
    return getWorker().then(function (k) {
      return k.setParameters({ tessedit_pageseg_mode: String(psm), preserve_interword_spaces: "1" }).then(function () { return k.recognize(canvas); });
    }).then(function (r) { var t = (r && r.data && r.data.text) || ""; D.text += "\n[" + canvas.width + "x" + canvas.height + " psm" + psm + "]\n" + t; return t; });
  }

  /* im : élément <img> / canvas déjà chargé */
  function run(im) {
    if (busy) { say("Une lecture est déjà en cours…"); return Promise.resolve(null); }
    busy = true; D = { steps: [], codes: [], text: "" };
    var T0 = Date.now(), WH = dims(im), region = null, codes = [], text = "", ocrFail = false;
    /* lecture ligne par ligne : indispensable quand de gros codes-barres perturbent la mise en page (écran *#06#, étiquettes denses) */
    function bandPass() {
      if (enough(text, codes) || ocrFail) return Promise.resolve();
      var r = region || { x: 0, y: 0, w: WH[0], h: WH[1] };
      var base = cut(im, r.x, r.y, r.w, r.h, 2400, false, 1500), bw = base.width, bh = base.height, hh = Math.max(90, Math.round(.075 * Math.max(bw, bh))), st = Math.round(hh / 2), ys = [], y;
      for (y = 0; y + hh <= bh + st / 2; y += st) ys.push(y);
      var k = 0, tb = Date.now();
      function nb() {
        if (k >= ys.length || Date.now() - tb > 30000) return Promise.resolve();
        var yy = ys[k++], hgt = Math.min(hh, bh - yy), c = document.createElement("canvas"); c.width = bw; c.height = hgt;
        c.getContext("2d").drawImage(base, 0, yy, bw, hgt, 0, 0, bw, hgt);
        var cx = c.getContext("2d"), px = cx.getImageData(0, 0, bw, hgt).data, s1 = 0, s2 = 0, n = 0, j, g;
        for (j = 0; j < px.length; j += 64) { g = px[j] * .299 + px[j + 1] * .587 + px[j + 2] * .114; s1 += g; s2 += g * g; n++; }
        if (Math.sqrt(Math.max(0, s2 / n - (s1 / n) * (s1 / n))) < 14) return nb(); /* bande unie : rien à lire */
        say("Lecture ligne par ligne (" + k + "/" + ys.length + ")…");
        return tick().then(function () { return ocrPass(cut(c, 0, 0, bw, hgt, Math.max(bw, hgt), true), 6); })
          .then(function (tx) { text += "\n" + tx; }, function () { ocrFail = true; k = ys.length; })
          .then(function () { return enough(text, codes) && imeiCount() >= (wantImei() ? 2 : 0) ? Promise.resolve() : nb(); });
      }
      log("lecture par bandes (" + ys.length + ")");
      return nb().then(function () { log("bandes terminées à " + ((Date.now() - T0) / 1000).toFixed(1) + "s"); });
    }
    function imeiCount() { return merge(text, codes).imeis.filter(function (x) { return x.ok; }).length; }
    say("Lecture de l'étiquette : repérage de la zone…");
    return tick().then(function () { try { region = findRegion(im); } catch (e) { region = null; } log(region ? "zone repérée " + Math.round(region.w) + "x" + Math.round(region.h) + " sur " + WH[0] + "x" + WH[1] : "zone : image entière"); })
      .then(function () { say("Lecture des codes-barres…"); return scanCodes(im, region, 9000); })
      .then(function (v) { codes = v; D.codes = v; log(v.length + " code(s)-barres lu(s) en " + ((Date.now() - T0) / 1000).toFixed(1) + "s"); })
      .then(function () {
        var passes = [];
        if (region) {
          passes.push(function () { return cut(im, region.x, region.y, region.w, region.h, 2400, true, 1800); });
          passes.push(function () { return sharpen(cut(im, region.x, region.y, region.w, region.h, 3000, true, 2400), 3, 2.5); });
        }
        if (!region) passes.push(function () { return cut(im, 0, 0, WH[0], WH[1], 3000, true); });
        var i = 0, psms = region ? [6, 11, 6, 11] : [6, 11, 6, 11], lastInv = false;
        function next() {
          if (i >= passes.length || enough(text, codes)) return Promise.resolve();
          var k = i++;
          say("Lecture du texte de l'étiquette (passe " + (k + 1) + "/" + passes.length + ", quelques secondes)…");
          return tick().then(function () { var cv = passes[k](); if (k < passes.length - 1) lastInv = !!cv.inverted; return ocrPass(cv, psms[k] || 6); })
            .then(function (t) { text += "\n" + t; log("OCR passe " + (k + 1) + " ok à " + ((Date.now() - T0) / 1000).toFixed(1) + "s"); }, function (e) { ocrFail = true; log("OCR passe " + (k + 1) + " impossible : " + (e && e.message || e)); i = passes.length; })
            .then(next);
        }
        return next().then(bandPass);
      })
      .then(function () {
        idleKill();
        var res = merge(text, codes);
        if (!res.imeis.length && !res.models.length && !res.serials.length) {
          say(ocrFail && !codes.length
            ? "Lecture automatique impossible ici (moteur de lecture introuvable) : saisissez les valeurs à la main, la photo de l'étiquette est jointe."
            : "Rien de lisible : rapprochez-vous de l'étiquette (texte net, sans reflet) ou saisissez à la main (IMEI : composer *#06#).", true, true);
          return null;
        }
        return apply(res);
      })
      .catch(function (e) { say("Image illisible.", true); log("erreur " + (e && e.message || e)); return null; })
      .then(function (r) { busy = false; return r; });
  }

  w.LabelReader = { run: run, parse: parse, luhn: luhn, merge: merge, _findRegion: findRegion };
})(typeof window !== "undefined" ? window : this);
