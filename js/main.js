/* KeyCart — interactions. Vanilla, no deps. Respects reduced-motion.
   Wird auf allen Seiten geladen; Effekte ohne passendes Element werden
   übersprungen (Null-Checks), daher unbedenklich pro Seite. */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Datenschutz-Zustimmung (Consent-Gate) ----------
     Erscheint beim Aufruf einer Inhaltsseite, bis zugestimmt wurde.
     Die Rechtsseiten (Impressum / Datenschutz) bleiben immer offen,
     damit die Erklärung vor der Zustimmung gelesen werden kann. */
  (function consentGate() {
    const KEY = "kc-consent";
    const isLegal = /(?:datenschutz|impressum)\.html$/i.test(location.pathname);
    if (isLegal) return;

    let stored = null;
    try { stored = localStorage.getItem(KEY); } catch (e) { /* z.B. privater Modus */ }
    if (stored === "granted") return;

    const root = document.documentElement;
    const overlay = document.createElement("div");
    overlay.className = "consent";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "consent-title");
    overlay.innerHTML =
      '<div class="consent__card">' +
        '<span class="eyebrow"><span class="eyebrow__dot"></span>Datenschutz</span>' +
        '<h2 id="consent-title">Willkommen bei KeyCart</h2>' +
        '<p>Bevor Sie unsere Website nutzen, lesen und akzeptieren Sie bitte unsere Datenschutzerklärung. ' +
        '<a class="consent__link" href="datenschutz.html" target="_blank" rel="noopener">Klicken Sie HIER für unsere Datenschutzerklärung.</a></p>' +
        '<div class="consent__row">' +
          '<button type="button" class="btn btn--solid" data-consent="accept">Zustimmen und fortfahren</button>' +
          '<button type="button" class="btn btn--ghost" data-consent="decline">Nicht zustimmen</button>' +
        '</div>' +
        '<p class="consent__note">Diese Website setzt keine Cookies und nutzt kein Tracking.</p>' +
      '</div>';

    const grant = () => {
      try { localStorage.setItem(KEY, "granted"); } catch (e) { /* ignore */ }
      overlay.remove();
      root.classList.remove("consent-lock");
    };
    const decline = () => {
      overlay.querySelector(".consent__card").innerHTML =
        '<span class="eyebrow"><span class="eyebrow__dot"></span>Datenschutz</span>' +
        '<h2 id="consent-title">Zugriff nicht möglich</h2>' +
        '<p>Ohne Ihre Zustimmung zur Datenschutzerklärung können Sie diese Website leider nicht nutzen.</p>' +
        '<div class="consent__row">' +
          '<button type="button" class="btn btn--solid" data-consent="accept">Doch zustimmen</button>' +
          '<button type="button" class="btn btn--ghost" data-consent="leave">Website verlassen</button>' +
        '</div>';
      const focusBtn = overlay.querySelector('[data-consent="accept"]');
      if (focusBtn) focusBtn.focus();
    };

    overlay.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-consent]");
      if (!btn) return;
      const action = btn.dataset.consent;
      if (action === "accept") grant();
      else if (action === "decline") decline();
      else if (action === "leave") { window.location.href = "about:blank"; }
    });
    // ESC darf das Gate nicht schließen
    overlay.addEventListener("keydown", (e) => { if (e.key === "Escape") e.preventDefault(); });

    document.body.appendChild(overlay);
    root.classList.add("consent-lock");
    const first = overlay.querySelector('[data-consent="accept"]');
    if (first) first.focus();
  })();

  /* ---------- nav shrink on scroll ---------- */
  const nav = document.getElementById("nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- scroll reveal ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- subtle parallax on hero art (nur Startseite) ---------- */
  if (!reduce && window.matchMedia("(pointer:fine)").matches) {
    const layers = document.querySelectorAll("[data-parallax]");
    const art = document.querySelector(".hero__art");
    let raf = null, tx = 0, ty = 0;
    const apply = () => {
      layers.forEach((el) => {
        const d = parseFloat(el.dataset.parallax);
        el.style.transform = `translate(${tx * d * 40}px, ${ty * d * 40}px)`;
      });
      raf = null;
    };
    if (art) {
      art.addEventListener("mousemove", (e) => {
        const r = art.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width - 0.5;
        ty = (e.clientY - r.top) / r.height - 0.5;
        if (!raf) raf = requestAnimationFrame(apply);
      });
      art.addEventListener("mouseleave", () => {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(apply);
      });
    }
  }
})();
