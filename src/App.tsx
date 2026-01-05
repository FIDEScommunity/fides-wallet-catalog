import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Wallet, Building2, Users, Smartphone, Globe, Github, ExternalLink, ChevronDown, X, Shield, Key, FileCheck } from 'lucide-react';
import type { NormalizedWallet, WalletFilters, Platform, CredentialFormat, WalletType } from './types/wallet';

// Demo data - in production this comes from the API
import demoData from '../data/aggregated.json';

const PLATFORMS: Platform[] = ['iOS', 'Android', 'Web', 'Windows', 'macOS', 'Linux'];
const CREDENTIAL_FORMATS: CredentialFormat[] = ['SD-JWT-VC', 'SD-JWT', 'mDL/mDoc', 'JWT-VC', 'JSON-LD VC', 'AnonCreds', 'X.509'];
const CREDENTIAL_FORMAT_ORDER: string[] = ['SD-JWT-VC', 'SD-JWT', 'mDL/mDoc', 'JWT-VC', 'JSON-LD VC', 'AnonCreds', 'X.509', 'CBOR-LD'];
const WALLET_TYPES: { value: WalletType; label: string; icon: typeof Users }[] = [
  { value: 'personal', label: 'Personal', icon: Users },
  { value: 'organizational', label: 'Organizational', icon: Building2 },
  { value: 'both', label: 'Both', icon: Wallet },
];

function sortCredentialFormats(formats: string[] | undefined): string[] {
  if (!formats) return [];
  return [...formats].sort((a, b) => {
    const indexA = CREDENTIAL_FORMAT_ORDER.indexOf(a);
    const indexB = CREDENTIAL_FORMAT_ORDER.indexOf(b);
    const orderA = indexA === -1 ? 999 : indexA;
    const orderB = indexB === -1 ? 999 : indexB;
    return orderA - orderB;
  });
}

function WalletCard({ wallet, index }: { wallet: NormalizedWallet; index: number }) {
  const [expanded, setExpanded] = useState(false);
  
  const typeConfig = {
    personal: { bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', text: 'text-blue-300' },
    organizational: { bg: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30', text: 'text-purple-300' },
    both: { bg: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30', text: 'text-amber-300' },
  };
  
  const config = typeConfig[wallet.type];
  
  return (
    <div 
      className="card-glow rounded-2xl overflow-hidden animate-fade-in-up"
      style={{ 
        animationDelay: `${index * 100}ms`,
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Header */}
      <div className={`p-6 bg-gradient-to-r ${config.bg} min-h-[100px]`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {wallet.logo ? (
              <img src={wallet.logo} alt={wallet.name} className="w-14 h-14 rounded-xl object-cover bg-white/10" />
            ) : (
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.bg} ${config.border} border-2 flex items-center justify-center`}>
                <Wallet className={`w-7 h-7 ${config.text}`} />
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold text-white">{wallet.name}</h3>
              <p className="text-sm text-gray-400">{wallet.provider.name}</p>
            </div>
          </div>
          <div className={`tag ${wallet.type === 'organizational' ? 'tag-accent' : wallet.type === 'both' ? 'tag-green' : ''}`}>
            {wallet.type === 'personal' ? 'Personal' : wallet.type === 'organizational' ? 'Organizational' : 'Both'}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6 space-y-4">
        {wallet.description && (
          <p className="text-gray-300 text-sm leading-relaxed">{wallet.description}</p>
        )}
        
        {/* Platforms */}
        {wallet.platforms && wallet.platforms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {wallet.platforms.map(platform => (
              <span key={platform} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-xs text-gray-300">
                {platform === 'iOS' || platform === 'Android' ? <Smartphone className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                {platform}
              </span>
            ))}
          </div>
        )}
        
        {/* Credential Formats */}
        {wallet.credentialFormats && wallet.credentialFormats.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5" />
              Credential Formats
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {sortCredentialFormats(wallet.credentialFormats).map(format => (
                <span key={format} className="tag text-xs">{format}</span>
              ))}
            </div>
          </div>
        )}
        
        {/* Expandable section */}
        {expanded && (
          <div className="space-y-4 pt-4 border-t border-white/10">
            {/* Protocols */}
            {(wallet.issuanceProtocols?.length || wallet.presentationProtocols?.length) && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Protocols
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {wallet.issuanceProtocols?.map(p => (
                    <span key={p} className="tag tag-green text-xs">{p}</span>
                  ))}
                  {wallet.presentationProtocols?.map(p => (
                    <span key={p} className="tag tag-accent text-xs">{p}</span>
                  ))}
                </div>
              </div>
            )}
            
            {/* DID Methods */}
            {wallet.supportedDIDMethods && wallet.supportedDIDMethods.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  DID Methods
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {wallet.supportedDIDMethods.map(method => (
                    <span key={method} className="px-2 py-0.5 rounded bg-white/5 text-xs text-gray-400 font-mono">{method}</span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Key Management */}
            {wallet.keyManagement && wallet.keyManagement.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Key Management</h4>
                <div className="flex flex-wrap gap-1.5">
                  {wallet.keyManagement.map(km => (
                    <span key={km} className="tag text-xs">{km}</span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Standards & Certifications */}
            {(wallet.standards?.length || wallet.certifications?.length) && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Standards & Certifications</h4>
                <div className="flex flex-wrap gap-1.5">
                  {wallet.standards?.map(s => (
                    <span key={s} className="tag text-xs">{s}</span>
                  ))}
                  {wallet.certifications?.map(c => (
                    <span key={c} className="tag tag-green text-xs">{c}</span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Features */}
            {wallet.features && wallet.features.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Features</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  {wallet.features.map(feature => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-blue-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            {wallet.openSource && wallet.repository && (
              <a 
                href={wallet.repository} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <Github className="w-4 h-4" />
                Open Source
              </a>
            )}
            {wallet.website && (
              <a 
                href={wallet.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Website
              </a>
            )}
          </div>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {expanded ? 'Less' : 'More details'}
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterSection({ 
  title, 
  options, 
  selected, 
  onChange 
}: { 
  title: string; 
  options: string[]; 
  selected: string[]; 
  onChange: (value: string[]) => void;
}) {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };
  
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-400 mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <button
            key={option}
            onClick={() => toggleOption(option)}
            className={`filter-btn ${selected.includes(option) ? 'active' : ''}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [wallets, setWallets] = useState<NormalizedWallet[]>([]);
  const [filters, setFilters] = useState<WalletFilters>({
    search: '',
    type: [],
    platforms: [],
    credentialFormats: [],
    openSource: undefined,
  });
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    // In production: fetch from API
    // For now: use demo data
    setWallets(demoData.wallets as NormalizedWallet[]);
  }, []);
  
  const filteredWallets = useMemo(() => {
    return wallets.filter(wallet => {
      // Search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matches = 
          wallet.name.toLowerCase().includes(searchLower) ||
          wallet.description?.toLowerCase().includes(searchLower) ||
          wallet.provider.name.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }
      
      // Type
      if (filters.type && filters.type.length > 0) {
        if (!filters.type.includes(wallet.type)) return false;
      }
      
      // Platforms
      if (filters.platforms && filters.platforms.length > 0) {
        const hasMatch = filters.platforms.some(p => wallet.platforms?.includes(p as Platform));
        if (!hasMatch) return false;
      }
      
      // Credential formats
      if (filters.credentialFormats && filters.credentialFormats.length > 0) {
        const hasMatch = filters.credentialFormats.some(f => wallet.credentialFormats?.includes(f as CredentialFormat));
        if (!hasMatch) return false;
      }
      
      // Open source
      if (filters.openSource !== undefined) {
        if (wallet.openSource !== filters.openSource) return false;
      }
      
      return true;
    });
  }, [wallets, filters]);
  
  const activeFilterCount = 
    (filters.type?.length || 0) + 
    (filters.platforms?.length || 0) + 
    (filters.credentialFormats?.length || 0) +
    (filters.openSource !== undefined ? 1 : 0);
  
  const clearFilters = () => {
    setFilters({
      search: filters.search,
      type: [],
      platforms: [],
      credentialFormats: [],
      openSource: undefined,
    });
  };
  
  return (
    <div className="min-h-screen">
      <div className="gradient-bg" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">FIDES Wallet Catalog</h1>
                <p className="text-xs text-gray-400">Digital Identity Wallets for the Netherlands</p>
              </div>
            </div>
            <a 
              href="https://fides.community" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              fides.community
            </a>
          </div>
        </div>
      </header>
      
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 glow-text">
          Discover Digital Identity Wallets
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
          Browse and compare wallets from various providers. 
          Filter by platform, credential format, and more.
        </p>
        
        {/* Search */}
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, description or provider..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="search-input pl-12 pr-12"
          />
          {filters.search && (
            <button
              onClick={() => setFilters({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-blue-500 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </section>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Filter bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                showFilters 
                  ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300' 
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            
            {activeFilterCount > 0 && (
              <button 
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
                Clear filters
              </button>
            )}
          </div>
          
          <p className="text-sm text-gray-400">
            {filteredWallets.length} wallet{filteredWallets.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        {/* Filters panel */}
        {showFilters && (
          <div 
            className="mb-8 p-6 rounded-2xl space-y-6"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Type filter */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Type</h3>
                <div className="flex flex-wrap gap-2">
                  {WALLET_TYPES.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => {
                        const newTypes = filters.type?.includes(value)
                          ? filters.type.filter(t => t !== value)
                          : [...(filters.type || []), value];
                        setFilters({ ...filters, type: newTypes });
                      }}
                      className={`filter-btn inline-flex items-center gap-1.5 ${
                        filters.type?.includes(value) ? 'active' : ''
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Platform filter */}
              <FilterSection
                title="Platform"
                options={PLATFORMS}
                selected={filters.platforms || []}
                onChange={(platforms) => setFilters({ ...filters, platforms: platforms as Platform[] })}
              />
              
              {/* Credential format filter */}
              <FilterSection
                title="Credential Format"
                options={CREDENTIAL_FORMATS}
                selected={filters.credentialFormats || []}
                onChange={(formats) => setFilters({ ...filters, credentialFormats: formats as CredentialFormat[] })}
              />
              
              {/* Open source filter */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">License</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilters({ 
                      ...filters, 
                      openSource: filters.openSource === true ? undefined : true 
                    })}
                    className={`filter-btn inline-flex items-center gap-1.5 ${
                      filters.openSource === true ? 'active' : ''
                    }`}
                  >
                    <Github className="w-3.5 h-3.5" />
                    Open Source
                  </button>
                  <button
                    onClick={() => setFilters({ 
                      ...filters, 
                      openSource: filters.openSource === false ? undefined : false 
                    })}
                    className={`filter-btn ${filters.openSource === false ? 'active' : ''}`}
                  >
                    Proprietary
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Wallet grid */}
        {filteredWallets.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWallets.map((wallet, index) => (
              <WalletCard 
                key={`${wallet.provider.did}-${wallet.id}`} 
                wallet={wallet} 
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Wallet className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No wallets found</h3>
            <p className="text-gray-500">Adjust your filters or try a different search query.</p>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500">
            Wallet information is managed by providers themselves via their DID documents.
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Last updated: {demoData.lastUpdated ? new Date(demoData.lastUpdated).toLocaleDateString('en-US') : 'Unknown'}
          </p>
        </div>
      </footer>
    </div>
  );
}
