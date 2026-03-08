// ══════════════════════════════════════════
// RESOURCES DATA
// To add a new item: copy one object, fill in the fields, save.
//
// type:  "משחק דיגיטלי" | "מערך פעילות" | "יחידת תוכן" | "מצגת הדרכה"
// topic: "חגים" | "עונות השנה" | "צבעים" | "מספרים" | "אותיות" | "רגשות" | "חיות" | "צורות"
// age:   array — any of "3-4", "4-5", "5-6"
// image: path like "images/game1.jpg", or "" to use emoji
// link:  full URL to the TinyTap game, PDF, Google Slides, etc.
// ══════════════════════════════════════════
const resources = [
  {
    id: 1,
    title: "צבעי הקשת",
    type: "משחק דיגיטלי",
    topic: "צבעים",
    age: ["3-4"],
    description: "משחק אינטראקטיבי ללמידת הצבעים הבסיסיים דרך התאמה, זיהוי וצביעה.",
    emoji: "🌈",
    image: "",
    link: "https://www.tinytap.com/"
  },
  {
    id: 2,
    title: "ספר עם מספרים",
    type: "משחק דיגיטלי",
    topic: "מספרים",
    age: ["4-5"],
    description: "לומדים לספור מ-1 עד 10 עם חיות, אנימציות וצלילים מהנים.",
    emoji: "🔢",
    image: "",
    link: "https://www.tinytap.com/"
  },
  {
    id: 3,
    title: "האלף-בית שלי",
    type: "משחק דיגיטלי",
    topic: "אותיות",
    age: ["4-5", "5-6"],
    description: "מסע בין אותיות האלף-בית עם שירים, משחקי זיהוי ואנימציות.",
    emoji: "🔤",
    image: "",
    link: "https://www.tinytap.com/"
  },
  {
    id: 4,
    title: "חגים בשמחה",
    type: "משחק דיגיטלי",
    topic: "חגים",
    age: ["3-4", "4-5", "5-6"],
    description: "פעילויות דיגיטליות לחגי ישראל – ראש השנה, חנוכה, פסח ועוד.",
    emoji: "🕎",
    image: "",
    link: "https://www.tinytap.com/"
  },
  {
    id: 5,
    title: "איך אני מרגיש?",
    type: "משחק דיגיטלי",
    topic: "רגשות",
    age: ["3-4", "4-5"],
    description: "משחק לזיהוי ושיום רגשות דרך פרצופים, סיפורים וסיטואציות.",
    emoji: "😊",
    image: "",
    link: "https://www.tinytap.com/"
  },
  {
    id: 6,
    title: "חיות החווה",
    type: "משחק דיגיטלי",
    topic: "חיות",
    age: ["3-4"],
    description: "לומדים את שמות חיות החווה, הצלילים שהן עושות והמזון שלהן.",
    emoji: "🐄",
    image: "",
    link: "https://www.tinytap.com/"
  },
  {
    id: 7,
    title: "עולם הצורות",
    type: "משחק דיגיטלי",
    topic: "צורות",
    age: ["3-4", "4-5"],
    description: "מגלים עיגולים, ריבועים, משולשים ועוד בסביבה המוכרת.",
    emoji: "🔷",
    image: "",
    link: "https://www.tinytap.com/"
  },
  {
    id: 8,
    title: "מערך פעילות – סתיו",
    type: "מערך פעילות",
    topic: "עונות השנה",
    age: ["4-5"],
    description: "מערך מלא לפעילות גן בנושא עונת הסתיו – מטרות, חומרים, שלבים ורפלקציה.",
    emoji: "🍂",
    image: "",
    link: "https://www.tinytap.com/"
  },
  {
    id: 9,
    title: "מערך פעילות – רגשות",
    type: "מערך פעילות",
    topic: "רגשות",
    age: ["3-4", "4-5"],
    description: "תכנית פעילות קבוצתית לעיסוק ברגשות בגיל הגן – עם כרטיסיות ופעילויות.",
    emoji: "💛",
    image: "",
    link: "https://www.tinytap.com/"
  },
  {
    id: 10,
    title: "מערך – חנוכה",
    type: "מערך פעילות",
    topic: "חגים",
    age: ["3-4", "4-5", "5-6"],
    description: "מערך פעילות לחנוכה הכולל שיחה, יצירה, שיר ומשחק – מוכן לשימוש.",
    emoji: "🕯️",
    image: "",
    link: "https://www.tinytap.com/"
  },
  {
    id: 11,
    title: "יחידת תוכן – חיות הבר",
    type: "יחידת תוכן",
    topic: "חיות",
    age: ["4-5", "5-6"],
    description: "יחידת לימוד שלמה על חיות הבר – מידע, פעילויות, חומרי הדפסה ומשחק.",
    emoji: "🦁",
    image: "",
    link: "https://www.tinytap.com/"
  },
  {
    id: 12,
    title: "יחידת תוכן – הצבעים בחיינו",
    type: "יחידת תוכן",
    topic: "צבעים",
    age: ["3-4"],
    description: "חודש שלם של למידה על צבעים – ניסויים, ספרים, שירים, יצירה ומשחק.",
    emoji: "🎨",
    image: "",
    link: "https://www.tinytap.com/"
  },
  {
    id: 13,
    title: "מצגת – עונות השנה",
    type: "מצגת הדרכה",
    topic: "עונות השנה",
    age: ["4-5", "5-6"],
    description: "מצגת ויזואלית לשיחת עיגול בנושא ארבע העונות – עם תמונות וסיפורים.",
    emoji: "🌸",
    image: "",
    link: "https://www.tinytap.com/"
  },
  {
    id: 14,
    title: "מצגת – מספרים 1–10",
    type: "מצגת הדרכה",
    topic: "מספרים",
    age: ["3-4", "4-5"],
    description: "מצגת צבעונית להצגת המספרים לילדים – עם אנימציה וספירה קבוצתית.",
    emoji: "🔢",
    image: "",
    link: "https://www.tinytap.com/"
  }
];

// ══════════════════════════════════════════
// STATE
// ══════════════════════════════════════════
let activeType  = "all";
let activeTopic = "all";
let activeAge   = "all";

const typeClass = {
  "משחק דיגיטלי": "games",
  "מערך פעילות":  "plans",
  "יחידת תוכן":   "units",
  "מצגת הדרכה":  "pres"
};

const typeCTA = {
  "משחק דיגיטלי": "שחק עכשיו ▶",
  "מערך פעילות":  "פתח מערך ↗",
  "יחידת תוכן":   "פתח יחידה ↗",
  "מצגת הדרכה":  "פתח מצגת ↗"
};

// ══════════════════════════════════════════
// RENDER
// ══════════════════════════════════════════
function renderCards() {
  const grid    = document.getElementById("cardsGrid");
  const counter = document.getElementById("resultsCount");
  grid.innerHTML = "";

  const list = resources.filter(r => {
    const okType  = activeType  === "all" || r.type  === activeType;
    const okTopic = activeTopic === "all" || r.topic === activeTopic;
    const okAge   = activeAge   === "all" || r.age.includes(activeAge);
    return okType && okTopic && okAge;
  });

  counter.textContent = `מציג ${list.length} מתוך ${resources.length} משאבים`;

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">🔍</div>
        <p>לא נמצאו תכנים בסינון זה.<br>נסו לשנות את הפילטרים.</p>
      </div>`;
    return;
  }

  list.forEach(r => {
    const cls  = typeClass[r.type] || "games";
    const card = document.createElement("div");
    card.className = "rcard";
    card.setAttribute("data-type", r.type);

    const thumb = r.image
      ? `<img src="${r.image}" alt="${r.title}" />`
      : r.emoji;

    card.innerHTML = `
      <div class="rcard-thumb">${thumb}</div>
      <div class="rcard-body">
        <div class="rcard-tags">
          <span class="rtag rtag-${cls}">${r.type}</span>
          <span class="rtag rtag-topic">${r.topic}</span>
          <span class="rtag rtag-age">גיל ${r.age.join(", ")}</span>
        </div>
        <h3>${r.title}</h3>
        <p>${r.description}</p>
        <a href="${r.link}" target="_blank" rel="noopener noreferrer"
           class="rcard-btn rcard-btn-${cls}"
           onclick="event.stopPropagation()">
          ${typeCTA[r.type] || "פתח ↗"}
        </a>
      </div>`;

    card.addEventListener("click", () =>
      window.open(r.link, "_blank", "noopener,noreferrer"));

    grid.appendChild(card);
  });
}

// ══════════════════════════════════════════
// FILTER: TYPE
// ══════════════════════════════════════════
document.getElementById("typeFilters").addEventListener("click", e => {
  const p = e.target.closest(".pill");
  if (!p) return;
  activeType = p.dataset.type;
  document.querySelectorAll("#typeFilters .pill")
    .forEach(x => x.classList.toggle("active", x === p));
  renderCards();
});

// ══════════════════════════════════════════
// FILTER: AGE
// ══════════════════════════════════════════
document.getElementById("ageFilters").addEventListener("click", e => {
  const p = e.target.closest(".pill");
  if (!p) return;
  activeAge = p.dataset.age;
  document.querySelectorAll("#ageFilters .pill")
    .forEach(x => x.classList.toggle("active", x === p));
  renderCards();
});

// ══════════════════════════════════════════
// FILTER: TOPIC CHIPS
// ══════════════════════════════════════════
document.querySelectorAll(".topic-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    activeTopic = btn.dataset.topic;
    document.querySelectorAll(".topic-btn")
      .forEach(b => b.classList.toggle("active", b === btn));
    document.getElementById("library")
      .scrollIntoView({ behavior: "smooth" });
    renderCards();
  });
});

// ══════════════════════════════════════════
// filterAndGo – from type cards
// ══════════════════════════════════════════
function filterAndGo(type) {
  activeType = type;
  document.querySelectorAll("#typeFilters .pill")
    .forEach(p => p.classList.toggle("active", p.dataset.type === type));
  document.getElementById("library")
    .scrollIntoView({ behavior: "smooth" });
  renderCards();
}

// ══════════════════════════════════════════
// CLEAR
// ══════════════════════════════════════════
function clearFilters() {
  activeType  = "all";
  activeTopic = "all";
  activeAge   = "all";
  document.querySelectorAll("#typeFilters .pill")
    .forEach(p => p.classList.toggle("active", p.dataset.type === "all"));
  document.querySelectorAll("#ageFilters .pill")
    .forEach(p => p.classList.toggle("active", p.dataset.age === "all"));
  document.querySelectorAll(".topic-btn")
    .forEach(b => b.classList.toggle("active", b.dataset.topic === "all"));
  renderCards();
}

// ══════════════════════════════════════════
// MOBILE MENU
// ══════════════════════════════════════════
document.getElementById("burgerBtn").addEventListener("click", () => {
  document.getElementById("mobileMenu").classList.toggle("open");
});
function closeMobile() {
  document.getElementById("mobileMenu").classList.remove("open");
}

// ══════════════════════════════════════════
// HEADER SCROLL SHADOW
// ══════════════════════════════════════════
window.addEventListener("scroll", () => {
  document.getElementById("siteHeader")
    .classList.toggle("scrolled", window.scrollY > 20);
}, { passive: true });

// ══════════════════════════════════════════
// SCROLL REVEAL
// ══════════════════════════════════════════
const revealObserver = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      revealObserver.unobserve(e.target);
    }
  }),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal")
  .forEach(el => revealObserver.observe(el));

// ══════════════════════════════════════════
// CONTACT FORM
// ══════════════════════════════════════════
function handleSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  const orig = btn.textContent;
  btn.textContent  = "נשלח! תודה 🎉";
  btn.disabled     = true;
  btn.style.background = "#51CF66";
  setTimeout(() => {
    e.target.reset();
    btn.textContent      = orig;
    btn.disabled         = false;
    btn.style.background = "";
  }, 3500);
}

// ══════════════════════════════════════════
// INIT
// ══════════════════════════════════════════
renderCards();
