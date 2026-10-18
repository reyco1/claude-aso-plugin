// Free fallback. Uses the public iTunes Search API to ESTIMATE search position.
// Results are not identical to on-device App Store search. Treat as directional only.
export const name = "itunes";
export const configured = () => true;

export async function ranks({ appId, keywords, country = "us" }) {
  const out = [];
  for (const keyword of keywords) {
    const q = new URLSearchParams({ term: keyword, country, entity: "software", limit: "200" });
    const res = await fetch(`https://itunes.apple.com/search?${q}`);
    if (!res.ok) { out.push({ keyword, country, rank: null, source: name, error: `HTTP ${res.status}` }); continue; }
    const json = await res.json();
    const idx = (json.results || []).findIndex((r) => String(r.trackId) === String(appId));
    out.push({ keyword, country, rank: idx === -1 ? null : idx + 1, results: json.resultCount, source: name, approximate: true });
  }
  return out;
}
