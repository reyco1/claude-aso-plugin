// Local state: change log + rank snapshots, stored as JSONL in ASO_DATA_DIR (default ./.aso)
import fs from "node:fs";
import path from "node:path";

const dir = () => process.env.ASO_DATA_DIR || path.join(process.cwd(), ".aso");
const file = (name) => {
  fs.mkdirSync(dir(), { recursive: true });
  return path.join(dir(), name);
};

export function append(name, record) {
  const rec = { ts: new Date().toISOString(), ...record };
  fs.appendFileSync(file(name), JSON.stringify(rec) + "\n");
  return rec;
}

export function read(name, filter = () => true, limit = 200) {
  const f = file(name);
  if (!fs.existsSync(f)) return [];
  return fs.readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter(filter).slice(-limit);
}
