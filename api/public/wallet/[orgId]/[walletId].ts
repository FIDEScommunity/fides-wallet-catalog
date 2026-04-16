import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadAggregatedDataSync } from "../../../lib/walletPublicApi";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    res.status(405).json({
      message: "Method not allowed",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const orgRaw = req.query.orgId;
  const walletIdRaw = req.query.walletId;
  const orgId = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;
  const walletId = Array.isArray(walletIdRaw) ? walletIdRaw[0] : walletIdRaw;

  if (typeof orgId !== "string" || typeof walletId !== "string") {
    res.status(400).json({
      message: "Missing orgId or walletId route params",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const data = loadAggregatedDataSync();
  if (!data) {
    res.status(503).json({
      message: "Aggregated catalog not available",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const decodedOrg = decodeURIComponent(orgId);
  const wallet = data.wallets.find(
    (w) => w.orgId === decodedOrg && w.id === walletId,
  );

  if (!wallet) {
    res.status(404).json({
      message: "Wallet not found",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(200).json(wallet);
}
