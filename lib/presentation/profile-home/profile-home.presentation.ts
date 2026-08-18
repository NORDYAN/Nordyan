import { routes } from '@/constants/routes';
import { t } from '@/lib/i18n';

export const PROFILE_HOME_HEALTH_SECTION_TITLE = 'Hälsa';
export const PROFILE_HOME_ACCOUNT_SETTINGS_SECTION_TITLE = 'Konto & inställningar';
export const PROFILE_HOME_SUPPORT_PRIVACY_SECTION_TITLE = 'Support & integritet';
export const PROFILE_HOME_HEALTH_PROFILE_TITLE = 'Hälsoprofil';
export const PROFILE_HOME_HEALTH_PROFILE_SUBTITLE =
  'Kön, födelsedatum, längd och aktivitetsnivå';
export const PROFILE_HOME_MEASUREMENTS_TITLE = 'Mätningar';
export const PROFILE_HOME_MEASUREMENTS_SUBTITLE =
  'Visa mäthistorik och registrera nya mätningar';
export const PROFILE_HOME_SIGN_OUT_TITLE = 'Logga ut';
export const PROFILE_HOME_COMING_SOON_LABEL = 'Kommer snart';

export type ProfileHomeComingSoonRowId =
  | 'health-data-sources'
  | 'subscription'
  | 'notifications'
  | 'privacy-and-data'
  | 'help-and-support'
  | 'feedback';

export type ProfileHomeActiveRowId = 'account-card' | 'health-profile' | 'measurements' | 'language' | 'sign-out';

export type ProfileHomeRowId = ProfileHomeActiveRowId | ProfileHomeComingSoonRowId;

export type ProfileHomeActiveNavRow = {
  id: 'health-profile' | 'measurements' | 'language';
  status: 'active';
  icon: 'person-outline' | 'resize-outline' | 'language-outline';
  title: string;
  subtitle: string;
  route: typeof routes.profileHealthProfile | typeof routes.healthMeasurementHistory | typeof routes.profileLanguage;
  showChevron: true;
};

export type ProfileHomeComingSoonRow = {
  id: ProfileHomeComingSoonRowId;
  status: 'comingSoon';
  icon:
    | 'watch-outline'
    | 'star-outline'
    | 'notifications-outline'
    | 'shield-outline'
    | 'help-circle-outline'
    | 'chatbox-outline';
  title: string;
  subtitle: string;
  route: null;
  showChevron: false;
};

export type ProfileHomeRow = ProfileHomeActiveNavRow | ProfileHomeComingSoonRow;

export type ProfileHomeSectionId = 'health' | 'account-settings' | 'support-privacy';

export type ProfileHomeSection = {
  id: ProfileHomeSectionId;
  title: string;
  rows: readonly ProfileHomeRow[];
};

export type ProfileHomeView = {
  accountCard: {
    visible: true;
    route: typeof routes.profileAccount;
    status: 'active';
  };
  sections: readonly ProfileHomeSection[];
  signOut: {
    id: 'sign-out';
    title: string;
    status: 'active';
    showChevron: false;
  };
};

export function buildProfileHomeView(): ProfileHomeView {
  return {
    accountCard: {
      visible: true,
      route: routes.profileAccount,
      status: 'active',
    },
    sections: [
      {
        id: 'health',
        title: t('profile.healthSection'),
        rows: [
          {
            id: 'health-profile',
            status: 'active',
            icon: 'person-outline',
            title: t('profile.healthProfile.title'),
            subtitle: t('profile.healthProfile.subtitle'),
            route: routes.profileHealthProfile,
            showChevron: true,
          },
          {
            id: 'measurements',
            status: 'active',
            icon: 'resize-outline',
            title: t('profile.measurements.title'),
            subtitle: t('profile.measurements.subtitle'),
            route: routes.healthMeasurementHistory,
            showChevron: true,
          },
          {
            id: 'health-data-sources',
            status: 'comingSoon',
            icon: 'watch-outline',
            title: t('profile.healthDataSources'),
            subtitle: t('common.comingSoon'),
            route: null,
            showChevron: false,
          },
        ],
      },
      {
        id: 'account-settings',
        title: t('profile.accountSettings'),
        rows: [
          {
            id: 'language',
            status: 'active',
            icon: 'language-outline',
            title: t('profile.language.title'),
            subtitle: t('profile.language.subtitle'),
            route: routes.profileLanguage,
            showChevron: true,
          },
          {
            id: 'subscription',
            status: 'comingSoon',
            icon: 'star-outline',
            title: t('profile.subscription'),
            subtitle: t('common.comingSoon'),
            route: null,
            showChevron: false,
          },
          {
            id: 'notifications',
            status: 'comingSoon',
            icon: 'notifications-outline',
            title: t('profile.notifications'),
            subtitle: t('common.comingSoon'),
            route: null,
            showChevron: false,
          },
        ],
      },
      {
        id: 'support-privacy',
        title: t('profile.supportPrivacy'),
        rows: [
          {
            id: 'privacy-and-data',
            status: 'comingSoon',
            icon: 'shield-outline',
            title: t('profile.privacy'),
            subtitle: t('common.comingSoon'),
            route: null,
            showChevron: false,
          },
          {
            id: 'help-and-support',
            status: 'comingSoon',
            icon: 'help-circle-outline',
            title: t('profile.help'),
            subtitle: t('common.comingSoon'),
            route: null,
            showChevron: false,
          },
          {
            id: 'feedback',
            status: 'comingSoon',
            icon: 'chatbox-outline',
            title: t('profile.feedback'),
            subtitle: t('common.comingSoon'),
            route: null,
            showChevron: false,
          },
        ],
      },
    ],
    signOut: {
      id: 'sign-out',
      title: t('profile.signOut'),
      status: 'active',
      showChevron: false,
    },
  };
}

export function listProfileHomeSectionTitles(
  view: ProfileHomeView = buildProfileHomeView(),
): readonly string[] {
  return view.sections.filter((section) => section.rows.length > 0).map((section) => section.title);
}

export function listProfileHomeComingSoonRows(
  view: ProfileHomeView = buildProfileHomeView(),
): readonly ProfileHomeComingSoonRow[] {
  return view.sections.flatMap((section) =>
    section.rows.filter((row): row is ProfileHomeComingSoonRow => row.status === 'comingSoon'),
  );
}

export function listProfileHomeNavigableRoutes(
  view: ProfileHomeView = buildProfileHomeView(),
): readonly string[] {
  const navigable: string[] = [
    view.accountCard.route,
    ...view.sections.flatMap((section) =>
      section.rows.flatMap((row) => (row.status === 'active' ? [row.route] : [])),
    ),
  ];
  return navigable;
}
