import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { InitialLifestyleAnswers } from '../domain/initial-lifestyle';
import type { ProfileMeasurements } from '../domain/profile';
import { isProfileComplete } from '../domain/profile';
import { draftProfileFromMeasurements } from './onboarding-result.mapper';
import {
  buildOnboardingResultFromMeasurements,
  healthScoreInputReadyFromPending,
  resolveOnboardingResultState,
} from './onboarding-result.service';
import { onboardingResultHref } from './onboarding-result-navigation';
import { createPendingInitialLifestyleStore } from './pending-initial-lifestyle-store';
import { createMemoryPendingKeyValueStore } from './pending-key-value-store';
import {
  bindPendingOnboardingOwnership,
  type PendingOnboardingOwnershipDeps,
} from './pending-onboarding-ownership.service';
import { selectVisiblePendingValue } from './pending-onboarding-visible';
import { createPendingProfileStore } from './pending-profile-store';
import { mapProfileToHealthScoreInput } from '../services/health-score/health-score.mapper';

const asOfDate = '2026-08-17';

const accountA: ProfileMeasurements = {
  dateOfBirth: '1990-05-05',
  gender: 'female',
  heightCm: 150,
  weightKg: 50,
  activityLevel: 'sedentary',
};

const anonymousB: ProfileMeasurements = {
  dateOfBirth: '1988-03-12',
  gender: 'male',
  heightCm: 180,
  weightKg: 80,
  activityLevel: 'moderately_active',
};

const lifestyle: InitialLifestyleAnswers = {
  sleepQuality: 3,
  energy: 4,
  stress: 2,
  lessHealthyFoodFrequency: 'two_three',
  everydayActivity: 3,
  eatingQuality: 4,
  alcoholConsumption: '1_3',
};

function createHarness() {
  const storage = createMemoryPendingKeyValueStore();
  const pendingProfile = createPendingProfileStore(storage);
  const pendingLifestyle = createPendingInitialLifestyleStore(storage);
  const deps: PendingOnboardingOwnershipDeps = {
    getProfileBindState: (userId) => pendingProfile.getBindState(userId),
    getLifestyleBindState: (userId) => pendingLifestyle.getBindState(userId),
    bindProfile: (userId) => pendingProfile.bindToUser(userId),
    bindLifestyle: (userId) =>
      pendingLifestyle.bindPendingInitialLifestyleToUser(userId),
    releaseProfileBinding: (userId) => pendingProfile.releaseBinding(userId),
    clearUnownedProfile: () => pendingProfile.clearUnowned(),
    clearUnownedLifestyle: () =>
      pendingLifestyle.clearUnownedPendingInitialLifestyle(),
  };

  return { pendingProfile, pendingLifestyle, deps };
}

function visibleAnonymousPending(unowned: ProfileMeasurements | null) {
  return selectVisiblePendingValue({
    viewerUserId: null,
    ownedByViewer: null,
    unowned,
  });
}

describe('anonymous onboarding Ditt utgångsläge', () => {
  it('calculates Health Score and Coach from a fresh-install unowned bundle before signup', async () => {
    const harness = createHarness();
    await harness.pendingProfile.saveUnowned(anonymousB);
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);

    const pending = visibleAnonymousPending(await harness.pendingProfile.getUnowned());
    assert.deepEqual(pending, anonymousB);

    const draft = draftProfileFromMeasurements(pending);
    assert.equal(draft !== null, true);
    if (!draft) {
      return;
    }
    assert.equal(isProfileComplete(draft), true);
    assert.equal(mapProfileToHealthScoreInput(draft, asOfDate) !== null, true);

    const result = resolveOnboardingResultState(pending, null, asOfDate);
    assert.equal(result.status, 'ready');
    if (result.status === 'ready') {
      assert.notEqual(result.healthScoreLabel, '—');
      assert.equal(result.bodyFatAvailable, false);
      assert.equal(result.bodyFatPercentLabel, '—');
      assert.notEqual(result.coachTitle, '—');
      assert.notEqual(result.coachMessage, '—');
      assert.match(result.healthScoreLabel, /^\d+$/);
      assert.equal(result.coachTitle.length > 0, true);
      assert.equal(result.coachMessage.length > 0, true);
    }
  });

  it('reproduces logout then new anonymous onboarding without deleting A retry data', async () => {
    const harness = createHarness();
    await harness.pendingProfile.saveUnowned(accountA);
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);
    await bindPendingOnboardingOwnership('user-a', harness.deps);

    assert.equal(await harness.pendingProfile.saveUnowned(anonymousB), 'written');
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);
    assert.deepEqual(await harness.pendingProfile.getUnowned(), anonymousB);
    assert.deepEqual(await harness.pendingProfile.getForUser('user-a'), accountA);

    const pendingB = visibleAnonymousPending(await harness.pendingProfile.getUnowned());
    assert.deepEqual(pendingB, anonymousB);
    assert.deepEqual(await harness.pendingProfile.getForUser('user-a'), accountA);

    const resultA = buildOnboardingResultFromMeasurements(accountA, asOfDate);
    const resultB = resolveOnboardingResultState(pendingB, null, asOfDate);
    assert.equal(resultB.status, 'ready');
    assert.equal(resultA.status, 'ready');
    if (resultA.status === 'ready' && resultB.status === 'ready') {
      assert.notEqual(resultB.healthScoreLabel, resultA.healthScoreLabel);
      assert.notEqual(resultB.healthScoreLabel, '—');
      assert.notEqual(resultB.coachTitle, '—');
    }
  });

  it('does not let anonymous onboarding read or replace another UUID retry bundle', async () => {
    const harness = createHarness();
    await harness.pendingProfile.saveUnowned(accountA);
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);
    await bindPendingOnboardingOwnership('user-a', harness.deps);

    await harness.pendingProfile.saveUnowned(anonymousB);
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);

    assert.deepEqual(await harness.pendingProfile.getUnowned(), anonymousB);
    assert.deepEqual(await harness.pendingProfile.getForUser('user-a'), accountA);
    assert.deepEqual(
      await harness.pendingLifestyle.getPendingInitialLifestyleForUser('user-a'),
      { ok: true, value: lifestyle },
    );
    assert.deepEqual(
      visibleAnonymousPending(await harness.pendingProfile.getUnowned()),
      anonymousB,
    );
  });

  it('never uses a previous account profile when anonymous pending is present', () => {
    const previousProfile = draftProfileFromMeasurements(accountA);
    assert.equal(previousProfile !== null, true);
    const result = resolveOnboardingResultState(anonymousB, previousProfile, asOfDate);
    const fromB = buildOnboardingResultFromMeasurements(anonymousB, asOfDate);
    assert.deepEqual(result, fromB);
  });

  it('matches the live skip-body-measurements flow after A logout: result is ready from B only', async () => {
    const harness = createHarness();
    await harness.pendingProfile.saveUnowned(accountA);
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);
    await bindPendingOnboardingOwnership('user-a', harness.deps);

    await harness.pendingProfile.clearForUser('user-a');
    await harness.pendingLifestyle.clearPendingInitialLifestyleForUser('user-a');

    const write = await harness.pendingProfile.saveUnowned(anonymousB);
    assert.equal(write, 'written');
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);

    const pending = visibleAnonymousPending(await harness.pendingProfile.getUnowned());
    assert.deepEqual(pending, anonymousB);
    assert.equal(pending?.waistCm, undefined);
    assert.equal(pending?.neckCm, undefined);
    assert.equal(healthScoreInputReadyFromPending(pending, asOfDate), true);

    const result = resolveOnboardingResultState(pending, null, asOfDate);
    const fromA = buildOnboardingResultFromMeasurements(accountA, asOfDate);
    assert.equal(result.status, 'ready');
    if (result.status === 'ready' && fromA.status === 'ready') {
      assert.notEqual(result.healthScoreLabel, '—');
      assert.equal(result.bodyFatAvailable, false);
      assert.equal(result.bodyFatPercentLabel, '—');
      assert.notEqual(result.coachTitle, '—');
      assert.notEqual(result.healthScoreLabel, fromA.healthScoreLabel);
    }
    assert.equal(onboardingResultHref('1').pathname, '/(onboarding)/step-5');
    assert.equal(onboardingResultHref('1').params.visit, '1');
  });

  it('reaches a ready result when body measurements are added before step-5', async () => {
    const withCircumference: ProfileMeasurements = {
      ...anonymousB,
      waistCm: 92,
      neckCm: 38,
    };
    const result = resolveOnboardingResultState(withCircumference, null, asOfDate);
    assert.equal(result.status, 'ready');
    if (result.status === 'ready') {
      assert.notEqual(result.healthScoreLabel, '—');
      assert.equal(result.bodyFatAvailable, true);
      assert.match(result.bodyFatPercentLabel, /%/);
      assert.notEqual(result.coachTitle, '—');
    }
    assert.equal(healthScoreInputReadyFromPending(withCircumference, asOfDate), true);
  });

  it('diagnoses missing pending profile instead of silently rendering dashes', () => {
    const result = resolveOnboardingResultState(null, null, asOfDate);
    assert.deepEqual(result, {
      status: 'unavailable',
      reason: 'missing_pending_profile',
    });
  });
});
