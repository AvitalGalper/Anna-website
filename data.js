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


/**
 * Loads all content rows from the Google Sheet.
 * Returns Promise<Array> of item objects sorted by the `order` column.
 * On any network or parse error, logs a warning and returns []
 * so the site remains functional (shows empty state).
 */
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

  try {
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
    const csv   = await res.text();
    const items = parseCSV(csv);
    console.info(`[data.js] ✓ Loaded ${items.length} items from Google Sheets`);
    return items;
  } catch (err) {
    console.warn(
      `[data.js] ✗ Could not load Google Sheet: ${err.message}\n` +
      "  Check SHEET_CSV_URL in data.js. The site will show an empty list."
    );
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
