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

export type ProfileHomeComingSoonNavRowId =
  | 'health-data-sources'
  | 'food-scanner'
  | 'blood-tests'
  | 'subscription';

export type ProfileHomeComingSoonDeadRowId = never;

export type ProfileHomeComingSoonRowId = ProfileHomeComingSoonNavRowId;

export type ProfileHomeActiveRowId =
  | 'account-card'
  | 'health-profile'
  | 'measurements'
  | 'language'
  | 'notifications'
  | 'privacy-and-data'
  | 'feedback'
  | 'help-and-support'
  | 'sign-out';

export type ProfileHomeRowId = ProfileHomeActiveRowId | ProfileHomeComingSoonRowId;

export type ProfileHomeActiveNavRow = {
  id: 'health-profile' | 'measurements' | 'language' | 'privacy-and-data';
  status: 'active';
  icon: 'person-outline' | 'resize-outline' | 'language-outline' | 'shield-outline';
  title: string;
  subtitle: string;
  route:
    | typeof routes.profileHealthProfile
    | typeof routes.healthMeasurementHistory
    | typeof routes.profileLanguage
    | typeof routes.profilePrivacy;
  showChevron: true;
};

export type ProfileHomeComingSoonNavRow = {
  id: ProfileHomeComingSoonNavRowId;
  status: 'comingSoon';
  icon: 'watch-outline' | 'nutrition-outline' | 'water-outline' | 'star-outline';
  title: string;
  subtitle: string;
  route:
    | typeof routes.profileHealthDataSources
    | typeof routes.profileFoodScanner
    | typeof routes.profileBloodTests
    | typeof routes.profileSubscription;
  showChevron: true;
};

export type ProfileHomeComingSoonDeadRow = {
  id: ProfileHomeComingSoonDeadRowId;
  status: 'comingSoon';
  icon: 'notifications-outline';
  title: string;
  subtitle: string;
  route: null;
  showChevron: false;
};

export type ProfileHomeNotificationsRow = {
  id: 'notifications';
  status: 'active';
  icon: 'notifications-outline';
  title: string;
  route: typeof routes.profileNotifications;
  showChevron: true;
};

export type ProfileHomeFeedbackRow = {
  id: 'feedback';
  status: 'active';
  icon: 'chatbox-outline';
  title: string;
  route: null;
  action: 'mailto-feedback';
  showChevron: true;
};

export type ProfileHomeHelpRow = {
  id: 'help-and-support';
  status: 'active';
  icon: 'help-circle-outline';
  title: string;
  route: null;
  action: 'mailto-help';
  showChevron: true;
};

export type ProfileHomeComingSoonRow = ProfileHomeComingSoonNavRow | ProfileHomeComingSoonDeadRow;

export type ProfileHomeRow =
  | ProfileHomeActiveNavRow
  | ProfileHomeComingSoonRow
  | ProfileHomeFeedbackRow
  | ProfileHomeHelpRow
  | ProfileHomeNotificationsRow;

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
            route: routes.profileHealthDataSources,
            showChevron: true,
          },
          {
            id: 'food-scanner',
            status: 'comingSoon',
            icon: 'nutrition-outline',
            title: t('profile.foodScanner'),
            subtitle: t('common.comingSoon'),
            route: routes.profileFoodScanner,
            showChevron: true,
          },
          {
            id: 'blood-tests',
            status: 'comingSoon',
            icon: 'water-outline',
            title: t('profile.bloodTests'),
            subtitle: t('common.comingSoon'),
            route: routes.profileBloodTests,
            showChevron: true,
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
            route: routes.profileSubscription,
            showChevron: true,
          },
          {
            id: 'notifications',
            status: 'active',
            icon: 'notifications-outline',
            title: t('profile.notifications'),
            route: routes.profileNotifications,
            showChevron: true,
          },
        ],
      },
      {
        id: 'support-privacy',
        title: t('profile.supportPrivacy'),
        rows: [
          {
            id: 'privacy-and-data',
            status: 'active',
            icon: 'shield-outline',
            title: t('profile.privacy'),
            subtitle: t('profile.privacy.subtitle'),
            route: routes.profilePrivacy,
            showChevron: true,
          },
          {
            id: 'help-and-support',
            status: 'active',
            icon: 'help-circle-outline',
            title: t('profile.help'),
            route: null,
            action: 'mailto-help',
            showChevron: true,
          },
          {
            id: 'feedback',
            status: 'active',
            icon: 'chatbox-outline',
            title: t('profile.feedback'),
            route: null,
            action: 'mailto-feedback',
            showChevron: true,
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

export function listProfileHomeComingSoonNavRows(
  view: ProfileHomeView = buildProfileHomeView(),
): readonly ProfileHomeComingSoonNavRow[] {
  return listProfileHomeComingSoonRows(view).filter(
    (row): row is ProfileHomeComingSoonNavRow => row.route != null,
  );
}

export function listProfileHomeComingSoonDeadRows(
  view: ProfileHomeView = buildProfileHomeView(),
): readonly ProfileHomeComingSoonDeadRow[] {
  return listProfileHomeComingSoonRows(view).filter(
    (row): row is ProfileHomeComingSoonDeadRow => row.route == null,
  );
}

export function listProfileHomeNavigableRoutes(
  view: ProfileHomeView = buildProfileHomeView(),
): readonly string[] {
  return [
    view.accountCard.route,
    ...view.sections.flatMap((section) =>
      section.rows.flatMap((row) => (row.route ? [row.route] : [])),
    ),
  ];
}
