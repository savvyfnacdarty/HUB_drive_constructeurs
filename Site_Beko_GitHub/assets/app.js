(function(){
  var B="(?<![a-z0-9])(?:",E=")(?![a-z0-9])";
  var AB=[[new RegExp(B+"slpac"+E,"g"),"seche linge pac"],[new RegExp(B+"lave[\\s-]?linge|lavelinge|ll"+E,"g"),"lave linge"],[new RegExp(B+"seche[\\s-]?linge|sechelinge|sl"+E,"g"),"seche linge"],[new RegExp(B+"lave[\\s-]?vaisselle|lavevaisselle|lv"+E,"g"),"lave vaisselle"]];
  var norm=function(s){s=(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/_/g," ");AB.forEach(function(r){s=s.replace(r[0],r[1]);});return s;};
  var root=document.body.getAttribute("data-root")||"";
  var markSpans=function(scope,terms){var n=0;scope.querySelectorAll(".tl span").forEach(function(sp){var t=norm(sp.textContent);if(terms.some(function(w){return t.indexOf(w)>-1;})){sp.classList.add("hlt");n++;}});return n;};
  var keyTerms=function(terms){var c=terms.filter(function(w){return /\d/.test(w);});return c.length?c:terms.filter(function(w){return w.length>2;});};
  // Filtre des listes de liens dans un document
  document.querySelectorAll("details.links .flt").forEach(function(inp){
    inp.addEventListener("input",function(){var q=norm(inp.value);
      inp.parentNode.querySelectorAll(".card").forEach(function(c){c.style.display=norm(c.textContent).indexOf(q)>-1?"":"none";});});
  });
  // Montrer brièvement les zones cliquables
  document.querySelectorAll(".pg").forEach(function(p){if(p.querySelector(".hot")){p.classList.add("flash");setTimeout(function(){p.classList.remove("flash");},1400);}});
  // Bouton haut de page
  var b=document.createElement("button");b.className="totop";b.setAttribute("aria-label","Haut de page");b.textContent="↑";
  b.onclick=function(){window.scrollTo({top:0,behavior:"smooth"});};document.body.appendChild(b);
  window.addEventListener("scroll",function(){b.classList.toggle("show",window.scrollY>700);},{passive:true});
  // Onglet Manusoft : copier identifiant / mot de passe, afficher le mot de passe
  var say=function(t){var st=document.querySelector(".copied");if(st){st.textContent=t;clearTimeout(say.t);say.t=setTimeout(function(){st.textContent="";},2500);}};
  document.querySelectorAll("[data-copy]").forEach(function(b){b.addEventListener("click",function(){
    var inp=document.getElementById(b.getAttribute("data-copy")),v=inp.value,lab=b.innerHTML;
    var ok=function(){b.innerHTML="✔ Copié";b.classList.add("done");say((inp.type==="password"?"Mot de passe":"Identifiant")+" copié dans le presse-papiers.");setTimeout(function(){b.innerHTML=lab;b.classList.remove("done");},1600);};
    var old=function(){var t=document.createElement("textarea");t.value=v;t.setAttribute("readonly","");t.style.position="fixed";t.style.opacity="0";document.body.appendChild(t);t.select();
      try{document.execCommand("copy");ok();}catch(e){say("Copie impossible : sélectionnez le texte puis Ctrl+C.");}document.body.removeChild(t);};
    if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(v).then(ok,old);}else old();});});
  document.querySelectorAll("[data-reveal]").forEach(function(b){b.addEventListener("click",function(){
    var inp=document.getElementById(b.getAttribute("data-reveal")),show=inp.type==="password";inp.type=show?"text":"password";
    b.setAttribute("aria-pressed",show?"true":"false");b.innerHTML=show?"🙈 Masquer":"👁 Afficher";});});
  document.querySelectorAll(".cred input").forEach(function(i){i.addEventListener("focus",function(){i.select();});});
  // Catalogue
  var cq=document.getElementById("catq");
  if(cq){var fam="";var rows=[].slice.call(document.querySelectorAll(".row"));var cn=document.getElementById("catn");
    var apply=function(){var q=norm(cq.value),n=0;rows.forEach(function(r){var ok=norm(r.textContent).indexOf(q)>-1&&(!fam||r.getAttribute("data-f").split("|").indexOf(fam)>-1);r.style.display=ok?"":"none";if(ok)n++;});cn.textContent=n+" document"+(n>1?"s":"");};
    cq.addEventListener("input",apply);
    document.querySelectorAll(".fchip").forEach(function(c){c.onclick=function(){document.querySelectorAll(".fchip").forEach(function(x){x.classList.remove("on");});c.classList.add("on");fam=c.getAttribute("data-f");apply();};});
  }
  // Pré-remplir la recherche du bandeau
  var params=new URLSearchParams(location.search);var q0=params.get("q")||"";
  document.querySelectorAll(".qs input").forEach(function(i){if(q0)i.value=q0;});
  // Surlignage des termes recherchés dans un document (arrivée depuis la recherche)
  if(q0&&document.querySelector(".pg")){var tq=norm(q0).split(/\s+/).filter(function(w){return w.length>1;});var nb=markSpans(document,keyTerms(tq));
    if(nb&&!location.hash){var f=document.querySelector(".tl span.hlt");if(f)setTimeout(function(){f.scrollIntoView({block:"center"});},300);}}
  // Page de recherche
  var sq=document.getElementById("sq");
  if(sq&&window.HUB_INDEX){
    var res=document.getElementById("sres"),cnt=document.getElementById("scount");
    var escH=function(s){return s.replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};
    var I=window.HUB_INDEX.map(function(d){return {d:d,t:norm(d.t),x:norm(d.x),f:norm(d.f.join(" "))};});
    var snippet=function(d,terms){var x=d.x,nx=norm(x),pos=-1;for(var i=0;i<terms.length;i++){pos=nx.indexOf(terms[i]);if(pos>-1)break;}
      if(pos<0)return escH(x.slice(0,180))+(x.length>180?"…":"");
      var a=Math.max(0,pos-80),s=x.slice(a,a+240),ns=norm(s),out="",last=0,marks=[];
      terms.forEach(function(t){var k=ns.indexOf(t);while(k>-1){marks.push([k,k+t.length]);k=ns.indexOf(t,k+t.length);}});
      marks.sort(function(p,q){return p[0]-q[0];});marks.forEach(function(m){if(m[0]<last)return;out+=escH(s.slice(last,m[0]))+"<mark>"+escH(s.slice(m[0],m[1]))+"</mark>";last=m[1];});
      return (a>0?"…":"")+out+escH(s.slice(last))+"…";};
    var run=function(q){var terms=norm(q).split(/\s+/).filter(Boolean);res.innerHTML="";
      if(!terms.length){cnt.textContent=I.length+" documents indexés (titres et contenu des PDF).";return;}
      var hits=[];I.forEach(function(e){var sc=0,ok=true;terms.forEach(function(t){var inT=e.t.indexOf(t)>-1,inF=e.f.indexOf(t)>-1,inX=e.x.indexOf(t)>-1;if(!(inT||inF||inX))ok=false;sc+=(inT?20:0)+(inF?5:0)+(inX?1+Math.min(9,e.x.split(t).length-1):0);});if(ok)hits.push([sc,e]);});
      hits.sort(function(a,b){return b[0]-a[0];});
      cnt.textContent=hits.length+" résultat"+(hits.length>1?"s":"")+" pour « "+q+" »";
      var qs=encodeURIComponent(q);
      res.innerHTML=hits.slice(0,120).map(function(h){var d=h[1].d;var pv=(d.k==="pdf")?'<button type="button" class="pvb" data-s="'+d.s+'" data-p="'+d.p+'" aria-expanded="false">▸ Aperçu</button>':'';
        return '<div class="hit"><a class="hl" href="doc/'+d.s+'.html?q='+qs+'"><b class="t">'+escH(d.t)+'</b> <span class="chip">'+escH(d.f.join(" · "))+'</span><div class="s">'+snippet(d,terms)+'</div></a>'+pv+'<div class="pvp" hidden></div></div>';}).join("")||'<p class="muted">Aucun document ne correspond. Essayez un terme plus court (ex. « E18 », « GNE », « PAC »).</p>';
      res.querySelectorAll(".pvb").forEach(function(b){b.onclick=function(){togglePreview(b,terms,qs);};});
      var first=res.querySelector(".pvb");if(first&&hits.length<=3)togglePreview(first,terms,qs);};
    var togglePreview=function(b,terms,qs){var panel=b.nextElementSibling,open=b.getAttribute("aria-expanded")==="true";
      if(open){panel.hidden=true;b.setAttribute("aria-expanded","false");b.textContent="▸ Aperçu";return;}
      b.setAttribute("aria-expanded","true");b.textContent="▾ Masquer l'aperçu";panel.hidden=false;
      if(panel.getAttribute("data-done"))return;panel.setAttribute("data-done","1");
      var s=b.getAttribute("data-s"),np=+b.getAttribute("data-p")||1;panel.innerHTML='<p class="muted small">Chargement…</p>';
      var fix=function(el){el.querySelectorAll("[src],[href]").forEach(function(x){["src","href"].forEach(function(a){var v=x.getAttribute(a);if(v&&v.indexOf("../")===0)x.setAttribute(a,v.slice(3));else if(v&&v.charAt(0)==="#")x.setAttribute(a,"doc/"+s+".html"+v);});});};
      var show=function(secs){var kt=keyTerms(terms);
        var sc=secs.map(function(sec,i){var t=norm(sec.querySelector(".tl")?sec.querySelector(".tl").textContent:"");var k=0,a=0;kt.forEach(function(w){if(t.indexOf(w)>-1)k++;});terms.forEach(function(w){if(t.indexOf(w)>-1)a++;});return {sec:sec,sc:k*10+a,i:i};});
        var match=sc.filter(function(o){return o.sc>0;}).sort(function(a,b){return b.sc-a.sc||a.i-b.i;});
        var pick=(match.length?match:sc).slice(0,3).map(function(o){return o.sec;});panel.innerHTML="";
        var head=document.createElement("p");head.className="muted small";
        head.innerHTML=(match.length?match.length+" page"+(match.length>1?"s":"")+" contenant votre recherche":"Aperçu du document")+" · <a href=\"doc/"+s+".html?q="+qs+"#"+pick[0].id+"\">ouvrir le document à cette page →</a>";panel.appendChild(head);
        pick.forEach(function(sec){var c=sec.cloneNode(true);fix(c);c.querySelectorAll("img").forEach(function(i){i.removeAttribute("loading");});markSpans(c,kt);panel.appendChild(c);});
        var h1=panel.querySelector(".tl span.hlt");if(h1)setTimeout(function(){var pr=panel.getBoundingClientRect(),hr=h1.getBoundingClientRect();panel.scrollTop+=hr.top-pr.top-panel.clientHeight/3;},400);};
      fetch("doc/"+s+".html").then(function(r){if(!r.ok)throw 0;return r.text();}).then(function(tx){var dd=new DOMParser().parseFromString(tx,"text/html");show([].slice.call(dd.querySelectorAll(".pg")));})
      .catch(function(){panel.innerHTML="";for(var i=1;i<=Math.min(3,np);i++){var im=document.createElement("img");im.src="img/"+s+"/p"+i+".webp";im.className="pvimg";im.alt="page "+i;panel.appendChild(im);}});};
    sq.value=q0;run(q0);
    var tmr;sq.addEventListener("input",function(){clearTimeout(tmr);tmr=setTimeout(function(){run(sq.value);history.replaceState(null,"","?q="+encodeURIComponent(sq.value));},150);});
    document.getElementById("sform").addEventListener("submit",function(e){e.preventDefault();run(sq.value);});
    sq.focus();
  }
})();
