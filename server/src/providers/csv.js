// Bring-your-own data: drop CSV exports into ASO_CSV_DIR (default ./.aso/data).
// Works with Astro, Apple Search Ads (search popularity), Appfigures, Sensor Tower, spreadsheets.
// Recognized headers (case-insensitive): keyword|term, country|storefront, popularity|volume|search popularity,
// difficulty|competitiveness|chance, rank|position|ranking, date
import fs from "node:fs";
import path from "node:path";

export const name = "csv";
const dir = () => process.env.ASO_CSV_DIR || path.join(process.env.ASO_DATA_DIR || path.join(process.cwd(), ".aso"), "data");
export const configured = () => fs.existsSync(dir()) && fs.readdirSync(dir()).some((f) => f.endsWith(".csv"));

const ALIASES = {
  keyword: ["keyword", "term", "search term", "keywords"],
  country: ["country", "storefront", "store", "market"],
  popularity: ["popularity", "volume", "search popularity", "search volume"],
  difficulty: ["difficulty", "competitiveness", "competition", "chance"],
  rank: ["rank", "position", "ranking", "current rank"],
  date: ["date", "updated", "day"],
};

function parseLine(line) {
  const out = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (c === "," && !q) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function load() {
  const rows = [];
  for (const f of fs.readdirSync(dir()).filter((x) => x.endsWith(".csv"))) {
    const lines = fs.readFileSync(path.join(dir(), f), "utf8").split(/\r?\n/).filter(Boolean);
    const header = parseLine(lines.shift()).map((h) => h.toLowerCase());
    const idx = Object.fromEntries(Object.entries(ALIASES).map(([k, a]) => [k, header.findIndex((h) => a.includes(h))]));
    for (const l of lines) {
      const c = parseLine(l);
      const get = (k) => (idx[k] >= 0 ? c[idx[k]] : undefined);
      const num = (k) => { const v = parseFloat(get(k)); return Number.isFinite(v) ? v : null; };
      if (!get("keyword")) continue;
      rows.push({ keyword: get("keyword").toLowerCase(), country: (get("country") || "us").toLowerCase(), popularity: num("popularity"), difficulty: num("difficulty"), rank: num("rank"), date: get("date") || null, file: f });
    }
  }
  return rows;
}

function latest(rows, k, country) {
  return rows.filter((r) => r.keyword === k.toLowerCase() && r.country === country.toLowerCase()).sort((a, b) => String(a.date).localeCompare(String(b.date))).pop();
}

export async function metrics({ keywords, country = "us" }) {
  const rows = load();
  return keywords.map((k) => { const r = latest(rows, k, country); return { keyword: k, country, popularity: r?.popularity ?? null, difficulty: r?.difficulty ?? null, scale: r ? `csv:${r.file}` : null, source: name }; });
}

export async function ranks({ keywords, country = "us" }) {
  const rows = load();
  return keywords.map((k) => { const r = latest(rows, k, country); return { keyword: k, country, rank: r?.rank ?? null, date: r?.date ?? null, source: name }; });
}
