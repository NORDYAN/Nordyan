import type { Result } from '@/lib/core';
import {
  healthDataConsentPresenceFromRepositoryResult,
  type HealthDataConsentGrant,
  type HealthDataConsentPresence,
} from '@/lib/domain/health-data-consent';
import type { HealthDataConsentRepository } from '@/lib/repositories/health-data-consent.repository';

export type HealthDataConsentService = {
  inspectActiveCurrentConsent(userId: string): Promise<HealthDataConsentPresence>;
  hasActiveCurrentConsent(userId: string): Promise<boolean>;
  insertGrant(
    userId: string,
    grant: HealthDataConsentGrant,
  ): Promise<Result<{ inserted: boolean }>>;
};

export class DefaultHealthDataConsentService implements HealthDataConsentService {
  constructor(private readonly repository: HealthDataConsentRepository) {}

  async inspectActiveCurrentConsent(userId: string): Promise<HealthDataConsentPresence> {
    const result = await this.repository.hasActiveCurrentConsent(userId);
    return healthDataConsentPresenceFromRepositoryResult(result);
  }

  async hasActiveCurrentConsent(userId: string): Promise<boolean> {
    return (await this.inspectActiveCurrentConsent(userId)) === 'active';
  }

  insertGrant(
    userId: string,
    grant: HealthDataConsentGrant,
  ): Promise<Result<{ inserted: boolean }>> {
    return this.repository.insertGrant(userId, grant);
  }
}
