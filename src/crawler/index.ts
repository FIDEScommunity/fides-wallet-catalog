/**
 * FIDES Wallet Catalog Crawler
 * 
 * This script crawls wallet catalogs from multiple sources:
 * 1. Local examples (for development)
 * 2. GitHub repository (community-contributed catalogs)
 * 3. DID documents (provider-hosted catalogs)
 * 
 * In production this would run periodically (e.g. via cron job).
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { hostname } from 'os';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import type { 
  WalletCatalog, 
  NormalizedWallet, 
  AggregatedCatalog, 
  RegistryEntry,
  WalletType,
  Platform,
  WalletProvider
} from '../types/wallet.js';

// Load schema
const schemaPath = path.join(process.cwd(), 'schemas/wallet-catalog.schema.json');
const schema = JSON.parse(await fs.readFile(schemaPath, 'utf-8'));

// Setup validator (using AJV 2020 for Draft 2020-12 support)
const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validateCatalog = ajv.compile(schema);

// Configuration
const CONFIG = {
  // Community catalogs directory - all wallet catalogs are stored here
  communityCatalogsDir: path.join(process.cwd(), 'community-catalogs'),
  
  // GitHub repository for community-contributed catalogs
  githubRepo: {
    enabled: true,
    owner: 'FIDEScommunity',
    repo: 'fides-wallet-catalog',
    branch: 'main',
    path: 'community-catalogs',
  },
  
  // DID Registry - list of DIDs to crawl (providers register here)
  didRegistryPath: path.join(process.cwd(), 'data/did-registry.json'),
  
  // Legacy registry file (for backwards compatibility)
  registryPath: path.join(process.cwd(), 'data/registry.json'),

  // Stable first-seen tracking (independent from provider-managed fields)
  walletHistoryStatePath: path.join(process.cwd(), 'data/wallet-history-state.json'),
  
  // Output file
  aggregatedPath: path.join(process.cwd(), 'data/aggregated.json'),
  wpPluginDataPath: path.join(process.cwd(), 'wordpress-plugin/fides-wallet-catalog/data/aggregated.json'),
};

const ORGANIZATION_CATALOG_URL =
  'https://raw.githubusercontent.com/FIDEScommunity/fides-organization-catalog/main/data/aggregated.json';
const ORGANIZATION_CATALOG_LOCAL_PATHS = [
  process.env.ORGANIZATION_CATALOG_AGGREGATED_PATH,
  path.join(process.cwd(), '..', 'organization-catalog', 'data', 'aggregated.json')
].filter(Boolean) as string[];

interface OrgCatalogEntry {
  id: string;
  name: string;
  identifiers?: { did?: string };
  website?: string;
  logoUri?: string;
  country?: string;
  contact?: { email?: string; support?: string };
  fidesManifestoSupporter?: boolean;
}

function isLocalDevHost(): boolean {
  const host = hostname();
  return host !== '' && (host.endsWith('.local') || host === 'localhost');
}

function orgEntryToWalletProvider(entry: OrgCatalogEntry, orgId: string): WalletProvider {
  const p: WalletProvider = { orgId, name: entry.name };
  if (entry.identifiers?.did) p.did = entry.identifiers.did;
  if (entry.website) p.website = entry.website;
  if (entry.logoUri) p.logo = entry.logoUri;
  if (entry.country) p.country = entry.country;
  if (entry.contact) p.contact = entry.contact;
  if (entry.fidesManifestoSupporter === true) p.fidesManifestoSupporter = true;
  return p;
}

async function loadOrganizationCatalogMap(): Promise<Map<string, OrgCatalogEntry>> {
  const tryParse = (raw: string): Map<string, OrgCatalogEntry> => {
    const data = JSON.parse(raw) as { organizations?: OrgCatalogEntry[] };
    const map = new Map<string, OrgCatalogEntry>();
    for (const o of data.organizations || []) {
      if (o?.id) map.set(o.id, o);
    }
    return map;
  };

  if (isLocalDevHost()) {
    for (const localPath of ORGANIZATION_CATALOG_LOCAL_PATHS) {
      if (localPath && existsSync(localPath)) {
        try {
          const raw = await fs.readFile(localPath, 'utf-8');
          const map = tryParse(raw);
          console.log(`Using local organization catalog (${localPath}), ${map.size} org(s)`);
          return map;
        } catch (e) {
          console.warn('Could not parse local organization catalog:', (e as Error).message);
        }
      }
    }
  }

  try {
    const res = await fetch(ORGANIZATION_CATALOG_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const map = tryParse(await res.text());
    console.log(`Using organization catalog from GitHub, ${map.size} org(s)`);
    return map;
  } catch (err) {
    console.warn('Could not fetch organization catalog:', (err as Error).message);
    for (const localPath of ORGANIZATION_CATALOG_LOCAL_PATHS) {
      if (localPath && existsSync(localPath)) {
        try {
          const raw = await fs.readFile(localPath, 'utf-8');
          const map = tryParse(raw);
          console.log(`Fallback local organization catalog (${localPath})`);
          return map;
        } catch (e) {
          console.warn('Could not parse local organization catalog:', (e as Error).message);
        }
      }
    }
    return new Map();
  }
}

function resolveWalletCatalogProvider(
  catalog: WalletCatalog,
  organizationById: Map<string, OrgCatalogEntry>
): WalletProvider | null {
  const entry = organizationById.get(catalog.orgId);
  if (!entry) return null;
  return orgEntryToWalletProvider(entry, catalog.orgId);
}

interface WalletHistoryEntry {
  firstSeenAt: string;
  lastSeenAt?: string;
  providerKey?: string;
  walletId?: string;
}

type WalletHistoryState = Record<string, WalletHistoryEntry>;
const gitLastCommitDateCache = new Map<string, string | null>();

/**
 * Load stable wallet history state (firstSeen tracking)
 */
async function loadWalletHistoryState(): Promise<WalletHistoryState> {
  try {
    const data = await fs.readFile(CONFIG.walletHistoryStatePath, 'utf-8');
    const parsed = JSON.parse(data) as WalletHistoryState;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

/**
 * Save stable wallet history state
 */
async function saveWalletHistoryState(state: WalletHistoryState): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG.walletHistoryStatePath), { recursive: true });
  await fs.writeFile(CONFIG.walletHistoryStatePath, JSON.stringify(state, null, 2));
}

/**
 * Normalize potentially non-ISO date-like value into ISO string
 */
function toIsoString(value?: string): string | null {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/**
 * Get last commit date for a repo-relative file path
 */
function getGitLastCommitDateForPath(repoRelativePath: string): string | null {
  if (!repoRelativePath) return null;

  const normalizedPath = repoRelativePath.replace(/\\/g, '/');
  if (gitLastCommitDateCache.has(normalizedPath)) {
    return gitLastCommitDateCache.get(normalizedPath) || null;
  }

  try {
    const output = execFileSync(
      'git',
      ['log', '-1', '--format=%aI', '--', normalizedPath],
      { cwd: process.cwd(), encoding: 'utf-8' }
    ).trim();

    const parsed = toIsoString(output || undefined);
    gitLastCommitDateCache.set(normalizedPath, parsed);
    return parsed;
  } catch {
    gitLastCommitDateCache.set(normalizedPath, null);
    return null;
  }
}

// =============================================================================
// DID RESOLUTION
// =============================================================================

interface DIDDocument {
  '@context': string | string[];
  id: string;
  service?: DIDService[];
  [key: string]: any;
}

interface DIDService {
  id: string;
  type: string | string[];
  serviceEndpoint: string | string[] | { [key: string]: string };
}

interface DIDRegistryEntry {
  did: string;
  addedAt: string;
  lastResolved?: string;
  lastSuccessfulCrawl?: string;
  status: 'active' | 'error' | 'pending';
  errorMessage?: string;
  resolvedCatalogUrl?: string;
}

/**
 * Resolve a did:web DID to its DID Document
 * 
 * did:web:example.com -> https://example.com/.well-known/did.json
 * did:web:example.com:path:to:doc -> https://example.com/path/to/doc/did.json
 */
async function resolveDidWeb(did: string): Promise<DIDDocument | null> {
  if (!did.startsWith('did:web:')) {
    console.error(`   ❌ Unsupported DID method: ${did}`);
    return null;
  }

  try {
    // Parse did:web
    const parts = did.substring(8).split(':'); // Remove 'did:web:'
    const domain = decodeURIComponent(parts[0]);
    const pathParts = parts.slice(1).map(decodeURIComponent);
    
    // Construct URL
    let url: string;
    if (pathParts.length === 0) {
      url = `https://${domain}/.well-known/did.json`;
    } else {
      url = `https://${domain}/${pathParts.join('/')}/did.json`;
    }
    
    console.log(`      Resolving: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/did+json, application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`   ❌ Failed to resolve DID document: ${response.status}`);
      return null;
    }
    
    const didDocument = await response.json();
    
    // Basic validation
    if (didDocument.id !== did) {
      console.warn(`   ⚠️ DID document id (${didDocument.id}) doesn't match requested DID (${did})`);
    }
    
    return didDocument as DIDDocument;
  } catch (error) {
    console.error(`   ❌ Error resolving DID:`, error);
    return null;
  }
}

/**
 * Find the WalletCatalog service endpoint in a DID Document
 */
function findWalletCatalogEndpoint(didDocument: DIDDocument): string | null {
  if (!didDocument.service || !Array.isArray(didDocument.service)) {
    return null;
  }
  
  for (const service of didDocument.service) {
    // Check if service type is WalletCatalog (can be string or array)
    const types = Array.isArray(service.type) ? service.type : [service.type];
    
    if (types.includes('WalletCatalog') || types.includes('WalletCatalogService')) {
      // Get endpoint URL
      if (typeof service.serviceEndpoint === 'string') {
        return service.serviceEndpoint;
      }
      if (Array.isArray(service.serviceEndpoint) && service.serviceEndpoint.length > 0) {
        return service.serviceEndpoint[0];
      }
      if (typeof service.serviceEndpoint === 'object' && service.serviceEndpoint.uri) {
        return service.serviceEndpoint.uri;
      }
    }
  }
  
  return null;
}

/**
 * Load the DID registry (list of DIDs to crawl)
 */
async function loadDIDRegistry(): Promise<DIDRegistryEntry[]> {
  try {
    const data = await fs.readFile(CONFIG.didRegistryPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Save the DID registry
 */
async function saveDIDRegistry(registry: DIDRegistryEntry[]): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG.didRegistryPath), { recursive: true });
  await fs.writeFile(CONFIG.didRegistryPath, JSON.stringify(registry, null, 2));
}

/**
 * Load the registry of registered providers (DID-based)
 */
async function loadRegistry(): Promise<RegistryEntry[]> {
  try {
    const data = await fs.readFile(CONFIG.registryPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Save the registry
 */
async function saveRegistry(registry: RegistryEntry[]): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG.registryPath), { recursive: true });
  await fs.writeFile(CONFIG.registryPath, JSON.stringify(registry, null, 2));
}

/**
 * Fetch a wallet catalog from a URL
 */
async function fetchCatalog(url: string): Promise<WalletCatalog | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`   ❌ Failed to fetch ${url}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Validate against schema
    if (!validateCatalog(data)) {
      console.error(`   ❌ Validation failed for ${url}:`, validateCatalog.errors);
      return null;
    }
    
    return data as WalletCatalog;
  } catch (error) {
    console.error(`   ❌ Error fetching ${url}:`, error);
    return null;
  }
}

/**
 * Fetch catalog from local file (for development/testing)
 */
async function fetchLocalCatalog(filePath: string): Promise<WalletCatalog | null> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const catalog = JSON.parse(data);
    
    // Validate against schema
    if (!validateCatalog(catalog)) {
      console.error(`   ❌ Validation failed for ${filePath}:`, validateCatalog.errors);
      return null;
    }
    
    return catalog as WalletCatalog;
  } catch (error) {
    console.error(`   ❌ Error reading ${filePath}:`, error);
    return null;
  }
}

/**
 * List files in a GitHub directory using the GitHub API
 */
async function listGitHubDirectory(owner: string, repo: string, branch: string, dirPath: string): Promise<string[]> {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}?ref=${branch}`;
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'FIDES-Wallet-Catalog-Crawler'
      }
    });
    
    if (!response.ok) {
      // 404 is expected if the repo doesn't exist yet
      if (response.status !== 404) {
        console.error(`   ❌ Failed to list GitHub directory: ${response.status}`);
      }
      return [];
    }
    
    const contents = await response.json();
    
    // Filter for directories (each provider has their own directory)
    return contents
      .filter((item: any) => item.type === 'dir')
      .map((item: any) => item.name);
  } catch (error) {
    console.error(`   ❌ Error listing GitHub directory:`, error);
    return [];
  }
}

/**
 * Fetch wallet catalog from GitHub repository
 */
async function fetchGitHubCatalog(owner: string, repo: string, branch: string, providerPath: string): Promise<WalletCatalog | null> {
  // Use raw.githubusercontent.com for direct file access
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${providerPath}/wallet-catalog.json`;
  return fetchCatalog(rawUrl);
}

/**
 * Crawl GitHub repository for wallet catalogs
 */
async function crawlGitHubRepo(
  walletHistoryState: WalletHistoryState,
  organizationById: Map<string, OrgCatalogEntry>
): Promise<{ wallets: NormalizedWallet[]; providers: Map<string, WalletProvider> }> {
  const wallets: NormalizedWallet[] = [];
  const providers = new Map<string, WalletProvider>();
  
  const { owner, repo, branch, path: catalogsPath } = CONFIG.githubRepo;
  
  console.log(`\n📂 Crawling GitHub repository: ${owner}/${repo}`);
  
  // List provider directories
  const providerDirs = await listGitHubDirectory(owner, repo, branch, catalogsPath);
  
  if (providerDirs.length === 0) {
    console.log('   ℹ️  No catalogs found (repository may not exist yet)');
    return { wallets, providers };
  }
  
  for (const providerDir of providerDirs) {
    const providerPath = `${catalogsPath}/${providerDir}`;
    const catalogFilePath = `${providerPath}/wallet-catalog.json`;
    const gitLastCommitAt = getGitLastCommitDateForPath(catalogFilePath);
    console.log(`   📦 Processing: ${providerDir}`);
    
    const catalog = await fetchGitHubCatalog(owner, repo, branch, providerPath);
    
    if (catalog) {
      const resolvedProvider = resolveWalletCatalogProvider(catalog, organizationById);
      if (!resolvedProvider) {
        console.error(
          `      ❌ Unknown orgId ${catalog.orgId} — add this organization to fides-organization-catalog first.`
        );
        continue;
      }
      const catalogUrl = `https://github.com/${owner}/${repo}/blob/${branch}/${providerPath}/wallet-catalog.json`;
      const normalizedWallets = normalizeWallets(catalog, resolvedProvider, catalogUrl, 'github', walletHistoryState, gitLastCommitAt);
      wallets.push(...normalizedWallets);
      providers.set(catalog.orgId, resolvedProvider);
      
      console.log(`      ✅ Found ${catalog.wallets.length} wallet(s)`);
    }
  }
  
  return { wallets, providers };
}

/**
 * Crawl DID-registered providers (with automatic DID resolution)
 */
async function crawlDIDProviders(
  walletHistoryState: WalletHistoryState,
  organizationById: Map<string, OrgCatalogEntry>
): Promise<{ wallets: NormalizedWallet[]; providers: Map<string, WalletProvider> }> {
  const wallets: NormalizedWallet[] = [];
  const providers = new Map<string, WalletProvider>();
  
  const registry = await loadDIDRegistry();
  
  if (registry.length === 0) {
    return { wallets, providers };
  }
  
  console.log(`\n🔗 Crawling DID-registered providers (${registry.length})`);
  
  for (const entry of registry) {
    console.log(`   📦 Processing: ${entry.did}`);
    
    try {
      // Step 1: Resolve DID document
      const didDocument = await resolveDidWeb(entry.did);
      
      if (!didDocument) {
        entry.lastResolved = new Date().toISOString();
        entry.status = 'error';
        entry.errorMessage = 'Failed to resolve DID document';
        continue;
      }
      
      entry.lastResolved = new Date().toISOString();
      
      // Step 2: Find WalletCatalog service endpoint
      const catalogUrl = findWalletCatalogEndpoint(didDocument);
      
      if (!catalogUrl) {
        entry.status = 'error';
        entry.errorMessage = 'No WalletCatalog service endpoint found in DID document';
        console.log(`      ⚠️ No WalletCatalog service endpoint found`);
        continue;
      }
      
      entry.resolvedCatalogUrl = catalogUrl;
      console.log(`      Found catalog URL: ${catalogUrl}`);
      
      // Step 3: Fetch wallet catalog
      const catalog = await fetchCatalog(catalogUrl);
      
      if (catalog) {
        const resolvedProvider = resolveWalletCatalogProvider(catalog, organizationById);
        if (!resolvedProvider) {
          entry.status = 'error';
          entry.errorMessage = `Unknown orgId ${catalog.orgId} — add organization to fides-organization-catalog`;
          console.error(`      ❌ ${entry.errorMessage}`);
          continue;
        }
        const normalizedWallets = normalizeWallets(catalog, resolvedProvider, catalogUrl, 'did', walletHistoryState, null);
        wallets.push(...normalizedWallets);
        providers.set(catalog.orgId, resolvedProvider);
        
        entry.lastSuccessfulCrawl = new Date().toISOString();
        entry.status = 'active';
        entry.errorMessage = undefined;
        
        console.log(`      ✅ Found ${catalog.wallets.length} wallet(s)`);
      } else {
        entry.status = 'error';
        entry.errorMessage = 'Failed to fetch or validate wallet catalog';
      }
    } catch (error) {
      entry.status = 'error';
      entry.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`      ❌ Error:`, entry.errorMessage);
    }
  }
  
  await saveDIDRegistry(registry);
  
  return { wallets, providers };
}

/**
 * Legacy: Crawl providers from old registry format (for backwards compatibility)
 */
async function crawlLegacyRegistry(
  walletHistoryState: WalletHistoryState,
  organizationById: Map<string, OrgCatalogEntry>
): Promise<{ wallets: NormalizedWallet[]; providers: Map<string, WalletProvider> }> {
  const wallets: NormalizedWallet[] = [];
  const providers = new Map<string, WalletProvider>();
  
  const registry = await loadRegistry();
  
  if (registry.length === 0) {
    return { wallets, providers };
  }
  
  console.log(`\n📋 Crawling legacy registry (${registry.length})`);
  
  for (const entry of registry) {
    if (!entry.catalogUrl) continue;
    
    console.log(`   📦 Processing: ${entry.did}`);
    
    const catalog = await fetchCatalog(entry.catalogUrl);
    
    if (catalog) {
      const resolvedProvider = resolveWalletCatalogProvider(catalog, organizationById);
      if (!resolvedProvider) {
        console.error(`      ❌ Unknown orgId ${catalog.orgId} in legacy registry entry — skipping wallets`);
        entry.lastChecked = new Date().toISOString();
        entry.status = 'error';
        continue;
      }
      const normalizedWallets = normalizeWallets(catalog, resolvedProvider, entry.catalogUrl, 'did', walletHistoryState, null);
      wallets.push(...normalizedWallets);
      providers.set(catalog.orgId, resolvedProvider);
      
      entry.lastChecked = new Date().toISOString();
      entry.lastSuccessfulFetch = new Date().toISOString();
      entry.status = 'active';
      
      console.log(`      ✅ Found ${catalog.wallets.length} wallet(s)`);
    } else {
      entry.lastChecked = new Date().toISOString();
      entry.status = 'error';
    }
  }
  
  await saveRegistry(registry);
  
  return { wallets, providers };
}

/**
 * Crawl a local directory for wallet catalogs
 */
async function crawlLocalDirectory(
  dirPath: string, 
  label: string, 
  source: 'local' | 'github' | 'did',
  walletHistoryState: WalletHistoryState,
  organizationById: Map<string, OrgCatalogEntry>
): Promise<{ wallets: NormalizedWallet[]; providers: Map<string, WalletProvider> }> {
  const wallets: NormalizedWallet[] = [];
  const providers = new Map<string, WalletProvider>();
  
  try {
    const entries = await fs.readdir(dirPath);
    
    // Filter out README and other non-directory files
    const providerDirs: string[] = [];
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry);
      try {
        const stat = await fs.stat(entryPath);
        if (stat.isDirectory()) {
          providerDirs.push(entry);
        }
      } catch {
        continue;
      }
    }
    
    if (providerDirs.length === 0) {
      return { wallets, providers };
    }
    
    console.log(`\n📁 Crawling ${label}`);
    
    for (const providerDir of providerDirs) {
      const catalogPath = path.join(dirPath, providerDir, 'wallet-catalog.json');
      const relativeCatalogPath = path.relative(process.cwd(), catalogPath).replace(/\\/g, '/');
      const gitLastCommitAt = getGitLastCommitDateForPath(relativeCatalogPath);
      
      try {
        await fs.access(catalogPath);
        console.log(`   📦 Processing: ${providerDir}`);
        
        const catalog = await fetchLocalCatalog(catalogPath);
        
        if (catalog) {
          const resolvedProvider = resolveWalletCatalogProvider(catalog, organizationById);
          if (!resolvedProvider) {
            console.error(
              `      ❌ Unknown orgId ${catalog.orgId} in ${providerDir} — add this organization to fides-organization-catalog first.`
            );
            continue;
          }
          const normalizedWallets = normalizeWallets(catalog, resolvedProvider, catalogPath, source, walletHistoryState, gitLastCommitAt);
          wallets.push(...normalizedWallets);
          providers.set(catalog.orgId, resolvedProvider);
          
          console.log(`      ✅ Found ${catalog.wallets.length} wallet(s)`);
        }
      } catch {
        // No catalog file found
        continue;
      }
    }
  } catch {
    // Directory doesn't exist
  }
  
  return { wallets, providers };
}

/**
 * Crawl community catalogs (all wallet catalogs are stored here)
 */
async function crawlCommunityCatalogs(
  walletHistoryState: WalletHistoryState,
  organizationById: Map<string, OrgCatalogEntry>
): Promise<{ wallets: NormalizedWallet[]; providers: Map<string, WalletProvider> }> {
  return crawlLocalDirectory(CONFIG.communityCatalogsDir, 'community catalogs', 'local', walletHistoryState, organizationById);
}

/**
 * Normalize wallets with provider info
 */
function normalizeWallets(
  catalog: WalletCatalog,
  provider: WalletProvider,
  catalogUrl: string,
  source: 'local' | 'github' | 'did',
  walletHistoryState: WalletHistoryState,
  gitLastCommitAt: string | null
): NormalizedWallet[] {
  const fetchedAt = new Date().toISOString();
  const orgId = catalog.orgId;

  return catalog.wallets.map(wallet => {
    const walletAny = wallet as Record<string, unknown> & typeof wallet;
    const { provider: _removedInlineProvider, ...walletRest } = walletAny;
    const historyKey = `${orgId}:${wallet.id}`;

    const updatedAt =
      toIsoString(walletAny.updatedAt as string | undefined) ||
      toIsoString(walletAny.updated as string | undefined) ||
      toIsoString(catalog.lastUpdated) ||
      gitLastCommitAt ||
      fetchedAt;

    const existingHistory = walletHistoryState[historyKey];
    const firstSeenAt =
      existingHistory?.firstSeenAt ||
      toIsoString(walletAny.firstSeenAt as string | undefined) ||
      toIsoString(walletAny.createdAt as string | undefined) ||
      toIsoString(wallet.releaseDate) ||
      updatedAt ||
      fetchedAt;

    walletHistoryState[historyKey] = {
      firstSeenAt,
      lastSeenAt: fetchedAt,
      providerKey: orgId,
      walletId: wallet.id
    };

    return {
      ...walletRest,
      orgId,
      provider,
      catalogUrl,
      fetchedAt,
      updatedAt,
      firstSeenAt,
      source // Track where the catalog came from
    } as NormalizedWallet;
  });
}

/**
 * Calculate statistics
 */
function calculateStats(wallets: NormalizedWallet[]): AggregatedCatalog['stats'] {
  const byType: Record<WalletType, number> = {
    personal: 0,
    organizational: 0
  };
  
  const byPlatform: Record<Platform, number> = {
    iOS: 0,
    Android: 0,
    Web: 0,
    Windows: 0,
    macOS: 0,
    Linux: 0,
    CLI: 0
  };
  
  const byCredentialFormat: Record<string, number> = {};
  
  wallets.forEach(wallet => {
    // By type
    if (wallet.type in byType) {
      byType[wallet.type]++;
    }
    
    // By platform
    wallet.platforms?.forEach(platform => {
      if (platform in byPlatform) {
        byPlatform[platform]++;
      }
    });
    
    // By credential format
    wallet.credentialFormats?.forEach(format => {
      byCredentialFormat[format] = (byCredentialFormat[format] || 0) + 1;
    });
  });
  
  return {
    totalWallets: wallets.length,
    totalProviders: new Set(wallets.map(w => w.orgId)).size,
    byType,
    byPlatform,
    byCredentialFormat
  };
}

/**
 * Deduplicate wallets (same organization + wallet ID)
 * Priority: DID > GitHub > Local (non-EU landscape) > EU Landscape
 */
function deduplicateWallets(wallets: NormalizedWallet[]): NormalizedWallet[] {
  const seen = new Map<string, NormalizedWallet>();

  const getPriority = (wallet: NormalizedWallet): number => {
    const source = (wallet as any).source || 'local';
    const catalogUrl = wallet.catalogUrl;

    if (source === 'did') return 4;
    if (source === 'github') return 3;
    if (source === 'local' && !catalogUrl.includes('eu-landscape')) return 2;
    if (source === 'local' && catalogUrl.includes('eu-landscape')) return 1;

    return 0;
  };

  for (const wallet of wallets) {
    const key = `${wallet.orgId}:${wallet.id}`;
    const existing = seen.get(key);

    if (!existing || getPriority(wallet) > getPriority(existing)) {
      seen.set(key, wallet);
    }
  }

  return Array.from(seen.values());
}

/**
 * Main function: crawl all sources
 */
async function crawl(): Promise<void> {
  console.log('🔍 Starting FIDES Wallet Catalog crawl...');
  const walletHistoryState = await loadWalletHistoryState();
  const organizationById = await loadOrganizationCatalogMap();

  const allWallets: NormalizedWallet[] = [];
  const allProviders = new Map<string, WalletProvider>();

  // 1. Crawl GitHub repository first (highest priority)
  if (CONFIG.githubRepo.enabled) {
    const github = await crawlGitHubRepo(walletHistoryState, organizationById);
    allWallets.push(...github.wallets);
    github.providers.forEach((v, k) => allProviders.set(k, v));
  }

  // 2. Crawl community catalogs (including EU landscape)
  const community = await crawlCommunityCatalogs(walletHistoryState, organizationById);
  allWallets.push(...community.wallets);
  community.providers.forEach((v, k) => allProviders.set(k, v));

  // 3. Crawl DID-registered providers (with automatic DID resolution)
  const didProviders = await crawlDIDProviders(walletHistoryState, organizationById);
  allWallets.push(...didProviders.wallets);
  didProviders.providers.forEach((v, k) => allProviders.set(k, v));

  // 4. Crawl legacy registry (for backwards compatibility)
  const legacy = await crawlLegacyRegistry(walletHistoryState, organizationById);
  allWallets.push(...legacy.wallets);
  legacy.providers.forEach((v, k) => allProviders.set(k, v));

  // Deduplicate (prefer DID > GitHub > EU Landscape > Local)
  const dedupedWallets = deduplicateWallets(allWallets);
  
  // Create aggregated data
  const aggregated: AggregatedCatalog = {
    wallets: dedupedWallets,
    providers: Array.from(allProviders.values()),
    lastUpdated: new Date().toISOString(),
    stats: calculateStats(dedupedWallets)
  };
  
  // Save
  await fs.mkdir(path.dirname(CONFIG.aggregatedPath), { recursive: true });
  await fs.writeFile(CONFIG.aggregatedPath, JSON.stringify(aggregated, null, 2));
  await fs.mkdir(path.dirname(CONFIG.wpPluginDataPath), { recursive: true });
  await fs.writeFile(CONFIG.wpPluginDataPath, JSON.stringify(aggregated, null, 2));
  await saveWalletHistoryState(walletHistoryState);
  
  console.log('\n📊 Aggregation complete:');
  console.log(`   Total wallets: ${aggregated.stats.totalWallets}`);
  console.log(`   Total providers: ${aggregated.stats.totalProviders}`);
  console.log(`   Output: ${CONFIG.aggregatedPath}`);
  console.log(`   Plugin copy: ${CONFIG.wpPluginDataPath}`);
  console.log(`   History state: ${CONFIG.walletHistoryStatePath}`);
}

// Run crawler
crawl().catch(console.error);
