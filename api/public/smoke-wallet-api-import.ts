import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadAggregatedDataSync } from "./walletPublicApi";

export default function handler(_req: VercelRequest, res: VercelResponse): void {
  const d = loadAggregatedDataSync();
  res.status(200).json({ n: d?.wallets?.length ?? null });
}
