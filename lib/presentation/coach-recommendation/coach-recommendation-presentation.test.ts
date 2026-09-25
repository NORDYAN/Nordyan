import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  COACH_FOCUS_CANDIDATES,
  COACH_FALLBACK_RECOMMENDATION,
  generateRecommendation,
  coachSuccessTestVectors,
} from '../../domain/coach-engine';
import { getLocalizedCoachPresentation } from '../../i18n';
import { nb } from '../../i18n/resources/nb';
import { sv } from '../../i18n/resources/sv';
import { getCoachPresentation } from '../../services/coach/coach.presentation';

import {
  COACH_RECOMMENDATION_PRESENTATION_CATALOG,
  getCoachRecommendationPresentationMeta,
  resolveCoachRecommendationPresentationTier,
} from './index';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function engineIds(): string[] {
  const ids = Object.values(COACH_FOCUS_CANDIDATES).flatMap((list) =>
    list.map((item) => item.recommendationId),
  );
  ids.push(COACH_FALLBACK_RECOMMENDATION.recommendationId);
  return [...new Set(ids)];
}

describe('Coach recommendation presentation catalog', () => {
  it('covers every selectable Coach Engine family with cooldown metadata only', () => {
    const catalogIds = COACH_RECOMMENDATION_PRESENTATION_CATALOG.map((item) => item.recommendationId);
    assert.deepEqual([...catalogIds].sort(), [...engineIds()].sort());
    for (const item of COACH_RECOMMENDATION_PRESENTATION_CATALOG) {
      assert.equal(item.cooldownDays, 7);
      assert.ok(Array.isArray(item.futureTrendSignals));
    }
  });

  it('has SV and NB general presentation for every family', () => {
    for (const item of COACH_RECOMMENDATION_PRESENTATION_CATALOG) {
      const titleKey = `plan.${item.recommendationId}.general.title` as keyof typeof sv;
      const bodyKey = `plan.${item.recommendationId}.general.body` as keyof typeof sv;
      assert.ok(sv[titleKey].length > 0);
      assert.ok(sv[bodyKey].length > 0);
      assert.ok(nb[titleKey].length > 0);
      assert.ok(nb[bodyKey].length > 0);
      assert.notEqual(sv[titleKey], nb[titleKey]);
      assert.equal(sv[bodyKey].includes('{minutes}'), false);
      assert.equal(nb[bodyKey].includes('{minutes}'), false);
    }
  });
});

describe('Coach recommendation presentation tier', () => {
  it('uses GENERAL for a low-data weight-balance walking recommendation, not 25×4', () => {
    const vector = coachSuccessTestVectors.find((item) => item.id === 'coach-weight-balance-overweight');
    assert.ok(vector);
    const output = generateRecommendation(vector.input);
    assert.equal(output.ok, true);
    if (!output.ok) {
      return;
    }
    assert.equal(output.value.recommendationId, 'weight_balance_walking_v1');
    assert.equal(output.value.durationMinutes >= 20 && output.value.durationMinutes <= 30, true);
    assert.ok(output.value.frequencyPerWeek >= 3 && output.value.frequencyPerWeek <= 5);

    const display = getLocalizedCoachPresentation(
      output.value.recommendationId,
      output.value.durationMinutes,
      output.value.frequencyPerWeek,
      'sv',
    );
    assert.equal(
      resolveCoachRecommendationPresentationTier(output.value.recommendationId),
      'general',
    );
    assert.equal(display.title, 'Mer rörelse i vardagen');
    assert.match(display.description, /vardagsrörelse/);
    assert.equal(display.description.includes('25 minuter'), false);
    assert.equal(display.description.includes('fyra dagar'), false);
  });

  it('retains numeric presentation when measured activity volume is explicitly present', () => {
    const display = getLocalizedCoachPresentation(
      'weight_balance_walking_v1',
      25,
      4,
      'sv',
      { activityVolumeMeasured: true },
    );
    assert.equal(
      resolveCoachRecommendationPresentationTier('weight_balance_walking_v1', {
        activityVolumeMeasured: true,
      }),
      'specific',
    );
    assert.equal(display.title, 'Promenader för balans');
    assert.match(display.description, /25 minuter/);
    assert.match(display.description, /fyra dagar/);
  });

  it('does not unlock numeric specificity from BMI or activity level alone', () => {
    const bmiOnly = {
      activityVolumeMeasured: false,
    };
    assert.equal(
      resolveCoachRecommendationPresentationTier('weight_balance_walking_v1', bmiOnly),
      'general',
    );
    const display = getLocalizedCoachPresentation(
      'weight_balance_walking_v1',
      25,
      4,
      'sv',
      bmiOnly,
    );
    assert.equal(display.description.includes('25 minuter'), false);
    assert.equal(
      getCoachRecommendationPresentationMeta('weight_balance_walking_v1')
        ?.requiredSignalsForSpecific.includes('activity_volume_measured'),
      true,
    );
  });

  it('falls back to GENERAL when future optional data is missing', () => {
    assert.equal(
      resolveCoachRecommendationPresentationTier('fallback_gentle_walk_v1', {}),
      'general',
    );
    const display = getLocalizedCoachPresentation('fallback_gentle_walk_v1', 15, 3, 'nb');
    assert.equal(display.title, 'En rolig gåtur');
    assert.equal(display.description.includes('15 minutter'), false);
  });

  it('resolves the same family and GENERAL copy on onboarding, Home, and Development helpers', () => {
    const id = 'weight_balance_walking_v1';
    const localized = getLocalizedCoachPresentation(id, 25, 4, 'sv');
    const home = getCoachPresentation(id, 25, 4);
    const development = getLocalizedCoachPresentation(id, 25, 4);
    assert.deepEqual(localized, home);
    assert.deepEqual(localized, development);
    assert.equal(resolveCoachRecommendationPresentationTier(id), 'general');
  });
});

describe('Coach recommendation presentation isolation', () => {
  it('does not import Weekly Focus or Daily Focus, and does not rewrite Coach Engine', () => {
    const catalog = readFileSync(
      path.join(root, 'lib/presentation/coach-recommendation/coach-recommendation-presentation.catalog.ts'),
      'utf8',
    );
    const resolver = readFileSync(
      path.join(root, 'lib/presentation/coach-recommendation/coach-recommendation-presentation.ts'),
      'utf8',
    );
    const engine = readFileSync(path.join(root, 'lib/domain/coach-engine/coach-engine.ts'), 'utf8');
    assert.doesNotMatch(catalog, /daily-focus|weekly-focus|DAILY_FOCUS|WEEKLY_FOCUS/);
    assert.doesNotMatch(resolver, /daily-focus|weekly-focus|generateRecommendation/);
    assert.doesNotMatch(engine, /resolveCoachRecommendationPresentationTier|activityVolumeMeasured/);
  });
});
