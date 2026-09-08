import { t } from '@/lib/i18n';

export function buildProfileSubscriptionView() {
  return {
    title: t('profile.subscription.title'),
    subtitle: t('profile.subscription.subtitle'),
    pillars: [
      {
        id: 'coach-plus',
        title: t('profile.subscription.coach.title'),
        body: t('profile.subscription.coach.body'),
      },
      {
        id: 'food-scanner',
        title: t('profile.subscription.foodScanner.title'),
        body: t('profile.subscription.foodScanner.body'),
      },
      {
        id: 'blood-tests',
        title: t('profile.subscription.bloodTests.title'),
        body: t('profile.subscription.bloodTests.body'),
      },
      {
        id: 'insights',
        title: t('profile.subscription.insights.title'),
        body: t('profile.subscription.insights.body'),
      },
    ] as const,
    coreTitle: t('profile.subscription.core.title'),
    coreBody: t('profile.subscription.core.body'),
    footer: t('profile.subscription.footer'),
  };
}
