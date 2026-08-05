import { StyleSheet } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, profileLayout, profileTypography, typography } from '@/theme';

type ProfileSectionHeadingProps = {
  title: string;
};

export function ProfileSectionHeading({ title }: ProfileSectionHeadingProps) {
  return <Text style={styles.title}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: {
    color: colors.homeTextMuted,
    fontSize: profileTypography.sectionLabelSize,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingLeft: profileLayout.sectionLabelPaddingLeft,
    paddingBottom: profileLayout.sectionLabelPaddingBottom,
  },
});
