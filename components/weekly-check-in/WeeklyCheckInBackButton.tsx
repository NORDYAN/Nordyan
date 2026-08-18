import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { t } from '@/lib/i18n';
import {
  weeklyCheckInColors,
  weeklyCheckInLayout,
} from '@/theme/weekly-check-in';

type WeeklyCheckInBackButtonProps = {
  onPress: () => void;
};

export function WeeklyCheckInBackButton({ onPress }: WeeklyCheckInBackButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons
        name="arrow-back"
        size={weeklyCheckInLayout.backIconSize}
        color={weeklyCheckInColors.title}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: weeklyCheckInLayout.backButtonSize,
    height: weeklyCheckInLayout.backButtonSize,
    borderRadius: weeklyCheckInLayout.backButtonRadius,
    backgroundColor: weeklyCheckInColors.card,
    borderWidth: 1,
    borderColor: weeklyCheckInColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
