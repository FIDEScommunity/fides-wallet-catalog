/**
 * Wallet list — logic inlined for Vercel (see lib/walletPublicApi.ts for Express; keep in sync).
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";
import path from "path";
import type {
  AggregatedCatalog,
  CredentialFormat,
  InteroperabilityProfile,
  NormalizedWallet,
  Platform,
  WalletCapability,
  WalletFilters,
  WalletStatus,
  WalletType,
} from "../../../lib/httpWalletTypes";

function resolveAggregatedJsonPath(): string | null {
  const candidates = [
    path.join(process.cwd(), "lib", "aggregated.deploy.json"),
    path.join(process.cwd(), "data", "aggregated.json"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

let cache: AggregatedCatalog | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60_000;

function loadAggregatedDataSync(): AggregatedCatalog | null {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_TTL_MS) {
    return cache;
  }
  const file = resolveAggregatedJsonPath();
  if (!file) return null;
  try {
    const raw = fs.readFileSync(file, "utf-8");
    cache = JSON.parse(raw) as AggregatedCatalog;
    cacheTime = now;
    return cache;
  } catch {
    return null;
  }
}

function splitComma(val: unknown): string[] | undefined {
  if (typeof val !== "string" || !val.trim()) return undefined;
  return val.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseWalletFiltersFromQuery(q: {
  [key: string]: string | string[] | undefined;
}): WalletFilters {
  const search = typeof q.search === "string" ? q.search : undefined;
  const openSourceRaw = q.openSource;
  const openSource =
    openSourceRaw === "true"
      ? true
      : openSourceRaw === "false"
        ? false
        : undefined;

  const type = splitComma(q.type) as WalletType[] | undefined;
  const platforms = splitComma(q.platforms) as Platform[] | undefined;
  const credentialFormats = splitComma(q.credentialFormats) as
    | CredentialFormat[]
    | undefined;
  const status = splitComma(q.status) as WalletStatus[] | undefined;
  const capabilities = splitComma(q.capabilities) as
    | WalletCapability[]
    | undefined;
  const interoperabilityProfiles = splitComma(
    q.interoperabilityProfiles,
  ) as InteroperabilityProfile[] | undefined;
  const protocols = splitComma(q.protocols);
  const orgId =
    typeof q.orgId === "string" && q.orgId.trim() ? q.orgId.trim() : undefined;

  return {
    search,
    orgId,
    type,
    platforms,
    credentialFormats,
    openSource,
    status,
    capabilities,
    interoperabilityProfiles,
    protocols,
  };
}

function filterWallets(
  wallets: NormalizedWallet[],
  filters: WalletFilters,
): NormalizedWallet[] {
  return wallets.filter((wallet) => {
    if (filters.orgId && wallet.orgId !== filters.orgId) {
      return false;
    }

    if (filters.search) {
      const s = filters.search.toLowerCase();
      const matches =
        wallet.name.toLowerCase().includes(s) ||
        wallet.description?.toLowerCase().includes(s) ||
        wallet.provider.name.toLowerCase().includes(s) ||
        wallet.id.toLowerCase().includes(s);
      if (!matches) return false;
    }

    if (filters.type?.length) {
      if (!filters.type.includes(wallet.type)) return false;
    }

    if (filters.platforms?.length) {
      const ok = filters.platforms.some((p) =>
        wallet.platforms?.includes(p),
      );
      if (!ok) return false;
    }

    if (filters.credentialFormats?.length) {
      const ok = filters.credentialFormats.some((f) =>
        wallet.credentialFormats?.includes(f),
      );
      if (!ok) return false;
    }

    if (filters.openSource !== undefined) {
      if (wallet.openSource !== filters.openSource) return false;
    }

    if (filters.status?.length) {
      if (!wallet.status || !filters.status.includes(wallet.status)) {
        return false;
      }
    }

    if (filters.capabilities?.length) {
      const ok = filters.capabilities.some((c) =>
        wallet.capabilities?.includes(c),
      );
      if (!ok) return false;
    }

    if (filters.interoperabilityProfiles?.length) {
      const ok = filters.interoperabilityProfiles.some((p) =>
        wallet.interoperabilityProfiles?.includes(p),
      );
      if (!ok) return false;
    }

    if (filters.protocols?.length) {
      const issuance = wallet.issuanceProtocols ?? [];
      const presentation = wallet.presentationProtocols ?? [];
      const allProto: string[] = [...issuance, ...presentation];
      const ok = filters.protocols.some((p) => allProto.includes(p));
      if (!ok) return false;
    }

    return true;
  });
}

function toPageNumber(val: unknown, fallback: number): number {
  const n = Number(val);
  return Number.isNaN(n) || n < 0 ? fallback : Math.floor(n);
}

function paginateWallets(
  wallets: NormalizedWallet[],
  page: number,
  size: number,
): {
  content: NormalizedWallet[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
} {
  const totalElements = wallets.length;
  const totalPages = size > 0 ? Math.ceil(totalElements / size) : 0;
  const start = page * size;
  const content = wallets.slice(start, start + size);
  return {
    content,
    totalElements,
    totalPages,
    number: page,
    size,
  };
}

function parsePagination(q: {
  [key: string]: string | string[] | undefined;
}): { page: number; size: number } {
  return {
    page: toPageNumber(q.page, 0),
    size: Math.min(200, Math.max(1, toPageNumber(q.size, 20))),
  };
}

function parseSort(q: {
  [key: string]: string | string[] | undefined;
}): { field: string; desc: boolean } {
  const sort =
    typeof q.sort === "string" && q.sort ? q.sort : "displayName";
  const desc =
    typeof q.direction === "string" && q.direction.toLowerCase() === "desc";
  return { field: sort, desc };
}

function sortWallets(
  wallets: NormalizedWallet[],
  field: string,
  desc: boolean,
): void {
  const dir = desc ? -1 : 1;
  wallets.sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case "id":
        cmp = a.id.localeCompare(b.id);
        break;
      case "orgId":
        cmp = a.orgId.localeCompare(b.orgId);
        break;
      case "name":
      case "displayName":
        cmp = a.name.localeCompare(b.name);
        break;
      case "status":
        cmp = (a.status ?? "").localeCompare(b.status ?? "");
        break;
      case "updatedAt":
        cmp = (a.updatedAt ?? "").localeCompare(b.updatedAt ?? "");
        break;
      default:
        cmp = a.name.localeCompare(b.name);
    }
    return cmp * dir;
  });
}

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
