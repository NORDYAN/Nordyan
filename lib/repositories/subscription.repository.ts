import type { Result } from '@/lib/core';
import type { SubscriptionStatus } from '@/lib/domain/subscription';

export interface SubscriptionRepository {
  getStatus(userId: string): Promise<Result<SubscriptionStatus>>;
}
