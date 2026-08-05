import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme';

type OnboardingAccentIconProps = {
  size?: number;
};

export function OnboardingAccentIcon({ size = 18 }: OnboardingAccentIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      accessibilityLabel=""
      importantForAccessibility="no"
    >
      <Path d="M9 2.5L15.5 15.5H2.5L9 2.5Z" fill={colors.onboardingAccent} />
    </Svg>
  );
}
