import { StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/theme';

export default function HealthScoreScreen() {
  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text variant="title">Health Score</Text>
        <Text variant="subtitle">Your overall health snapshot</Text>
        <Text style={styles.mock}>Mock: Score calculation coming later</Text>
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
