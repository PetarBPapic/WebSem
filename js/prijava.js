/* ================================================================
   prijava.js – Logika stranice Prijava (prijava.html)
   Zavisi od: core.js
================================================================ */

/* ── Preusmeri ako je već ulogovan ────────────────────────────── */
(function() {
  const ses = citajSesiju();
  if (ses.k && ses.u) {
    window.location.href = ses.u === 'admin' ? 'upravljanje.html' : 'korisnik.html';
  }
})();

/* ── Tema ikona ───────────────────────────────────────────────── */
const tamna = (localStorage.getItem('ss_tema') || 'tamna') === 'tamna';
document.getElementById('tema-ikona').innerHTML =
  tamna ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';

/* ── Aktivni tab ──────────────────────────────────────────────── */
let aktivniTab = 'admin';

function prikaziTab(tab) {
  aktivniTab = tab;
  document.querySelectorAll('.tab-sadrzaj').forEach(t => t.classList.remove('vidljiv-blok'));
  document.querySelectorAll('.tab-dugme').forEach(d => {
    d.classList.remove('ak');
    d.setAttribute('aria-selected', 'false');
  });
  document.getElementById('tab-' + tab).classList.add('vidljiv-blok');
  document.getElementById('tb-' + tab).classList.add('ak');
  document.getElementById('tb-' + tab).setAttribute('aria-selected', 'true');
  document.getElementById('greska').style.display = 'none';
}

/* ── Prijava ──────────────────────────────────────────────────── */
function prijava() {
  const poljeKor = document.getElementById(aktivniTab === 'admin' ? 'a-korisnicko' : 'u-korisnicko');
  const poljeLoz = document.getElementById(aktivniTab === 'admin' ? 'a-lozinka'    : 'u-lozinka');
  const korisnik = poljeKor.value.trim();
  const lozinka  = poljeLoz.value;
  const greskaEl = document.getElementById('greska');

  poljeKor.classList.remove('greska-p');
  poljeLoz.classList.remove('greska-p');

  if (!korisnik) { poljeKor.classList.add('greska-p'); prikaziGresku('Unesite korisničko ime.'); return; }
  if (!lozinka)  { poljeLoz.classList.add('greska-p'); prikaziGresku('Unesite lozinku.');        return; }

  const rezultat = provjeriLogin(korisnik, lozinka);
  if (!rezultat.ok) {
    poljeKor.classList.add('greska-p');
    poljeLoz.classList.add('greska-p');
    prikaziGresku('Pogrešno korisničko ime ili lozinka.');
    return;
  }
  if (rezultat.uloga !== aktivniTab) {
    prikaziGresku(aktivniTab === 'admin'
      ? 'Ovaj nalog nije admin. Koristite tab „Korisnik".'
      : 'Ovaj nalog je admin. Koristite tab „Admin".');
    return;
  }

  sacuvajSesiju(korisnik, rezultat.uloga);
  window.location.href = rezultat.uloga === 'admin' ? 'upravljanje.html' : 'korisnik.html';
}

function prikaziGresku(poruka) {
  const el = document.getElementById('greska');
  el.textContent = poruka;
  el.style.display = 'block';
}

/* ── Animirane čestice ────────────────────────────────────────── */
(function kreirajCestice() {
  const kontejner = document.getElementById('cestice-k');
  for (let i = 0; i < 30; i++) {
    const cestica = document.createElement('div');
    cestica.className = 'cestica';
    cestica.style.cssText = `
      left: ${Math.random() * 100}vw;
      width:  ${Math.random() * 3 + 1}px;
      height: ${Math.random() * 3 + 1}px;
      animation-duration: ${Math.random() * 12 + 8}s;
      animation-delay:    ${Math.random() * 10}s;
      background: ${i % 3 === 0 ? 'var(--srebro)' : 'var(--zlato)'};
    `;
    kontejner.appendChild(cestica);
  }
})();

/* ── Lucide ikone ─────────────────────────────────────────────── */
lucide.createIcons();
