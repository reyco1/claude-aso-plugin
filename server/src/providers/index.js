// Provider registry. Enable with ASO_PROVIDERS="apptweak,csv,itunes" (default: every configured provider).
// Appfigures: use its official MCP server alongside this plugin (see README); the skill knows how to use it.
import * as apptweak from "./apptweak.js";
import * as csv from "./csv.js";
import * as itunes from "./itunes.js";

const ALL = { apptweak, csv, itunes };

export function active() {
  const wanted = (process.env.ASO_PROVIDERS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const list = wanted.length ? wanted.map((w) => ALL[w]).filter(Boolean) : Object.values(ALL);
  return list.filter((p) => p.configured());
}

export function status() {
  return Object.values(ALL).map((p) => ({ provider: p.name, configured: p.configured(), metrics: Boolean(p.metrics), ranks: Boolean(p.ranks) }));
}

async function fanOut(fn, args) {
  const results = [];
  const errors = [];
  for (const p of active().filter((p) => p[fn])) {
    try { results.push(...(await p[fn](args))); } catch (e) { errors.push({ provider: p.name, error: String(e.message || e) }); }
  }
  return { results, errors };
}

export const metrics = (args) => fanOut("metrics", args);
export const ranks = (args) => fanOut("ranks", args);
