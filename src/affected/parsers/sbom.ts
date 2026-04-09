import type {CheckableDep, ManifestKind, ParseResult, SkippedDep} from '../affectedTypes.ts';

interface CycloneDxComponent {
  name?: string;
  version?: string;
  purl?: string;
  type?: string;
}

interface CycloneDxSbom {
  components?: CycloneDxComponent[];
}

interface SpdxPackage {
  name?: string;
  versionInfo?: string;
  externalRefs?: Array<{referenceType?: string; referenceLocator?: string}>;
}

interface SpdxSbom {
  packages?: SpdxPackage[];
  spdxVersion?: string;
}

const PURL_ECOSYSTEM_MAP: Record<string, string> = {
  npm: 'npm',
  pypi: 'PyPI',
  maven: 'Maven',
  golang: 'Go',
  cargo: 'crates.io',
  nuget: 'NuGet',
  gem: 'RubyGems',
  composer: 'Packagist',
  hex: 'Hex',
  pub: 'Pub',
};

function extractVersionFromPurl(purl: string): string | null {
  const withoutFragment = purl.split('#')[0];
  const withoutQualifiers = withoutFragment.split('?')[0];
  const versionIndex = withoutQualifiers.lastIndexOf('@');

  if (versionIndex === -1 || versionIndex === withoutQualifiers.length - 1) {
    return null;
  }

  return withoutQualifiers.slice(versionIndex + 1);
}

function extractEcosystemFromPurl(purl: string): string {
  const match = /^pkg:([^/]+)\//.exec(purl);
  if (!match) return 'unknown';
  const type = match[1].toLowerCase();
  return PURL_ECOSYSTEM_MAP[type] ?? type;
}

function parseCycloneDx(parsed: CycloneDxSbom): ParseResult {
  const checkable: CheckableDep[] = [];
  const skipped: SkippedDep[] = [];

  for (const comp of parsed.components ?? []) {
    const raw = comp.purl ?? `${comp.name ?? 'unknown'}@${comp.version ?? ''}`;

    if (comp.purl) {
      const ecosystem = extractEcosystemFromPurl(comp.purl);
      if (ecosystem === 'unknown') {
        skipped.push({raw, name: comp.name, version: comp.version, reason: 'unknown-ecosystem'});
        continue;
      }
      const name = comp.name ?? raw;
      const version = comp.version ?? extractVersionFromPurl(comp.purl) ?? '';
      if (!version) {
        skipped.push({raw, name, reason: 'no-version'});
        continue;
      }
      checkable.push({name, version, purl: comp.purl, ecosystem, origin: 'sbom'});
    } else if (comp.name && comp.version) {
      skipped.push({raw, name: comp.name, version: comp.version, reason: 'no-identity'});
    } else {
      skipped.push({raw, reason: 'no-identity'});
    }
  }

  return {kind: 'sbom-cyclonedx', checkable, skipped};
}

function parseSpdx(parsed: SpdxSbom): ParseResult {
  const checkable: CheckableDep[] = [];
  const skipped: SkippedDep[] = [];

  for (const pkg of parsed.packages ?? []) {
    const name = pkg.name ?? '';
    const version = pkg.versionInfo ?? '';

    const purlRef = pkg.externalRefs?.find(
      (r) => r.referenceType === 'purl' && r.referenceLocator,
    );

    const raw = purlRef?.referenceLocator ?? `${name}@${version}`;

    if (purlRef?.referenceLocator) {
      const purl = purlRef.referenceLocator;
      const ecosystem = extractEcosystemFromPurl(purl);
      if (ecosystem === 'unknown') {
        skipped.push({raw, name, version: version || undefined, reason: 'unknown-ecosystem'});
        continue;
      }
      const resolvedVersion = version || extractVersionFromPurl(purl) || '';
      if (!resolvedVersion) {
        skipped.push({raw, name, reason: 'no-version'});
        continue;
      }
      checkable.push({name, version: resolvedVersion, purl, ecosystem, origin: 'sbom'});
    } else if (name && version) {
      skipped.push({raw, name, version, reason: 'no-identity'});
    } else {
      skipped.push({raw: name || 'unknown', name: name || undefined, reason: 'no-identity'});
    }
  }

  return {kind: 'sbom-spdx', checkable, skipped};
}

export function parseSbom(content: string): ParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    return {
      kind: 'sbom-cyclonedx',
      checkable: [],
      skipped: [],
      parseError: 'Invalid JSON — could not parse SBOM file.',
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return {
      kind: 'sbom-cyclonedx',
      checkable: [],
      skipped: [],
      parseError: 'Unexpected SBOM structure — root must be a JSON object.',
    };
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj['spdxVersion'] === 'string') {
    return parseSpdx(obj as SpdxSbom);
  }

  if (obj['bomFormat'] !== undefined || Array.isArray(obj['components'])) {
    return parseCycloneDx(obj as CycloneDxSbom);
  }

  const result = parseCycloneDx(obj as CycloneDxSbom);
  if (result.checkable.length > 0 || result.skipped.length > 0) {
    return result;
  }

  return {
    kind: 'sbom-cyclonedx',
    checkable: [],
    skipped: [],
    parseError: 'Unrecognized SBOM format — expected CycloneDX or SPDX JSON.',
  };
}
