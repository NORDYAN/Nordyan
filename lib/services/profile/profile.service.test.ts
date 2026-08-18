import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import type { AppError } from '../../core';
import type { ProfileMeasurements, UserProfile } from '../../domain/profile';
import { ACCOUNT_FIRST_NAME_MAX_LENGTH } from '../../domain/profile';
import { setActiveLocale, t } from '../../i18n';
import { PROFILE_ACCOUNT_COPY } from '../../presentation/profile-account';
import type { ProfileRepository } from '../../repositories/profile.repository';

import { DefaultProfileService } from './profile.service';

const existingProfile: UserProfile = {
  id: 'profile-1',
  userId: 'user-1',
  firstName: null,
  dateOfBirth: '1980-01-01',
  gender: 'male',
  heightCm: 180,
  weightKg: 80,
  waistCm: 90,
  neckCm: 38,
  activityLevel: 'moderately_active',
  goal: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const healthMeasurements: ProfileMeasurements = {
  dateOfBirth: '1980-01-01',
  gender: 'male',
  heightCm: 180,
  weightKg: 80,
  activityLevel: 'moderately_active',
};

function createService(input?: {
  userId?: string | null;
  profile?: UserProfile | null;
  updateError?: AppError;
  onUpdate?: (userId: string, patch: Partial<UserProfile>) => void;
  onCreate?: () => void;
  onCompleteOnboarding?: () => void;
}) {
  const calls = {
    update: [] as Array<{ userId: string; patch: Partial<UserProfile> }>,
    createFromMeasurements: 0,
    completeOnboarding: 0,
    snapshot: 0,
  };

  const repository: Pick<ProfileRepository, 'getByUserId' | 'update' | 'createFromMeasurements'> = {
    async getByUserId() {
      return { ok: true, value: input?.profile === undefined ? existingProfile : input.profile };
    },
    async update(userId, patch) {
      calls.update.push({ userId, patch });
      input?.onUpdate?.(userId, patch);
      if (input?.updateError) {
        return { ok: false, error: input.updateError };
      }
      return {
        ok: true,
        value: {
          ...existingProfile,
          ...patch,
          userId,
          updatedAt: '2026-08-16T00:00:00.000Z',
        },
      };
    },
    async createFromMeasurements() {
      calls.createFromMeasurements += 1;
      input?.onCreate?.();
      return { ok: true, value: existingProfile };
    },
  };

  const service = new DefaultProfileService({
    getCurrentUser: async () => {
      if (input?.userId === null) {
        return { ok: true, value: null };
      }
      return { ok: true, value: { id: input?.userId ?? 'user-1' } };
    },
    profileRepository: repository,
  });

  const originalComplete = service.completeOnboarding.bind(service);
  service.completeOnboarding = async (measurements) => {
    calls.completeOnboarding += 1;
    input?.onCompleteOnboarding?.();
    return originalComplete(measurements);
  };

  return { service, calls };
}

afterEach(() => {
  setActiveLocale('sv');
});

describe('updateAccountProfile', () => {
  it('persists a trimmed firstName without health fields', async () => {
    const { service, calls } = createService();
    const result = await service.updateAccountProfile({ firstName: '  Anna  ' });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.firstName, 'Anna');
    }
    assert.deepEqual(calls.update, [{ userId: 'user-1', patch: { firstName: 'Anna' } }]);
    assert.equal(calls.completeOnboarding, 0);
    assert.equal(calls.createFromMeasurements, 0);
    assert.equal(calls.snapshot, 0);
  });

  it('persists a blank firstName as null', async () => {
    const { service, calls } = createService({
      profile: { ...existingProfile, firstName: 'Anna' },
    });
    const result = await service.updateAccountProfile({ firstName: '   ' });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.firstName, null);
    }
    assert.deepEqual(calls.update[0]?.patch, { firstName: null });
    assert.equal(calls.completeOnboarding, 0);
    assert.equal(calls.snapshot, 0);
  });

  it('accepts Unicode first names', async () => {
    const { service, calls } = createService();
    const result = await service.updateAccountProfile({ firstName: 'Åsa' });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.firstName, 'Åsa');
    }
    assert.equal(calls.update[0]?.patch.firstName, 'Åsa');
  });

  it('does not call completeOnboarding or create a snapshot', async () => {
    const { service, calls } = createService();
    await service.updateAccountProfile({ firstName: 'Anna' });

    assert.equal(calls.completeOnboarding, 0);
    assert.equal(calls.createFromMeasurements, 0);
    assert.equal(calls.snapshot, 0);
    assert.equal(calls.update.length, 1);
    assert.deepEqual(Object.keys(calls.update[0]?.patch ?? {}), ['firstName']);
  });

  it('returns a safe error when storage fails', async () => {
    const { service, calls } = createService({
      updateError: {
        code: 'INTEGRATION',
        message: 'duplicate key value violates unique constraint "profiles_user_id_fkey"',
      },
    });
    const result = await service.updateAccountProfile({ firstName: 'Anna' });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.message, PROFILE_ACCOUNT_COPY.saveErrorMessage);
      assert.equal(result.error.message.includes('duplicate key'), false);
    }
    assert.equal(calls.completeOnboarding, 0);
  });

  it('returns a safe unauthenticated error', async () => {
    const { service } = createService({ userId: null });
    const result = await service.updateAccountProfile({ firstName: 'Anna' });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, 'UNAUTHORIZED');
      assert.equal(result.error.message, PROFILE_ACCOUNT_COPY.unauthenticatedMessage);
    }
  });

  it('returns a safe not-found error when no profile row exists', async () => {
    const { service, calls } = createService({ profile: null });
    const result = await service.updateAccountProfile({ firstName: 'Anna' });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.message, PROFILE_ACCOUNT_COPY.notFoundMessage);
    }
    assert.equal(calls.update.length, 0);
    assert.equal(calls.createFromMeasurements, 0);
  });

  it('rejects an oversized firstName before persistence', async () => {
    const { service, calls } = createService();
    const result = await service.updateAccountProfile({
      firstName: 'A'.repeat(ACCOUNT_FIRST_NAME_MAX_LENGTH + 1),
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, 'VALIDATION');
    }
    assert.equal(calls.update.length, 0);
  });
});

describe('completeOnboarding remains available for health profile', () => {
  it('still updates health fields through completeOnboarding', async () => {
    const { service, calls } = createService();
    const result = await service.completeOnboarding(healthMeasurements);

    assert.equal(result.ok, true);
    assert.equal(calls.completeOnboarding, 1);
    assert.ok(calls.update[0]?.patch.heightCm === 180);
  });

  it('returns localized health-profile validation errors', async () => {
    const { service } = createService();

    setActiveLocale('sv');
    const swedish = await service.completeOnboarding({
      ...healthMeasurements,
      gender: undefined,
    });
    assert.equal(swedish.ok, false);
    if (!swedish.ok) {
      assert.equal(swedish.error.message, t('profile.validation.gender'));
      assert.notEqual(swedish.error.message, 'profile.validation.gender');
    }

    setActiveLocale('nb');
    const norwegian = await service.completeOnboarding({
      ...healthMeasurements,
      gender: undefined,
    });
    assert.equal(norwegian.ok, false);
    if (!norwegian.ok) {
      assert.equal(norwegian.error.message, t('profile.validation.gender'));
      assert.equal(norwegian.error.message, 'Velg kjønn.');
    }
  });

  it('does not expose repository errors when health-profile persistence fails', async () => {
    setActiveLocale('nb');
    const { service } = createService({
      updateError: { code: 'INTEGRATION', message: 'duplicate key raw provider detail' },
    });

    const result = await service.completeOnboarding(healthMeasurements);

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.message, t('onboarding.syncError'));
      assert.equal(result.error.message.includes('duplicate key'), false);
    }
  });
});
