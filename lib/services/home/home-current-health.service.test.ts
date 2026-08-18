import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { UserProfile } from '@/lib/domain/profile';
import type { HealthSnapshot } from '@/lib/domain/snapshot';

import { buildHomeCurrentHealthState } from './home-current-health.service';

const profile: UserProfile = {
  id: 'profile-1',
  userId: 'user-1',
  firstName: 'Test',
  dateOfBirth: '1985-01-01',
  gender: 'male',
  heightCm: 180,
  weightKg: 80,
  waistCm: null,
  neckCm: null,
  activityLevel: 'moderately_active',
  goal: 'improve_health',
  createdAt: '2026-08-17T10:00:00.000Z',
  updatedAt: '2026-08-17T10:00:00.000Z',
};

const snapshot: HealthSnapshot = {
  id: 'snapshot-1',
  userId: 'user-1',
  createdAt: '2026-08-17T10:00:00.000Z',
  overallScore: 72,
  bmiScore: 70,
  whtrScore: 68,
  bodyFatScore: 65,
  activityScore: 60,
  primaryFocus: 'reduce_waist',
  coachRecommendationId: 'waist_walk_after_dinner_v1',
  weightKg: 80,
  waistCm: 91.8,
  neckCm: 32.4,
  engineVersion: 'health-score-v1',
  snapshotReason: 'onboarding',
  bodyFatPct: 22.4,
  coachDurationMinutes: 20,
  coachFrequencyPerWeek: 4,
};

describe('buildHomeCurrentHealthState body-fat presentation', () => {
  it('keeps Health Score but hides persisted fallback body fat after skip', () => {
    const state = buildHomeCurrentHealthState(profile, snapshot, '2026-08-17');

    assert.equal(state.status, 'ready');
    if (state.status !== 'ready') {
      return;
    }

    assert.equal(state.data.healthScore.score, 72);
    assert.equal(state.data.metrics.bodyFatAvailability, 'unavailable');
    assert.equal(state.data.metrics.bodyFatPct, null);
    assert.equal(state.data.metrics.bodyFatDisplay, '—');
  });

  it('shows body fat for a male profile with real waist and neck measurements', () => {
    const state = buildHomeCurrentHealthState(
      { ...profile, waistCm: 90, neckCm: 38 },
      { ...snapshot, waistCm: 90, neckCm: 38, bodyFatPct: 19.8 },
      '2026-08-17',
    );

    assert.equal(state.status, 'ready');
    if (state.status !== 'ready') {
      return;
    }

    assert.equal(state.data.metrics.bodyFatAvailability, 'available');
    assert.equal(state.data.metrics.bodyFatPct, 19.8);
    assert.match(state.data.metrics.bodyFatDisplay, /19[,.]8/);
  });

  it('shows body fat from a real male measurement snapshot after onboarding skip', () => {
    const state = buildHomeCurrentHealthState(
      profile,
      {
        ...snapshot,
        snapshotReason: 'measurement',
        waistCm: 90,
        neckCm: 38,
        bodyFatPct: 19.8,
      },
      '2026-08-17',
    );

    assert.equal(state.status, 'ready');
    if (state.status !== 'ready') {
      return;
    }

    assert.equal(state.data.metrics.bodyFatAvailability, 'available');
    assert.equal(state.data.metrics.bodyFatPct, 19.8);
  });

  it('does not expose female Deurenberg fallback as measured body fat', () => {
    const state = buildHomeCurrentHealthState(
      { ...profile, gender: 'female', waistCm: 82, neckCm: 33 },
      { ...snapshot, waistCm: 82, neckCm: 33, bodyFatPct: 29.3 },
      '2026-08-17',
    );

    assert.equal(state.status, 'ready');
    if (state.status !== 'ready') {
      return;
    }

    assert.equal(state.data.healthScore.score, 72);
    assert.equal(state.data.metrics.bodyFatAvailability, 'unavailable');
    assert.equal(state.data.metrics.bodyFatPct, null);
  });
});
