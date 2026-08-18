/** Shared NORDYAN brand accent (visual experiment — premium gold). */
const BRAND_ACCENT = '#C9A45C';
const BRAND_ACCENT_DARK = '#A98545';
const BRAND_ACCENT_FILL = 'rgba(201, 164, 92, 0.14)';
const BRAND_ACCENT_FILL_SOLID = '#2A2316';

/**
 * Semantic positive (health / improving development).
 * Kept separate from brand gold so status meaning is preserved.
 */
const SEMANTIC_POSITIVE = '#5EEAD4';
const SEMANTIC_POSITIVE_FILL = '#133531';

export const colors = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  textPrimary: '#1A1D21',
  textSecondary: '#6B7280',
  /** Generic interactive brand accent (auth, default buttons, loaders). */
  accent: BRAND_ACCENT,
  border: '#E5E7EB',
  tabInactive: '#9CA3AF',

  /** Shared brand tokens — interactive / identity accents only. */
  brandAccent: BRAND_ACCENT,
  brandAccentDark: BRAND_ACCENT_DARK,
  brandAccentFill: BRAND_ACCENT_FILL,
  brandAccentFillSolid: BRAND_ACCENT_FILL_SOLID,

  // Onboarding intro (Figma: nordyan-onboarding-1-intro)
  onboardingBackground: '#121416',
  onboardingText: '#FFFFFF',
  onboardingTextMuted: '#E4E6EB',
  onboardingAccent: BRAND_ACCENT,
  onboardingButtonText: '#121416',
  onboardingOverlay: 'rgba(18, 20, 22, 0.3)',
  /** Screen 2: lighter tint (~12% more mountain visibility vs 0.7 Figma base). */
  onboardingOverlayPromise: 'rgba(18, 20, 22, 0.50)',
  onboardingHomeIndicator: 'rgba(255, 255, 255, 0.3)',
  onboardingCardBackground: '#1A1D21',

  /** Figma: nordyan-onboarding-6-profile (design frozen) */
  onboardingProfileOverlay: 'rgba(18, 20, 22, 0.94)',
  onboardingProfileSubtitle: '#A0A8B8',
  onboardingProfileFormBackground: '#1C1F24',
  onboardingProfileFormBorder: '#2D323A',
  onboardingProfileFieldBackground: '#252A30',
  onboardingProfileFieldBorder: '#2D323A',
  onboardingProfileLabel: '#8A94A6',
  onboardingProfileSelectedFill: BRAND_ACCENT_FILL,
  onboardingProfilePlaceholder: 'rgba(255, 255, 255, 0.55)',

  /** Figma: nordyan-onboarding-7-sa-mater-du (design frozen) */
  onboardingMeasurementHelpBackground: '#0a0e17',
  onboardingMeasurementHelpCardBackground: '#141a29',
  onboardingMeasurementHelpCardBorder: '#222c3d',
  onboardingMeasurementHelpText: '#f8fafc',
  onboardingMeasurementHelpTextMuted: '#8a99ad',
  onboardingMeasurementHelpAccent: BRAND_ACCENT,

  /** Figma: nordyan-onboarding-5-result — same surface family as metric cards, not saturated blue. */
  onboardingCoachCardBackground: '#1C1F24',
  onboardingCoachCardBorder: 'rgba(201, 164, 92, 0.22)',
  onboardingErrorText: '#F97066',

  // Home (Figma: nordyan-home)
  homeBackground: '#121214',
  homeSurface: '#1E1E23',
  homeBorder: 'rgba(255, 255, 255, 0.04)',
  homeTextMuted: '#8E8E95',
  homeTextDim: '#5C5C62',
  homeAccentSlate: BRAND_ACCENT,
  homeTabBarBackground: 'rgba(18, 18, 20, 0.9)',

  /** Figma: nordyan-profile (design frozen) */
  profileBackground: '#0B0810',
  profileIconWrapperBackground: 'rgba(255, 255, 255, 0.02)',
  profileMountainOverlay: 'rgba(11, 8, 16, 0.58)',
  profileAvatarRing: BRAND_ACCENT,
  profileAvatarFill: '#15151A',
  /** Slightly muted Profile copy for honest coming-soon rows. */
  profileComingSoonTitle: '#C8CAD1',
  profileComingSoonSubtitle: '#9A9BA3',

  /** Figma: nordyan-profile-health-data-sources (design frozen) */
  profileHealthDataSourcesBackground: '#0D0F12',
  profileHealthDataSourceCardBackground: '#161920',
  profileHealthDataSourceCardBorder: '#202530',
  profileHealthDataSourceIconBox: '#1F232E',
  profileHealthDataSourceIconBoxDisabled: '#202530',
  profileHealthDataSourceTextMuted: '#949EB0',
  profileHealthDataSourceTextDim: '#4E5668',
  profileHealthDataSourceAccent: BRAND_ACCENT,
  profileHealthDataSourceAccentFill: BRAND_ACCENT_FILL,
  profileHealthDataSourceStatusDot: '#949EB0',
  profileHealthDataSourceStatusDotDim: '#4E5668',

  /** Figma: nordyan-development-home (design frozen) */
  developmentBackground: '#0A0B0D',
  developmentSurface: '#14161A',
  developmentBorder: '#23262D',
  developmentText: '#F3F4F6',
  developmentTextMuted: '#8E939E',
  /**
   * Semantic positive (improving deltas / positive factor tone).
   * Not the brand gold — do not use for navigation/identity chrome.
   */
  developmentAccent: SEMANTIC_POSITIVE,
  developmentAccentFill: SEMANTIC_POSITIVE_FILL,
  developmentCoachCardBackground: '#1C1F24',
} as const;
