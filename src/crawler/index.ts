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
import path from 'path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import type { 
  WalletCatalog, 
  NormalizedWallet, 
  AggregatedCatalog, 
  RegistryEntry,
  WalletType,
  Platform
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
  // Local examples directory (for development/reference)
  localExamplesDir: path.join(process.cwd(), 'examples'),
  
  // Local community catalogs directory
  localCommunityDir: path.join(process.cwd(), 'community-catalogs'),
  
  // GitHub repository for community-contributed catalogs (fallback if not running locally)
  githubRepo: {
    enabled: false,
    owner: 'FIDEScommunity',
    repo: 'fides-wallet-catalog',
    branch: 'main',
    path: 'community-catalogs',
  },
  
  // DID Registry - list of DIDs to crawl (providers register here)
  didRegistryPath: path.join(process.cwd(), 'data/did-registry.json'),
  
  // Legacy registry file (for backwards compatibility)
  registryPath: path.join(process.cwd(), 'data/registry.json'),
  
  // Output file
  aggregatedPath: path.join(process.cwd(), 'data/aggregated.json'),
};

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
async function crawlGitHubRepo(): Promise<{ wallets: NormalizedWallet[], providers: Map<string, WalletCatalog['provider']> }> {
  const wallets: NormalizedWallet[] = [];
  const providers = new Map<string, WalletCatalog['provider']>();
  
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
    console.log(`   📦 Processing: ${providerDir}`);
    
    const catalog = await fetchGitHubCatalog(owner, repo, branch, providerPath);
    
    if (catalog) {
      const catalogUrl = `https://github.com/${owner}/${repo}/blob/${branch}/${providerPath}/wallet-catalog.json`;
      const normalizedWallets = normalizeWallets(catalog, catalogUrl, 'github');
      wallets.push(...normalizedWallets);
      providers.set(catalog.provider.did, catalog.provider);
      
      console.log(`      ✅ Found ${catalog.wallets.length} wallet(s)`);
    }
  }
  
  return { wallets, providers };
}

/**
 * Crawl DID-registered providers (with automatic DID resolution)
 */
async function crawlDIDProviders(): Promise<{ wallets: NormalizedWallet[], providers: Map<string, WalletCatalog['provider']> }> {
  const wallets: NormalizedWallet[] = [];
  const providers = new Map<string, WalletCatalog['provider']>();
  
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
        const normalizedWallets = normalizeWallets(catalog, catalogUrl, 'did');
        wallets.push(...normalizedWallets);
        providers.set(catalog.provider.did, catalog.provider);
        
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
async function crawlLegacyRegistry(): Promise<{ wallets: NormalizedWallet[], providers: Map<string, WalletCatalog['provider']> }> {
  const wallets: NormalizedWallet[] = [];
  const providers = new Map<string, WalletCatalog['provider']>();
  
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
      const normalizedWallets = normalizeWallets(catalog, entry.catalogUrl, 'did');
      wallets.push(...normalizedWallets);
      providers.set(catalog.provider.did, catalog.provider);
      
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
  source: 'local' | 'github' | 'did'
): Promise<{ wallets: NormalizedWallet[], providers: Map<string, WalletCatalog['provider']> }> {
  const wallets: NormalizedWallet[] = [];
  const providers = new Map<string, WalletCatalog['provider']>();
  
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
    
    for (const provider of providerDirs) {
      const catalogPath = path.join(dirPath, provider, 'wallet-catalog.json');
      
      try {
        await fs.access(catalogPath);
        console.log(`   📦 Processing: ${provider}`);
        
        const catalog = await fetchLocalCatalog(catalogPath);
        
        if (catalog) {
          const normalizedWallets = normalizeWallets(catalog, catalogPath, source);
          wallets.push(...normalizedWallets);
          providers.set(catalog.provider.did, catalog.provider);
          
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
 * Crawl local examples (reference implementations)
 */
async function crawlLocalExamples(): Promise<{ wallets: NormalizedWallet[], providers: Map<string, WalletCatalog['provider']> }> {
  return crawlLocalDirectory(CONFIG.localExamplesDir, 'local examples', 'local');
}

/**
 * Crawl local community catalogs
 */
async function crawlLocalCommunity(): Promise<{ wallets: NormalizedWallet[], providers: Map<string, WalletCatalog['provider']> }> {
  return crawlLocalDirectory(CONFIG.localCommunityDir, 'community catalogs', 'github');
}

/**
 * Normalize wallets with provider info
 */
function normalizeWallets(catalog: WalletCatalog, catalogUrl: string, source: 'local' | 'github' | 'did'): NormalizedWallet[] {
  const fetchedAt = new Date().toISOString();
  
  return catalog.wallets.map(wallet => ({
    ...wallet,
    provider: catalog.provider,
    catalogUrl,
    fetchedAt,
    source // Track where the catalog came from
  } as NormalizedWallet));
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
    totalProviders: new Set(wallets.map(w => w.provider.did)).size,
    byType,
    byPlatform,
    byCredentialFormat
  };
}

/**
 * Deduplicate wallets (same provider DID + wallet ID)
 * Priority: DID > GitHub > Local
 */
function deduplicateWallets(wallets: NormalizedWallet[]): NormalizedWallet[] {
  const seen = new Map<string, NormalizedWallet>();
  const priority = { did: 3, github: 2, local: 1 };
  
  for (const wallet of wallets) {
    const key = `${wallet.provider.did}:${wallet.id}`;
    const existing = seen.get(key);
    const walletSource = (wallet as any).source || 'local';
    const existingSource = existing ? ((existing as any).source || 'local') : 'local';
    
    if (!existing || priority[walletSource as keyof typeof priority] > priority[existingSource as keyof typeof priority]) {
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
  
  const allWallets: NormalizedWallet[] = [];
  const allProviders = new Map<string, WalletCatalog['provider']>();
  
  // 1. Crawl local examples (reference implementations)
  const local = await crawlLocalExamples();
  allWallets.push(...local.wallets);
  local.providers.forEach((v, k) => allProviders.set(k, v));
  
  // 2. Crawl local community catalogs
  const community = await crawlLocalCommunity();
  allWallets.push(...community.wallets);
  community.providers.forEach((v, k) => allProviders.set(k, v));
  
  // 3. Crawl GitHub repository (if enabled, for remote-only deployments)
  if (CONFIG.githubRepo.enabled) {
    const github = await crawlGitHubRepo();
    allWallets.push(...github.wallets);
    github.providers.forEach((v, k) => allProviders.set(k, v));
  }
  
  // 4. Crawl DID-registered providers (with automatic DID resolution)
  const didProviders = await crawlDIDProviders();
  allWallets.push(...didProviders.wallets);
  didProviders.providers.forEach((v, k) => allProviders.set(k, v));
  
  // 5. Crawl legacy registry (for backwards compatibility)
  const legacy = await crawlLegacyRegistry();
  allWallets.push(...legacy.wallets);
  legacy.providers.forEach((v, k) => allProviders.set(k, v));
  
  // Deduplicate (prefer DID > GitHub/Community > Local)
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
  
  console.log('\n📊 Aggregation complete:');
  console.log(`   Total wallets: ${aggregated.stats.totalWallets}`);
  console.log(`   Total providers: ${aggregated.stats.totalProviders}`);
  console.log(`   Output: ${CONFIG.aggregatedPath}`);
}

// Run crawler
crawl().catch(console.error);
