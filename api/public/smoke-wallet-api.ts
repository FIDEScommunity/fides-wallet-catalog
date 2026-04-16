import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadAggregatedDataSync } from "../lib/walletPublicApi";

/** Diagnostic: remove after wallet list works on Vercel. */
export default function handler(_req: VercelRequest, res: VercelResponse): void {
  const data = loadAggregatedDataSync();
  res.status(200).json({
    ok: true,
    count: data?.wallets?.length ?? null,
  });
}
