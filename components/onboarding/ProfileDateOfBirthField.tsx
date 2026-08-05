import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, onboardingProfileLayout, radii, typography } from '@/theme';

const PLACEHOLDER = 'Välj födelsedatum';

type ProfileDateOfBirthFieldProps = {
  label: string;
  value: string;
  uppercaseLabel?: boolean;
  onChange: (isoDate: string) => void;
};

function toIsoDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function formatDateOfBirthDisplay(iso: string): string {
  const date = parseIsoDate(iso);
  if (!date) {
    return '';
  }

  return new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function defaultPickerDate(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 40);
  date.setHours(12, 0, 0, 0);
  return date;
}

function minimumBirthDate(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 100);
  date.setHours(12, 0, 0, 0);
  return date;
}

function maximumBirthDate(): Date {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  return date;
}

export function ProfileDateOfBirthField({
  label,
  value,
  uppercaseLabel = false,
  onChange,
}: ProfileDateOfBirthFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(defaultPickerDate);

  const displayValue = useMemo(() => formatDateOfBirthDisplay(value), [value]);
  const hasValue = displayValue.length > 0;

  const openPicker = () => {
    setPickerDate(parseIsoDate(value) ?? defaultPickerDate());
    setShowPicker(true);
  };

  const closePicker = () => {
    setShowPicker(false);
  };

  const confirmPicker = () => {
    onChange(toIsoDateLocal(pickerDate));
    closePicker();
  };

  const handleAndroidChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(false);

    if (event.type === 'set' && selectedDate) {
      onChange(toIsoDateLocal(selectedDate));
    }
  };

  const handleIosPickerChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setPickerDate(selectedDate);
    }
  };

  return (
    <View style={[styles.root, styles.rootInline]}>
      <Text style={[styles.label, !uppercaseLabel && styles.labelTitleCase]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={PLACEHOLDER}
        onPress={openPicker}
        style={({ pressed }) => [styles.inputField, pressed && styles.inputFieldPressed]}
      >
        <Text
          style={[styles.input, !hasValue && styles.placeholder]}
          numberOfLines={1}
        >
          {hasValue ? displayValue : PLACEHOLDER}
        </Text>
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={closePicker}
        >
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={closePicker} />
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Avbryt"
                  onPress={closePicker}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.modalAction}>Avbryt</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Klar"
                  onPress={confirmPicker}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.modalActionPrimary}>Klar</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="spinner"
                locale="sv-SE"
                onChange={handleIosPickerChange}
                minimumDate={minimumBirthDate()}
                maximumDate={maximumBirthDate()}
                themeVariant="dark"
                style={styles.iosPicker}
              />
            </View>
          </View>
        </Modal>
      ) : null}

      {Platform.OS === 'android' && showPicker ? (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          onChange={handleAndroidChange}
          minimumDate={minimumBirthDate()}
          maximumDate={maximumBirthDate()}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: onboardingProfileLayout.fieldLabelGap,
    minWidth: 0,
  },
  rootInline: {
    flex: 1,
  },
  label: {
    color: colors.onboardingProfileLabel,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  labelTitleCase: {
    letterSpacing: 0,
    textTransform: 'none',
  },
  inputField: {
    height: onboardingProfileLayout.fieldHeight,
    borderRadius: radii.lg,
    backgroundColor: colors.onboardingProfileFieldBackground,
    borderWidth: 1,
    borderColor: colors.onboardingProfileFieldBorder,
    paddingHorizontal: onboardingProfileLayout.fieldPaddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputFieldPressed: {
    opacity: 0.85,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: colors.onboardingText,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.regular,
  },
  placeholder: {
    color: colors.onboardingProfilePlaceholder,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalSheet: {
    backgroundColor: colors.onboardingProfileFormBackground,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: onboardingProfileLayout.fieldPaddingHorizontal,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.onboardingProfileFormBorder,
  },
  modalAction: {
    color: colors.onboardingProfileLabel,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  modalActionPrimary: {
    color: colors.onboardingAccent,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  iosPicker: {
    height: 216,
    width: '100%',
  },
});
