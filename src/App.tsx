import {AnimatePresence, motion} from 'motion/react';
import {useVulnerabilityLookup} from './vulnerability/useVulnerabilityLookup.ts';
import {SearchForm} from './vulnerability/components/SearchForm.tsx';
import {ErrorBanner, InfoBanner, PartialBanner} from './vulnerability/components/StatusBanner.tsx';
import {LoadingSkeleton} from './vulnerability/components/LoadingSkeleton.tsx';
import {OverviewCard} from './vulnerability/components/OverviewCard.tsx';
import {AffectedPackagesTable} from './vulnerability/components/AffectedPackagesTable.tsx';

const fadeUp = {
  initial: {opacity: 0, y: 12},
  animate: {opacity: 1, y: 0},
  exit: {opacity: 0, y: -8},
};

export default function App() {
  const {cveId, setCveId, lookup, isBusy, buttonLabel, handleSearch} = useVulnerabilityLookup();

  const osvData = lookup.osvData;
  const depsData = lookup.depsData;

  const contentKey =
    lookup.status === 'idle' ? 'idle'
    : lookup.status === 'loading' ? 'loading'
    : lookup.status === 'error' ? `error-${lookup.errorMessage}`
    : osvData ? `results-${osvData.id}`
    : 'idle';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header — intentionally static */}
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
        <AnimatePresence mode="wait">
          {/* Error State */}
          {lookup.status === 'error' && lookup.errorMessage && (
            <motion.div
              key={contentKey}
              {...fadeUp}
              transition={{duration: 0.25, ease: 'easeOut'}}
            >
              <ErrorBanner message={lookup.errorMessage} />
            </motion.div>
          )}

          {/* Empty / Idle State */}
          {lookup.status === 'idle' && (
            <motion.div
              key="idle"
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.2}}
              className="h-64 flex flex-col items-center justify-center border border-[#141414] border-dashed opacity-40"
            >
              <p className="font-mono text-sm uppercase tracking-widest">Awaiting Query Input</p>
            </motion.div>
          )}

          {/* Primary Loading State */}
          {lookup.status === 'loading' && (
            <motion.div
              key="loading"
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.2}}
            >
              <LoadingSkeleton queryId={lookup.queryId} />
            </motion.div>
          )}

          {/* Results */}
          {osvData && (
            <motion.div
              key={contentKey}
              {...fadeUp}
              transition={{duration: 0.35, ease: 'easeOut'}}
            >
              <AnimatePresence mode="wait">
                {lookup.depsStatus === 'loading' && (
                  <motion.div
                    key="info-banner"
                    initial={{opacity: 0, height: 0}}
                    animate={{opacity: 1, height: 'auto'}}
                    exit={{opacity: 0, height: 0}}
                    transition={{duration: 0.2}}
                    style={{overflow: 'hidden'}}
                  >
                    <InfoBanner message="Loading deps.dev advisory details..." />
                  </motion.div>
                )}

                {lookup.status === 'partial' && lookup.partialMessage && (
                  <motion.div
                    key="partial-banner"
                    initial={{opacity: 0, height: 0}}
                    animate={{opacity: 1, height: 'auto'}}
                    exit={{opacity: 0, height: 0}}
                    transition={{duration: 0.2}}
                    style={{overflow: 'hidden'}}
                  >
                    <PartialBanner message={lookup.partialMessage} />
                  </motion.div>
                )}
              </AnimatePresence>

              <OverviewCard osvData={osvData} depsData={depsData} />

              {/* Affected Packages Table */}
              <motion.div
                initial={{opacity: 0, y: 8}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.3, ease: 'easeOut', delay: 0.1}}
              >
                <h3 className="font-serif italic text-2xl mb-4">Affected Packages</h3>
                <AffectedPackagesTable affected={osvData.affected} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
