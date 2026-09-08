import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('Profile subscription information page source contracts', () => {
  it('registers a tappable coming-soon Abonnemang row without billing', () => {
    const presentation = source('lib/presentation/profile-home/profile-home.presentation.ts');
    const layout = source('app/(tabs)/profile/_layout.tsx');
    const routes = source('constants/routes.ts');
    const screen = source('app/(tabs)/profile/subscription.tsx');

    assert.match(routes, /profileSubscription: '\/\(tabs\)\/profile\/subscription'/);
    assert.match(layout, /name="subscription"/);
    assert.match(
      presentation,
      /id: 'subscription',\s*status: 'comingSoon',[\s\S]*?route: routes\.profileSubscription,\s*showChevron: true/,
    );
    assert.match(screen, /ProfileFutureFeatureScreen/);
    assert.match(screen, /buildProfileSubscriptionView/);
    assert.match(screen, /status="comingSoon"/);
    assert.doesNotMatch(screen, /onActionPress/);
    assert.doesNotMatch(screen, /lib\/domain\/subscription|SubscriptionRepository|revenuecat|useSubscription/);
    assert.doesNotMatch(screen, /purchase|restorePurchases|trial|StoreKit|Play Billing/i);
  });

  it('leaves Food Scanner, Blood Tests, and Health Data Sources informational pages unchanged', () => {
    const food = source('app/(tabs)/profile/food-scanner.tsx');
    const blood = source('app/(tabs)/profile/blood-tests.tsx');
    const sources = source('app/(tabs)/profile/health-data-sources.tsx');

    assert.match(food, /ProfileFutureFeatureScreen/);
    assert.match(food, /profile\.foodScanner\.scan\.title/);
    assert.match(blood, /profile\.bloodTests\.hormones\.title/);
    assert.match(sources, /Apple Health/);
    assert.match(sources, /Health Connect \(Android\)/);
    assert.match(sources, /Garmin Connect/);
    assert.doesNotMatch(food, /profile\.subscription/);
    assert.doesNotMatch(blood, /profile\.subscription/);
    assert.doesNotMatch(sources, /profile\.subscription/);
  });
});
