import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  loadAggregatedDataSync,
  parseWalletFiltersFromQuery,
  filterWallets,
  sortWallets,
  parsePagination,
  parseSort,
  paginateWallets,
} from "../../lib/walletPublicApi";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  try {
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

    const data = loadAggregatedDataSync();
    if (!data) {
      res.status(503).json({
        message: "Aggregated catalog not available",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const q = req.query as Record<string, string | string[] | undefined>;
    const filters = parseWalletFiltersFromQuery(q);
    let list = filterWallets(data.wallets, filters);
    const { field, desc } = parseSort(q);
    sortWallets(list, field, desc);
    const { page, size } = parsePagination(q);
    const paged = paginateWallets(list, page, size);

    res.status(200).json({
      ...paged,
      lastUpdated: data.lastUpdated,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    res.status(500).json({
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
