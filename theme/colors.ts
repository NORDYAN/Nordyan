export const colors = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  textPrimary: '#1A1D21',
  textSecondary: '#6B7280',
  accent: '#2D4A5E',
  border: '#E5E7EB',
  tabInactive: '#9CA3AF',

  // Onboarding intro (Figma: nordyan-onboarding-1-intro)
  onboardingBackground: '#121416',
  onboardingText: '#FFFFFF',
  onboardingTextMuted: '#E4E6EB',
  onboardingAccent: '#4A9FD9',
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
  onboardingProfileSelectedFill: 'rgba(74, 159, 217, 0.12)',
  onboardingProfilePlaceholder: 'rgba(255, 255, 255, 0.55)',

  /** Figma: nordyan-onboarding-7-sa-mater-du (design frozen) */
  onboardingMeasurementHelpBackground: '#0a0e17',
  onboardingMeasurementHelpCardBackground: '#141a29',
  onboardingMeasurementHelpCardBorder: '#222c3d',
  onboardingMeasurementHelpText: '#f8fafc',
  onboardingMeasurementHelpTextMuted: '#8a99ad',
  onboardingMeasurementHelpAccent: '#4a9fff',

  /** Figma: nordyan-onboarding-5-result (design frozen) */
  onboardingCoachCardBackground: '#1E3547',
  onboardingCoachCardBorder: 'rgba(74, 159, 217, 0.2)',
  onboardingErrorText: '#F97066',

  // Home (Figma: nordyan-home)
  homeBackground: '#121214',
  homeSurface: '#1E1E23',
  homeBorder: 'rgba(255, 255, 255, 0.04)',
  homeTextMuted: '#8E8E95',
  homeTextDim: '#5C5C62',
  homeAccentSlate: '#6A8595',
  homeTabBarBackground: 'rgba(18, 18, 20, 0.9)',

  /** Figma: nordyan-profile (design frozen) */
  profileBackground: '#0B0810',
  profileIconWrapperBackground: 'rgba(255, 255, 255, 0.02)',
  profileMountainOverlay: 'rgba(11, 8, 16, 0.58)',
  profileAvatarRing: '#4A9FD9',
  profileAvatarFill: '#15151A',

  /** Figma: nordyan-profile-health-data-sources (design frozen) */
  profileHealthDataSourcesBackground: '#0D0F12',
  profileHealthDataSourceCardBackground: '#161920',
  profileHealthDataSourceCardBorder: '#202530',
  profileHealthDataSourceIconBox: '#1F232E',
  profileHealthDataSourceIconBoxDisabled: '#202530',
  profileHealthDataSourceTextMuted: '#949EB0',
  profileHealthDataSourceTextDim: '#4E5668',
  profileHealthDataSourceAccent: '#5B9CF6',
  profileHealthDataSourceAccentFill: 'rgba(91, 156, 246, 0.08)',
  profileHealthDataSourceStatusDot: '#949EB0',
  profileHealthDataSourceStatusDotDim: '#4E5668',
} as const;
