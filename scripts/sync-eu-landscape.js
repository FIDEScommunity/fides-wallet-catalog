#!/usr/bin/env node

/**
 * EU Digital Identity Landscape Sync Script
 * 
 * Syncs wallet data from https://www.digital-identity-landscape.eu/data/solutions.json
 * to the FIDES wallet catalog format.
 * 
 * Usage: node scripts/sync-eu-landscape.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EU_LANDSCAPE_URL = 'https://www.digital-identity-landscape.eu/data/solutions.json';
const OUTPUT_DIR = path.join(__dirname, '../community-catalogs/eu-landscape');
const DRY_RUN = process.argv.includes('--dry-run');

// These are consortia/pilots, not actual wallets - exclude them
const EXCLUDED_SOLUTIONS = [
  'Findy',
  'DC4EU (Digital Credentials for Europe)',
  'EWC (EU Digital Identity Wallet Consortium)',
  'NOBID',
  'POTENTIAL',
  'APTITUDE',
  'WEBUILD',
  // Duplicate wallets that exist in official catalogs
  'Heidi Wallet',
  'Yivi (formerly IRMA)',
  'Lissi ID-Wallet',
  'iGrant.io',
  'Animo Easy PID',
  'wwWallet',
  // Moved to official community catalog
  'Hovi ID'
];

// Country code mapping
const COUNTRY_NAMES = {
  'AD': 'Andorra', 'AL': 'Albania', 'AT': 'Austria', 'BE': 'Belgium',
  'BG': 'Bulgaria', 'HR': 'Croatia', 'CY': 'Cyprus', 'CZ': 'Czech Republic',
  'DK': 'Denmark', 'EE': 'Estonia', 'FI': 'Finland', 'FR': 'France',
  'DE': 'Germany', 'GR': 'Greece', 'HU': 'Hungary', 'IS': 'Iceland',
  'IE': 'Ireland', 'IT': 'Italy', 'XK': 'Kosovo', 'LV': 'Latvia',
  'LI': 'Liechtenstein', 'LT': 'Lithuania', 'LU': 'Luxembourg', 'MT': 'Malta',
  'MD': 'Moldova', 'MC': 'Monaco', 'ME': 'Montenegro', 'NL': 'Netherlands',
  'MK': 'North Macedonia', 'NO': 'Norway', 'PL': 'Poland', 'PT': 'Portugal',
  'RO': 'Romania', 'SM': 'San Marino', 'RS': 'Serbia', 'SK': 'Slovakia',
  'SI': 'Slovenia', 'ES': 'Spain', 'SE': 'Sweden', 'CH': 'Switzerland',
  'TR': 'Turkey', 'UA': 'Ukraine', 'GB': 'United Kingdom', 'VA': 'Vatican City'
};

/**
 * Fetch JSON from URL
 */
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Map EU Landscape wallet to FIDES format
 */
function mapWalletToFidesFormat(euWallet) {
  const wallet = {
    id: generateWalletId(euWallet.name),
    name: euWallet.name,
    description: euWallet.description || `${euWallet['solution type']} from ${euWallet.country}`,
    type: determineWalletType(euWallet),
    openSource: euWallet.governance === 'Public' || euWallet['solution type']?.includes('Open Source'),
    status: mapStatus(euWallet.status),
  };

  // Only add website if it's a valid URL
  if (euWallet.url && euWallet.url.startsWith('http')) {
    wallet.website = euWallet.url;
  }

  // Add optional fields
  if (euWallet.provider) {
    wallet.provider = {
      name: euWallet.provider.split('/')[0].trim(),
      website: euWallet.url || ''
    };
  }

  // Platforms - try to detect from description
  const platforms = detectPlatforms(euWallet);
  if (platforms.length > 0) {
    wallet.platforms = platforms;
  }

  // Credential formats
  const credentialFormats = detectCredentialFormats(euWallet);
  if (credentialFormats.length > 0) {
    wallet.credentialFormats = credentialFormats;
  }

  // Protocols and standards for EUDI wallets
  if (euWallet['solution type']?.includes('EUDI') || euWallet.name?.includes('National EUDI Wallet') || euWallet.status?.includes('Development')) {
    wallet.presentationProtocols = ['OpenID4VP'];
    wallet.issuanceProtocols = ['OpenID4VCI'];

    // All EUDI-compliant wallets support these formats
    wallet.credentialFormats = ['mDL/mDoc', 'SD-JWT-VC'];
    wallet.interoperabilityProfiles = ['EUDI Wallet ARF'];
  }

  // Country and flag logo
  const countryCode = euWallet.country?.match(/\(([A-Z]{2})\)/)?.[1] || 
                      Object.keys(COUNTRY_NAMES).find(code => 
                        euWallet.country?.includes(COUNTRY_NAMES[code]));
  if (countryCode) {
    wallet.countries = [countryCode];
    // Use country flag as logo (FlagCDN - free to use, public domain flags)
    wallet.logo = `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
  }

  // eIDAS status
  if (euWallet['eidas notified'] === 'Yes') {
    wallet.certifications = ['eIDAS notified'];
  }

  // Launch year - only add if it's a valid 4-digit year
  const launchYear = euWallet['launch year'];
  if (launchYear && /^\d{4}$/.test(String(launchYear))) {
    wallet.releaseDate = `${launchYear}-01-01`;
  }

  return wallet;
}

/**
 * Generate wallet ID from name
 */
function generateWalletId(name) {
  return name
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Determine wallet type
 * Note: All EU Digital Identity Landscape wallets are citizen-facing = personal wallets
 * The "governance" field indicates WHO OPERATES the wallet, not who uses it
 */
function determineWalletType(euWallet) {
  // All wallets in the EU landscape are for citizens = personal wallets
  return 'personal';
}

/**
 * Map status
 */
function mapStatus(status) {
  const statusLower = (status || '').toLowerCase();
  if (statusLower.includes('active') || statusLower.includes('deployed')) {
    return 'production';
  }
  if (statusLower.includes('pilot')) {
    return 'beta';
  }
  if (statusLower.includes('development') || statusLower.includes('planned')) {
    return 'development';
  }
  return 'production';
}

/**
 * Detect platforms from description
 */
function detectPlatforms(euWallet) {
  const text = `${euWallet.name} ${euWallet.description} ${euWallet['solution type']}`.toLowerCase();
  const platforms = [];
  
  if (text.includes('ios') || text.includes('iphone') || text.includes('apple')) {
    platforms.push('iOS');
  }
  if (text.includes('android')) {
    platforms.push('Android');
  }
  if (text.includes('mobile') || text.includes('app')) {
    if (!platforms.length) {
      platforms.push('iOS', 'Android');
    }
  }
  if (text.includes('web') || text.includes('browser')) {
    platforms.push('Web');
  }
  
  return [...new Set(platforms)];
}

/**
 * Detect credential formats
 */
function detectCredentialFormats(euWallet) {
  const text = `${euWallet.description} ${euWallet['solution type']}`.toLowerCase();
  const formats = [];
  
  if (text.includes('sd-jwt') || text.includes('sdjwt')) {
    formats.push('SD-JWT-VC');
  }
  if (text.includes('jwt')) {
    formats.push('JWT-VC');
  }
  if (text.includes('mdoc') || text.includes('mdl') || text.includes('18013')) {
    formats.push('mDL/mDoc');
  }
  if (text.includes('anoncreds')) {
    formats.push('AnonCreds');
  }
  
  return formats;
}

/**
 * Main sync function
 */
async function sync() {
  console.log('🔄 Fetching EU Digital Identity Landscape data...');
  
  const solutions = await fetchJSON(EU_LANDSCAPE_URL);
  console.log(`✓ Fetched ${solutions.length} solutions`);
  
  // Filter wallets (exclude consortia/pilots)
  const wallets = solutions.filter(s => 
    s.category === 'Wallet' && 
    !EXCLUDED_SOLUTIONS.includes(s.name)
  );
  console.log(`✓ Found ${wallets.length} wallets (excluded ${EXCLUDED_SOLUTIONS.length} consortia/pilots)`);
  
  // Filter active/deployed/pilot/development wallets
  const activeWallets = wallets.filter(w =>
    ['Active', 'Deployed', 'Pilot', 'Development'].some(status =>
      w.status?.includes(status)
    )
  );
  console.log(`✓ ${activeWallets.length} active/pilot wallets`);
  
  // Group by country
  const byCountry = {};
  activeWallets.forEach(w => {
    const country = w.country || 'Unknown';
    if (!byCountry[country]) byCountry[country] = [];
    byCountry[country].push(w);
  });
  
  console.log(`\n📊 Wallets by country:`);
  Object.keys(byCountry).sort().forEach(country => {
    console.log(`  ${country}: ${byCountry[country].length} wallet(s)`);
  });
  
  // Transform to FIDES format
  const fidesWallets = activeWallets.map(mapWalletToFidesFormat);
  
  // Create catalog structure
  const catalog = {
    $schema: 'https://fides.community/schemas/wallet-catalog/v1',
    provider: {
      name: 'EU Digital Identity Landscape',
      website: 'https://www.digital-identity-landscape.eu/'
    },
    wallets: fidesWallets
  };
  
  if (DRY_RUN) {
    console.log('\n🔍 DRY RUN - Would create:');
    console.log(JSON.stringify(catalog, null, 2));
    return;
  }
  
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Write catalog
  const outputFile = path.join(OUTPUT_DIR, 'wallet-catalog.json');
  fs.writeFileSync(outputFile, JSON.stringify(catalog, null, 2));
  console.log(`\n✓ Written ${fidesWallets.length} wallets to ${outputFile}`);
  
  // Write sync metadata
  const metadata = {
    lastSync: new Date().toISOString(),
    sourceUrl: EU_LANDSCAPE_URL,
    totalWallets: fidesWallets.length,
    byStatus: {
      production: fidesWallets.filter(w => w.status === 'production').length,
      beta: fidesWallets.filter(w => w.status === 'beta').length,
      development: fidesWallets.filter(w => w.status === 'development').length
    }
  };
  
  const metadataFile = path.join(OUTPUT_DIR, 'sync-metadata.json');
  fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
  console.log(`✓ Written metadata to ${metadataFile}`);
  
  console.log('\n✅ Sync complete!');
}

// Run
sync().catch(err => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});

