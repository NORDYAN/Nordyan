import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function profileScreenSource(fileName: string): string {
  return readFileSync(path.join(root, 'app/(tabs)/profile', fileName), 'utf8');
}

describe('Profile sub-screen top spacing', () => {
  it('keeps the language title below its nav bar and safe-area edge', () => {
    const source = profileScreenSource('language.tsx');

    assert.match(source, /<ScreenContainer variant="profile">/);
    assert.match(source, /paddingTop:\s*profileHealthProfileLayout\.scrollPaddingTop/);
    assert.match(
      source,
      /lineHeight:\s*profileTypography\.screenTitleSize\s*\*\s*typography\.lineHeight\.tight/,
    );
  });

  it('matches the confirmed spacing pattern on account and health-profile screens', () => {
    for (const fileName of ['account.tsx', 'health-profile.tsx']) {
      assert.match(
        profileScreenSource(fileName),
        /paddingTop:\s*profileHealthProfileLayout\.scrollPaddingTop/,
      );
    }
  });
});
