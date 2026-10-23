/* Fiches d'inspection — relais photos téléphone -> PC (Firebase Firestore, chiffré de bout en bout).
   Le PC crée une session (QR code). N'importe quel téléphone scanne le QR, prend les photos,
   elles arrivent chiffrées dans la fiche. Nécessite lib/relay-crypto.js et lib/qrcode-generator.js. */
(function () {
  var FB_VER = "10.12.2", SESSION_H = 2;
  var st = { sid: null, key: null, exp: 0, unsub: null, db: null, got: 0, seen: {}, ready: null };

  /* ---------- styles ---------- */
  var css = document.createElement("style");
  css.textContent =
    "#rlOv{display:none;position:fixed;inset:0;z-index:98;background:rgba(0,0,0,.6);align-items:center;justify-content:center;padding:12px}" +
    "#rlBox{background:#fff;border-radius:8px;max-width:440px;width:100%;max-height:96vh;overflow:auto;padding:16px 18px;font:14px/1.4 Arial,Helvetica,sans-serif;color:#222;box-shadow:0 8px 30px rgba(0,0,0,.4)}" +
    "#rlBox h3{margin:0 0 6px;font-size:16px;color:#d6231a}" +
    "#rlBox p{margin:6px 0}" +
    "#rlQr{display:flex;justify-content:center;margin:8px 0;min-height:60px;align-items:center}" +
    "#rlQr svg{width:min(300px,70vw);height:auto;border:1px solid #ddd}" +
    "#rlSt{font-weight:bold;margin:6px 0}" +
    "#rlSt.err{color:#d6231a}#rlSt.ok{color:#1a7f37}" +
    "#rlLnk{display:flex;gap:6px;margin:6px 0}" +
    "#rlLnk input{flex:1;min-width:0;font:12px monospace;padding:5px;border:1px solid #bbb;border-radius:3px}" +
    "#rlBox button{background:#f08a00;color:#fff;border:0;border-radius:4px;padding:7px 14px;font-weight:bold;cursor:pointer;font-size:13px}" +
    "#rlBox button.sec{background:#666}#rlBox button.red{background:#d6231a}" +
    "#rlAct{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}" +
    "#rlBox small{color:#777;display:block;margin-top:6px}" +
    "@media print{#rlOv,.rlbtn{display:none!important}}";
  document.head.appendChild(css);

  var ov = document.createElement("div");
  ov.id = "rlOv";
  ov.innerHTML = '<div id="rlBox"><h3>&#128241; Photos depuis un téléphone</h3>' +
    '<p>Scannez ce QR code avec l\'appareil photo de n\'importe quel téléphone (aucune connexion requise). Les photos arrivent directement dans cette fiche.</p>' +
    '<div id="rlQr"></div><div id="rlSt"></div>' +
    '<div id="rlLnk" style="display:none"><input id="rlUrl" readonly><button type="button" class="sec" id="rlCp">Copier</button></div>' +
    '<small>&#128274; Chiffré de bout en bout : la clé n\'est que dans le QR code, Firebase ne conserve que du texte chiffré, supprimé dès réception. Session valable ' + SESSION_H + ' h.</small>' +
    '<div id="rlAct"><button type="button" class="sec" id="rlHide">Masquer</button><button type="button" class="red" id="rlEnd">Terminer la session</button></div></div>';
  document.body.appendChild(ov);
  var $ = function (id) { return document.getElementById(id); };
  function status(t, cls) { var e = $("rlSt"); e.textContent = t; e.className = cls || ""; }

  /* ---------- boutons ---------- */
  function mkBtn(cls, label) {
    var b = document.createElement("button");
    b.type = "button"; b.className = cls + " rlbtn"; b.innerHTML = label;
    b.addEventListener("click", openPanel);
    return b;
  }
  var tb = document.querySelector(".toolbar"), msg = document.getElementById("msg");
  if (tb) { var b1 = mkBtn("", "&#128241; Photos via téléphone"); b1.style.cssText = "background:#f08a00;border:0;color:#fff;padding:6px 14px;border-radius:4px;cursor:pointer;font-weight:bold"; tb.insertBefore(b1, msg || null); }
  var pb = document.querySelector("#photos .phbar");
  if (pb) pb.appendChild(mkBtn("btn sec", "&#128241; Via un téléphone (QR code)"));

  /* ---------- firebase ---------- */
  function loadScript(u) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script"); s.src = u; s.onload = res;
      s.onerror = function () { rej(new Error("Chargement impossible : " + u)); };
      document.head.appendChild(s);
    });
  }
  function waitApp(ms) {
    return new Promise(function (res) {
      var t0 = Date.now();
      (function tick() {
        if (window.firebase && firebase.apps && firebase.apps.length) return res(true);
        if (Date.now() - t0 > ms) return res(false);
        setTimeout(tick, 150);
      })();
    });
  }
  function authUser() {
    return new Promise(function (res) {
      var a = firebase.auth && firebase.auth();
      if (!a) return res(null);
      var un = a.onAuthStateChanged(function (u) { un(); res(u); });
    });
  }
  function initDb() {
    if (st.ready) return st.ready;
    var isLocal = location.protocol === "file:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    if (isLocal && !window.RELAY_FORCE) { st.ready = Promise.reject(new Error("local")); st.ready.catch(function () { st.ready = null; }); return st.ready; }
    st.ready = waitApp(12000).then(function (ok) {
      if (!ok) throw new Error("local");
      return authUser();
    }).then(function (u) {
      if (!u) throw new Error("noauth");
      return window.firebase.firestore ? 0 : loadScript("https://www.gstatic.com/firebasejs/" + FB_VER + "/firebase-firestore-compat.js");
    }).then(function () {
      var db = firebase.firestore();
      try { db.settings({ experimentalAutoDetectLongPolling: true, merge: true }); } catch (e) {}
      st.db = db; st.uid = firebase.auth().currentUser.uid;
      return db;
    });
    st.ready.catch(function () { st.ready = null; });
    return st.ready;
  }
  function explain(e) {
    var m = e && e.message || "", c = e && e.code || "";
    if (m === "local") return "Disponible uniquement depuis le hub publié (adresse https) : ouvrez la fiche depuis le hub et connectez-vous.";
    if (m === "noauth") return "Connexion requise : reconnectez-vous au hub puis réessayez.";
    if (c === "permission-denied") return "Refusé par Firebase : les règles Firestore du relais photos ne sont pas encore publiées (voir la procédure).";
    if (c === "unavailable" || /Chargement impossible/.test(m)) return "Firebase injoignable : vérifiez la connexion réseau.";
    if (c === "not-found" || /database.*not.*exist|NOT_FOUND/i.test(m)) return "Base Firestore non créée dans la console Firebase (voir la procédure).";
    return "Erreur : " + (c || m || "inconnue");
  }

  /* ---------- session ---------- */
  function sections() {
    var out = [], seen = {};
    document.querySelectorAll(".rowcam[data-sec]").forEach(function (b) {
      var s = b.getAttribute("data-sec");
      if (s && !seen[s]) { seen[s] = 1; out.push(s); }
    });
    var sn = "Étiquette N° de série"; if (!seen[sn]) out.push(sn);
    return out;
  }
  function dossier() {
    var i = document.querySelector(".ident input[type=text]");
    return i ? i.value.trim() : "";
  }
  function sUrl() {
    var u = new URL("capture.html", location.href);
    return u.origin + u.pathname + "#s=" + st.sid + "&k=" + st.key;
  }
  function store() {
    try { sessionStorage.setItem("rlSess:" + location.pathname, JSON.stringify({ sid: st.sid, key: st.key, exp: st.exp })); } catch (e) {}
  }
  function unstore() { try { sessionStorage.removeItem("rlSess:" + location.pathname); } catch (e) {} }
  function loadStored() {
    try { var s = JSON.parse(sessionStorage.getItem("rlSess:" + location.pathname) || "null"); if (s && s.exp > Date.now() + 60000) return s; } catch (e) {}
    return null;
  }

  function importDoc(d) {
    if (st.seen[d.id]) return; st.seen[d.id] = 1;
    var x = d.data();
    RelayCrypto.dec(st.key, st.sid + ":p", x.iv, x.d).then(function (p) {
      if (typeof addPhotoData === "function" && p && p.img) {
        addPhotoData(p.img, p.cap || p.sec || "Photo téléphone", p.sec || "");
        try { window.dirty = true; } catch (e) {}
      }
      if (p && p.img && p.sec === "Étiquette N° de série" && window.LabelReader) {
        var im = new Image(); im.onload = function () { LabelReader.run(im); }; im.src = p.img;
      }
      st.got++; status(st.got + " photo" + (st.got > 1 ? "s" : "") + " reçue" + (st.got > 1 ? "s" : "") + " ✔", "ok");
      return d.ref.delete();
    }).catch(function () { status("Une photo reçue n'a pas pu être déchiffrée (ignorée).", "err"); d.ref.delete().catch(function () {}); });
  }
  function listen() {
    if (st.unsub) st.unsub();
    st.unsub = st.db.collection("relay").doc(st.sid).collection("photos").onSnapshot(function (snap) {
      snap.docChanges().forEach(function (c) { if (c.type === "added") importDoc(c.doc); });
    }, function (e) { status(explain(e), "err"); });
  }
  function draw() {
    var url = sUrl();
    try {
      var q = qrcode(0, "M"); q.addData(url); q.make();
      $("rlQr").innerHTML = q.createSvgTag({ cellSize: 4, margin: 3, scalable: true });
    } catch (e) { $("rlQr").textContent = "QR indisponible : utilisez le lien."; }
    $("rlUrl").value = url; $("rlLnk").style.display = "flex";
    if (location.protocol === "file:") status("Fiche ouverte en local (file://) : ce QR ne fonctionnera pas sur un téléphone.", "err");
    else status(st.got ? st.got + " photo(s) reçue(s) ✔" : "En attente des photos…", st.got ? "ok" : "");
  }
  function start() {
    if (!window.RelayCrypto || !RelayCrypto.ok()) { status("Chiffrement indisponible : ouvrez la fiche en https.", "err"); return Promise.resolve(); }
    status("Création de la session chiffrée…");
    return initDb().then(function (db) {
      var s = loadStored();
      if (s && st.sid !== s.sid) { st.sid = s.sid; st.key = s.key; st.exp = s.exp; draw(); listen(); return; }
      if (st.sid && st.exp > Date.now() + 60000) { draw(); if (!st.unsub) listen(); return; }
      return RelayCrypto.newKey().then(function (key) {
        st.sid = RelayCrypto.newSid(); st.key = key; st.exp = Date.now() + SESSION_H * 3600 * 1000; st.got = 0; st.seen = {};
        return RelayCrypto.enc(key, st.sid + ":m", { v: 1, dossier: dossier(), titre: document.title, sections: sections() });
      }).then(function (m) {
        return db.collection("relay").doc(st.sid).set({ m: m.d, iv: m.iv, exp: firebase.firestore.Timestamp.fromMillis(st.exp), uid: st.uid });
      }).then(function () { store(); draw(); listen(); });
    }).catch(function (e) { st.sid = null; status(explain(e), "err"); });
  }
  function openPanel() { ov.style.display = "flex"; $("rlQr").innerHTML = ""; $("rlLnk").style.display = "none"; start(); }
  function end() {
    var sid = st.sid, db = st.db;
    if (st.unsub) { st.unsub(); st.unsub = null; }
    unstore(); st.sid = null; st.key = null; st.got = 0; st.seen = {};
    ov.style.display = "none";
    if (!sid || !db) return;
    var ref = db.collection("relay").doc(sid);
    ref.collection("photos").get().then(function (s) { return Promise.all(s.docs.map(function (d) { return d.ref.delete(); })); })
      .then(function () { return ref.delete(); }).catch(function () {});
  }
  $("rlHide").onclick = function () { ov.style.display = "none"; };
  $("rlEnd").onclick = end;
  $("rlCp").onclick = function () { var i = $("rlUrl"); i.select(); try { document.execCommand("copy"); $("rlCp").textContent = "Copié ✔"; setTimeout(function () { $("rlCp").textContent = "Copier"; }, 1500); } catch (e) {} };

  /* reprise après rechargement de la page (même onglet) : les photos continuent d'arriver */
  var s0 = loadStored();
  if (s0 && location.protocol !== "file:") { st.sid = s0.sid; st.key = s0.key; st.exp = s0.exp; initDb().then(function () { listen(); }).catch(function () { st.sid = null; }); }
})();
