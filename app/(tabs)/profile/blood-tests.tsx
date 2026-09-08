import { HealthSourceCard } from '@/components/profile/HealthSourceCard';
import { ProfileFutureFeatureScreen } from '@/components/profile/ProfileFutureFeatureScreen';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';

export default function BloodTestsScreen() {
  useI18n();

  return (
    <ProfileFutureFeatureScreen
      title={t('profile.bloodTests.title')}
      subtitle={t('profile.bloodTests.subtitle')}
      contextTitle={t('profile.bloodTests.safety.title')}
      contextBody={t('profile.bloodTests.safety.body')}
      footer={t('profile.bloodTests.footer')}
    >
      <HealthSourceCard
        icon="fitness-outline"
        title={t('profile.bloodTests.hormones.title')}
        description={t('profile.bloodTests.hormones.body')}
        status="comingSoon"
      />
      <HealthSourceCard
        icon="water-outline"
        title={t('profile.bloodTests.lipids.title')}
        description={t('profile.bloodTests.lipids.body')}
        status="comingSoon"
      />
      <HealthSourceCard
        icon="pulse-outline"
        title={t('profile.bloodTests.glucose.title')}
        description={t('profile.bloodTests.glucose.body')}
        status="comingSoon"
      />
      <HealthSourceCard
        icon="medkit-outline"
        title={t('profile.bloodTests.thyroid.title')}
        description={t('profile.bloodTests.thyroid.body')}
        status="comingSoon"
      />
    </ProfileFutureFeatureScreen>
  );
}
