import fs from "fs";
import path from "path";

/** Minimal loader to isolate module-load failures on Vercel. */
export function loadAggregatedDataSync(): unknown | null {
  const p = path.join(process.cwd(), "data", "aggregated.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}
