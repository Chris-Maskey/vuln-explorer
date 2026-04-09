// ---------------------------------------------------------------------------
// Shared types for the "Am I Affected?" feature slice
// ---------------------------------------------------------------------------

/** The type of manifest / SBOM file the user uploaded. */
export type ManifestKind = 'package.json' | 'requirements.txt' | 'sbom-cyclonedx' | 'sbom-spdx';

// ---------------------------------------------------------------------------
// Parser output
// ---------------------------------------------------------------------------

/** A single dependency entry that can be checked against OSV. */
export interface CheckableDep {
  /** Human-readable package name. */
  name: string;
  /** Exact pinned version string. */
  version: string;
  /**
   * Package URL (purl) — preferred by OSV querybatch.
   * E.g. `pkg:npm/express@4.18.2`
   */
  purl?: string;
  /** OSV ecosystem string, e.g. "npm", "PyPI", "Maven". */
  ecosystem: string;
  /** Where in the manifest this came from (informational). */
  origin?: string;
}

/** A reason why a dependency was not submitted to OSV. */
export type SkipReason =
  | 'version-range'
  | 'no-version'
  | 'git-reference'
  | 'file-reference'
  | 'workspace-reference'
  | 'editable-install'
  | 'vcs-url'
  | 'unparseable-line'
  | 'unknown-ecosystem'
  | 'no-identity';

/** A dependency entry that was explicitly skipped and why. */
export interface SkippedDep {
  raw: string;
  name?: string;
  version?: string;
  reason: SkipReason;
}

/** Complete output from any one of the parsers. */
export interface ParseResult {
  kind: ManifestKind;
  checkable: CheckableDep[];
  skipped: SkippedDep[];
  /** Populated when the file itself could not be parsed. */
  parseError?: string;
}

// ---------------------------------------------------------------------------
// OSV querybatch models
// ---------------------------------------------------------------------------

/** Single query item sent to `POST /v1/querybatch`. */
export interface OsvQueryItem {
  /** Used only when purl is unavailable. */
  version?: string;
  package?: {
    /** Preferred OSV query shape for purl-based lookups. */
    purl?: string;
    name?: string;
    ecosystem?: string;
  };
}

/** A single result block from the OSV querybatch response. */
export interface OsvBatchResultItem {
  vulns?: Array<{id: string}>;
}

/** The full OSV querybatch response body. */
export interface OsvBatchResponse {
  results: OsvBatchResultItem[];
}

// ---------------------------------------------------------------------------
// Hydrated OSV vuln record (re-uses shape from vulnerabilityLookup.ts, kept
// local so the affected slice has no cross-feature import dependency)
// ---------------------------------------------------------------------------

export interface OsvVulnRecord {
  id: string;
  summary?: string;
  details?: string;
  aliases?: string[];
  modified?: string;
  published?: string;
  severity?: Array<{type: string; score: string}>;
  affected?: Array<{
    package?: {ecosystem: string; name: string; purl?: string};
    ranges?: Array<{
      type: string;
      events: Array<{introduced?: string; fixed?: string; last_affected?: string}>;
    }>;
    versions?: string[];
  }>;
  references?: Array<{type: string; url: string}>;
}

// ---------------------------------------------------------------------------
// Per-dependency result after querying + hydration
// ---------------------------------------------------------------------------

export type DepCheckStatus = 'affected' | 'clean';

export interface DepResult {
  dep: CheckableDep;
  status: DepCheckStatus;
  /** Full hydrated OSV records for each matched vuln ID. */
  vulns: OsvVulnRecord[];
}

// ---------------------------------------------------------------------------
// Summary counts for the results surface
// ---------------------------------------------------------------------------

export interface AffectedSummaryCounts {
  total: number;
  checkable: number;
  affected: number;
  clean: number;
  skipped: number;
}

// ---------------------------------------------------------------------------
// Workflow state machine
// ---------------------------------------------------------------------------

export type AffectedStatus =
  | 'idle'
  | 'parsing'
  | 'querying'
  | 'hydrating'
  | 'success'
  | 'partial'
  | 'error';

export interface AffectedState {
  status: AffectedStatus;
  fileName: string | null;
  parseResult: ParseResult | null;
  results: DepResult[];
  summary: AffectedSummaryCounts | null;
  errorMessage: string | null;
  /** Non-fatal notice shown to the user (e.g. all deps were skipped). */
  noticeMessage: string | null;
}
