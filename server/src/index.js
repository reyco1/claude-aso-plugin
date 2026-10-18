#!/usr/bin/env node
import "./env.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as asc from "./asc.js";
import * as providers from "./providers/index.js";
import * as store from "./store.js";
import { validateMetadata } from "../../skills/aso/scripts/validate.mjs";

const server = new McpServer({ name: "aso", version: "0.1.0" });
const readOnly = () => process.env.ASO_READ_ONLY === "true";

const ok = (data) => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
const fail = (e) => ({ isError: true, content: [{ type: "text", text: String(e?.message || e) }] });
const wrap = (fn) => async (args) => { try { return ok(await fn(args)); } catch (e) { return fail(e); } };

// Every write: blocked in read-only mode, requires confirm:true, and is logged with before/after.
const write = (fn, logType) => wrap(async (args) => {
  if (readOnly()) throw new Error("ASO_READ_ONLY=true. Writes are disabled.");
  if (args.confirm !== true) throw new Error("Write not confirmed. Show the user the exact change, get explicit approval, then call again with confirm:true.");
  const result = await fn(args);
  store.append("changelog.jsonl", { type: logType, args: { ...args, confirm: undefined }, result });
  return result;
});
const confirm = z.boolean().optional().describe("Must be true. Only set after the user approved this exact change in chat.");

// ---------- Status ----------
server.tool("aso_status", "Show which integrations are configured (App Store Connect, keyword data providers) and whether writes are enabled.", {},
  wrap(async () => ({ appStoreConnect: asc.ascConfigured(), readOnly: readOnly(), providers: providers.status(), dataDir: process.env.ASO_DATA_DIR || "./.aso" })));

// ---------- Local validation ----------
server.tool("aso_validate_metadata", "Validate name/subtitle/keyword field against Apple limits and ASO rules (dupes, plurals, wasted chars, competitor terms, primary keyword placement). Run before proposing or applying any metadata.", {
  name: z.string().default(""), subtitle: z.string().default(""), keywords: z.string().default(""),
  primaryKeyword: z.string().optional(), competitorTerms: z.array(z.string()).optional(),
}, wrap(async (a) => validateMetadata(a)));

// ---------- Keyword data (pluggable) ----------
server.tool("aso_keyword_metrics", "Get popularity/volume and difficulty for keywords from every configured provider (AppTweak, CSV imports from Astro/Search Ads/etc). Scales differ by source; compare within a source.", {
  keywords: z.array(z.string()).min(1).max(50), country: z.string().default("us"), device: z.enum(["iphone", "ipad"]).default("iphone"),
}, wrap((a) => providers.metrics(a)));

server.tool("aso_keyword_ranks", "Get the app's search rank for keywords from configured providers. 'itunes' is a free approximation only.", {
  appId: z.string().describe("Apple numeric app ID"), keywords: z.array(z.string()).min(1).max(50), country: z.string().default("us"),
  snapshot: z.boolean().default(true).describe("Save results to .aso/ranks.jsonl for trend tracking"),
}, wrap(async (a) => {
  const r = await providers.ranks(a);
  if (a.snapshot) for (const row of r.results) store.append("ranks.jsonl", { appId: a.appId, ...row });
  return r;
}));

server.tool("aso_history", "Read the local change log and rank snapshots for an app, to attribute rank changes to listing edits.", {
  appId: z.string().optional(), kind: z.enum(["changes", "ranks", "both"]).default("both"), limit: z.number().default(200),
}, wrap(async ({ appId, kind, limit }) => {
  const match = (r) => !appId || JSON.stringify(r).includes(appId);
  return {
    changes: kind !== "ranks" ? store.read("changelog.jsonl", match, limit) : undefined,
    ranks: kind !== "changes" ? store.read("ranks.jsonl", match, limit) : undefined,
  };
}));

server.tool("aso_log_note", "Record a manual event in the change log (e.g. 'new screenshots live', 'featured', 'price change') so it shows up in attribution.", {
  appId: z.string(), note: z.string(),
}, wrap(async (a) => store.append("changelog.jsonl", { type: "note", ...a })));

// ---------- App Store Connect: read ----------
server.tool("asc_list_apps", "List apps in the App Store Connect account.", {}, wrap(() => asc.listApps()));

server.tool("asc_get_listing", "Get the full listing for an app: app info localizations (name, subtitle) and recent versions with localizations (keywords, description, promotional text, what's new) and their editable state.", {
  appId: z.string(),
}, wrap(({ appId }) => asc.getListing(appId)));

server.tool("asc_list_reviews", "List customer reviews (newest first) with any existing developer response.", {
  appId: z.string(), limit: z.number().max(200).default(50), rating: z.number().min(1).max(5).optional(), territory: z.string().optional(),
}, wrap(({ appId, ...o }) => asc.listReviews(appId, o)));

server.tool("asc_list_screenshots", "List screenshot sets and screenshots for a version localization.", {
  versionLocalizationId: z.string(),
}, wrap(({ versionLocalizationId }) => asc.listScreenshotSets(versionLocalizationId)));

server.tool("asc_get", "Read-only escape hatch: GET any App Store Connect API path (e.g. /v1/apps/{id}/appStoreVersionExperimentsV2, analytics report requests).", {
  path: z.string().regex(/^\/v\d+\//),
}, wrap(({ path }) => asc.asc("GET", path)));

// ---------- App Store Connect: write (approval gated) ----------
server.tool("asc_update_name_subtitle", "Update app name and/or subtitle for one locale (appInfoLocalization). Usually only editable while a new version is being prepared. Requires confirm:true.", {
  appInfoLocalizationId: z.string(), name: z.string().max(30).optional(), subtitle: z.string().max(30).optional(), confirm,
}, write(({ appInfoLocalizationId, name, subtitle }) => asc.updateAppInfoLocalization(appInfoLocalizationId, Object.fromEntries(Object.entries({ name, subtitle }).filter(([, v]) => v !== undefined))), "update_name_subtitle"));

server.tool("asc_update_version_text", "Update keywords, description, promotional text, or what's new for one version localization. Keywords/description need an editable version; promotional text can change anytime. Requires confirm:true.", {
  versionLocalizationId: z.string(), keywords: z.string().max(100).optional(), description: z.string().max(4000).optional(),
  promotionalText: z.string().max(170).optional(), whatsNew: z.string().max(4000).optional(), confirm,
}, write(({ versionLocalizationId, confirm: _c, ...attrs }) => asc.updateVersionLocalization(versionLocalizationId, Object.fromEntries(Object.entries(attrs).filter(([, v]) => v !== undefined))), "update_version_text"));

server.tool("asc_add_locale", "Add a new locale to the listing: creates the app info localization (name, subtitle) and the version localization (keywords, description). Requires confirm:true.", {
  appInfoId: z.string(), versionId: z.string(), locale: z.string().describe("e.g. en-GB, es-MX"),
  name: z.string().max(30), subtitle: z.string().max(30).optional(), keywords: z.string().max(100).optional(), description: z.string().max(4000), confirm,
}, write(async ({ appInfoId, versionId, locale, name, subtitle, keywords, description }) => ({
  appInfoLocalization: await asc.createAppInfoLocalization(appInfoId, { locale, name, subtitle }),
  versionLocalization: await asc.createVersionLocalization(versionId, { locale, keywords, description }),
}), "add_locale"));

server.tool("asc_create_version", "Create a new App Store version (needed to edit name/subtitle/keywords). Does NOT submit for review. Requires confirm:true.", {
  appId: z.string(), versionString: z.string(), platform: z.enum(["IOS", "MAC_OS", "TV_OS", "VISION_OS"]).default("IOS"), confirm,
}, write(({ appId, versionString, platform }) => asc.createVersion(appId, versionString, platform), "create_version"));

server.tool("asc_respond_review", "Post a public developer response to a customer review. Requires confirm:true.", {
  reviewId: z.string(), responseBody: z.string().max(5970), confirm,
}, write(({ reviewId, responseBody }) => asc.respondToReview(reviewId, responseBody), "respond_review"));

server.tool("asc_upload_screenshot", "Upload a screenshot file into a version localization's screenshot set for a display type (e.g. APP_IPHONE_67). Appends to the set. Requires confirm:true.", {
  versionLocalizationId: z.string(), displayType: z.string(), filePath: z.string(), confirm,
}, write(({ versionLocalizationId, displayType, filePath }) => asc.uploadScreenshot(versionLocalizationId, displayType, filePath), "upload_screenshot"));

await server.connect(new StdioServerTransport());
