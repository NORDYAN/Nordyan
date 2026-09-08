import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function collectTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    if (entry === 'node_modules' || entry === '.git') {
      continue;
    }
    const full = path.join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      files.push(...collectTsFiles(full));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith('.test.ts')) {
      files.push(full);
    }
  }

  return files;
}

describe('Expo client account-delete security', () => {
  it('does not embed SERVICE_ROLE or service_role in app/ or lib/', () => {
    const files = [
      ...collectTsFiles(path.join(repoRoot, 'app')),
      ...collectTsFiles(path.join(repoRoot, 'lib')),
    ];
    const banned = [/SERVICE_ROLE/, /service_role/];

    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      for (const pattern of banned) {
        assert.equal(
          pattern.test(content),
          false,
          `${path.relative(repoRoot, file)} matched ${pattern}`,
        );
      }
    }
  });
});
