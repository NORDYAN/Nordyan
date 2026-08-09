import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const libRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function collectTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
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

describe('Expo client coach-language security', () => {
  it('does not embed OPENAI_API_KEY or OpenAI SDK usage in lib/', () => {
    const files = collectTsFiles(libRoot);
    const banned = [
      /OPENAI_API_KEY/,
      /EXPO_PUBLIC_OPENAI/,
      /from\s+['"]openai['"]/,
      /require\(['"]openai['"]\)/,
    ];

    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      for (const pattern of banned) {
        assert.equal(
          pattern.test(content),
          false,
          `${path.relative(libRoot, file)} matched ${pattern}`,
        );
      }
    }
  });
});
