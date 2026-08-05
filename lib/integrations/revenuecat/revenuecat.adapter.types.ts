import type { Result } from '@/lib/core';
import type { SubscriptionStatus } from '@/lib/domain/subscription';

import type { PurchasePackageId, RevenueCatOfferingId } from './types';

export interface RevenueCatAdapter {
  configure(userId: string | null): Promise<Result<void>>;
  getSubscriptionStatus(): Promise<Result<SubscriptionStatus>>;
  purchasePackage(packageId: PurchasePackageId): Promise<Result<SubscriptionStatus>>;
  restorePurchases(): Promise<Result<SubscriptionStatus>>;
  getOfferingId(): RevenueCatOfferingId;
}
