/* ================================================================
   korisnik.js – Logika stranice Epizode (korisnik.html)
   Zavisi od: core.js
================================================================ */

/* ── Sesija ──────────────────────────────────────────────────── */
const sesija   = citajSesiju();
const ulogovan = !!(sesija.k && sesija.u);

/* ── Inicijalizacija teme ──────────────────────────────────────── */
document.getElementById('dug-tema').textContent =
  (localStorage.getItem('ss_tema') || 'tamna') === 'tamna' ? '☀️' : '🌙';

/* ── Hamburger meni ───────────────────────────────────────────── */
function togglujMeni() {
  const veze = document.getElementById('nav-veze');
  const ham  = document.getElementById('hamburger');
  const otvoren = veze.classList.toggle('otvoreni');
  ham.classList.toggle('otvoren', otvoren);
  ham.setAttribute('aria-expanded', otvoren);
}

/* ── Nav zona: prijavljeni korisnik ili dugme Prijavi se ──────── */
const navZona = document.getElementById('nav-zona');
if (ulogovan) {
  navZona.innerHTML = `
    <span class="nav-uloga" aria-label="Ulogovan korisnik">
      ${sesija.u === 'admin' ? '👑' : '👤'} ${sesija.k}
    </span>
    <button class="dugme-odjava" onclick="odjava()" aria-label="Odjava">Odjava</button>`;
  document.getElementById('gost-baner').style.display = 'none';
  document.getElementById('pozdrav').textContent = `✨ Dobrodošao/la, ${sesija.k}!`;
  document.getElementById('podnaslov').textContent = 'Oceni, komentariši, podeli utiske';
} else {
  navZona.innerHTML = `
    <a href="prijava.html" class="dugme-prim" data-i18n="nav.prijava">Prijavi se</a>`;
}

/* ── XSS zaštita ─────────────────────────────────────────────── */
function esc(str) {
  const el = document.createElement('div');
  el.appendChild(document.createTextNode(str));
  return el.innerHTML;
}

/* ── Modal za prijavu ─────────────────────────────────────────── */
function otvoriModal() {
  document.getElementById('modal-prijava').classList.add('vidljiv-blok');
}
function zatvoriModal() {
  document.getElementById('modal-prijava').classList.remove('vidljiv-blok');
}
document.getElementById('modal-prijava').addEventListener('click', function(e) {
  if (e.target === this) zatvoriModal();
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') zatvoriModal();
});

/* ── Rang lista ───────────────────────────────────────────────── */
function renderujRang(limit) {
  const rangirane = dajEpizode()
    .map(ep => ({ ep, oc: dajProsek(ep.id) }))
    .filter(x => x.oc.n > 0)
    .sort((a, b) => b.oc.p !== a.oc.p ? b.oc.p - a.oc.p : b.oc.n - a.oc.n)
    .slice(0, limit);

  const kontejner = document.getElementById('rang10');

  if (!rangirane.length) {
    kontejner.innerHTML = `
      <div class="rang-prazno">
        <div aria-hidden="true" style="font-size:2rem;margin-bottom:8px">📊</div>
        <p>Nema ocenjenih epizoda.</p>
        <p style="font-size:.8rem;margin-top:6px">Budi prvi koji ocenjuje!</p>
      </div>`;
    return;
  }

  function klasaMesta(i) {
    return i === 0 ? 'm1' : i === 1 ? 'm2' : i === 2 ? 'm3' : 'mo';
  }
  function oznakaKlase(i) {
    return i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
  }
  function zvezdice(prosek) {
    return '★'.repeat(Math.round(prosek)) + '☆'.repeat(5 - Math.round(prosek));
  }

  kontejner.innerHTML = rangirane.map(({ ep, oc }, i) => `
    <div class="rang-stavka" role="listitem">
      <div class="rang-redni-broj ${klasaMesta(i)}" aria-label="Mesto ${i + 1}">${oznakaKlase(i)}</div>
      <div class="rang-info">
        <div class="rang-naziv" title="${esc(ep.naziv)}">${esc(ep.naziv)}</div>
        <div class="rang-datum">📅 ${ep.datum}</div>
      </div>
      <div class="rang-ocena-blok" aria-label="Ocena ${oc.p}">
        <div class="rang-ocena-broj">${oc.p}</div>
        <div class="rang-ocena-zvezdice">${zvezdice(oc.p)}</div>
        <div class="rang-ocena-glasovi">${oc.n} ${oc.n === 1 ? 'glas' : 'glasova'}</div>
      </div>
    </div>`).join('');
}

/* ── Hover / Reset zvezdica ───────────────────────────────────── */
function hoverZvezdice(epId, vrednost) {
  document.querySelectorAll(`#zv-${epId} .zvezda`).forEach(zv => {
    const v = parseInt(zv.dataset.o);
    zv.style.color     = v <= vrednost ? 'var(--zlato-s)' : 'var(--srebro-t)';
    zv.style.transform = v <= vrednost ? 'scale(1.2)'     : 'scale(1)';
  });
}
function resetZvezdice(epId) {
  const mojaOcena = ulogovan ? dajOcenuK(epId, sesija.k) : null;
  document.querySelectorAll(`#zv-${epId} .zvezda`).forEach(zv => {
    const v    = parseInt(zv.dataset.o);
    const ozv  = mojaOcena && v <= mojaOcena.o;
    zv.style.color     = ozv ? 'var(--zlato-s)' : 'var(--srebro-t)';
    zv.style.transform = 'scale(1)';
  });
}

/* ── Klik na ocenu ────────────────────────────────────────────── */
function klikOcena(epId, vrednost) {
  if (!ulogovan) { otvoriModal(); return; }
  postaviOcenu(epId, sesija.k, vrednost);
  prikaziToast(`★ Ocenio/la si sa ${vrednost}/5!`);
  renderujSve();
  renderujRang(10);
}

/* ── Klik na komentar ─────────────────────────────────────────── */
function klikKomentar(epId) {
  if (!ulogovan) { otvoriModal(); return; }
  const polje  = document.getElementById('kta-' + epId);
  const tekst  = polje.value.trim();
  if (!tekst) {
    prikaziToast('⚠️ Komentar ne može biti prazan!', '#FF8080');
    return;
  }
  const postojeci = dajKomentarK(epId, sesija.k);
  postaviKomentar(epId, sesija.k, tekst);
  prikaziToast(postojeci ? '✏️ Komentar izmenjen!' : '💬 Komentar sačuvan!');
  renderujSve();
}

/* ── Prikaz svih epizoda ──────────────────────────────────────── */
function renderujSve() {
  const epizode = dajEpizode();
  const mreza   = document.getElementById('ep-mreza');

  if (!epizode.length) {
    mreza.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:70px 20px">
        <div aria-hidden="true" style="font-size:3.5rem;margin-bottom:14px">📺</div>
        <p>Admin još nije dodao epizode. Proveri ponovo uskoro!</p>
      </div>`;
    return;
  }

  mreza.innerHTML = epizode.map((ep, rbr) => {
    const oc       = dajProsek(ep.id);
    const mojaOc   = ulogovan ? dajOcenuK(ep.id, sesija.k) : null;
    const mojKom   = ulogovan ? dajKomentarK(ep.id, sesija.k) : null;
    const sviKom   = dajKomentare(ep.id);

    /* Zvezdice proseka */
    const zvProsek = [1, 2, 3, 4, 5].map(i =>
      `<span style="color:${i <= Math.round(oc.p) ? 'var(--zlato-s)' : 'var(--srebro-t)'}" aria-hidden="true">★</span>`
    ).join('');

    /* Sekcija za ocenjivanje */
    let oceniSekcija;
    if (ulogovan) {
      const zvUnos = [1, 2, 3, 4, 5].map(i => `
        <span class="zvezda${mojaOc && mojaOc.o >= i ? ' ak' : ''}"
          role="button" tabindex="0"
          data-o="${i}" data-ep="${ep.id}"
          onclick="klikOcena(${ep.id}, ${i})"
          onmouseenter="hoverZvezdice(${ep.id}, ${i})"
          onmouseleave="resetZvezdice(${ep.id})"
          onkeydown="if(event.key==='Enter'||event.key===' ')klikOcena(${ep.id},${i})"
          aria-label="${i} zvezdic${i === 1 ? 'a' : i < 5 ? 'e' : 'a'}"
          title="${i} od 5">★</span>`
      ).join('');
      oceniSekcija = `
        <div class="zv-sekcija">
          <div class="zv-labela">${mojaOc ? `Tvoja ocena: ${mojaOc.o}/5 – klikni za izmenu` : 'Oceni ovu epizodu:'}</div>
          <div class="zv-unos" id="zv-${ep.id}" role="group" aria-label="Ocena od 1 do 5">${zvUnos}</div>
          ${mojaOc ? `<div class="zv-labela" style="color:var(--zlato)">★ Ocenio/la si sa ${mojaOc.o}</div>` : ''}
        </div>`;
    } else {
      const zvLock = [1, 2, 3, 4, 5].map(() =>
        `<span onclick="otvoriModal()" title="Prijavi se da bi ocenio/la" aria-label="Prijava potrebna">★</span>`
      ).join('');
      oceniSekcija = `
        <div class="zv-sekcija">
          <div class="zv-labela">Oceni ovu epizodu:</div>
          <div class="zv-zakljucane" role="group" aria-label="Zaključano – prijava potrebna">${zvLock}</div>
          <div class="zakljucaj-info">
            🔒 <button class="zakljucaj-dugme" onclick="otvoriModal()">Prijavi se</button> da bi ocenio/la
          </div>
        </div>`;
    }

    /* Forma za komentar */
    let komForma;
    if (ulogovan) {
      komForma = `
        <div>
          <textarea class="kom-ta" id="kta-${ep.id}"
            placeholder="${mojKom ? 'Izmeni komentar...' : 'Napiši komentar...'}"
            aria-label="Komentar za ${esc(ep.naziv)}"
            rows="3">${mojKom ? esc(mojKom.t) : ''}</textarea>
          <button class="dugme-kom" onclick="klikKomentar(${ep.id})">
            ${mojKom ? '✏️ Izmeni' : '💬 Pošalji'}
          </button>
        </div>`;
    } else {
      komForma = `
        <div class="zakljucaj-info" style="padding:11px 14px;background:rgba(212,175,55,.04);border:1px solid rgba(212,175,55,.1);border-radius:10px;justify-content:center">
          🔒 <button class="zakljucaj-dugme" onclick="otvoriModal()">Prijavi se</button> da bi pisao/la komentare
        </div>`;
    }

    /* Prikaz komentara */
    const komHTML = sviKom.length
      ? sviKom.map(c => `
          <div class="kom-stavka">
            <div class="kom-autor">
              ${ulogovan && c.k === sesija.k ? '👤 Ti' : '👤 ' + esc(c.k)}
              ${c.izm ? '<span style="font-size:.7rem;opacity:.6"> (izmenjeno)</span>' : ''}
              <span style="float:right;font-size:.73rem;opacity:.5;font-weight:300">${c.dat || ''}</span>
            </div>
            <div class="kom-tekst-prikaz">${esc(c.t)}</div>
          </div>`).join('')
      : `<div class="zv-labela">${ulogovan ? 'Budi prvi koji komentariše!' : 'Još nema komentara.'}</div>`;

    return `
    <article class="ep-kartica animuj-gore" style="animation-delay:${rbr * .07}s" aria-label="Epizoda: ${esc(ep.naziv)}">
      ${ep.slika
        ? `<img src="${ep.slika}" alt="Slika epizode ${esc(ep.naziv)}" class="ep-slika" loading="lazy"
               onerror="this.outerHTML='<div class=ep-slika-ph aria-hidden=true>📺</div>'">`
        : `<div class="ep-slika-ph" aria-hidden="true">📺</div>`}
      <div class="ep-telo">
        <div class="ep-naziv">${esc(ep.naziv)}</div>
        <div class="ep-datum">📅 ${ep.datum}</div>
        <div class="ep-opis">${esc(ep.opis)}</div>

        <div class="ep-ocena-red" aria-label="Prosečna ocena ${oc.p}">
          <span class="zv-prikaz">${zvProsek}</span>
          ${oc.n > 0
            ? `<span class="ocena-broj">${oc.p}</span>
               <span class="ocena-br">(${oc.n} ${oc.n === 1 ? 'glas' : 'glasova'})</span>`
            : `<span class="ocena-br">Bez ocena</span>`}
        </div>

        ${oceniSekcija}
        ${komForma}

        <div class="kom-lista" id="kl-${ep.id}" aria-label="Komentari za ${esc(ep.naziv)}">
          ${komHTML}
        </div>
      </div>
    </article>`;
  }).join('');
}

/* ── Animacije pri skrolovanju ────────────────────────────────── */
function pokreniAnimacije() {
  const posmatrač = new IntersectionObserver((unosi) => {
    unosi.forEach(u => {
      if (u.isIntersecting) {
        u.target.classList.add('vidljiv');
        posmatrač.unobserve(u.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.animuj-gore').forEach(el => posmatrač.observe(el));
}

/* ── Pokretanje ───────────────────────────────────────────────── */
renderujSve();
renderujRang(10);
ucitajJezik();
pokreniAnimacije();
