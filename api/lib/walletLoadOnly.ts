import fs from "fs";
import path from "path";
import type { AggregatedCatalog } from "../types/wallet";

export function loadAggregatedDataSync(): AggregatedCatalog | null {
  const candidates = [
    path.join(process.cwd(), "api", "lib", "aggregated.deploy.json"),
    path.join(process.cwd(), "data", "aggregated.json"),
  ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    try {
      const raw = fs.readFileSync(p, "utf-8");
      return JSON.parse(raw) as AggregatedCatalog;
    } catch {
      return null;
    }
  }
  return null;
}
