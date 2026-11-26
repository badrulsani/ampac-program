'use strict';
/* MOVE YOUR TEAM Planner 5.0 (Ringkas): antara muka */
const M = Move, $ = (q, r = document) => r.querySelector(q), $$ = (q, r = document) => [...r.querySelectorAll(q)], esc = M.esc;
const ROUTES = ['mula', 'tna', 'pitch', 'plan', 'hasil', 'bantuan'];
let S = M.defaults(), storageOK = true, pitchTab = 'skrip', dlURL = null, job = null, lastSaved = null;

/* ---------- storan ---------- */
(function init() {
  try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); } catch (e) { storageOK = false; return; }
  try {
    const raw = localStorage.getItem(M.KEY);
    if (raw) S = M.validate(JSON.parse(raw));
    else for (const k of M.OLD_KEYS) { const o = localStorage.getItem(k); if (o) { S = M.validate(JSON.parse(o)); break; } }
  } catch (e) { S = M.defaults(); }
})();
function save() {
  try { localStorage.setItem(M.KEY, JSON.stringify(S)); storageOK = true; lastSaved = new Date(); } catch (e) { storageOK = false; }
  const el = $('#save-status'); if (!el) return;
  el.classList.toggle('bad', !storageOK);
  el.innerHTML = storageOK ? '<span>Disimpan' + (lastSaved ? ' · ' + String(lastSaved.getHours()).padStart(2, '0') + ':' + String(lastSaved.getMinutes()).padStart(2, '0') : '') + '</span>' : '<span>Storan tidak tersedia. Muat turun sandaran.</span>';
}
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { }
const sig = () => JSON.stringify([S.status, S.mula, S.nama, S.diag]);
function ensureTasks() { if (!S.tasks) { S.tasks = M.plan(S).tasks.map(t => Object.assign({}, t)); S.tasksSig = sig(); } }

/* ---------- utiliti UI ---------- */
function toast(v) { const t = $('#toast'); t.textContent = v; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 4200); }
function ask(title, text, fn) { job = fn; $('#dlg-t').textContent = title; $('#dlg-p').textContent = text; $('#dlg').showModal(); }
$('#dlg-no').onclick = () => { $('#dlg').close(); job = null; };
$('#dlg-yes').onclick = () => { const j = job; job = null; $('#dlg').close(); j && j(); };
function download(content, name, type) {
  if (dlURL) URL.revokeObjectURL(dlURL);
  dlURL = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], { type }));
  const a = document.createElement('a'); a.href = dlURL; a.download = name; a.hidden = true; document.body.appendChild(a); a.click(); a.remove();
  $('#dl-note').hidden = false; $('#dl-link').href = dlURL; $('#dl-link').download = name;
  toast('Fail sedang dimuat turun: ' + name);
}
function loadScript(src) { return new Promise((res, rej) => { if ($('script[data-src="' + src + '"]')) return res(); const s = document.createElement('script'); s.src = src; s.dataset.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
const route = () => { const r = (location.hash || '#mula').slice(1); return ROUTES.includes(r) ? r : 'mula'; };
const li = a => '<ul>' + a.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';

/* ---------- komponen ---------- */
function ftext(k, label, hint, ex, rows = 3) {
  return `<div class="field"><label for="${k}">${label}</label><span class="hint" id="${k}-h">${hint}</span><textarea id="${k}" data-f="${k}" maxlength="8000" rows="${rows}" aria-describedby="${k}-h">${esc(S[k])}</textarea>${ex && !S.ex ? `<div class="ex"><b>Contoh:</b> ${ex}</div>` : ''}</div>`;
}
function seg(q) {
  const cur = S.diag[q.id], o = [['2', 'Ya'], ['1', 'Sebahagian'], ['0', 'Tidak'], ['x', 'Tak pasti']];
  return `<div class="q" role="radiogroup" aria-labelledby="${q.id}-l"><p id="${q.id}-l">${esc(q.t)}</p><small>${esc(q.h)}</small><div class="seg">${o.map(([v, l]) => `<label><input type="radio" name="${q.id}" data-d="${q.id}" value="${v}" ${(cur === null && v === 'x') ? 'checked' : String(cur) === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>`;
}
function stepper(r) {
  const pg = M.progress(S), items = [['tna', 'TNA', 'Kenal pasti punca', pg.tna], ['pitch', 'PITCH', 'Bentang kepada superior', pg.pitch], ['plan', 'PLAN', 'Pelan dan tarikh', pg.plan], ['hasil', 'Pelan Saya', 'Muat turun', null]];
  $('#stepper .wrap').innerHTML = items.map(([k, a, b, d], i) => `<a href="#${k}" class="${r === k ? 'on' : ''} ${d && r !== k ? 'done' : ''}" ${r === k ? 'aria-current="step"' : ''}><span class="n">${d && r !== k ? '✓' : i + 1}</span><span><b>${a}</b><small>${b}</small></span></a>`).join('');
}
const pill = (name, v) => { const [c, l] = v === null ? ['na', 'Belum dinilai'] : v === 2 ? ['ok', 'Kukuh'] : v === 1 ? ['mid', 'Separa'] : ['low', 'Jurang']; return `<span class="pill ${c}"><small>${name}</small><b>${l}</b></span>`; };

/* ---------- MULA ---------- */
function pageMula() {
  const started = M.has(S.isu) || M.has(S.pihak) || S.tasks;
  return `<div class="wrap"><div class="hero"><div>
    <p class="eyebrow">MOVE YOUR TEAM · Planner</p>
    <h1>Satu cabaran.<br><em>Satu pelan.</em></h1>
    <p class="intro">Jawab beberapa soalan tentang satu isu kerja. Planner menyusun analisis, bahan pitch kepada superior, dan pelan tindakan bertarikh untuk anda bawa pulang.</p>
    <div class="cta-row"><a class="btn primary" href="#tna">${started ? 'Sambung pelan saya' : 'Mula dengan isu saya'} →</a><button class="btn" data-a="example">Cuba dengan contoh</button></div>
    ${started ? `<div class="resume"><div><b>Draf anda masih ada.</b>${S.lama ? '<br><small>Data planner lama telah dibawa masuk.</small>' : ''}</div><a class="btn sm" href="#hasil">Lihat Pelan Saya</a></div>` : ''}
    </div>
    <div class="hero-card"><h3>Anda bawa pulang</h3><ul><li><b>Keputusan TNA:</b> latihan memang jawapan, atau puncanya lain?</li><li><b>Slaid pitch</b> (PowerPoint) dan skrip 2 minit</li><li><b>Pelan tindakan bertarikh</b> (kalendar telefon dan Excel)</li></ul></div></div>
    <div class="how">
      <div class="card"><span class="no">1 · TNA · ±20 MINIT</span><h3>Apa masalahnya?</h3><p>Empat soalan tentang isu, empat semakan pantas. Keputusan muncul langsung.</p></div>
      <div class="card"><span class="no">2 · PITCH · ±20 MINIT</span><h3>Apa nak diminta?</h3><p>Pilih keputusan yang anda mahu. Skrip dan slaid siap.</p></div>
      <div class="card"><span class="no">3 · PLAN · ±15 MINIT</span><h3>Bila nak mula?</h3><p>Pilih tarikh mula. Enam langkah disusun untuk anda.</p></div></div>
    <p class="privacy"><b>Peribadi:</b> semua jawapan disimpan dalam pelayar anda sahaja. Guna contoh tanpa nama. Planner ini berfungsi tanpa AI.</p></div>`;
}

/* ---------- TNA ---------- */
function tnaPreview() {
  const T = M.tna(S), ev = T.bukti;
  return `<div class="verdict ${T.fit}"><h3>${esc(T.keputusanTajuk)}</h3><p>${esc(T.dapatan)}</p></div>
  <div class="pills">${pill('Tahu & mampu', T.skor.K)}${pill('Ada sokongan', T.skor.P)}${pill('Ada dorongan', T.skor.M)}</div>
  <h4>Apa yang dicadangkan</h4>${li(T.intervensi)}
  <h4>Perlu disahkan sebelum membentang</h4>${T.perluSahkan.length ? li(T.perluSahkan) : '<p class="empty-note">Tiada. Bukti anda kukuh.</p>'}`;
}
function pageTNA() {
  return `<div class="wrap"><p class="eyebrow">Langkah 1 daripada 3 · TNA</p><h1>Apa <em>masalahnya?</em></h1>
  <p class="intro">Tulis dengan bahasa anda sendiri. Tak pasti? Pilih “Tak pasti”. Itu pun satu jawapan yang berguna.</p>
  ${S.ex ? '<div class="warn">Anda menggunakan <b>contoh</b>. Gantikan dengan isu sebenar anda sebelum membentang.</div>' : ''}
  <div class="cols"><div>
    <div class="card"><h2>Ceritakan isu anda</h2><p class="sub">Satu isu sahaja. Boleh melibatkan seorang, satu pasukan kecil atau satu jabatan.</p>
      ${ftext('isu', 'Apa masalah yang berlaku?', 'Apa yang mengganggu kerja.', 'Serahan kerja Sales kepada Operations kerap tidak lengkap.')}
      ${ftext('pihak', 'Siapa yang terlibat?', 'Peranan atau pasukan.', 'Pegawai Sales dan Operations.', 2)}
      ${ftext('contoh', 'Satu contoh kejadian', 'Apa yang sebenarnya berlaku. Tak perlu angka.', 'Permintaan semakan stok tanpa tarikh siap, jadi Operations perlu bertanya semula.')}
      ${ftext('hasil', 'Apa yang anda mahu nampak selepas ini?', 'Bagaimana kerja sepatutnya berjalan.', 'Serahan menyebut hasil, PIC dan tarikh siap.', 2)}
    </div>
    <div class="card"><h2>Semak pantas</h2><p class="sub">Jawab ikut apa yang anda nampak sekarang.</p>${M.Q.map(seg).join('')}</div>
    <div class="nav-row"><a class="btn" href="#mula">← Utama</a><a class="btn primary" href="#pitch">Seterusnya: PITCH →</a></div>
  </div>
  <aside><div class="sticky"><div class="pv"><div class="pv-head"><i></i>Keputusan TNA langsung</div><div class="pv-body" id="tna-pv">${tnaPreview()}</div></div></div></aside></div></div>`;
}

/* ---------- PITCH ---------- */
function chips(group, map) {
  const cur = S[group]; return `<div class="chips" role="group">${Object.entries(map).map(([k, l]) => `<button type="button" class="chip ${cur.includes(k) ? 'on' : ''}" data-chip="${group}:${k}" aria-pressed="${cur.includes(k)}">${esc(l)}</button>`).join('')}</div>`;
}
function chipsOne(group, map) {
  return `<div class="chips" role="radiogroup">${Object.entries(map).map(([k, l]) => `<button type="button" class="chip ${S[group] === k ? 'on' : ''}" data-one="${group}:${k}" role="radio" aria-checked="${S[group] === k}">${esc(l)}</button>`).join('')}</div>`;
}
function pitchPreview() {
  const PI = M.pitch(S), tabs = [['skrip', 'Skrip 2 minit'], ['slaid', '5 slaid'], ['qa', 'Soalan bos']];
  let body = '';
  if (pitchTab === 'skrip') body = `<div class="tip"><b>Petua:</b> ${esc(PI.tip)}</div><textarea id="skrip" rows="13" data-skrip aria-label="Skrip dua minit">${esc(PI.skrip)}</textarea>
    <div class="counter ${PI.kata > 320 ? 'over' : ''}" id="kata">${PI.kata} patah perkataan · sasaran kira-kira 260</div>
    ${M.has(S.skripEdit) ? '<button class="btn sm" data-a="skrip-reset" style="margin-top:8px">Set semula skrip</button>' : ''}
    <div class="ai-row"><p><b>Mahu bunyi lebih tajam?</b> Salin prompt, tampal ke AI, kemudian tampal skrip baharu dalam kotak di atas.</p><div class="cta-row" style="margin:8px 0 0"><button class="btn gold sm" data-a="ai-copy">Salin prompt AI</button><a class="btn sm" href="https://chatgpt.com/" target="_blank" rel="noopener">ChatGPT</a><a class="btn sm" href="https://claude.ai/" target="_blank" rel="noopener">Claude</a></div></div>`;
  if (pitchTab === 'slaid') body = `<div class="slides">${PI.slaid.map((s, i) => `<div class="slide"><span class="no">SLAID ${i + 1}</span><h4>${esc(s.tajuk)}</h4>${li(s.poin)}</div>`).join('')}</div><p class="empty-note" style="margin-top:10px">Muat turun sebagai PowerPoint di halaman Pelan Saya.</p>`;
  if (pitchTab === 'qa') body = `<p style="font-size:13.5px;color:var(--muted);margin-bottom:10px">Bersedia untuk tiga soalan ini.</p><div class="qa">${PI.qa.map((q, i) => `<details ${i === 0 ? 'open' : ''}><summary>${i + 1}. ${esc(q.s)}</summary><p>${esc(q.j)}</p></details>`).join('')}</div>`;
  return `<div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" data-tab="${k}" class="${pitchTab === k ? 'on' : ''}" aria-selected="${pitchTab === k}">${l}</button>`).join('')}</div><div class="pv-body" id="pitch-body">${body}</div>`;
}
function pagePitch() {
  return `<div class="wrap"><p class="eyebrow">Langkah 2 daripada 3 · PITCH</p><h1>Apa nak <em>diminta?</em></h1>
  <p class="intro">Pilih keputusan yang anda mahu daripada superior. Skrip dan slaid disusun daripada TNA anda.</p>
  ${M.tna(S).fit === 'belum' ? '<div class="warn info">TNA belum lengkap, jadi pitch akan menyatakan banyak perkara sebagai “belum disahkan”. <a href="#tna">Lengkapkan TNA</a></div>' : ''}
  <div class="cols"><div>
    <div class="card"><h2>Apa yang anda mahu daripada superior?</h2><p class="sub">Pilih satu atau lebih. Permintaan yang khusus lebih mudah dijawab “ya”.</p>${chips('minta', M.KEPUTUSAN)}</div>
    <div class="card"><h2>Apa yang paling dipentingkan oleh superior anda?</h2><p class="sub">Pilih satu. Ia menentukan cara anda membingkai cadangan.</p>${chipsOne('penting', M.KEUTAMAAN)}</div>
    <div class="card"><div class="field" style="margin:0"><label for="kos">Kos atau masa yang diperlukan <span class="opt">pilihan</span></label><span class="hint">Biar kosong jika belum tahu. Jangan cipta angka.</span><input type="text" id="kos" data-f="kos" maxlength="300" value="${esc(S.kos)}" placeholder="cth. satu sesi 3.5 jam"></div></div>
    <div class="nav-row"><a class="btn" href="#tna">← TNA</a><a class="btn primary" href="#plan">Seterusnya: PLAN →</a></div>
  </div><aside><div class="sticky"><div class="pv"><div class="pv-head"><i></i>Pitch langsung</div><div id="pitch-pv">${pitchPreview()}</div></div></div></aside></div></div>`;
}

/* ---------- PLAN ---------- */
function taskRow(t, i) {
  return `<div class="task ${t.done ? 'done' : ''}" data-id="${esc(t.id)}"><label class="chk"><input type="checkbox" data-done="${esc(t.id)}" ${t.done ? 'checked' : ''} aria-label="Tanda siap tugasan ${i + 1}"></label>
  <div><textarea class="tt" rows="2" data-t="${esc(t.id)}" data-k="tugas" aria-label="Tugasan ${i + 1}">${esc(t.tugas)}</textarea>${t.bukti ? `<small class="bk">Bukti: ${esc(t.bukti)}</small>` : ''}</div>
  <div><input type="text" data-t="${esc(t.id)}" data-k="pic" value="${esc(t.pic)}" aria-label="PIC tugasan ${i + 1}"></div>
  <div><input type="date" data-t="${esc(t.id)}" data-k="siap" value="${esc(t.siap)}" aria-label="Siap pada"></div>
  <button class="del" data-a="del-task" data-id="${esc(t.id)}" aria-label="Buang tugasan ${i + 1}" title="Buang">✕</button></div>`;
}
function planDyn() {
  const PL = M.plan(S), stale = S.tasks && S.tasksSig && S.tasksSig !== sig();
  return {
    warn: PL.warns.map(w => `<div class="warn ${w.kind}">${esc(w.text)}</div>`).join('') + (stale ? '<div class="warn">Anda telah menyunting jadual, dan tetapan di atas berubah selepas itu. <button class="btn sm" data-a="regen">Jana semula jadual</button></div>' : ''),
    tasks: PL.tasks.map(taskRow).join(''),
    sum: PL.mula ? `<b>${esc(M.fmtD(PL.mula))}</b> hingga <b>${esc(M.fmtD(PL.tamat))}</b> · ${PL.total} langkah` : ''
  };
}
function pagePlan() {
  const D = planDyn();
  return `<div class="wrap"><p class="eyebrow">Langkah 3 daripada 3 · PLAN</p><h1>Bila <em>nak mula?</em></h1>
  <p class="intro">Pilih di mana cadangan anda sekarang dan tarikh mula. Enam langkah disusun mengikut hari bekerja. Semua boleh disunting.</p>
  <div class="card"><h2>Di mana cadangan anda sekarang?</h2>
    <div class="status-cards" role="radiogroup" aria-label="Status cadangan">${Object.entries(M.STATUS).map(([k, l]) => `<label><input type="radio" name="status" data-f="status" value="${k}" ${S.status === k ? 'checked' : ''}>${esc(l)}</label>`).join('')}</div>
    <div class="row2" style="margin-top:18px"><div class="field"><label for="mula">Tarikh mula</label><span class="hint">Jika kosong, jadual bermula hari bekerja berikutnya.</span><input type="date" id="mula" data-f="mula" value="${esc(S.mula)}"></div>
    <div class="field"><label for="nama">Nama anda <span class="opt">pilihan</span></label><span class="hint">Dipaparkan sebagai PIC dalam jadual.</span><input type="text" id="nama" data-f="nama" maxlength="80" value="${esc(S.nama)}"></div></div></div>
  <div id="plan-warn">${D.warn}</div>
  <div class="card"><div class="plan-head"><h2>Enam langkah anda</h2><span id="plan-sum">${D.sum}</span></div><p class="sub">Sunting tugasan, PIC dan tarikh siap. Tanda kotak apabila siap. PIC dan tarikh ialah cadangan sehingga dipersetujui.</p>
    <div class="task-head" aria-hidden="true"><span></span><span>Tugasan</span><span>PIC</span><span>Siap pada</span><span></span></div>
    <div class="tasks" id="plan-tasks">${D.tasks}</div>
    <div class="nav-row" style="margin-top:14px"><button class="btn sm" data-a="add-task">+ Tambah tugasan</button><button class="btn sm ghost" data-a="regen">Jana semula</button></div></div>
  <div class="nav-row"><a class="btn" href="#pitch">← PITCH</a><a class="btn primary" href="#hasil">Lihat Pelan Saya →</a></div></div>`;
}

/* ---------- HASIL ---------- */
function nextList() {
  const todo = M.plan(S).tasks.filter(t => !t.done).slice(0, 3);
  return todo.length ? todo.map(t => `<label><input type="checkbox" data-done="${esc(t.id)}"><span><b>${esc(t.tugas)}</b><small>${esc(t.pic)} · siap ${M.fmtD(t.siap)}</small></span></label>`).join('') : '<p class="empty-note"><b>Semua langkah telah ditanda siap.</b> Alhamdulillah. Semak hasil dan laporkan kepada superior.</p>';
}
function pageHasil() {
  const PL = M.plan(S), T = M.tna(S), PI = M.pitch(S);
  return `<div class="wrap"><p class="eyebrow">Hasil anda</p><h1>Pelan Saya. <em>Bawa pulang.</em></h1>
  <p class="intro">Ini ringkasan anda. Muat turun tiga fail di bawah, dan mulakan dengan tindakan pertama.</p>
  ${!M.progress(S).tna ? '<div class="warn">TNA belum lengkap. <a href="#tna">Lengkapkan</a> untuk hasil yang lebih bermakna.</div>' : ''}
  <div class="sum">
    <div class="sum-i"><span>TNA</span><b>${esc(T.keputusanTajuk)}</b></div>
    <div class="sum-i"><span>Anda minta</span><b>${esc(PI.kep.map(x => M.cut(x, 70)).join('; '))}</b></div>
    <div class="sum-i"><span>Mula</span><b>${PL.mula ? esc(M.fmtD(PL.mula)) : 'belum ditetapkan'}</b></div>
  </div>
  <div class="card" style="margin-top:18px"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:8px"><h2>Tindakan seterusnya</h2><b id="pct">${PL.done} daripada ${PL.total} siap</b></div><div class="progress-bar"><i id="pbar" style="width:${PL.pct}%"></i></div><div class="next" id="next" style="margin-top:14px">${nextList()}</div></div>
  <h2 style="margin:26px 0 12px">Muat turun</h2>
  <div class="exports">
    <button class="exp" data-a="x-pptx"><span class="ic">POWERPOINT</span><b>Slaid pitch</b><span>Muka depan, 5 slaid dan lampiran pelan.</span></button>
    <button class="exp" data-a="x-ics"><span class="ic">KALENDAR</span><b>Pelan ke telefon</b><span>Tarikh masuk terus ke kalendar anda.</span></button>
    <button class="exp" data-a="x-doc"><span class="ic">WORD</span><b>Dokumen lengkap</b><span>TNA, pitch dan pelan. Boleh disunting.</span></button></div>
  <details class="more"><summary>Format lain: PDF, Excel, sandaran</summary><div class="cta-row" style="margin:12px 0 0"><button class="btn sm" data-a="x-pdf">Cetak / PDF</button><button class="btn sm" data-a="x-csv">Excel (.csv)</button><button class="btn sm" data-a="backup" data-where="page">Sandaran (.json)</button></div></details>
  <p class="privacy" style="margin-top:14px"><b>Penting:</b> data hanya ada dalam pelayar ini. Jika anda kosongkan data pelayar atau tukar peranti, ia hilang. Muat turun fail sebelum menutup.</p>
  <details class="more"><summary>Lihat dokumen penuh</summary><div class="doc" id="doc" style="margin-top:12px">${M.docBody(S)}</div></details>
  ${S.lama ? `<details class="more"><summary>Catatan daripada planner lama</summary>${(S.lama.replies || []).filter(M.has).map((r, i) => `<pre class="prompt">${esc(r)}</pre>`).join('')}</details>` : ''}
  <div class="nav-row" style="margin-top:20px"><a class="btn" href="#plan">← PLAN</a><a class="btn" href="#bantuan">Panduan</a></div></div>`;
}

/* ---------- BANTUAN ---------- */
function pageBantuan() {
  return `<div class="wrap" style="max-width:780px"><p class="eyebrow">Panduan</p><h1>Ringkas. <em>Tiga langkah.</em></h1>
  <div class="card" style="margin-top:24px"><ol style="margin-top:4px;font-size:15px"><li><b>TNA:</b> tulis isu anda dan jawab empat semakan. Keputusan muncul di sebelah.</li><li><b>PITCH:</b> pilih apa yang anda mahu daripada superior. Skrip dan slaid siap.</li><li><b>PLAN:</b> pilih tarikh mula. Enam langkah disusun.</li><li><b>Pelan Saya:</b> muat turun slaid, kalendar dan dokumen.</li></ol></div>
  <div class="card"><h2>Adakah ini AI?</h2><p style="font-size:15px;margin-top:6px">Draf dijana oleh peraturan MOVE daripada jawapan anda, jadi ia berfungsi walaupun tiada akaun AI. Di langkah PITCH ada satu butang untuk menyalin prompt ke ChatGPT atau Claude jika anda mahu skrip yang lebih tajam.</p></div>
  <div class="card"><h2>Data anda</h2><p style="font-size:15px;margin-top:6px">Semua disimpan dalam pelayar anda sahaja. Tiada akaun dan tiada yang dihantar ke mana-mana. Kerana itu, <b>muat turun fail</b> sebelum menukar peranti atau mengosongkan data pelayar. Jika menggunakan AI, jangan tampal nama atau maklumat sulit.</p></div>
  <div class="card"><h2>Soalan lazim</h2>
    <details><summary><b>Saya tidak tahu jawapan semakan.</b></summary><p style="margin-top:6px">Pilih “Tak pasti”. Planner akan menyenaraikannya sebagai perkara untuk disahkan.</p></details>
    <details><summary><b>Boleh buka sandaran daripada planner lama?</b></summary><p style="margin-top:6px">Boleh. Menu, “Buka sandaran”. Planner juga membawa masuk data lama dalam pelayar yang sama secara automatik.</p></details>
    <details><summary><b>Fail tidak muncul selepas muat turun.</b></summary><p style="margin-top:6px">Klik pautan “klik di sini untuk memuat turun” di bahagian atas halaman, dan semak folder Downloads.</p></details>
    <details><summary><b>Jadual mengira cuti umum?</b></summary><p style="margin-top:6px">Tidak. Jadual hanya mengira Isnin hingga Jumaat. Semak tarikh anda.</p></details></div>
  <div class="nav-row"><a class="btn" href="#mula">← Utama</a><button class="btn danger" data-a="clear">Padam semua data</button></div></div>`;
}

/* ---------- render ---------- */
function render(focus) {
  const r = route(), pages = { mula: pageMula, tna: pageTNA, pitch: pagePitch, plan: pagePlan, hasil: pageHasil, bantuan: pageBantuan };
  $('#app').innerHTML = pages[r]();
  stepper(r);
  document.title = ({ mula: 'MOVE YOUR TEAM Planner', tna: 'TNA', pitch: 'PITCH', plan: 'PLAN', hasil: 'Pelan Saya', bantuan: 'Panduan' }[r]) + ' | AMPAC';
  save();
  if (focus) { scrollTo(0, 0); $('#app').focus({ preventScroll: true }); }
}
function refresh() {
  const r = route(); stepper(r);
  if (r === 'tna') $('#tna-pv').innerHTML = tnaPreview();
  if (r === 'pitch') { const ae = document.activeElement; if (!(ae && ae.id === 'skrip')) $('#pitch-pv').innerHTML = pitchPreview(); }
  if (r === 'plan') { const D = planDyn(); $('#plan-warn').innerHTML = D.warn; $('#plan-sum').innerHTML = D.sum; const ae = document.activeElement; if (!(ae && ae.closest && ae.closest('#plan-tasks'))) $('#plan-tasks').innerHTML = D.tasks; }
}
function updateProgress() {
  const PL = M.plan(S); if ($('#pct')) { $('#pct').textContent = PL.done + ' daripada ' + PL.total + ' siap'; $('#pbar').style.width = PL.pct + '%'; $('#next').innerHTML = nextList(); }
}

/* ---------- eksport ---------- */
const stamp = () => M.todayISO();
async function exportPPTX() {
  toast('Menyediakan slaid…');
  try { await loadScript('vendor/pptxgen.bundle.js'); } catch (e) { toast('Penjana slaid tidak dapat dimuatkan. Pastikan folder vendor dimuat naik.'); return; }
  const PI = M.pitch(S), PL = M.plan(S), p = new PptxGenJS();
  p.layout = 'LAYOUT_16x9'; p.title = 'MOVE YOUR TEAM: Cadangan'; p.company = 'AMPAC';
  let logo = null;
  try { const b = await (await fetch('assets/move-logo.png')).blob(); logo = await new Promise(res => { const f = new FileReader(); f.onload = () => res(f.result); f.readAsDataURL(b); }); } catch (e) { }
  p.defineSlideMaster({ title: 'MOVE', background: { color: 'FFFFFF' }, objects: [{ rect: { x: 0, y: 0, w: 0.28, h: 5.625, fill: { color: 'D51F35' } } }, { rect: { x: 0.28, y: 0, w: 0.06, h: 5.625, fill: { color: 'D6B574' } } }, { text: { text: 'MOVE YOUR TEAM · AMPAC', options: { x: 0.6, y: 5.22, w: 6, h: 0.3, fontSize: 9, color: '888888', fontFace: 'Arial' } } }], slideNumber: { x: 9.2, y: 5.22, fontSize: 9, color: '888888', fontFace: 'Arial' } });
  const c = p.addSlide(); c.background = { color: '17191D' };
  c.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 0.28, h: 5.625, fill: { color: 'D51F35' }, line: { color: 'D51F35' } });
  c.addShape(p.ShapeType.rect, { x: 0.28, y: 0, w: 0.06, h: 5.625, fill: { color: 'D6B574' }, line: { color: 'D6B574' } });
  if (logo) c.addImage({ data: logo, x: 0.7, y: 0.5, w: 1.9, h: 0.82 });
  c.addText('CADANGAN KEPADA PENGURUSAN', { x: 0.7, y: 1.7, w: 8.5, h: 0.4, fontSize: 12, bold: true, color: 'D6B574', charSpacing: 4, fontFace: 'Arial' });
  c.addText(M.cut(S.isu, 120) || 'Cadangan pembangunan pasukan', { x: 0.7, y: 2.1, w: 8.6, h: 1.7, fontSize: 28, bold: true, color: 'FFFFFF', fontFace: 'Arial', valign: 'top' });
  c.addText('Disediakan oleh ' + (S.nama || 'HR') + '  ·  ' + M.fmtD(stamp()), { x: 0.7, y: 4.5, w: 8, h: 0.4, fontSize: 12, color: 'C9CBD1', fontFace: 'Arial' });
  c.addText('Draf untuk perbincangan. PIC dan tarikh ialah cadangan sehingga dipersetujui.', { x: 0.7, y: 4.9, w: 8.6, h: 0.3, fontSize: 9, color: '8F929A', fontFace: 'Arial' });
  PI.slaid.forEach((s, i) => {
    const sl = p.addSlide({ masterName: 'MOVE' }), long = s.poin.join(' ').length > 360;
    sl.addText('SLAID ' + (i + 1), { x: 0.6, y: 0.32, w: 3, h: 0.3, fontSize: 10, bold: true, color: 'D51F35', charSpacing: 3, fontFace: 'Arial' });
    sl.addText(s.tajuk, { x: 0.6, y: 0.62, w: 8.8, h: 0.9, fontSize: 28, bold: true, color: '17191D', fontFace: 'Arial', valign: 'top' });
    sl.addText(s.poin.map(t => ({ text: t, options: { bullet: true, breakLine: true, paraSpaceAfter: 10 } })), { x: 0.6, y: 1.65, w: 8.8, h: 3.4, fontSize: long ? 15 : 19, color: '2D3136', fontFace: 'Arial', valign: 'top' });
    if (s.nota) sl.addNotes(s.nota);
  });
  const ap = p.addSlide({ masterName: 'MOVE' });
  ap.addText('Lampiran: Pelan tindakan', { x: 0.6, y: 0.3, w: 8.8, h: 0.5, fontSize: 22, bold: true, color: '17191D', fontFace: 'Arial' });
  const H = t => ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: 'D51F35' }, fontSize: 10, fontFace: 'Arial' } });
  const rows = [[H('No'), H('Tugasan'), H('PIC'), H('Mula'), H('Siap'), H('Bukti')]].concat(PL.tasks.map((t, i) => [String(i + 1), t.tugas, t.pic, M.fmtShort(t.mula), M.fmtShort(t.siap), t.bukti].map(x => ({ text: x, options: { fontSize: 9.5, fontFace: 'Arial', color: '2D3136', valign: 'top' } }))));
  ap.addTable(rows, { x: 0.6, y: 0.9, w: 8.9, colW: [0.35, 3.2, 1.6, 0.7, 0.7, 2.35], border: { type: 'solid', color: 'D8D6CF', pt: 0.5 }, autoPage: true, autoPageRepeatHeader: true, newSlideStartY: 0.5, margin: 0.05 });
  try { await p.writeFile({ fileName: 'MOVE-slaid-pitch.pptx' }); $('#dl-note').hidden = true; toast('Slaid dimuat turun: MOVE-slaid-pitch.pptx'); } catch (e) { toast('Gagal menjana slaid: ' + e.message); }
}
function exportPDF() {
  $('#print-area').innerHTML = '<div class="print-head"><img src="assets/move-logo.webp" alt="MOVE YOUR TEAM"><span>Draf untuk semakan organisasi · ' + esc(M.fmtD(stamp())) + '</span></div><div class="doc">' + M.docBody(S) + '</div>';
  setTimeout(() => window.print(), 60);
}

/* ---------- peristiwa ---------- */
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.f && t.type !== 'radio') { S[t.dataset.f] = t.value; save(); refresh(); }
  if (t.dataset.t) {
    ensureTasks(); const x = S.tasks.find(a => a.id === t.dataset.t); if (!x) return;
    x[t.dataset.k] = t.value; if (t.dataset.k === 'siap' && M.dOK(t.value) && (!M.dOK(x.mula) || x.mula > t.value)) x.mula = t.value; save();
    if (t.dataset.k === 'siap') $('#plan-sum').innerHTML = planDyn().sum;
  }
  if (t.dataset.skrip !== undefined) { S.skripEdit = t.value; save(); const n = t.value.trim().split(/\s+/).filter(Boolean).length; const k = $('#kata'); if (k) { k.textContent = n + ' patah perkataan · sasaran kira-kira 260'; k.classList.toggle('over', n > 320); } }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.d) { S.diag[t.dataset.d] = t.value === 'x' ? null : Number(t.value); save(); refresh(); }
  if (t.dataset.f && (t.type === 'radio' || t.type === 'date')) { S[t.dataset.f] = t.value; save(); refresh(); }
  if (t.dataset.done) {
    ensureTasks(); const x = S.tasks.find(a => a.id === t.dataset.done); if (x) x.done = t.checked; save();
    if (route() === 'plan') { const row = t.closest('.task'); if (row) row.classList.toggle('done', t.checked); } else updateProgress();
  }
  if (t.id === 'import-file') importFile(t);
});
document.addEventListener('click', e => {
  const m = $('#menu'); if (!e.target.closest('#menu')) { m.classList.remove('open'); $('#menu-btn').setAttribute('aria-expanded', 'false'); }
  if (e.target.closest('#menu-btn')) { const o = m.classList.toggle('open'); $('#menu-btn').setAttribute('aria-expanded', String(o)); return; }
  const chip = e.target.closest('[data-chip]'); if (chip) {
    const [g, k] = chip.dataset.chip.split(':'), a = S[g], i = a.indexOf(k);
    if (i >= 0) a.splice(i, 1); else a.push(k);
    save(); chip.classList.toggle('on', i < 0); chip.setAttribute('aria-pressed', String(i < 0)); refresh(); return;
  }
  const one = e.target.closest('[data-one]'); if (one) {
    const [g, k] = one.dataset.one.split(':'); S[g] = S[g] === k ? '' : k; save();
    $$('[data-one^="' + g + ':"]').forEach(c => { const on = c.dataset.one === g + ':' + S[g]; c.classList.toggle('on', on); c.setAttribute('aria-checked', String(on)); }); refresh(); return;
  }
  const tab = e.target.closest('[data-tab]'); if (tab) { pitchTab = tab.dataset.tab; $('#pitch-pv').innerHTML = pitchPreview(); return; }
  const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
  $('#menu').classList.remove('open');
  if (a === 'example') { const go = () => { S = M.exampleData(); save(); location.hash = 'tna'; render(true); }; (M.has(S.isu) || M.has(S.contoh) || S.tasks) ? ask('Gunakan contoh?', 'Isian semasa akan diganti dengan contoh. Muat turun sandaran dahulu jika anda mahu menyimpannya.', go) : go(); }
  if (a === 'reset') ask('Mulakan pelan baharu?', 'Pelan semasa pada peranti ini akan dikosongkan. Muat turun sandaran dahulu jika perlu.', () => { S = M.defaults(); save(); location.hash = 'mula'; render(true); });
  if (a === 'clear') ask('Padam semua data?', 'Semua jawapan dan jadual pada peranti ini akan dipadam. Tindakan ini tidak boleh dibatalkan.', () => { try { [M.KEY, ...M.OLD_KEYS].forEach(k => localStorage.removeItem(k)); } catch (e) { } S = M.defaults(); location.hash = 'mula'; render(true); toast('Semua data dipadam.'); });
  if (a === 'backup') download(JSON.stringify(Object.assign({ version: 5 }, S), null, 2), 'MOVE-sandaran.json', 'application/json');
  if (a === 'import') $('#import-file').click();
  if (a === 'skrip-reset') { S.skripEdit = ''; save(); $('#pitch-pv').innerHTML = pitchPreview(); }
  if (a === 'add-task') { ensureTasks(); const last = S.tasks[S.tasks.length - 1]; S.tasks.push({ id: M.uid(), fasa: last ? last.fasa : 'Laksana', tugas: 'Tugasan baharu', pic: '', mula: last ? last.siap : '', siap: last ? last.siap : '', bukti: '', dep: '', done: false }); save(); $('#plan-tasks').innerHTML = planDyn().tasks; const rows = $$('#plan-tasks .task'); rows[rows.length - 1].querySelector('textarea').focus(); }
  if (a === 'del-task') { ensureTasks(); S.tasks = S.tasks.filter(x => x.id !== b.dataset.id); if (!S.tasks.length) { S.tasks = null; S.tasksSig = ''; } save(); $('#plan-tasks').innerHTML = planDyn().tasks; refresh(); }
  if (a === 'regen') ask('Jana semula jadual?', 'Suntingan tugasan dan tanda siap akan diganti dengan jadual baharu daripada tetapan semasa.', () => { S.tasks = null; S.tasksSig = ''; save(); render(); });
  if (a === 'ai-copy') { const text = M.aiScriptPrompt(S); (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast('Prompt disalin. Tampal di ChatGPT atau Claude.')).catch(() => toast('Salinan automatik tidak tersedia pada pelayar ini.')); }
  if (a === 'x-pptx') exportPPTX();
  if (a === 'x-doc') download(M.toDoc(S), 'MOVE-pelan-saya.doc', 'application/msword');
  if (a === 'x-pdf') exportPDF();
  if (a === 'x-csv') download(M.toCSV(S), 'MOVE-pelan-tindakan.csv', 'text/csv;charset=utf-8');
  if (a === 'x-ics') download(M.toICS(S), 'MOVE-pelan-tindakan.ics', 'text/calendar;charset=utf-8');
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#menu').classList.remove('open'); });
async function importFile(inp) {
  const f = inp.files[0]; inp.value = ''; if (!f) return;
  if (f.size > 2e6) { toast('Fail terlalu besar. Had sandaran ialah 2MB.'); return; }
  try { const d = M.validate(JSON.parse(await f.text())); ask('Buka sandaran ini?', 'Pelan semasa pada peranti ini akan diganti.', () => { S = d; save(); render(); toast('Sandaran dibuka. Semak kandungan sebelum digunakan.'); }); } catch (e) { toast('Fail tidak sah. Pilih sandaran JSON daripada planner MOVE.'); }
}
window.addEventListener('hashchange', () => render(true));
window.addEventListener('beforeunload', () => { if (dlURL) URL.revokeObjectURL(dlURL); });
render();
