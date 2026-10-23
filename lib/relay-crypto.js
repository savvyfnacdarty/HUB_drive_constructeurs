/* Relais photos téléphone -> PC : chiffrement de bout en bout (AES-GCM 256, WebCrypto).
   La clé n'existe que dans le QR code (partie # de l'adresse, jamais envoyée à un serveur)
   et en mémoire du PC / du téléphone. Firebase ne stocke que du texte chiffré. */
(function (w) {
  var te = new TextEncoder(), td = new TextDecoder();
  function b64u(buf) {
    var b = new Uint8Array(buf), s = "", i, n = 0x8000;
    for (i = 0; i < b.length; i += n) s += String.fromCharCode.apply(null, b.subarray(i, i + n));
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function unb64u(s) {
    s = String(s).replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    var b = atob(s), u = new Uint8Array(b.length), i;
    for (i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    return u;
  }
  function ok() { return !!(w.crypto && w.crypto.subtle && w.crypto.getRandomValues); }
  function newSid() { return b64u(w.crypto.getRandomValues(new Uint8Array(16))); }
  function newKey() {
    return w.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])
      .then(function (k) { return w.crypto.subtle.exportKey("raw", k); }).then(b64u);
  }
  function importKey(k) { return w.crypto.subtle.importKey("raw", unb64u(k), { name: "AES-GCM" }, false, ["encrypt", "decrypt"]); }
  /* aad = identifiant de session + usage : un message ne peut pas être rejoué dans une autre session */
  function enc(key, aad, obj) {
    return importKey(key).then(function (k) {
      var iv = w.crypto.getRandomValues(new Uint8Array(12));
      return w.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv, additionalData: te.encode(aad) }, k, te.encode(JSON.stringify(obj)))
        .then(function (ct) { return { iv: b64u(iv), d: b64u(ct) }; });
    });
  }
  function dec(key, aad, iv, d) {
    return importKey(key).then(function (k) {
      return w.crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64u(iv), additionalData: te.encode(aad) }, k, unb64u(d));
    }).then(function (pt) { return JSON.parse(td.decode(pt)); });
  }
  w.RelayCrypto = { ok: ok, newSid: newSid, newKey: newKey, enc: enc, dec: dec, b64u: b64u };
})(window);
