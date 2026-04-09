import type {CheckableDep, ParseResult, SkippedDep} from '../affectedTypes.ts';

const PINNED_RE = /^([A-Za-z0-9_.\-\[\]]+)==([^\s;,]+)/;
const COMMENT_RE = /^\s*#/;
const BLANK_RE = /^\s*$/;

export function parseRequirementsTxt(content: string): ParseResult {
  const checkable: CheckableDep[] = [];
  const skipped: SkippedDep[] = [];

  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    if (COMMENT_RE.test(line) || BLANK_RE.test(line)) continue;

    const trimmed = line.trim();

    if (trimmed.startsWith('-e ') || trimmed.startsWith('--editable')) {
      skipped.push({raw: trimmed, reason: 'editable-install'});
      continue;
    }

    if (
      trimmed.startsWith('git+') ||
      trimmed.startsWith('hg+') ||
      trimmed.startsWith('svn+') ||
      trimmed.startsWith('bzr+')
    ) {
      skipped.push({raw: trimmed, reason: 'vcs-url'});
      continue;
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      skipped.push({raw: trimmed, reason: 'vcs-url'});
      continue;
    }

    if (trimmed.startsWith('-r ') || trimmed.startsWith('--requirement')) {
      skipped.push({raw: trimmed, reason: 'unparseable-line'});
      continue;
    }

    const match = PINNED_RE.exec(trimmed);
    if (match) {
      const name = match[1].replace(/\[.*\]$/, '');
      const version = match[2];
      checkable.push({
        name,
        version,
        purl: `pkg:pypi/${encodeURIComponent(name.toLowerCase())}@${version}`,
        ecosystem: 'PyPI',
        origin: 'requirements.txt',
      });
      continue;
    }

    if (/[><!~^]/.test(trimmed) || /[><=!]/.test(trimmed)) {
      const namePart = trimmed.split(/[><=!~^]/)[0].trim().replace(/\[.*\]$/, '');
      skipped.push({raw: trimmed, name: namePart || undefined, reason: 'version-range'});
      continue;
    }

    if (/^[A-Za-z0-9_.\-]+$/.test(trimmed)) {
      skipped.push({raw: trimmed, name: trimmed, reason: 'no-version'});
      continue;
    }

    skipped.push({raw: trimmed, reason: 'unparseable-line'});
  }

  return {kind: 'requirements.txt', checkable, skipped};
}
