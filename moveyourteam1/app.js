'use strict';
/* MOVE YOUR TEAM Planner 6.1: antara muka dua bahasa (Melayu + English) */
const M = Move, $ = (q, r = document) => r.querySelector(q), $$ = (q, r = document) => [...r.querySelectorAll(q)], esc = M.esc, B = M.B;
const ROUTES = ['mula', 'tna', 'pitch', 'plan', 'hasil', 'bantuan'];
let S = M.defaults(), storageOK = true, pitchTab = 'skrip', tnaStep = 0, dlURL = null, job = null, lastSaved = null;
const bi = (m, e) => esc(m) + ' <i class="en">' + esc(e) + '</i>';
const bib = (m, e) => esc(m) + '<i class="en blk">' + esc(e) + '</i>';
const bx = x => bib(x.m, x.e);

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
  el.innerHTML = storageOK ? '<span>Disimpan <i class="en">Saved</i>' + (lastSaved ? ' · ' + String(lastSaved.getHours()).padStart(2, '0') + ':' + String(lastSaved.getMinutes()).padStart(2, '0') : '') + '</span>' : '<span>Storan tidak tersedia. Muat turun sandaran. <i class="en">Storage unavailable. Download a backup.</i></span>';
}
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { }
const sig = () => JSON.stringify([S.mula, S.nama, S.diag]);
function ensureTasks() { if (!S.tasks) { S.tasks = M.plan(S).tasks.map(t => Object.assign({}, t)); S.tasksSig = sig(); S.qdone = {}; } }
function qToggle(key, on) {
  if (S.tasks && S.tasks.length) { const gm = {}; M.plan(S).tasks.forEach(t => { gm[t.id] = t.grp || 'x_' + t.id; }); S.tasks.forEach(x => { if (gm[x.id] === key) x.done = on; }); }
  else { S.qdone = S.qdone || {}; if (on) S.qdone[key] = true; else delete S.qdone[key]; }
}
const prog = () => S.mod === 'lengkap' ? M.plan(S) : M.quick(S);

/* ---------- utiliti UI ---------- */
function toast(v) { const t = $('#toast'); t.innerHTML = v; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 4500); }
function ask(title, text, fn) { job = fn; $('#dlg-t').innerHTML = title; $('#dlg-p').innerHTML = text; $('#dlg').showModal(); }
$('#dlg-no').onclick = () => { $('#dlg').close(); job = null; };
$('#dlg-yes').onclick = () => { const j = job; job = null; $('#dlg').close(); j && j(); };
function download(content, name, type) {
  if (dlURL) URL.revokeObjectURL(dlURL);
  dlURL = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], { type }));
  const a = document.createElement('a'); a.href = dlURL; a.download = name; a.hidden = true; document.body.appendChild(a); a.click(); a.remove();
  $('#dl-note').hidden = false; $('#dl-link').href = dlURL; $('#dl-link').download = name;
  toast('Fail sedang dimuat turun <i class="en">File is downloading</i>: ' + esc(name));
}
function loadScript(src) { return new Promise((res, rej) => { if ($('script[data-src="' + src + '"]')) return res(); const s = document.createElement('script'); s.src = src; s.dataset.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
const route = () => { const r = (location.hash || '#mula').slice(1); return ROUTES.includes(r) ? r : 'mula'; };
const li = a => '<ul>' + a.map(x => '<li>' + bx(x) + '</li>').join('') + '</ul>';

/* ---------- komponen ---------- */
function ftext(k, lab, hint, ex, rows = 3) {
  return `<div class="field"><label for="${k}">${bi(lab[0], lab[1])}</label><span class="hint" id="${k}-h">${bi(hint[0], hint[1])}</span><textarea id="${k}" data-f="${k}" maxlength="8000" rows="${rows}" aria-describedby="${k}-h">${esc(S[k])}</textarea>${ex && !S.ex ? `<div class="ex"><b>Contoh <i class="en">Example</i>:</b> ${esc(ex)}</div>` : ''}</div>`;
}
function fnum(k, lab, hint, ph) {
  return `<div class="field"><label for="${k}">${bi(lab[0], lab[1])}</label><span class="hint" id="${k}-h">${bi(hint[0], hint[1])}</span><input type="text" inputmode="decimal" id="${k}" data-f="${k}" maxlength="20" value="${esc(S[k])}" placeholder="${esc(ph || '')}" aria-describedby="${k}-h"></div>`;
}
function industriSelect() {
  return `<div class="field"><label for="industri">${bi('Industri', 'Industry')} <span class="opt">${bi('pilihan', 'optional')}</span></label><span class="hint">${bi('Membantu mencadangkan bidang latihan yang sesuai.', 'Helps suggest suitable training areas.')}</span><select id="industri" data-f="industri"><option value="">Pilih… / Choose…</option>${M.INDUSTRI.map(i => `<option value="${i.id}" ${S.industri === i.id ? 'selected' : ''}>${esc(i.m)} / ${esc(i.e)}</option>`).join('')}</select></div>`;
}
function bidangSelect() {
  const ind = M.industriOf(S), top = ind ? ind.top.map(id => M.BIDANG.find(b => b.id === id)) : [];
  const opt = b => `<option value="${b.id}" ${S.bidang === b.id ? 'selected' : ''}>${esc(b.m)} / ${esc(b.e)}</option>`;
  const groups = Object.entries(M.GRP).map(([g, l]) => `<optgroup label="${esc(l.m)} / ${esc(l.e)}">${M.BIDANG.filter(b => b.g === g).map(opt).join('')}</optgroup>`).join('');
  return `<div class="card"><h2>${bi('Bidang latihan', 'Training area')}</h2><p class="sub">${bib('Jika latihan diperlukan, bidang apa? Pilih satu. Tiada dalam senarai? Pilih "Lain-lain" dan tulis sendiri.', 'If training is needed, what area? Choose one. Not on the list? Choose "Other" and write your own.')}</p>
    <div class="field"><label for="bidang">${bi('Bidang', 'Area')}</label><select id="bidang" data-f="bidang"><option value="">Pilih… / Choose…</option>${top.length ? `<optgroup label="Disyorkan untuk ${esc(ind.m)} / Recommended for ${esc(ind.e)}">${top.map(opt).join('')}</optgroup>` : ''}${groups}<option value="lain" ${S.bidang === 'lain' ? 'selected' : ''}>Lain-lain (tulis sendiri) / Other (write your own)</option></select></div>
    ${S.bidang === 'lain' ? `<div class="field"><label for="bidangLain">${bi('Tulis bidang latihan anda', 'Write your training area')}</label><input type="text" id="bidangLain" data-f="bidangLain" maxlength="200" value="${esc(S.bidangLain)}" placeholder="cth. Kemahiran temu duga / e.g. Interviewing skills"></div>` : ''}</div>`;
}
function seg(q) {
  const cur = S.diag[q.id], o = [['2', 'Ya', 'Yes'], ['1', 'Sebahagian', 'Partly'], ['0', 'Tidak', 'No'], ['x', 'Tak pasti', 'Not sure']];
  return `<div class="q" role="radiogroup" aria-labelledby="${q.id}-l"><p id="${q.id}-l">${bx(q.t)}</p><small>${bx(q.h)}</small><div class="seg">${o.map(([v, m, e]) => `<label><input type="radio" name="${q.id}" data-d="${q.id}" value="${v}" ${(cur === null && v === 'x') ? 'checked' : String(cur) === v ? 'checked' : ''}><span>${esc(m)}<i class="en blk">${e}</i></span></label>`).join('')}</div></div>`;
}
function stepper(r) {
  const pg = M.progress(S), items = [['tna', 'TNA', B('Kenal pasti punca', 'Find the cause'), pg.tna], ['pitch', 'PITCH', B('Bentang kepada superior', 'Present to the superior'), pg.pitch], ['plan', 'CHECKLIST', B('Senarai tindakan', 'Action list'), pg.plan], ['hasil', B('Pelan Saya', 'My plan').m, B('Muat turun', 'Download'), null]];
  $('#stepper .wrap').innerHTML = items.map(([k, a, b, d], i) => `<a href="#${k}" class="${r === k ? 'on' : ''} ${d && r !== k ? 'done' : ''}" ${r === k ? 'aria-current="step"' : ''}><span class="n">${d && r !== k ? '✓' : i + 1}</span><span><b>${esc(a)}</b><small>${esc(b.m)} <i class="en">${esc(b.e)}</i></small></span></a>`).join('');
}
const pill = f => { const v = f.v, c = v === null ? 'na' : v === 2 ? 'ok' : v === 1 ? 'mid' : 'low', s = M.STAT[v === null ? 'n' : v]; return `<span class="pill ${c}"><small>${esc(f.q.lab.m)} <i class="en">${esc(f.q.lab.e)}</i></small><b>${esc(s.m)} <i class="en">${esc(s.e)}</i></b></span>`; };

/* ---------- MULA ---------- */
function pageMula() {
  const started = M.has(S.isu) || M.has(S.pihak) || S.tasks;
  return `<div class="wrap"><div class="hero1">
    <p class="eyebrow">MOVE YOUR TEAM · Planner</p>
    <h1>Satu cabaran.<br><em>Satu pelan.</em><span class="enh">One challenge. One plan.</span></h1>
    <p class="intro">Jawab soalan berpandu tentang satu isu kerja. Planner menyusun analisis keperluan latihan (TNA), bahan pitch kepada superior, dan senarai tindakan.<i class="en blk">Answer guided questions about one work issue. The planner builds a Training Needs Analysis (TNA), pitch material for your superior, and an action list.</i></p>
    <div class="cta-row"><a class="btn primary" href="#tna">${started ? bi('Sambung pelan saya', 'Continue my plan') : bi('Mula dengan isu saya', 'Start with my issue')} →</a><button class="btn" data-a="example">${bi('Cuba dengan contoh', 'Try an example')}</button></div>
    ${started ? `<div class="resume"><div><b>${bi('Draf anda masih ada.', 'Your draft is still here.')}</b>${S.lama ? '<br><small>' + bi('Data planner lama telah dibawa masuk.', 'Data from the old planner was imported.') + '</small>' : ''}</div><a class="btn sm" href="#hasil">${bi('Lihat Pelan Saya', 'View my plan')}</a></div>` : ''}
  </div>
  <div class="how">
    <div class="card"><span class="no">1 · TNA · ±25 ${bi('MINIT', 'MIN')}</span><h3>${bi('Apa punca sebenar?', 'What is the real cause?')}</h3><p>${bib('Lima soalan tentang isu, tujuh semakan berasaskan kerangka Gilbert. Dokumen TNA dijana.', 'Five questions on the issue, seven checks based on Gilbert\'s framework. A TNA document is generated.')}</p></div>
    <div class="card"><span class="no">2 · PITCH · ±15 ${bi('MINIT', 'MIN')}</span><h3>${bi('Apa nak diminta?', 'What to ask for?')}</h3><p>${bib('Pilih keputusan yang anda mahu. Skrip dan slaid siap.', 'Choose the decision you want. Script and slides are ready.')}</p></div>
    <div class="card"><span class="no">3 · CHECKLIST · ±2 ${bi('MINIT', 'MIN')}</span><h3>${bi('Apa langkah seterusnya?', 'What are the next steps?')}</h3><p>${bib('Senarai tindakan untuk ditanda siap. Mahu PIC (Person In Charge), tarikh dan bukti? Pilih mod Lengkap.', 'An action list to tick off. Want a PIC (Person In Charge), due dates and proof? Choose the Detailed mode.')}</p></div></div>
  <p class="privacy">${bib('Peribadi: semua jawapan disimpan dalam pelayar (browser) anda sahaja. Guna contoh tanpa nama. Planner ini berfungsi tanpa AI.', 'Private: all answers are stored in your browser only. Use examples without names. The planner works without AI.')}</p></div>`;
}

/* ---------- TNA ---------- */
function tnaPreview() {
  const T = M.tna(S);
  return `<div class="verdict ${T.fit}"><h3>${bx(T.keputusanTajuk)}</h3><p>${bx(T.dapatan)}</p></div>
  <div class="pills">${T.fac.map(pill).join('')}</div>
  <h4>${bi('Apa yang dicadangkan', 'What is recommended')}</h4>${li(T.intervensi)}
  <h4>${bi('Perlu disahkan sebelum membentang', 'To verify before presenting')}</h4>${T.perluSahkan.length ? li(T.perluSahkan) : '<p class="empty-note">' + bi('Tiada. Bukti anda kukuh.', 'None. Your evidence is strong.') + '</p>'}`;
}
function infoBox() {
  return `<div class="card info-card"><h2>${bi('Infografik TNA', 'TNA infographic')} <span class="tag-opt">${bi('pilihan', 'optional')}</span></h2>
  <p class="sub">${bib('Jadikan sinopsis anda satu infografik menegak yang kemas, untuk dikongsi atau ditunjukkan kepada superior. ChatGPT menjana gambar.', 'Turn your synopsis into one tidy vertical infographic to share or show your superior. ChatGPT generates the image.')}</p>
  <div class="ai-steps"><div><b>1.</b> ${bi('Salin prompt infografik.', 'Copy the infographic prompt.')}</div><div><b>2.</b> ${bi('Tampal di ChatGPT dan minta ia menjana imej.', 'Paste it into ChatGPT and ask it to generate the image.')}</div><div><b>3.</b> ${bi('Semak ejaan dan angka pada imej. Minta ChatGPT membaiki jika ada salah.', 'Check the spelling and numbers on the image. Ask ChatGPT to fix any mistake.')}</div></div>
  <div class="cta-row" style="margin:0 0 10px"><button class="btn primary sm" data-a="ai-info-copy">${bi('Salin prompt infografik', 'Copy infographic prompt')}</button><a class="btn sm" href="https://chatgpt.com/" target="_blank" rel="noopener">ChatGPT</a></div>
  <p class="sub" style="font-size:13.5px;margin-top:6px">${bib('Akaun percuma ChatGPT mungkin menghadkan bilangan imej sehari. Prompt mengandungi ringkasan isu anda, jadi jangan guna jika maklumat itu sulit.', 'A free ChatGPT account may limit how many images you can make a day. The prompt contains a summary of your issue, so do not use it if that information is confidential.')}</p></div>`;
}
function tnaAIBox() {
  const refs = Object.entries(M.REFS).map(([id, t]) => '<li>' + esc(t) + '</li>').join('');
  return `<details class="ai" ${S.tnaAI ? 'open' : ''}><summary>${bi('Mahu TNA lebih tajam? Guna ChatGPT atau Claude', 'Want a sharper TNA? Use ChatGPT or Claude')} <span class="tag-opt">${bi('pilihan', 'optional')}</span></summary>
  <p class="aip">${bib('Planner sudah menjana TNA penuh di atas tanpa AI. Langkah ini menulis versi yang lebih khusus kepada isu anda, dengan rujukan daripada senarai sumber di bawah sahaja.', 'The planner has already generated a full TNA above without AI. This step writes a version more specific to your issue, citing only the sources listed below.')}</p>
  <div class="ai-steps"><div><b>1.</b> ${bi('Salin prompt dan tampal ke ChatGPT atau Claude.', 'Copy the prompt and paste it into ChatGPT or Claude.')}</div><div><b>2.</b> ${bi('Salin jawapan penuh AI.', 'Copy the full answer from the AI.')}</div><div><b>3.</b> ${bi('Tampal di bawah, tekan "Guna jawapan".', 'Paste below and press "Use answer".')}</div></div>
  <div class="cta-row" style="margin:0 0 12px"><button class="btn primary sm" data-a="ai-tna-copy">${bi('Salin prompt', 'Copy prompt')}</button><a class="btn sm" href="https://chatgpt.com/" target="_blank" rel="noopener">ChatGPT</a><a class="btn sm" href="https://claude.ai/" target="_blank" rel="noopener">Claude</a></div>
  <textarea id="tnaai" placeholder="Tampal jawapan AI di sini… / Paste the AI answer here…" aria-label="Jawapan AI untuk TNA / AI answer for TNA"></textarea>
  <div class="cta-row" style="margin:10px 0 0"><button class="btn sm gold" data-a="ai-tna-apply">${bi('Guna jawapan', 'Use answer')}</button></div><div class="ai-msg" id="ai-msg" role="status"></div>
  ${S.tnaAI ? `<div class="ai-on"><span><b>${bi('Versi AI sedang digunakan.', 'The AI version is in use.')}</b></span><button class="btn sm" data-a="ai-tna-clear">${bi('Kembali ke draf asal', 'Back to the original draft')}</button></div>` : ''}
  <details style="margin-top:12px"><summary class="srcsum">${bi('Sumber yang dibenarkan untuk AI rujuk', 'Sources the AI is allowed to cite')}</summary><ol class="srcs">${refs}</ol></details></details>`;
}
function pageTNA() {
  const subs = [B('Isu & konteks', 'Issue & context'), B('Prestasi', 'Performance'), B('Punca', 'Root cause'), B('Dokumen TNA', 'TNA document')];
  const head = `<div class="wrap"><p class="eyebrow">${bi('Langkah 1 daripada 3', 'Step 1 of 3')} · TNA (Training Needs Analysis)</p><h1>Apa <em>masalahnya?</em><span class="enh">What is the problem?</span></h1>
  <p class="intro">${bib('Tulis dengan bahasa anda sendiri. Tak pasti? Pilih "Tak pasti". Itu pun jawapan yang berguna.', 'Write in your own words. Not sure? Choose "Not sure". That is a useful answer too.')}</p>
  ${S.ex ? '<div class="warn">' + bib('Anda menggunakan contoh. Gantikan dengan isu sebenar anda sebelum membentang.', 'You are using an example. Replace it with your real issue before presenting.') + '</div>' : ''}
  <nav class="subnav" aria-label="Skrin TNA / TNA screens">${subs.map((s, i) => `<button class="${i === tnaStep ? 'on' : ''} ${i < tnaStep ? 'done' : ''}" data-sub="${i}" ${i === tnaStep ? 'aria-current="step"' : ''}><b>${i + 1}</b><span>${esc(s.m)}<i class="en blk">${esc(s.e)}</i></span></button>`).join('')}</nav>`;
  if (tnaStep === 3) return head + `<div class="card"><div class="doc" id="tnadoc">${M.tnaHTML(S)}</div></div>${infoBox()}${tnaAIBox()}<div class="nav-row"><button class="btn" data-sub="2">← ${bi('Kembali', 'Back')}</button><a class="btn primary" href="#pitch">${bi('Seterusnya: PITCH', 'Next: PITCH')} →</a></div></div>`;
  let body = '';
  if (tnaStep === 0) body = `<div class="card"><h2>${bi('Ceritakan isu anda', 'Tell us about the issue')}</h2><p class="sub">${bib('Satu isu sahaja. Mulakan dengan apa yang mengganggu kerja.', 'One issue only. Start with what disrupts the work.')}</p>
      ${ftext('isu', ['Apa masalah yang berlaku?', 'What is the problem?'], ['Apa yang mengganggu kerja.', 'What disrupts the work.'], 'Serahan kerja Sales kepada Operations kerap tidak lengkap.')}
      ${ftext('kesan', ['Apa kesannya kepada organisasi?', 'What is the effect on the organisation?'], ['Kos, masa, pelanggan, atau matlamat (KPI) yang terjejas.', 'Cost, time, customers or goals (KPIs) affected.'], 'Operations kehilangan masa, pesanan pelanggan lambat.', 2)}
      ${ftext('pihak', ['Siapa yang terlibat?', 'Who is involved?'], ['Peranan, anggaran bilangan dan tahap pengalaman.', 'Roles, approximate number and experience level.'], '12 pegawai Sales dan 8 Operations, kebanyakannya baharu.', 2)}
      ${industriSelect()}</div>`;
  if (tnaStep === 1) body = `<div class="card"><h2>${bi('Jurang prestasi', 'Performance gap')}</h2><p class="sub">${bib('Jurang ialah beza antara apa yang sepatutnya berlaku dan apa yang sebenarnya berlaku.', 'A gap is the difference between what should happen and what actually happens.')}</p>
      ${ftext('standard', ['Apa yang sepatutnya berlaku?', 'What should happen?'], ['Standard kerja yang betul.', 'The correct work standard.'], 'Setiap serahan menyebut hasil, PIC dan tarikh siap.')}
      ${ftext('contoh', ['Apa yang sebenarnya berlaku? Beri satu contoh.', 'What actually happens? Give one example.'], ['Termasuk berapa kerap, dan rekod yang ada.', 'Include how often, and any records.'], 'Permintaan tanpa tarikh siap, beberapa kali seminggu; ada e-mel sebagai rekod.', 4)}</div>
      <div class="card"><h2>${bi('Berapa kos masalah ini?', 'What does this problem cost?')} <span class="opt">${bi('pilihan', 'optional')}</span></h2><p class="sub">${bib('Planner hanya mengira daripada angka anda dan tidak menganggar sendiri. Biar kosong jika belum tahu.', 'The planner only calculates from your figures and never estimates on its own. Leave blank if unknown.')}</p>
        <div class="row3">${fnum('kes', ['Kes sebulan', 'Cases a month'], ['Berapa kerap ia berlaku.', 'How often it happens.'], '130')}${fnum('minit', ['Minit hilang setiap kes', 'Minutes lost per case'], ['Masa yang terbuang.', 'Time wasted.'], '20')}${fnum('kadar', ['Kos sejam purata (RM)', 'Average cost per hour (RM)'], ['Gaji dan elaun sejam.', 'Hourly pay and allowances.'], '40')}</div></div>`;
  if (tnaStep === 2) body = `<div class="card"><h2>${bi('Semak punca', 'Check the root cause')}</h2><p class="sub">${bib('Enam faktor daripada Behavior Engineering Model (Gilbert). Faktor persekitaran disemak dahulu.', 'Six factors from the Behavior Engineering Model (Gilbert). Environment factors are checked first.')}</p>
      <div class="dim">${bi('Persekitaran kerja', 'Work environment')}</div>${M.Q.filter(q => q.g === 'E').map(seg).join('')}
      <div class="dim">${bi('Individu', 'Person')}</div>${M.Q.filter(q => q.g === 'P').map(seg).join('')}
      <div class="dim">${bi('Bukti', 'Evidence')}</div>${M.Q.filter(q => q.g === 'B').map(seg).join('')}</div>${bidangSelect()}`;
  return head + `<div class="cols"><div>${body}<div class="nav-row">${tnaStep ? `<button class="btn" data-sub="${tnaStep - 1}">← ${bi('Kembali', 'Back')}</button>` : `<a class="btn" href="#mula">← ${bi('Utama', 'Home')}</a>`}<button class="btn primary" data-sub="${tnaStep + 1}">${tnaStep === 2 ? bi('Lihat dokumen TNA', 'View TNA document') : bi('Seterusnya', 'Next')} →</button></div></div>
  <aside><div class="sticky"><div class="pv"><div class="pv-head"><i></i>${bi('Keputusan TNA langsung', 'Live TNA result')}</div><div class="pv-body" id="tna-pv">${tnaPreview()}</div></div></div></aside></div></div>`;
}

/* ---------- PITCH ---------- */
function chips(group, map) { const cur = S[group]; return `<div class="chips" role="group">${Object.entries(map).map(([k, l]) => `<button type="button" class="chip ${cur.includes(k) ? 'on' : ''}" data-chip="${group}:${k}" aria-pressed="${cur.includes(k)}">${esc(l.m)}<i class="en blk">${esc(l.e)}</i></button>`).join('')}</div>`; }
function chipsOne(group, map) { return `<div class="chips" role="radiogroup">${Object.entries(map).map(([k, l]) => `<button type="button" class="chip ${S[group] === k ? 'on' : ''}" data-one="${group}:${k}" role="radio" aria-checked="${S[group] === k}">${esc(l.m)}<i class="en blk">${esc(l.e)}</i></button>`).join('')}</div>`; }
function pitchPreview() {
  const PI = M.pitch(S), tabs = [['skrip', B('Skrip 2 minit', '2-min script')], ['slaid', B('5 slaid', '5 slides')], ['qa', B('Soalan bos', 'Boss questions')]];
  let body = '';
  if (pitchTab === 'skrip') body = `<div class="tip"><b>${bi('Petua', 'Tip')}:</b> ${bx(PI.tip)}</div><p class="hint" style="margin-bottom:6px">${bib('Baris bermula "EN:" ialah terjemahan English. Anda boleh sunting terus.', 'Lines starting with "EN:" are the English translation. You can edit directly.')}</p><textarea id="skrip" rows="15" data-skrip aria-label="Skrip dua minit / Two-minute script">${esc(PI.skrip)}</textarea>
    <div class="counter ${PI.kata > 320 ? 'over' : ''}" id="kata">${PI.kata} ${bi('patah perkataan (Melayu)', 'words (Malay)')} · ${bi('sasaran', 'target')} ~260</div>
    ${M.has(S.skripEdit) ? `<button class="btn sm" data-a="skrip-reset" style="margin-top:8px">${bi('Set semula skrip', 'Reset script')}</button>` : ''}
    <div class="ai-row"><p><b>${bi('Mahu bunyi lebih tajam?', 'Want it to sound sharper?')}</b> ${bi('Salin prompt, tampal ke AI, kemudian tampal skrip baharu dalam kotak di atas.', 'Copy the prompt, paste it into the AI, then paste the new script in the box above.')}</p><div class="cta-row" style="margin:8px 0 0"><button class="btn gold sm" data-a="ai-copy">${bi('Salin prompt AI', 'Copy AI prompt')}</button><a class="btn sm" href="https://chatgpt.com/" target="_blank" rel="noopener">ChatGPT</a><a class="btn sm" href="https://claude.ai/" target="_blank" rel="noopener">Claude</a></div></div>`;
  if (pitchTab === 'slaid') body = `<div class="slides">${PI.slaid.map((s, i) => `<div class="slide"><span class="no">${bi('SLAID', 'SLIDE')} ${i + 1}</span><h4>${bx(s.tajuk)}</h4>${li(s.poin)}</div>`).join('')}</div><p class="empty-note" style="margin-top:10px">${bi('Muat turun sebagai PowerPoint di halaman Pelan Saya.', 'Download as PowerPoint on the My plan page.')}</p>`;
  if (pitchTab === 'qa') body = `<p style="font-size:13.5px;color:var(--muted);margin-bottom:10px">${bi('Bersedia untuk tiga soalan ini.', 'Be ready for these three questions.')}</p><div class="qa">${PI.qa.map((q, i) => `<details ${i === 0 ? 'open' : ''}><summary>${i + 1}. ${bx(q.s)}</summary><p>${bx(q.j)}</p></details>`).join('')}</div>`;
  return `<div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" data-tab="${k}" class="${pitchTab === k ? 'on' : ''}" aria-selected="${pitchTab === k}">${bi(l.m, l.e)}</button>`).join('')}</div><div class="pv-body" id="pitch-body">${body}</div>`;
}
function pagePitch() {
  return `<div class="wrap"><p class="eyebrow">${bi('Langkah 2 daripada 3', 'Step 2 of 3')} · PITCH</p><h1>Apa nak <em>diminta?</em><span class="enh">What to ask for?</span></h1>
  <p class="intro">${bib('Pilih keputusan yang anda mahu daripada superior. Skrip dan slaid disusun daripada TNA anda.', 'Choose the decision you want from your superior. The script and slides are built from your TNA.')}</p>
  ${M.tna(S).fit === 'belum' ? '<div class="warn info">' + bib('TNA belum lengkap, jadi pitch akan menyatakan banyak perkara sebagai "belum disahkan".', 'The TNA is incomplete, so the pitch will mark many items as "not yet verified".') + ' <a href="#tna">' + bi('Lengkapkan TNA', 'Complete the TNA') + '</a></div>' : ''}
  <div class="cols"><div>
    <div class="card"><h2>${bi('Apa yang anda mahu daripada superior?', 'What do you want from your superior?')}</h2><p class="sub">${bib('Pilih satu atau lebih. Permintaan yang khusus lebih mudah dijawab "ya".', 'Choose one or more. A specific request is easier to answer "yes".')}</p>${chips('minta', M.KEPUTUSAN)}</div>
    <div class="card"><h2>${bi('Apa yang paling dipentingkan oleh superior anda?', 'What matters most to your superior?')}</h2><p class="sub">${bib('Pilih satu. Ia menentukan cara anda membingkai cadangan.', 'Choose one. It shapes how you frame the proposal.')}</p>${chipsOne('penting', M.KEUTAMAAN)}</div>
    <div class="card"><h2>${bi('Kos penyelesaian', 'Cost of the solution')} <span class="opt">${bi('pilihan', 'optional')}</span></h2><p class="sub">${bib('Biar kosong jika belum tahu. Planner mengira kos, penjimatan dan tempoh balik modal (payback) daripada angka anda sahaja.', 'Leave blank if unknown. The planner calculates cost, saving and payback period from your figures only.')}</p>
      <div class="row3">${fnum('yuran', ['Yuran trainer dan bahan (RM)', 'Trainer fees and materials (RM)'], ['Daripada sebut harga anda.', 'From your quotation.'], '4800')}${fnum('peserta', ['Bilangan peserta', 'Number of participants'], ['Yang akan dilatih.', 'Who will be trained.'], '20')}${fnum('jam', ['Jam latihan setiap orang', 'Training hours per person'], ['Lalai 3.5 jam jika kosong.', 'Defaults to 3.5 hours if blank.'], '3.5')}</div>
      <div class="field" style="max-width:340px;margin-top:6px">${fnum('kurang', ['Andaian masalah berkurang (%)', 'Assumed reduction of the problem (%)'], ['Andaian anda. Lalai 50% jika kosong, belum disahkan.', 'Your assumption. Defaults to 50% if blank, unverified.'], '50')}</div></div>
    <div class="nav-row"><a class="btn" href="#tna">← TNA</a><a class="btn primary" href="#plan">${bi('Seterusnya: CHECKLIST', 'Next: CHECKLIST')} →</a></div>
  </div><aside><div class="sticky"><div class="pv"><div class="pv-head"><i></i>${bi('Pitch langsung', 'Live pitch')}</div><div id="pitch-pv">${pitchPreview()}</div></div></div></aside></div></div>`;
}

/* ---------- CHECKLIST ---------- */
function taskRow(t, i) {
  return `<div class="task ${t.done ? 'done' : ''}" data-id="${esc(t.id)}"><label class="chk"><input type="checkbox" data-done="${esc(t.id)}" ${t.done ? 'checked' : ''} aria-label="Tanda siap / Mark done ${i + 1}"></label>
  <div><textarea class="tt" rows="2" data-t="${esc(t.id)}" data-k="tugas" aria-label="Tugasan / Task ${i + 1}">${esc(t.tugas)}</textarea>${t.te ? `<i class="en blk te">${esc(t.te)}</i>` : ''}${t.bukti ? `<small class="bk">${bi('Bukti', 'Proof')}: ${esc(t.bukti)}${t.be ? ' <i class="en">' + esc(t.be) + '</i>' : ''}</small>` : ''}</div>
  <div><input type="text" data-t="${esc(t.id)}" data-k="pic" value="${esc(t.pic)}" aria-label="PIC ${i + 1}"></div>
  <div><input type="date" data-t="${esc(t.id)}" data-k="siap" value="${esc(t.siap)}" aria-label="Siap pada / Due ${i + 1}"></div>
  <button class="del" data-a="del-task" data-id="${esc(t.id)}" aria-label="Buang / Remove ${i + 1}" title="Buang / Remove">✕</button></div>`;
}
const staleHTML = () => (S.tasks && S.tasksSig && S.tasksSig !== sig()) ? '<div class="warn">' + bib('Anda telah menyunting checklist, dan tetapan di atas berubah selepas itu.', 'You edited the checklist, and the settings above changed afterwards.') + ' <button class="btn sm" data-a="regen">' + bi('Jana semula', 'Regenerate') + '</button></div>' : '';
const qRow = (x, i) => `<label class="qa ${x.done ? 'done' : ''}"><input type="checkbox" data-q="${esc(x.key)}" ${x.done ? 'checked' : ''}><span class="qn">${i + 1}</span><span class="qt"><b>${esc(x.m)}</b>${x.e ? `<i class="en blk">${esc(x.e)}</i>` : ''}</span></label>`;
function pageCepat() {
  const Q = M.quick(S);
  return `<div class="wrap"><p class="eyebrow">${bi('Langkah 3 daripada 3', 'Step 3 of 3')} · CHECKLIST</p><h1>Senarai <em>tindakan</em><span class="enh">Action list</span></h1>
  <div id="plan-warn">${staleHTML()}</div>
  <div class="card"><div class="plan-head"><span class="hint" style="margin:0">${bi('Tanda bila siap', 'Tick when done')}</span><b id="qsum">${Q.done} / ${Q.total} ${bi('siap', 'done')}</b></div><div class="progress-bar"><i id="qbar" style="width:${Q.pct}%"></i></div>
    <div class="qlist" id="qlist">${Q.items.map(qRow).join('')}</div></div>
  <p class="modelink">${bi('Perlukan tarikh, PIC dan kalendar?', 'Need due dates, a PIC and a calendar?')} <button class="linkbtn" data-a="mod" data-v="lengkap">${bi('Buka versi Lengkap', 'Open the Detailed version')} →</button></p>
  <div class="nav-row"><a class="btn" href="#pitch">← PITCH</a><a class="btn primary" href="#hasil">${bi('Lihat Pelan Saya', 'View my plan')} →</a></div></div>`;
}
function planDyn() {
  const PL = M.plan(S), stale = S.tasks && S.tasksSig && S.tasksSig !== sig();
  let last = null, html = '';
  PL.tasks.forEach((t, i) => { if (t.fasa !== last) { const f = M.fasaT(t.fasa); html += `<div class="dim" style="margin:14px 0 0">${bi(f.m, f.e)}</div>`; last = t.fasa; } html += taskRow(t, i); });
  return {
    warn: PL.warns.map(w => `<div class="warn ${w.kind}">${bib(w.m, w.e)}</div>`).join('') + (stale ? '<div class="warn">' + bib('Anda telah menyunting checklist, dan tetapan di atas berubah selepas itu.', 'You edited the checklist, and the settings above changed afterwards.') + ' <button class="btn sm" data-a="regen">' + bi('Jana semula', 'Regenerate') + '</button></div>' : ''),
    tasks: html, sum: PL.mula ? `<b>${esc(M.fmtD(PL.mula))}</b> → <b>${esc(M.fmtD(PL.tamat))}</b> · ${PL.total} ${bi('langkah', 'steps')}` : ''
  };
}
function pagePlan() { return S.mod === 'lengkap' ? pageLengkap() : pageCepat(); }
function pageLengkap() {
  const D = planDyn();
  return `<div class="wrap"><p class="eyebrow">${bi('Langkah 3 daripada 3', 'Step 3 of 3')} · CHECKLIST</p><h1>Apa langkah <em>seterusnya?</em><span class="enh">What are the next steps?</span></h1>
  <p class="intro">${bib('Pilih tarikh mula. Checklist disusun mengikut fasa, dengan PIC dan tarikh. Semua boleh disunting.', 'Choose a start date. The checklist is arranged by phase with a PIC and due dates. Everything is editable.')}</p><p class="modelink" style="margin-top:0"><button class="linkbtn" data-a="mod" data-v="cepat">← ${bi('Kembali ke senarai ringkas', 'Back to the quick list')}</button></p>
  <div class="card"><div class="row2"><div class="field"><label for="mula">${bi('Tarikh mula', 'Start date')}</label><span class="hint">${bi('Jika kosong, bermula hari bekerja berikutnya.', 'If blank, starts on the next working day.')}</span><input type="date" id="mula" data-f="mula" value="${esc(S.mula)}"></div>
    <div class="field"><label for="nama">${bi('Nama anda', 'Your name')} <span class="opt">${bi('pilihan', 'optional')}</span></label><span class="hint">${bi('Dipaparkan sebagai PIC (Person In Charge).', 'Shown as the PIC (Person In Charge).')}</span><input type="text" id="nama" data-f="nama" maxlength="80" value="${esc(S.nama)}"></div></div></div>
  <div id="plan-warn">${D.warn}</div>
  <div class="card"><div class="plan-head"><h2>${bi('Checklist anda', 'Your checklist')}</h2><span id="plan-sum">${D.sum}</span></div><p class="sub">${bib('Sunting tugasan, PIC dan tarikh. Tanda kotak apabila siap. PIC dan tarikh ialah cadangan sehingga dipersetujui.', 'Edit the task, PIC and date. Tick the box when done. PIC and dates are suggestions until agreed.')}</p>
    <div class="task-head" aria-hidden="true"><span></span><span>${bi('Tugasan', 'Task')}</span><span>PIC</span><span>${bi('Siap pada', 'Due')}</span><span></span></div>
    <div class="tasks" id="plan-tasks">${D.tasks}</div>
    <div class="nav-row" style="margin-top:14px"><button class="btn sm" data-a="add-task">+ ${bi('Tambah tugasan', 'Add a task')}</button><button class="btn sm ghost" data-a="regen">${bi('Jana semula', 'Regenerate')}</button></div></div>
  <div class="nav-row"><a class="btn" href="#pitch">← PITCH</a><a class="btn primary" href="#hasil">${bi('Lihat Pelan Saya', 'View my plan')} →</a></div></div>`;
}

/* ---------- HASIL ---------- */
function nextList() {
  if (S.mod !== 'lengkap') { const todoQ = M.quick(S).items.filter(x => !x.done).slice(0, 3); return todoQ.length ? todoQ.map(x => `<label><input type="checkbox" data-q="${esc(x.key)}"><span><b>${bib(x.m, x.e)}</b></span></label>`).join('') : '<p class="empty-note"><b>' + bi('Semua tindakan telah ditanda siap.', 'All actions are marked done.') + '</b> ' + bi('Semak hasil dan laporkan kepada superior.', 'Review the results and report to your superior.') + '</p>'; }
  const todo = M.plan(S).tasks.filter(t => !t.done).slice(0, 3);
  return todo.length ? todo.map(t => `<label><input type="checkbox" data-done="${esc(t.id)}"><span><b>${bib(t.tugas, t.te)}</b><small>${esc(t.pic)} · ${bi('siap', 'due')} ${esc(M.fmtD(t.siap))}</small></span></label>`).join('') : '<p class="empty-note"><b>' + bi('Semua langkah telah ditanda siap.', 'All steps are marked done.') + '</b> ' + bi('Semak hasil dan laporkan kepada superior.', 'Review the results and report to your superior.') + '</p>';
}
function pageHasil() {
  const PL = M.plan(S), PG = prog(), T = M.tna(S), PI = M.pitch(S);
  return `<div class="wrap"><p class="eyebrow">${bi('Hasil anda', 'Your results')}</p><h1>Pelan Saya. <em>Siap digunakan.</em><span class="enh">My plan. Ready to use.</span></h1>
  <p class="intro">${bib('Ini ringkasan anda. Muat turun tiga fail di bawah, dan mulakan dengan langkah pertama dalam checklist.', 'Here is your summary. Download the three files below, and start with the first step in the checklist.')}</p>
  ${!M.progress(S).tna ? '<div class="warn">' + bib('TNA belum lengkap.', 'The TNA is incomplete.') + ' <a href="#tna">' + bi('Lengkapkan', 'Complete it') + '</a></div>' : ''}
  <div class="sum ${M.kosSummary(S).any ? 's4' : ''}"><div class="sum-i"><span>TNA</span><b>${bx(T.keputusanTajuk)}</b></div>${M.kosSummary(S).any ? `<div class="sum-i"><span>${bi('Kos', 'Cost')}</span><b>${bx(M.kosSummary(S).ringkas)}</b></div>` : ''}<div class="sum-i"><span>${bi('Anda minta', 'You request')}</span><b>${S.minta.length ? esc(S.minta.map(k => M.KEP_SHORT[k].m).join('; ')) + '<i class="en blk">' + esc(S.minta.map(k => M.KEP_SHORT[k].e).join('; ')) + '</i>' : bx(PI.kep[0])}</b></div><div class="sum-i"><span>${bi('Mula', 'Start')}</span><b>${M.mulaOf(S, PL) ? esc(M.fmtD(PL.mula)) : bi('belum ditetapkan', 'not set')}</b></div></div>
  <div class="card" style="margin-top:18px"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:8px"><h2>${bi('Langkah seterusnya', 'Next steps')}</h2><b id="pct">${PG.done} / ${PG.total} ${bi('siap', 'done')}</b></div><div class="progress-bar"><i id="pbar" style="width:${PG.pct}%"></i></div><div class="next" id="next" style="margin-top:14px">${nextList()}</div></div>
  <h2 style="margin:26px 0 12px">${bi('Muat turun', 'Download')}</h2>
  <div class="exports">
    <button class="exp" data-a="x-doc"><span class="ic">WORD</span><b>${bi('Dokumen TNA & pelan', 'TNA & plan document')}</b><span>${bib('TNA penuh, pitch dan checklist. Boleh disunting.', 'Full TNA, pitch and checklist. Editable.')}</span></button>
    <button class="exp" data-a="x-pptx"><span class="ic">POWERPOINT</span><b>${bi('Slaid pitch', 'Pitch slides')}</b><span>${bib('Muka depan, 5 slaid dan lampiran.', 'Cover, 5 slides and an appendix.')}</span></button>
    <button class="exp" data-a="x-csv"><span class="ic">EXCEL</span><b>Checklist</b><span>${S.mod === 'lengkap' ? bib('Dengan PIC, tarikh dan bukti.', 'With PIC, due dates and proof.') : bib('Senarai tindakan dan status siap.', 'The action list and what is done.')}</span></button></div>
  <details class="more"><summary>${bi('Format lain', 'Other formats')}: PDF, ${S.mod === 'lengkap' ? bi('kalendar', 'calendar') + ', ' : ''}${bi('sandaran', 'backup')}</summary><div class="cta-row" style="margin:12px 0 0"><button class="btn sm" data-a="x-pdf">${bi('Cetak / PDF', 'Print / PDF')}</button>${S.mod === 'lengkap' ? `<button class="btn sm" data-a="x-ics">${bi('Kalendar (.ics)', 'Calendar (.ics)')}</button>` : ''}<button class="btn sm" data-a="backup" data-where="page">${bi('Sandaran (.json)', 'Backup (.json)')}</button></div>${S.mod === 'lengkap' ? '' : `<p class="hint" style="margin-top:10px">${bib('Kalendar (.ics) tersedia dalam mod Lengkap di halaman CHECKLIST.', 'The calendar (.ics) is available in Detailed mode on the CHECKLIST page.')}</p>`}<p class="hint" style="margin-top:10px">${bib('Sandaran ialah salinan data anda untuk dibuka semula atau dipindah ke peranti lain.', 'A backup is a copy of your data to reopen later or move to another device.')}</p></details>
  <div style="margin-top:18px">${infoBox()}</div>
  <p class="privacy" style="margin-top:14px">${bib('Penting: data hanya ada dalam pelayar (browser) ini. Jika anda kosongkan data pelayar atau tukar peranti, ia hilang. Muat turun fail sebelum menutup.', 'Important: your data lives only in this browser. If you clear browser data or switch devices, it is lost. Download your files before closing.')}</p>
  <details class="more"><summary>${bi('Lihat dokumen penuh', 'View full document')}</summary><div class="doc" id="doc" style="margin-top:12px">${M.docBody(S)}</div></details>
  ${S.lama ? `<details class="more"><summary>${bi('Catatan daripada planner lama', 'Notes from the old planner')}</summary>${(S.lama.replies || []).filter(M.has).map(r => `<pre class="prompt">${esc(r)}</pre>`).join('')}</details>` : ''}
  <div class="nav-row" style="margin-top:20px"><a class="btn" href="#plan">← CHECKLIST</a><a class="btn" href="#bantuan">${bi('Panduan & istilah', 'Guide & glossary')}</a></div></div>`;
}

/* ---------- BANTUAN + ISTILAH ---------- */
const GLOSS = [
  ['TNA', 'Training Needs Analysis', 'Analisis untuk memutuskan sama ada latihan memang penyelesaian.', 'Analysis to decide whether training is really the solution.'],
  ['PITCH', 'Pitch', 'Pembentangan ringkas untuk meyakinkan superior.', 'A short presentation to persuade your superior.'],
  ['PIC', 'Person In Charge', 'Orang yang bertanggungjawab ke atas satu tugasan.', 'The person responsible for a task.'],
  ['Checklist', 'Checklist', 'Senarai semak langkah, boleh ditanda apabila siap.', 'A list of steps you tick off when done.'],
  ['Sandaran', 'Backup', 'Salinan data anda untuk dibuka semula atau dipindah ke peranti lain.', 'A copy of your data to reopen or move to another device.'],
  ['Pelayar', 'Browser', 'Aplikasi untuk melayari web, contohnya Chrome atau Safari.', 'The app you use to browse the web, such as Chrome or Safari.'],
  ['Muat turun', 'Download', 'Menyimpan fail daripada laman web ke peranti anda.', 'Saving a file from a website to your device.'],
  ['Superior', 'Superior / line manager', 'Orang yang anda laporkan kepadanya, atau yang meluluskan cadangan.', 'The person you report to, or who approves the proposal.'],
  ['Jurang prestasi', 'Performance gap', 'Beza antara apa yang sepatutnya berlaku dan yang sebenarnya berlaku.', 'The difference between what should happen and what actually happens.'],
  ['Punca', 'Root cause', 'Sebab sebenar masalah, bukan gejalanya.', 'The real reason for the problem, not its symptoms.'],
  ['Baseline', 'Baseline', 'Keadaan sebelum bermula, untuk dibandingkan kemudian.', 'The situation before you start, for later comparison.'],
  ['SOP', 'Standard Operating Procedure', 'Prosedur kerja bertulis yang standard.', 'A standard written work procedure.'],
  ['Pilot', 'Pilot', 'Percubaan berskala kecil sebelum program penuh.', 'A small-scale trial before a full programme.'],
  ['Coaching', 'Coaching', 'Bimbingan 1-ke-1 untuk membantu seseorang berkembang.', 'One-to-one guidance to help someone improve.'],
  ['Job aid', 'Job aid', 'Panduan ringkas di tempat kerja, contohnya kad atau senarai semak.', 'A short on-the-job guide, such as a card or checklist.'],
  ['Sinopsis', 'Synopsis', 'Ringkasan satu muka surat di depan dokumen TNA.', 'A one-page summary at the front of the TNA document.'],
  ['Balik modal', 'Payback period', 'Berapa lama penjimatan menampung kos penyelesaian.', 'How long the savings take to cover the cost of the solution.'],
  ['Bidang latihan', 'Training area', 'Topik kemahiran yang dilatih, contohnya komunikasi atau jualan.', 'The skill topic being trained, such as communication or sales.'],
  ['Insentif', 'Incentive', 'Kesan atau ganjaran yang mendorong tingkah laku.', 'Consequences or rewards that drive behaviour.']
];
function pageBantuan() {
  return `<div class="wrap" style="max-width:820px"><p class="eyebrow">${bi('Panduan', 'Guide')}</p><h1>Ringkas. <em>Tiga langkah.</em><span class="enh">Simple. Three steps.</span></h1>
  <div class="card" style="margin-top:24px"><ol style="margin-top:4px;font-size:15px"><li><b>TNA:</b> ${bib('tulis isu dan jawab semakan punca. Dokumen TNA dijana.', 'describe the issue and answer the root-cause checks. A TNA document is generated.')}</li><li><b>PITCH:</b> ${bib('pilih apa yang anda mahu daripada superior. Skrip dan slaid siap.', 'choose what you want from your superior. Script and slides are ready.')}</li><li><b>CHECKLIST:</b> ${bib('tanda tindakan yang siap. Mahu tarikh dan PIC? Pilih mod Lengkap.', 'tick the actions you have done. Want dates and a PIC? Choose the Detailed mode.')}</li><li><b>${bi('Pelan Saya', 'My plan')}:</b> ${bib('muat turun dokumen, slaid dan checklist.', 'download the document, slides and checklist.')}</li></ol></div>
  <div class="card"><h2>${bi('Adakah ini AI?', 'Is this AI?')}</h2><p style="font-size:15px;margin-top:6px">${bib('Draf dijana oleh peraturan MOVE berdasarkan kerangka TNA yang diiktiraf, jadi ia berfungsi tanpa akaun AI. Untuk TNA dan skrip yang lebih khusus, anda boleh menyalin prompt ke ChatGPT atau Claude. AI hanya dibenarkan merujuk senarai sumber yang dinyatakan.', 'Drafts are generated by MOVE rules based on recognised TNA frameworks, so it works without an AI account. For a more specific TNA and script, you can copy a prompt into ChatGPT or Claude. The AI may cite only the listed sources.')}</p></div>
  <div class="card"><h2>${bi('Data anda', 'Your data')}</h2><p style="font-size:15px;margin-top:6px">${bib('Semua disimpan dalam pelayar (browser) anda sahaja. Tiada akaun dan tiada yang dihantar ke mana-mana. Kerana itu, muat turun fail sebelum menukar peranti atau mengosongkan data pelayar. Jika menggunakan AI, jangan tampal nama atau maklumat sulit.', 'Everything is stored in your browser only. There is no account and nothing is sent anywhere. So download your files before changing devices or clearing browser data. If you use AI, do not paste names or confidential information.')}</p></div>
  <div class="card"><h2>${bi('Istilah', 'Glossary')}</h2><div class="gloss">${GLOSS.map(([m, e, dm, de]) => `<div><b>${esc(m)}</b> <i class="en">${esc(e)}</i><p>${esc(dm)}<i class="en blk">${esc(de)}</i></p></div>`).join('')}</div></div>
  <div class="card"><h2>${bi('Soalan lazim', 'FAQ')}</h2>
    <details><summary><b>${bi('Saya tidak tahu jawapan semakan.', 'I do not know the answer to a check.')}</b></summary><p style="margin-top:6px">${bib('Pilih "Tak pasti". Planner menyenaraikannya sebagai perkara untuk disahkan.', 'Choose "Not sure". The planner lists it as an item to verify.')}</p></details>
    <details><summary><b>${bi('Boleh buka sandaran planner lama?', 'Can I open a backup from the old planner?')}</b></summary><p style="margin-top:6px">${bib('Boleh. Menu, "Buka sandaran". Data lama dalam pelayar yang sama dibawa masuk secara automatik.', 'Yes. Menu, "Open backup". Old data in the same browser is imported automatically.')}</p></details>
    <details><summary><b>${bi('Fail tidak muncul selepas muat turun.', 'The file did not appear after downloading.')}</b></summary><p style="margin-top:6px">${bib('Klik pautan di bahagian atas halaman, dan semak folder Downloads.', 'Click the link at the top of the page, and check your Downloads folder.')}</p></details>
    <details><summary><b>${bi('Checklist mengira cuti umum?', 'Does the checklist account for public holidays?')}</b></summary><p style="margin-top:6px">${bib('Tidak. Dalam mod Lengkap, tarikh hanya mengira Isnin hingga Jumaat. Semak tarikh anda.', 'No. In Detailed mode, dates count Monday to Friday only. Check your dates.')}</p></details></div>
  <div class="nav-row"><a class="btn" href="#mula">← ${bi('Utama', 'Home')}</a><button class="btn danger" data-a="clear">${bi('Padam semua data', 'Delete all data')}</button></div></div>`;
}

/* ---------- render ---------- */
function render(focus) {
  const r = route(), pages = { mula: pageMula, tna: pageTNA, pitch: pagePitch, plan: pagePlan, hasil: pageHasil, bantuan: pageBantuan };
  $('#app').innerHTML = pages[r]();
  stepper(r);
  document.title = ({ mula: 'MOVE YOUR TEAM Planner', tna: 'TNA', pitch: 'PITCH', plan: 'Checklist', hasil: 'Pelan Saya / My plan', bantuan: 'Panduan / Guide' }[r]) + ' | AMPAC';
  save();
  if (focus) { scrollTo(0, 0); $('#app').focus({ preventScroll: true }); }
}
function refresh() {
  const r = route(); stepper(r);
  if (r === 'tna' && $('#tna-pv')) $('#tna-pv').innerHTML = tnaPreview();
  if (r === 'pitch') { const ae = document.activeElement; if (!(ae && ae.id === 'skrip')) $('#pitch-pv').innerHTML = pitchPreview(); }
  if (r === 'plan' && $('#plan-tasks')) { const D = planDyn(); $('#plan-warn').innerHTML = D.warn; $('#plan-sum').innerHTML = D.sum; const ae = document.activeElement; if (!(ae && ae.closest && ae.closest('#plan-tasks'))) $('#plan-tasks').innerHTML = D.tasks; }
}
function updateProgress() { const PL = prog(); if ($('#pct')) { $('#pct').innerHTML = PL.done + ' / ' + PL.total + ' ' + bi('siap', 'done'); $('#pbar').style.width = PL.pct + '%'; $('#next').innerHTML = nextList(); } if ($('#qsum')) { $('#qsum').innerHTML = PL.done + ' / ' + PL.total + ' ' + bi('siap', 'done'); $('#qbar').style.width = PL.pct + '%'; } }

/* ---------- eksport ---------- */
const stamp = () => M.todayISO();
async function exportPPTX() {
  toast('Menyediakan slaid… <i class="en">Preparing slides…</i>');
  try { await loadScript('vendor/pptxgen.bundle.js'); } catch (e) { toast('Penjana slaid tidak dapat dimuatkan. Pastikan folder vendor dimuat naik. <i class="en">The slide generator could not load. Make sure the vendor folder is uploaded.</i>'); return; }
  const PI = M.pitch(S), PL = M.plan(S), p = new PptxGenJS();
  p.layout = 'LAYOUT_16x9'; p.title = 'MOVE YOUR TEAM: Cadangan / Proposal'; p.company = 'AMPAC';
  let logo = null;
  try { const b = await (await fetch('assets/move-logo.png')).blob(); logo = await new Promise(res => { const f = new FileReader(); f.onload = () => res(f.result); f.readAsDataURL(b); }); } catch (e) { }
  p.defineSlideMaster({ title: 'MOVE', background: { color: 'FFFFFF' }, objects: [{ rect: { x: 0, y: 0, w: 0.28, h: 5.625, fill: { color: 'D51F35' } } }, { rect: { x: 0.28, y: 0, w: 0.06, h: 5.625, fill: { color: 'D6B574' } } }, { text: { text: 'MOVE YOUR TEAM · AMPAC', options: { x: 0.6, y: 5.22, w: 6, h: 0.3, fontSize: 9, color: '888888', fontFace: 'Arial' } } }], slideNumber: { x: 9.2, y: 5.22, fontSize: 9, color: '888888', fontFace: 'Arial' } });
  const c = p.addSlide(); c.background = { color: '17191D' };
  c.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 0.28, h: 5.625, fill: { color: 'D51F35' }, line: { color: 'D51F35' } });
  c.addShape(p.ShapeType.rect, { x: 0.28, y: 0, w: 0.06, h: 5.625, fill: { color: 'D6B574' }, line: { color: 'D6B574' } });
  if (logo) c.addImage({ data: logo, x: 0.7, y: 0.45, w: 1.9, h: 0.82 });
  c.addText([{ text: 'CADANGAN KEPADA PENGURUSAN', options: { breakLine: true } }, { text: 'PROPOSAL TO MANAGEMENT', options: { italic: true, fontSize: 10 } }], { x: 0.7, y: 1.55, w: 8.5, h: 0.55, fontSize: 12, bold: true, color: 'D6B574', fontFace: 'Arial' });
  c.addText(M.cut(S.isu, 120) || 'Cadangan pembangunan pasukan', { x: 0.7, y: 2.15, w: 8.6, h: 1.6, fontSize: 26, bold: true, color: 'FFFFFF', fontFace: 'Arial', valign: 'top' });
  c.addText('Disediakan oleh / Prepared by ' + (S.nama || 'HR') + '  ·  ' + M.fmtD(stamp()), { x: 0.7, y: 4.0, w: 8, h: 0.35, fontSize: 12, color: 'C9CBD1', fontFace: 'Arial' });
  c.addText([{ text: M.DISCLAIMER.m, options: { breakLine: true } }, { text: M.DISCLAIMER.e, options: { italic: true } }], { x: 0.7, y: 4.45, w: 8.7, h: 0.9, fontSize: 7.5, color: '8F929A', fontFace: 'Arial', valign: 'top' });
  PI.slaid.forEach((s, i) => {
    const sl = p.addSlide({ masterName: 'MOVE' }), n = s.poin.reduce((a, x) => a + x.m.length + x.e.length, 0), big = n > 620 ? [13, 9] : n > 420 ? [15, 10] : [17, 11];
    sl.addText('SLAID / SLIDE ' + (i + 1), { x: 0.6, y: 0.3, w: 4, h: 0.3, fontSize: 10, bold: true, color: 'D51F35', charSpacing: 3, fontFace: 'Arial' });
    sl.addText([{ text: s.tajuk.m, options: { breakLine: true, fontSize: 26, bold: true, color: '17191D' } }, { text: s.tajuk.e, options: { fontSize: 13, italic: true, color: '6B7280' } }], { x: 0.6, y: 0.6, w: 8.8, h: 0.95, fontFace: 'Arial', valign: 'top' });
    const runs = []; s.poin.forEach(x => { runs.push({ text: x.m, options: { bullet: true, breakLine: true, fontSize: big[0], color: '2D3136', paraSpaceAfter: x.e ? 1 : 8 } }); if (x.e) runs.push({ text: x.e, options: { bullet: false, breakLine: true, italic: true, fontSize: big[1], color: '6B7280', paraSpaceAfter: 8, indentLevel: 1 } }); });
    sl.addText(runs, { x: 0.6, y: 1.65, w: 8.8, h: 3.45, fontFace: 'Arial', valign: 'top' });
    if (s.nota) sl.addNotes(s.nota.m + '\n' + s.nota.e);
  });
  const ap = p.addSlide({ masterName: 'MOVE' });
  ap.addText([{ text: 'Lampiran: Checklist tindakan', options: { bold: true, fontSize: 20, color: '17191D' } }, { text: '   Appendix: Action checklist', options: { italic: true, fontSize: 11, color: '6B7280' } }], { x: 0.6, y: 0.3, w: 8.8, h: 0.5, fontFace: 'Arial' });
  const H = t => ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: 'D51F35' }, fontSize: 9, fontFace: 'Arial' } });
  const cellB = (m, e) => ({ text: e ? [{ text: m, options: { breakLine: true, fontSize: 8, color: '2D3136' } }, { text: e, options: { italic: true, fontSize: 6.5, color: '6B7280' } }] : m, options: { fontFace: 'Arial', fontSize: 8, valign: 'top', color: '2D3136' } });
  if (S.mod !== 'lengkap') {
    const Q = M.quick(S), qrows = [[H('No'), H('Tindakan / Action'), H('Siap / Done')]].concat(Q.items.map((x, i) => [{ text: String(i + 1), options: { fontSize: 10, fontFace: 'Arial', valign: 'top' } }, { text: [{ text: x.m, options: { breakLine: true, fontSize: 11, color: '2D3136' } }, { text: x.e, options: { italic: true, fontSize: 8.5, color: '6B7280' } }], options: { fontFace: 'Arial', valign: 'top' } }, { text: x.done ? 'Ya / Yes' : '', options: { fontSize: 10, fontFace: 'Arial', valign: 'top', color: '1F7A4D', bold: true } }]));
    ap.addTable(qrows, { x: 0.6, y: 0.85, w: 8.9, colW: [0.5, 7.2, 1.2], border: { type: 'solid', color: 'D8D6CF', pt: 0.5 }, autoPage: true, autoPageRepeatHeader: true, newSlideStartY: 0.5, margin: 0.05 });
  } else {
  const rows = [[H('No'), H('Tugasan / Task'), H('PIC'), H('Siap / Due'), H('Bukti / Proof')]].concat(PL.tasks.map((t, i) => [{ text: String(i + 1), options: { fontSize: 8.5, fontFace: 'Arial', valign: 'top' } }, cellB(t.tugas, t.te), { text: t.pic, options: { fontSize: 8.5, fontFace: 'Arial', valign: 'top', color: '2D3136' } }, { text: M.fmtShort(t.siap), options: { fontSize: 8.5, fontFace: 'Arial', valign: 'top', color: '2D3136' } }, cellB(t.bukti, t.be)]));
  /* bahagi baris secara manual supaya tiada baris yang terbelah antara dua slaid */
  const est = t => Math.max(Math.ceil(t.tugas.length / 58) + (t.te ? Math.ceil(t.te.length / 78) : 0), Math.ceil(t.bukti.length / 38) + (t.be ? Math.ceil(t.be.length / 55) : 0), 2);
  const chunks = []; let cur = [], used = 0;
  PL.tasks.forEach((t, i) => { const e = est(t); if (used + e > 29 && cur.length) { chunks.push(cur); cur = []; used = 0; } cur.push(rows[i + 1]); used += e; });
  if (cur.length) chunks.push(cur);
  chunks.forEach((ch, k) => {
    const sl = k ? p.addSlide({ masterName: 'MOVE' }) : ap;
    if (k) sl.addText([{ text: 'Lampiran: Checklist tindakan (' + (k + 1) + ')', options: { bold: true, fontSize: 20, color: '17191D' } }, { text: '   Appendix: Action checklist (' + (k + 1) + ')', options: { italic: true, fontSize: 11, color: '6B7280' } }], { x: 0.6, y: 0.3, w: 8.8, h: 0.5, fontFace: 'Arial' });
    sl.addTable([rows[0]].concat(ch), { x: 0.6, y: 0.78, w: 8.9, colW: [0.35, 3.6, 1.6, 0.75, 2.6], border: { type: 'solid', color: 'D8D6CF', pt: 0.5 }, margin: 0.03 });
  });
  }
  try { await p.writeFile({ fileName: 'MOVE-slaid-pitch.pptx' }); $('#dl-note').hidden = true; toast('Slaid dimuat turun <i class="en">Slides downloaded</i>: MOVE-slaid-pitch.pptx'); } catch (e) { toast('Gagal menjana slaid <i class="en">Could not build slides</i>: ' + esc(e.message)); }
}
function exportPDF() {
  $('#print-area').innerHTML = '<div class="print-head"><img src="assets/move-logo.webp" alt="MOVE YOUR TEAM"><span>' + esc(M.fmtD(stamp())) + '</span></div><div class="doc">' + M.docBody(S) + '</div>';
  setTimeout(() => window.print(), 60);
}

/* ---------- peristiwa ---------- */
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.f && t.type !== 'radio') { S[t.dataset.f] = t.value; save(); refresh(); }
  if (t.dataset.t) {
    ensureTasks(); const x = S.tasks.find(a => a.id === t.dataset.t); if (!x) return;
    x[t.dataset.k] = t.value;
    if (t.dataset.k === 'tugas' && x.te) { x.te = ''; const te = t.closest('.task') && t.closest('.task').querySelector('.te'); if (te) te.remove(); }
    if (t.dataset.k === 'siap' && M.dOK(t.value) && (!M.dOK(x.mula) || x.mula > t.value)) x.mula = t.value; save();
    if (t.dataset.k === 'siap') $('#plan-sum').innerHTML = planDyn().sum;
  }
  if (t.dataset.skrip !== undefined) { S.skripEdit = t.value; save(); const n = M.parseBi(t.value).map(x => x.m).join(' ').trim().split(/\s+/).filter(Boolean).length; const k = $('#kata'); if (k) { k.innerHTML = n + ' ' + bi('patah perkataan (Melayu)', 'words (Malay)') + ' · ' + bi('sasaran', 'target') + ' ~260'; k.classList.toggle('over', n > 320); } }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.d) { S.diag[t.dataset.d] = t.value === 'x' ? null : Number(t.value); save(); refresh(); }
  if (t.dataset.f && (t.type === 'radio' || t.type === 'date')) { S[t.dataset.f] = t.value; save(); refresh(); }
  if (t.dataset.f === 'bidang') { S.bidang = t.value; save(); render(); }
  if (t.dataset.q) {
    qToggle(t.dataset.q, t.checked); save();
    if (route() === 'plan') { const row = t.closest('.qa'); if (row) row.classList.toggle('done', t.checked); }
    updateProgress();
  }
  if (t.dataset.done) {
    ensureTasks(); const x = S.tasks.find(a => a.id === t.dataset.done); if (x) x.done = t.checked; save();
    if (route() === 'plan') { const row = t.closest('.task'); if (row) row.classList.toggle('done', t.checked); } else updateProgress();
  }
  if (t.id === 'import-file') importFile(t);
});
document.addEventListener('click', e => {
  const m = $('#menu'); if (!e.target.closest('#menu')) { m.classList.remove('open'); $('#menu-btn').setAttribute('aria-expanded', 'false'); }
  if (e.target.closest('#menu-btn')) { const o = m.classList.toggle('open'); $('#menu-btn').setAttribute('aria-expanded', String(o)); return; }
  const sub = e.target.closest('[data-sub]'); if (sub) { tnaStep = Math.max(0, Math.min(3, Number(sub.dataset.sub))); render(); scrollTo(0, 0); return; }
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
  if (a === 'example') { const go = () => { S = M.exampleData(); tnaStep = 0; save(); location.hash = 'tna'; render(true); }; (M.has(S.isu) || M.has(S.contoh) || S.tasks) ? ask('Gunakan contoh? <i class="en">Use the example?</i>', 'Isian semasa akan diganti dengan contoh. Muat turun sandaran dahulu jika anda mahu menyimpannya. <i class="en blk">Your current entries will be replaced by the example. Download a backup first if you want to keep them.</i>', go) : go(); }
  if (a === 'reset') ask('Mulakan baharu? <i class="en">Start new?</i>', 'Pelan semasa akan dikosongkan. Muat turun sandaran dahulu jika perlu. <i class="en blk">Your current plan will be cleared. Download a backup first if needed.</i>', () => { S = M.defaults(); tnaStep = 0; save(); location.hash = 'mula'; render(true); });
  if (a === 'clear') ask('Padam semua data? <i class="en">Delete all data?</i>', 'Semua jawapan dan checklist pada peranti ini akan dipadam. Tidak boleh dibatalkan. <i class="en blk">All answers and checklists on this device will be deleted. This cannot be undone.</i>', () => { try { [M.KEY, ...M.OLD_KEYS].forEach(k => localStorage.removeItem(k)); } catch (e) { } S = M.defaults(); tnaStep = 0; location.hash = 'mula'; render(true); toast('Semua data dipadam. <i class="en">All data deleted.</i>'); });
  if (a === 'backup') download(JSON.stringify(Object.assign({ version: 6 }, S), null, 2), 'MOVE-sandaran-backup.json', 'application/json');
  if (a === 'import') $('#import-file').click();
  if (a === 'skrip-reset') { S.skripEdit = ''; save(); $('#pitch-pv').innerHTML = pitchPreview(); }
  if (a === 'add-task') { ensureTasks(); const last = S.tasks[S.tasks.length - 1]; S.tasks.push({ id: M.uid(), fasa: last ? last.fasa : 'laksana', tugas: 'Tugasan baharu', te: 'New task', pic: '', mula: last ? last.siap : '', siap: last ? last.siap : '', bukti: '', be: '', dep: '', done: false, grp: last ? last.grp : '' }); save(); $('#plan-tasks').innerHTML = planDyn().tasks; const rows = $$('#plan-tasks .task'); rows[rows.length - 1].querySelector('textarea').focus(); }
  if (a === 'del-task') { ensureTasks(); S.tasks = S.tasks.filter(x => x.id !== b.dataset.id); if (!S.tasks.length) { S.tasks = null; S.tasksSig = ''; S.qdone = {}; } save(); $('#plan-tasks').innerHTML = planDyn().tasks; refresh(); }
  if (a === 'regen') ask('Jana semula checklist? <i class="en">Regenerate the checklist?</i>', 'Suntingan dan tanda siap akan diganti. <i class="en blk">Your edits and ticks will be replaced.</i>', () => { S.tasks = null; S.tasksSig = ''; S.qdone = {}; save(); render(); });
  if (a === 'mod') { S.mod = b.dataset.v === 'lengkap' ? 'lengkap' : 'cepat'; save(); render(true); }
  if (a === 'ai-info-copy') copyText(M.aiInfoPrompt(S));
  if (a === 'ai-copy') copyText(M.aiScriptPrompt(S));
  if (a === 'ai-tna-copy') copyText(M.aiTnaPrompt(S));
  if (a === 'ai-tna-apply') {
    const v = $('#tnaai').value.trim(), msg = $('#ai-msg');
    if (v.length < 200 || !/##/.test(v)) { msg.className = 'ai-msg bad'; msg.innerHTML = bi('Jawapan nampak terlalu pendek atau tiada tajuk (##). Salin keseluruhan jawapan AI.', 'The answer looks too short or has no headings (##). Copy the whole AI answer.'); return; }
    S.tnaAI = v.slice(0, 40000); save(); render(); toast('Versi AI digunakan. <i class="en">AI version applied.</i>');
  }
  if (a === 'ai-tna-clear') { S.tnaAI = ''; save(); render(); toast('Kembali ke draf asal. <i class="en">Back to the original draft.</i>'); }
  if (a === 'x-pptx') exportPPTX();
  if (a === 'x-doc') download(M.toDoc(S), 'MOVE-TNA-dan-pelan.doc', 'application/msword');
  if (a === 'x-pdf') exportPDF();
  if (a === 'x-csv') download(M.toCSV(S), 'MOVE-checklist.csv', 'text/csv;charset=utf-8');
  if (a === 'x-ics') download(M.toICS(S), 'MOVE-checklist.ics', 'text/calendar;charset=utf-8');
});
function copyText(text) { (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast('Prompt disalin. Tampal di ChatGPT atau Claude. <i class="en">Prompt copied. Paste it into ChatGPT or Claude.</i>')).catch(() => toast('Salinan automatik tidak tersedia pada pelayar ini. <i class="en">Automatic copy is not available in this browser.</i>')); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#menu').classList.remove('open'); });
async function importFile(inp) {
  const f = inp.files[0]; inp.value = ''; if (!f) return;
  if (f.size > 2e6) { toast('Fail terlalu besar (had 2MB). <i class="en">File too large (2MB limit).</i>'); return; }
  try { const d = M.validate(JSON.parse(await f.text())); ask('Buka sandaran ini? <i class="en">Open this backup?</i>', 'Pelan semasa akan diganti. <i class="en blk">Your current plan will be replaced.</i>', () => { S = d; save(); render(); toast('Sandaran dibuka. <i class="en">Backup opened.</i>'); }); } catch (e) { toast('Fail tidak sah. Pilih sandaran JSON daripada planner MOVE. <i class="en">Invalid file. Choose a JSON backup from the MOVE planner.</i>'); }
}
let prevRoute = route();
window.addEventListener('hashchange', () => { const r = route(); if (r === 'tna' && prevRoute !== 'tna') tnaStep = 0; prevRoute = r; render(true); });
window.addEventListener('beforeunload', () => { if (dlURL) URL.revokeObjectURL(dlURL); });
render();
