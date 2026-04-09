import {AnimatePresence, motion} from 'motion/react';
import {useAffectedCheck} from '../useAffectedCheck.ts';
import {AffectedUploadForm} from './AffectedUploadForm.tsx';
import {AffectedSummary} from './AffectedSummary.tsx';
import {AffectedResultsTable} from './AffectedResultsTable.tsx';
import {SkippedDependenciesPanel} from './SkippedDependenciesPanel.tsx';
import {ErrorBanner, InfoBanner, PartialBanner} from '../../vulnerability/components/StatusBanner.tsx';

const fadeUp = {
  initial: {opacity: 0, y: 12},
  animate: {opacity: 1, y: 0},
  exit: {opacity: 0, y: -8},
};

export function AffectedWorkflow() {
  const {state, runCheck, reset} = useAffectedCheck();

  const isBusy = state.status === 'parsing' || state.status === 'querying' || state.status === 'hydrating';
  const hasResults = state.status === 'success' || state.status === 'partial';

  return (
    <div className="space-y-8">
      {(!hasResults || state.status === 'error') && (
        <AffectedUploadForm
          onFile={(f) => void runCheck(f)}
          isBusy={isBusy}
          onReset={reset}
          hasResults={hasResults}
        />
      )}

      <AnimatePresence mode="wait">
        {state.status === 'parsing' && (
          <motion.div key="parsing" {...fadeUp} transition={{duration: 0.2}}>
            <div className="border border-[#141414] bg-[#E4E3E0] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-60 mb-4">
                Parsing {state.fileName ?? 'file'}
              </p>
              <div className="space-y-3 animate-pulse">
                <div className="h-4 w-48 bg-[#141414]/10" />
                <div className="h-4 w-64 bg-[#141414]/10" />
              </div>
            </div>
          </motion.div>
        )}

        {(state.status === 'querying' || state.status === 'hydrating') && (
          <motion.div key="querying" {...fadeUp} transition={{duration: 0.2}}>
            <div className="border border-[#141414] bg-[#E4E3E0] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-60 mb-4">
                {state.status === 'querying'
                  ? `Querying OSV for ${state.parseResult?.checkable.length ?? 0} ${state.parseResult?.checkable.length === 1 ? 'dependency' : 'dependencies'}...`
                  : 'Hydrating vulnerability details...'}
              </p>
              <div className="space-y-3 animate-pulse">
                <div className="h-4 w-56 bg-[#141414]/10" />
                <div className="h-4 max-w-sm bg-[#141414]/10" />
                <div className="h-12 border border-dashed border-[#141414]/20" />
              </div>
            </div>
          </motion.div>
        )}

        {state.status === 'error' && state.errorMessage && (
          <motion.div key="error" {...fadeUp} transition={{duration: 0.25}}>
            <ErrorBanner message={state.errorMessage} />
          </motion.div>
        )}

        {hasResults && (
          <motion.div key="results" {...fadeUp} transition={{duration: 0.35, ease: 'easeOut'}}>
            {state.noticeMessage && (
              <PartialBanner message={state.noticeMessage} />
            )}

            {state.summary && (
              <AffectedSummary summary={state.summary} fileName={state.fileName} />
            )}

            {state.results.length > 0 && (
              <div>
                <h3 className="font-serif italic text-2xl mb-4">Dependency Results</h3>
                <AffectedResultsTable results={state.results} />
              </div>
            )}

            {state.parseResult && state.parseResult.skipped.length > 0 && (
              <SkippedDependenciesPanel skipped={state.parseResult.skipped} />
            )}

            {state.status === 'success' && state.summary && state.summary.affected === 0 && state.summary.checkable > 0 && (
              <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                transition={{delay: 0.2}}
              >
                <InfoBanner
                  message={`No known vulnerabilities found in ${state.summary.checkable} checked ${state.summary.checkable === 1 ? 'dependency' : 'dependencies'}.`}
                />
              </motion.div>
            )}

            <motion.button
              type="button"
              onClick={reset}
              whileHover={{scale: 1.02}}
              whileTap={{scale: 0.98}}
              transition={{duration: 0.12}}
              className="mt-6 font-mono text-xs uppercase tracking-widest border border-[#141414] px-4 py-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors cursor-pointer"
            >
              Upload another file
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
