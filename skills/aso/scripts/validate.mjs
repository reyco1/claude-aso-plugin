// App Store metadata validator. Pure functions, no dependencies.
// CLI: node validate-cli.mjs '{"name":"...","subtitle":"...","keywords":"a,b,c"}'

export const LIMITS = { name: 30, subtitle: 30, keywords: 100, promotionalText: 170 };

const LOW_VALUE = new Set(["app", "apps", "free", "the", "and", "for", "a", "an", "of", "with", "your", "my", "best"]);
const RISKY_IN_NAME = ["free", "#1", "best", "top", "sale", "discount", "new"];

const len = (s = "") => [...s].length;
const words = (s = "") =>
  s.toLowerCase().split(/[^\p{L}\p{N}']+/u).filter(Boolean);

function pluralForms(w) {
  const out = new Set([w + "s", w + "es"]);
  if (w.endsWith("y")) out.add(w.slice(0, -1) + "ies");
  return out;
}

export function validateMetadata({
  name = "",
  subtitle = "",
  keywords = "",
  primaryKeyword = "",
  competitorTerms = [],
} = {}) {
  const errors = [];
  const warnings = [];

  for (const [field, value] of Object.entries({ name, subtitle, keywords })) {
    const n = len(value);
    if (n > LIMITS[field]) errors.push(`${field} is ${n} chars (limit ${LIMITS[field]}).`);
  }

  const nameWords = words(name);
  const subWords = words(subtitle);
  const metaWords = new Set([...nameWords, ...subWords]);

  // Name vs subtitle duplicates (Apple indexes them as one string)
  const dupNameSub = subWords.filter((w) => nameWords.includes(w) && !LOW_VALUE.has(w));
  if (dupNameSub.length)
    warnings.push(`Repeated between name and subtitle: ${[...new Set(dupNameSub)].join(", ")}. Wasted indexing space.`);

  // Keyword field rules
  const terms = keywords.split(",").map((t) => t.trim()).filter(Boolean);
  if (/\s,|,\s/.test(keywords)) errors.push("Keyword field has spaces around commas. Use 'a,b,c'.");
  const spaced = terms.filter((t) => /\s/.test(t));
  if (spaced.length)
    warnings.push(`Multi-word terms in keyword field: ${spaced.join(" | ")}. Apple combines single words across fields, so split them to save characters.`);

  const kwWords = terms.flatMap((t) => words(t));
  const seen = new Set();
  const dupKw = new Set();
  for (const w of kwWords) (seen.has(w) ? dupKw : seen).add(w);
  if (dupKw.size) errors.push(`Duplicate words in keyword field: ${[...dupKw].join(", ")}.`);

  const repeatsMeta = [...seen].filter((w) => metaWords.has(w));
  if (repeatsMeta.length)
    errors.push(`Keyword field repeats words already in name/subtitle: ${repeatsMeta.join(", ")}.`);

  const all = new Set([...seen, ...metaWords]);
  const pluralDupes = [];
  for (const w of all) for (const p of pluralForms(w)) if (all.has(p)) pluralDupes.push(`${w}/${p}`);
  if (pluralDupes.length)
    warnings.push(`Singular and plural both present: ${pluralDupes.join(", ")}. Keep one.`);

  const low = [...seen].filter((w) => LOW_VALUE.has(w));
  if (low.length) warnings.push(`Low-value words in keyword field: ${low.join(", ")}.`);

  const comp = competitorTerms.map((c) => c.toLowerCase()).filter(Boolean);
  const hits = comp.filter((c) => `${name} ${subtitle} ${keywords}`.toLowerCase().includes(c));
  if (hits.length)
    errors.push(`Competitor/brand terms found: ${hits.join(", ")}. Risk of rejection under guideline 2.3.7.`);

  const risky = RISKY_IN_NAME.filter((r) => nameWords.includes(r.replace("#", "")) || name.toLowerCase().includes(r));
  if (risky.length) warnings.push(`Name contains promotional terms (${risky.join(", ")}). Apple may reject (2.3.7).`);

  if (primaryKeyword) {
    const pk = primaryKeyword.toLowerCase().trim();
    if (!name.toLowerCase().includes(pk)) errors.push(`Primary keyword "${primaryKeyword}" is not in the app name.`);
    else if (!name.toLowerCase().startsWith(pk))
      warnings.push(`Primary keyword is in the name but not first. Indie apps usually lead with it ("Keyword - Brand").`);
  }

  const kwLen = len(keywords);
  if (kwLen < 90) warnings.push(`Keyword field uses ${kwLen}/100 chars. Fill it.`);
  if (len(subtitle) < 20) warnings.push(`Subtitle uses ${len(subtitle)}/30 chars.`);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      name: `${len(name)}/${LIMITS.name}`,
      subtitle: `${len(subtitle)}/${LIMITS.subtitle}`,
      keywords: `${kwLen}/${LIMITS.keywords}`,
      uniqueIndexedWords: all.size,
    },
  };
}
