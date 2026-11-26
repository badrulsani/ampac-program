'use strict';
/* MOVE YOUR TEAM Planner 4.0: antara muka */
const M = Move, $ = (q, r = document) => r.querySelector(q), $$ = (q, r = document) => [...r.querySelectorAll(q)], esc = M.esc;
const ROUTES = ['mula', 'tna', 'pitch', 'plan', 'hasil', 'bantuan'];
let S = M.defaults(), storageOK = true, pitchTab = 'kertas', dlURL = null, job = null, lastSaved = null;

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
  el.innerHTML = storageOK ? '<span>Disimpan pada peranti ini' + (lastSaved ? ' · ' + String(lastSaved.getHours()).padStart(2, '0') + ':' + String(lastSaved.getMinutes()).padStart(2, '0') : '') + '</span>' : '<span>Storan pelayar tidak tersedia. Muat turun sandaran.</span>';
}
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { }
const sig = () => JSON.stringify([S.status, S.mula, S.latihan, S.semak, S.nama]);
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

/* ---------- komponen borang ---------- */
function ftext(k, label, hint, ex, o = {}) {
  const tag = o.line ? `<input type="text" id="${k}" data-f="${k}" maxlength="${o.max || 8000}" value="${esc(S[k])}" aria-describedby="${k}-h" ${o.ph ? 'placeholder="' + esc(o.ph) + '"' : ''}>` :
    `<textarea id="${k}" data-f="${k}" maxlength="${o.max || 8000}" rows="${o.rows || 3}" aria-describedby="${k}-h">${esc(S[k])}</textarea>`;
  return `<div class="field"><label for="${k}">${label}${o.opt ? ' <span class="opt">pilihan</span>' : ''}</label><span class="hint" id="${k}-h">${hint}</span>${tag}${ex && !S.ex ? `<div class="ex"><b>Contoh:</b> ${ex}</div>` : ''}</div>`;
}
function seg(q) {
  const cur = S.diag[q.id], o = [['2', 'Ya'], ['1', 'Sebahagian'], ['0', 'Tidak'], ['x', 'Tak pasti']];
  return `<div class="q" role="radiogroup" aria-labelledby="${q.id}-l"><p id="${q.id}-l">${esc(q.t)}</p><small>${esc(q.h)}</small><div class="seg">${o.map(([v, l]) => `<label><input type="radio" name="${q.id}" data-d="${q.id}" value="${v}" ${(cur === null && v === 'x') ? 'checked' : String(cur) === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>`;
}

/* ---------- stepper ---------- */
function stepper(r) {
  const pg = M.progress(S), items = [['tna', 'TNA', 'Kenal pasti punca', pg.tna], ['pitch', 'PITCH', 'Bentang kepada superior', pg.pitch], ['plan', 'PLAN', 'Pelan & timeline', pg.plan], ['hasil', 'Pelan Saya', 'Muat turun & jejak', null]];
  $('#stepper .wrap').innerHTML = items.map(([k, a, b, p], i) => `<a href="#${k}" class="${r === k ? 'on' : ''} ${p !== null && p >= 70 && r !== k ? 'done' : ''}" ${r === k ? 'aria-current="step"' : ''}><span class="n">${p !== null && p >= 70 && r !== k ? '✓' : i + 1}</span><span><b>${a}</b><small>${p !== null ? p + '% lengkap' : b}</small></span></a>`).join('');
}

/* ---------- halaman: mula ---------- */
function pageMula() {
  const pg = M.progress(S), started = M.has(S.isu) || M.has(S.pihak) || S.tasks;
  return `<div class="wrap"><div class="hero"><div>
    <p class="eyebrow">MOVE YOUR TEAM · Planner 4.0</p>
    <h1>Bawa satu cabaran.<br><em>Pulang dengan satu pelan.</em></h1>
    <p class="intro">Jawab soalan tentang satu isu kerja. Planner menyusun analisis keperluan, bahan pembentangan kepada superior, dan pelan tindakan bertarikh. Anda boleh muat turunnya sebagai slaid, dokumen dan kalendar.</p>
    <div class="cta-row"><a class="btn primary" href="#tna" data-a="start">${started ? 'Sambung pelan saya' : 'Mula dengan isu saya'} →</a><button class="btn" data-a="example">Cuba dengan contoh rekaan</button></div>
    ${started ? `<div class="resume"><div><b>Draf anda masih ada pada peranti ini.</b><br><small>TNA ${pg.tna}% · Pitch ${pg.pitch}% · Pelan ${pg.plan}%${S.lama ? ' · Data versi lama telah dibawa masuk' : ''}</small></div><a class="btn sm" href="#hasil">Lihat Pelan Saya</a></div>` : ''}
    </div>
    <div class="hero-card"><h3>Apa yang anda bawa pulang</h3><ul>
      <li><b>Draf TNA:</b> latihan memang jawapan, atau puncanya lain?</li>
      <li><b>Slaid pitch (.pptx)</b> dengan nota penyampai</li>
      <li><b>Kertas cadangan satu muka surat</b> dan skrip dua minit</li>
      <li><b>Lima soalan sukar</b> daripada superior, bersama draf jawapan</li>
      <li><b>Pelan tindakan bertarikh</b> (Excel dan kalendar telefon)</li>
      <li><b>Penjejak tugas</b> yang boleh ditanda selepas program</li></ul></div></div>
    <div class="how">
      <div class="card"><span class="no">LANGKAH 1 · TNA</span><h3>Kenal pasti punca</h3><p>Empat soalan tentang isu, dan sembilan semakan pantas. Draf TNA muncul langsung semasa anda menaip.</p></div>
      <div class="card"><span class="no">LANGKAH 2 · PITCH</span><h3>Susun cadangan</h3><p>Pilih keputusan yang anda mahu daripada superior. Planner menjana kertas, slaid, skrip dan jawapan soalan sukar.</p></div>
      <div class="card"><span class="no">LANGKAH 3 · PLAN</span><h3>Gerakkan tindakan</h3><p>Pilih status cadangan dan tarikh mula. Jadual tugas, PIC dan timeline disusun ikut hari bekerja.</p></div></div>
    <p class="privacy"><b>Peribadi:</b> semua jawapan disimpan dalam pelayar anda sahaja dan tiada yang dihantar ke pelayan. Gunakan contoh tanpa nama, bukan maklumat sulit. <b>Planner ini berfungsi tanpa AI.</b> ChatGPT atau Gemini hanya pilihan untuk menajamkan draf.</p></div>`;
}

/* ---------- halaman: TNA ---------- */
function meter(name, v) {
  const [cls, lab] = v === null ? ['na', 'Belum dinilai'] : v >= 1.5 ? ['', 'Kukuh'] : v >= 1.25 ? ['mid', 'Sederhana'] : ['low', 'Jurang'];
  return `<div class="meter ${cls}"><span>${name}</span><div class="tr"><i style="width:${v === null ? 100 : Math.max(8, v / 2 * 100)}%"></i></div><b>${lab}</b></div>`;
}
const li = a => '<ul>' + a.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
function tnaPreview() {
  const T = M.tna(S), ev = T.bukti || {};
  return `<div class="verdict ${T.fit}"><h3>${esc(T.keputusanTajuk)}</h3><p>${esc(T.dapatan)}</p></div>
  <div class="meters" aria-label="Skor tiga faktor">${meter('Kemampuan', T.skor.K)}${meter('Peluang', T.skor.P)}${meter('Motivasi', T.skor.M)}</div>
  <p style="font-size:14px"><b>Kekuatan bukti:</b> <span class="badge ${ev.tier}">${esc(ev.tier || 'belum')}</span> ${esc(ev.text || '')}</p>
  <h4>Cadangan penyelesaian</h4>${li(T.intervensi)}<h4>Hipotesis punca</h4>${li(T.hipotesis)}<h4>Objektif pembelajaran</h4>${li(T.objektif)}
  <h4>Cara menyemak</h4>${li(T.semakPembelajaran)}<h4>Perlu disahkan sebelum membentang</h4>${T.perluSahkan.length ? li(T.perluSahkan) : '<p class="empty-note">Tiada.</p>'}
  <h4>Soalan pengesahan untuk penyelia</h4>${li(T.soalanPengesahan)}${S.ai.tna ? '' : ''}`;
}
function pageTNA() {
  const dims = { K: 'Kemampuan', P: 'Peluang', M: 'Motivasi', B: 'Bukti' };
  let last = '', qs = '';
  M.Q.forEach(q => { if (q.dim !== last) { qs += `<div class="dim">${q.dim === 'B' ? 'Seberapa kukuh bukti anda?' : M.DIMLONG[q.dim]}</div>`; last = q.dim; } qs += seg(q); });
  return `<div class="wrap"><p class="eyebrow">Langkah 1 daripada 3 · TNA</p><h1>Sebenarnya, apa <em>masalahnya?</em></h1>
  <p class="intro">Mulakan dengan bahasa anda sendiri. Tidak perlu istilah HR. Jika belum tahu sesuatu, pilih “Tak pasti”. Planner akan senaraikannya sebagai perkara untuk disahkan.</p>
  ${S.ex ? '<div class="warn">Anda sedang menggunakan <b>contoh rekaan</b>. Gantikan dengan situasi sebenar sebelum membuat cadangan kepada organisasi.</div>' : ''}
  <div class="cols"><div>
    <div class="card"><h2>Ceritakan isu anda</h2><p class="sub">Satu pelan untuk satu isu. Sasaran boleh seorang, satu pasukan kecil atau satu jabatan.</p>
      ${ftext('isu', 'Apa masalah yang sedang berlaku?', 'Ceritakan perkara yang mengganggu kerja.', 'Serahan kerja Sales kepada Operations kerap tidak lengkap.')}
      ${ftext('pihak', 'Siapa yang terlibat?', 'Peranan atau pasukan yang terlibat. Belum semestinya senarai peserta program.', 'Pegawai Sales dan Operations yang mengurus pesanan.')}
      ${ftext('contoh', 'Boleh beri satu contoh kejadian?', 'Apa yang berlaku, bukan andaian. Tidak perlu cipta angka.', 'Permintaan semakan stok tanpa tarikh siap, lalu Operations perlu bertanya semula.')}
      ${ftext('hasil', 'Apa perubahan yang anda mahu nampak?', 'Bagaimana kerja sepatutnya berjalan selepas penambahbaikan.', 'Serahan menyebut hasil, PIC dan tarikh siap.')}
      ${ftext('ukur', 'Apa yang boleh dikira untuk menunjukkan perubahan?', 'Satu penunjuk mudah, contohnya bilangan kes atau masa.', 'Bilangan kes tanya semula setiap 20 serahan.', { opt: true, line: true })}
    </div>
    <div class="card"><h2>Semak punca</h2><p class="sub">Sembilan semakan pantas. Jawab ikut apa yang anda nampak sekarang.</p>${qs}</div>
    <div class="nav-row"><a class="btn" href="#mula">← Utama</a><a class="btn primary" href="#pitch">Seterusnya: PITCH →</a></div>
  </div>
  <aside><div class="sticky"><div class="pv"><div class="pv-head"><i></i>Draf TNA langsung</div><div class="pv-body" id="tna-pv">${tnaPreview()}</div></div></div></aside></div>
  ${aiPanel('tna')}</div>`;
}

/* ---------- halaman: PITCH ---------- */
function chips(group, map, max) {
  const cur = S[group]; return `<div class="chips" role="group">${Object.entries(map).map(([k, l]) => `<button type="button" class="chip ${cur.includes(k) ? 'on' : ''}" data-chip="${group}:${k}" aria-pressed="${cur.includes(k)}">${esc(l)}</button>`).join('')}</div>`;
}
function pitchPreview() {
  const PI = M.pitch(S), tabs = [['kertas', 'Kertas 1 muka surat'], ['strategi', 'Strategi'], ['slaid', '5 Slaid'], ['skrip', 'Skrip 2 minit'], ['qa', 'Soalan sukar']];
  let body = '';
  if (pitchTab === 'kertas') body = `<div class="paper">${PI.kertas.map(k => `<h3>${esc(k.tajuk)}</h3><p>${esc(k.teks)}</p>`).join('')}</div>`;
  if (pitchTab === 'strategi') body = li(PI.strategi);
  if (pitchTab === 'slaid') body = `<div class="slides">${PI.slaid.map((s, i) => `<div><div class="slide"><span class="no">SLAID ${i + 1}</span><h4>${esc(s.tajuk)}</h4>${li(s.poin)}</div><div class="snote"><b>Nota penyampai:</b> ${esc(s.nota)}</div></div>`).join('')}</div>`;
  if (pitchTab === 'skrip') body = `<p style="font-size:13.5px;color:var(--muted);margin-bottom:10px">Boleh disunting terus di bawah. Sasaran kira-kira 260 patah perkataan untuk dua minit.</p><textarea id="skrip" rows="14" data-skrip aria-label="Skrip dua minit">${esc(PI.skrip)}</textarea><div class="counter ${PI.kata > 320 ? 'over' : ''}" id="kata">${PI.kata} patah perkataan · anggaran ${Math.max(1, Math.round(PI.kata / 140 * 10) / 10)} minit</div>${M.has(S.skripEdit) ? '<button class="btn sm" data-a="skrip-reset" style="margin-top:8px">Set semula skrip daripada input</button>' : ''}`;
  if (pitchTab === 'qa') body = `<div class="qa">${PI.qa.map((q, i) => `<details ${i === 0 ? 'open' : ''}><summary>${i + 1}. ${esc(q.s)}</summary><p>${esc(q.j)}</p></details>`).join('')}</div>`;
  return `<div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" data-tab="${k}" class="${pitchTab === k ? 'on' : ''}" aria-selected="${pitchTab === k}">${l}</button>`).join('')}</div><div class="pv-body" id="pitch-body">${body}</div>`;
}
function pagePitch() {
  return `<div class="wrap"><p class="eyebrow">Langkah 2 daripada 3 · PITCH</p><h1>Cadangan yang boleh dibawa <em>ke meja superior.</em></h1>
  <p class="intro">Planner menggunakan TNA anda untuk menyusun kertas, slaid, skrip dan persediaan soalan. Pilih apa yang anda mahu daripada superior.</p>
  ${M.tna(S).fit === 'belum' ? '<div class="warn info">TNA belum cukup lengkap. Pitch masih dijana, tetapi akan menyatakan banyak perkara sebagai “belum disahkan”. <a href="#tna">Lengkapkan TNA</a></div>' : ''}
  <div class="cols"><div>
    <div class="card"><h2>Apa keputusan yang anda mahu?</h2><p class="sub">Pilih satu atau lebih. Permintaan yang khusus lebih mudah dijawab “ya”.</p>${chips('keputusan', M.KEPUTUSAN)}</div>
    <div class="card"><h2>Apa yang paling diberi perhatian oleh superior?</h2><p class="sub">Pilih sehingga dua. Ia menentukan cara anda membingkai cadangan.</p>${chips('keutamaan', M.KEUTAMAAN)}</div>
    <div class="card"><h2>Sumber yang diperlukan</h2><p class="sub">Jangan cipta angka. Biar kosong jika belum tahu.</p>
      <div class="row2"><div class="field"><label for="kos">Anggaran kos (RM) <span class="opt">pilihan</span></label><input type="text" inputmode="numeric" id="kos" data-f="kos" maxlength="20" value="${esc(S.kos)}" placeholder="cth. 12500"></div>
      <div class="field"><label for="masa">Masa yang diperlukan <span class="opt">pilihan</span></label><input type="text" id="masa" data-f="masa" maxlength="200" value="${esc(S.masa)}" placeholder="cth. 1 sesi 3.5 jam + 15 minit mingguan"></div></div></div>
    <div class="nav-row"><a class="btn" href="#tna">← TNA</a><a class="btn primary" href="#plan">Seterusnya: PLAN →</a></div>
  </div><aside><div class="sticky"><div class="pv"><div class="pv-head"><i></i>Pakej pitch langsung</div><div id="pitch-pv">${pitchPreview()}</div></div></div></aside></div>${aiPanel('pitch')}</div>`;
}

/* ---------- halaman: PLAN ---------- */
function gantt(PL) {
  const T = PL.tasks.filter(t => M.dOK(t.mula) && M.dOK(t.siap)); if (!T.length) return '<p class="empty-note">Masukkan tarikh untuk melihat carta.</p>';
  const a = M.P(PL.mula), b = M.P(PL.tamat), total = Math.max(1, (b - a) / 864e5 + 1), pos = d => (M.P(d) - a) / 864e5 / total * 100;
  let ticks = '', d = new Date(a); d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7)); let n = 0;
  const step = total > 70 ? 14 : 7;
  for (let x = new Date(a); x <= b; x.setUTCDate(x.getUTCDate() + step)) { const iso = M.F(x); ticks += `<span style="left:${pos(iso)}%">${M.fmtShort(iso)}</span>`; if (++n > 20) break; }
  return `<div class="gwrap"><div class="g-axis">${ticks}</div>${T.map((t, i) => `<div class="g-row ${t.done ? 'done' : ''}"><div class="gl" title="${esc(t.tugas)}">${i + 1}. ${esc(M.cut(t.tugas, 36))}</div><div class="gt"><div class="gb ${/Jalankan/.test(t.tugas) ? 'pin' : ''}" style="left:${pos(t.mula)}%;width:${Math.max(0.8, (M.P(t.siap) - M.P(t.mula)) / 864e5 / total * 100 + 100 / total)}%"></div></div></div>`).join('')}</div>`;
}
function taskRow(t, i) {
  return `<div class="task ${t.done ? 'done' : ''}" data-id="${esc(t.id)}"><label class="chk"><input type="checkbox" data-done="${esc(t.id)}" ${t.done ? 'checked' : ''} aria-label="Tanda siap tugasan ${i + 1}"></label>
  <div><textarea class="tt" rows="2" data-t="${esc(t.id)}" data-k="tugas" aria-label="Tugasan ${i + 1}">${esc(t.tugas)}</textarea></div>
  <div><input type="text" data-t="${esc(t.id)}" data-k="pic" value="${esc(t.pic)}" aria-label="PIC tugasan ${i + 1}"></div>
  <div><input type="date" data-t="${esc(t.id)}" data-k="mula" value="${esc(t.mula)}" aria-label="Mula"></div>
  <div><input type="date" data-t="${esc(t.id)}" data-k="siap" value="${esc(t.siap)}" aria-label="Siap"></div>
  <button class="del" data-a="del-task" data-id="${esc(t.id)}" aria-label="Buang tugasan ${i + 1}" title="Buang">✕</button>
  <div class="ev"><input type="text" data-t="${esc(t.id)}" data-k="bukti" value="${esc(t.bukti)}" placeholder="Hasil / bukti" aria-label="Hasil atau bukti"></div></div>`;
}
function planDyn() {
  const PL = M.plan(S), stale = S.tasks && S.tasksSig && S.tasksSig !== sig();
  const warns = PL.warns.map(w => `<div class="warn ${w.kind}">${esc(w.text)}</div>`).join('');
  return { warn: warns + (stale ? '<div class="warn">Anda telah menyunting jadual, dan tetapan di atas berubah selepas itu. <button class="btn sm" data-a="regen">Jana semula jadual</button> (suntingan tugas akan diganti).</div>' : ''), tasks: PL.tasks.map((t, i) => (i === 0 || PL.tasks[i - 1].fasa !== t.fasa ? `<div class="dim" style="margin:14px 0 0">${esc(t.fasa)}</div>` : '') + taskRow(t, i)).join(''), gantt: gantt(PL), PL };
}
function pagePlan() {
  const D = planDyn(), o = Object.entries(M.STATUS);
  return `<div class="wrap"><p class="eyebrow">Langkah 3 daripada 3 · PLAN</p><h1>Pelan tindakan. <em>Timeline untuk bergerak.</em></h1>
  <p class="intro">Pilih status cadangan dan tarikh. Planner menyusun tugas, cadangan PIC dan tarikh ikut hari bekerja. Semua boleh disunting. Tempoh mengikut keperluan anda, bukan tempoh tetap.</p>
  <div class="card"><h2>Di mana cadangan anda sekarang?</h2><p class="sub">Status ini menentukan langkah mana yang perlu dibuat dahulu.</p>
    <div class="status-cards" role="radiogroup" aria-label="Status cadangan">${o.map(([k, l]) => `<label><input type="radio" name="status" data-f="status" value="${k}" ${S.status === k ? 'checked' : ''}>${esc(l)}</label>`).join('')}</div>
    <div class="row2" style="margin-top:18px"><div class="field"><label for="mula">Tarikh mula gerak kerja <span class="opt">pilihan</span></label><span class="hint">Bila anda mula mengesahkan keperluan. Jika kosong, jadual bermula hari bekerja berikutnya.</span><input type="date" id="mula" data-f="mula" value="${esc(S.mula)}"></div>
    <div class="field"><label for="latihan">Tarikh latihan <span class="opt">jika sudah ada</span></label><span class="hint">Jadual akan mengunci latihan pada tarikh ini dan memberi amaran jika persediaan tidak sempat.</span><input type="date" id="latihan" data-f="latihan" value="${esc(S.latihan)}"></div></div>
    <div class="field" style="max-width:320px"><label for="semak">Tempoh pemantauan selepas latihan</label><select id="semak" data-f="semak">${[2, 4, 6, 8].map(w => `<option value="${w}" ${S.semak === w ? 'selected' : ''}>${w} minggu</option>`).join('')}</select></div>
    <div class="lbl" style="margin-top:6px">Nama pelaksana <span class="opt">pilihan, untuk dipaparkan dalam PIC</span></div>
    <div class="row4">${[['hr', 'HR / penyelaras'], ['penyelia', 'Penyelia'], ['pemilik', 'Pemilik proses'], ['trainer', 'Trainer']].map(([k, l]) => `<div class="field" style="margin:0"><label for="n-${k}" style="font-weight:400;font-size:12.5px">${l}</label><input type="text" id="n-${k}" data-n="${k}" maxlength="80" value="${esc(S.nama[k])}"></div>`).join('')}</div>
  </div>
  <div id="plan-warn">${D.warn}</div>
  <div class="card"><h2>Jadual tugas</h2><p class="sub">Sunting terus. Tanda kotak apabila siap. Cadangan PIC dan tarikh perlu dipersetujui pihak berkenaan.</p><div class="tasks" id="plan-tasks">${D.tasks}</div>
    <div class="nav-row" style="margin-top:14px"><button class="btn sm" data-a="add-task">+ Tambah tugasan</button><button class="btn sm ghost" data-a="regen">Jana semula daripada tetapan</button></div></div>
  <div class="card"><h2>Timeline</h2><div class="gantt" id="plan-gantt">${D.gantt}</div></div>
  <div class="nav-row"><a class="btn" href="#pitch">← PITCH</a><a class="btn primary" href="#hasil">Lihat Pelan Saya →</a></div>${aiPanel('plan')}</div>`;
}

/* ---------- halaman: HASIL ---------- */
function nextList() {
  const PL = M.plan(S), todo = PL.tasks.filter(t => !t.done).slice(0, 3);
  return todo.length ? todo.map(t => `<label><input type="checkbox" data-done="${esc(t.id)}"><span><b>${esc(t.tugas)}</b><small>${esc(t.pic)} · ${M.fmtD(t.mula)} hingga ${M.fmtD(t.siap)}</small></span></label>`).join('') : '<p class="empty-note"><b>Semua tugas telah ditanda siap.</b> Alhamdulillah. Semak hasil dan laporkan kepada superior.</p>';
}
function pageHasil() {
  const PL = M.plan(S), pg = M.progress(S), thin = pg.tna < 40;
  return `<div class="wrap"><p class="eyebrow">Hasil anda</p><h1>Pelan Saya. <em>Bawa pulang dan gerakkan.</em></h1>
  <p class="intro">Semak kandungan, kemudian muat turun dalam format yang anda perlukan. Draf ini membantu anda berfikir dan membentang. Pengesahan tetap di tangan HR, penyelia dan organisasi.</p>
  ${thin ? '<div class="warn">Draf masih nipis. <a href="#tna">Lengkapkan TNA</a> untuk hasil yang lebih bermakna.</div>' : ''}
  <div class="card" style="margin-top:22px"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:8px"><h2>Kemajuan pelan tindakan</h2><b id="pct">${PL.done} daripada ${PL.total} tugasan · ${PL.pct}%</b></div><div class="progress-bar"><i id="pbar" style="width:${PL.pct}%"></i></div>
    <h3 style="margin:18px 0 8px">Tindakan seterusnya</h3><div class="next" id="next">${nextList()}</div></div>
  <h2 style="margin:26px 0 12px">Muat turun</h2>
  <div class="exports">
    <button class="exp" data-a="x-pptx"><span class="ic">PPTX</span><b>Slaid pitch</b><span>Muka depan, lima slaid dengan nota penyampai, dan lampiran pelan. Buka dalam PowerPoint atau Google Slides.</span></button>
    <button class="exp" data-a="x-doc"><span class="ic">WORD</span><b>Dokumen penuh</b><span>TNA, kertas cadangan, skrip, soalan sukar dan pelan. Boleh disunting dalam Word.</span></button>
    <button class="exp" data-a="x-pdf"><span class="ic">PDF</span><b>Cetak / simpan PDF</b><span>Susun atur kemas untuk dicetak atau dihantar kepada superior.</span></button>
    <button class="exp" data-a="x-csv"><span class="ic">EXCEL</span><b>Jadual pelan tindakan</b><span>Fail .csv untuk Excel atau Google Sheets.</span></button>
    <button class="exp" data-a="x-ics"><span class="ic">KALENDAR</span><b>Tarikh ke kalendar</b><span>Fail .ics untuk Google Calendar, Outlook atau iPhone.</span></button>
    <button class="exp" data-a="backup"><span class="ic">SANDARAN</span><b>Sandaran planner</b><span>Fail .json untuk dibuka semula atau dipindah ke peranti lain.</span></button></div>
  <p class="privacy" style="margin-top:14px"><b>Penting:</b> data disimpan dalam pelayar ini sahaja. Jika anda kosongkan data pelayar atau bertukar peranti, ia hilang. Muat turun sandaran dan dokumen sebelum menutup.</p>
  <h2 style="margin:30px 0 12px">Pratonton dokumen</h2><div class="doc" id="doc">${M.docBody(S)}</div>
  ${S.lama ? `<div class="card" style="margin-top:20px"><h2>Catatan daripada versi lama</h2><p class="sub">Teks yang dahulu anda tampal daripada AI dibawa masuk di sini supaya tidak hilang.</p>${(S.lama.replies || []).filter(M.has).map((r, i) => `<details><summary><b>Teks AI ${i + 1}</b></summary><pre class="prompt">${esc(r)}</pre></details>`).join('')}${S.lama.keputusan ? `<p style="margin-top:10px"><b>Keputusan yang diminta:</b> ${esc(S.lama.keputusan)}</p>` : ''}</div>` : ''}
  <div class="nav-row" style="margin-top:20px"><a class="btn" href="#plan">← PLAN</a><a class="btn" href="#bantuan">Panduan</a></div></div>`;
}

/* ---------- halaman: BANTUAN ---------- */
function pageBantuan() {
  return `<div class="wrap" style="max-width:820px"><p class="eyebrow">Panduan</p><h1>Ringkas di hadapan. <em>Jelas di setiap langkah.</em></h1>
  <div class="card" style="margin-top:24px"><h2>Cara menggunakan</h2><ol style="margin-top:8px;font-size:15px"><li><b>TNA:</b> ceritakan satu isu dan jawab sembilan semakan. Draf muncul langsung di sebelah.</li><li><b>PITCH:</b> pilih keputusan yang anda mahu dan perkara yang dipentingkan superior.</li><li><b>PLAN:</b> pilih status cadangan dan tarikh mula. Sunting jadual jika perlu.</li><li><b>Pelan Saya:</b> muat turun slaid, dokumen, Excel dan kalendar. Tanda tugas yang siap.</li></ol></div>
  <div class="card"><h2>Adakah ini AI?</h2><p style="font-size:15px;margin-top:6px">Draf asas dijana oleh peraturan MOVE: ia menganalisis jawapan anda dan menyusun cadangan serta jadual, jadi ia berfungsi walaupun tiada akaun AI atau internet perlahan. Untuk bahasa dan cadangan yang lebih tajam, setiap langkah ada bahagian <b>“Mahu draf lebih tajam?”</b>. Anda salin prompt ke ChatGPT atau Gemini, kemudian tampal jawapannya. Planner membacanya dan menggantikan teks. Anda sentiasa boleh kembali kepada draf asal.</p></div>
  <div class="card"><h2>Bagaimana data dikendalikan?</h2><p style="font-size:15px;margin-top:6px">Semua jawapan disimpan dalam pelayar anda sahaja. Tiada akaun dan tiada yang dihantar ke pelayan. Kerana itu, <b>muat turun sandaran</b> sebelum menukar peranti atau mengosongkan data pelayar. Jika menggunakan AI, nyahkenal data: jangan masukkan nama, nombor pekerja atau maklumat sulit syarikat.</p></div>
  <div class="card"><h2>Soalan lazim</h2>
    <details><summary><b>Saya tidak tahu jawapan semakan punca.</b></summary><p style="margin-top:6px">Pilih “Tak pasti”. Planner akan senaraikannya sebagai perkara untuk disahkan dan menyatakan ia dalam pitch.</p></details>
    <details><summary><b>Siapa yang mesti mengesahkan cadangan?</b></summary><p style="margin-top:6px">HR bersama penyelia, pemilik proses atau superior yang berkenaan. PIC dan tarikh ialah cadangan sehingga dipersetujui.</p></details>
    <details><summary><b>Mengapa jadual tidak bermula pada tarikh yang saya mahu?</b></summary><p style="margin-top:6px">Isi “Tarikh mula gerak kerja”. Jadual hanya menggunakan hari bekerja (Isnin hingga Jumaat) dan tidak mengambil kira cuti umum, jadi semak tarikh anda.</p></details>
    <details><summary><b>Boleh buka sandaran daripada planner lama?</b></summary><p style="margin-top:6px">Boleh. Menu, “Buka sandaran”, pilih fail .json versi 1, 2 atau 3. Isu, pihak terlibat, contoh, tarikh dan status dibawa masuk. Teks AI lama disimpan di halaman Pelan Saya.</p></details>
    <details><summary><b>Bagaimana jika fail tidak termuat turun di telefon?</b></summary><p style="margin-top:6px">Klik pautan “klik di sini untuk memuat turun” di bahagian atas selepas anda menekan butang muat turun, dan semak folder Downloads.</p></details></div>
  <div class="nav-row"><a class="btn" href="#mula">← Utama</a><button class="btn danger" data-a="clear">Padam semua data pada peranti ini</button></div></div>`;
}

/* ---------- panel AI (pilihan) ---------- */
function aiPanel(step) {
  const on = S.ai[step], label = { tna: 'TNA', pitch: 'pakej pitch', plan: 'pelan tindakan' }[step];
  return `<details class="ai" id="ai-${step}" ${on ? 'open' : ''}><summary>Mahu draf lebih tajam? Guna ChatGPT atau Gemini <span class="tag-opt">pilihan</span></summary>
  <p style="font-size:14px;color:var(--muted);margin-top:10px">Planner sudah menjana draf di atas tanpa AI. Langkah ini hanya untuk menajamkan bahasa dan cadangan ${label} anda.</p>
  <div class="ai-steps"><div><b>1.</b> Salin prompt dan tampal ke ChatGPT atau Gemini.</div><div><b>2.</b> Salin jawapan penuh AI (ia dalam format JSON).</div><div><b>3.</b> Tampal di bawah dan tekan “Guna jawapan”.</div></div>
  <div class="cta-row" style="margin:0 0 12px"><button class="btn primary sm" data-a="ai-copy" data-step="${step}">Salin prompt</button><a class="btn sm" href="https://chatgpt.com/" target="_blank" rel="noopener">Buka ChatGPT</a><a class="btn sm" href="https://gemini.google.com/" target="_blank" rel="noopener">Buka Gemini</a></div>
  <textarea data-ai="${step}" placeholder="Tampal jawapan AI di sini…" aria-label="Jawapan AI untuk ${label}"></textarea>
  <div class="cta-row" style="margin:10px 0 0"><button class="btn sm gold" data-a="ai-apply" data-step="${step}">Guna jawapan</button></div>
  <div class="ai-msg" id="ai-msg-${step}" role="status"></div>
  ${on ? `<div class="ai-on"><span><b>Draf dipertingkat oleh AI sedang digunakan.</b> Semak fakta sebelum membentang.</span><button class="btn sm" data-a="ai-clear" data-step="${step}">Kembali ke draf asal</button></div>` : ''}
  <details style="margin-top:12px"><summary style="cursor:pointer;font-size:13px;font-weight:700">Lihat prompt (untuk salin manual)</summary><pre class="prompt" id="pr-${step}"></pre></details></details>`;
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
  if (r === 'pitch') { const pb = $('#pitch-pv'); const ae = document.activeElement; if (!(ae && ae.id === 'skrip')) pb.innerHTML = pitchPreview(); }
  if (r === 'plan') { const D = planDyn(); $('#plan-warn').innerHTML = D.warn; $('#plan-gantt').innerHTML = D.gantt; if (!S.tasks || !document.activeElement.closest || !document.activeElement.closest('#plan-tasks')) $('#plan-tasks').innerHTML = D.tasks; }
}
function updateProgress() {
  const PL = M.plan(S); if ($('#pct')) { $('#pct').textContent = PL.done + ' daripada ' + PL.total + ' tugasan · ' + PL.pct + '%'; $('#pbar').style.width = PL.pct + '%'; $('#next').innerHTML = nextList(); }
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
  c.addText('Disediakan oleh ' + (S.nama.hr || 'HR') + '  ·  ' + M.fmtD(stamp()), { x: 0.7, y: 4.5, w: 8, h: 0.4, fontSize: 12, color: 'C9CBD1', fontFace: 'Arial' });
  c.addText('Draf untuk perbincangan. PIC dan tarikh ialah cadangan sehingga dipersetujui.', { x: 0.7, y: 4.9, w: 8.6, h: 0.3, fontSize: 9, color: '8F929A', fontFace: 'Arial' });
  PI.slaid.slice(0, 7).forEach((s, i) => {
    const sl = p.addSlide({ masterName: 'MOVE' }), long = s.poin.join(' ').length > 360;
    sl.addText('SLAID ' + (i + 1), { x: 0.6, y: 0.32, w: 3, h: 0.3, fontSize: 10, bold: true, color: 'D51F35', charSpacing: 3, fontFace: 'Arial' });
    sl.addText(s.tajuk, { x: 0.6, y: 0.62, w: 8.8, h: 0.9, fontSize: 28, bold: true, color: '17191D', fontFace: 'Arial', valign: 'top' });
    sl.addText(s.poin.map(t => ({ text: t, options: { bullet: true, breakLine: true, paraSpaceAfter: 10 } })), { x: 0.6, y: 1.65, w: 8.8, h: 3.4, fontSize: long ? 15 : 19, color: '2D3136', fontFace: 'Arial', valign: 'top' });
    if (s.nota) sl.addNotes(s.nota);
  });
  const ap = p.addSlide({ masterName: 'MOVE' });
  ap.addText('Lampiran: Pelan tindakan dan timeline', { x: 0.6, y: 0.3, w: 8.8, h: 0.5, fontSize: 22, bold: true, color: '17191D', fontFace: 'Arial' });
  const H = t => ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: 'D51F35' }, fontSize: 9, fontFace: 'Arial' } });
  const rows = [[H('No'), H('Tugasan'), H('PIC'), H('Mula'), H('Siap'), H('Hasil / bukti')]].concat(PL.tasks.map((t, i) => [String(i + 1), t.tugas, t.pic, M.fmtShort(t.mula), M.fmtShort(t.siap), t.bukti].map(x => ({ text: x, options: { fontSize: 8.5, fontFace: 'Arial', color: '2D3136', valign: 'top' } }))));
  ap.addTable(rows, { x: 0.6, y: 0.9, w: 8.9, colW: [0.35, 3.1, 1.6, 0.7, 0.7, 2.45], border: { type: 'solid', color: 'D8D6CF', pt: 0.5 }, autoPage: true, autoPageRepeatHeader: true, newSlideStartY: 0.5, margin: 0.04 });
  try { await p.writeFile({ fileName: 'MOVE-slaid-pitch.pptx' }); $('#dl-note').hidden = true; toast('Slaid dimuat turun: MOVE-slaid-pitch.pptx'); } catch (e) { toast('Gagal menjana slaid: ' + e.message); }
}
function exportPDF() {
  $('#print-area').innerHTML = '<div class="print-head"><img src="assets/move-logo.webp" alt="MOVE YOUR TEAM"><span>Draf untuk semakan organisasi · ' + esc(M.fmtD(stamp())) + '</span></div><div class="doc">' + M.docBody(S) + '</div>';
  setTimeout(() => window.print(), 60);
}

/* ---------- peristiwa ---------- */
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.f && t.type !== 'radio') { const k = t.dataset.f; S[k] = k === 'semak' ? Number(t.value) : t.value; save(); refresh(); }
  if (t.dataset.n) { S.nama[t.dataset.n] = t.value; save(); refresh(); }
  if (t.dataset.t) {
    ensureTasks(); const x = S.tasks.find(a => a.id === t.dataset.t); if (!x) return;
    x[t.dataset.k] = t.value; S.tasksCustom = true; save();
    if (t.dataset.k === 'mula' || t.dataset.k === 'siap') { $('#plan-gantt').innerHTML = gantt(M.plan(S)); }
  }
  if (t.dataset.skrip !== undefined) { S.skripEdit = t.value; save(); const n = t.value.trim().split(/\s+/).filter(Boolean).length; const k = $('#kata'); if (k) { k.textContent = n + ' patah perkataan · anggaran ' + Math.max(1, Math.round(n / 140 * 10) / 10) + ' minit'; k.classList.toggle('over', n > 320); } }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.d) { S.diag[t.dataset.d] = t.value === 'x' ? null : Number(t.value); save(); refresh(); }
  if (t.dataset.f && t.type === 'radio') { S[t.dataset.f] = t.value; save(); refresh(); }
  if (t.dataset.f && (t.type === 'date' || t.tagName === 'SELECT')) { S[t.dataset.f] = t.dataset.f === 'semak' ? Number(t.value) : t.value; save(); refresh(); }
  if (t.dataset.done) {
    ensureTasks(); const x = S.tasks.find(a => a.id === t.dataset.done); if (x) x.done = t.checked; save();
    if (route() === 'plan') { const row = t.closest('.task'); if (row) row.classList.toggle('done', t.checked); $('#plan-gantt').innerHTML = gantt(M.plan(S)); } else updateProgress();
  }
  if (t.id === 'import-file') importFile(t);
});
document.addEventListener('click', e => {
  const m = $('#menu'); if (!e.target.closest('#menu')) { m.classList.remove('open'); $('#menu-btn').setAttribute('aria-expanded', 'false'); }
  if (e.target.closest('#menu-btn')) { const o = m.classList.toggle('open'); $('#menu-btn').setAttribute('aria-expanded', String(o)); return; }
  const chip = e.target.closest('[data-chip]'); if (chip) {
    const [g, k] = chip.dataset.chip.split(':'), a = S[g], i = a.indexOf(k);
    if (i >= 0) a.splice(i, 1); else { if (g === 'keutamaan' && a.length >= 2) { toast('Pilih sehingga dua keutamaan.'); return; } a.push(k); }
    save(); chip.classList.toggle('on', i < 0); chip.setAttribute('aria-pressed', String(i < 0)); refresh(); return;
  }
  const tab = e.target.closest('[data-tab]'); if (tab) { pitchTab = tab.dataset.tab; $('#pitch-pv').innerHTML = pitchPreview(); return; }
  const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a, step = b.dataset.step;
  $('#menu').classList.remove('open');
  if (a === 'example') { const go = () => { S = M.exampleData(); save(); location.hash = 'tna'; render(true); }; (M.has(S.isu) || M.has(S.contoh) || S.tasks) ? ask('Gunakan contoh rekaan?', 'Isian semasa akan diganti dengan contoh. Muat turun sandaran dahulu jika anda mahu menyimpannya.', go) : go(); }
  if (a === 'reset') ask('Mulakan pelan baharu?', 'Pelan semasa pada peranti ini akan dikosongkan. Muat turun sandaran dahulu jika perlu.', () => { S = M.defaults(); save(); location.hash = 'mula'; render(true); });
  if (a === 'clear') ask('Padam semua data?', 'Semua jawapan, jadual dan sandaran automatik pada peranti ini akan dipadam. Tindakan ini tidak boleh dibatalkan.', () => { try { [M.KEY, ...M.OLD_KEYS].forEach(k => localStorage.removeItem(k)); } catch (e) { } S = M.defaults(); location.hash = 'mula'; render(true); toast('Semua data dipadam.'); });
  if (a === 'backup') download(JSON.stringify(Object.assign({ version: 4 }, S), null, 2), 'MOVE-sandaran-v4.json', 'application/json');
  if (a === 'import') $('#import-file').click();
  if (a === 'skrip-reset') { S.skripEdit = ''; save(); $('#pitch-pv').innerHTML = pitchPreview(); }
  if (a === 'add-task') { ensureTasks(); const last = S.tasks[S.tasks.length - 1]; S.tasks.push({ id: M.uid(), fasa: last ? last.fasa : 'Pelaksanaan', tugas: 'Tugasan baharu', pic: '', mula: last ? last.siap : '', siap: last ? last.siap : '', bukti: '', dep: '', done: false }); S.tasksCustom = true; save(); $('#plan-tasks').innerHTML = planDyn().tasks; $('#plan-gantt').innerHTML = gantt(M.plan(S)); const rows = $$('#plan-tasks .task'); rows[rows.length - 1].querySelector('textarea').focus(); }
  if (a === 'del-task') { ensureTasks(); S.tasks = S.tasks.filter(x => x.id !== b.dataset.id); S.tasksCustom = true; if (!S.tasks.length) { S.tasks = null; S.tasksSig = ''; } save(); refresh(); $('#plan-tasks').innerHTML = planDyn().tasks; }
  if (a === 'regen') ask('Jana semula jadual?', 'Suntingan tugasan dan tanda siap akan diganti dengan jadual baharu daripada tetapan semasa.', () => { S.tasks = null; S.tasksCustom = false; S.tasksSig = ''; if (S.ai.plan) S.ai.plan = null; save(); render(); });
  if (a === 'ai-copy') { const text = M.aiPrompt(S, step); (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast('Prompt disalin. Tampal di ChatGPT atau Gemini.')).catch(() => { $('#pr-' + step).textContent = text; $('#ai-' + step + ' details').open = true; toast('Salinan automatik tidak tersedia. Salin teks prompt secara manual.'); }); $('#pr-' + step).textContent = text; }
  if (a === 'ai-apply') {
    const r = M.parseAI($('textarea[data-ai="' + step + '"]').value, step), msg = $('#ai-msg-' + step);
    if (!r.ok) { msg.className = 'ai-msg bad'; msg.textContent = r.error; return; }
    S.ai[step] = r.data; if (step === 'plan' && r.data.tasks) { S.tasks = r.data.tasks; S.tasksCustom = true; S.tasksSig = sig(); }
    save(); render(); toast('Jawapan AI digunakan. Semak fakta sebelum membentang.'); const d = $('#ai-' + step); if (d) d.open = true;
  }
  if (a === 'ai-clear') { if (step === 'plan' && S.ai.plan && S.ai.plan.tasks) { S.tasks = null; S.tasksCustom = false; S.tasksSig = ''; } S.ai[step] = null; save(); render(); toast('Kembali kepada draf asal.'); }
  if (a === 'x-pptx') exportPPTX();
  if (a === 'x-doc') download(M.toDoc(S), 'MOVE-pelan-saya.doc', 'application/msword');
  if (a === 'x-pdf') exportPDF();
  if (a === 'x-csv') download(M.toCSV(S), 'MOVE-pelan-tindakan.csv', 'text/csv;charset=utf-8');
  if (a === 'x-ics') download(M.toICS(S), 'MOVE-pelan-tindakan.ics', 'text/calendar;charset=utf-8');
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('#menu').classList.remove('open'); } });
async function importFile(inp) {
  const f = inp.files[0]; inp.value = ''; if (!f) return;
  if (f.size > 2e6) { toast('Fail terlalu besar. Had sandaran ialah 2MB.'); return; }
  try { const d = M.validate(JSON.parse(await f.text())); ask('Buka sandaran ini?', 'Pelan semasa pada peranti ini akan diganti.', () => { S = d; save(); render(); toast('Sandaran dibuka. Semak kandungan sebelum digunakan.'); }); } catch (e) { toast('Fail tidak sah. Pilih sandaran JSON daripada MOVE versi 1, 2, 3 atau 4.'); }
}
window.addEventListener('hashchange', () => render(true));
window.addEventListener('beforeunload', () => { if (dlURL) URL.revokeObjectURL(dlURL); });
render();
