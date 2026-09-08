import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { canPresentBodyFatEstimate } from '@/lib/services/health-score';
import { mapProfileToHealthScoreInput } from '@/lib/services/health-score/health-score.mapper';

import { draftProfileFromMeasurements } from './onboarding-result.mapper';
import { getOnboardingResultCoachFallback } from './onboarding-result.presentation';
import {
  buildOnboardingResultFromMeasurements,
  buildOnboardingResultFromProfile,
  resolveOnboardingResultState,
} from './onboarding-result.service';

const asOfDate = '2026-08-17';

const maleSkip = {
  dateOfBirth: '1988-03-12',
  gender: 'male' as const,
  heightCm: 180,
  weightKg: 80,
  activityLevel: 'moderately_active' as const,
};

const femaleSkip = {
  dateOfBirth: '1990-05-05',
  gender: 'female' as const,
  heightCm: 168,
  weightKg: 64,
  activityLevel: 'lightly_active' as const,
};

const failingCoachDeps = {
  buildHomePrimaryFocusState: () => ({ status: 'unavailable' as const }),
  buildHomeCoachState: () => ({ status: 'unavailable' as const }),
};

describe('onboarding result packaging', () => {
  it('keeps a usable result when waist, neck, and hip are skipped', () => {
    const result = resolveOnboardingResultState(maleSkip, null, asOfDate);
    assert.equal(result.status, 'ready');
    if (result.status !== 'ready') {
      return;
    }

    assert.match(result.healthScoreLabel, /^\d+$/);
    assert.notEqual(result.healthScoreLabel, '—');
    assert.equal(result.bodyFatAvailable, false);
    assert.equal(result.bodyFatPercentLabel, '—');
    assert.notEqual(result.coachTitle, '—');
    assert.notEqual(result.coachMessage, '—');
    assert.equal(result.coachTitle.length > 0, true);
    assert.equal(result.coachMessage.length > 0, true);
  });

  it('does not inject hip into HealthScoreInput when onboarding measurements are skipped', () => {
    const draft = draftProfileFromMeasurements(maleSkip);
    assert.equal(draft !== null, true);
    if (!draft) {
      return;
    }

    const input = mapProfileToHealthScoreInput(draft, asOfDate, { hipCm: undefined });
    assert.equal(input !== null, true);
    assert.equal(input?.hipCm, undefined);
  });

  it('keeps male skip body fat unpresentable while still showing Health Score', () => {
    const draft = draftProfileFromMeasurements(maleSkip);
    assert.equal(draft !== null, true);
    if (!draft) {
      return;
    }

    assert.equal(canPresentBodyFatEstimate(draft), false);
    const result = buildOnboardingResultFromMeasurements(maleSkip, asOfDate);
    assert.equal(result.status, 'ready');
    if (result.status === 'ready') {
      assert.match(result.healthScoreLabel, /^\d+$/);
      assert.equal(result.bodyFatPercentLabel, '—');
    }
  });

  it('keeps female skip body fat unpresentable while still showing Health Score', () => {
    const draft = draftProfileFromMeasurements(femaleSkip);
    assert.equal(draft !== null, true);
    if (!draft) {
      return;
    }

    assert.equal(canPresentBodyFatEstimate(draft), false);
    const result = buildOnboardingResultFromMeasurements(femaleSkip, asOfDate);
    assert.equal(result.status, 'ready');
    if (result.status === 'ready') {
      assert.match(result.healthScoreLabel, /^\d+$/);
      assert.equal(result.bodyFatAvailable, false);
      assert.equal(result.bodyFatPercentLabel, '—');
    }
  });

  it('preserves a valid Health Score and uses generic Coach fallback when focus/Coach fail', () => {
    const draft = draftProfileFromMeasurements(maleSkip);
    assert.equal(draft !== null, true);
    if (!draft) {
      return;
    }

    const fallback = getOnboardingResultCoachFallback();
    const result = buildOnboardingResultFromProfile(draft, asOfDate, undefined, failingCoachDeps);
    assert.equal(result.status, 'ready');
    if (result.status !== 'ready') {
      return;
    }

    assert.match(result.healthScoreLabel, /^\d+$/);
    assert.equal(result.coachTitle, fallback.coachTitle);
    assert.equal(result.coachMessage, fallback.coachMessage);
    assert.doesNotMatch(result.coachTitle, /kroppsfett|body fat|%/i);
    assert.doesNotMatch(result.coachMessage, /kroppsfett|body fat|%/i);
  });

  it('keeps the result unavailable when Health Score input is invalid', () => {
    const result = buildOnboardingResultFromMeasurements(
      { heightCm: 180, weightKg: 80 },
      asOfDate,
    );
    assert.equal(result.status, 'unavailable');
    if (result.status === 'unavailable') {
      assert.equal(result.reason, 'invalid_health_score_input');
    }
  });

  it('keeps the successful entered-measurement result unchanged', () => {
    const result = resolveOnboardingResultState(
      { ...maleSkip, waistCm: 92, neckCm: 38, hipCm: 98 },
      null,
      asOfDate,
    );
    assert.equal(result.status, 'ready');
    if (result.status === 'ready') {
      assert.match(result.healthScoreLabel, /^\d+$/);
      assert.equal(result.bodyFatAvailable, true);
      assert.match(result.bodyFatPercentLabel, /%/);
      assert.notEqual(result.coachTitle, '—');
      assert.notEqual(result.coachTitle, getOnboardingResultCoachFallback().coachTitle);
    }
  });

  it('shows female Navy body fat on Ditt utgångsläge when waist, neck, and hip were entered', () => {
    const result = resolveOnboardingResultState(
      { ...femaleSkip, waistCm: 80, neckCm: 33, hipCm: 98 },
      null,
      asOfDate,
    );
    assert.equal(result.status, 'ready');
    if (result.status === 'ready') {
      assert.match(result.healthScoreLabel, /^\d+$/);
      assert.equal(result.bodyFatAvailable, true);
      assert.match(result.bodyFatPercentLabel, /%/);
      assert.notEqual(result.bodyFatPercentLabel, '—');
    }
  });
});
