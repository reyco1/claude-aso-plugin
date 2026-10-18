// AppTweak Public API adapter. Docs: https://developers.apptweak.com
// Env: APPTWEAK_API_KEY. Costs credits per keyword per metric.
export const name = "apptweak";
export const configured = () => Boolean(process.env.APPTWEAK_API_KEY);
const BASE = "https://public-api.apptweak.com/api/public/store";

async function get(path, params) {
  const res = await fetch(`${BASE}${path}?${new URLSearchParams(params)}`, {
    headers: { "x-apptweak-key": process.env.APPTWEAK_API_KEY, accept: "application/json" },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`AppTweak ${path} -> ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
  return json;
}

const val = (m) => (m && typeof m === "object" ? m.value ?? null : m ?? null);

export async function metrics({ keywords, country = "us", device = "iphone", language }) {
  const json = await get("/keywords/metrics/current.json", {
    keywords: keywords.join(","),
    metrics: "volume,difficulty,results",
    country,
    language: language || country,
    device,
  });
  const result = json.result || json.content || {};
  return keywords.map((k) => {
    const r = result[k] || result[k.toLowerCase()] || {};
    return { keyword: k, country, popularity: val(r.volume), difficulty: val(r.difficulty), results: val(r.results), scale: "apptweak", source: name };
  });
}

export async function ranks({ appId, keywords, country = "us", device = "iphone", language }) {
  const json = await get("/apps/keywords-rankings/current.json", {
    apps: String(appId),
    keywords: keywords.join(","),
    country,
    language: language || country,
    device,
  });
  const app = (json.result || {})[String(appId)] || {};
  return keywords.map((k) => {
    const r = app[k] || app[k.toLowerCase()] || {};
    return { keyword: k, country, rank: r.ranking ?? r.value ?? null, source: name };
  });
}
