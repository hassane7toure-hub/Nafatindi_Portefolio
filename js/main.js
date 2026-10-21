(() => {
  "use strict";

  const TODO = "[À COMPLÉTER]";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Cofondateurs : remplacer les valeurs null par les informations validées.
     photo : chemin relatif, par exemple "assets/equipe/prenom-nom.jpg". */
  const TEAM = [
    { name: null, role: null, expertise: null, contribution: null, photo: null },
    { name: null, role: null, expertise: null, contribution: null, photo: null },
    { name: null, role: null, expertise: null, contribution: null, photo: null },
    { name: null, role: null, expertise: null, contribution: null, photo: null },
  ];

  /* ---------------------------------------------------------------- réseau animé */

  function initNetwork(canvas) {
    const ctx = canvas.getContext("2d");
    const COLORS = { blue: "10,123,255", green: "46,174,86", amber: "245,163,0", steel: "150,168,196" };
    const LINK = 150;
    let w = 0, h = 0, dpr = 1, nodes = [], raf = 0, running = true;

    function pickColor() {
      const r = Math.random();
      if (r < 0.3) return ["blue", 2.6 + Math.random() * 1.6];
      if (r < 0.38) return ["green", 1.6 + Math.random()];
      if (r < 0.46) return ["amber", 1.6 + Math.random()];
      return ["steel", 1.2 + Math.random() * 0.9];
    }

    // Le centre reste calme : les nœuds proches du titre sont presque invisibles.
    function edgeWeight(x, y) {
      const dx = (x - w / 2) / (w * 0.36);
      const dy = (y - h / 2) / (h * 0.34);
      const d = Math.sqrt(dx * dx + dy * dy);
      return Math.min(1, Math.max(0.06, (d - 0.55) * 1.6));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(110, Math.max(40, (w * h) / 16000)));
      nodes = Array.from({ length: count }, () => {
        const [color, r] = pickColor();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          r, color,
        };
      });
      if (reduceMotion) draw();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        const wa = edgeWeight(a.x, a.y);
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > LINK) continue;
          const alpha = (1 - dist / LINK) * 0.32 * Math.min(wa, edgeWeight(b.x, b.y));
          ctx.strokeStyle = `rgba(120,145,185,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      for (const n of nodes) {
        const alpha = 0.9 * edgeWeight(n.x, n.y);
        if (n.color === "blue") {
          ctx.fillStyle = `rgba(${COLORS.blue},${alpha * 0.18})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 3.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(${COLORS[n.color]},${alpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function step() {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = w + 20; else if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20; else if (n.y > h + 20) n.y = -20;
      }
      draw();
      raf = requestAnimationFrame(step);
    }

    resize();
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });

    if (reduceMotion) return;

    // Pas d'animation quand la couverture n'est plus visible.
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) { running = true; raf = requestAnimationFrame(step); }
      else if (!entry.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
    }).observe(canvas);
    raf = requestAnimationFrame(step);
  }

  /* ---------------------------------------------------------------- en-tête et navigation */

  function initHeader() {
    const header = document.getElementById("header");
    const burger = document.getElementById("burger");
    const nav = document.getElementById("nav");

    const onScroll = () => header.classList.toggle("is-solid", window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    };
    burger.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });

    const links = [...nav.querySelectorAll("a[href^='#']")];
    const targets = links
      .map((a) => document.querySelector(a.getAttribute("href")))
      .filter(Boolean);
    const spy = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = `#${entry.target.id}`;
        links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === id));
      }
    }, { rootMargin: "-45% 0px -50% 0px" });
    targets.forEach((t) => spy.observe(t));
  }

  /* ---------------------------------------------------------------- apparitions et compteurs */

  function countUp(el) {
    const target = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = target; return; }
    const start = performance.now();
    const duration = 1200;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function initReveal() {
    const items = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute("data-reveal"));
        el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 6) * 70}ms`;
        el.classList.add("is-visible");
        el.querySelectorAll("[data-count]").forEach(countUp);
        io.unobserve(el);
      }
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    items.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------------- onglets accessibles */

  function initTabs() {
    const list = document.querySelector("[role='tablist']");
    if (!list) return;
    const tabs = [...list.querySelectorAll("[role='tab']")];

    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
    };

    list.addEventListener("click", (e) => {
      const tab = e.target.closest("[role='tab']");
      if (tab) select(tab, false);
    });
    list.addEventListener("keydown", (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const moves = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      if (!(e.key in moves)) return;
      e.preventDefault();
      select(tabs[(moves[e.key] + tabs.length) % tabs.length], true);
    });
  }

  /* ---------------------------------------------------------------- équipe */

  function initTeam() {
    const root = document.getElementById("team");
    if (!root) return;
    const value = (v) => (v ? { text: v, todo: false } : { text: TODO, todo: true });
    const field = (label, v) => {
      const { text, todo } = value(v);
      return `<dt>${label}</dt><dd class="${todo ? "is-todo" : ""}">${escapeHtml(text)}</dd>`;
    };
    root.innerHTML = TEAM.map((m) => {
      const name = m.name ? escapeHtml(m.name) : `Nom <span class="is-todo">${TODO}</span>`;
      const photo = m.photo
        ? `<img src="${escapeHtml(m.photo)}" alt="${escapeHtml(m.name || "Cofondateur")}" loading="lazy">`
        : "PHOTO";
      return `
        <article class="member" data-reveal>
          <div class="member__photo">${photo}</div>
          <p class="member__role">Cofondateur / Associé</p>
          <h3>${name}</h3>
          <dl>
            ${field("Fonction", m.role)}
            ${field("Expertise", m.expertise)}
            ${field("Contribution", m.contribution)}
          </dl>
        </article>`;
    }).join("");
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------------------------------------------------------------- démarrage */

  document.addEventListener("DOMContentLoaded", () => {
    initTeam();
    const canvas = document.getElementById("network");
    if (canvas) initNetwork(canvas);
    initHeader();
    initReveal();
    initTabs();
    document.getElementById("year").textContent = new Date().getFullYear();
  });
})();
