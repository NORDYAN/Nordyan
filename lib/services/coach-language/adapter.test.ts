import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { CoachEngineResult } from '../../domain/coach-engine';
import { getCoachPresentation } from '../coach/coach.presentation';
import { FORBIDDEN_REQUEST_FIELDS } from '../../../shared/coach-language';
import {
  adaptCoachEngineResultToLanguagePayload,
  assertPayloadHasNoPii,
  productionSourceFromCoachEngineResult,
} from './adapter';
import type { ProductionCoachLanguageSource } from './types';

function sampleEngineResult(overrides?: Partial<CoachEngineResult>): CoachEngineResult {
  return {
    coachVersion: '1.0.0',
    recommendationId: 'waist_walk_after_dinner_v1',
    category: 'walking',
    titleKey: 'coach.waist.walk_after_dinner.title',
    descriptionKey: 'coach.waist.walk_after_dinner.description',
    durationMinutes: 30,
    frequencyPerWeek: 4,
    priority: 'high',
    expectedScoreGain: 2,
    confidence: 0.72,
    rationale: {
      focus: 'reduce_waist',
      driver: 'whtr',
      rationaleCode: 'lowest_risk_highest_impact_action',
    },
    safetyFlags: [],
    ...overrides,
  };
}

describe('adaptCoachEngineResultToLanguagePayload', () => {
  it('maps production coach-engine result to language payload', () => {
    const result = sampleEngineResult();
    const source = productionSourceFromCoachEngineResult(result, 'reduce_waist');
    const adapted = adaptCoachEngineResultToLanguagePayload(source, '2026-08-08T10:00:00.000Z');

    assert.equal(adapted.ok, true);
    if (!adapted.ok) {
      return;
    }

    const expectedAction = getCoachPresentation(
      result.recommendationId,
      result.durationMinutes,
      result.frequencyPerWeek,
    ).description;

    assert.equal(adapted.payload.decision.recommendedAction, expectedAction);
    assert.equal(adapted.payload.decision.confidence, 72);
    assert.equal(adapted.payload.locale, 'sv-SE');
    assert.equal(adapted.payload.decision.topOpportunity, 'Minska midjemåttet');
  });

  it('does not change recommended action relative to presentation template', () => {
    const source: ProductionCoachLanguageSource = {
      recommendationId: 'activity_moderate_brisk_walk_v1',
      category: 'walking',
      durationMinutes: 25,
      frequencyPerWeek: 3,
      priority: 'medium',
      confidence: 0.8,
      primaryFocus: 'improve_activity',
    };

    const adapted = adaptCoachEngineResultToLanguagePayload(source);
    assert.equal(adapted.ok, true);
    if (!adapted.ok) {
      return;
    }

    const presentation = getCoachPresentation(
      source.recommendationId,
      source.durationMinutes,
      source.frequencyPerWeek,
    );
    assert.equal(adapted.payload.decision.recommendedAction, presentation.description);
  });

  it('contains no PII field names', () => {
    const adapted = adaptCoachEngineResultToLanguagePayload(
      productionSourceFromCoachEngineResult(sampleEngineResult(), 'reduce_waist'),
    );
    assert.equal(adapted.ok, true);
    if (!adapted.ok) {
      return;
    }

    const violations = assertPayloadHasNoPii(adapted.payload);
    assert.deepEqual(violations, []);

    const keys = JSON.stringify(adapted.payload);
    for (const field of FORBIDDEN_REQUEST_FIELDS) {
      assert.equal(keys.includes(`"${field}"`), false, `unexpected field ${field}`);
    }
  });

  it('contains no raw measurement history fields', () => {
    const adapted = adaptCoachEngineResultToLanguagePayload(
      productionSourceFromCoachEngineResult(sampleEngineResult(), 'reduce_waist'),
    );
    assert.equal(adapted.ok, true);
    if (!adapted.ok) {
      return;
    }

    const serialized = JSON.stringify(adapted.payload);
    assert.equal(serialized.includes('measurementHistory'), false);
    assert.equal(serialized.includes('healthRecords'), false);
    assert.equal(serialized.includes('weightKg'), false);
    assert.equal(serialized.includes('waistCm'), false);
  });

  it('returns silence for silent coach decisions (no AI request)', () => {
    const adapted = adaptCoachEngineResultToLanguagePayload({
      ...productionSourceFromCoachEngineResult(sampleEngineResult(), 'reduce_waist'),
      silence: true,
    });

    assert.deepEqual(adapted, { ok: false, reason: 'silence' });
  });
});
