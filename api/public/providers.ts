import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadAggregatedDataSync } from "../../lib/walletPublicApi";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
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

  const data = loadAggregatedDataSync();
  if (!data) {
    res.status(503).json({
      message: "Aggregated catalog not available",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(200).json({
    providers: data.providers,
    total: data.providers.length,
  });
}
