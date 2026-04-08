import React, { useState } from 'react';

interface OSVResponse {
  id: string;
  summary?: string;
  details?: string;
  aliases?: string[];
  modified?: string;
  published?: string;
  affected?: Array<{
    package?: {
      ecosystem: string;
      name: string;
      purl?: string;
    };
    ranges?: Array<{
      type: string;
      events: Array<{
        introduced?: string;
        fixed?: string;
        last_affected?: string;
        limit?: string;
      }>;
    }>;
    versions?: string[];
  }>;
}

interface DepsDevResponse {
  advisoryKey?: { id: string };
  url?: string;
  title?: string;
  aliases?: string[];
  cvss3Score?: number;
  cvss3Vector?: string;
}

export default function App() {
  const [cveId, setCveId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [osvData, setOsvData] = useState<OSVResponse | null>(null);
  const [depsData, setDepsData] = useState<DepsDevResponse | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cveId.trim()) return;

    setLoading(true);
    setError(null);
    setOsvData(null);
    setDepsData(null);

    const queryId = cveId.trim().toUpperCase();

    try {
      const osvRes = await fetch(`https://api.osv.dev/v1/vulns/${queryId}`);
      if (!osvRes.ok) {
        if (osvRes.status === 404) {
          throw new Error(`Vulnerability ${queryId} not found in OSV database.`);
        }
        throw new Error(`OSV API Error: ${osvRes.statusText}`);
      }
      let osvJson = await osvRes.json();

      // If packages are missing or unknown, try to fetch from a GHSA alias
      const needsPackageInfo = !osvJson.affected || osvJson.affected.length === 0 || osvJson.affected.some((a: any) => !a.package);
      if (needsPackageInfo && osvJson.aliases) {
        const ghsaAlias = osvJson.aliases.find((alias: string) => alias.startsWith('GHSA-'));
        if (ghsaAlias) {
          try {
            const ghsaRes = await fetch(`https://api.osv.dev/v1/vulns/${ghsaAlias}`);
            if (ghsaRes.ok) {
              const ghsaJson = await ghsaRes.json();
              if (ghsaJson.affected && ghsaJson.affected.length > 0) {
                osvJson.affected = ghsaJson.affected;
              }
            }
          } catch (ghsaErr) {
            console.warn('Failed to fetch GHSA alias data', ghsaErr);
          }
        }
      }

      setOsvData(osvJson);

      try {
        const depsRes = await fetch(`https://api.deps.dev/v3/advisories/${queryId}`);
        if (depsRes.ok) {
          const depsJson = await depsRes.json();
          setDepsData(depsJson);
        }
      } catch (depsErr) {
        console.warn('Failed to fetch from deps.dev API', depsErr);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#141414] p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#E4E3E0] sticky top-0 z-10">
        <div>
          <h1 className="font-serif italic text-3xl md:text-4xl tracking-tight">Vulnerability Explorer</h1>
          <p className="font-mono text-xs uppercase tracking-widest mt-2 opacity-60">OSV.dev & deps.dev Integration</p>
        </div>
        <form onSubmit={handleSearch} className="w-full md:w-auto flex">
          <input
            type="text"
            value={cveId}
            onChange={(e) => setCveId(e.target.value)}
            placeholder="ENTER CVE ID..."
            className="bg-transparent border border-[#141414] px-4 py-2.5 font-mono text-sm focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-colors w-full md:w-72 placeholder:text-[#141414]/40 rounded-none"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#141414] text-[#E4E3E0] px-6 py-2.5 font-mono text-sm uppercase tracking-wider hover:bg-[#FF3366] hover:text-[#141414] transition-colors disabled:opacity-50 border border-[#141414] ml-[-1px] rounded-none cursor-pointer"
          >
            {loading ? '...' : 'Query'}
          </button>
        </form>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 md:p-8 max-w-7xl mx-auto w-full">
        {/* Error State */}
        {error && (
          <div className="border border-[#141414] bg-[#FF3366] text-[#141414] p-4 mb-8 font-mono text-sm uppercase tracking-wide flex items-center gap-3">
            <span className="font-bold">ERROR:</span> {error}
          </div>
        )}

        {/* Empty State */}
        {!osvData && !error && !loading && (
          <div className="h-64 flex flex-col items-center justify-center border border-[#141414] border-dashed opacity-40">
            <p className="font-mono text-sm uppercase tracking-widest">Awaiting Query Input</p>
          </div>
        )}

        {/* Results */}
        {osvData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Overview Card */}
            <div className="border border-[#141414] bg-[#E4E3E0] mb-12">
              <div className="border-b border-[#141414] p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#141414] text-[#E4E3E0]">
                <div className="flex items-center gap-4 flex-wrap">
                  <h2 className="font-mono text-2xl md:text-3xl font-bold tracking-tight">{osvData.id}</h2>
                  {depsData?.cvss3Score && (
                    <span className="border border-[#E4E3E0] px-2 py-1 font-mono text-xs font-bold bg-[#FF3366] text-[#141414] border-none">
                      CVSS {depsData.cvss3Score}
                    </span>
                  )}
                </div>
                {depsData?.url && (
                  <a href={depsData.url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs uppercase hover:text-[#FF3366] transition-colors flex items-center gap-2">
                    View Advisory ↗
                  </a>
                )}
              </div>
              
              <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                <div className="lg:col-span-2 space-y-8">
                  <div>
                    <h3 className="font-serif italic text-xl opacity-50 mb-3">Summary</h3>
                    <p className="text-xl leading-relaxed font-medium">
                      {depsData?.title || osvData.summary || 'No title available'}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-serif italic text-xl opacity-50 mb-3">Details</h3>
                    <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap opacity-80">
                      {osvData.details || 'No detailed description available.'}
                    </p>
                  </div>
                </div>
                
                <div className="border-t lg:border-t-0 lg:border-l border-[#141414] pt-8 lg:pt-0 lg:pl-8 space-y-8">
                  {osvData.aliases && osvData.aliases.length > 0 && (
                    <div>
                      <h3 className="font-serif italic text-lg opacity-50 mb-3">Aliases</h3>
                      <div className="flex flex-wrap gap-2">
                        {osvData.aliases.map(alias => (
                          <span key={alias} className="border border-[#141414] px-2 py-1 font-mono text-xs bg-white/40">
                            {alias}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-serif italic text-lg opacity-50 mb-3">Timeline</h3>
                    <div className="font-mono text-xs space-y-3">
                      {osvData.published && (
                        <div className="flex justify-between border-b border-[#141414]/20 pb-2">
                          <span className="opacity-60">PUBLISHED</span>
                          <span>{new Date(osvData.published).toISOString().split('T')[0]}</span>
                        </div>
                      )}
                      {osvData.modified && (
                        <div className="flex justify-between border-b border-[#141414]/20 pb-2">
                          <span className="opacity-60">MODIFIED</span>
                          <span>{new Date(osvData.modified).toISOString().split('T')[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Affected Packages Table */}
            <div>
              <h3 className="font-serif italic text-2xl mb-4">Affected Packages</h3>
              
              {osvData.affected && osvData.affected.length > 0 ? (
                <div className="border border-[#141414] overflow-x-auto bg-[#E4E3E0]">
                  <table className="min-w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#141414] bg-[#141414] text-[#E4E3E0]">
                        <th className="p-4 font-mono text-xs font-normal tracking-widest uppercase w-1/5">Ecosystem</th>
                        <th className="p-4 font-mono text-xs font-normal tracking-widest uppercase border-l border-[#E4E3E0]/20 w-1/4">Package</th>
                        <th className="p-4 font-mono text-xs font-normal tracking-widest uppercase border-l border-[#E4E3E0]/20 w-1/3">Vulnerable Ranges</th>
                        <th className="p-4 font-mono text-xs font-normal tracking-widest uppercase border-l border-[#E4E3E0]/20">Specific Versions</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-sm">
                      {osvData.affected.map((affected, idx) => (
                        <tr key={idx} className="border-b border-[#141414] last:border-0 hover:bg-white/50 transition-colors">
                          <td className="p-4 align-top">
                            {affected.package?.ecosystem || 'UNKNOWN'}
                          </td>
                          <td className="p-4 align-top border-l border-[#141414] font-bold">
                            {affected.package?.name || 'Unknown Package'}
                          </td>
                          <td className="p-4 align-top border-l border-[#141414]">
                            {affected.ranges && affected.ranges.length > 0 ? (
                              <div className="space-y-4">
                                {affected.ranges.map((range, rIdx) => {
                                  const introduced = range.events.find(e => e.introduced)?.introduced;
                                  const fixed = range.events.find(e => e.fixed)?.fixed;
                                  const limit = range.events.find(e => e.limit)?.limit;
                                  return (
                                    <div key={rIdx} className="text-xs bg-white/30 border border-[#141414]/20 p-2">
                                      <div className="opacity-50 mb-2 font-bold">TYPE: {range.type}</div>
                                      <div className="grid grid-cols-1 gap-1.5">
                                        {introduced && <div><span className="opacity-50">INTRODUCED:</span> {introduced}</div>}
                                        {fixed && <div className="text-[#FF3366] font-bold"><span className="opacity-50 text-[#141414] font-normal">FIXED:</span> {fixed}</div>}
                                        {limit && !fixed && <div><span className="opacity-50">LIMIT:</span> {limit}</div>}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <span className="opacity-40 italic">None</span>
                            )}
                          </td>
                          <td className="p-4 align-top border-l border-[#141414]">
                            {affected.versions && affected.versions.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-2">
                                {affected.versions.map(v => (
                                  <span key={v} className="px-1.5 py-0.5 bg-[#141414] text-[#E4E3E0] text-[11px]">
                                    {v}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="opacity-40 italic">None</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border border-[#141414] p-8 text-center font-mono text-sm opacity-60">
                  No specific package information available for this vulnerability.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
