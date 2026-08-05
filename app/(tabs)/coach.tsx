import { StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/theme';

export default function CoachScreen() {
  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text variant="title">Coach</Text>
        <Text variant="subtitle">AI health coaching</Text>
        <Text style={styles.mock}>Mock: Coach chat coming soon</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.sm,
  },
  mock: {
    marginTop: spacing.md,
  },
});
