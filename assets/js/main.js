(function () {
  "use strict";

  /* ------------------------------------------------------------
     TETAPAN: ubah di sini sahaja
     ------------------------------------------------------------ */
  var CONFIG = {
    // Nombor WhatsApp untuk butang pertanyaan, format 60123456789.
    // Biar kosong ("") untuk sembunyikan butang WhatsApp.
    whatsapp: "",
    links: {
      kids: "https://akademiampac.onpay.my/order/form/pcsberaniberbicarasuperstar2026",
      teen: "https://akademiampac.onpay.my/order/form/pcsberaniberbicarasuperhero2026"
    },
    programStart: "2026-12-07T09:30:00+08:00",
    mainVideo: "https://www.facebook.com/watch/?v=1259323399372881",
    facebookVideos: [
      "https://www.youtube.com/watch?v=-VTYDr9ITLs",
      "https://www.facebook.com/share/r/18fKDR2VwX/",
      "https://www.facebook.com/share/r/19WgyUmSc8/",
      "https://www.facebook.com/share/v/19nrvmhbcK/",
      "https://www.facebook.com/share/v/16oLCfu2Xo/",
      "https://www.facebook.com/share/v/1Gmp3BjeVq/",
      "https://www.facebook.com/share/v/1Dn6rqitMe/",
      "https://www.facebook.com/share/r/1HKDAJmuHA/",
      "https://www.facebook.com/share/r/17uBcckzcs/",
      "https://www.facebook.com/share/r/1H5sEcMNyQ/"
    ],
    reelCovers: ["photo-08", "photo-10", "photo-21", "photo-29", "photo-28", "photo-13", "photo-16", "photo-24", "photo-25", "photo-33"],
    railA: ["photo-12", "photo-08", "photo-05", "photo-15", "photo-06", "photo-09", "photo-21", "photo-31", "photo-17", "photo-02", "photo-20"],
    railB: ["photo-11", "photo-14", "photo-26", "photo-18", "photo-23", "photo-03", "photo-27", "photo-30", "photo-32", "photo-01", "photo-07"]
  };

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var img = function (n) { return "assets/img/" + n + ".webp"; };

  /* Nav + sticky bar */
  var nav = $("#nav"), sticky = $("#sticky"), pricing = $("#pakej");
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle("solid", y > 40);
    var pr = pricing.getBoundingClientRect();
    var inPricing = pr.top < window.innerHeight && pr.bottom > 0;
    sticky.classList.toggle("show", y > 600 && !inPricing);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Hero: takut -> berani */
  var swap = $("#swap");
  if (swap) {
    if (reduce) swap.classList.add("on");
    else {
      setTimeout(function () { swap.classList.add("on"); }, 1400);
      setInterval(function () {
        swap.classList.remove("on");
        setTimeout(function () { swap.classList.add("on"); }, 1100);
      }, 6500);
    }
  }

  /* Hero: rotate kids on stage */
  var kids = $$("#kids img"), ki = 0;
  if (kids.length > 1 && !reduce) {
    setInterval(function () {
      kids[ki].classList.remove("on");
      ki = (ki + 1) % kids.length;
      kids[ki].classList.add("on");
    }, 3200);
  }

  /* Gallery rails */
  var rails = $("#rails"), gallery = [];
  function buildRail(list, rev) {
    var r = document.createElement("div");
    r.className = "rail" + (rev ? " rev" : "");
    list.concat(list).forEach(function (n, i) {
      var b = document.createElement("button");
      b.setAttribute("data-lb", img(n));
      b.setAttribute("aria-label", "Lihat gambar program");
      if (i >= list.length) { b.tabIndex = -1; b.setAttribute("aria-hidden", "true"); }
      b.innerHTML = '<img src="' + img(n) + '" alt="Aktiviti Program Cuti Sekolah AMPAC" loading="lazy">';
      r.appendChild(b);
    });
    rails.appendChild(r);
  }
  if (rails) { buildRail(CONFIG.railA, false); buildRail(CONFIG.railB, true); }

  /* Facebook reels */
  var reels = $("#reels");
  if (reels) {
    CONFIG.facebookVideos.forEach(function (u, i) {
      var a = document.createElement("a");
      a.className = "reel rv";
      a.href = u; a.target = "_blank"; a.rel = "noopener";
      a.innerHTML = '<img src="' + img(CONFIG.reelCovers[i % CONFIG.reelCovers.length]) + '" alt="" loading="lazy">' +
        '<span><i><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></i>Video ' + (i + 1) + '</span>';
      reels.appendChild(a);
    });
  }

  /* YouTube: load only when clicked */
  var yt = $("#yt");
  if (yt) {
    $("button", yt).addEventListener("click", function () {
      yt.innerHTML = '<iframe src="https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(CONFIG.mainVideo) +
        '&show_text=false&autoplay=true&width=1280" title="Testimoni utama Program Cuti Sekolah AMPAC" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>';
    });
  }

  /* Reveal on scroll + counters */
  function countUp(el) {
    var target = +el.getAttribute("data-count"), dur = 1800, t0 = null;
    if (reduce) { el.textContent = target.toLocaleString("en-US"); return; }
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * e).toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      $$("[data-count]", en.target).forEach(countUp);
      io.unobserve(en.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  $$(".rv, .relief, .ben-photo, #anchor").forEach(function (el) { io.observe(el); });

  /* Date picker */
  $$(".date-card").forEach(function (c) {
    c.addEventListener("click", function () {
      $$(".date-card").forEach(function (o) { o.setAttribute("aria-pressed", o === c ? "true" : "false"); });
    });
  });

  /* Age toggle: switch logo + registration links */
  var pill = $("#pillBg"), logo = $("#ageLogo"), ageBtns = $$(".age-toggle button");
  function setAge(btn) {
    ageBtns.forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
    pill.style.width = btn.offsetWidth + "px";
    pill.style.transform = "translateX(" + (btn.offsetLeft - 6) + "px)";
    var teen = btn.getAttribute("data-age") === "teen";
    $$(".reg").forEach(function (a) { a.href = teen ? CONFIG.links.teen : CONFIG.links.kids; });
    pricing.classList.toggle("mode-teen", teen);
    pricing.classList.toggle("mode-kids", !teen);
    var src = img(teen ? "logo-superhero" : "logo-superstar");
    if (logo.getAttribute("src") !== src) {
      logo.classList.add("fade");
      setTimeout(function () {
        logo.src = src; logo.alt = teen ? "Superhero Ummah" : "Superstar Ummah";
        logo.classList.remove("fade", "in-kids", "in-teen");
        void logo.offsetWidth;
        logo.classList.add(teen ? "in-teen" : "in-kids");
      }, 250);
    }
  }
  ageBtns.forEach(function (b) { b.addEventListener("click", function () { setAge(b); }); });
  window.addEventListener("load", function () { setAge($('.age-toggle button[aria-pressed="true"]')); });
  window.addEventListener("resize", function () { setAge($('.age-toggle button[aria-pressed="true"]')); });

  /* Copy code */
  var copyBtn = $("#copyBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var txt = $("#codeTxt").textContent;
      var done = function () { copyBtn.textContent = "Disalin ✓"; setTimeout(function () { copyBtn.textContent = "Salin Kod"; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, done); else done();
    });
  }

  /* Countdown */
  var cd = $("#cd"), start = new Date(CONFIG.programStart).getTime();
  function tick() {
    var diff = Math.max(0, start - Date.now());
    var v = { d: Math.floor(diff / 864e5), h: Math.floor(diff / 36e5) % 24, m: Math.floor(diff / 6e4) % 60, s: Math.floor(diff / 1e3) % 60 };
    Object.keys(v).forEach(function (k) { $('[data-u="' + k + '"]', cd).textContent = String(v[k]).padStart(2, "0"); });
    if (diff === 0) $(".cd-label", cd).textContent = "Program sedang berlangsung!";
  }
  if (cd) { tick(); setInterval(tick, 1000); }

  /* Lightbox */
  var lb = $("#lb"), lbImg = $("img", lb), items = [], li = 0;
  function openLb(src) {
    items = $$("[data-lb]").filter(function (b) { return b.getAttribute("aria-hidden") !== "true"; }).map(function (b) { return b.getAttribute("data-lb"); });
    li = Math.max(0, items.indexOf(src));
    lbImg.src = items[li]; lb.classList.add("open"); document.body.style.overflow = "hidden";
  }
  function closeLb() { lb.classList.remove("open"); document.body.style.overflow = ""; }
  function move(d) { li = (li + d + items.length) % items.length; lbImg.src = items[li]; }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-lb]");
    if (b) openLb(b.getAttribute("data-lb"));
  });
  $(".x", lb).addEventListener("click", closeLb);
  $(".p", lb).addEventListener("click", function () { move(-1); });
  $(".n", lb).addEventListener("click", function () { move(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") move(-1);
    if (e.key === "ArrowRight") move(1);
  });

  /* WhatsApp button (only if a number is set) */
  if (CONFIG.whatsapp) {
    var wa = document.createElement("a");
    wa.className = "wa";
    wa.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent("Assalamualaikum, saya nak tanya tentang Program Cuti Sekolah AMPAC 2026.");
    wa.target = "_blank"; wa.rel = "noopener"; wa.setAttribute("aria-label", "Tanya melalui WhatsApp");
    wa.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3 2.4 1 2.9.8 3.4.7.5-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4C2.7 15.6 2.2 13.8 2.2 12 2.2 6.6 6.6 2.2 12 2.2S21.8 6.6 21.8 12 17.4 21.8 12 21.8zM12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6c1.8 1 3.8 1.5 5.8 1.5 6.6 0 12-5.4 12-12S18.6 0 12 0z"/></svg>';
    document.body.appendChild(wa);
  }
})();
