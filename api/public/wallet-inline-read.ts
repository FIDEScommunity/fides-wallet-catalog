import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";
import path from "path";

export default function handler(_req: VercelRequest, res: VercelResponse): void {
  const p = path.join(process.cwd(), "data", "aggregated.json");
  if (!fs.existsSync(p)) {
    res.status(200).json({ exists: false, cwd: process.cwd() });
    return;
  }
  const raw = fs.readFileSync(p, "utf-8");
  const j = JSON.parse(raw) as { wallets?: unknown[] };
  res.status(200).json({
    exists: true,
    count: j.wallets?.length ?? null,
  });
}
