/* ═══════════════════════════════════════════════════════════════════
   data.js — Google Sheets content loader
   Anna Galper Educational Website

   ┌─────────────────────────────────────────────────────────────────┐
   │  HOW TO CONNECT YOUR GOOGLE SHEET                               │
   │                                                                 │
   │  Step 1: Open your Google Sheet                                 │
   │  Step 2: File → Share → Publish to web                         │
   │  Step 3: Select the sheet tab → "Comma-separated values (.csv)" │
   │  Step 4: Click "Publish" and copy the URL                       │
   │  Step 5: Paste it below as the value of SHEET_CSV_URL           │
   │                                                                 │
   │  Alternative (local file):                                      │
   │    Export the sheet as CSV, save as "content.csv" next to       │
   │    index.html, and set SHEET_CSV_URL = "content.csv"            │
   └─────────────────────────────────────────────────────────────────┘

   REQUIRED COLUMNS IN THE SHEET (header row, any order):
     topic   — thematic topic, e.g.  חגים | פורים | עונות השנה
     group   — sub-group within topic, e.g.  יום ראשון | יום שני
               leave empty for a flat list (used for Purim, etc.)
     title   — card title displayed on the site
     type    — content category; must be exactly one of:
                 משחק דיגיטלי | מערך פעילות | יחידת תוכן | מצגת הדרכה
     link    — URL opened when the card is clicked
     image   — thumbnail URL (optional; leave empty to show emoji)
     order   — integer; lower numbers appear first

   OPTIONAL EXTRA COLUMNS (add to the sheet as needed):
     description — short text shown on the card
     emoji       — custom emoji for the thumbnail, e.g. 🎭
     age         — comma-separated age groups: 3-4,4-5,5-6

   ═══════════════════════════════════════════════════════════════════ */

// ── ▼ REPLACE THIS with your published Google Sheet CSV URL ────────
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSOXyU8zb6bNStGQx_aFVmwVGkc_tNXoAExAgu8LZdLyoCgv7TPUM9SEKgVX50Ce3qajK_5DgALTTzV/pub?gid=0&single=true&output=csv";
// ── ▲ ─────────────────────────────────────────────────────────────

// ── ▼ הכרזה רצה — טאב נפרד ב-Google Sheets ──────────────────────
//  הוראות:
//  1. פתחי את הגיליון שלך → הוסיפי טאב חדש בשם "הכרזה"
//  2. שורה 1 (כותרות):  text  |  link
//  3. שורה 2 (ערכים):   הטקסט שתרצי | קישור (אופציונלי, אפשר להשאיר ריק)
//  4. קובץ ← שתף ← פרסם לאינטרנט ← בחרי טאב "הכרזה" ← CSV ← העתיקי URL
//  5. הדביקי כאן:
const ANNOUNCEMENT_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSOXyU8zb6bNStGQx_aFVmwVGkc_tNXoAExAgu8LZdLyoCgv7TPUM9SEKgVX50Ce3qajK_5DgALTTzV/pub?gid=377897368&single=true&output=csv"; // הדביקי כאן את ה-URL של טאב "הכרזה"
//  כדי להסתיר את הבאנר — פשוט מחקי את תוכן שורה 2 בגיליון
// ── ▲ ─────────────────────────────────────────────────────────────


/**
 * Loads the announcement banner text+link from the "הכרזה" sheet tab.
 * Returns { text, link }. Empty text = no banner.
 */
async function loadAnnouncement() {
  if (!ANNOUNCEMENT_CSV_URL) return { text: "", link: "" };
  try {
    const res = await fetch(ANNOUNCEMENT_CSV_URL + "&t=" + Date.now());
    if (!res.ok) return { text: "", link: "" };
    const lines = (await res.text()).trim().split(/\r?\n/);
    if (lines.length < 2) return { text: "", link: "" };
    const values = parseCSVRow(lines[1]);
    return { text: (values[0] || "").trim(), link: (values[1] || "").trim() };
  } catch {
    return { text: "", link: "" };
  }
}


/**
 * Loads all content rows from the Google Sheet.
 * Returns Promise<Array> of item objects sorted by the `order` column.
 * On any network or parse error, logs a warning and returns []
 * so the site remains functional (shows empty state).
 */
const CACHE_KEY = "anna_content_v1";
const CACHE_TTL  = 24 * 60 * 60 * 1000; // 24 hours in ms

// Clear cache if ?refresh is in the URL (use when you add new content to the sheet)
if (location.search.includes("refresh")) {
  try { localStorage.removeItem(CACHE_KEY); } catch (_) {}
}

function _readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, items } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_KEY); return null; }
    return items;
  } catch (_) { return null; }
}

function _writeCache(items) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items })); } catch (_) {}
}

// Kick off the network request immediately when this script loads —
// before DOMContentLoaded — so data arrives as early as possible.
let _earlyPromise = null;

(function _earlyFetch() {
  if (!SHEET_CSV_URL || SHEET_CSV_URL.includes("PASTE_")) return;
  if (_readCache()) return; // already cached → nothing to prefetch

  _earlyPromise = fetch(SHEET_CSV_URL)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then(csv => {
      const items = parseCSV(csv);
      _writeCache(items);
      console.info(`[data.js] ✓ Loaded ${items.length} items from Google Sheets`);
      return items;
    })
    .catch(err => {
      _earlyPromise = null;
      console.warn(`[data.js] ✗ ${err.message}`);
      return [];
    });
})();

async function loadContentData() {

  // If the URL is still the placeholder, warn and return empty
  if (!SHEET_CSV_URL || SHEET_CSV_URL.includes("PASTE_")) {
    console.warn(
      "[data.js] ⚠  Google Sheet not connected.\n" +
      "  Open data.js and replace SHEET_CSV_URL with your CSV publish link.\n" +
      "  Instructions are at the top of data.js."
    );
    return [];
  }

  // Return cached data from localStorage (instant, valid for 24h)
  const cached = _readCache();
  if (cached) {
    console.info(`[data.js] ✓ Loaded ${cached.length} items from cache`);
    return cached;
  }

  // Reuse the in-flight early fetch if still running
  if (_earlyPromise) return _earlyPromise;

  // Fallback: fetch now (shouldn't normally reach here)
  try {
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csv   = await res.text();
    const items = parseCSV(csv);
    _writeCache(items);
    return items;
  } catch (err) {
    console.warn(`[data.js] ✗ Could not load Google Sheet: ${err.message}`);
    return [];
  }
}


// ─────────────────────────────────────────────────────────────────
// CSV Parsing
// ─────────────────────────────────────────────────────────────────

/**
 * Parses a full CSV string into an array of item objects.
 * The first row is treated as headers (normalized to lowercase).
 */
function parseCSV(raw) {
  const lines = raw.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Normalize header names to lowercase so column order doesn't matter
  const headers = parseCSVRow(lines[0]).map(h => h.trim().toLowerCase());

  const items = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVRow(lines[i]);

    // Skip completely blank rows
    if (!values.some(v => v.trim())) continue;

    const item = {};
    headers.forEach((key, idx) => {
      item[key] = (values[idx] ?? "").trim();
    });

    // Normalize `order` to a number (rows without order sort last)
    item.order = parseInt(item.order, 10);
    if (isNaN(item.order)) item.order = 999;

    // Normalize optional `age` column to an array
    // Sheet value examples: "3-4"  or  "3-4,4-5,5-6"
    item.age = item.age
      ? item.age.split(",").map(s => s.trim()).filter(Boolean)
      : [];

    // Only include rows that have at least a title
    if (item.title) items.push(item);
  }

  return items;
}

/**
 * Splits one CSV line into an array of raw field strings.
 * Handles:
 *   • Quoted fields that contain commas
 *   • Escaped double-quotes ("") inside quoted fields → literal "
 */
function parseCSVRow(row) {
  const cells   = [];
  let   inQuote = false;
  let   cell    = "";

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];

    if (ch === '"') {
      if (inQuote && row[i + 1] === '"') {
        cell += '"'; // escaped quote
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === "," && !inQuote) {
      cells.push(cell);
      cell = "";
    } else {
      cell += ch;
    }
  }

  cells.push(cell); // last field (no trailing comma)
  return cells;
}
