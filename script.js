// ══════════════════════════════════════════════════════════════
// script.js — Anna Galper | Multi-page logic
// Content is loaded asynchronously from Google Sheets via data.js.
// ══════════════════════════════════════════════════════════════


// ── Likes backend URL (paste after deploying likes-script.gs) ──
const LIKES_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3RtQxeoZl4-NjfNdEzgfdcXdv8LAbnGPoAze7W9fahwPQpxuNN5wM-ipruMIzWa24/exec";

// ── Content type → display config ──────────────────────────────
const TYPE_CONFIG = {
  "משחק דיגיטלי": { cls: "games", cta: "▶ שחקו עכשיו", emoji: "🧩" },
  "מערך פעילות":  { cls: "plans", cta: "פתח מערך ↗",  emoji: "📋" },
  "יחידת תוכן":   { cls: "units", cta: "פתח יחידה ↗", emoji: "📚" },
};

// ── Topic display order (holidays follow the Jewish calendar year) ──
// Topics listed here appear first, in this order.
// Topics NOT listed here are sorted alphabetically afterwards.
const TOPIC_ORDER = [
  "ראש השנה",
  "סוכות",
  "שבת",
  "חנוכה",
  "טו בשבט",
  "פורים",
  "פסח",
  "ל\"ג בעומר",
  "שבועות",
  "יום העצמאות",
];

// ── Topic → icon map ────────────────────────────────────────────
// Add new topics here as needed; unknown topics get no icon.
const TOPIC_ICONS = {
  // חגים ומועדים — לפי סדר השנה היהודית
  "ראש השנה":      "🍎",
  "סוכות":         "🌿",
  "שבת":           "🕯️",
  "חנוכה":          "🕎",
  "טו בשבט":       "🌳",
  "פורים":          "🎭",
  "פסח":            "🍷",
  "ל\"ג בעומר":    "🔥",
  "שבועות":        "🌸",
  "יום העצמאות":   "🇮🇱",
  "חגים":           "🎉",
  "בריאת העולם":    "🌍",
  "חלל":            "👽",
  // טבע וסביבה
  "עונות השנה":    "🍂",
  "בעלי חיים":     "🐾",
  "חיות בר":       "🦁",
  "חיות משק":      "🐄",
  "ירקות ופירות":  "🥕",
  "גינה":           "🌱",
  "מזג אוויר":     "⛅",
  "מים":           "💧",
  // שפה ואוריינות
  "שפה ואוריינות":        "🔤",
  "קריאה":         "📖",
  "כתיבה":         "✏️",
  "שפה":           "💬",
  "חיים נחמן ביאליק":   "📖",
  // מתמטיקה
  "חשבון":        "🔢",
  "צורות":         "🔷",
  "מדידה":         "📏",
  "כמויות":        "⚖️",
  // עולם חברתי
  "רגשות":         "😊",
  "משפחה":         "👨‍👩‍👧",
  "גוף האדם":      "🧍",
  "בריאות":        "🩺",
  "מקצועות":       "👷",
  "חברות":         "🤝",
  "יום הולדת":     "🎁",
  "עונות":         "🌤️",
  // צבעים ויצירה
  "צבעים":         "🌈",
  "יצירה":         "🎨",
  "מוזיקה":        "🎵",
  "זהירות בדרכים": "🚸",
  // כללי
  "כללי":          "📌",
};

// ── Topic → custom image URL (overrides emoji when set) ─────────
// Add entries here to replace an emoji with a PNG/SVG/WebP image.
// Example:
//   "פורים": "https://example.com/purim-icon.png",
const TOPIC_IMAGES = {
  //"בעלי חיים":"https://img2.clipart-library.com/28/transparent-animal-clipart/transparent-animal-clipart-30.png"
  // "שם קטגוריה": "https://...",
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
// LIKES
// ══════════════════════════════════════════

let likesCache = {};

function getLikedSet() {
  try { return new Set(JSON.parse(localStorage.getItem("liked_items") || "[]")); }
  catch { return new Set(); }
}
function saveLikedSet(set) {
  localStorage.setItem("liked_items", JSON.stringify([...set]));
}

async function loadLikes() {
  if (!LIKES_SCRIPT_URL || LIKES_SCRIPT_URL.includes("PASTE_")) return;
  try {
    const res = await fetch(LIKES_SCRIPT_URL);
    likesCache = await res.json();
  } catch {}
}

function updateLikeButtons() {
  const liked = getLikedSet();
  document.querySelectorAll(".rcard-like").forEach(btn => {
    const title = btn.dataset.title;
    const count = likesCache[title] || 0;
    const isLiked = liked.has(title);
    btn.querySelector(".like-icon").textContent  = isLiked ? "❤️" : "🤍";
    btn.querySelector(".like-count").textContent = count > 0 ? count : "";
    btn.classList.toggle("liked", isLiked);
    btn.setAttribute("aria-label", isLiked ? "הסר לייק" : "תן לייק");
  });
}

function spawnHearts(btn) {
  const rect  = btn.getBoundingClientRect();
  const cx    = rect.left + rect.width  / 2;
  const cy    = rect.top  + rect.height / 2;
  const count = 10 + Math.floor(Math.random() * 6);

  for (let i = 0; i < count; i++) {
    const h = document.createElement("span");
    h.className   = "heart-particle";
    h.textContent = Math.random() > 0.3 ? "❤️" : "🩷";
    h.style.left  = cx + (Math.random() - 0.5) * 40 + "px";
    h.style.top   = cy + "px";
    h.style.fontSize = (Math.random() * 18 + 10) + "px";
    h.style.setProperty("--dx", (Math.random() - 0.5) * 120 + "px");
    h.style.setProperty("--dy",  (Math.random() * 260 + 120) + "px");
    h.style.animationDelay    = (Math.random() * 280) + "ms";
    h.style.animationDuration = (Math.random() * 600 + 900) + "ms";
    document.body.appendChild(h);
    h.addEventListener("animationend", () => h.remove(), { once: true });
  }
}

async function toggleLike(title, btn) {
  if (!LIKES_SCRIPT_URL || LIKES_SCRIPT_URL.includes("PASTE_")) return;
  const liked  = getLikedSet();
  const action = liked.has(title) ? "unlike" : "like";

  // Optimistic update
  if (action === "like") { liked.add(title);    likesCache[title] = (likesCache[title] || 0) + 1; }
  else                   { liked.delete(title); likesCache[title] = Math.max(0, (likesCache[title] || 0) - 1); }
  saveLikedSet(liked);
  updateLikeButtons();

  if (action === "like") spawnHearts(btn);

  // Sync with server
  try {
    const res  = await fetch(LIKES_SCRIPT_URL, { method: "POST", body: JSON.stringify({ title, action }) });
    const data = await res.json();
    likesCache[title] = data.likes;
    updateLikeButtons();
  } catch {}
}

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

  // Like button — same row as tags, pushed to left
  const likeBtn = document.createElement("button");
  likeBtn.type = "button";
  likeBtn.className = "rcard-like";
  likeBtn.dataset.title = item.title;
  likeBtn.setAttribute("aria-label", "תן לייק");
  likeBtn.innerHTML = `<span class="like-icon">🤍</span><span class="like-count"></span>`;
  likeBtn.style.marginInlineStart = "auto";
  likeBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleLike(item.title, likeBtn); });
  tags.appendChild(likeBtn);

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

  // Buttons row
  const actions = document.createElement("div");
  actions.className = "rcard-actions";

  // CTA button
  if (item.embed) {
    const btn = document.createElement("button");
    btn.type        = "button";
    btn.className   = `rcard-btn rcard-btn-${cfg.cls}`;
    btn.textContent = cfg.cta;
    btn.addEventListener("click", (e) => { e.stopPropagation(); openEmbedModal(item); });
    actions.appendChild(btn);

    article.addEventListener("click",   () => openEmbedModal(item));
    article.addEventListener("keydown", (e) => { if (e.key === "Enter") openEmbedModal(item); });

  } else if (item.link) {
    const btn = document.createElement("a");
    btn.href        = item.link;
    btn.target      = "_blank";
    btn.rel         = "noopener noreferrer";
    btn.className   = `rcard-btn rcard-btn-${cfg.cls}`;
    btn.textContent = cfg.cta;
    actions.appendChild(btn);

    article.addEventListener("click", (e) => {
      if (!e.target.closest("a")) window.open(item.link, "_blank", "noopener,noreferrer");
    });
    article.addEventListener("keydown", (e) => {
      if (e.key === "Enter") window.open(item.link, "_blank", "noopener,noreferrer");
    });
  }

  // Share button
  const shareUrl = item.embed
    ? `${location.origin}${location.pathname}?open=${encodeURIComponent(item.title)}`
    : item.link;
  if (shareUrl) {
    const shareBtn = document.createElement("button");
    shareBtn.type = "button";
    shareBtn.className = `rcard-btn rcard-btn-${cfg.cls} rcard-share`;
    shareBtn.setAttribute("aria-label", "שתף קישור");
    shareBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>שתף`;
    shareBtn.addEventListener("click", (e) => { e.stopPropagation(); shareItem(item.title, shareUrl, shareBtn); });
    actions.appendChild(shareBtn);
  }

  body.appendChild(actions);
  article.appendChild(body);
  return article;
}

function shareItem(title, url, btn) {
  if (navigator.share) {
    navigator.share({ title, url }).catch(() => {});
  } else {
    const origHTML = btn.innerHTML;
    const markCopied = () => {
      btn.textContent = "✓ הועתק!";
      btn.classList.add("rcard-share--copied");
      setTimeout(() => { btn.innerHTML = origHTML; btn.classList.remove("rcard-share--copied"); }, 2200);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(markCopied).catch(() => fallbackCopy(url, markCopied));
    } else {
      fallbackCopy(url, markCopied);
    }
  }
}

function fallbackCopy(url, cb) {
  const ta = document.createElement("textarea");
  ta.value = url;
  ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
  cb();
}


// ══════════════════════════════════════════
// RENDER CARDS  (with sort + grouped support)
// ══════════════════════════════════════════

function renderCards() {
  const grid = document.getElementById("cardsGrid");
  if (!grid) return;

  // ── Filter ────────────────────────────────────────────────────
  // When searching — ignore topic/group filters and search everything
  const filtered = allResources.filter(item => {
    if (PAGE_TYPE && item.type !== PAGE_TYPE) return false;
    if (searchQuery) {
      const q       = searchQuery.toLowerCase();
      const inTitle = item.title.toLowerCase().includes(q);
      const inDesc  = (item.description || "").toLowerCase().includes(q);
      return inTitle || inDesc;
    }
    if (activeTopic !== "all" && item.topic !== activeTopic) return false;
    if (activeGroup !== "all" && (item.group || "") !== activeGroup) return false;
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

  } else if (activeTopic === "all" && !searchQuery) {
    // ── Grouped by topic (default "הכל" view) ───────────────────
    const topicMap = new Map();
    filtered.forEach(item => {
      const key = item.topic || "כללי";
      if (!topicMap.has(key)) topicMap.set(key, []);
      topicMap.get(key).push(item);
    });

    let globalIdx = 0;
    topicMap.forEach((items, topicName) => {
      const section = document.createElement("div");
      section.className = "topic-section";

      const heading = document.createElement("div");
      heading.className = "topic-section-heading";
      const icon = TOPIC_ICONS[topicName] || "";
      heading.innerHTML = `<span class="tsh-icon">${icon}</span><span class="tsh-name">${topicName}</span><span class="tsh-count">${items.length}</span>`;
      section.appendChild(heading);

      const inner = document.createElement("div");
      inner.className = "cards-group-grid";

      items.forEach(item => {
        const card = createCard(item);
        card.classList.add("reveal");
        card.style.transitionDelay = Math.min(globalIdx * 40, 400) + "ms";
        inner.appendChild(card);
        globalIdx++;
      });

      section.appendChild(inner);
      frag.appendChild(section);
    });

  } else if (activeTopic !== "all" && filtered.some(item => item.group)) {
    // ── Grouped by sub-group (specific topic selected, items have groups) ──
    const groupMap = new Map();
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
    // ── Flat layout (search results or single topic without groups) ──
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

  const seen   = new Set();
  const topics = [];
  const counts = {};
  let totalCount = 0;

  allResources.forEach(item => {
    if (PAGE_TYPE && item.type !== PAGE_TYPE) return;
    totalCount++;
    if (item.topic) {
      if (!seen.has(item.topic)) {
        seen.add(item.topic);
        topics.push(item.topic);
        counts[item.topic] = 0;
      }
      counts[item.topic]++;
    }
  });

  topics.sort((a, b) => {
    const ia = TOPIC_ORDER.indexOf(a);
    const ib = TOPIC_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;          // שניהם בחגים — לפי סדר
    if (ia !== -1) return -1;                             // רק a בחגים — קודם
    if (ib !== -1) return 1;                              // רק b בחגים — קודם
    return a.localeCompare(b, "he");                      // שאר הנושאים אלפביתית
  });

  if (!topics.length) return;

  wrap.innerHTML = "";

  // Carousel wrapper (arrows positioned absolute over the track)
  const carouselWrap = document.createElement("div");
  carouselWrap.className = "topic-carousel-wrap";

  const track = document.createElement("div");
  track.className = "topic-tile-grid";

  // "הכל" tile
  const allTile = document.createElement("button");
  allTile.className = "topic-tile active";
  allTile.dataset.topic = "all";
  allTile.setAttribute("aria-pressed", "true");
  allTile.innerHTML = `<span class="tt-icon">✨</span><span class="tt-name">הכל</span><span class="tt-count">${totalCount}</span>`;
  track.appendChild(allTile);

  topics.forEach(topic => {
    const tile = document.createElement("button");
    tile.className = "topic-tile";
    tile.dataset.topic = topic;
    tile.setAttribute("aria-pressed", "false");
    const imgUrl = TOPIC_IMAGES[topic];
    if (imgUrl) {
      tile.classList.add("topic-tile--bg");
      tile.style.backgroundImage =
        `linear-gradient(to bottom, transparent 30%, rgba(0,0,0,.58) 100%), url(${imgUrl})`;
      tile.innerHTML =
        `<span class="tt-name">${topic}</span><span class="tt-count tt-count--light">${counts[topic]}</span>`;
    } else {
      tile.innerHTML =
        `<span class="tt-icon">${TOPIC_ICONS[topic] || "📁"}</span><span class="tt-name">${topic}</span><span class="tt-count">${counts[topic]}</span>`;
    }
    track.appendChild(tile);
  });

  const prevBtn = document.createElement("button");
  prevBtn.className = "tcarousel-arrow tcarousel-prev tcarousel-hidden";
  prevBtn.setAttribute("aria-label", "הבא");
  prevBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const nextBtn = document.createElement("button");
  nextBtn.className = "tcarousel-arrow tcarousel-next tcarousel-hidden";
  nextBtn.setAttribute("aria-label", "הקודם");
  nextBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3l-5 5 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const STEP = 106 * 3;

  function updateArrows() {
    const sl        = track.scrollLeft;
    const maxScroll = track.scrollWidth - track.clientWidth;
    // RTL: scrollLeft is 0 at right-end, negative at left-end (Chrome) OR
    //      positive-max at right-end, 0 at left-end (Firefox)
    const atRightEnd = sl > -4 && sl < 4;
    const atLeftEnd  = Math.abs(Math.abs(sl) - maxScroll) < 4;
    prevBtn.classList.toggle("tcarousel-hidden", atRightEnd);
    nextBtn.classList.toggle("tcarousel-hidden", atLeftEnd);
  }

  prevBtn.addEventListener("click", () => track.scrollBy({ left:  STEP, behavior: "smooth" }));
  nextBtn.addEventListener("click", () => track.scrollBy({ left: -STEP, behavior: "smooth" }));
  track.addEventListener("scroll", updateArrows, { passive: true });

  carouselWrap.appendChild(track);
  carouselWrap.appendChild(prevBtn);
  carouselWrap.appendChild(nextBtn);
  wrap.appendChild(carouselWrap);

  // Initial arrow state after layout
  requestAnimationFrame(updateArrows);
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
    activeTopic  = btn.dataset.topic;
    activeGroup  = "all";
    searchQuery  = "";
    const si = document.getElementById("searchInput");
    if (si) si.value = "";
    const sc = document.getElementById("searchClear");
    if (sc) sc.style.display = "none";
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

  groups.sort((a, b) => {
    const ia = TOPIC_ORDER.indexOf(a);
    const ib = TOPIC_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b, "he");
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
// ANNOUNCEMENT BANNER
// ══════════════════════════════════════════

function initAnnouncementBanner({ text, link }) {
  if (!text) return;

  const bar = document.createElement("div");
  bar.className = "announcement-bar";
  bar.setAttribute("role", "marquee");
  bar.setAttribute("aria-label", "הכרזה");

  const track = document.createElement("div");
  track.className = "announcement-track";

  for (let i = 0; i < 5; i++) {
    const span = document.createElement("span");
    span.className = "announcement-item";
    span.textContent = text;
    track.appendChild(span);
  }

  if (link) {
    const a = document.createElement("a");
    a.href = link;
    a.style.cssText = "text-decoration:none;color:inherit;display:contents;";
    a.appendChild(track);
    bar.appendChild(a);
  } else {
    bar.appendChild(track);
  }

  const closeBtn = document.createElement("button");
  closeBtn.className = "announcement-close";
  closeBtn.setAttribute("aria-label", "סגור הכרזה");
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", () => { bar.remove(); document.body.classList.remove("has-announcement"); });
  bar.appendChild(closeBtn);

  document.body.classList.add("has-announcement");
  document.body.appendChild(bar);
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
// PDF.js VIEWER (activities page only)
// ══════════════════════════════════════════

function _extractPdfUrl(embedUrl) {
  const m = embedUrl.match(/[?&]url=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : embedUrl;
}

async function _renderPdf(embedUrl) {
  const container = document.getElementById("pdfViewerContainer");
  if (!container) return;

  container.innerHTML = `<div class="loading-state">
    <div class="loading-spinner" aria-hidden="true"></div>
    <p>טוענים PDF...</p>
  </div>`;

  const pdfUrl = _extractPdfUrl(embedUrl);

  try {
    if (typeof pdfjsLib === "undefined") throw new Error("PDF.js לא נטען");
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    const containerWidth = container.clientWidth - 32;
    container.innerHTML = "";

    for (let n = 1; n <= pdf.numPages; n++) {
      const page     = await pdf.getPage(n);
      const base     = page.getViewport({ scale: 1 });
      const scale    = Math.max(containerWidth / base.width, 1);
      const viewport = page.getViewport({ scale });

      const canvas   = document.createElement("canvas");
      canvas.width   = viewport.width;
      canvas.height  = viewport.height;
      canvas.style.cssText = "width:100%;display:block;";
      container.appendChild(canvas);

      await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    }
  } catch (err) {
    container.innerHTML = `<p style="padding:20px;color:#c00;text-align:center">שגיאה בטעינת ה-PDF</p>`;
    console.warn("[PDF.js]", err);
  }
}


// ══════════════════════════════════════════
// EMBED MODAL
// ══════════════════════════════════════════

function openEmbedModal(item) {
  const modal = document.getElementById("embedModal");
  if (!modal) return;
  document.getElementById("embedModalTitle").textContent = item.title;

  if (PAGE_TYPE === "מערך פעילות") {
    _renderPdf(item.embed);
  } else {
    document.getElementById("embedModalIframe").src = item.embed;
  }

  modal.hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("embedModalClose").focus();
  loadComments(item.title);
}

function closeEmbedModal() {
  const modal = document.getElementById("embedModal");
  if (!modal || modal.hidden) return;
  const iframe = document.getElementById("embedModalIframe");
  if (iframe) iframe.src = "";
  const pdfBox = document.getElementById("pdfViewerContainer");
  if (pdfBox) pdfBox.innerHTML = "";
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
// COMMENTS
// ══════════════════════════════════════════

let _currentCommentTitle = "";
const commentsCache = {};   // { [title]: comments[] } — cached per session

async function loadComments(title) {
  _currentCommentTitle = title;
  const list = document.getElementById("emcList");
  if (!list) return;

  // Serve from cache instantly if available
  if (commentsCache[title]) {
    renderComments(commentsCache[title]);
    return;
  }

  list.innerHTML = `<p class="emc-loading">טוענים תגובות...</p>`;
  if (!LIKES_SCRIPT_URL || LIKES_SCRIPT_URL.includes("PASTE_")) {
    list.innerHTML = `<p class="emc-empty">תגובות אינן זמינות כרגע.</p>`;
    return;
  }
  try {
    const res  = await fetch(`${LIKES_SCRIPT_URL}?type=comments&title=${encodeURIComponent(title)}`);
    const data = await res.json();
    commentsCache[title] = data.comments || [];
    renderComments(commentsCache[title]);
  } catch {
    list.innerHTML = `<p class="emc-empty">שגיאה בטעינת תגובות.</p>`;
  }
}

function renderComments(comments) {
  const list = document.getElementById("emcList");
  if (!list) return;
  if (!comments.length) {
    list.innerHTML = `<p class="emc-empty">היו ראשונים להגיב! 💬</p>`;
    return;
  }
  list.innerHTML = comments.map(c => `
    <div class="emc-item">
      <div class="emc-item-header">
        <span class="emc-item-name">${escapeHtml(c.name || "אנונימי")}</span>
        <span class="emc-item-date">${escapeHtml(c.date || "")}</span>
      </div>
      <p class="emc-item-text">${escapeHtml(c.text)}</p>
    </div>
  `).join("");
  list.scrollTop = list.scrollHeight;
}

async function submitComment(e) {
  e.preventDefault();
  const title  = _currentCommentTitle;
  const nameEl = document.getElementById("emcName");
  const textEl = document.getElementById("emcText");
  if (!textEl || !textEl.value.trim()) return;
  const name = (nameEl?.value || "").trim() || "אנונימי";
  const text = textEl.value.trim();

  // Show immediately — don't wait for server
  const today = new Date();
  const dateStr = today.getDate() + "/" + (today.getMonth()+1) + "/" + today.getFullYear();
  const optimistic = { name, text, date: dateStr };
  commentsCache[title] = [...(commentsCache[title] || []), optimistic];
  renderComments(commentsCache[title]);
  textEl.value = "";
  if (nameEl) nameEl.value = "";

  // Send to server silently in background
  fetch(LIKES_SCRIPT_URL, {
    method : "POST",
    body   : JSON.stringify({ type: "comment", title, name, text })
  })
    .then(r => r.json())
    .then(data => { commentsCache[title] = data.comments || commentsCache[title]; })
    .catch(() => {/* silent — comment already shown */});
}

function initComments() {
  const form = document.getElementById("emcForm");
  if (form) form.addEventListener("submit", submitComment);
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
  loadAnnouncement().then(initAnnouncementBanner);
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
    initComments();
    initCardTilt();

    // Load likes from server
    loadLikes().then(updateLikeButtons);

    // Auto-open modal if URL contains ?open=
    const openParam = new URLSearchParams(location.search).get("open");
    if (openParam) {
      const target = allResources.find(r => r.title === openParam && r.embed);
      if (target) openEmbedModal(target);
    }
  }

  // ── Homepage: item counts on portal cards ──
  if (document.body.dataset.page === "home") {
    allResources = await loadContentData();
    initHomeCounts();
    initParallax();
    initCardTilt();
  }
});
