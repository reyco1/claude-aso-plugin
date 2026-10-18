// Load ./.env (or ASO_ENV_FILE) without overriding variables already set.
import fs from "node:fs";
import path from "node:path";

const f = process.env.ASO_ENV_FILE || path.join(process.cwd(), ".env");
if (fs.existsSync(f)) {
  for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    const v = m[2].replace(/^["']|["']$/g, "");
    if (process.env[m[1]] === undefined && v !== "") process.env[m[1]] = v;
  }
}
