import { colors } from './colors';
import { onboardingLayout, onboardingProfileLayout } from './onboarding';

/** Auth shell layout — reuses onboarding/profile tokens, no second color system. */
export const authLayout = {
  overlay: colors.onboardingOverlayPromise,
  horizontalPadding: onboardingLayout.horizontalPadding,
  contentPaddingTop: 32,
  contentPaddingBottom: onboardingLayout.contentPaddingBottom,
  brandMarkWidth: 148,
  brandMarkHeight: 44,
  brandGap: onboardingLayout.brandMarkGap,
  wordmarkSize: 32,
  wordmarkLineHeight: 38,
  brandToHeadingGap: 36,
  headingSize: 28,
  headingLetterSpacing: -0.3,
  headingToFormGap: 24,
  formGap: onboardingProfileLayout.formRowGap,
  fieldHeight: onboardingProfileLayout.fieldHeight,
  fieldLabelGap: onboardingProfileLayout.fieldLabelGap,
  fieldPaddingHorizontal: onboardingProfileLayout.fieldPaddingHorizontal,
  toggleSize: 44,
  buttonHeight: onboardingLayout.buttonHeight,
  footerGap: 8,
  footerTopGap: 20,
} as const;
