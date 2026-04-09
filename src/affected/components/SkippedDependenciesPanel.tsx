import {useState} from 'react';
import type {SkippedDep, SkipReason} from '../affectedTypes.ts';

const REASON_LABELS: Record<SkipReason, string> = {
  'version-range': 'Version range (not exact)',
  'no-version': 'No version specified',
  'git-reference': 'Git reference',
  'file-reference': 'Local file reference',
  'workspace-reference': 'Workspace reference',
  'editable-install': 'Editable install (-e)',
  'vcs-url': 'VCS / URL reference',
  'unparseable-line': 'Unparseable line',
  'unknown-ecosystem': 'Unrecognised ecosystem',
  'no-identity': 'No purl or version identity',
};

interface SkippedDependenciesPanelProps {
  skipped: SkippedDep[];
}

export function SkippedDependenciesPanel({skipped}: SkippedDependenciesPanelProps) {
  const [open, setOpen] = useState(false);

  if (skipped.length === 0) return null;

  const grouped = skipped.reduce<Partial<Record<SkipReason, SkippedDep[]>>>((acc, dep) => {
    if (!acc[dep.reason]) acc[dep.reason] = [];
    acc[dep.reason]!.push(dep);
    return acc;
  }, {});

  return (
    <div className="border border-[#141414] mt-8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#FFD9A0] font-mono text-xs uppercase tracking-widest cursor-pointer hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
      >
        <span>
          Skipped dependencies — {skipped.length}{' '}
          {skipped.length === 1 ? 'entry' : 'entries'}
        </span>
        <span className="opacity-60">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="divide-y divide-[#141414]/20">
          {(Object.entries(grouped) as [SkipReason, SkippedDep[]][]).map(([reason, deps]) => (
            <div key={reason} className="px-4 py-3">
              <p className="font-mono text-xs uppercase tracking-widest opacity-60 mb-2">
                {REASON_LABELS[reason]} ({deps.length})
              </p>
              <ul className="space-y-0.5">
                {deps.map((dep, i) => (
                  <li key={i} className="font-mono text-xs opacity-50 break-all">
                    {dep.name ? (
                      <span>
                        {dep.name}
                        {dep.version ? `@${dep.version}` : ''}
                      </span>
                    ) : (
                      <span>{dep.raw}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
