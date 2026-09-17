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
    assert.match(trendsHeader, /accessibilityLabel=\{t\('common\.back'\)\}/);
    assert.match(trendsHeader, /name="arrow-back"/);
    assert.match(explained, /onBackPress=\{\(\) => router\.back\(\)\}/);
    assert.match(explainedHeader, /accessibilityLabel=\{t\('common\.back'\)\}/);
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
});
