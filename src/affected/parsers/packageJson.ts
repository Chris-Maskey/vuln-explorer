import type {CheckableDep, ParseResult, SkippedDep} from '../affectedTypes.ts';

const EXACT_VERSION_RE = /^\d+\.\d+\.\d+(\.\d+)*(-[\w.]+)?(\+[\w.]+)?$/;
const RANGE_PREFIXES = ['^', '~', '>', '<', '>=', '<=', '!=', '*', 'x', 'X'];

function isExactVersion(version: string): boolean {
  return EXACT_VERSION_RE.test(version.trim());
}

function isRange(version: string): boolean {
  const v = version.trim();
  return RANGE_PREFIXES.some((p) => v.startsWith(p)) || v === '*' || v === 'latest';
}

function isGitReference(version: string): boolean {
  const v = version.trim().toLowerCase();
  return (
    v.startsWith('git+') ||
    v.startsWith('git://') ||
    v.startsWith('github:') ||
    v.startsWith('bitbucket:') ||
    v.startsWith('gitlab:')
  );
}

function isFileReference(version: string): boolean {
  const v = version.trim();
  return v.startsWith('file:') || v.startsWith('./') || v.startsWith('../') || v.startsWith('/');
}

function isWorkspaceReference(version: string): boolean {
  return version.trim().startsWith('workspace:');
}

interface PackageJsonShape {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

function buildNpmPurl(name: string, version: string): string {
  if (name.startsWith('@')) {
    const [scope, packageName] = name.split('/');
    if (scope && packageName) {
      return `pkg:npm/${encodeURIComponent(scope)}/${encodeURIComponent(packageName)}@${version}`;
    }
  }

  return `pkg:npm/${encodeURIComponent(name)}@${version}`;
}

export function parsePackageJson(content: string): ParseResult {
  let parsed: PackageJsonShape;

  try {
    parsed = JSON.parse(content) as PackageJsonShape;
  } catch {
    return {
      kind: 'package.json',
      checkable: [],
      skipped: [],
      parseError: 'Invalid JSON — could not parse package.json.',
    };
  }

  const checkable: CheckableDep[] = [];
  const skipped: SkippedDep[] = [];

  const sections: Array<[keyof PackageJsonShape, string]> = [
    ['dependencies', 'dependencies'],
    ['devDependencies', 'devDependencies'],
  ];

  for (const [key, origin] of sections) {
    const deps = parsed[key];
    if (!deps || typeof deps !== 'object') continue;

    for (const [name, version] of Object.entries(deps)) {
      if (typeof version !== 'string') {
        skipped.push({raw: `${name}@${String(version)}`, name, reason: 'unparseable-line'});
        continue;
      }

      const raw = `${name}@${version}`;

      if (isGitReference(version)) {
        skipped.push({raw, name, version, reason: 'git-reference'});
      } else if (isFileReference(version)) {
        skipped.push({raw, name, version, reason: 'file-reference'});
      } else if (isWorkspaceReference(version)) {
        skipped.push({raw, name, version, reason: 'workspace-reference'});
      } else if (isRange(version)) {
        skipped.push({raw, name, version, reason: 'version-range'});
      } else if (isExactVersion(version)) {
        checkable.push({
          name,
          version,
          purl: buildNpmPurl(name, version),
          ecosystem: 'npm',
          origin,
        });
      } else {
        skipped.push({raw, name, version, reason: 'version-range'});
      }
    }
  }

  return {kind: 'package.json', checkable, skipped};
}
