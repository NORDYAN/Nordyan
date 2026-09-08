import { HealthSourceCard } from '@/components/profile/HealthSourceCard';
import { ProfileFutureFeatureScreen } from '@/components/profile/ProfileFutureFeatureScreen';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';

export default function FoodScannerScreen() {
  useI18n();

  return (
    <ProfileFutureFeatureScreen
      title={t('profile.foodScanner.title')}
      subtitle={t('profile.foodScanner.subtitle')}
      contextTitle={t('profile.foodScanner.context.title')}
      contextBody={t('profile.foodScanner.context.body')}
      footer={t('profile.foodScanner.footer')}
    >
      <HealthSourceCard
        icon="nutrition-outline"
        title={t('profile.foodScanner.scan.title')}
        description={t('profile.foodScanner.scan.body')}
        status="comingSoon"
      />
      <HealthSourceCard
        icon="analytics-outline"
        title={t('profile.foodScanner.energy.title')}
        description={t('profile.foodScanner.energy.body')}
        status="comingSoon"
      />
      <HealthSourceCard
        icon="calendar-outline"
        title={t('profile.foodScanner.overview.title')}
        description={t('profile.foodScanner.overview.body')}
        status="comingSoon"
      />
      <HealthSourceCard
        icon="flag-outline"
        title={t('profile.foodScanner.goals.title')}
        description={t('profile.foodScanner.goals.body')}
        status="comingSoon"
      />
    </ProfileFutureFeatureScreen>
  );
}
