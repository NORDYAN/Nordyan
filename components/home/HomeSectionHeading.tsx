import { StyleSheet } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, homeLayout, typography } from '@/theme';

type HomeSectionHeadingProps = {
  title: string;
};

export function HomeSectionHeading({ title }: HomeSectionHeadingProps) {
  return <Text style={styles.title}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: {
    color: colors.homeTextMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingBottom: homeLayout.sectionHeadingPaddingBottom,
  },
});
