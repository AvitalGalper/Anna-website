// ══════════════════════════════════════════════════════
// script.js — לוגיקה של האתר
// הנתונים נמצאים ב-data.js — שם עורכים תכנים.
// ══════════════════════════════════════════════════════

/* ─────────────────────────────────────────
   TYPE CONFIG
───────────────────────────────────────── */
const TYPE_CONFIG = {
  "משחק דיגיטלי": { cls: "games", cta: "שחק עכשיו ▶" },
  "מערך פעילות":  { cls: "plans", cta: "פתח מערך ↗"  },
  "יחידת תוכן":   { cls: "units", cta: "פתח יחידה ↗" },
  "מצגת הדרכה":  { cls: "pres",  cta: "פתח מצגת ↗"  }
};

/* ─────────────────────────────────────────
   BUILD FLAT ARRAY FROM CONTENT_DATA
───────────────────────────────────────── */
let allResources = [];

if (typeof CONTENT_DATA !== "undefined") {
  Object.entries(CONTENT_DATA).forEach(([type, items]) => {
    if (Array.isArray(items)) {
      items.forEach(item => {
        allResources.push({ ...item, type });
      });
    }
  });
}

/* ─────────────────────────────────────────
   STATE
───────────────────────────────────────── */
let activeType  = "all";
let activeTopic = "all";
let activeAge   = "all";
let searchQuery = "";

/* ─────────────────────────────────────────
   HIGHLIGHT SEARCH MATCH
   Returns HTML string with <mark> around
   the matching portion of text.
───────────────────────────────────────── */
function highlightMatch(text, query) {
  if (!query || query.length === 0) {
    return escapeHtml(text);
  }
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp("(" + escapedQuery + ")", "gi");
  return escapeHtml(text).replace(
    new RegExp("(" + escapeHtml(escapedQuery) + ")", "gi"),
    '<mark class="search-mark">$1</mark>'
  );
}

/* Helper to escape HTML special characters */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ─────────────────────────────────────────
   CREATE CARD ELEMENT
───────────────────────────────────────── */
function createCard(item) {
  const cfg = TYPE_CONFIG[item.type] || { cls: "games", cta: "פתח ↗" };

  const article = document.createElement("article");
  article.className = "rcard";
  article.setAttribute("data-type", item.type);
  article.setAttribute("role", "article");
  article.setAttribute("tabindex", "0");

  // ── Thumbnail ──
  const thumb = document.createElement("div");
  thumb.className = "rcard-thumb";

  if (item.image && item.image.trim() !== "") {
    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.title || "";
    img.loading = "lazy";
    thumb.appendChild(img);
  } else {
    const emojiSpan = document.createElement("span");
    emojiSpan.className = "rcard-emoji";
    emojiSpan.setAttribute("aria-hidden", "true");
    emojiSpan.textContent = item.emoji || "📄";
    thumb.appendChild(emojiSpan);
  }

  // ── Body ──
  const body = document.createElement("div");
  body.className = "rcard-body";

  // Tags row
  const tagsDiv = document.createElement("div");
  tagsDiv.className = "rcard-tags";

  // Type tag
  const typeTag = document.createElement("span");
  typeTag.className = "rtag rtag-" + cfg.cls;
  typeTag.textContent = item.type;
  tagsDiv.appendChild(typeTag);

  // Topic tag
  if (item.topic) {
    const topicTag = document.createElement("span");
    topicTag.className = "rtag rtag-topic";
    topicTag.textContent = item.topic;
    tagsDiv.appendChild(topicTag);
  }

  // Age tags
  if (Array.isArray(item.age) && item.age.length > 0) {
    item.age.forEach(ageVal => {
      const ageTag = document.createElement("span");
      ageTag.className = "rtag rtag-age";
      ageTag.textContent = "גיל " + ageVal;
      tagsDiv.appendChild(ageTag);
    });
  }

  body.appendChild(tagsDiv);

  // Title (with search highlight)
  const h3 = document.createElement("h3");
  h3.innerHTML = highlightMatch(item.title || "", searchQuery);
  body.appendChild(h3);

  // Description
  const desc = document.createElement("p");
  desc.textContent = item.description || "";
  body.appendChild(desc);

  // CTA button
  const btn = document.createElement("a");
  btn.className = "rcard-btn rcard-btn-" + cfg.cls;
  btn.textContent = cfg.cta;
  btn.href = item.link || "#";
  btn.target = "_blank";
  btn.rel = "noopener noreferrer";
  btn.setAttribute("aria-label", cfg.cta + " — " + (item.title || ""));

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  body.appendChild(btn);

  // Assemble card
  article.appendChild(thumb);
  article.appendChild(body);

  // Click anywhere on card opens link
  article.addEventListener("click", function () {
    if (item.link && item.link !== "#") {
      window.open(item.link, "_blank", "noopener,noreferrer");
    }
  });

  // Keyboard: Enter opens link
  article.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (item.link && item.link !== "#") {
        window.open(item.link, "_blank", "noopener,noreferrer");
      }
    }
  });

  return article;
}

/* ─────────────────────────────────────────
   RENDER CARDS
───────────────────────────────────────── */
function renderCards() {
  const grid = document.getElementById("cardsGrid");
  const countEl = document.getElementById("resultsCount");

  if (!grid) return;

  // Filter
  const filtered = allResources.filter(item => {
    // Type filter
    if (activeType !== "all" && item.type !== activeType) return false;

    // Topic filter
    if (activeTopic !== "all" && item.topic !== activeTopic) return false;

    // Age filter
    if (activeAge !== "all") {
      if (!Array.isArray(item.age) || !item.age.includes(activeAge)) return false;
    }

    // Search filter (title + description, case-insensitive)
    if (searchQuery.length > 0) {
      const title = (item.title || "").toLowerCase();
      const desc  = (item.description || "").toLowerCase();
      if (!title.includes(searchQuery) && !desc.includes(searchQuery)) return false;
    }

    return true;
  });

  // Clear grid
  grid.innerHTML = "";

  // Update results count
  if (countEl) {
    if (filtered.length === 0) {
      countEl.textContent = "";
    } else if (filtered.length === 1) {
      countEl.textContent = "נמצא תוצאה אחת";
    } else {
      countEl.textContent = "נמצאו " + filtered.length + " תכנים";
    }
  }

  // Render cards or empty state
  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML =
      '<span class="es-icon" aria-hidden="true">🔍</span>' +
      "<p>לא נמצאו תכנים תואמים. נסו לשנות את הסינון או החיפוש.</p>";
    grid.appendChild(empty);
  } else {
    filtered.forEach(item => {
      grid.appendChild(createCard(item));
    });
  }
}

/* ─────────────────────────────────────────
   SEARCH — input & clear
───────────────────────────────────────── */
function initSearch() {
  const input     = document.getElementById("searchInput");
  const clearBtn  = document.getElementById("searchClear");

  if (!input || !clearBtn) return;

  function updateClearVisibility() {
    clearBtn.style.display = input.value.length > 0 ? "block" : "none";
  }

  input.addEventListener("input", function () {
    searchQuery = input.value.trim().toLowerCase();
    updateClearVisibility();
    renderCards();
  });

  clearBtn.addEventListener("click", function () {
    input.value = "";
    searchQuery = "";
    clearBtn.style.display = "none";
    input.focus();
    renderCards();
  });

  // Initial state
  updateClearVisibility();
}

/* ─────────────────────────────────────────
   TYPE FILTER PILLS
───────────────────────────────────────── */
function initTypeFilters() {
  const container = document.getElementById("typeFilters");
  if (!container) return;

  container.addEventListener("click", function (e) {
    const pill = e.target.closest(".pill");
    if (!pill) return;

    const type = pill.dataset.type;
    if (!type) return;

    activeType = type;

    // Update active class
    container.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");

    renderCards();
  });
}

/* ─────────────────────────────────────────
   AGE FILTER PILLS
───────────────────────────────────────── */
function initAgeFilters() {
  const container = document.getElementById("ageFilters");
  if (!container) return;

  container.addEventListener("click", function (e) {
    const pill = e.target.closest(".pill");
    if (!pill) return;

    const age = pill.dataset.age;
    if (!age) return;

    activeAge = age;

    // Update active class
    container.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");

    renderCards();
  });
}

/* ─────────────────────────────────────────
   TOPIC BUTTONS
───────────────────────────────────────── */
function initTopicButtons() {
  const btns = document.querySelectorAll(".topic-btn");

  btns.forEach(btn => {
    btn.addEventListener("click", function () {
      const topic = btn.dataset.topic;
      if (!topic) return;

      activeTopic = topic;

      // Update active + aria
      btns.forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");

      // Scroll to library
      const library = document.getElementById("library");
      if (library) {
        library.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      renderCards();
    });
  });
}

/* ─────────────────────────────────────────
   FILTER AND GO
   Called from type-card onclick
───────────────────────────────────────── */
function filterAndGo(type) {
  activeType = type;

  // Update type pill UI
  const typeFilters = document.getElementById("typeFilters");
  if (typeFilters) {
    typeFilters.querySelectorAll(".pill").forEach(p => {
      p.classList.remove("active");
      if (p.dataset.type === type) {
        p.classList.add("active");
      }
    });
  }

  renderCards();

  // Scroll to library
  const library = document.getElementById("library");
  if (library) {
    library.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* ─────────────────────────────────────────
   CLEAR ALL FILTERS
   Called from pill-clear onclick
───────────────────────────────────────── */
function clearFilters() {
  // Reset state
  activeType  = "all";
  activeTopic = "all";
  activeAge   = "all";
  searchQuery = "";

  // Reset search input
  const input    = document.getElementById("searchInput");
  const clearBtn = document.getElementById("searchClear");
  if (input)    input.value = "";
  if (clearBtn) clearBtn.style.display = "none";

  // Reset type pills
  const typeFilters = document.getElementById("typeFilters");
  if (typeFilters) {
    typeFilters.querySelectorAll(".pill").forEach(p => {
      p.classList.remove("active");
      if (p.dataset.type === "all") p.classList.add("active");
    });
  }

  // Reset age pills
  const ageFilters = document.getElementById("ageFilters");
  if (ageFilters) {
    ageFilters.querySelectorAll(".pill").forEach(p => {
      p.classList.remove("active");
      if (p.dataset.age === "all") p.classList.add("active");
    });
  }

  // Reset topic buttons
  const topicBtns = document.querySelectorAll(".topic-btn");
  topicBtns.forEach(b => {
    b.classList.remove("active");
    b.setAttribute("aria-pressed", "false");
    if (b.dataset.topic === "all") {
      b.classList.add("active");
      b.setAttribute("aria-pressed", "true");
    }
  });

  renderCards();
}

/* ─────────────────────────────────────────
   MOBILE MENU TOGGLE
───────────────────────────────────────── */
function initMobileMenu() {
  const burger     = document.getElementById("burgerBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  if (!burger || !mobileMenu) return;

  burger.addEventListener("click", function () {
    const isOpen = mobileMenu.classList.contains("open");

    if (isOpen) {
      mobileMenu.classList.remove("open");
      burger.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      mobileMenu.setAttribute("aria-hidden", "true");
    } else {
      mobileMenu.classList.add("open");
      burger.classList.add("open");
      burger.setAttribute("aria-expanded", "true");
      mobileMenu.setAttribute("aria-hidden", "false");
    }
  });

  // Close menu when any mobile link is clicked
  mobileMenu.querySelectorAll(".mobile-link").forEach(link => {
    link.addEventListener("click", function () {
      mobileMenu.classList.remove("open");
      burger.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      mobileMenu.setAttribute("aria-hidden", "true");
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", function (e) {
    if (
      mobileMenu.classList.contains("open") &&
      !mobileMenu.contains(e.target) &&
      !burger.contains(e.target)
    ) {
      mobileMenu.classList.remove("open");
      burger.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      mobileMenu.setAttribute("aria-hidden", "true");
    }
  });
}

/* ─────────────────────────────────────────
   HEADER SCROLL SHADOW
───────────────────────────────────────── */
function initHeaderScroll() {
  const header = document.getElementById("siteHeader");
  if (!header) return;

  function onScroll() {
    if (window.scrollY > 10) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll(); // run once on load
}

/* ─────────────────────────────────────────
   SCROLL REVEAL WITH IntersectionObserver
───────────────────────────────────────── */
function initScrollReveal() {
  const revealEls = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    // Fallback: just make everything visible
    revealEls.forEach(el => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  revealEls.forEach(el => observer.observe(el));
}

/* ─────────────────────────────────────────
   CONTACT FORM SUBMIT HANDLER
───────────────────────────────────────── */
function handleSubmit(e) {
  e.preventDefault();

  const form      = e.target;
  const submitBtn = document.getElementById("submitBtn");

  // Basic validation
  const name    = form.querySelector("#contactName");
  const email   = form.querySelector("#contactEmail");
  const subject = form.querySelector("#contactSubject");
  const message = form.querySelector("#contactMessage");

  if (!name || !name.value.trim()) {
    name && name.focus();
    return;
  }
  if (!email || !email.value.trim()) {
    email && email.focus();
    return;
  }
  if (!subject || !subject.value) {
    subject && subject.focus();
    return;
  }
  if (!message || !message.value.trim()) {
    message && message.focus();
    return;
  }

  // Success animation
  if (submitBtn) {
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "✅ ההודעה נשלחה! תודה רבה";
    submitBtn.disabled = true;
    submitBtn.style.background = "var(--teal)";
    submitBtn.style.transform = "scale(1.04)";

    setTimeout(function () {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      submitBtn.style.background = "";
      submitBtn.style.transform = "";
    }, 3500);
  }

  // Reset form fields
  form.reset();
}

/* ─────────────────────────────────────────
   KEYBOARD NAVIGATION FOR TYPE CARDS
───────────────────────────────────────── */
function initTypeCardKeyboard() {
  document.querySelectorAll(".type-card").forEach(card => {
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.click();
      }
    });
  });
}

/* ─────────────────────────────────────────
   INIT — called on DOMContentLoaded
───────────────────────────────────────── */
function init() {
  renderCards();
  initScrollReveal();
  initSearch();
  initTypeFilters();
  initAgeFilters();
  initTopicButtons();
  initMobileMenu();
  initHeaderScroll();
  initTypeCardKeyboard();
}

// Entry point
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
