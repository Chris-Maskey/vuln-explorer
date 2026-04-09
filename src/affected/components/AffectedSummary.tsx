import type {AffectedSummaryCounts} from '../affectedTypes.ts';

interface AffectedSummaryProps {
  summary: AffectedSummaryCounts;
  fileName: string | null;
}

interface StatCellProps {
  label: string;
  value: number;
  accent?: string;
}

function StatCell({label, value, accent}: StatCellProps) {
  return (
    <div className={`border border-[#141414] p-4 flex flex-col gap-1 bg-[#E4E3E0] text-[#141414] ${accent ?? ''}`}>
      <span className="font-mono text-xs uppercase tracking-widest opacity-60">{label}</span>
      <span className="font-serif italic text-3xl">{value}</span>
    </div>
  );
}

export function AffectedSummary({summary, fileName}: AffectedSummaryProps) {
  return (
    <div className="mb-8">
      {fileName && (
        <p className="font-mono text-xs uppercase tracking-widest opacity-50 mb-4">
          {fileName}
        </p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-[#141414]">
        <StatCell label="Total" value={summary.total} />
        <StatCell label="Checkable" value={summary.checkable} />
        <StatCell
          label="Affected"
          value={summary.affected}
          accent={summary.affected > 0 ? 'bg-[#FF3366] text-[#141414]' : 'bg-[#E4E3E0]'}
        />
        <StatCell label="Clean" value={summary.clean} accent="bg-[#E4E3E0]" />
        <StatCell label="Skipped" value={summary.skipped} accent="bg-[#FFD9A0]" />
      </div>
    </div>
  );
}
