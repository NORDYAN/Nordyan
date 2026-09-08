import { HealthSourceCard } from '@/components/profile/HealthSourceCard';
import { ProfileFutureFeatureScreen } from '@/components/profile/ProfileFutureFeatureScreen';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { buildProfileSubscriptionView } from '@/lib/presentation/profile-subscription';

export default function ProfileSubscriptionScreen() {
  useI18n();
  const copy = buildProfileSubscriptionView();

  return (
    <ProfileFutureFeatureScreen
      title={copy.title}
      subtitle={copy.subtitle}
      contextTitle={copy.coreTitle}
      contextBody={copy.coreBody}
      footer={copy.footer}
    >
      <HealthSourceCard
        icon="chatbubble-outline"
        title={copy.pillars[0].title}
        description={copy.pillars[0].body}
        status="comingSoon"
      />
      <HealthSourceCard
        icon="nutrition-outline"
        title={copy.pillars[1].title}
        description={copy.pillars[1].body}
        status="comingSoon"
      />
      <HealthSourceCard
        icon="water-outline"
        title={copy.pillars[2].title}
        description={copy.pillars[2].body}
        status="comingSoon"
      />
      <HealthSourceCard
        icon="analytics-outline"
        title={copy.pillars[3].title}
        description={copy.pillars[3].body}
        status="comingSoon"
      />
    </ProfileFutureFeatureScreen>
  );
}
