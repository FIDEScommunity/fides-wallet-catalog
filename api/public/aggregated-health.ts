import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadAggregatedDataSync } from "../lib/walletPublicApi";

/**
 * Temporary diagnostic: verifies aggregated.json resolution on the serverless runtime.
 * Remove once /api/public/wallet is stable on Vercel.
 */
export default function handler(_req: VercelRequest, res: VercelResponse): void {
  try {
    const data = loadAggregatedDataSync();
    res.status(200).json({
      ok: true,
      cwd: process.cwd(),
      walletCount: data?.wallets?.length ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, cwd: process.cwd(), message });
  }
}
