// ══════════════════════════════════════════════════════════════
// script.js — Anna Galper | Multi-page logic
// Content is loaded asynchronously from Google Sheets via data.js.
// ══════════════════════════════════════════════════════════════


// ── Content type → display config ──────────────────────────────
const TYPE_CONFIG = {
  "משחק דיגיטלי": { cls: "games", cta: "שחק עכשיו ▶", emoji: "🧩" },
  "מערך פעילות":  { cls: "plans", cta: "פתח מערך ↗",  emoji: "📋" },
  "יחידת תוכן":   { cls: "units", cta: "פתח יחידה ↗", emoji: "📚" },
};

// ── Topic → icon map ────────────────────────────────────────────
// Add new topics here as needed; unknown topics get no icon.
const TOPIC_ICONS = {
  "חגים":        "🕎",
  "פורים":       "🎭",
  "פסח":         "🍷",
  "חנוכה":       "🕎",
  "ראש השנה":   "🍎",
  "סוכות":      "🌿",
  "שבועות":     "🌸",
  "עונות השנה": "🍂",
  "צבעים":      "🌈",
  "מספרים":     "🔢",
  "אותיות":     "🔤",
  "רגשות":      "😊",
  "חיות":       "🐾",
  "צורות":      "🔷",
};

// ── All loaded items (populated async from Google Sheets) ───────
let allResources = [];

// ── Current page's content type (null on home / about) ─────────
const PAGE_TYPE = document.body.dataset.pageType || null;

// ── Active filter state ─────────────────────────────────────────
let activeTopic  = "all";
let activeGroup  = "all";
let searchQuery  = "";


// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function highlightMatch(text, query) {
  if (!query) return escapeHtml(text);
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return escapeHtml(text).replace(
    new RegExp("(" + escapeHtml(safe) + ")", "gi"),
    '<mark class="search-mark">$1</mark>'
  );
}


// ══════════════════════════════════════════
// LOADING STATE
// ══════════════════════════════════════════

function showLoadingState() {
  const grid = document.getElementById("cardsGrid");
  if (!grid) return;
  grid.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner" aria-hidden="true"></div>
      <p>טוענים תכנים...</p>
    </div>`;
}


// ══════════════════════════════════════════
// CREATE CARD
// ══════════════════════════════════════════

function createCard(item) {
  const cfg = TYPE_CONFIG[item.type] || { cls: "games", cta: "פתח ↗", emoji: "📄" };

  const article = document.createElement("article");
  article.className = "rcard";
  article.setAttribute("data-type", item.type);
  article.setAttribute("tabindex", "0");

  // Thumbnail
  const thumb = document.createElement("div");
  thumb.className = "rcard-thumb";
  if (item.image) {
    const img = document.createElement("img");
    img.src     = item.image;
    img.alt     = item.title;
    img.loading = "lazy";
    thumb.appendChild(img);
  } else {
    const emo = document.createElement("span");
    emo.className   = "rcard-emoji";
    // Use item emoji → type default → generic fallback
    emo.textContent = item.emoji || cfg.emoji || "📄";
    thumb.appendChild(emo);
  }
  article.appendChild(thumb);

  // Body
  const body = document.createElement("div");
  body.className = "rcard-body";

  // Tags row
  const tags = document.createElement("div");
  tags.className = "rcard-tags";

  const typeTag = document.createElement("span");
  typeTag.className   = `rtag rtag-${cfg.cls}`;
  typeTag.textContent = item.type;
  tags.appendChild(typeTag);

  if (item.topic) {
    const tTag = document.createElement("span");
    tTag.className   = "rtag rtag-topic";
    tTag.textContent = item.topic;
    tags.appendChild(tTag);
  }
  body.appendChild(tags);

  // Title
  const h3 = document.createElement("h3");
  h3.innerHTML = highlightMatch(item.title, searchQuery);
  body.appendChild(h3);

  // Description (optional column in the sheet)
  if (item.description) {
    const desc = document.createElement("p");
    desc.innerHTML = highlightMatch(item.description, searchQuery);
    body.appendChild(desc);
  }

  // CTA button
  if (item.embed) {
    // Open in-page modal
    const btn = document.createElement("button");
    btn.type        = "button";
    btn.className   = `rcard-btn rcard-btn-${cfg.cls}`;
    btn.textContent = cfg.cta;
    btn.addEventListener("click", (e) => { e.stopPropagation(); openEmbedModal(item); });
    body.appendChild(btn);

    article.addEventListener("click",   () => openEmbedModal(item));
    article.addEventListener("keydown", (e) => { if (e.key === "Enter") openEmbedModal(item); });

  } else if (item.link) {
    // Open in new tab
    const btn = document.createElement("a");
    btn.href        = item.link;
    btn.target      = "_blank";
    btn.rel         = "noopener noreferrer";
    btn.className   = `rcard-btn rcard-btn-${cfg.cls}`;
    btn.textContent = cfg.cta;
    body.appendChild(btn);

    article.addEventListener("click", (e) => {
      if (!e.target.closest("a")) window.open(item.link, "_blank");
    });
    article.addEventListener("keydown", (e) => {
      if (e.key === "Enter") window.open(item.link, "_blank");
    });
  }

  article.appendChild(body);
  return article;
}


// ══════════════════════════════════════════
// RENDER CARDS  (with sort + grouped support)
// ══════════════════════════════════════════

function renderCards() {
  const grid = document.getElementById("cardsGrid");
  if (!grid) return;

  // ── Filter ────────────────────────────────────────────────────
  const filtered = allResources.filter(item => {
    if (PAGE_TYPE && item.type !== PAGE_TYPE) return false;
    if (activeTopic !== "all" && item.topic !== activeTopic) return false;
    if (activeGroup !== "all" && (item.group || "") !== activeGroup) return false;
    if (searchQuery) {
      const q       = searchQuery.toLowerCase();
      const inTitle = item.title.toLowerCase().includes(q);
      const inDesc  = (item.description || "").toLowerCase().includes(q);
      if (!inTitle && !inDesc) return false;
    }
    return true;
  });

  // ── Sort by `order` column (ascending) ───────────────────────
  filtered.sort((a, b) => a.order - b.order);

  // ── Update results count ──────────────────────────────────────
  const countEl = document.getElementById("resultsCount");
  if (countEl) {
    countEl.textContent = filtered.length
      ? `נמצאו ${filtered.length} תכנים`
      : "";
  }

  // ── Build DOM ─────────────────────────────────────────────────
  const frag = document.createDocumentFragment();

  if (!filtered.length) {
    // ── Empty state ──
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `<span class="es-icon">🔍</span><p>לא נמצאו תכנים. נסו לשנות את הסינון.</p>`;
    frag.appendChild(empty);

  } else if (activeTopic !== "all" && filtered.some(item => item.group)) {
    // ── Grouped layout ──────────────────────────────────────────
    // Used when a specific topic is selected AND items have group values
    // (e.g. פורים grouped by יום ראשון, יום שני, etc.)
    // Groups appear in the order they are first encountered after sorting.

    const groupMap = new Map(); // Map preserves insertion order
    filtered.forEach(item => {
      const key = item.group || "כללי";
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key).push(item);
    });

    groupMap.forEach((groupItems, groupName) => {
      const section = document.createElement("div");
      section.className = "cards-group";

      const heading = document.createElement("h3");
      heading.className   = "cards-group-heading";
      heading.textContent = groupName;
      section.appendChild(heading);

      const inner = document.createElement("div");
      inner.className = "cards-group-grid";

      groupItems.forEach((item, idx) => {
        const card = createCard(item);
        card.classList.add("reveal");
        card.style.transitionDelay = Math.min(idx * 55, 440) + "ms";
        inner.appendChild(card);
      });

      section.appendChild(inner);
      frag.appendChild(section);
    });

  } else {
    // ── Flat layout (default) ────────────────────────────────────
    const inner = document.createElement("div");
    inner.className = "cards-group-grid";

    filtered.forEach((item, idx) => {
      const card = createCard(item);
      card.classList.add("reveal");
      card.style.transitionDelay = Math.min(idx * 50, 500) + "ms";
      inner.appendChild(card);
    });

    frag.appendChild(inner);
  }

  grid.innerHTML = "";
  grid.appendChild(frag);
  observeNewCards();
  applyTiltToCards();
}

function observeNewCards() {
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".rcard.reveal").forEach(el => el.classList.add("visible"));
    return;
  }
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); }
    }),
    { threshold: 0.06 }
  );
  document.querySelectorAll(".rcard.reveal:not(.visible)").forEach(el => obs.observe(el));
}


// ══════════════════════════════════════════
// TOPIC PILLS  (generated dynamically from sheet data)
// ══════════════════════════════════════════

function initTopicPillsFromData() {
  const wrap = document.getElementById("topicFilters");
  if (!wrap) return;

  // Collect unique topics for this page's content type,
  // in the order they first appear (respects sheet ordering).
  const seen   = new Set();
  const topics = [];
  allResources.forEach(item => {
    if (PAGE_TYPE && item.type !== PAGE_TYPE) return;
    if (item.topic && !seen.has(item.topic)) {
      seen.add(item.topic);
      topics.push(item.topic);
    }
  });

  if (!topics.length) return;

  // Keep the "הכל" button; replace everything else
  const allBtn = wrap.querySelector("[data-topic='all']");
  wrap.innerHTML = "";
  if (allBtn) {
    allBtn.classList.add("active");
    allBtn.setAttribute("aria-pressed", "true");
    wrap.appendChild(allBtn);
  }

  topics.forEach(topic => {
    const btn = document.createElement("button");
    btn.className       = "tpill";
    btn.dataset.topic   = topic;
    btn.setAttribute("aria-pressed", "false");
    const icon = TOPIC_ICONS[topic] ? TOPIC_ICONS[topic] + " " : "";
    btn.textContent = icon + topic;
    wrap.appendChild(btn);
  });
}


// ══════════════════════════════════════════
// SEARCH
// ══════════════════════════════════════════

function initSearch() {
  const input = document.getElementById("searchInput");
  const clear = document.getElementById("searchClear");
  if (!input) return;

  input.addEventListener("input", () => {
    searchQuery = input.value.trim();
    if (clear) clear.style.display = searchQuery ? "flex" : "none";
    renderCards();
  });

  if (clear) {
    clear.addEventListener("click", () => {
      input.value = "";
      searchQuery = "";
      clear.style.display = "none";
      renderCards();
      input.focus();
    });
  }
}


// ══════════════════════════════════════════
// TOPIC FILTER  (class="tpill", data-topic)
// ══════════════════════════════════════════

function initTopicFilters() {
  const wrap = document.getElementById("topicFilters");
  if (!wrap) return;

  wrap.addEventListener("click", e => {
    const btn = e.target.closest("[data-topic]");
    if (!btn) return;
    activeTopic = btn.dataset.topic;
    activeGroup = "all";
    wrap.querySelectorAll("[data-topic]").forEach(b => {
      const isActive = b === btn;
      b.classList.toggle("active", isActive);
      b.setAttribute("aria-pressed", String(isActive));
    });
    updateGroupFilters();
    renderCards();
  });
}


// ══════════════════════════════════════════
// GROUP SUB-FILTER  (shown after topic selection)
// ══════════════════════════════════════════

function updateGroupFilters() {
  const wrap = document.getElementById("groupFilters");
  if (!wrap) return;

  // Collect unique non-empty groups for the active topic + page type
  const seen   = new Set();
  const groups = [];
  allResources.forEach(item => {
    if (PAGE_TYPE && item.type !== PAGE_TYPE) return;
    if (activeTopic !== "all" && item.topic !== activeTopic) return;
    if (item.group && !seen.has(item.group)) {
      seen.add(item.group);
      groups.push(item.group);
    }
  });

  // Hide if no groups or no topic selected
  if (!groups.length || activeTopic === "all") {
    wrap.hidden = true;
    wrap.innerHTML = "";
    return;
  }

  // Build group pills
  wrap.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className = "gpill active";
  allBtn.dataset.group = "all";
  allBtn.setAttribute("aria-pressed", "true");
  allBtn.textContent = "הכל";
  wrap.appendChild(allBtn);

  groups.forEach(group => {
    const btn = document.createElement("button");
    btn.className = "gpill";
    btn.dataset.group = group;
    btn.setAttribute("aria-pressed", "false");
    btn.textContent = group;
    wrap.appendChild(btn);
  });

  wrap.hidden = false;

  // Click handler
  wrap.onclick = e => {
    const btn = e.target.closest("[data-group]");
    if (!btn) return;
    activeGroup = btn.dataset.group;
    wrap.querySelectorAll("[data-group]").forEach(b => {
      const isActive = b === btn;
      b.classList.toggle("active", isActive);
      b.setAttribute("aria-pressed", String(isActive));
    });
    renderCards();
  };
}


// ══════════════════════════════════════════
// CLEAR ALL FILTERS  (called from HTML onclick)
// ══════════════════════════════════════════

function clearFilters() {
  activeTopic = "all";
  activeGroup = "all";
  searchQuery = "";

  const si = document.getElementById("searchInput");
  if (si) si.value = "";
  const sc = document.getElementById("searchClear");
  if (sc) sc.style.display = "none";

  document.querySelectorAll("[data-topic]").forEach(b => {
    const isAll = b.dataset.topic === "all";
    b.classList.toggle("active", isAll);
    b.setAttribute("aria-pressed", String(isAll));
  });
  const gw = document.getElementById("groupFilters");
  if (gw) { gw.hidden = true; gw.innerHTML = ""; }

  renderCards();
}


// ══════════════════════════════════════════
// MOBILE MENU
// ══════════════════════════════════════════

function initMobileMenu() {
  const burger = document.getElementById("burgerBtn");
  const menu   = document.getElementById("mobileMenu");
  if (!burger || !menu) return;

  burger.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = burger.classList.toggle("open");
    menu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-hidden", String(!open));
  });

  document.addEventListener("click", e => {
    if (!burger.contains(e.target) && !menu.contains(e.target)) {
      burger.classList.remove("open");
      menu.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-hidden", "true");
    }
  });

  menu.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      burger.classList.remove("open");
      menu.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-hidden", "true");
    });
  });
}


// ══════════════════════════════════════════
// SCROLL REVEAL
// ══════════════════════════════════════════

function initScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach(el => el.classList.add("visible"));
    return;
  }

  const obs = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        obs.unobserve(e.target);
      }
    }),
    { threshold: 0.08 }
  );
  items.forEach(el => obs.observe(el));
}


// ══════════════════════════════════════════
// HEADER SCROLL SHADOW
// ══════════════════════════════════════════

function initHeaderScroll() {
  const hdr = document.getElementById("siteHeader");
  if (!hdr) return;
  const update = () => hdr.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", update, { passive: true });
  update();
}


// ══════════════════════════════════════════
// PARALLAX  (homepage hero blobs)
// ══════════════════════════════════════════

function initParallax() {
  const heroDeco = document.querySelector(".hero-deco");
  if (!heroDeco) return;
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        heroDeco.style.transform = `translateY(${Math.max(0, window.scrollY) * 0.22}px)`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}


// ══════════════════════════════════════════
// CONTACT FORM  (about.html)
// ══════════════════════════════════════════

// ══════════════════════════════════════════
// EMBED MODAL
// ══════════════════════════════════════════

function openEmbedModal(item) {
  const modal = document.getElementById("embedModal");
  if (!modal) return;
  document.getElementById("embedModalTitle").textContent = item.title;
  document.getElementById("embedModalIframe").src = item.embed;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("embedModalClose").focus();
}

function closeEmbedModal() {
  const modal = document.getElementById("embedModal");
  if (!modal || modal.hidden) return;
  document.getElementById("embedModalIframe").src = "";
  modal.hidden = true;
  document.body.style.overflow = "";
}

function initEmbedModal() {
  const modal    = document.getElementById("embedModal");
  if (!modal) return;
  document.getElementById("embedModalClose")   .addEventListener("click", closeEmbedModal);
  document.getElementById("embedModalBackdrop").addEventListener("click", closeEmbedModal);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeEmbedModal(); });
}


// ══════════════════════════════════════════
// CONTACT FORM  (about.html)
// ══════════════════════════════════════════

const CONTACT_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzI3C2wQocDe8U80Z0vZ5dglq4orJ0YckiWHaxjIcLuwAh1SvT1Od1lFxJ7dypOckoD/exec";

function handleSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("submitBtn");
  if (!btn) return;

  const name    = document.getElementById("contactName")?.value.trim();
  const email   = document.getElementById("contactEmail")?.value.trim();
  const subject = document.getElementById("contactSubject")?.value.trim();
  const msg     = document.getElementById("contactMessage")?.value.trim();

  if (!name || !email || !msg) {
    btn.textContent = "אנא מלאו את כל השדות הנדרשים";
    btn.style.background = "#c0392b";
    setTimeout(() => {
      btn.textContent = "שלחו הודעה ✉";
      btn.style.background = "";
    }, 2800);
    return;
  }

  const formData = new URLSearchParams();
  formData.append("name",    name);
  formData.append("email",   email);
  formData.append("subject", subject);
  formData.append("message", msg);

  fetch(CONTACT_SCRIPT_URL, { method: "POST", mode: "no-cors", body: formData });

  btn.textContent = "✓ ההודעה נשלחה! תודה";
  btn.style.background = "#3D8B60";
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = "שלחו הודעה ✉";
    btn.style.background = "";
    btn.disabled = false;
    e.target.reset();
  }, 3500);
}


// ══════════════════════════════════════════
// HOMEPAGE: item counts on portal cards
// ══════════════════════════════════════════

function initHomeCounts() {
  document.querySelectorAll("[data-count-type]").forEach(el => {
    const type  = el.dataset.countType;
    const count = allResources.filter(item => item.type === type).length;
    el.textContent = count ? `${count} תכנים` : "";
  });
}


// ══════════════════════════════════════════
// SCROLL PROGRESS BAR
// ══════════════════════════════════════════

function initScrollProgress() {
  const bar = document.createElement("div");
  bar.id = "scrollProgress";
  document.body.prepend(bar);
  window.addEventListener("scroll", () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (total > 0 ? (window.scrollY / total) * 100 : 0) + "%";
  }, { passive: true });
}


// ══════════════════════════════════════════
// SCROLL TO TOP BUTTON
// ══════════════════════════════════════════

function initScrollTop() {
  const btn = document.createElement("button");
  btn.id = "scrollTop";
  btn.setAttribute("aria-label", "חזרה לראש הדף");
  btn.textContent = "↑";
  document.body.appendChild(btn);
  window.addEventListener("scroll", () => {
    btn.classList.toggle("visible", window.scrollY > 440);
  }, { passive: true });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}


// ══════════════════════════════════════════
// CURSOR SPARKLE TRAIL
// ══════════════════════════════════════════

function initCursorSparkles() {
  if (window.matchMedia("(pointer: coarse)").matches) return;
  const colors = ["#E85D40","#D49020","#7B5FC4","#3D8B60","#35B5A2","#F07850","#A892E0"];
  const shapes = ["✦","✧","★","◆","•","✿","❋","✺"];
  let lastTime = 0;

  document.addEventListener("mousemove", (e) => {
    const now = Date.now();
    if (now - lastTime < 48) return;
    lastTime = now;
    if (Math.random() > 0.55) return;

    const s = document.createElement("span");
    s.className = "cursor-spark";
    s.textContent = shapes[Math.floor(Math.random() * shapes.length)];
    s.style.left = e.clientX + "px";
    s.style.top  = e.clientY + "px";
    s.style.color = colors[Math.floor(Math.random() * colors.length)];
    s.style.fontSize = (Math.random() * 13 + 7) + "px";
    s.style.setProperty("--dx", (Math.random() - 0.5) * 90 + "px");
    s.style.setProperty("--dy", -(Math.random() * 90 + 28) + "px");
    document.body.appendChild(s);
    s.addEventListener("animationend", () => s.remove(), { once: true });
  });
}


// ══════════════════════════════════════════
// 3D CARD TILT
// ══════════════════════════════════════════

function applyTilt(el, intensity) {
  el.addEventListener("mousemove", (e) => {
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width  - 0.5) * intensity;
    const y = ((e.clientY - r.top)  / r.height - 0.5) * -intensity;
    el.style.transform = `perspective(700px) rotateX(${y}deg) rotateY(${x}deg) translateY(-10px) scale(1.025)`;
  });
  el.addEventListener("mouseleave", () => { el.style.transform = ""; });
}

function initCardTilt() {
  if (window.matchMedia("(pointer: coarse)").matches) return;
  document.querySelectorAll(".portal-card").forEach(c => applyTilt(c, 12));
}

function applyTiltToCards() {
  if (window.matchMedia("(pointer: coarse)").matches) return;
  document.querySelectorAll(".rcard:not([data-tilt])").forEach(c => {
    c.setAttribute("data-tilt", "1");
    applyTilt(c, 7);
  });
}




// ══════════════════════════════════════════
// INIT
// ══════════════════════════════════════════

document.addEventListener("DOMContentLoaded", async () => {
  initScrollProgress();
  initScrollTop();
  initCursorSparkles();
  initMobileMenu();
  initScrollReveal();
  initHeaderScroll();

  // ── Content pages (games, activities, units, presentations) ──
  if (document.getElementById("cardsGrid")) {
    showLoadingState();                      // show spinner right away
    allResources = await loadContentData();  // fetch from Google Sheets
    initTopicPillsFromData();               // build topic pills from loaded data
    renderCards();                           // render cards (sorted, possibly grouped)
    initSearch();
    initTopicFilters();
    initEmbedModal();
    initCardTilt();
  }

  // ── Homepage: item counts on portal cards ──
  if (document.body.dataset.page === "home") {
    allResources = await loadContentData();
    initHomeCounts();
    initParallax();
    initCardTilt();
  }
});
