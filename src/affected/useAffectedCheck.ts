import {useCallback, useEffect, useRef, useState} from 'react';
import type {AffectedState, AffectedSummaryCounts, DepResult, ParseResult} from './affectedTypes.ts';
import {parsePackageJson} from './parsers/packageJson.ts';
import {parseRequirementsTxt} from './parsers/requirementsTxt.ts';
import {parseSbom} from './parsers/sbom.ts';
import {queryAndHydrate} from './osvBatchClient.ts';

function detectManifestKind(fileName: string): 'package.json' | 'requirements.txt' | 'sbom' | null {
  const lower = fileName.toLowerCase();
  if (lower === 'package.json') return 'package.json';
  if (lower === 'requirements.txt' || lower.endsWith('.txt')) return 'requirements.txt';
  if (lower.endsWith('.json') || lower.endsWith('.xml')) return 'sbom';
  return null;
}

function parseFile(fileName: string, content: string): ParseResult {
  const kind = detectManifestKind(fileName);
  if (kind === 'package.json') return parsePackageJson(content);
  if (kind === 'requirements.txt') return parseRequirementsTxt(content);
  return parseSbom(content);
}

function buildSummary(parseResult: ParseResult, results: DepResult[]): AffectedSummaryCounts {
  const affected = results.filter((r) => r.status === 'affected').length;
  const clean = results.filter((r) => r.status === 'clean').length;
  return {
    total: parseResult.checkable.length + parseResult.skipped.length,
    checkable: parseResult.checkable.length,
    affected,
    clean,
    skipped: parseResult.skipped.length,
  };
}

const initialState: AffectedState = {
  status: 'idle',
  fileName: null,
  parseResult: null,
  results: [],
  summary: null,
  errorMessage: null,
  noticeMessage: null,
};

export interface UseAffectedCheckReturn {
  state: AffectedState;
  runCheck: (file: File) => Promise<void>;
  reset: () => void;
}

export function useAffectedCheck(): UseAffectedCheckReturn {
  const [state, setState] = useState<AffectedState>(initialState);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(initialState);
  }, []);

  const runCheck = useCallback(async (file: File): Promise<void> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({
      ...initialState,
      status: 'parsing',
      fileName: file.name,
    });

    let content: string;
    try {
      content = await file.text();
    } catch {
      if (controller.signal.aborted) return;
      setState((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: 'Could not read the uploaded file.',
      }));
      return;
    }

    if (controller.signal.aborted) return;

    const parseResult = parseFile(file.name, content);

    if (controller.signal.aborted) return;

    if (parseResult.parseError) {
      if (controller.signal.aborted) return;
      setState((prev) => ({
        ...prev,
        status: 'error',
        parseResult,
        errorMessage: parseResult.parseError ?? 'Unknown parse error.',
      }));
      return;
    }

    if (parseResult.checkable.length === 0) {
      const summary = buildSummary(parseResult, []);
      if (controller.signal.aborted) return;
      setState((prev) => ({
        ...prev,
        status: 'partial',
        parseResult,
        results: [],
        summary,
        noticeMessage:
          parseResult.skipped.length > 0
            ? `No checkable dependencies found. ${parseResult.skipped.length} ${parseResult.skipped.length === 1 ? 'entry was' : 'entries were'} skipped — see details below.`
            : 'No dependencies found in the uploaded file.',
      }));
      return;
    }

    if (controller.signal.aborted) return;
    setState((prev) => ({...prev, status: 'querying', parseResult}));

    let results: DepResult[];
    try {
      results = await queryAndHydrate(parseResult.checkable, controller.signal, () => {
        if (controller.signal.aborted) return;
        setState((prev) => ({...prev, status: 'hydrating'}));
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      if (controller.signal.aborted) return;
      setState((prev) => ({
        ...prev,
        status: 'error',
        errorMessage:
          err instanceof Error ? err.message : 'OSV query failed — please try again.',
      }));
      return;
    }

    if (controller.signal.aborted) return;

    const summary = buildSummary(parseResult, results);

    setState((prev) => ({
      ...prev,
      status: 'success',
      parseResult,
      results,
      summary,
      noticeMessage:
        parseResult.skipped.length > 0
          ? `${parseResult.skipped.length} ${parseResult.skipped.length === 1 ? 'dependency was' : 'dependencies were'} skipped. See below for details.`
          : null,
    }));
  }, []);

  return {state, runCheck, reset};
}
