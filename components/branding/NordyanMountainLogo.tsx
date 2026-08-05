import { Image, type ImageStyle, type StyleProp } from 'react-native';

import { nordyanMountainLogoSource } from '@/assets/logos';
import { onboardingLayout } from '@/theme';

type NordyanMountainLogoProps = {
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
};

export function NordyanMountainLogo({
  width = onboardingLayout.brandMarkWidth,
  height = onboardingLayout.brandMarkHeight,
  style,
}: NordyanMountainLogoProps) {
  return (
    <Image
      source={nordyanMountainLogoSource}
      style={[{ width, height }, style]}
      resizeMode="contain"
      accessibilityLabel="NORDYAN mountain mark"
    />
  );
}
