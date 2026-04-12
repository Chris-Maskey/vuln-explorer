import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useVulnerabilityLookup } from "./vulnerability/useVulnerabilityLookup.ts";
import { SearchForm } from "./vulnerability/components/SearchForm.tsx";
import {
  ErrorBanner,
  InfoBanner,
  PartialBanner,
} from "./vulnerability/components/StatusBanner.tsx";
import { LoadingSkeleton } from "./vulnerability/components/LoadingSkeleton.tsx";
import { OverviewCard } from "./vulnerability/components/OverviewCard.tsx";
import { AffectedPackagesTable } from "./vulnerability/components/AffectedPackagesTable.tsx";
import { RecentSearchesPanel } from "./vulnerability/components/RecentSearchesPanel.tsx";
import { AffectedWorkflow } from "./affected/components/AffectedWorkflow.tsx";

type AppMode = "cve" | "affected";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function App() {
  const [mode, setMode] = useState<AppMode>("cve");

  const {
    cveId,
    setCveId,
    lookup,
    isBusy,
    buttonLabel,
    handleSearch,
    recentSearches,
    runLookup,
  } = useVulnerabilityLookup();

  const osvData = lookup.osvData;
  const depsData = lookup.depsData;

  const contentKey =
    lookup.status === "idle"
      ? "idle"
      : lookup.status === "loading"
        ? "loading"
        : lookup.status === "error"
          ? `error-${lookup.errorMessage}`
          : osvData
            ? `results-${osvData.id}`
            : "idle";

  const ModeSwitch = (
    <div className="flex gap-0 self-start">
      <button
        type="button"
        onClick={() => setMode("cve")}
        className={[
          "px-4 py-2 font-mono text-xs uppercase tracking-widest border border-[#141414] transition-colors cursor-pointer",
          mode === "cve"
            ? "bg-[#141414] text-[#E4E3E0]"
            : "bg-transparent hover:bg-[#141414]/10",
        ].join(" ")}
      >
        CVE Lookup
      </button>
      <button
        type="button"
        onClick={() => setMode("affected")}
        className={[
          "px-4 py-2 font-mono text-xs uppercase tracking-widest border border-[#141414] border-l-0 transition-colors cursor-pointer",
          mode === "affected"
            ? "bg-[#141414] text-[#E4E3E0]"
            : "bg-transparent hover:bg-[#141414]/10",
        ].join(" ")}
      >
        Am I Affected?
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[#141414] px-4 py-4 md:px-6 bg-[#E4E3E0] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-6">
          <div>
            <h1 className="font-serif italic text-3xl md:text-4xl tracking-tight">
              Dep.Sentry
            </h1>
          </div>
          {ModeSwitch}
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {mode === "affected" && (
            <motion.div
              key="affected-mode"
              {...fadeUp}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="mb-6">
                <h2 className="font-serif italic text-2xl mb-1">
                  Am I Affected?
                </h2>
                <p className="font-mono text-xs uppercase tracking-widest opacity-50">
                  Upload a dependency manifest or SBOM to check for known
                  vulnerabilities
                </p>
              </div>
              <AffectedWorkflow />
            </motion.div>
          )}

          {mode === "cve" && (
            <motion.div
              key="cve-mode"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="mb-8">
                <div className="mb-4">
                  <h2 className="font-serif italic text-2xl mb-1">
                    CVE Lookup
                  </h2>
                  <p className="font-mono text-xs uppercase tracking-widest opacity-50">
                    Look up a vulnerability by CVE ID
                  </p>
                </div>
                <div className="flex flex-wrap md:flex-nowrap items-center gap-4 mt-6">
                  <RecentSearchesPanel
                    searches={recentSearches}
                    onSelect={(id) => void runLookup(id)}
                    currentId={lookup.queryId}
                  />
                  <SearchForm
                    cveId={cveId}
                    onCveIdChange={setCveId}
                    onSubmit={handleSearch}
                    isBusy={isBusy}
                    buttonLabel={buttonLabel}
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {lookup.status === "error" && lookup.errorMessage && (
                  <motion.div
                    key={contentKey}
                    {...fadeUp}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <ErrorBanner message={lookup.errorMessage} />
                  </motion.div>
                )}

                {lookup.status === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="h-32 flex flex-col items-center justify-center border border-[#141414] border-dashed opacity-20">
                      <p className="font-mono text-xs uppercase tracking-widest">
                        Awaiting Query Input
                      </p>
                    </div>
                  </motion.div>
                )}

                {lookup.status === "loading" && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <LoadingSkeleton queryId={lookup.queryId} />
                  </motion.div>
                )}

                {osvData && (
                  <motion.div
                    key={contentKey}
                    {...fadeUp}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  >
                    <AnimatePresence mode="wait">
                      {lookup.depsStatus === "loading" && (
                        <motion.div
                          key="info-banner"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: "hidden" }}
                        >
                          <InfoBanner message="Loading deps.dev advisory details..." />
                        </motion.div>
                      )}

                      {lookup.status === "partial" && lookup.partialMessage && (
                        <motion.div
                          key="partial-banner"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: "hidden" }}
                        >
                          <PartialBanner message={lookup.partialMessage} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <OverviewCard osvData={osvData} depsData={depsData} />

                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut",
                        delay: 0.1,
                      }}
                    >
                      <h3 className="font-serif italic text-2xl mb-4">
                        Affected Packages
                      </h3>
                      <AffectedPackagesTable affected={osvData.affected} />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
