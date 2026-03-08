// ══════════════════════════════════════════════════════════════
// script.js — Anna Galper | Multi-page logic
// Data lives in data.js (CONTENT_DATA global object).
// ══════════════════════════════════════════════════════════════

const TYPE_CONFIG = {
  "משחק דיגיטלי": { cls: "games", cta: "שחק עכשיו ▶" },
  "מערך פעילות":  { cls: "plans", cta: "פתח מערך ↗"  },
  "יחידת תוכן":   { cls: "units", cta: "פתח יחידה ↗" },
  "מצגת הדרכה":  { cls: "pres",  cta: "פתח מצגת ↗"  }
};

// ── Build flat resources array from data.js ──
let allResources = [];
if (typeof CONTENT_DATA !== "undefined") {
  Object.entries(CONTENT_DATA).forEach(([type, items]) => {
    if (Array.isArray(items)) {
      items.forEach(item => allResources.push({ ...item, type }));
    }
  });
}

// ── Current page type (null on home / about) ──
const PAGE_TYPE = document.body.dataset.pageType || null;

// ── Filter state ──
let activeTopic = "all";
let activeAge   = "all";
let searchQuery = "";

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
// CREATE CARD
// ══════════════════════════════════════════
function createCard(item) {
  const cfg = TYPE_CONFIG[item.type] || { cls: "games", cta: "פתח ↗" };

  const article = document.createElement("article");
  article.className = "rcard";
  article.setAttribute("data-type", item.type);
  article.setAttribute("tabindex", "0");

  // Thumbnail
  const thumb = document.createElement("div");
  thumb.className = "rcard-thumb";
  if (item.image) {
    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.title;
    img.loading = "lazy";
    thumb.appendChild(img);
  } else {
    const emo = document.createElement("span");
    emo.className = "rcard-emoji";
    emo.textContent = item.emoji || "📄";
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
  typeTag.className = `rtag rtag-${cfg.cls}`;
  typeTag.textContent = item.type;
  tags.appendChild(typeTag);

  if (item.topic) {
    const tTag = document.createElement("span");
    tTag.className = "rtag rtag-topic";
    tTag.textContent = item.topic;
    tags.appendChild(tTag);
  }
  if (item.age && item.age.length) {
    const aTag = document.createElement("span");
    aTag.className = "rtag rtag-age";
    aTag.textContent = "גיל " + item.age.join(", ");
    tags.appendChild(aTag);
  }
  body.appendChild(tags);

  // Title
  const h3 = document.createElement("h3");
  h3.innerHTML = highlightMatch(item.title, searchQuery);
  body.appendChild(h3);

  // Description
  const desc = document.createElement("p");
  desc.innerHTML = highlightMatch(item.description || "", searchQuery);
  body.appendChild(desc);

  // CTA button
  if (item.link) {
    const btn = document.createElement("a");
    btn.href = item.link;
    btn.target = "_blank";
    btn.rel = "noopener noreferrer";
    btn.className = `rcard-btn rcard-btn-${cfg.cls}`;
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
// RENDER CARDS
// ══════════════════════════════════════════
function renderCards() {
  const grid = document.getElementById("cardsGrid");
  if (!grid) return;

  const filtered = allResources.filter(item => {
    // Filter by page type
    if (PAGE_TYPE && item.type !== PAGE_TYPE) return false;
    // Filter by topic
    if (activeTopic !== "all" && item.topic !== activeTopic) return false;
    // Filter by age
    if (activeAge !== "all" && !(item.age || []).includes(activeAge)) return false;
    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const inTitle = item.title.toLowerCase().includes(q);
      const inDesc  = (item.description || "").toLowerCase().includes(q);
      if (!inTitle && !inDesc) return false;
    }
    return true;
  });

  // Update results count
  const count = document.getElementById("resultsCount");
  if (count) {
    count.textContent = filtered.length
      ? `נמצאו ${filtered.length} תכנים`
      : "";
  }

  // Build DOM
  const frag = document.createDocumentFragment();
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `<span class="es-icon">🔍</span><p>לא נמצאו תכנים. נסו לשנות את הסינון.</p>`;
    frag.appendChild(empty);
  } else {
    filtered.forEach(item => frag.appendChild(createCard(item)));
  }

  grid.innerHTML = "";
  grid.appendChild(frag);
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
    wrap.querySelectorAll("[data-topic]").forEach(b => {
      const isActive = b === btn;
      b.classList.toggle("active", isActive);
      b.setAttribute("aria-pressed", String(isActive));
    });
    renderCards();
  });
}

// ══════════════════════════════════════════
// AGE FILTER  (class="pill", data-age)
// ══════════════════════════════════════════
function initAgeFilters() {
  const wrap = document.getElementById("ageFilters");
  if (!wrap) return;

  wrap.addEventListener("click", e => {
    const btn = e.target.closest("[data-age]");
    if (!btn) return;
    activeAge = btn.dataset.age;
    wrap.querySelectorAll("[data-age]").forEach(b => {
      const isActive = b === btn;
      b.classList.toggle("active", isActive);
      b.setAttribute("aria-pressed", String(isActive));
    });
    renderCards();
  });
}

// ══════════════════════════════════════════
// CLEAR ALL FILTERS
// ══════════════════════════════════════════
function clearFilters() {
  activeTopic = "all";
  activeAge   = "all";
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
  document.querySelectorAll("[data-age]").forEach(b => {
    const isAll = b.dataset.age === "all";
    b.classList.toggle("active", isAll);
    b.setAttribute("aria-pressed", String(isAll));
  });

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
// CONTACT FORM
// ══════════════════════════════════════════
function handleSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("submitBtn");
  if (!btn) return;

  const name  = document.getElementById("contactName")?.value.trim();
  const email = document.getElementById("contactEmail")?.value.trim();
  const msg   = document.getElementById("contactMessage")?.value.trim();

  if (!name || !email || !msg) {
    btn.textContent = "אנא מלאו את כל השדות הנדרשים";
    btn.style.background = "#c0392b";
    setTimeout(() => {
      btn.textContent = "שלחו הודעה ✉";
      btn.style.background = "";
    }, 2800);
    return;
  }

  btn.textContent = "✓ ההודעה נשלחה! תודה";
  btn.style.background = "#457A5A";
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
  if (typeof CONTENT_DATA === "undefined") return;
  document.querySelectorAll("[data-count-type]").forEach(el => {
    const type  = el.dataset.countType;
    const count = Array.isArray(CONTENT_DATA[type]) ? CONTENT_DATA[type].length : 0;
    el.textContent = count + " תכנים";
  });
}

// ══════════════════════════════════════════
// INIT
// ══════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initScrollReveal();
  initHeaderScroll();

  // Content pages only
  if (document.getElementById("cardsGrid")) {
    renderCards();
    initSearch();
    initTopicFilters();
    initAgeFilters();
  }

  // Homepage only
  if (document.body.dataset.page === "home") {
    initHomeCounts();
  }
});
