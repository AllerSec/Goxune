/* ============================================================
   GOXUNE · app.js — site engine
   - first-visit loader (sessionStorage gated)
   - GSAP scroll reveals + microinteractions
   - mobile nav, language menu, hours highlight
   - mouse-reactive parallax, prefetch, lightbox
   ============================================================ */
(function () {
  "use strict";
  const doc = document;
  const root = doc.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const onReady = (fn) => (doc.readyState !== "loading" ? fn() : doc.addEventListener("DOMContentLoaded", fn));

  /* ---------------- 1. First-visit loader ---------------- */
  function handleLoader() {
    const loader = doc.getElementById("loader");
    if (!loader) return;
    const seen = sessionStorage.getItem("gx_visited");
    if (seen) { loader.setAttribute("hidden", ""); return; }

    const bar = loader.querySelector(".loader__bar i");
    let p = 0;
    const tick = () => {
      p = Math.min(100, p + Math.random() * 18 + 6);
      if (bar) bar.style.width = p + "%";
      if (p < 100) setTimeout(tick, 130);
    };
    tick();

    const finish = () => {
      sessionStorage.setItem("gx_visited", "1");
      if (bar) bar.style.width = "100%";
      setTimeout(() => {
        loader.classList.add("is-done");
        doc.body.style.overflow = "";
        loader.addEventListener("transitionend", () => loader.setAttribute("hidden", ""), { once: true });
      }, 380);
    };
    doc.body.style.overflow = "hidden";
    window.addEventListener("load", () => setTimeout(finish, 650));
    // hard safety timeout
    setTimeout(finish, 4000);
  }

  /* ---------------- 2. Navigation ---------------- */
  function handleNav() {
    const nav = doc.querySelector(".nav");
    if (!nav) return;
    const toggle = nav.querySelector(".nav__toggle");
    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (toggle) {
      toggle.addEventListener("click", () => {
        const open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
        doc.body.style.overflow = open ? "hidden" : "";
      });
      nav.querySelectorAll(".nav__link").forEach((l) =>
        l.addEventListener("click", () => {
          nav.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          doc.body.style.overflow = "";
        })
      );
    }

    // language dropdown
    const lang = nav.querySelector(".lang");
    if (lang) {
      const btn = lang.querySelector(".lang__btn");
      btn.addEventListener("click", (e) => { e.stopPropagation(); lang.classList.toggle("is-open"); });
      doc.addEventListener("click", () => lang.classList.remove("is-open"));
      doc.addEventListener("keydown", (e) => { if (e.key === "Escape") lang.classList.remove("is-open"); });
      // persist explicit language choice so future visits honor it
      lang.querySelectorAll(".lang__item[data-lang]").forEach((it) =>
        it.addEventListener("click", () => {
          try { localStorage.setItem("gx_lang", it.dataset.lang); } catch (e) {}
        })
      );
    }
  }

  /* ---------------- 2b. Opening hours engine ---------------- */
  // Mon-Thu: 07:30-13:30 / 17:00-20:30 · Fri-Sun: 07:30-13:30 / 17:00-21:00
  const SCHEDULE = { wd: [["07:30", "13:30"], ["17:00", "20:30"]], we: [["07:30", "13:30"], ["17:00", "21:00"]] };
  function todaySchedule(d) {
    const day = d.getDay(); // 0 Sun .. 6 Sat
    return day >= 1 && day <= 4 ? SCHEDULE.wd : SCHEDULE.we;
  }

  function handleOpenBadge() {
    const badge = doc.querySelector("[data-open-badge]");
    if (!badge) return;
    const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    const d = new Date();
    const now = d.getHours() * 60 + d.getMinutes();
    let openUntil = null, nextOpen = null;
    for (const [start, end] of todaySchedule(d)) {
      if (now >= toMin(start) && now < toMin(end)) { openUntil = end; break; }
      if (now < toMin(start) && !nextOpen) nextOpen = start;
    }
    const txt = badge.querySelector("[data-open-text]");
    if (openUntil) {
      txt.textContent = badge.dataset.openTpl.replace("{t}", openUntil);
      badge.classList.add("is-open");
    } else {
      txt.textContent = badge.dataset.closedTpl.replace("{t}", nextOpen || "07:30");
    }
    badge.hidden = false;
  }

  function handleCtaHours() {
    doc.querySelectorAll("[data-today-hours]").forEach((el) => {
      const sched = todaySchedule(new Date());
      const txt = sched.map(([s, e]) => `${s}–${e}`).join(" · ");
      el.querySelector("span").textContent = `${el.dataset.label}: ${txt}`;
      el.hidden = false;
    });
  }

  /* ---------------- 2c. Scroll progress + mobile bar ---------------- */
  function handleScrollUI() {
    const bar = doc.querySelector("[data-scroll-progress]");
    const mbar = doc.querySelector("[data-mobile-bar]");
    let ticking = false;
    const update = () => {
      ticking = false;
      const max = doc.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
      if (mbar) mbar.classList.toggle("is-visible", window.scrollY > 480);
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------------- 2d. Hero carousel ---------------- */
  function handleCarousel() {
    const root = doc.querySelector("[data-carousel]");
    if (!root) return;
    const slides = Array.from(root.querySelectorAll(".carousel__slide"));
    const dots = Array.from(root.querySelectorAll(".carousel__dot"));
    if (slides.length < 2) return;
    let i = 0, timer = null;

    const go = (n) => {
      const oldVid = slides[i].querySelector("video");
      if (oldVid) oldVid.pause();
      slides[i].classList.remove("is-active");
      if (dots[i]) { dots[i].classList.remove("is-active"); dots[i].removeAttribute("aria-current"); }
      i = (n + slides.length) % slides.length;
      slides[i].classList.add("is-active");
      if (dots[i]) { dots[i].classList.add("is-active"); dots[i].setAttribute("aria-current", "true"); }
      const vid = slides[i].querySelector("video");
      if (vid) vid.play().catch(() => {});
    };
    const next = () => go(i + 1);
    const every = parseInt(root.dataset.interval, 10) || 4500;
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => { if (!prefersReduced && !timer) timer = setInterval(next, every); };
    const restart = () => { stop(); start(); };

    const btnNext = root.querySelector("[data-car-next]");
    const btnPrev = root.querySelector("[data-car-prev]");
    if (btnNext) btnNext.addEventListener("click", () => { next(); restart(); });
    if (btnPrev) btnPrev.addEventListener("click", () => { go(i - 1); restart(); });
    dots.forEach((d, n) => d.addEventListener("click", () => { go(n); restart(); }));
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", start);
    // touch swipe
    let sx = null;
    root.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    root.addEventListener("touchend", (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) { go(dx < 0 ? i + 1 : i - 1); restart(); }
      sx = null;
    }, { passive: true });
    start();
  }

  /* ---------------- 3. Hours highlight (today) ---------------- */
  function handleHours() {
    const list = doc.querySelector("[data-hours]");
    if (!list) return;
    const today = new Date().getDay(); // 0 Sun .. 6 Sat
    const map = [6, 0, 1, 2, 3, 4, 5]; // map JS day -> data-day index (Mon=0)
    const idx = map[today];
    const row = list.querySelector(`.hours__row[data-day="${idx}"]`);
    if (row) row.classList.add("is-today");
  }

  /* ---------------- 4. GSAP animations ---------------- */
  function handleGSAP() {
    if (prefersReduced || typeof gsap === "undefined") {
      doc.querySelectorAll("[data-reveal]").forEach((el) => { el.style.opacity = 1; el.style.transform = "none"; });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    // staggered scroll reveals
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      const delay = parseFloat(el.dataset.reveal) || 0;
      gsap.to(el, {
        autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", delay,
        scrollTrigger: { trigger: el, start: "top 86%", once: true },
      });
    });

    // grouped stagger (children of [data-reveal-group])
    gsap.utils.toArray("[data-reveal-group]").forEach((group) => {
      const items = group.children;
      gsap.set(items, { autoAlpha: 0, y: 30 });
      gsap.to(items, {
        autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08,
        scrollTrigger: { trigger: group, start: "top 82%", once: true },
      });
    });

    // hero entrance timeline (runs after loader on home)
    const hero = doc.querySelector("[data-hero]");
    if (hero) {
      const tl = gsap.timeline({ delay: sessionStorage.getItem("gx_visited") ? 0.1 : 0.55 });
      tl.from("[data-hero] .eyebrow", { autoAlpha: 0, y: 20, duration: 0.7, ease: "power2.out" })
        .from("[data-hero] h1 > span", { autoAlpha: 0, yPercent: 110, duration: 0.95, ease: "power4.out", stagger: 0.12 }, "-=0.3")
        .from("[data-hero] .hero__lead", { autoAlpha: 0, y: 24, duration: 0.7 }, "-=0.5")
        .from("[data-hero] .hero__cta > *", { autoAlpha: 0, y: 20, duration: 0.6, stagger: 0.1 }, "-=0.4")
        .from("[data-hero] .hero__stat", { autoAlpha: 0, y: 20, duration: 0.6, stagger: 0.1 }, "-=0.4");
      if (doc.querySelector("[data-hero] .hero__media")) {
        tl.from("[data-hero] .hero__media", { autoAlpha: 0, x: 48, duration: 0.9, ease: "power3.out" }, 0.3);
      }
    }

    // parallax on [data-parallax]
    gsap.utils.toArray("[data-parallax]").forEach((el) => {
      const depth = parseFloat(el.dataset.parallax) || 0.15;
      gsap.to(el, {
        yPercent: depth * 100,
        ease: "none",
        scrollTrigger: { trigger: el.closest("section") || el, start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    // masked word reveal on section headings (built with DOM methods, no innerHTML)
    doc.querySelectorAll("main h2").forEach((h) => {
      const words = h.textContent.trim().split(/\s+/);
      h.textContent = "";
      words.forEach((w, i) => {
        const mask = doc.createElement("span");
        mask.className = "wrd";
        const inner = doc.createElement("span");
        inner.textContent = w;
        mask.appendChild(inner);
        h.appendChild(mask);
        if (i < words.length - 1) h.appendChild(doc.createTextNode(" "));
      });
      gsap.fromTo(h.querySelectorAll(".wrd > span"),
        { yPercent: 110 },
        { yPercent: 0, duration: 0.7, ease: "power3.out", stagger: 0.05,
          scrollTrigger: { trigger: h, start: "top 88%", once: true } });
    });

    // feature images: slow settle from a slight zoom
    gsap.utils.toArray(".feature__media img").forEach((im) => {
      gsap.fromTo(im, { scale: 1.14 }, {
        scale: 1, duration: 1.3, ease: "power2.out",
        scrollTrigger: { trigger: im.closest(".feature__media"), start: "top 85%", once: true },
      });
    });

    // count-up stats
    doc.querySelectorAll("[data-countup]").forEach((el) => {
      const target = parseFloat(el.dataset.countup);
      const dec = parseInt(el.dataset.decimals || "0", 10);
      const suffix = el.dataset.suffix || "";
      const comma = el.dataset.comma === "1";
      const state = { v: 0 };
      gsap.to(state, {
        v: target, duration: 1.6, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
        onUpdate() {
          let s = state.v.toFixed(dec);
          if (comma) s = s.replace(".", ",");
          el.textContent = s + suffix;
        },
      });
    });

    // section heading underline draw
    gsap.utils.toArray("[data-draw]").forEach((el) => {
      gsap.fromTo(el, { scaleX: 0 }, {
        scaleX: 1, transformOrigin: "left center", duration: 1, ease: "power3.inOut",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
    });

    // ensure ScrollTrigger measures correctly once everything (fonts/images) settles
    window.addEventListener("load", () => ScrollTrigger.refresh());

    // safety net: never leave above-the-fold content invisible
    setTimeout(() => {
      doc.querySelectorAll("[data-reveal]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && getComputedStyle(el).opacity === "0") {
          gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" });
        }
      });
    }, 1600);
  }

  /* ---------------- 5. Magnetic buttons + mouse parallax ---------------- */
  function handleMagnetic() {
    if (prefersReduced || window.matchMedia("(pointer: coarse)").matches) return;

    doc.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic) || 0.3;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });

    // hero mouse-reactive layers
    const stage = doc.querySelector("[data-mouse-stage]");
    if (stage) {
      const layers = stage.querySelectorAll("[data-mouse-depth]");
      stage.addEventListener("mousemove", (e) => {
        const cx = (e.clientX / window.innerWidth - 0.5) * 2;
        const cy = (e.clientY / window.innerHeight - 0.5) * 2;
        layers.forEach((l) => {
          const d = parseFloat(l.dataset.mouseDepth) || 10;
          l.style.transform = `translate(${cx * d}px, ${cy * d}px)`;
        });
      });
    }
  }

  /* ---------------- 6. Prefetch all internal pages on first load ---------------- */
  function handlePrefetch() {
    if (navigator.connection && navigator.connection.saveData) return;
    window.addEventListener("load", () => {
      setTimeout(() => {
        const seen = new Set();
        doc.querySelectorAll('a[href$=".html"], a.nav__link, a[data-prefetch]').forEach((a) => {
          const href = a.getAttribute("href");
          if (!href || href.startsWith("http") || href.startsWith("#") || seen.has(href)) return;
          seen.add(href);
          const link = doc.createElement("link");
          link.rel = "prefetch";
          link.href = href;
          link.as = "document";
          doc.head.appendChild(link);
        });
      }, 1200);
    });
  }

  /* ---------------- 7. Lightbox gallery ---------------- */
  function handleLightbox() {
    const items = Array.from(doc.querySelectorAll("[data-lightbox]"));
    if (!items.length) return;
    const box = doc.getElementById("lightbox");
    if (!box) return;
    const imgEl = box.querySelector("img");
    let current = 0;

    const open = (i) => {
      current = i;
      // use the src attribute (full-resolution base), not currentSrc (responsive pick)
      const src = items[i].querySelector("img").src;
      imgEl.src = src;
      imgEl.alt = items[i].querySelector("img").alt || "";
      box.classList.add("is-open");
      box.setAttribute("aria-hidden", "false");
      doc.body.style.overflow = "hidden";
    };
    const close = () => { box.classList.remove("is-open"); box.setAttribute("aria-hidden", "true"); doc.body.style.overflow = ""; };
    const nav = (dir) => open((current + dir + items.length) % items.length);

    items.forEach((it, i) => {
      it.addEventListener("click", () => open(i));
      it.setAttribute("role", "button");
      it.setAttribute("tabindex", "0");
      it.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); } });
    });
    box.querySelector(".lightbox__close").addEventListener("click", close);
    box.querySelector(".lightbox__nav--prev").addEventListener("click", () => nav(-1));
    box.querySelector(".lightbox__nav--next").addEventListener("click", () => nav(1));
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    doc.addEventListener("keydown", (e) => {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") nav(1);
      if (e.key === "ArrowLeft") nav(-1);
    });
  }

  /* ---------------- 8. Contact form (no backend → graceful) ---------------- */
  function handleForm() {
    const form = doc.querySelector("[data-contact-form]");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const ok = form.querySelector("[data-form-ok]");
      const btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.dataset.busy = "1"; }
      setTimeout(() => {
        if (ok) { ok.hidden = false; ok.focus(); }
        form.reset();
        if (btn) { btn.disabled = false; btn.dataset.busy = ""; }
      }, 700);
    });
  }

  /* ---------------- init ---------------- */
  handleLoader();
  onReady(() => {
    handleNav();
    handleHours();
    handleOpenBadge();
    handleCtaHours();
    handleScrollUI();
    handleCarousel();
    handleGSAP();
    handleMagnetic();
    handleLightbox();
    handleForm();
  });
  handlePrefetch();
})();
