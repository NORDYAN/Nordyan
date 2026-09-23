import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { t } from '../../i18n';
import {
  DEVELOPMENT_HOME_MEASUREMENT_CTA_ROUTE,
  getDevelopmentHomeEmptyMessage,
  getDevelopmentHomeInsufficientMessage,
} from './development.presentation';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('Development home presentation contracts', () => {
  it('keeps Back off the Utveckling tab root and on nested Trends and Health Score Explained', () => {
    const home = source('components/development/DevelopmentHomeView.tsx');
    const header = source('components/development/DevelopmentHomeHeader.tsx');
    const trends = source('components/development/DevelopmentTrendsView.tsx');
    const trendsHeader = source('components/development/DevelopmentTrendsHeader.tsx');
    const explained = source('app/health-score.tsx');
    const explainedHeader = source('components/health-score-explained/HealthScoreExplainedHeader.tsx');

    assert.doesNotMatch(home, /onBackPress|router\.back|canGoBack|common\.back|arrow-back/);
    assert.doesNotMatch(header, /onBackPress|common\.back|arrow-back|Ionicons/);
    assert.match(trends, /onBackPress=\{\(\) => router\.back\(\)\}/);
    assert.match(trendsHeader, /<OnboardingBackButton onPress=\{onBackPress\} \/>/);
    assert.doesNotMatch(trendsHeader, /arrow-back|OnboardingBackHeader|borderRadius/);
    assert.match(explained, /onBackPress=\{\(\) => router\.back\(\)\}/);
    assert.match(explainedHeader, /<OnboardingBackButton onPress=\{onBackPress\} \/>/);
    assert.doesNotMatch(explainedHeader, /arrow-back|OnboardingBackHeader|borderRadius/);
  });

  it('adds a new-measurement CTA for empty and insufficient history', () => {
    const home = source('components/development/DevelopmentHomeView.tsx');
    const empty = source('components/measurement/MeasurementHistoryEmptyState.tsx');

    assert.equal(DEVELOPMENT_HOME_MEASUREMENT_CTA_ROUTE, '/(tabs)/health/new-measurement');
    assert.match(home, /DEVELOPMENT_HOME_MEASUREMENT_CTA_ROUTE/);
    assert.match(home, /health\.history\.register/);
    assert.match(empty, /routes\.healthNewMeasurement/);
    assert.match(home, /getDevelopmentHomeInsufficientMessage/);
    assert.equal(
      getDevelopmentHomeEmptyMessage(),
      'Din utveckling kan inte visas ännu. Spara en hälsomätning för att komma igång.',
    );
    assert.equal(
      getDevelopmentHomeInsufficientMessage(),
      'Din första hälsomätning är sparad. Spara en ny mätning för att kunna jämföra din utveckling över tid.',
    );
    assert.equal(t('development.home.insufficient', undefined, 'nb'), 
      'Den første helsemålingen din er lagret. Lagre en ny måling for å kunne sammenligne utviklingen din over tid.',
    );
  });

  it('uses development.trends.title on the nested Trends screen', () => {
    const trendsHeader = source('components/development/DevelopmentTrendsHeader.tsx');
    assert.match(trendsHeader, /t\('development\.trends\.title'\)/);
    assert.doesNotMatch(trendsHeader, /development\.home\.title/);
    assert.equal(t('development.trends.title', undefined, 'sv'), 'Trender');
    assert.equal(t('development.trends.title', undefined, 'nb'), 'Trender');
  });

  it('keeps the snapshot Coach recommendation on Development root, not Trends or Health Score Explained', () => {
    const home = source('components/development/DevelopmentHomeView.tsx');
    const trends = source('components/development/DevelopmentTrendsView.tsx');
    const explained = source('components/health-score-explained/HealthScoreExplainedView.tsx');

    assert.match(home, /<DevelopmentCoachCard coach=\{model\.coach\} \/>/);
    assert.doesNotMatch(trends, /DevelopmentCoachCard|HealthScoreExplainedCoachCard/);
    assert.doesNotMatch(explained, /HealthScoreExplainedCoachCard|DevelopmentCoachCard/);
    assert.match(trends, /DevelopmentTrendsHeader onBackPress=\{\(\) => router\.back\(\)\}/);
    assert.match(trends, /DEVELOPMENT_FACTORS_CTA_ROUTE/);
    assert.match(trends, /DevelopmentTrendChart/);
  });

  it('keeps Health Score Explained on the shared Development Home summary', () => {
    const explainedService = source(
      'lib/services/health-score-explained/health-score-explained.service.ts',
    );
    const developmentService = source('lib/services/development/development.service.ts');
    const derivation = source('lib/services/development/development.derivation.ts');

    assert.match(explainedService, /return developmentService\.getHomeSummary\(userId\)/);
    assert.match(developmentService, /measurementService\.getMeasurementHistory/);
    assert.match(developmentService, /DEFAULT_SNAPSHOT_HISTORY_LIMIT/);
    assert.match(developmentService, /historyResult\.value\[1\]/);
    assert.match(derivation, /latest\.overallScore, previous\.overallScore/);
    assert.match(derivation, /buildMeasurementDriverDelta/);
    assert.match(derivation, /buildActivityLevelDelta/);
    assert.doesNotMatch(developmentService, /SNAPSHOTS_FOR_LATEST_VS_PREVIOUS/);
  });

  it('does not infer Development Home colors from formatted + / − strings', () => {
    const driverCard = source('components/development/DevelopmentDriverCard.tsx');
    const hero = source('components/development/DevelopmentScoreHero.tsx');

    assert.doesNotMatch(driverCard, /startsWith\('\+'\)|startsWith\('−'\)|startsWith\('-'\)/);
    assert.match(driverCard, /row\.tone === 'positive'/);
    assert.match(driverCard, /row\.tone === 'negative'/);
    assert.match(hero, /scoreChange\.tone === 'positive'/);
    assert.match(hero, /scoreChange\.tone === 'negative'/);
    assert.doesNotMatch(hero, /direction === 'down'\s*\n\s*\? 'accent'/);
  });

  it('applies Health Score change tone on Explained and Trends pills without recoloring the chart', () => {
    const explained = source(
      'components/health-score-explained/HealthScoreExplainedSummaryCard.tsx',
    );
    const trendsCard = source('components/development/DevelopmentTrendsScoreCard.tsx');
    const chart = source('components/development/DevelopmentTrendChart.tsx');

    assert.match(explained, /scoreChange\.tone === 'positive'/);
    assert.match(explained, /scoreChange\.tone === 'negative'/);
    assert.match(explained, /onboardingErrorText/);
    assert.doesNotMatch(explained, /up \|\| scoreChange\.direction === 'down'/);

    assert.match(trendsCard, /periodChange\.tone === 'positive'/);
    assert.match(trendsCard, /periodChange\.tone === 'negative'/);
    assert.match(trendsCard, /onboardingErrorText/);
    assert.doesNotMatch(trendsCard, /up \|\| periodChange\.direction === 'down'/);

    assert.match(chart, /stroke=\{colors\.brandAccent\}/);
    assert.match(chart, /fill=\{colors\.brandAccent\}/);
    assert.doesNotMatch(chart, /onboardingErrorText/);
    assert.doesNotMatch(chart, /periodChange\.tone|scoreChange\.tone/);
  });
});
