import type {DepResult, OsvVulnRecord} from '../affectedTypes.ts';

interface VulnChipProps {
  vuln: OsvVulnRecord;
}

function VulnChip({vuln}: VulnChipProps) {
  return (
    <a
      href={`https://osv.dev/vulnerability/${vuln.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block border border-[#141414] bg-[#FF3366] px-2 py-0.5 font-mono text-xs uppercase tracking-wide hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
    >
      {vuln.id}
    </a>
  );
}

interface AffectedResultsTableProps {
  results: DepResult[];
}

export function AffectedResultsTable({results}: AffectedResultsTableProps) {
  const sorted = [...results].sort((a, b) => {
    if (a.status === 'affected' && b.status !== 'affected') return -1;
    if (a.status !== 'affected' && b.status === 'affected') return 1;
    return a.dep.name.localeCompare(b.dep.name);
  });

  if (sorted.length === 0) {
    return (
      <p className="font-mono text-xs uppercase tracking-widest opacity-40 py-8 text-center">
        No results to display
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-mono text-sm">
        <thead>
          <tr className="border-b border-[#141414]">
            <th className="text-left py-3 px-4 font-mono text-xs uppercase tracking-widest opacity-60 whitespace-nowrap">
              Package
            </th>
            <th className="text-left py-3 px-4 font-mono text-xs uppercase tracking-widest opacity-60 whitespace-nowrap">
              Version
            </th>
            <th className="text-left py-3 px-4 font-mono text-xs uppercase tracking-widest opacity-60 whitespace-nowrap">
              Ecosystem
            </th>
            <th className="text-left py-3 px-4 font-mono text-xs uppercase tracking-widest opacity-60 whitespace-nowrap">
              Status
            </th>
            <th className="text-left py-3 px-4 font-mono text-xs uppercase tracking-widest opacity-60">
              Vulnerabilities
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((result, i) => {
            const isAffected = result.status === 'affected';
            return (
              <tr
                key={`${result.dep.name}@${result.dep.version}-${i}`}
                className={`border-b border-[#141414]/20 ${isAffected ? 'bg-[#FF3366]/10' : ''}`}
              >
                <td className="py-3 px-4 font-mono text-sm break-all">{result.dep.name}</td>
                <td className="py-3 px-4 font-mono text-sm whitespace-nowrap">
                  {result.dep.version}
                </td>
                <td className="py-3 px-4 font-mono text-xs uppercase tracking-wide opacity-60 whitespace-nowrap">
                  {result.dep.ecosystem}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {isAffected ? (
                    <span className="inline-block border border-[#141414] bg-[#FF3366] px-2 py-0.5 font-mono text-xs uppercase tracking-wide">
                      Affected
                    </span>
                  ) : (
                    <span className="inline-block border border-[#141414]/30 px-2 py-0.5 font-mono text-xs uppercase tracking-wide opacity-50">
                      Clean
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {result.vulns.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {result.vulns.map((v) => (
                        <VulnChip key={v.id} vuln={v} />
                      ))}
                    </div>
                  ) : (
                    <span className="opacity-30 font-mono text-xs">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
