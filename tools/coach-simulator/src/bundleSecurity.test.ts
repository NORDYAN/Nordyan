import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE_FORBIDDEN_PATTERNS = [
  /OPENAI_API_KEY/i,
  /VITE_OPENAI/i,
  /sk-[a-zA-Z0-9]{10,}/,
  /openai\.com\/v1/i,
];

const BUNDLE_FORBIDDEN_PATTERNS = [
  /VITE_OPENAI/i,
  /sk-[a-zA-Z0-9]{20,}/,
  /from\s*["']openai["']/,
  /process\.env\.OPENAI/i,
];

function walkDistFiles(directory: string): string[] {
  const entries = readdirSync(directory);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...walkDistFiles(fullPath));
      continue;
    }

    if (/\.(js|css|html|map)$/.test(entry)) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('browser bundle security', () => {
  it('does not include API keys or OpenAI client configuration in source', () => {
    const sourceFiles = [
      'src/coachLanguageService.ts',
      'src/coachSimulator.tsx',
      'src/runCoachSimulatorPipeline.ts',
      'src/mockCoachAi.ts',
    ];

    for (const file of sourceFiles) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      for (const pattern of SOURCE_FORBIDDEN_PATTERNS) {
        expect(content).not.toMatch(pattern);
      }
    }
  });

  it('does not leak API keys in the production build when dist exists', () => {
    const distPath = join(process.cwd(), 'dist');
    let files: string[] = [];

    try {
      files = walkDistFiles(distPath);
    } catch {
      expect(true).toBe(true);
      return;
    }

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      for (const pattern of BUNDLE_FORBIDDEN_PATTERNS) {
        expect(content).not.toMatch(pattern);
      }
    }
  });
});
