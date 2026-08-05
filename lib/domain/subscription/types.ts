export type SubscriptionPlan = 'free' | 'premium';

export type SubscriptionStatus = {
  plan: SubscriptionPlan;
  isActive: boolean;
  expiresAt: string | null;
  willRenew: boolean | null;
};

export type Entitlement = {
  id: string;
  isActive: boolean;
};
