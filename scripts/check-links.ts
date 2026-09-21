/**
 * Linkcheck script for wallet catalog.
 * Reads data/aggregated.json, collects all URLs from wallets + providers,
 * checks each unique URL with HEAD→GET fallback and retries, and writes
 * data/linkcheck-report.json + linkcheck-summary.md.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const AGGREGATED_PATH = join(process.cwd(), 'data/aggregated.json');
const REPORT_JSON_PATH = join(process.cwd(), 'data/linkcheck-report.json');
const REPORT_MD_PATH = join(process.cwd(), 'data/linkcheck-summary.md');
const REQUEST_TIMEOUT_MS = 12_000;
const DELAY_BETWEEN_REQUESTS_MS = 350;
const MAX_ATTEMPTS = 3;
const USER_AGENT =
  'Mozilla/5.0 (compatible; FIDES-Wallet-Catalog-Linkcheck/1.0; +https://fides.community)';
const SOFT_OK_STATUSES = new Set([401, 403]);
const RETRY_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

function isHttpUrl(s: string): boolean {
  return typeof s === 'string' && (s.startsWith('http://') || s.startsWith('https://'));
}

function addUrl(
  map: Map<string, { contexts: Array<{ itemId: string; field: string; providerName: string; providerEmail?: string }> }>,
  url: string,
  context: { itemId: string; field: string; providerName: string; providerEmail?: string }
) {
  const normalized = url.trim();
  if (!isHttpUrl(normalized)) return;
  const existing = map.get(normalized);
  if (existing) {
    if (!existing.contexts.some(c => c.itemId === context.itemId && c.field === context.field)) {
      existing.contexts.push(context);
    }
  } else {
    map.set(normalized, { contexts: [context] });
  }
}

interface WalletItem {
  id: string;
  provider: { name: string; contact?: { email?: string }; website?: string; logo?: string };
  website?: string;
  logo?: string;
  repository?: string;
  documentation?: string;
  media?: { videos?: string[]; images?: string[] };
  recognitions?: {
    customerStories?: Array<{ title: string; url?: string }>;
    certifications?: Array<{ title: string; url?: string }>;
    awardsAndRecognitions?: Array<{ title: string; url?: string }>;
  };
  additionalDocumentation?: Array<{ title: string; url?: string }>;
  appStoreLinks?: { iOS?: string; android?: string; web?: string };
}

interface AggregatedData {
  wallets: WalletItem[];
}

function collectWalletUrls(
  wallets: WalletItem[],
  urlToContexts: Map<string, { contexts: Array<{ itemId: string; field: string; providerName: string; providerEmail?: string }> }>
) {
  for (const w of wallets) {
    const providerName = w.provider?.name ?? 'Unknown';
    const providerEmail = w.provider?.contact?.email?.trim() || undefined;
    const ctx = (field: string) => ({ itemId: w.id, field, providerName, providerEmail });

    if (w.website) addUrl(urlToContexts, w.website, ctx('website'));
    if (w.logo) addUrl(urlToContexts, w.logo, ctx('logo'));
    if (w.repository) addUrl(urlToContexts, w.repository, ctx('repository'));
    if (w.documentation) addUrl(urlToContexts, w.documentation, ctx('documentation'));
    for (const url of w.media?.videos ?? []) {
      if (url) addUrl(urlToContexts, url, ctx('media.videos'));
    }
    for (const url of w.media?.images ?? []) {
      if (url) addUrl(urlToContexts, url, ctx('media.images'));
    }
    for (const group of [
      ...(w.recognitions?.customerStories ?? []),
      ...(w.recognitions?.certifications ?? []),
      ...(w.recognitions?.awardsAndRecognitions ?? []),
      ...(w.additionalDocumentation ?? []),
    ]) {
      if (group?.url) addUrl(urlToContexts, group.url, ctx('recognitions.url'));
    }
    if (w.appStoreLinks?.iOS) addUrl(urlToContexts, w.appStoreLinks.iOS, ctx('appStoreLinks.iOS'));
    if (w.appStoreLinks?.android) addUrl(urlToContexts, w.appStoreLinks.android, ctx('appStoreLinks.android'));
    if (w.appStoreLinks?.web) addUrl(urlToContexts, w.appStoreLinks.web, ctx('appStoreLinks.web'));
    if (w.provider?.website) addUrl(urlToContexts, w.provider.website, ctx('provider.website'));
    if (w.provider?.logo) addUrl(urlToContexts, w.provider.logo, ctx('provider.logo'));
    if (w.provider?.contact?.contactUrl) addUrl(urlToContexts, w.provider.contact.contactUrl, ctx('provider.contact.contactUrl'));
    if (w.provider?.contact?.bookMeetingUrl) addUrl(urlToContexts, w.provider.contact.bookMeetingUrl, ctx('provider.contact.bookMeetingUrl'));
  }
}

function shouldSkipUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (
      (parsed.hostname === 'www.google.com' || parsed.hostname === 'google.com') &&
      parsed.pathname === '/s2/favicons'
    ) {
      return 'Google favicon helper URLs are excluded (often flaky for automated checks).';
    }
  } catch {
    return 'Invalid URL.';
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithMethod(
  url: string,
  method: 'HEAD' | 'GET'
): Promise<{ ok: boolean; status: number; softOk: boolean }> {
  const headers: Record<string, string> = {
    'User-Agent': USER_AGENT,
    Accept: '*/*',
  };
  if (method === 'GET') headers.Range = 'bytes=0-0';

  const response = await fetch(url, {
    method,
    redirect: 'follow',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers,
  });

  const status = response.status;
  if (status >= 200 && status < 400) return { ok: true, status, softOk: false };
  if (SOFT_OK_STATUSES.has(status)) return { ok: true, status, softOk: true };
  return { ok: false, status, softOk: false };
}

function shouldRetryWithGetAfterHead(status: number | undefined): boolean {
  if (status === undefined) return true;
  return status === 400 || status === 403 || status === 404 || status === 405 || status === 406;
}

async function checkOnce(
  url: string
): Promise<{ ok: boolean; status?: number; error?: string; via?: string; softOk?: boolean }> {
  try {
    const head = await fetchWithMethod(url, 'HEAD');
    if (head.ok) return { ok: true, status: head.status, via: 'HEAD', softOk: head.softOk };
    if (!shouldRetryWithGetAfterHead(head.status)) {
      return { ok: false, status: head.status, error: `HTTP ${head.status}`, via: 'HEAD' };
    }
    const get = await fetchWithMethod(url, 'GET');
    if (get.ok) return { ok: true, status: get.status, via: 'GET', softOk: get.softOk };
    return {
      ok: false,
      status: get.status,
      error: `HTTP ${get.status} (HEAD was ${head.status})`,
      via: 'GET',
    };
  } catch (error) {
    const headError = error instanceof Error ? error.message : String(error);
    try {
      const get = await fetchWithMethod(url, 'GET');
      if (get.ok) return { ok: true, status: get.status, via: 'GET', softOk: get.softOk };
      return {
        ok: false,
        status: get.status,
        error: `${headError}; GET HTTP ${get.status}`,
        via: 'GET',
      };
    } catch (getError) {
      const message = getError instanceof Error ? getError.message : String(getError);
      return { ok: false, error: `${headError}; GET: ${message}` };
    }
  }
}

async function checkUrl(
  url: string
): Promise<{ ok: boolean; status?: number; error?: string; via?: string; softOk?: boolean }> {
  let last:
    | { ok: boolean; status?: number; error?: string; via?: string; softOk?: boolean }
    | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    last = await checkOnce(url);
    if (last.ok) return last;

    const retryable =
      last.status === undefined || (last.status !== undefined && RETRY_STATUSES.has(last.status));
    if (!retryable || attempt === MAX_ATTEMPTS) {
      if (last.status === 429 || last.status === 503) {
        return { ok: true, status: last.status, via: last.via, softOk: true };
      }
      return last;
    }
    await sleep(800 * attempt);
  }

  return last ?? { ok: false, error: 'Unknown error' };
}

interface LinkContext {
  itemId: string;
  field: string;
  providerName: string;
  providerEmail?: string;
}

interface BrokenEntry {
  url: string;
  status?: number;
  error: string;
  via?: string;
  contexts: LinkContext[];
}

interface ByProviderEntry {
  email?: string;
  brokenUrls: Array<{ url: string; error: string; status?: number }>;
}

interface LinkcheckReport {
  runAt: string;
  totalCatalogUrls: number;
  skippedCount: number;
  skipped?: Array<{ url: string; reason: string }>;
  softOkCount: number;
  softOk?: Array<{ url: string; status: number }>;
  totalUrls: number;
  brokenCount: number;
  broken: BrokenEntry[];
  byProvider: Record<string, ByProviderEntry>;
}

async function main() {
  const raw = readFileSync(AGGREGATED_PATH, 'utf-8');
  const data: AggregatedData = JSON.parse(raw);
  const wallets = data.wallets ?? [];

  const urlToContexts = new Map<string, { contexts: LinkContext[] }>();
  collectWalletUrls(wallets, urlToContexts);

  const skipped: Array<{ url: string; reason: string }> = [];
  const uniqueUrls: string[] = [];
  for (const url of urlToContexts.keys()) {
    const reason = shouldSkipUrl(url);
    if (reason) {
      skipped.push({ url, reason });
    } else {
      uniqueUrls.push(url);
    }
  }

  const totalCatalogUrls = urlToContexts.size;
  const totalUrls = uniqueUrls.length;
  console.log(`Checking ${totalUrls} unique URL(s) (${skipped.length} skipped)...`);

  const broken: BrokenEntry[] = [];
  const softOk: Array<{ url: string; status: number }> = [];
  let checked = 0;
  for (const url of uniqueUrls) {
    const result = await checkUrl(url);
    if (result.ok && result.softOk && result.status !== undefined) {
      softOk.push({ url, status: result.status });
    } else if (!result.ok) {
      const entry = urlToContexts.get(url)!;
      broken.push({
        url,
        status: result.status,
        error: result.error ?? 'Unknown error',
        via: result.via,
        contexts: entry.contexts,
      });
    }
    checked++;
    if (checked % 50 === 0) console.log(`  ${checked}/${totalUrls}`);
    await sleep(DELAY_BETWEEN_REQUESTS_MS);
  }

  const byProvider: Record<string, ByProviderEntry> = {};
  for (const b of broken) {
    for (const ctx of b.contexts) {
      const name = ctx.providerName;
      if (!byProvider[name]) {
        byProvider[name] = { email: ctx.providerEmail, brokenUrls: [] };
      } else if (ctx.providerEmail && !byProvider[name].email) {
        byProvider[name].email = ctx.providerEmail;
      }
      const exists = byProvider[name].brokenUrls.some((u) => u.url === b.url);
      if (!exists) {
        byProvider[name].brokenUrls.push({
          url: b.url,
          error: b.error,
          status: b.status,
        });
      }
    }
  }

  const report: LinkcheckReport = {
    runAt: new Date().toISOString(),
    totalCatalogUrls,
    skippedCount: skipped.length,
    skipped: skipped.length > 0 ? skipped : undefined,
    softOkCount: softOk.length,
    softOk: softOk.length > 0 ? softOk : undefined,
    totalUrls,
    brokenCount: broken.length,
    broken,
    byProvider,
  };

  writeFileSync(REPORT_JSON_PATH, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`Report written to ${REPORT_JSON_PATH}`);

  let md = `# Wallet catalog linkcheck – ${report.runAt.slice(0, 10)}\n\n`;
  md += `- **Catalog URLs collected:** ${totalCatalogUrls}\n`;
  if (skipped.length > 0) md += `- **Skipped (excluded):** ${skipped.length}\n`;
  md += `- **URLs checked:** ${totalUrls}\n`;
  if (softOk.length > 0) {
    md += `- **Soft-OK (401/403/429/503 soft):** ${softOk.length}\n`;
  }
  md += `- **Broken:** ${broken.length}\n\n`;
  if (broken.length > 0) {
    md += `## Broken links by provider\n\n`;
    for (const [providerName, entry] of Object.entries(byProvider)) {
      md += `### ${providerName}\n`;
      if (entry.email) md += `Contact: ${entry.email}\n\n`;
      for (const u of entry.brokenUrls) {
        md += `- ${u.url} — ${u.error}\n`;
      }
      md += `\n`;
    }
  }
  writeFileSync(REPORT_MD_PATH, md, 'utf-8');
  console.log(`Summary written to ${REPORT_MD_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
