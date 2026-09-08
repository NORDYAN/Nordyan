import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { applyLocaleNavigatorRemount } from './locale-navigator-remount';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('locale navigator remount', () => {
  it('does not remount the native stack while locale hydrates', () => {
    const initial = { settledLocale: null, generation: 0 };
    const beforeReady = applyLocaleNavigatorRemount(initial, {
      isReady: false,
      locale: 'sv',
    });
    assert.deepEqual(beforeReady, initial);

    const afterHydrateNb = applyLocaleNavigatorRemount(beforeReady, {
      isReady: true,
      locale: 'nb',
    });
    assert.deepEqual(afterHydrateNb, { settledLocale: 'nb', generation: 0 });

    const sameLocale = applyLocaleNavigatorRemount(afterHydrateNb, {
      isReady: true,
      locale: 'nb',
    });
    assert.equal(sameLocale.generation, 0);
  });

  it('remounts only after an explicit locale change on a settled tree', () => {
    const settled = applyLocaleNavigatorRemount(
      { settledLocale: null, generation: 0 },
      { isReady: true, locale: 'sv' },
    );
    const changed = applyLocaleNavigatorRemount(settled, {
      isReady: true,
      locale: 'nb',
    });
    assert.deepEqual(changed, { settledLocale: 'nb', generation: 1 });
  });

  it('does not key the Expo Router stack on the hydrating locale', () => {
    const i18n = source('lib/i18n/I18nProvider.tsx');
    const providers = source('providers/app-providers.tsx');
    const onboardingLayout = source('app/(onboarding)/_layout.tsx');
    const authLayout = source('app/(auth)/_layout.tsx');

    assert.match(i18n, /applyLocaleNavigatorRemount/);
    assert.doesNotMatch(i18n, /<Fragment key=\{locale\}>/);
    assert.match(providers, /<LocaleKeyedSubtree>\{children\}<\/LocaleKeyedSubtree>/);
    assert.match(onboardingLayout, /styles\.stackHost/);
    assert.match(onboardingLayout, /collapsable=\{false\}/);
    assert.match(authLayout, /<Stack/);
    assert.match(authLayout, /Redirect href=\{routes\.root\}/);
    assert.match(authLayout, /if \(isReady && status === 'authenticated'\) \{/);
    assert.match(authLayout, /return <Redirect href=\{routes\.root\} \/>/);
    assert.ok(authLayout.indexOf('return <Redirect href={routes.root} />') < authLayout.indexOf('<Stack'));
    assert.doesNotMatch(authLayout, /<>[\s\S]*<Stack[\s\S]*Redirect/);
  });
});
