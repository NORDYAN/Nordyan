import { colors } from './colors';

/**
 * Onboarding v1.1 Initial Lifestyle — Figma nordyan-onboarding-v11-*.
 * Onboarding-owned tokens. Do not import weekly-check-in theme.
 */
export const initialLifestyleColors = {
  background: colors.onboardingBackground,
  card: colors.onboardingProfileFormBackground,
  border: colors.onboardingProfileFormBorder,
  primary: colors.onboardingAccent,
  title: colors.onboardingText,
  body: colors.onboardingTextMuted,
  muted: colors.onboardingProfileLabel,
  buttonText: colors.onboardingButtonText,
  introOverlay: 'rgba(18, 20, 22, 0.85)',
  productValueOverlay: 'rgba(18, 20, 22, 0.7)',
  selectedShadow: 'rgba(201, 164, 92, 0.2)',
} as const;

export const initialLifestyleLayout = {
  horizontalPadding: 32,
  headerPaddingHorizontal: 24,
  headerPaddingTop: 16,
  backIconSize: 16,
  backHitSlop: 14,
  bodyPaddingTop: 32,
  questionCopyGap: 8,
  questionToOptionsGap: 28,
  optionsGap: 10,
  optionRadius: 16,
  optionPadding: 18,
  optionMinHeight: 56,
  radioSize: 20,
  radioRadius: 10,
  radioBorderWidth: 2,
  radioDotSize: 10,
  footerPaddingTop: 20,
  introCopyPaddingTop: 120,
  introHeadlineGap: 12,
  introSectionGap: 32,
  introFooterGap: 12,
} as const;

export const initialLifestyleTypography = {
  overlineSize: 12,
  introTitleSize: 32,
  introTitleLineHeight: 38,
  introBodySize: 18,
  introBodyLineHeight: 31,
  timeHintSize: 14,
  questionTitleSize: 28,
  questionTitleLineHeight: 36,
  questionSupportSize: 14,
  optionSize: 16,
  progressSize: 14,
  secondaryLinkSize: 14,
} as const;
