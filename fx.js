'use strict';
/* MOVE YOUR TEAM — kesan visual dan demo interaktif.
   Semua kesan menghormati prefers-reduced-motion dan tidak menghalang kandungan jika JS gagal. */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  
  /* ---------- pecah teks kepada perkataan ---------- */
  function splitWords(root, cls, nested) {
    let i = 0;
    (function walk(n) {
      [...n.childNodes].forEach(c => {
        if (c.nodeType === 3) {
          const f = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { f.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = cls;
            if (nested) { const s = document.createElement('span'); s.textContent = p; s.style.setProperty('--i', i++); w.appendChild(s); }
            else { w.textContent = p; i++; }
            f.appendChild(w);
          });
          c.replaceWith(f);
        } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
      });
    })(root);
    return i;
  }

  const h1 = $('.hero h1');
  if (h1 && !reduce) splitWords(h1, 'w', true);
  const mp = $('.manifesto p');
  let mWords = [];
  if (mp) { splitWords(mp, 'mw', false); mWords = $$('.mw', mp); if (reduce) mWords.forEach(w => w.classList.add('lit')); }

  /* ---------- reveal ketika skrol ---------- */
  const sel = '.section-heading, .section-intro, .problem-list article, .deliverable, .plan-stage, .move-card, .workshop-image, .workshop-sequence>div, .bring-box, .price-grid>div, .incl li, .notice, .trainer-visual, .trainer-copy>*, .audience-list>div, .gallery-photo, .quote, .contact-copy>*, .enquiry-form';
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    $$(sel).forEach(el => {
      const idx = [...el.parentElement.children].indexOf(el);
      el.style.setProperty('--d', Math.min(idx, 6) * 90 + 'ms');
      el.classList.add('reveal'); io.observe(el);
    });
  }

  /* ---------- kiraan naik ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    const co = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; co.unobserve(e.target);
      const el = e.target, end = +el.dataset.count, t0 = performance.now(), dur = 1500;
      const step = t => { const p = clamp((t - t0) / dur, 0, 1), v = Math.round(end * (1 - Math.pow(1 - p, 3))); el.textContent = v.toLocaleString('en-US'); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }), { threshold: .6 });
    $$('[data-count]').forEach(el => { el.textContent = '0'; co.observe(el); });
  }

  /* ---------- bar kemajuan, manifesto, agenda (berasaskan skrol) ---------- */
  const bar = $('#progress'), agenda = $('.agenda'), manifesto = $('.manifesto');
  let fill = null;
  if (agenda) { fill = document.createElement('div'); fill.className = 'agenda-fill'; agenda.prepend(fill); }
  const slots = $$('.slot');
  let busy = false;
  function frame() {
    busy = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? clamp(scrollY / max, 0, 1) : 0) + ')';
    if (manifesto && !reduce) {
      const r = manifesto.getBoundingClientRect();
      const p = clamp((innerHeight * .92 - r.top) / (innerHeight * .5), 0, 1);
      const n = Math.ceil(p * mWords.length);
      mWords.forEach((w, i) => w.classList.toggle('lit', i < n));
    }
    if (agenda) {
      const r = agenda.getBoundingClientRect(), mid = innerHeight * .62;
      if (fill && !reduce) fill.style.height = clamp((mid - r.top) / r.height, 0, 1) * 100 + '%';
      slots.forEach(s => s.classList.toggle('on', reduce || s.getBoundingClientRect().top < mid));
    }
  }
  const onScroll = () => { if (!busy) { busy = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); frame();

  /* ---------- kursor: sorotan hero, condong 3D, butang magnetik ---------- */
  if (fine && !reduce) {
    const hero = $('.hero'), art = $('.hero-art');
    if (hero && art) {
      hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', e.clientX - r.left + 'px'); hero.style.setProperty('--my', e.clientY - r.top + 'px');
        const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
        art.style.setProperty('--px', x * 16 + 'px'); art.style.setProperty('--py', y * 12 + 'px');
        art.style.setProperty('--ry', x * 6 + 'deg'); art.style.setProperty('--rx', -y * 5 + 'deg');
      });
      hero.addEventListener('pointerleave', () => { ['--px', '--py'].forEach(k => art.style.setProperty(k, '0px')); ['--rx', '--ry'].forEach(k => art.style.setProperty(k, '0deg')); });
    }
    $$('.move-card').forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        c.style.setProperty('--rx', -y * 7 + 'deg'); c.style.setProperty('--ry', x * 9 + 'deg');
        c.style.setProperty('--gx', (x + .5) * 100 + '%'); c.style.setProperty('--gy', (y + .5) * 100 + '%');
      });
      c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
    $$('.hero-buttons .button, .nav-end .button, .form-submit').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.setProperty('--tx', (e.clientX - r.left - r.width / 2) * .18 + 'px'); b.style.setProperty('--ty', (e.clientY - r.top - r.height / 2) * .25 + 'px'); });
      b.addEventListener('pointerleave', () => { b.style.setProperty('--tx', '0px'); b.style.setProperty('--ty', '0px'); });
    });
  }

  /* ---------- konfeti selepas pendaftaran ---------- */
  window.moveBurst = function () {
    if (reduce) return;
    const cv = document.createElement('canvas'); cv.className = 'confetti';
    cv.width = innerWidth; cv.height = innerHeight; document.body.appendChild(cv);
    const g = cv.getContext('2d'), cols = ['#d51f35', '#d6b574', '#ffffff', '#17191d', '#ffda9c'];
    const ps = Array.from({ length: 140 }, () => ({ x: innerWidth / 2, y: innerHeight * .62, vx: (Math.random() - .5) * 16, vy: -Math.random() * 15 - 5, s: 5 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[(Math.random() * cols.length) | 0] }));
    const t0 = performance.now();
    (function step(t) {
      const age = t - t0; g.clearRect(0, 0, cv.width, cv.height);
      ps.forEach(p => { p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.globalAlpha = clamp(1 - (age - 1400) / 800, 0, 1); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); });
      if (age < 2300) requestAnimationFrame(step); else cv.remove();
    })(t0);
  };
})();
