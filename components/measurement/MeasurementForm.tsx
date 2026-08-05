import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  DEFAULT_MEASUREMENT_HELP_SECTIONS,
  MeasurementHelpModal,
  ProfileMeasurementField,
} from '@/components/onboarding';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import type { MeasurementField } from '@/lib/domain/measurement';
import { measurementValidator } from '@/lib/domain/measurement';
import { useSubmitMeasurement } from '@/lib/hooks/measurement';
import {
  colors,
  healthNewMeasurementLayout,
  onboardingProfileLayout,
  profileHealthDataSourcesLayout,
  typography,
} from '@/theme';

import { MeasurementInput } from './MeasurementInput';
import {
  getTodayLocalDate,
  normalizeMeasurementDecimalInput,
  parseMeasurementNumericInput,
} from './measurement-input.utils';

type MeasurementFormProps = {
  userId: string;
  variant?: 'default' | 'newMeasurement';
};

const SAVE_SUCCESS_MS = 2500;
const MEASUREMENT_HELP_LABEL = 'Hur mäter jag midja och hals?';

const TIPS_BULLETS = [
  'på morgonen före frukost',
  'efter toalettbesök',
  'innan träning',
  'vid ungefär samma tidpunkt varje gång',
] as const;

function fieldError(
  errors: Array<{ field: MeasurementField; message: string }>,
  field: MeasurementField,
): string | undefined {
  return errors.find((error) => error.field === field)?.message;
}

function clearFormFields(
  setWeightText: (value: string) => void,
  setWaistText: (value: string) => void,
  setNeckText: (value: string) => void,
) {
  setWeightText('');
  setWaistText('');
  setNeckText('');
}

export function MeasurementForm({ userId, variant = 'default' }: MeasurementFormProps) {
  const isNewMeasurement = variant === 'newMeasurement';
  const [weightText, setWeightText] = useState('');
  const [waistText, setWaistText] = useState('');
  const [neckText, setNeckText] = useState('');
  const [measurementHelpVisible, setMeasurementHelpVisible] = useState(false);
  const { state: submitState, submit, clearFeedback } = useSubmitMeasurement();

  const todayLocalDate = useMemo(() => getTodayLocalDate(), []);
  const isSubmitting = submitState.status === 'submitting';
  const showFeedback = submitState.status === 'success';
  const feedbackMessage =
    submitState.status === 'success' ? submitState.message : undefined;
  const isPartialSuccess =
    submitState.status === 'success' && submitState.outcome === 'partial';
  const submitError = submitState.status === 'error' ? submitState.message : undefined;

  useEffect(() => {
    if (submitState.status !== 'success') {
      return;
    }

    const timeoutId = setTimeout(() => {
      clearFeedback();
    }, SAVE_SUCCESS_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [clearFeedback, submitState.status]);

  const allFieldsFilled =
    weightText.trim().length > 0 &&
    waistText.trim().length > 0 &&
    neckText.trim().length > 0;

  const validationResult = useMemo(() => {
    if (!allFieldsFilled) {
      return null;
    }

    return measurementValidator.validate(
      {
        userId,
        measuredAt: todayLocalDate,
        weightKg: parseMeasurementNumericInput(weightText) ?? Number.NaN,
        waistCm: parseMeasurementNumericInput(waistText) ?? Number.NaN,
        neckCm: parseMeasurementNumericInput(neckText) ?? Number.NaN,
      },
      { todayLocalDate },
    );
  }, [allFieldsFilled, neckText, todayLocalDate, userId, waistText, weightText]);

  const canSave =
    allFieldsFilled &&
    validationResult?.valid === true &&
    !isSubmitting &&
    !showFeedback;

  const fieldErrors =
    validationResult && !validationResult.valid ? validationResult.errors : [];

  const resetFeedbackIfNeeded = () => {
    if (submitState.status === 'error' || submitState.status === 'success') {
      clearFeedback();
    }
  };

  const handleWeightChange = (text: string) => {
    resetFeedbackIfNeeded();
    setWeightText(normalizeMeasurementDecimalInput(text));
  };

  const handleWaistChange = (text: string) => {
    resetFeedbackIfNeeded();
    setWaistText(normalizeMeasurementDecimalInput(text));
  };

  const handleNeckChange = (text: string) => {
    resetFeedbackIfNeeded();
    setNeckText(normalizeMeasurementDecimalInput(text));
  };

  const handleSave = async () => {
    if (!canSave || isSubmitting || !validationResult?.valid) {
      return;
    }

    const weightKg = parseMeasurementNumericInput(weightText);
    const waistCm = parseMeasurementNumericInput(waistText);
    const neckCm = parseMeasurementNumericInput(neckText);

    if (weightKg === null || waistCm === null || neckCm === null) {
      return;
    }

    const success = await submit({
      userId,
      measuredAt: todayLocalDate,
      weightKg,
      waistCm,
      neckCm,
    });

    if (success) {
      clearFormFields(setWeightText, setWaistText, setNeckText);
    }
  };

  const weightInput = isNewMeasurement ? (
    <ProfileMeasurementField
      label="Vikt"
      unit="kg"
      value={weightText}
      placeholder="Ange"
      editable={!isSubmitting}
      uppercaseLabel={false}
      stacked
      onChangeText={handleWeightChange}
      errorMessage={allFieldsFilled ? fieldError(fieldErrors, 'weightKg') : undefined}
    />
  ) : (
    <MeasurementInput
      label="Vikt"
      unit="kg"
      value={weightText}
      editable={!isSubmitting}
      onChangeText={handleWeightChange}
      errorMessage={allFieldsFilled ? fieldError(fieldErrors, 'weightKg') : undefined}
    />
  );

  const waistInput = isNewMeasurement ? (
    <ProfileMeasurementField
      label="Midjemått"
      unit="cm"
      value={waistText}
      placeholder="Ange"
      editable={!isSubmitting}
      uppercaseLabel={false}
      stacked
      onChangeText={handleWaistChange}
      errorMessage={allFieldsFilled ? fieldError(fieldErrors, 'waistCm') : undefined}
    />
  ) : (
    <MeasurementInput
      label="Midja"
      unit="cm"
      value={waistText}
      editable={!isSubmitting}
      onChangeText={handleWaistChange}
      errorMessage={allFieldsFilled ? fieldError(fieldErrors, 'waistCm') : undefined}
    />
  );

  const neckInput = isNewMeasurement ? (
    <ProfileMeasurementField
      label="Halsmått"
      unit="cm"
      value={neckText}
      placeholder="Ange"
      editable={!isSubmitting}
      uppercaseLabel={false}
      stacked
      onChangeText={handleNeckChange}
      errorMessage={allFieldsFilled ? fieldError(fieldErrors, 'neckCm') : undefined}
    />
  ) : (
    <MeasurementInput
      label="Hals"
      unit="cm"
      value={neckText}
      editable={!isSubmitting}
      onChangeText={handleNeckChange}
      errorMessage={allFieldsFilled ? fieldError(fieldErrors, 'neckCm') : undefined}
    />
  );

  const saveSection = (
    <View style={styles.saveSection}>
      <View style={styles.saveButtonContainer}>
        <Button
          label={isSubmitting ? ' ' : 'Spara mätning'}
          variant={isNewMeasurement ? 'onboarding' : 'primary'}
          style={[styles.saveButton, isNewMeasurement && styles.newMeasurementSaveButton]}
          disabled={!canSave}
          onPress={() => {
            void handleSave();
          }}
        />
        {isSubmitting ? (
          <View pointerEvents="none" style={styles.saveButtonLoader}>
            <ActivityIndicator
              color={isNewMeasurement ? colors.onboardingButtonText : colors.surface}
              size="small"
            />
          </View>
        ) : null}
      </View>

      {showFeedback ? (
        <View style={isPartialSuccess ? styles.partialBanner : styles.successBanner}>
          <Text style={isPartialSuccess ? styles.partialText : styles.successText}>
            {feedbackMessage}
          </Text>
        </View>
      ) : null}

      {submitError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{submitError}</Text>
        </View>
      ) : null}
    </View>
  );

  if (isNewMeasurement) {
    return (
      <>
        <View style={styles.newMeasurementSection}>
          <Text style={styles.sectionLabel}>Kroppsmått</Text>
          <Card
            padding={onboardingProfileLayout.formCardPadding}
            borderRadius={onboardingProfileLayout.formCardRadius}
            style={styles.measurementCard}
          >
            {weightInput}
            {waistInput}
            {neckInput}
          </Card>
        </View>

        <View style={styles.tipsSection}>
          <View style={styles.tipsCard}>
            <View style={styles.tipsIconBox}>
              <Text style={styles.tipsIconLabel}>i</Text>
            </View>
            <View style={styles.tipsTextBlock}>
              <Text style={styles.tipsTitle}>Tips för tillförlitliga mätningar</Text>
              <Text style={styles.tipsIntro}>
                För att få så tillförlitliga resultat som möjligt rekommenderar vi att du mäter:
              </Text>
              {TIPS_BULLETS.map((bullet) => (
                <Text key={bullet} style={styles.tipsBullet}>
                  • {bullet}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.measurementHelpLink,
            pressed && styles.measurementHelpLinkPressed,
          ]}
          onPress={() => setMeasurementHelpVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={MEASUREMENT_HELP_LABEL}
        >
          <View style={styles.measurementHelpLabelGroup}>
            <Ionicons
              name="information-circle-outline"
              size={onboardingProfileLayout.helpIconSize}
              color={colors.onboardingAccent}
            />
            <Text style={styles.measurementHelpLinkText} numberOfLines={1}>
              {MEASUREMENT_HELP_LABEL}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={healthNewMeasurementLayout.helpChevronSize}
            color={colors.onboardingAccent}
          />
        </Pressable>

        <View style={styles.newMeasurementSaveSection}>
          <View style={styles.newMeasurementSaveInner}>{saveSection}</View>
        </View>

        <MeasurementHelpModal
          visible={measurementHelpVisible}
          title="Så mäter du"
          sections={DEFAULT_MEASUREMENT_HELP_SECTIONS}
          onClose={() => setMeasurementHelpVisible(false)}
        />
      </>
    );
  }

  return (
    <View style={styles.form}>
      {weightInput}
      {waistInput}
      {neckInput}
      {saveSection}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 20,
  },
  newMeasurementSection: {
    gap: healthNewMeasurementLayout.sectionLabelGap,
    paddingHorizontal: healthNewMeasurementLayout.horizontalPadding,
    paddingTop: healthNewMeasurementLayout.sectionPaddingTop,
    width: '100%',
  },
  sectionLabel: {
    color: colors.onboardingProfileLabel,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  measurementCard: {
    backgroundColor: colors.onboardingProfileFormBackground,
    borderColor: colors.onboardingProfileFormBorder,
    gap: healthNewMeasurementLayout.measurementCardGap,
  },
  tipsSection: {
    paddingHorizontal: healthNewMeasurementLayout.horizontalPadding,
    paddingTop: healthNewMeasurementLayout.tipsPaddingTop,
    width: '100%',
  },
  tipsCard: {
    flexDirection: 'row',
    gap: profileHealthDataSourcesLayout.privacyCardGap,
    backgroundColor: colors.profileHealthDataSourceCardBackground,
    borderWidth: 1,
    borderColor: colors.profileHealthDataSourceCardBorder,
    borderRadius: profileHealthDataSourcesLayout.privacyCardRadius,
    padding: profileHealthDataSourcesLayout.privacyCardPadding,
    width: '100%',
  },
  tipsIconBox: {
    width: profileHealthDataSourcesLayout.privacyIconBoxSize,
    height: profileHealthDataSourcesLayout.privacyIconBoxSize,
    borderRadius: profileHealthDataSourcesLayout.privacyIconBoxRadius,
    backgroundColor: colors.profileHealthDataSourceIconBox,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsIconLabel: {
    color: colors.profileHealthDataSourceAccent,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  tipsTextBlock: {
    flex: 1,
    gap: profileHealthDataSourcesLayout.sourceCardTextGap,
    minWidth: 0,
  },
  tipsTitle: {
    color: colors.onboardingText,
    fontSize: profileHealthDataSourcesLayout.privacyTitleSize,
    fontWeight: typography.fontWeight.semibold,
  },
  tipsIntro: {
    color: colors.profileHealthDataSourceTextMuted,
    fontSize: profileHealthDataSourcesLayout.privacyBodySize,
    fontWeight: typography.fontWeight.regular,
    lineHeight:
      profileHealthDataSourcesLayout.privacyBodySize * typography.lineHeight.relaxed,
  },
  tipsBullet: {
    color: colors.profileHealthDataSourceTextMuted,
    fontSize: profileHealthDataSourcesLayout.privacyBodySize,
    fontWeight: typography.fontWeight.regular,
    lineHeight:
      profileHealthDataSourcesLayout.privacyBodySize * typography.lineHeight.relaxed,
  },
  measurementHelpLink: {
    alignSelf: 'stretch',
    minHeight: healthNewMeasurementLayout.helpRowMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: healthNewMeasurementLayout.horizontalPadding,
    paddingVertical: healthNewMeasurementLayout.helpRowPaddingVertical,
    marginTop: healthNewMeasurementLayout.helpPaddingTop,
    width: '100%',
  },
  measurementHelpLinkPressed: {
    opacity: 0.75,
  },
  measurementHelpLabelGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: onboardingProfileLayout.helpLinkGap,
    minWidth: 0,
    paddingRight: onboardingProfileLayout.helpLinkGap,
  },
  measurementHelpLinkText: {
    flexShrink: 1,
    color: colors.onboardingAccent,
    fontSize: healthNewMeasurementLayout.helpLinkFontSize,
    fontWeight: typography.fontWeight.medium,
  },
  newMeasurementSaveSection: {
    paddingHorizontal: healthNewMeasurementLayout.horizontalPadding,
    paddingTop: healthNewMeasurementLayout.buttonPaddingTop,
    width: '100%',
  },
  newMeasurementSaveInner: {
    gap: 12,
  },
  saveSection: {
    gap: 12,
  },
  saveButtonContainer: {
    position: 'relative',
  },
  saveButton: {
    width: '100%',
  },
  newMeasurementSaveButton: {
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBanner: {
    backgroundColor: 'rgba(71, 205, 137, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(71, 205, 137, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  successText: {
    color: '#47CD89',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    textAlign: 'center',
  },
  partialBanner: {
    backgroundColor: 'rgba(247, 144, 61, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(247, 144, 61, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  partialText: {
    color: '#F7903D',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: 'rgba(249, 112, 102, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249, 112, 102, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  errorText: {
    color: colors.onboardingErrorText,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    textAlign: 'center',
  },
});
