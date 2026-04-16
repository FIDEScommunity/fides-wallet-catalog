import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadAggregatedDataSync } from "./lib/aggregatedLoad";

export default function handler(_req: VercelRequest, res: VercelResponse): void {
  const data = loadAggregatedDataSync() as { wallets?: unknown[] } | null;
  res.status(200).json({ n: data?.wallets?.length ?? null });
}
