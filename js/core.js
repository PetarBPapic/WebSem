/* ============================================================
   core.js – Zajednička logika: Autentikacija + Podaci + Korisnici
   Sve čuvamo u localStorage. Korisnici se dodaju kroz
   Admin panel ili direktno u localStorage pod ključevima
   ss_admins i ss_users (format: korisnickoIme:lozinka).
   ============================================================ */

/* ------- Parsiranje "korisnickoIme:lozinka" linija ----------- */
function parsujTekst(tekst) {
  return (tekst || '').split('\n')
    .map(red => red.trim())
    .filter(red => red && !red.startsWith('#'))
    .map(red => {
      const pozicija = red.indexOf(':');
      return pozicija > 0 ? { ime: red.slice(0, pozicija).trim(), lozinka: red.slice(pozicija + 1).trim() } : null;
    })
    .filter(Boolean);
}

/* ------- Čitaj/piši iz localStorage ------------------- */
const PODRAZUMEVANI_ADMIN = 'Admin:Admin';

function dajAdmineTekst()       { return localStorage.getItem('ss_admins') || PODRAZUMEVANI_ADMIN; }
function dajKorisnikeTekst()    { return localStorage.getItem('ss_users')  || ''; }
function sacuvajAdmineTekst(tekst)    { localStorage.setItem('ss_admins', tekst); }
function sacuvajKorisnikeTekst(tekst) { localStorage.setItem('ss_users',  tekst); }

/* ------- Čitanje iz .txt fajlova ------- */
async function inicijalizujKorisnikeIzFajlova() {
  if (!localStorage.getItem('ss_admins')) {
    try {
      const odgovorAdmini = await fetch('data/admins.txt');
      if (odgovorAdmini.ok) {
        const tekstAdmini = await odgovorAdmini.text();
        sacuvajAdmineTekst(tekstAdmini);
      }
    } catch(greska) { console.error("Greška pri učitavanju admins.txt", greska); }
  }
  if (!localStorage.getItem('ss_users')) {
    try {
      const odgovorKorisnici = await fetch('data/users.txt');
      if (odgovorKorisnici.ok) {
        const tekstKorisnici = await odgovorKorisnici.text();
        sacuvajKorisnikeTekst(tekstKorisnici);
      }
    } catch(greska) { console.error("Greška pri učitavanju users.txt", greska); }
  }
}
inicijalizujKorisnikeIzFajlova();

/* ------- Provera kredencijala ------- */
function provjeriPrijavu(korisnickoIme, lozinka) {
  const jeAdmin = parsujTekst(dajAdmineTekst()).some(nalog => nalog.ime === korisnickoIme && nalog.lozinka === lozinka);
  if (jeAdmin) return { uspeh: true, uloga: 'admin' };
  const jeKorisnik = parsujTekst(dajKorisnikeTekst()).some(nalog => nalog.ime === korisnickoIme && nalog.lozinka === lozinka);
  if (jeKorisnik) return { uspeh: true, uloga: 'korisnik' };
  return { uspeh: false };
}

function dodajNalogUTekst(korisnickoIme, lozinka, uloga) {
  if (uloga === 'admin') {
    const noviTekst = dajAdmineTekst() + '\n' + korisnickoIme + ':' + lozinka;
    sacuvajAdmineTekst(noviTekst.trim());
  } else {
    const noviTekst = dajKorisnikeTekst() + '\n' + korisnickoIme + ':' + lozinka;
    sacuvajKorisnikeTekst(noviTekst.trim());
  }
}

/* ------- Sesija ------- */
function sacuvajSesiju(korisnickoIme, uloga) {
  localStorage.setItem('ss_k', korisnickoIme);
  localStorage.setItem('ss_u', uloga);
}
function citajSesiju()   { return { korisnickoIme: localStorage.getItem('ss_k'), uloga: localStorage.getItem('ss_u') }; }
function obrisiSesiju()  { localStorage.removeItem('ss_k'); localStorage.removeItem('ss_u'); }
function odjava()        { obrisiSesiju(); window.location.href = 'prijava.html'; }

function zastiti(potrebnaUloga) {
  const sesija = citajSesiju();
  if (!sesija.korisnickoIme) { window.location.href = 'prijava.html'; return false; }
  if (sesija.uloga !== potrebnaUloga) {
    window.location.href = sesija.uloga === 'admin' ? 'upravljanje.html' : 'korisnik.html';
    return false;
  }
  return true;
}

/* ============================================================
   PODACI – Epizode, Ocene, Komentari
   ============================================================ */
const POCETNE_EPIZODE = {
  epizode: [
    { identifikator: 1, naziv: "Pilot – Početak svega",   datum: "2025-01-10", opis: "Upoznajemo glavne likove i misteriozni grad u kome sve počinje. Prva epizoda postavlja temelje za celu sezonu.", slika: "slike/ep1.jpg" },
    { identifikator: 2, naziv: "Tajne i laži",             datum: "2025-01-17", opis: "Skrivene istine izlaze na videlo kada Ana otkrije šokantno pismo iz prošlosti. Napetost raste.",              slika: "slike/ep2.jpg" },
    { identifikator: 3, naziv: "Noć bez povratka",         datum: "2025-01-24", opis: "Jedna noć menja sve. Likovi donose odluke koje će ih proganjati ostatak sezone.",                                slika: "slike/ep3.jpg" }
  ],
  ocene: [], komentari: [], sledeciIdentifikator: 4, sledeciKomentarId: 1
};

function ucitajBazu() {
  if (!localStorage.getItem('ss_db')) {
    localStorage.setItem('ss_db', JSON.stringify(POCETNE_EPIZODE));
  }
  return JSON.parse(localStorage.getItem('ss_db'));
}
function sacuvajBazu(podaci) { localStorage.setItem('ss_db', JSON.stringify(podaci)); }

function dajEpizode()            { return ucitajBazu().epizode; }
function dajEpizodu(identifikator) { return ucitajBazu().epizode.find(epizoda => epizoda.identifikator === identifikator); }

function dodajEpizodu(epizoda) {
  const podaci = ucitajBazu();
  epizoda.identifikator = podaci.sledeciIdentifikator++;
  podaci.epizode.push(epizoda);
  sacuvajBazu(podaci);
  return epizoda;
}
function izmeniEpizodu(identifikator, novePodaci) {
  const podaci = ucitajBazu();
  const indeks = podaci.epizode.findIndex(epizoda => epizoda.identifikator === identifikator);
  if (indeks < 0) return;
  podaci.epizode[indeks] = { ...podaci.epizode[indeks], ...novePodaci };
  sacuvajBazu(podaci);
}
function obrisiEpizodu(identifikator) {
  const podaci = ucitajBazu();
  podaci.epizode   = podaci.epizode.filter(epizoda => epizoda.identifikator !== identifikator);
  podaci.ocene     = podaci.ocene.filter(ocena => ocena.epizodaId !== identifikator);
  podaci.komentari = podaci.komentari.filter(komentar => komentar.epizodaId !== identifikator);
  sacuvajBazu(podaci);
}

function dajOcenuKorisnika(epizodaId, korisnickoIme) {
  return ucitajBazu().ocene.find(ocena => ocena.epizodaId === epizodaId && ocena.korisnickoIme === korisnickoIme) || null;
}
function dajProsecnuOcenu(epizodaId) {
  const ocene = ucitajBazu().ocene.filter(ocena => ocena.epizodaId === epizodaId);
  return ocene.length
    ? { prosek: (ocene.reduce((zbir, ocena) => zbir + ocena.vrednost, 0) / ocene.length).toFixed(1), broj: ocene.length }
    : { prosek: 0, broj: 0 };
}
function postaviOcenu(epizodaId, korisnickoIme, vrednost) {
  const podaci = ucitajBazu();
  const indeks = podaci.ocene.findIndex(ocena => ocena.epizodaId === epizodaId && ocena.korisnickoIme === korisnickoIme);
  if (indeks >= 0) {
    podaci.ocene[indeks].vrednost = vrednost;
  } else {
    podaci.ocene.push({ epizodaId, korisnickoIme, vrednost });
  }
  sacuvajBazu(podaci);
}

function dajKomentare(epizodaId) {
  return ucitajBazu().komentari.filter(komentar => komentar.epizodaId === epizodaId);
}
function dajKomentarKorisnika(epizodaId, korisnickoIme) {
  return ucitajBazu().komentari.find(komentar => komentar.epizodaId === epizodaId && komentar.korisnickoIme === korisnickoIme) || null;
}
function postaviKomentar(epizodaId, korisnickoIme, tekstKomentara) {
  const podaci = ucitajBazu();
  const indeks = podaci.komentari.findIndex(komentar => komentar.epizodaId === epizodaId && komentar.korisnickoIme === korisnickoIme);
  const datum = new Date().toLocaleDateString('sr-RS');
  if (indeks >= 0) {
    podaci.komentari[indeks].tekstKomentara = tekstKomentara;
    podaci.komentari[indeks].datum = datum;
    podaci.komentari[indeks].izmenjen = true;
  } else {
    podaci.komentari.push({ identifikator: podaci.sledeciKomentarId++, epizodaId, korisnickoIme, tekstKomentara, datum });
  }
  sacuvajBazu(podaci);
}
function obrisiKomentar(identifikator) {
  const podaci = ucitajBazu();
  podaci.komentari = podaci.komentari.filter(komentar => komentar.identifikator !== identifikator);
  sacuvajBazu(podaci);
}

function dajStatistike() {
  const podaci = ucitajBazu();
  const brojOcena = podaci.ocene.length;
  const prosecnaOcena = brojOcena
    ? (podaci.ocene.reduce((zbir, ocena) => zbir + ocena.vrednost, 0) / brojOcena).toFixed(1)
    : 0;
  return {
    brojEpizoda: podaci.epizode.length,
    brojKomentara: podaci.komentari.length,
    brojOcena: brojOcena,
    prosecnaOcena: prosecnaOcena
  };
}

/* ------- Obaveštenje (toast) ------------------------------------- */
function prikaziObavestenje(poruka, boja) {
  const elementObavestenja = document.getElementById('obavestenje');
  if (!elementObavestenja) return;
  elementObavestenja.textContent = poruka;
  elementObavestenja.style.borderColor = boja || 'var(--zlato)';
  elementObavestenja.style.color       = boja || 'var(--zlato)';
  elementObavestenja.style.opacity     = '1';
  elementObavestenja.style.transform   = 'translateY(0)';
  clearTimeout(elementObavestenja._tajmer);
  elementObavestenja._tajmer = setTimeout(() => {
    elementObavestenja.style.opacity   = '0';
    elementObavestenja.style.transform = 'translateY(20px)';
  }, 3500);
}

/* ------- Tema i veličina fonta (pristupačnost) ------------- */
function primeniTemu() {
  const trenutnaTema = localStorage.getItem('ss_tema') || 'tamna';
  document.documentElement.setAttribute('data-tema', trenutnaTema);
}
function togglujTemu() {
  const novaTema = (localStorage.getItem('ss_tema') || 'tamna') === 'tamna' ? 'svetla' : 'tamna';
  localStorage.setItem('ss_tema', novaTema);
  primeniTemu();
  if (typeof osveziIkonicuTeme === 'function') {
    osveziIkonicuTeme(novaTema === 'tamna');
  }
}

function primeniVelicinu() {
  const velicinaFonta = parseInt(localStorage.getItem('ss_font') || '16');
  document.documentElement.style.fontSize = velicinaFonta + 'px';
}
function povecajFont() {
  const novaVelicina = Math.min(22, parseInt(localStorage.getItem('ss_font') || '16') + 2);
  localStorage.setItem('ss_font', novaVelicina);
  primeniVelicinu();
}
function smanjiFont() {
  const novaVelicina = Math.max(12, parseInt(localStorage.getItem('ss_font') || '16') - 2);
  localStorage.setItem('ss_font', novaVelicina);
  primeniVelicinu();
}

primeniTemu();
primeniVelicinu();

/* ============================================================
   LOKALIZACIJA
   ============================================================ */
function dajVrednostPoKljucu(objekat, putanja) {
  return putanja.split('.').reduce((trenutni, kljuc) => (trenutni ? trenutni[kljuc] : null), objekat);
}

function ucitajJezik() {
  const sacuvaniJezik = localStorage.getItem('ss_jezik') || 'sr';
  primeniJezik(sacuvaniJezik);
}

function postaviJezik(kodJezika) {
  primeniJezik(kodJezika);
}

function primeniJezik(kodJezika) {
  if (!PREVODI[kodJezika]) return;
  localStorage.setItem('ss_jezik', kodJezika);
  const trenutniPrevodi = PREVODI[kodJezika];

  document.querySelectorAll('[data-i18n]').forEach(element => {
    const kljuc = element.getAttribute('data-i18n');
    const vrednost = dajVrednostPoKljucu(trenutniPrevodi, kljuc);
    if (vrednost) element.textContent = vrednost;
  });

  document.querySelectorAll('[data-i18n-html]').forEach(element => {
    const kljuc = element.getAttribute('data-i18n-html');
    const vrednost = dajVrednostPoKljucu(trenutniPrevodi, kljuc);
    if (vrednost) element.innerHTML = vrednost;
  });

  const dugmeSrpski = document.getElementById('btn-sr');
  const dugmeEngleski = document.getElementById('btn-en');
  if (dugmeSrpski)  dugmeSrpski.classList.toggle('aktivan-jezik',  kodJezika === 'sr');
  if (dugmeEngleski) dugmeEngleski.classList.toggle('aktivan-jezik', kodJezika === 'en');
  document.documentElement.lang = kodJezika;
}

const PREVODI = {
  "sr": {
    "title": "SerijaStar – Početna",
    "nav": {
      "pocetna": "Početna", "onama": "O nama", "epizode": "Epizode", "kontakt": "Kontakt",
      "prijava": "Prijavi se", "odjava": "Odjava", "admin": "Admin Panel",
      "mega_najnovije": "Najnovije", "mega_ocenjivanje": "Ocenjivanje", "mega_top10": "Top 10 lista",
      "mega_tim": "Naš tim", "mega_misija": "Misija", "mega_kontakt": "Kontakt forma",
      "mega_mapa": "Lokacija", "mega_dokument": "Dokumentacija"
    },
    "muzika": {
      "svira": "Sada svira", "artist": "SerijaStar Soundtrack", "zatvori": "Zatvori plejer"
    },
    "hero": {
      "badge": "✦ Nova sezona dostupna",
      "naslov": "Otkrij. Gledaj.<br><span class='zlatni-tekst'>Oceni.</span>",
      "opis": "Tvoje mišljenje oblikuje ranglistu. Oceni epizode, ostavi komentar i pridruži se zajednici ljubitelja serija.",
      "btn1": "Pregledaj epizode", "btn2": "Postani član"
    },
    "stat": {
      "epizode": "Epizoda", "ocene": "Ocena", "prosek": "Prosečna ocena", "komentari": "Komentara"
    },
    "sekcije": {
      "najnovije": "Najnovije epizode", "vidi_sve": "Vidi sve",
      "dokumenti": "Dokumentacija", "preuzmi_vodic": "Preuzmi korisnički vodič",
      "pravilnik": "Pravilnik korišćenja", "api_docs": "Posebna preporuka",
      "o_platformi": "platformi", "saznaj_vise": "Saznaj više",
      "top5": "Top 5 epizoda", "vidi_top10": "Vidi Top 10"
    },
    "video": {
      "naslov": "Video pregled", "mp4_naslov": "Trejler serije", "youtube": "YouTube pregled"
    },
    "footer": {
      "opis": "Platforma za ljubitelje TV serija. Ocenjuj, komentariši i otkrivaj skrivene bisere televizije.",
      "nav_hd": "Navigacija", "nalog_hd": "Nalog",
      "copy": "© 2025 SerijaStar. Sva prava zadržana.",
      "ljubav": "Izrađeno sa ljubavlju za ljubitelje serija"
    },
    "prijava": {
      "admin_tab": "Admin", "korisnik_tab": "Korisnik",
      "korisnicko_ime": "Korisničko ime", "lozinka": "Lozinka",
      "dugme_admin": "Prijavi se kao Admin", "dugme_korisnik": "Prijavi se kao Korisnik",
      "greska": "Netačno korisničko ime ili lozinka.",
      "prazno": "Molimo unesite korisničko ime i lozinku."
    }
  },
  "en": {
    "title": "SerijaStar – Home",
    "nav": {
      "pocetna": "Home", "onama": "About Us", "epizode": "Episodes", "kontakt": "Contact",
      "prijava": "Sign In", "odjava": "Sign Out", "admin": "Admin Panel",
      "mega_najnovije": "Latest", "mega_ocenjivanje": "Rating", "mega_top10": "Top 10 List",
      "mega_tim": "Our Team", "mega_misija": "Mission", "mega_kontakt": "Contact Form",
      "mega_mapa": "Location", "mega_dokument": "Documentation"
    },
    "muzika": {
      "svira": "Now Playing", "artist": "SerijaStar Soundtrack", "zatvori": "Close Player"
    },
    "hero": {
      "badge": "✦ New season available",
      "naslov": "Discover. Watch.<br><span class='zlatni-tekst'>Rate.</span>",
      "opis": "Your opinion shapes the ranking list. Rate episodes, leave comments and join the community of series lovers.",
      "btn1": "Browse Episodes", "btn2": "Become a Member"
    },
    "stat": {
      "epizode": "Episodes", "ocene": "Ratings", "prosek": "Average Rating", "komentari": "Comments"
    },
    "sekcije": {
      "najnovije": "Latest Episodes", "vidi_sve": "View All",
      "dokumenti": "Documentation", "preuzmi_vodic": "Download User Guide",
      "pravilnik": "Terms of Service", "api_docs": "Special Recommendation",
      "o_platformi": "Platform", "saznaj_vise": "Learn More",
      "top5": "Top 5 Episodes", "vidi_top10": "View Top 10"
    },
    "video": {
      "naslov": "Video Preview", "mp4_naslov": "Series Trailer", "youtube": "YouTube Preview"
    },
    "footer": {
      "opis": "Platform for TV series lovers. Rate, comment and discover hidden gems of television.",
      "nav_hd": "Navigation", "nalog_hd": "Account",
      "copy": "© 2025 SerijaStar. All rights reserved.",
      "ljubav": "Made with love for series fans"
    },
    "prijava": {
      "admin_tab": "Admin", "korisnik_tab": "User",
      "korisnicko_ime": "Username", "lozinka": "Password",
      "dugme_admin": "Login as Admin", "dugme_korisnik": "Login as User",
      "greska": "Incorrect username or password.",
      "prazno": "Please enter username and password."
    }
  }
};
