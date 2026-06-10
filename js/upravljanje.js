/* ================================================================
   upravljanje.js – Logika Admin panela (upravljanje.html)
   Zavisi od: core.js
================================================================ */

/* ── Zaštita – samo admin ─────────────────────────────────────── */
if (!zastiti('admin')) { /* zastiti() vrši redirect */ }

const sesija = citajSesiju();
document.getElementById('nav-korisnik').textContent = '👑 ' + sesija.k;
document.getElementById('dug-tema').textContent =
  (localStorage.getItem('ss_tema') || 'tamna') === 'tamna' ? '☀️' : '🌙';

/* ── Hamburger ────────────────────────────────────────────────── */
function togglujMeni() {
  const veze = document.getElementById('nav-veze');
  const ham  = document.getElementById('hamburger');
  const otvoren = veze.classList.toggle('otvoreni');
  ham.classList.toggle('otvoren', otvoren);
  ham.setAttribute('aria-expanded', otvoren);
}

/* ── Tabovi ───────────────────────────────────────────────────── */
function prikaziTab(tab) {
  document.querySelectorAll('.tab-sadrzaj').forEach(t => t.classList.remove('vidljiv-blok'));
  document.querySelectorAll('.admin-tab-dugme').forEach(d => {
    d.classList.remove('ak');
    d.setAttribute('aria-selected', 'false');
  });
  document.getElementById('tab-' + tab).classList.add('vidljiv-blok');
  const dug = document.querySelector(`[data-tab="${tab}"]`);
  dug.classList.add('ak');
  dug.setAttribute('aria-selected', 'true');
  if (tab === 'kom') renderujKomentare();
  if (tab === 'kor') renderujKorisnike();
  if (tab === 'por') renderujPoruke();
}

/* ── Statistike ───────────────────────────────────────────────── */
function osveziStatistike() {
  const stat = dajStatistike();
  document.getElementById('stat-ep').textContent = stat.ep;
  document.getElementById('stat-oc').textContent = stat.oc;
  document.getElementById('stat-ko').textContent = stat.kom;
  document.getElementById('stat-pr').textContent = stat.p || '–';
}
osveziStatistike();

/* ── Epizode – CRUD ───────────────────────────────────────────── */
let izmenaId = null;

function otvoriFormu() {
  izmenaId = null;
  document.getElementById('f-naziv').value = '';
  document.getElementById('f-datum').value = '';
  document.getElementById('f-opis').value  = '';
  document.getElementById('f-slika').value = '';
  document.getElementById('forma-naslov').textContent = '+ Dodaj novu epizodu';
  document.getElementById('forma-dug').textContent    = 'Dodaj epizodu';
  document.getElementById('forma-greska').style.display = 'none';
  const forma = document.getElementById('admin-forma');
  forma.classList.add('vidljiva');
  forma.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function otvoriIzmenu(id) {
  const ep = dajEpizodu(id);
  if (!ep) return;
  izmenaId = id;
  document.getElementById('f-naziv').value = ep.naziv;
  document.getElementById('f-datum').value = ep.datum;
  document.getElementById('f-opis').value  = ep.opis;
  document.getElementById('f-slika').value = ep.slika || '';
  document.getElementById('forma-naslov').textContent = '✏️ Izmeni epizodu';
  document.getElementById('forma-dug').textContent    = 'Sačuvaj izmene';
  document.getElementById('forma-greska').style.display = 'none';
  const forma = document.getElementById('admin-forma');
  forma.classList.add('vidljiva');
  forma.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function otkaziFormu() {
  document.getElementById('admin-forma').classList.remove('vidljiva');
  izmenaId = null;
}

function sacuvajEpizodu() {
  const naziv = document.getElementById('f-naziv').value.trim();
  const datum = document.getElementById('f-datum').value;
  const opis  = document.getElementById('f-opis').value.trim();
  const slika = document.getElementById('f-slika').value.trim();

  if (!naziv) { prikaziGreskaForma('Naziv je obavezan!'); document.getElementById('f-naziv').focus(); return; }
  if (!datum) { prikaziGreskaForma('Datum je obavezan!'); document.getElementById('f-datum').focus(); return; }
  if (!opis)  { prikaziGreskaForma('Opis je obavezan!');  document.getElementById('f-opis').focus();  return; }

  document.getElementById('forma-greska').style.display = 'none';

  if (izmenaId !== null) {
    izmeniEpizodu(izmenaId, { naziv, datum, opis, slika });
    prikaziToast('✅ Epizoda izmenjena!');
  } else {
    dodajEpizodu({ naziv, datum, opis, slika });
    prikaziToast('✅ Epizoda dodata!');
  }
  otkaziFormu();
  renderujEpizode();
  osveziStatistike();
}

function prikaziGreskaForma(poruka) {
  const el = document.getElementById('forma-greska');
  el.textContent = poruka;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function renderujEpizode() {
  const epizode    = dajEpizode();
  const kontejner  = document.getElementById('ep-tabela');
  if (!epizode.length) {
    kontejner.innerHTML = '<div class="prazna-poruka"><div style="font-size:3rem;margin-bottom:12px">📺</div><p>Nema epizoda. Dodaj prvu!</p></div>';
    return;
  }
  function zvezdice(p) { return '★'.repeat(Math.round(p)) + '☆'.repeat(5 - Math.round(p)); }
  kontejner.innerHTML = `<table class="tabela" role="table" aria-label="Lista epizoda">
    <thead><tr>
      <th scope="col">ID</th><th scope="col">Naziv</th><th scope="col">Datum</th>
      <th scope="col">Ocena</th><th scope="col">Akcije</th>
    </tr></thead>
    <tbody>
    ${epizode.map(ep => {
      const oc = dajProsek(ep.id);
      return `<tr>
        <td style="color:var(--zlato);font-weight:600">${ep.id}</td>
        <td>
          <div style="font-weight:500">${ep.naziv}</div>
          <div style="font-size:.78rem;color:var(--tekst2);margin-top:2px">${ep.opis.substring(0, 55)}...</div>
        </td>
        <td style="color:var(--tekst2);font-size:.85rem">${ep.datum}</td>
        <td>${oc.p > 0
          ? `<span style="color:var(--zlato);font-size:.85rem">${zvezdice(oc.p)}</span>
             <span style="font-size:.78rem;color:var(--srebro-t)">${oc.p} (${oc.n})</span>`
          : '<span style="color:var(--tekst2);font-size:.82rem">Bez ocena</span>'}</td>
        <td>
          <button class="dugme-izmeni" onclick="otvoriIzmenu(${ep.id})" aria-label="Izmeni epizodu ${ep.naziv}">✏️ Izmeni</button>
          <button class="dugme-obrisi" onclick="potvrdiObrisi(${ep.id},'ep')" aria-label="Obriši epizodu ${ep.naziv}">🗑 Obriši</button>
        </td>
      </tr>`;
    }).join('')}
    </tbody>
  </table>`;
}
renderujEpizode();

/* ── Komentari ────────────────────────────────────────────────── */
function renderujKomentare() {
  const baza       = ucitajDB();
  const kontejner  = document.getElementById('kom-tabela');
  if (!baza.komentari.length) {
    kontejner.innerHTML = '<div class="prazna-poruka"><p>Nema komentara.</p></div>';
    return;
  }
  kontejner.innerHTML = `<table class="tabela" role="table">
    <thead><tr><th>Korisnik</th><th>Epizoda</th><th>Komentar</th><th>Datum</th><th>Akcija</th></tr></thead>
    <tbody>
    ${baza.komentari.map(k => {
      const ep = dajEpizodu(k.eid);
      return `<tr>
        <td style="color:var(--zlato);font-weight:500">${k.k}</td>
        <td style="font-size:.85rem">${ep ? ep.naziv : `(obrisana, ID:${k.eid})`}</td>
        <td style="color:var(--tekst2);font-size:.86rem">${k.t}</td>
        <td style="color:var(--tekst2);font-size:.82rem">${k.dat || '–'}</td>
        <td><button class="dugme-obrisi" onclick="potvrdiObrisi(${k.id},'kom')" aria-label="Obriši komentar">🗑</button></td>
      </tr>`;
    }).join('')}
    </tbody>
  </table>`;
}

/* ── Korisnici ────────────────────────────────────────────────── */
function renderujKorisnike() {
  const admini    = parsujTxt(dajAdmineTxt());
  const korisnici = parsujTxt(dajKorisnikeTxt());

  document.getElementById('lista-admina').innerHTML = admini.map(a => `
    <div class="korisnik-red">
      <span style="color:var(--zlato)">👑 ${a.u}</span>
      ${a.u !== sesija.k
        ? `<button class="dugme-obrisi" style="padding:4px 10px;font-size:.78rem" onclick="ukloniKorisnika('${a.u}','admin')">Ukloni</button>`
        : '<span style="font-size:.75rem;color:var(--tekst2)">(ti)</span>'}
    </div>`).join('');

  document.getElementById('lista-korisnika').innerHTML = korisnici.map(u => `
    <div class="korisnik-red">
      <span style="color:var(--srebro)">👤 ${u.u}</span>
      <button class="dugme-obrisi" style="padding:4px 10px;font-size:.78rem" onclick="ukloniKorisnika('${u.u}','user')">Ukloni</button>
    </div>`).join('') || '<div class="prazna-poruka" style="padding:20px"><p>Nema korisnika.</p></div>';
}

function dodajKorisnika() {
  const ime    = document.getElementById('nu-korisnicko').value.trim();
  const loz    = document.getElementById('nu-lozinka').value.trim();
  const uloga  = document.getElementById('nu-uloga').value;
  const greskaEl = document.getElementById('nu-greska');
  greskaEl.style.display = 'none';

  if (!ime || ime.length < 2) { greskaEl.textContent = 'Korisničko ime mora imati min. 2 karaktera.'; greskaEl.style.display = 'block'; return; }
  if (!loz || loz.length < 4) { greskaEl.textContent = 'Lozinka mora imati min. 4 karaktera.'; greskaEl.style.display = 'block'; return; }

  const svi = [...parsujTxt(dajAdmineTxt()), ...parsujTxt(dajKorisnikeTxt())];
  if (svi.some(x => x.u === ime)) { greskaEl.textContent = 'Korisnik sa tim imenom već postoji.'; greskaEl.style.display = 'block'; return; }

  dodajKorisnikaTxt(ime, loz, uloga);
  document.getElementById('nu-korisnicko').value = '';
  document.getElementById('nu-lozinka').value    = '';
  renderujKorisnike();
  prikaziToast(`✅ Korisnik „${ime}" dodat kao ${uloga === 'admin' ? 'Admin' : 'Korisnik'}!`);
}

function ukloniKorisnika(korisnickoIme, uloga) {
  if (uloga === 'admin') {
    const linije = dajAdmineTxt().split('\n').filter(l => !l.startsWith(korisnickoIme + ':') && l.trim());
    sacuvajAdmineTxt(linije.join('\n'));
  } else {
    const linije = dajKorisnikeTxt().split('\n').filter(l => !l.startsWith(korisnickoIme + ':') && l.trim());
    sacuvajKorisnikeTxt(linije.join('\n'));
  }
  renderujKorisnike();
  prikaziToast(`🗑 Korisnik „${korisnickoIme}" uklonjen.`);
}

/* ── Poruke sa kontakt forme ──────────────────────────────────── */
function renderujPoruke() {
  const poruke    = JSON.parse(localStorage.getItem('ss_poruke') || '[]');
  const kontejner = document.getElementById('por-tabela');
  if (!poruke.length) {
    kontejner.innerHTML = '<div class="prazna-poruka"><div style="font-size:2.5rem;margin-bottom:12px">📬</div><p>Nema poruka sa kontakt forme.</p></div>';
    return;
  }
  kontejner.innerHTML = `<table class="tabela" role="table">
    <thead><tr><th>Ime</th><th>Email</th><th>Tema</th><th>Poruka</th><th>Datum</th></tr></thead>
    <tbody>
    ${[...poruke].reverse().map(p => `<tr>
      <td style="font-weight:500">${p.ime}</td>
      <td style="color:var(--tekst2);font-size:.85rem">${p.email}</td>
      <td><span class="tema-znacka">${p.tema}</span></td>
      <td style="color:var(--tekst2);font-size:.85rem;max-width:250px">${p.poruka.substring(0, 80)}${p.poruka.length > 80 ? '...' : ''}</td>
      <td style="color:var(--tekst2);font-size:.8rem">${new Date(p.datum).toLocaleDateString('sr-RS')}</td>
    </tr>`).join('')}
    </tbody>
  </table>`;
}

/* ── Modal za brisanje ────────────────────────────────────────── */
function potvrdiObrisi(id, tip) {
  const ep = tip === 'ep' ? dajEpizodu(id) : null;
  document.getElementById('modal-tekst').textContent = tip === 'ep'
    ? `Obrisati epizodu „${ep?.naziv}"? Briše se i sve ocene i komentari te epizode.`
    : 'Obrisati ovaj komentar?';
  document.getElementById('modal-brisanje').classList.add('vidljiv-blok');
  document.getElementById('modal-potvrda').onclick = function() {
    if (tip === 'ep') { obrisiEpizodu(id); renderujEpizode(); }
    else              { obrisiKomentar(id); renderujKomentare(); }
    zatvoriModal();
    osveziStatistike();
    prikaziToast('🗑 Obrisano uspešno.');
  };
}

function zatvoriModal() {
  document.getElementById('modal-brisanje').classList.remove('vidljiv-blok');
}

document.getElementById('modal-brisanje').addEventListener('click', function(e) {
  if (e.target === this) zatvoriModal();
});

/* ── Višejezičnost ────────────────────────────────────────────── */
ucitajJezik();
