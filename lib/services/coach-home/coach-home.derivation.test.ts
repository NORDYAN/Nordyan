import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { HealthSnapshot } from '../../domain/snapshot';

import { buildCoachHomeSummary } from './coach-home.derivation';

function snapshot(overrides: Partial<HealthSnapshot> = {}): HealthSnapshot {
  return {
    id: 's1',
    userId: 'u1',
    createdAt: '2026-08-11T10:00:00.000Z',
    overallScore: 74,
    bmiScore: 70,
    whtrScore: 60,
    bodyFatScore: 65,
    activityScore: 58,
    primaryFocus: 'reduce_waist',
    coachRecommendationId: 'waist_walk_after_dinner_v1',
    weightKg: 80,
    waistCm: 90,
    neckCm: 38,
    engineVersion: '1.0.0',
    snapshotReason: 'measurement',
    bodyFatPct: 20,
    coachDurationMinutes: 30,
    coachFrequencyPerWeek: 4,
    ...overrides,
  };
}

describe('buildCoachHomeSummary', () => {
  it('returns empty when no snapshot', () => {
    assert.deepEqual(buildCoachHomeSummary(null), { status: 'empty' });
  });

  it('maps focus and coach presentation without inventing values', () => {
    const summary = buildCoachHomeSummary(snapshot());
    assert.equal(summary.status, 'ready');
    if (summary.status !== 'ready') {
      return;
    }
    assert.equal(summary.focus.type, 'reduce_waist');
    assert.equal(summary.focus.title, 'Minska midjemåttet');
    assert.equal(summary.plan.available, true);
    if (summary.plan.available) {
      assert.equal(summary.plan.title, 'Promenad efter middagen');
      assert.equal(summary.plan.durationMinutes, 30);
      assert.equal(summary.plan.frequencyPerWeek, 4);
      assert.match(summary.plan.description, /30 minuter/);
    }
  });

  it('marks plan unavailable when coach fields are incomplete', () => {
    const summary = buildCoachHomeSummary(
      snapshot({
        coachDurationMinutes: null,
        coachFrequencyPerWeek: null,
      }),
    );
    assert.equal(summary.status, 'ready');
    if (summary.status === 'ready') {
      assert.equal(summary.plan.available, false);
      assert.equal(summary.focus.type, 'reduce_waist');
    }
  });
});
