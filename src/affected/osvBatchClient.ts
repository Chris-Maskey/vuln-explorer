import type {
  CheckableDep,
  DepResult,
  OsvBatchResponse,
  OsvQueryItem,
  OsvVulnRecord,
} from './affectedTypes.ts';

const OSV_API = 'https://api.osv.dev/v1';
const BATCH_SIZE = 1000;

function depToQueryItem(dep: CheckableDep): OsvQueryItem {
  if (dep.purl) {
    return {package: {purl: dep.purl}};
  }
  return {
    version: dep.version,
    package: {name: dep.name, ecosystem: dep.ecosystem},
  };
}

async function submitBatch(
  queries: OsvQueryItem[],
  signal: AbortSignal,
): Promise<OsvBatchResponse> {
  const res = await fetch(`${OSV_API}/querybatch`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({queries}),
    signal,
  });

  if (!res.ok) {
    throw new Error(`OSV querybatch failed: ${res.status} ${res.statusText}`);
  }

  const body = (await res.json()) as OsvBatchResponse;

  if (!Array.isArray(body.results) || body.results.length !== queries.length) {
    throw new Error('OSV querybatch returned an unexpected response shape.');
  }

  return body;
}

async function fetchVulnRecord(id: string, signal: AbortSignal): Promise<OsvVulnRecord> {
  try {
    const res = await fetch(`${OSV_API}/vulns/${id}`, {signal});
    if (!res.ok) return {id};
    return res.json() as Promise<OsvVulnRecord>;
  } catch {
    return {id};
  }
}

export async function queryAndHydrate(
  deps: CheckableDep[],
  signal: AbortSignal,
  onHydrating?: () => void,
): Promise<DepResult[]> {
  if (deps.length === 0) return [];

  const queries = deps.map(depToQueryItem);
  const chunks: OsvQueryItem[][] = [];
  for (let i = 0; i < queries.length; i += BATCH_SIZE) {
    chunks.push(queries.slice(i, i + BATCH_SIZE));
  }

  const rawResults: OsvBatchResponse['results'] = [];

  for (const chunk of chunks) {
    const response = await submitBatch(chunk, signal);
    rawResults.push(...(response.results ?? []));
  }

  const allVulnIds = new Set<string>();
  rawResults.forEach((r) => {
    (r.vulns ?? []).forEach((v) => allVulnIds.add(v.id));
  });

  const hydrated = new Map<string, OsvVulnRecord>();
  onHydrating?.();
  await Promise.all(
    Array.from(allVulnIds).map(async (id) => {
      const record = await fetchVulnRecord(id, signal);
      hydrated.set(id, record);
    }),
  );

  return deps.map((dep, idx): DepResult => {
    const resultItem = rawResults[idx];
    const matchedIds = (resultItem?.vulns ?? []).map((v) => v.id);
    const vulns = matchedIds.flatMap((id) => {
      const r = hydrated.get(id);
      return r ? [r] : [];
    });

    return {
      dep,
      status: matchedIds.length > 0 ? 'affected' : 'clean',
      vulns,
    };
  });
}
