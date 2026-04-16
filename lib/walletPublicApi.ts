/**
 * Shared logic for the wallet catalog HTTP API (local Express + Vercel serverless).
 */

import fs from "fs";
import path from "path";
import type {
  AggregatedCatalog,
  NormalizedWallet,
  WalletFilters,
  WalletCapability,
  InteroperabilityProfile,
  CredentialFormat,
  Platform,
  WalletStatus,
  WalletType,
} from "../src/types/wallet";

export const AGGREGATED_JSON = path.join(process.cwd(), "data", "aggregated.json");

let cache: AggregatedCatalog | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60_000;

export function loadAggregatedDataSync(): AggregatedCatalog | null {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_TTL_MS) {
    return cache;
  }
  try {
    const raw = fs.readFileSync(AGGREGATED_JSON, "utf-8");
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

export function parseWalletFiltersFromQuery(q: {
  [key: string]: string | string[] | undefined;
}): WalletFilters {
  const search =
    typeof q.search === "string" ? q.search : undefined;
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

export function filterWallets(
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

export function paginateWallets(
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

export function parsePagination(q: {
  [key: string]: string | string[] | undefined;
}): { page: number; size: number } {
  return {
    page: toPageNumber(q.page, 0),
    size: Math.min(200, Math.max(1, toPageNumber(q.size, 20))),
  };
}

export function parseSort(q: {
  [key: string]: string | string[] | undefined;
}): { field: string; desc: boolean } {
  const sort =
    typeof q.sort === "string" && q.sort ? q.sort : "displayName";
  const desc =
    typeof q.direction === "string" && q.direction.toLowerCase() === "desc";
  return { field: sort, desc };
}

export function sortWallets(
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
