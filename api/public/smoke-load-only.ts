import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadAggregatedDataSync } from "../lib/walletLoadOnly";

export default function handler(_req: VercelRequest, res: VercelResponse): void {
  const data = loadAggregatedDataSync();
  const wallets = data?.wallets as unknown[] | undefined;
  res.status(200).json({ count: wallets?.length ?? null });
}
