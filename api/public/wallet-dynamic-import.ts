import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const mod = await import("./lib/walletPublicApi");
  const data = mod.loadAggregatedDataSync();
  res.status(200).json({ n: data?.wallets?.length ?? null });
}
