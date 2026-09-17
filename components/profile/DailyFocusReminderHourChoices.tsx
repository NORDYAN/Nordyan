import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import {
  formatOnboardingDailyReminderHour,
  ONBOARDING_DAILY_REMINDER_HOUR_ROWS,
  type OnboardingDailyReminderHour,
} from '@/lib/onboarding/pending-notification-choice';
import {
  colors,
  onboardingLayout,
  onboardingMeasurementChoiceLayout,
  radii,
  typography,
} from '@/theme';

type DailyFocusReminderHourChoicesProps = {
  selectedHour: OnboardingDailyReminderHour;
  disabled?: boolean;
  onSelect: (hour: OnboardingDailyReminderHour) => void;
};

export function DailyFocusReminderHourChoices({
  selectedHour,
  disabled = false,
  onSelect,
}: DailyFocusReminderHourChoicesProps) {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {ONBOARDING_DAILY_REMINDER_HOUR_ROWS.map((row) => (
        <View key={row.join('-')} style={styles.row}>
          {row.map((hour) => {
            const selected = hour === selectedHour;
            const label = formatOnboardingDailyReminderHour(hour);
            return (
              <Pressable
                key={hour}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={label}
                disabled={disabled}
                onPress={() => {
                  onSelect(hour);
                }}
                style={({ pressed }) => [
                  styles.choice,
                  selected && styles.choiceSelected,
                  pressed && styles.choicePressed,
                ]}
              >
                <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: onboardingLayout.horizontalPadding / 2,
  },
  row: {
    flexDirection: 'row',
    gap: onboardingLayout.horizontalPadding / 2,
  },
  choice: {
    flex: 1,
    minHeight: onboardingMeasurementChoiceLayout.secondaryButtonMinHeight,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.onboardingAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceSelected: {
    backgroundColor: colors.onboardingAccent,
  },
  choicePressed: {
    opacity: 0.85,
  },
  label: {
    color: colors.onboardingAccent,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  labelSelected: {
    color: colors.onboardingBackground,
  },
});
