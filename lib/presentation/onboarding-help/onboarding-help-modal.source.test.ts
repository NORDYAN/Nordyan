import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { t } from '../../i18n';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

function sliceBetween(text: string, startMarker: string, endMarker: string): string {
  const start = text.indexOf(startMarker);
  assert.notEqual(start, -1, `missing ${startMarker}`);
  const end = text.indexOf(endMarker, start);
  assert.notEqual(end, -1, `missing ${endMarker} after ${startMarker}`);
  return text.slice(start, end);
}

describe('onboarding help modal safe-area shell', () => {
  it('gives informational modals a nested SafeAreaProvider with initial window metrics', () => {
    const shell = source('components/onboarding/OnboardingInfoModalShell.tsx');

    assert.match(shell, /SafeAreaProvider/);
    assert.match(shell, /initialWindowMetrics/);
    assert.match(shell, /initialMetrics=\{initialWindowMetrics\}/);
    assert.match(shell, /<Modal visible=\{visible\} transparent animationType="none"/);
    assert.match(shell, /edges=\{\['top', 'bottom'\]\}/);
    assert.match(shell, /accessibilityLabel=\{t\('common.close'\)\}/);
  });

  it('routes both help modals through the shared shell', () => {
    const activity = source('components/onboarding/ActivityHelpModal.tsx');
    const measurement = source('components/onboarding/MeasurementHelpModal.tsx');

    assert.match(activity, /from '\.\/OnboardingInfoModalShell'/);
    assert.match(measurement, /from '\.\/OnboardingInfoModalShell'/);
    assert.match(activity, /<OnboardingInfoModalShell/);
    assert.match(measurement, /<OnboardingInfoModalShell/);
    assert.match(activity, /onClose=\{onClose\}/);
    assert.match(measurement, /onClose=\{onClose\}/);
    assert.doesNotMatch(activity, /<Modal/);
    assert.doesNotMatch(measurement, /<Modal/);
    assert.doesNotMatch(activity, /SafeAreaView/);
    assert.doesNotMatch(measurement, /SafeAreaView/);
  });

  it('keeps existing help copy and close callbacks', () => {
    const activity = source('components/onboarding/ActivityHelpModal.tsx');
    const measurement = source('components/onboarding/MeasurementHelpModal.tsx');

    assert.match(activity, /profile\.activityHelp\.title/);
    assert.match(activity, /PROFILE_ACTIVITY_LEVEL_OPTIONS\.map/);
    assert.match(activity, /measureHelp\.understood/);
    assert.match(measurement, /measureHelp\.title/);
    assert.match(measurement, /measureHelp\.waistHeading/);
    assert.match(measurement, /measureHelp\.neckHeading/);
    assert.match(measurement, /measureHelp\.hipHeading/);
    assert.match(measurement, /measureHelp\.tipsHeading/);
    assert.match(measurement, /measureHelp\.understood/);
    assert.match(measurement, /health\.new\.tipsTitle/);
    assert.match(measurement, /health\.new\.tipsIntro/);
    assert.match(measurement, /health\.new\.tip\.morning/);
    assert.match(measurement, /health\.new\.tip\.toilet/);
    assert.match(measurement, /health\.new\.tip\.beforeTraining/);
    assert.match(measurement, /health\.new\.tip\.sameTime/);

    const waistIndex = measurement.indexOf("t('measureHelp.waistHeading')");
    const neckIndex = measurement.indexOf("t('measureHelp.neckHeading')");
    const hipIndex = measurement.indexOf("t('measureHelp.hipHeading')");
    const techniqueTipsIndex = measurement.indexOf("t('measureHelp.tipsHeading')");
    const reliabilityIndex = measurement.indexOf("t('health.new.tipsTitle')");
    assert.ok(waistIndex !== -1 && neckIndex !== -1 && hipIndex !== -1);
    assert.ok(techniqueTipsIndex !== -1 && reliabilityIndex !== -1);
    assert.ok(waistIndex < neckIndex);
    assert.ok(neckIndex < hipIndex);
    assert.ok(hipIndex < techniqueTipsIndex);
    assert.ok(techniqueTipsIndex < reliabilityIndex);
    assert.equal(t('measureHelp.tipsHeading', undefined, 'sv'), 'Mätteknik');
    assert.equal(t('measureHelp.tipsHeading', undefined, 'nb'), 'Måleteknikk');
    assert.equal(
      t('health.new.tipsTitle', undefined, 'sv'),
      'Tips för tillförlitliga mätningar',
    );
    assert.equal(t('health.new.tipsTitle', undefined, 'nb'), 'Tips for pålitelige målinger');
  });
});

describe('onboarding help link placement', () => {
  it('renders activity help before activity choices on personal profile', () => {
    const step4 = source('app/(onboarding)/step-4.tsx');
    const group = source('components/onboarding/ProfileSingleChoiceGroup.tsx');
    const activityBlock = sliceBetween(
      step4,
      "label={t('onboarding.activityLevel')}",
      'styles.footer',
    );

    assert.match(activityBlock, /beforeOptions=\{/);
    assert.match(activityBlock, /t\('onboarding.activityHelp'\)/);
    assert.equal((step4.match(/t\('onboarding.activityHelp'\)/g) ?? []).length, 2);
    assert.ok(
      activityBlock.indexOf('beforeOptions={') < activityBlock.indexOf("t('onboarding.activityHelp')"),
    );

    const labelIndex = group.indexOf('<Text style={styles.label}>{label}</Text>');
    const beforeOptionsIndex = group.indexOf('{beforeOptions}');
    const optionsIndex = group.indexOf("layout === 'row' ? styles.optionsRow : styles.optionsStack");
    assert.ok(labelIndex !== -1 && beforeOptionsIndex !== -1 && optionsIndex !== -1);
    assert.ok(labelIndex < beforeOptionsIndex);
    assert.ok(beforeOptionsIndex < optionsIndex);

    const healthProfile = source('app/(tabs)/profile/health-profile.tsx');
    assert.doesNotMatch(healthProfile, /beforeOptions/);
  });

  it('renders measurement help before measurement inputs on body measurements', () => {
    const screen = source('app/(onboarding)/body-measurements.tsx');
    const formSection = sliceBetween(screen, 'styles.formSection', 'styles.footer');

    const headingIndex = formSection.indexOf("t('onboarding.bodyMeasurements.sectionLabel')");
    const helpIndex = formSection.indexOf("t('onboarding.measureHelp')");
    const cardIndex = formSection.indexOf('styles.measurementCard');
    const waistIndex = formSection.indexOf("t('onboarding.waist')");

    assert.ok(headingIndex !== -1 && helpIndex !== -1 && cardIndex !== -1 && waistIndex !== -1);
    assert.ok(headingIndex < helpIndex);
    assert.ok(helpIndex < cardIndex);
    assert.ok(cardIndex < waistIndex);
    assert.equal((screen.match(/t\('onboarding.measureHelp'\)/g) ?? []).length, 2);
  });
});
