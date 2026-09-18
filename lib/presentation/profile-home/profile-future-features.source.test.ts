import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

const FORBIDDEN_CAPTURE = /Camera|Barcode|DocumentPicker|launchImageLibrary|ImagePicker|expo-camera|expo-barcode|scanFood|uploadLab|connect\(/;

describe('Profile future features source contracts', () => {
  it('wires informational coming-soon rows without fake capture or connect', () => {
    const profile = source('app/(tabs)/profile/index.tsx');
    const layout = source('app/(tabs)/profile/_layout.tsx');
    const sources = source('app/(tabs)/profile/health-data-sources.tsx');
    const food = source('app/(tabs)/profile/food-scanner.tsx');
    const blood = source('app/(tabs)/profile/blood-tests.tsx');
    const row = source('components/profile/ProfileSettingsRow.tsx');
    const home = source('app/(tabs)/home.tsx');
    const routes = source('constants/routes.ts');

    assert.match(layout, /name="health-data-sources"/);
    assert.match(layout, /name="food-scanner"/);
    assert.match(layout, /name="blood-tests"/);
    assert.match(layout, /name="subscription"/);
    assert.match(layout, /name="notifications"/);
    assert.match(routes, /profileNotifications/);
    assert.match(routes, /profileFoodScanner/);
    assert.match(routes, /profileBloodTests/);
    assert.match(routes, /profileHealthDataSources/);
    assert.match(routes, /profileSubscription/);

    assert.match(profile, /row\.route/);
    assert.match(row, /const interactive = onPress != null/);
    assert.match(row, /const resolvedChevron = showChevron/);

    assert.match(sources, /health\.sources\.suggest\.action/);
    assert.doesNotMatch(sources, /Alert\.alert/);
    assert.doesNotMatch(sources, /handleConnectPress/);
    assert.doesNotMatch(sources, /health\.sources\.connect/);
    assert.doesNotMatch(sources, /status="disconnected"/);
    assert.match(sources, /status="comingSoon"/);
    assert.match(sources, /router\.back\(\)/);
    assert.match(sources, /Apple Health/);
    assert.match(sources, /Health Connect/);
    assert.match(sources, /Garmin Connect/);

    assert.match(food, /ProfileFutureFeatureScreen/);
    assert.match(food, /status="comingSoon"/);
    assert.doesNotMatch(food, FORBIDDEN_CAPTURE);
    assert.doesNotMatch(food, /onActionPress/);

    assert.match(blood, /ProfileFutureFeatureScreen/);
    assert.match(blood, /status="comingSoon"/);
    assert.doesNotMatch(blood, FORBIDDEN_CAPTURE);
    assert.doesNotMatch(blood, /onActionPress/);

    const chrome = source('components/profile/ProfileFutureFeatureScreen.tsx');
    assert.match(chrome, /router\.back\(\)/);
    assert.match(chrome, /<OnboardingBackButton onPress=\{\(\) => router\.back\(\)\} \/>/);

    assert.doesNotMatch(home, /Food Scanner|foodScanner|profileFoodScanner|matskanner/i);
    assert.doesNotMatch(home, /Blodprover|blood-tests|profileBloodTests|Blodprøver/);
    assert.match(home, /home\.greeting\.default/);
  });
});
