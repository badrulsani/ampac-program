'use strict';
/* ====================== KONFIGURASI ====================== */
const CONFIG = {
  eventStart: '2026-12-03T09:30:00+08:00',
  eventEnd: '2026-12-03T13:00:00+08:00',
  whatsapp: '601110939170',
  // Tampal URL Google Apps Script / Formspree di sini supaya setiap pendaftaran direkodkan,
  // walaupun peserta tidak menekan hantar di WhatsApp. Biar kosong jika belum disediakan.
  regEndpoint: '',
  // Baki tempat (nombor). Biar null untuk sembunyikan.
  seatsLeft: null,
  // Testimoni sebenar sahaja: {text:'...', name:'Nama', role:'Jawatan, Organisasi'}
  // Bahagian akan muncul secara automatik apabila ada isi.
  testimonials: []
};

const CASES = {
  handover:{title:'KOMUNIKASI ANTARA JABATAN',org:'Sales & Operasi · Organisasi contoh',map:'Maklumat serahan tidak lengkap. Penerima perlu bertanya semula sebelum memulakan kerja. Semak sama ada puncanya kemahiran atau proses.',outline:'Cadangan untuk disahkan: latih serahan dengan konteks, hasil, PIC, tarikh siap dan pengesahan kefahaman.',value:'Mohon persetujuan management untuk percubaan templat serahan dan latihan ringkas. Nilai kelengkapan serahan serta keperluan bertanya semula; kumpul data awal dahulu.',execute:'Contoh selepas kelulusan: HR & ketua jabatan rekod data awal (hari 1–7); penyelia uji templat (hari 8–14); ketua jabatan semak kelengkapan dan laras (hari 15–30).'},
  feedback:{title:'FEEDBACK PENYELIA',org:'Penyelia baharu · Organisasi contoh',map:'Feedback terlalu umum. Ahli pasukan kurang jelas tentang tindakan pembetulan.',outline:'Cuba role-play Situation–Behavior–Impact dan sepakati tindakan serta tarikh susulan.',value:'Cadangkan latihan feedback dan coaching penyelia. Mohon masa latihan serta sokongan ketua; semak situasi, perlakuan, kesan dan tindakan dalam sampel feedback.',execute:'Contoh selepas kelulusan: HR semak contoh feedback (minggu 1); trainer & penyelia jalankan simulasi (minggu 2); ketua jabatan semak sampel amalan (minggu 3–4).'},
  service:{title:'KOMUNIKASI PELANGGAN',org:'Khidmat Pelanggan · Organisasi contoh',map:'Respons aduan berbeza mengikut pegawai. Tindakan seterusnya kurang jelas.',outline:'Latih mendengar, merumus isu, menerangkan langkah seterusnya dan membuat eskalasi.',value:'Cadangkan simulasi respons aduan serta semakan SOP bersama ketua khidmat pelanggan. Mohon persetujuan percubaan; semak sampel respons dengan kriteria yang dipersetujui.',execute:'Contoh selepas kelulusan: ketua khidmat pelanggan semak SOP (minggu 1); trainer jalankan simulasi (minggu 2); penyelia audit respons dan laras panduan (minggu 3–4).'}
};

const GALLERY = [
  {file:'workshop-wide',alt:'Abg Badr berinteraksi dengan peserta dalam bilik latihan AMPAC',caption:'Interaksi bersama peserta di Akademi AMPAC.'},
  {file:'badr-speaking',alt:'Abg Badr mengendalikan sesi dengan mikrofon dan gerak tangan',caption:'Penyampaian dan interaksi bersama Abg Badr.'},
  {file:'corporate-session',alt:'Abg Badr menyampaikan latihan kepada peserta dalam sesi korporat',caption:'Suasana penyampaian dalam sesi korporat.'},
  {file:'audience-view',alt:'Pemandangan dari belakang Abg Badr menghadap peserta di dewan',caption:'Perspektif dari pentas: bersama peserta di dewan.'},
  {file:'group-discussion',alt:'Peserta berbincang di sekeliling meja dalam sesi bersama Abg Badr',caption:'Ruang perbincangan dalam sesi latihan.'},
  {file:'badr-energy',alt:'Abg Badr tersenyum sambil bercakap dengan mikrofon',caption:'Tenaga dan ekspresi dalam penyampaian.'},
  {file:'workshop-close',alt:'Abg Badr menerangkan sesuatu dengan mikrofon di hadapan flip chart',caption:'Penerangan dan latihan berpandu.'},
  {file:'badr-portrait',alt:'Potret Abg Badr memegang tablet',caption:'Abg Badr · Master Trainer AMPAC.'}
];

const $ = s => document.querySelector(s);
const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- menu mudah alih ---------- */
(function(){
  const menu = $('#menu-toggle'), nav = $('#navigation');
  const close = () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded','false'); menu.setAttribute('aria-label','Buka menu'); };
  menu.addEventListener('click', () => { const o = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(o)); menu.setAttribute('aria-label', o ? 'Tutup menu' : 'Buka menu'); });
  nav.addEventListener('click', e => { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

/* ---------- contoh pelan ---------- */
function renderCase(id){
  const c = CASES[id]; if (!c) return;
  $('#case-preview').innerHTML =
    `<div class="paper-header"><img src="assets/move-logo.webp" alt="MOVE YOUR TEAM" width="82" height="35"><span>CONTOH REKAAN</span></div>` +
    `<h3 class="paper-title">TNA · PITCH<br>ACTION PLAN</h3><p class="paper-org">${esc(c.org)}</p>` +
    [['TNA','Analisis keperluan',c.map+' '+c.outline],['PITCH','Cadangan kepada management',c.value],['PLAN','Tindakan & timeline contoh',c.execute]]
      .map(([l,t,x]) => `<div class="paper-block"><b>${l}</b><div><h4>${esc(t)}</h4><p>${esc(x)}</p></div></div>`).join('') +
    `<div class="paper-foot">${esc(c.title)} · DRAF UNTUK PERBINCANGAN</div>`;
  document.querySelectorAll('[data-case]').forEach(b => { const a = b.dataset.case === id; b.classList.toggle('active', a); b.setAttribute('aria-pressed', String(a)); });
}
document.querySelectorAll('[data-case]').forEach(b => b.addEventListener('click', () => renderCase(b.dataset.case)));
renderCase('handover');

/* ---------- rujukan ---------- */
/* p = prinsip penting daripada sumber; u = bagaimana ia digunakan dalam MOVE YOUR TEAM */
const REF_NOTES = {
  cipd:{step:'TNA',p:'Analisis keperluan perlu menghubungkan jurang keupayaan dengan keutamaan organisasi, dan pilihan penyelesaian melangkaui kursus semata-mata.',u:'Sebelum memilih program, peserta mengumpul bukti masalah, standard kerja yang diharapkan dan pandangan pihak terlibat.'},
  atd:{step:'TNA',p:'Peningkatan prestasi melibatkan analisis punca, proses, persekitaran kerja dan sokongan prestasi.',u:'Pilihan intervensi diluaskan kepada coaching, job aids, penjelasan peranan dan pembaikan proses, bukan latihan sahaja.'},
  comb:{step:'TNA',p:'Tingkah laku hasil interaksi Capability, Opportunity dan Motivation: kemampuan, peluang atau persekitaran, dan motivasi.',u:'Tiga soalan diagnosis: Dia tahu dan mampu? Keadaan kerja membolehkan? Apa yang mendorong atau menghalang?'},
  salas:{step:'PLAN',p:'Reka bentuk latihan merangkumi perkara yang berlaku sebelum, semasa dan selepas latihan.',u:'Pelan disusun kepada persediaan peserta, latihan praktikal dan aplikasi di tempat kerja.'},
  transfer:{step:'PLAN',p:'Pemindahan latihan bergantung pada ciri peserta, reka bentuk latihan dan persekitaran kerja.',u:'Pelan tindakan menyatakan peluang mengamalkan kemahiran, sokongan penyelia dan bukti amalan berterusan.'},
  goals:{step:'PLAN',p:'Matlamat yang khusus dan mencabar, bersama komitmen dan feedback, menyokong prestasi.',u:'Objektif umum seperti “tingkatkan komunikasi” ditukar kepada perlakuan khusus yang boleh diperhatikan dan disemak.'},
  intentions:{step:'PLAN',p:'Pelan if–then yang menetapkan situasi pencetus dan tindakan membantu pencapaian matlamat.',u:'Komitmen ditulis sebagai ayat: “Jika saya menyerahkan tugasan, saya akan nyatakan hasil, PIC dan tarikh siap.”'},
  safety:{step:'TNA',p:'Keselamatan psikologi pasukan berkait dengan tingkah laku pembelajaran pasukan.',u:'Semak sama ada ahli pasukan selesa bertanya, mengakui kesilapan, meminta bantuan dan menyuarakan kebimbangan.'},
  sbi:{step:'Contoh pelan',p:'Feedback distrukturkan melalui Situation–Behavior–Impact, dengan fokus pada tingkah laku yang diperhatikan.',u:'Digunakan dalam contoh pelan “Feedback penyelia” untuk simulasi dan tindakan susulan yang dipersetujui.'},
  teamstepps:{step:'Contoh pelan',p:'Alat komunikasi pasukan seperti SBAR, check-back dan handoff. Asalnya dalam konteks kesihatan.',u:'Diadaptasi dalam contoh pelan serahan antara jabatan: mesej tersusun dan penerima mengesahkan kefahaman.'},
  kirkpatrick:{step:'PLAN',p:'Penilaian membezakan Reaction, Learning, Behavior dan Results.',u:'Bukti kemajuan dipisahkan: peserta suka? boleh buat? mengamalkan? apa yang berubah pada kerja?'},
  roi:{step:'PITCH',p:'Penilaian ROI memisahkan sumbangan program daripada faktor lain, mengambil kira kos penuh, dan melaporkan manfaat tak ketara secara berasingan.',u:'Cadangan kepada management dikaitkan dengan ukuran masa, kualiti, kos atau produktiviti; ROI dikira apabila data mencukupi.'},
  pdsa:{step:'PLAN',p:'Plan–Do–Study–Act menguji perubahan pada skala kecil, memerhati hasil dan memperbaiki percubaan seterusnya.',u:'Pelan susulan dijadikan percubaan kerja: uji pada beberapa tugasan, semak hasil, laraskan pendekatan.'},
  hrdcorp:{step:'Konteks Malaysia',p:'Laporan tahun 2020 ini menghubungkan TNA dengan matlamat organisasi, keupayaan semasa, kemahiran masa hadapan dan semakan jurang latihan.',u:'Konteks tempatan untuk HR SME menyusun keperluan pembangunan. Ini laporan 2020, bukan panduan semasa.'}
};
if (typeof PROGRAM_REFERENCES !== 'undefined') {
  $('#references-list').innerHTML = PROGRAM_REFERENCES.map((r, i) => {
    const n = REF_NOTES[r.id] || {};
    return `<article class="ref"><span class="ref-no">${String(i+1).padStart(2,'0')}</span><div>` +
      `<a class="ref-title" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a>` +
      `<span class="ref-meta">${esc(r.author)} · ${esc(r.year)}</span>` +
      (n.p ? `<p><b>Prinsip:</b> ${esc(n.p)}</p><p><b>Dalam program ini:</b> ${esc(n.u)}</p>` : '') +
      `</div>${n.step ? `<span class="ref-step">${esc(n.step)}</span>` : ''}</article>`;
  }).join('');
}

/* ---------- galeri + lightbox ---------- */
(function(){
  $('#photo-grid').innerHTML = GALLERY.map((g,i) =>
    `<button class="gallery-photo" type="button" data-photo="${i}" aria-label="Buka gambar: ${esc(g.caption)}"><img src="assets/${g.file}-small.webp" alt="${esc(g.alt)}" width="480" height="360" loading="lazy"></button>`).join('');
  const dlg = $('#photo-dialog'), img = $('#lightbox-image'), cap = $('#photo-caption');
  let idx = 0, last = null;
  const show = i => { idx = (i + GALLERY.length) % GALLERY.length; const g = GALLERY[idx]; img.src = 'assets/' + g.file + '.webp'; img.alt = g.alt; cap.textContent = (idx+1) + ' / ' + GALLERY.length + ' · ' + g.caption; };
  const close = () => { dlg.close(); if (last) last.focus(); };
  document.querySelectorAll('[data-photo]').forEach(b => b.addEventListener('click', () => { last = b; show(Number(b.dataset.photo)); dlg.showModal(); document.body.classList.add('modal-open'); $('#close-photo').focus(); }));
  $('#close-photo').addEventListener('click', close);
  $('#previous-photo').addEventListener('click', () => show(idx-1));
  $('#next-photo').addEventListener('click', () => show(idx+1));
  dlg.addEventListener('close', () => document.body.classList.remove('modal-open'));
  dlg.addEventListener('click', e => { if (e.target === dlg) { const r = dlg.getBoundingClientRect(); if (e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) close(); } });
  dlg.addEventListener('keydown', e => { if (e.key==='ArrowRight'){e.preventDefault();show(idx+1);} if (e.key==='ArrowLeft'){e.preventDefault();show(idx-1);} });
})();

/* ---------- kiraan detik ---------- */
(function(){
  const start = new Date(CONFIG.eventStart).getTime(), end = new Date(CONFIG.eventEnd).getTime();
  const cd = $('#countdown'), lab = $('#cdLabel'), st = $('#cdState');
  function tick(){
    const now = Date.now();
    if (now >= end) {
      cd.hidden = true; lab.textContent = 'STATUS'; st.hidden = false; st.textContent = 'Sesi ini telah tamat. WhatsApp kami untuk sesi seterusnya.';
      document.querySelectorAll('[data-cta]').forEach(a => a.textContent = 'Daftar minat sesi akan datang');
      return;
    }
    if (now >= start) { cd.hidden = true; lab.textContent = 'HARI INI'; st.hidden = false; st.textContent = 'Sesi sedang berlangsung'; return; }
    const s = Math.floor((start - now) / 1000);
    $('#cdD').textContent = Math.floor(s/86400);
    $('#cdH').textContent = String(Math.floor(s%86400/3600)).padStart(2,'0');
    $('#cdM').textContent = String(Math.floor(s%3600/60)).padStart(2,'0');
  }
  tick(); setInterval(tick, 30000);
  if (CONFIG.seatsLeft !== null) { const e = $('#seats'); e.hidden = false; e.textContent = 'Baki tempat: ' + CONFIG.seatsLeft; }
})();

/* ---------- testimoni (muncul bila ada isi) ---------- */
(function(){
  if (!CONFIG.testimonials.length) return;
  const box = $('#quotes');
  CONFIG.testimonials.forEach(t => {
    const q = document.createElement('blockquote'); q.className = 'quote'; q.style.margin = 0;
    const p = document.createElement('p'); p.textContent = '“' + t.text + '”';
    const b = document.createElement('b'); b.textContent = t.name;
    const s = document.createElement('span'); s.textContent = t.role || '';
    q.append(p, b, s); box.appendChild(q);
  });
  $('#bukti').hidden = false;
})();

/* ---------- borang pendaftaran ---------- */
(function(){
  const f = $('#regForm'), err = $('#err'), ok = $('#okMsg'), btn = $('#submitBtn');
  const label = btn.textContent;
  f.addEventListener('submit', async e => {
    e.preventDefault(); err.textContent = ''; ok.hidden = true;
    if (f.website.value) return; // honeypot
    const v = n => f[n].value.trim();
    if (!v('nama')) { err.textContent = 'Sila isi nama anda.'; f.nama.focus(); return; }
    const tel = v('tel').replace(/[^\d+]/g, '');
    if (tel.replace(/\D/g,'').length < 9) { err.textContent = 'Sila isi no. telefon yang sah.'; f.tel.focus(); return; }
    if (!v('peranan')) { err.textContent = 'Sila pilih peranan anda.'; f.peranan.focus(); return; }
    if (!$('#pdpa').checked) { err.textContent = 'Sila tanda persetujuan untuk meneruskan.'; return; }
    const data = { nama:v('nama'), tel, org:v('org'), peranan:v('peranan'), soalan:v('soalan'), program:'MOVE YOUR TEAM 3 Dis 2026', masa:new Date().toISOString() };
    btn.disabled = true; btn.textContent = 'Menghantar…';
    if (CONFIG.regEndpoint) { try { await fetch(CONFIG.regEndpoint, { method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain'}, body:JSON.stringify(data) }); } catch (x) {} }
    const msg = `Assalamualaikum AMPAC. Saya berminat menyertai MOVE YOUR TEAM bersama Abg Badr pada 3 Disember 2026, 9.30am - 1pm di Dewan Hang Tuah, AMPAC Corporate Training, Seksyen 9, Bandar Baru Bangi, yuran RM49.\n\nNama: ${data.nama}\nTelefon: ${data.tel}${data.org ? '\nOrganisasi: ' + data.org : ''}\nPeranan: ${data.peranan}\n\n${data.soalan || 'Boleh kongsikan cara pembayaran dan pengesahan tempat?'}\n\nTerima kasih.`;
    const url = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(msg);
    $('#waFallback').href = url;
    $('#okText').textContent = CONFIG.regEndpoint
      ? 'Maklumat anda telah direkodkan. Jika WhatsApp tidak terbuka, '
      : 'WhatsApp dibuka dengan mesej pendaftaran anda. Jika ia tidak terbuka, ';
    ok.hidden = false; btn.disabled = false; btn.textContent = label;
    window.open(url, '_blank', 'noopener');
  });
})();

if (typeof module !== 'undefined') module.exports = { CASES, GALLERY, CONFIG };
