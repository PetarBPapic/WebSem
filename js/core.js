/* ============================================================
   core.js – Zajednička logika: Auth + Podaci + Korisnici
   Sve čuvamo u localStorage. Korisnici se dodaju kroz
   Admin panel ili direktno u localStorage pod ključevima
   ss_admins i ss_users (format identičan .txt fajlu).
   ============================================================ */

/* ------- POČETNI SADRŽAJ .txt FAJLOVA (seed) -------------- */
const SEED_ADMINS = `Admin:Admin\nsuperadmin:super123`;
const SEED_USERS  = `User:User\nmarko:marko123\nana:ana456\npera:pera\np123:p123`;

/* ------- Parsiranje "username:password" linija ------------- */
function parsujTxt(txt) {
  return (txt || '').split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf(':'); return i>0 ? {u:l.slice(0,i).trim(), p:l.slice(i+1).trim()} : null; })
    .filter(Boolean);
}

/* ------- Čitaj/piši txt iz localStorage ------------------- */
function dajAdmineTxt()    { return localStorage.getItem('ss_admins') || SEED_ADMINS; }
function dajKorisnikeTxt() { return localStorage.getItem('ss_users')  || SEED_USERS;  }
function sacuvajAdmineTxt(txt)    { localStorage.setItem('ss_admins', txt); }
function sacuvajKorisnikeTxt(txt) { localStorage.setItem('ss_users',  txt); }

/* Inicijalizacija – upiši seed ako nema ništa */
if (!localStorage.getItem('ss_admins')) sacuvajAdmineTxt(SEED_ADMINS);
if (!localStorage.getItem('ss_users'))  sacuvajKorisnikeTxt(SEED_USERS);

/* ------- Provera kredencijala ------------------------------ */
function provjeriLogin(username, password) {
  const adm = parsujTxt(dajAdmineTxt()).some(a => a.u===username && a.p===password);
  if (adm) return {ok:true, uloga:'admin'};
  const usr = parsujTxt(dajKorisnikeTxt()).some(u => u.u===username && u.p===password);
  if (usr)  return {ok:true, uloga:'user'};
  return {ok:false};
}

/* ------- Dodaj novog korisnika (poziva Admin panel) -------- */
function dodajKorisnikaTxt(username, password, uloga) {
  if (uloga === 'admin') {
    const txt = dajAdmineTxt() + '\n' + username + ':' + password;
    sacuvajAdmineTxt(txt.trim());
  } else {
    const txt = dajKorisnikeTxt() + '\n' + username + ':' + password;
    sacuvajKorisnikeTxt(txt.trim());
  }
}

/* ------- Sesija ------------------------------------------- */
function sacuvajSesiju(u, uloga) { localStorage.setItem('ss_k',u); localStorage.setItem('ss_u',uloga); }
function citajSesiju()           { return {k:localStorage.getItem('ss_k'), u:localStorage.getItem('ss_u')}; }
function obrisiSesiju()          { localStorage.removeItem('ss_k'); localStorage.removeItem('ss_u'); }
function odjava()                { obrisiSesiju(); window.location.href='index.html'; }

/* ------- Zaštita stranice ---------------------------------- */
function zastiti(potrebnaUloga) {
  const s = citajSesiju();
  if (!s.k) { window.location.href='index.html'; return false; }
  if (s.u !== potrebnaUloga) {
    window.location.href = s.u==='admin' ? 'admin.html' : 'user.html';
    return false;
  }
  return true;
}

/* ============================================================
   PODACI – Epizode, Ocene, Komentari
   ============================================================ */
const SEED_EPIZODE = {
  epizode:[
    {id:1, naziv:"Pilot – Početak svega",        datum:"2025-01-10", opis:"Upoznajemo glavne likove i misteriozni grad u kome sve počinje. Prva epizoda postavlja temelje za celu sezonu.", slika:"slike/ep1.jpg"},
    {id:2, naziv:"Tajne i laži",                  datum:"2025-01-17", opis:"Skrivene istine izlaze na videlo kada Ana otkrije šokantno pismo iz prošlosti. Napetost raste.", slika:"slike/ep2.jpg"},
    {id:3, naziv:"Noć bez povratka",              datum:"2025-01-24", opis:"Jedna noć menja sve. Likovi donose odluke koje će ih proganjati ostatak sezone.", slika:"slike/ep3.jpg"}
  ],
  ocene:[], komentari:[], nid:4, kid:1
};

function ucitajDB()   { if(!localStorage.getItem('ss_db')) localStorage.setItem('ss_db', JSON.stringify(SEED_EPIZODE)); return JSON.parse(localStorage.getItem('ss_db')); }
function sacuvajDB(d) { localStorage.setItem('ss_db', JSON.stringify(d)); }

function dajEpizode()      { return ucitajDB().epizode; }
function dajEpizodu(id)    { return ucitajDB().epizode.find(e=>e.id===id); }

function dodajEpizodu(e)   { const d=ucitajDB(); e.id=d.nid++; d.epizode.push(e); sacuvajDB(d); return e; }
function izmeniEpizodu(id,n){ const d=ucitajDB(); const i=d.epizode.findIndex(e=>e.id===id); if(i<0)return; d.epizode[i]={...d.epizode[i],...n}; sacuvajDB(d); }
function obrisiEpizodu(id) { const d=ucitajDB(); d.epizode=d.epizode.filter(e=>e.id!==id); d.ocene=d.ocene.filter(o=>o.eid!==id); d.komentari=d.komentari.filter(k=>k.eid!==id); sacuvajDB(d); }

function dajOcenuK(eid,k)  { return ucitajDB().ocene.find(o=>o.eid===eid&&o.k===k)||null; }
function dajProsek(eid)    { const o=ucitajDB().ocene.filter(o=>o.eid===eid); return o.length ? {p:(o.reduce((a,x)=>a+x.o,0)/o.length).toFixed(1),n:o.length} : {p:0,n:0}; }
function postaviOcenu(eid,k,o){ const d=ucitajDB(); const i=d.ocene.findIndex(x=>x.eid===eid&&x.k===k); if(i>=0)d.ocene[i].o=o; else d.ocene.push({eid,k,o}); sacuvajDB(d); }

function dajKomentare(eid) { return ucitajDB().komentari.filter(k=>k.eid===eid); }
function dajKomentarK(eid,k){ return ucitajDB().komentari.find(x=>x.eid===eid&&x.k===k)||null; }
function postaviKomentar(eid,k,t){ const d=ucitajDB(); const i=d.komentari.findIndex(x=>x.eid===eid&&x.k===k); const dat=new Date().toLocaleDateString('sr-RS'); if(i>=0){d.komentari[i].t=t;d.komentari[i].dat=dat;d.komentari[i].izm=true;}else{d.komentari.push({id:d.kid++,eid,k,t,dat});} sacuvajDB(d); }
function obrisiKomentar(id){ const d=ucitajDB(); d.komentari=d.komentari.filter(k=>k.id!==id); sacuvajDB(d); }

function dajStatistike()   { const d=ucitajDB(); const n=d.ocene.length; const p=n?((d.ocene.reduce((a,x)=>a+x.o,0))/n).toFixed(1):0; return {ep:d.epizode.length,kom:d.komentari.length,oc:n,p}; }

/* ------- Toast helper ------------------------------------- */
function prikaziToast(msg, boja) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.borderColor = boja||'var(--zlato)';
  t.style.color = boja||'var(--zlato)';
  t.style.opacity = '1';
  t.style.transform = 'translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(20px)'; },3500);
}

/* ------- Tema i font veličina (pristupačnost) ------------- */
function primeniTemu() {
  const tema = localStorage.getItem('ss_tema') || 'tamna';
  document.documentElement.setAttribute('data-tema', tema);
}
function togglujTemu() {
  const nova = (localStorage.getItem('ss_tema')||'tamna') === 'tamna' ? 'svetla' : 'tamna';
  localStorage.setItem('ss_tema', nova);
  primeniTemu();
  const btn = document.getElementById('btn-tema');
  if (btn) btn.textContent = nova === 'tamna' ? '☀️' : '🌙';
}

function primeniFontVelicinu() {
  const vel = parseInt(localStorage.getItem('ss_font') || '16');
  document.documentElement.style.fontSize = vel + 'px';
}
function povecajFont() { const v=Math.min(22,parseInt(localStorage.getItem('ss_font')||'16')+2); localStorage.setItem('ss_font',v); primeniFontVelicinu(); }
function smanjiFont()  { const v=Math.max(12,parseInt(localStorage.getItem('ss_font')||'16')-2); localStorage.setItem('ss_font',v); primeniFontVelicinu(); }

// Primeni pri učitavanju
primeniTemu();
primeniFontVelicinu();

/* ============================================================
   VIŠEJEZIČNOST – SR / EN
   Prevodi su ugradjeni direktno – radi i na file:// protokolu.
   ============================================================ */
var LANG = {
  "sr": {
    "nav": {
      "pocetna": "Početna", "onama": "O nama", "epizode": "Epizode",
      "kontakt": "Kontakt", "prijava": "Prijavi se", "odjava": "Odjava",
      "admin": "Admin Panel",
      "mega_ocenjivanje": "Ocenjivanje", "mega_top10": "Top 10 lista",
      "mega_najnovije": "Najnovije", "mega_onama": "O nama",
      "mega_tim": "Naš tim", "mega_misija": "Misija",
      "mega_kontakt": "Kontakt forma", "mega_mapa": "Lokacija",
      "mega_dokument": "Dokumentacija"
    },
    "hero": {
      "badge": "✦ Nova sezona dostupna",
      "naslov": "Otkrij. Gledaj.<br><span class=\'zlatni-tekst\'>Oceni.</span>",
      "opis": "Tvoje mišljenje oblikuje rang listu. Oceni epizode, ostavi komentar i pridruži se zajednici ljubitelja serija.",
      "btn1": "📺 Pregledaj epizode", "btn2": "✦ Postani član"
    },
    "stat": {
      "epizode": "Epizoda", "ocene": "Ocena",
      "prosek": "Prosečna ocena", "komentari": "Komentara"
    },
    "sekcije": {
      "najnovije": "Najnovije epizode", "vidi_sve": "Vidi sve →",
      "video": "Video pregled", "o_platformi": "O platformi",
      "saznaj_vise": "Saznaj više →", "top5": "🏆 Top 5 epizoda",
      "vidi_top10": "Vidi Top 10 →", "muzika": "Muzika",
      "dokumenti": "Dokumentacija",
      "preuzmi_vodic": "📄 Preuzmi korisnički vodič",
      "pravilnik": "📋 Pravilnik korišćenja",
      "api_docs": "🔗 API dokumentacija"
    },
    "video": {
      "naslov": "Pogledaj kako funkcioniše SerijaStar",
      "podnaslov": "Promo video", "mp4_naslov": "Trejler serije",
      "youtube": "YouTube pregled"
    },
    "muzika": {
      "svira": "Sada svira", "artist": "SerijaStar Soundtrack",
      "zatvori": "Zatvori plejer", "pusti": "Pusti muziku"
    },
    "footer": {
      "opis": "Platforma za ljubitelje TV serija. Ocenjuj, komentariši i otkrivaj skrivene bisere televizije.",
      "nav_hd": "Navigacija", "nalog_hd": "Nalog",
      "copy": "© 2025 SerijaStar. Sva prava zadržana.",
      "ljubav": "Izrađeno sa ♥ za ljubitelje serija"
    },
    "login": {
      "admin_tab": "Admin", "user_tab": "Korisnik",
      "username": "Korisničko ime", "password": "Lozinka",
      "btn_admin": "Prijavi se kao Admin", "btn_user": "Prijavi se kao Korisnik",
      "greska": "Pogrešno korisničko ime ili lozinka.",
      "prazno": "Unesite korisničko ime i lozinku.",
      "demo": "Demo nalozi"
    },
    "pristupacnost": {
      "tema_tamna": "Tamna tema", "tema_svetla": "Svetla tema",
      "font_vece": "Povećaj font", "font_manje": "Smanji font"
    }
  },
  "en": {
    "nav": {
      "pocetna": "Home", "onama": "About", "epizode": "Episodes",
      "kontakt": "Contact", "prijava": "Login", "odjava": "Logout",
      "admin": "Admin Panel",
      "mega_ocenjivanje": "Rating", "mega_top10": "Top 10 List",
      "mega_najnovije": "Latest", "mega_onama": "About Us",
      "mega_tim": "Our Team", "mega_misija": "Mission",
      "mega_kontakt": "Contact Form", "mega_mapa": "Location",
      "mega_dokument": "Documentation"
    },
    "hero": {
      "badge": "✦ New season available",
      "naslov": "Discover. Watch.<br><span class=\'zlatni-tekst\'>Rate.</span>",
      "opis": "Your opinion shapes the rankings. Rate episodes, leave a comment and join the community of series lovers.",
      "btn1": "📺 Browse episodes", "btn2": "✦ Become a member"
    },
    "stat": {
      "epizode": "Episodes", "ocene": "Ratings",
      "prosek": "Average rating", "komentari": "Comments"
    },
    "sekcije": {
      "najnovije": "Latest episodes", "vidi_sve": "View all →",
      "video": "Video preview", "o_platformi": "About the platform",
      "saznaj_vise": "Learn more →", "top5": "🏆 Top 5 episodes",
      "vidi_top10": "View Top 10 →", "muzika": "Music",
      "dokumenti": "Documentation",
      "preuzmi_vodic": "📄 Download user guide",
      "pravilnik": "📋 Terms of use",
      "api_docs": "🔗 API documentation"
    },
    "video": {
      "naslov": "See how SerijaStar works",
      "podnaslov": "Promo video", "mp4_naslov": "Series trailer",
      "youtube": "YouTube preview"
    },
    "muzika": {
      "svira": "Now playing", "artist": "SerijaStar Soundtrack",
      "zatvori": "Close player", "pusti": "Play music"
    },
    "footer": {
      "opis": "Platform for TV series lovers. Rate, comment and discover hidden gems of television.",
      "nav_hd": "Navigation", "nalog_hd": "Account",
      "copy": "© 2025 SerijaStar. All rights reserved.",
      "ljubav": "Made with ♥ for series lovers"
    },
    "login": {
      "admin_tab": "Admin", "user_tab": "User",
      "username": "Username", "password": "Password",
      "btn_admin": "Login as Admin", "btn_user": "Login as User",
      "greska": "Incorrect username or password.",
      "prazno": "Please enter username and password.",
      "demo": "Demo accounts"
    },
    "pristupacnost": {
      "tema_tamna": "Dark theme", "tema_svetla": "Light theme",
      "font_vece": "Increase font", "font_manje": "Decrease font"
    }
  }
};

function ucitajJezik() {
  // Prevodi su vec ugradjeni u LANG - nema potrebe za fetch
  const sacuvan = localStorage.getItem('ss_jezik') || 'sr';
  primeniJezik(sacuvan);
}

function primeniJezik(kod) {
  if (!LANG[kod]) return;
  localStorage.setItem('ss_jezik', kod);
  const t = LANG[kod];

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const kljuc = el.getAttribute('data-i18n');
    const vrednost = dajVrednost(t, kljuc);
    if (vrednost) el.textContent = vrednost;
  });

  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const kljuc = el.getAttribute('data-i18n-html');
    const vrednost = dajVrednost(t, kljuc);
    if (vrednost) el.innerHTML = vrednost;
  });

  const btnSr = document.getElementById('btn-sr');
  const btnEn = document.getElementById('btn-en');
  if (btnSr) btnSr.classList.toggle('aktivan-lang', kod === 'sr');
  if (btnEn) btnEn.classList.toggle('aktivan-lang', kod === 'en');

  document.documentElement.lang = kod;
}

function dajVrednost(obj, put) {
  return put.split('.').reduce((o, k) => o?.[k], obj) || null;
}

function postaviJezik(kod) {
  primeniJezik(kod);
}
