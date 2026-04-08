import {useVulnerabilityLookup} from './vulnerability/useVulnerabilityLookup.ts';
import {SearchForm} from './vulnerability/components/SearchForm.tsx';
import {ErrorBanner, InfoBanner, PartialBanner} from './vulnerability/components/StatusBanner.tsx';
import {LoadingSkeleton} from './vulnerability/components/LoadingSkeleton.tsx';
import {OverviewCard} from './vulnerability/components/OverviewCard.tsx';
import {AffectedPackagesTable} from './vulnerability/components/AffectedPackagesTable.tsx';

export default function App() {
  const {cveId, setCveId, lookup, isBusy, buttonLabel, handleSearch} = useVulnerabilityLookup();

  const osvData = lookup.osvData;
  const depsData = lookup.depsData;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#141414] p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#E4E3E0] sticky top-0 z-10">
        <div>
          <h1 className="font-serif italic text-3xl md:text-4xl tracking-tight">Vulnerability Explorer</h1>
          <p className="font-mono text-xs uppercase tracking-widest mt-2 opacity-60">OSV.dev & deps.dev Integration</p>
        </div>
        <SearchForm
          cveId={cveId}
          onCveIdChange={setCveId}
          onSubmit={handleSearch}
          isBusy={isBusy}
          buttonLabel={buttonLabel}
        />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 md:p-8 max-w-7xl mx-auto w-full">
        {/* Error State */}
        {lookup.status === 'error' && lookup.errorMessage && (
          <ErrorBanner message={lookup.errorMessage} />
        )}

        {/* Empty State */}
        {lookup.status === 'idle' && (
          <div className="h-64 flex flex-col items-center justify-center border border-[#141414] border-dashed opacity-40">
            <p className="font-mono text-sm uppercase tracking-widest">Awaiting Query Input</p>
          </div>
        )}

        {/* Primary Loading State */}
        {lookup.status === 'loading' && (
          <LoadingSkeleton queryId={lookup.queryId} />
        )}

        {/* Results */}
        {osvData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {lookup.depsStatus === 'loading' && (
              <InfoBanner message="Loading deps.dev advisory details..." />
            )}

            {lookup.status === 'partial' && lookup.partialMessage && (
              <PartialBanner message={lookup.partialMessage} />
            )}

            <OverviewCard osvData={osvData} depsData={depsData} />

            {/* Affected Packages Table */}
            <div>
              <h3 className="font-serif italic text-2xl mb-4">Affected Packages</h3>
              <AffectedPackagesTable affected={osvData.affected} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
