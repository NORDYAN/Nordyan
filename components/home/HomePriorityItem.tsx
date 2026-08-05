import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { colors, homeLayout, typography } from '@/theme';

type HomePriorityItemProps = {
  title: string;
  subtitle: string;
  completed?: boolean;
  onToggleComplete?: (completed: boolean) => void;
};

export function HomePriorityItem({
  title,
  subtitle,
  completed = false,
  onToggleComplete,
}: HomePriorityItemProps) {
  const cardOpacity = useRef(new Animated.Value(completed ? 0.74 : 1)).current;
  const checkScale = useRef(new Animated.Value(completed ? 1 : 1)).current;
  const checkFill = useRef(new Animated.Value(completed ? 1 : 0)).current;

  useEffect(() => {
    if (!completed) {
      cardOpacity.setValue(1);
      checkFill.setValue(0);
      checkScale.setValue(1);
      return;
    }

    checkFill.setValue(0);
    checkScale.setValue(0.72);

    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 0.74,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(checkScale, {
          toValue: 1.08,
          friction: 5,
          tension: 140,
          useNativeDriver: true,
        }),
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 7,
          tension: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(checkFill, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardOpacity, checkFill, checkScale, completed]);

  const handlePress = () => {
    // Reserved for future haptic feedback on completion toggle.
    onToggleComplete?.(!completed);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completed }}
    >
      <Animated.View style={{ opacity: cardOpacity }}>
        <Card padding={homeLayout.priorityCardPadding} borderRadius={homeLayout.priorityCardRadius} style={styles.card}>
          <Animated.View
            style={[
              completed ? styles.completedCheck : styles.pendingCheck,
              completed && { transform: [{ scale: checkScale }] },
            ]}
          >
            {completed ? (
              <Animated.View style={{ opacity: checkFill }}>
                <Ionicons name="checkmark" size={12} color={colors.onboardingText} />
              </Animated.View>
            ) : null}
          </Animated.View>

          <View style={styles.copy}>
            <Text style={[styles.title, completed && styles.titleCompleted]}>{title}</Text>
            <Text style={[styles.subtitle, completed && styles.subtitleCompleted]}>{subtitle}</Text>
          </View>
        </Card>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  completedCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.homeAccentSlate,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.homeTextDim,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.onboardingText,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  titleCompleted: {
    color: colors.homeTextMuted,
    textDecorationLine: 'line-through',
  },
  subtitle: {
    color: colors.homeTextMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
  },
  subtitleCompleted: {
    color: colors.homeTextMuted,
    opacity: 0.92,
  },
});
