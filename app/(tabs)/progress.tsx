import { StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/theme';

export default function ProgressScreen() {
  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text variant="title">Progress</Text>
        <Text variant="subtitle">Track your journey</Text>
        <Text style={styles.mock}>Mock: Weekly progress data</Text>
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
