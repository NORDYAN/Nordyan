import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

const PAGE_BACK_FILES = [
  'app/(tabs)/health/new-measurement.tsx',
  'app/(tabs)/profile/health-profile.tsx',
  'app/(tabs)/profile/account.tsx',
  'app/(tabs)/profile/language.tsx',
  'app/(tabs)/profile/notifications.tsx',
  'app/(tabs)/profile/privacy.tsx',
  'app/(tabs)/profile/health-data-sources.tsx',
  'components/profile/ProfileFutureFeatureScreen.tsx',
  'components/development/DevelopmentTrendsHeader.tsx',
  'components/health-score-explained/HealthScoreExplainedHeader.tsx',
  'components/weekly-check-in/WeeklyCheckInBackButton.tsx',
] as const;

describe('canonical Back and Close presentation', () => {
  it('keeps the onboarding Back button as chevron-back without chip chrome', () => {
    const back = source('components/onboarding/OnboardingBackButton.tsx');

    assert.match(back, /name="chevron-back"/);
    assert.match(back, /initialLifestyleLayout\.backIconSize/);
    assert.match(back, /width: 44/);
    assert.match(back, /height: 44/);
    assert.match(back, /backHitSlop/);
    assert.match(back, /t\('common\.back'\)/);
    assert.doesNotMatch(back, /arrow-back|borderWidth|backgroundColor/);
    assert.match(back, /disabled=\{disabled\}/);
    assert.match(back, /onPress \?\? \(\(\) => router\.back\(\)\)/);
  });

  it('standardizes listed page-level Back controls onto OnboardingBackButton', () => {
    for (const relativePath of PAGE_BACK_FILES) {
      const file = source(relativePath);
      assert.match(file, /OnboardingBackButton/, relativePath);
      assert.doesNotMatch(file, /OnboardingBackHeader/, relativePath);
      assert.doesNotMatch(file, /arrow-back/, relativePath);
      assert.doesNotMatch(file, /name="chevron-back"/, relativePath);
    }

    const newMeasurement = source('app/(tabs)/health/new-measurement.tsx');
    const healthProfile = source('app/(tabs)/profile/health-profile.tsx');
    const account = source('app/(tabs)/profile/account.tsx');
    const language = source('app/(tabs)/profile/language.tsx');
    const notifications = source('app/(tabs)/profile/notifications.tsx');
    const privacy = source('app/(tabs)/profile/privacy.tsx');
    const sources = source('app/(tabs)/profile/health-data-sources.tsx');
    const future = source('components/profile/ProfileFutureFeatureScreen.tsx');
    const trends = source('components/development/DevelopmentTrendsView.tsx');
    const trendsHeader = source('components/development/DevelopmentTrendsHeader.tsx');
    const explained = source('app/health-score.tsx');
    const explainedHeader = source('components/health-score-explained/HealthScoreExplainedHeader.tsx');

    assert.match(newMeasurement, /<OnboardingBackButton onPress=\{\(\) => router\.back\(\)\} \/>/);
    assert.match(healthProfile, /<OnboardingBackButton onPress=\{\(\) => router\.back\(\)\} \/>/);
    assert.match(account, /<OnboardingBackButton onPress=\{\(\) => router\.back\(\)\} \/>/);
    assert.match(language, /<OnboardingBackButton onPress=\{\(\) => router\.back\(\)\} \/>/);
    assert.match(notifications, /<OnboardingBackButton onPress=\{\(\) => router\.back\(\)\} \/>/);
    assert.match(sources, /<OnboardingBackButton onPress=\{\(\) => router\.back\(\)\} \/>/);
    assert.match(future, /<OnboardingBackButton onPress=\{\(\) => router\.back\(\)\} \/>/);
    assert.match(privacy, /onPress=\{\(\) => router\.back\(\)\}/);
    assert.match(privacy, /disabled=\{isDeleting\}/);
    assert.match(privacy, /import \{ Ionicons \} from '@expo\/vector-icons'/);
    assert.match(privacy, /<Ionicons/);

    assert.match(trends, /onBackPress=\{\(\) => router\.back\(\)\}/);
    assert.match(trendsHeader, /<OnboardingBackButton onPress=\{onBackPress\} \/>/);
    assert.match(explained, /onBackPress=\{\(\) => router\.back\(\)\}/);
    assert.match(explainedHeader, /<OnboardingBackButton onPress=\{onBackPress\} \/>/);
  });

  it('keeps Weekly Check-in Back as previous-step onPress, not router.back', () => {
    const weeklyBack = source('components/weekly-check-in/WeeklyCheckInBackButton.tsx');
    const question = source('components/weekly-check-in/WeeklyCheckInQuestion.tsx');
    const view = source('components/weekly-check-in/WeeklyCheckInView.tsx');
    const hook = source('lib/hooks/weekly-check-in/useWeeklyCheckIn.ts');

    assert.match(weeklyBack, /<OnboardingBackButton onPress=\{onPress\} \/>/);
    assert.doesNotMatch(weeklyBack, /router\.back/);
    assert.match(question, /<WeeklyCheckInBackButton onPress=\{onBack\} \/>/);
    assert.match(view, /onBack=\{flow\.goBack\}/);
    assert.match(hook, /retreatWeeklyCheckInStep/);
    assert.doesNotMatch(hook, /router\.(back|replace|push)/);
  });

  it('keeps Ionicons imported when a standardized Back file still renders Ionicons', () => {
    const files = [
      ...PAGE_BACK_FILES,
      'components/onboarding/OnboardingInfoModalShell.tsx',
    ];

    for (const relativePath of files) {
      const file = source(relativePath);
      if (!/<Ionicons\b/.test(file)) {
        continue;
      }
      assert.match(
        file,
        /import \{ Ionicons \} from '@expo\/vector-icons'/,
        relativePath,
      );
    }
  });

  it('uses an X close control on the shared info modal shell', () => {
    const shell = source('components/onboarding/OnboardingInfoModalShell.tsx');
    const activity = source('components/onboarding/ActivityHelpModal.tsx');
    const measurement = source('components/onboarding/MeasurementHelpModal.tsx');
    const legal = source('components/legal/LegalDocumentModal.tsx');

    assert.match(shell, /name="close"/);
    assert.match(shell, /t\('common\.close'\)/);
    assert.match(shell, /onPress=\{handleClose\}/);
    assert.match(shell, /onClose\(\)/);
    assert.match(shell, /width: onboardingMeasurementHelpLayout\.backTouchSize/);
    assert.doesNotMatch(shell, /arrow-back|chevron-back/);
    assert.match(activity, /<OnboardingInfoModalShell/);
    assert.match(measurement, /<OnboardingInfoModalShell/);
    assert.match(legal, /<OnboardingInfoModalShell/);
  });
});
