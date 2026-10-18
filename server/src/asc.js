// Minimal App Store Connect API client (JWT ES256, JSON:API).
import crypto from "node:crypto";
import fs from "node:fs";

const BASE = "https://api.appstoreconnect.apple.com";
let cached = { token: null, exp: 0 };

function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function privateKey() {
  if (process.env.ASC_PRIVATE_KEY) return process.env.ASC_PRIVATE_KEY.replace(/\\n/g, "\n");
  if (process.env.ASC_PRIVATE_KEY_PATH) return fs.readFileSync(process.env.ASC_PRIVATE_KEY_PATH, "utf8");
  throw new Error("Missing ASC_PRIVATE_KEY_PATH (path to your .p8 key) or ASC_PRIVATE_KEY.");
}

export function ascConfigured() {
  return Boolean(process.env.ASC_KEY_ID && process.env.ASC_ISSUER_ID && (process.env.ASC_PRIVATE_KEY_PATH || process.env.ASC_PRIVATE_KEY));
}

function token() {
  const now = Math.floor(Date.now() / 1000);
  if (cached.token && cached.exp - now > 60) return cached.token;
  const { ASC_KEY_ID, ASC_ISSUER_ID } = process.env;
  if (!ASC_KEY_ID || !ASC_ISSUER_ID) throw new Error("Missing ASC_KEY_ID or ASC_ISSUER_ID.");
  const exp = now + 15 * 60;
  const header = b64url(JSON.stringify({ alg: "ES256", kid: ASC_KEY_ID, typ: "JWT" }));
  const payload = b64url(JSON.stringify({ iss: ASC_ISSUER_ID, iat: now, exp, aud: "appstoreconnect-v1" }));
  const sig = crypto.sign("sha256", Buffer.from(`${header}.${payload}`), { key: privateKey(), dsaEncoding: "ieee-p1363" });
  cached = { token: `${header}.${payload}.${b64url(sig)}`, exp };
  return cached.token;
}

export async function asc(method, path, body) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const detail = json?.errors?.map((e) => `${e.title}: ${e.detail}`).join(" | ") || text;
    throw new Error(`ASC ${method} ${path} -> ${res.status}: ${detail}`);
  }
  return json;
}

const flat = (r) => ({ id: r.id, type: r.type, ...r.attributes });

export async function listApps() {
  const r = await asc("GET", "/v1/apps?limit=200&fields[apps]=name,bundleId,sku,primaryLocale");
  return r.data.map(flat);
}

export async function getListing(appId) {
  const infos = await asc("GET", `/v1/apps/${appId}/appInfos?limit=5`);
  const appInfos = [];
  for (const info of infos.data) {
    const locs = await asc("GET", `/v1/appInfos/${info.id}/appInfoLocalizations?limit=50`);
    appInfos.push({ ...flat(info), localizations: locs.data.map(flat) });
  }
  const versions = await asc("GET", `/v1/apps/${appId}/appStoreVersions?limit=3&filter[platform]=IOS`);
  const appStoreVersions = [];
  for (const v of versions.data) {
    const locs = await asc("GET", `/v1/appStoreVersions/${v.id}/appStoreVersionLocalizations?limit=50`);
    appStoreVersions.push({ ...flat(v), localizations: locs.data.map(flat) });
  }
  return { appId, appInfos, appStoreVersions };
}

export async function updateAppInfoLocalization(id, attributes) {
  const r = await asc("PATCH", `/v1/appInfoLocalizations/${id}`, { data: { type: "appInfoLocalizations", id, attributes } });
  return flat(r.data);
}

export async function createAppInfoLocalization(appInfoId, attributes) {
  const r = await asc("POST", "/v1/appInfoLocalizations", {
    data: { type: "appInfoLocalizations", attributes, relationships: { appInfo: { data: { type: "appInfos", id: appInfoId } } } },
  });
  return flat(r.data);
}

export async function updateVersionLocalization(id, attributes) {
  const r = await asc("PATCH", `/v1/appStoreVersionLocalizations/${id}`, { data: { type: "appStoreVersionLocalizations", id, attributes } });
  return flat(r.data);
}

export async function createVersionLocalization(versionId, attributes) {
  const r = await asc("POST", "/v1/appStoreVersionLocalizations", {
    data: { type: "appStoreVersionLocalizations", attributes, relationships: { appStoreVersion: { data: { type: "appStoreVersions", id: versionId } } } },
  });
  return flat(r.data);
}

export async function createVersion(appId, versionString, platform = "IOS") {
  const r = await asc("POST", "/v1/appStoreVersions", {
    data: { type: "appStoreVersions", attributes: { platform, versionString }, relationships: { app: { data: { type: "apps", id: appId } } } },
  });
  return flat(r.data);
}

export async function listReviews(appId, { limit = 50, rating, territory } = {}) {
  const q = new URLSearchParams({ sort: "-createdDate", limit: String(limit), include: "response" });
  if (rating) q.set("filter[rating]", String(rating));
  if (territory) q.set("filter[territory]", territory);
  const r = await asc("GET", `/v1/apps/${appId}/customerReviews?${q}`);
  const responses = new Map((r.included || []).map((i) => [i.id, i.attributes]));
  return r.data.map((rev) => ({
    ...flat(rev),
    response: rev.relationships?.response?.data ? responses.get(rev.relationships.response.data.id) || true : null,
  }));
}

export async function respondToReview(reviewId, responseBody) {
  const r = await asc("POST", "/v1/customerReviewResponses", {
    data: { type: "customerReviewResponses", attributes: { responseBody }, relationships: { review: { data: { type: "customerReviews", id: reviewId } } } },
  });
  return flat(r.data);
}

export async function listScreenshotSets(versionLocalizationId) {
  const r = await asc("GET", `/v1/appStoreVersionLocalizations/${versionLocalizationId}/appScreenshotSets?include=appScreenshots&limit=50`);
  const shots = new Map((r.included || []).map((i) => [i.id, flat(i)]));
  return r.data.map((s) => ({
    ...flat(s),
    screenshots: (s.relationships?.appScreenshots?.data || []).map((d) => shots.get(d.id)),
  }));
}

export async function uploadScreenshot(versionLocalizationId, displayType, filePath) {
  const sets = await listScreenshotSets(versionLocalizationId);
  let set = sets.find((s) => s.screenshotDisplayType === displayType);
  if (!set) {
    const r = await asc("POST", "/v1/appScreenshotSets", {
      data: {
        type: "appScreenshotSets",
        attributes: { screenshotDisplayType: displayType },
        relationships: { appStoreVersionLocalization: { data: { type: "appStoreVersionLocalizations", id: versionLocalizationId } } },
      },
    });
    set = flat(r.data);
  }
  const file = fs.readFileSync(filePath);
  const fileName = filePath.split("/").pop();
  const reserve = await asc("POST", "/v1/appScreenshots", {
    data: {
      type: "appScreenshots",
      attributes: { fileName, fileSize: file.length },
      relationships: { appScreenshotSet: { data: { type: "appScreenshotSets", id: set.id } } },
    },
  });
  const shot = reserve.data;
  for (const op of shot.attributes.uploadOperations) {
    const headers = Object.fromEntries((op.requestHeaders || []).map((h) => [h.name, h.value]));
    const res = await fetch(op.url, { method: op.method, headers, body: file.subarray(op.offset, op.offset + op.length) });
    if (!res.ok) throw new Error(`Screenshot chunk upload failed: ${res.status}`);
  }
  const checksum = crypto.createHash("md5").update(file).digest("hex");
  const done = await asc("PATCH", `/v1/appScreenshots/${shot.id}`, {
    data: { type: "appScreenshots", id: shot.id, attributes: { uploaded: true, sourceFileChecksum: checksum } },
  });
  return { setId: set.id, ...flat(done.data) };
}
