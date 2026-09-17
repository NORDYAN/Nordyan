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
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import {
  MEASUREMENT_PARTIAL_CONTINUE_LABEL,
  resolveMeasurementSaveNavigation,
} from '@/lib/presentation/measurement/measurement-save-navigation';
import {
  colors,
  healthNewMeasurementLayout,
  onboardingProfileLayout,
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
  onNavigateToHistory?: () => void;
};

const SAVE_SUCCESS_MS = 2500;

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
  setHipText: (value: string) => void,
) {
  setWeightText('');
  setWaistText('');
  setNeckText('');
  setHipText('');
}

export function MeasurementForm({
  userId,
  variant = 'default',
  onNavigateToHistory,
}: MeasurementFormProps) {
  useI18n();
  const isNewMeasurement = variant === 'newMeasurement';
  const [weightText, setWeightText] = useState('');
  const [waistText, setWaistText] = useState('');
  const [neckText, setNeckText] = useState('');
  const [hipText, setHipText] = useState('');
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
    if (submitState.status !== 'success' || submitState.outcome === 'partial') {
      return;
    }

    const timeoutId = setTimeout(() => {
      clearFeedback();
    }, SAVE_SUCCESS_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [clearFeedback, submitState]);

  const allFieldsFilled =
    weightText.trim().length > 0 &&
    waistText.trim().length > 0 &&
    neckText.trim().length > 0 &&
    hipText.trim().length > 0;

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
        hipCm: parseMeasurementNumericInput(hipText) ?? Number.NaN,
      },
      { todayLocalDate },
    );
  }, [allFieldsFilled, hipText, neckText, todayLocalDate, userId, waistText, weightText]);

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

  const handleHipChange = (text: string) => {
    resetFeedbackIfNeeded();
    setHipText(normalizeMeasurementDecimalInput(text));
  };

  const handleSave = async () => {
    if (!canSave || isSubmitting || !validationResult?.valid) {
      return;
    }

    const weightKg = parseMeasurementNumericInput(weightText);
    const waistCm = parseMeasurementNumericInput(waistText);
    const neckCm = parseMeasurementNumericInput(neckText);
    const hipCm = parseMeasurementNumericInput(hipText);

    if (weightKg === null || waistCm === null || neckCm === null || hipCm === null) {
      return;
    }

    const outcome = await submit({
      userId,
      measuredAt: todayLocalDate,
      weightKg,
      waistCm,
      neckCm,
      hipCm,
    });

    if (!outcome) {
      return;
    }

    clearFormFields(setWeightText, setWaistText, setNeckText, setHipText);

    if (resolveMeasurementSaveNavigation(outcome).action === 'replace') {
      onNavigateToHistory?.();
    }
  };

  const weightInput = isNewMeasurement ? (
    <ProfileMeasurementField
      label={t('health.new.weight')}
      unit="kg"
      value={weightText}
      placeholder={t('health.new.placeholder')}
      editable={!isSubmitting}
      uppercaseLabel={false}
      stacked
      onChangeText={handleWeightChange}
      errorMessage={allFieldsFilled ? fieldError(fieldErrors, 'weightKg') : undefined}
    />
  ) : (
    <MeasurementInput
      label={t('health.new.weight')}
      unit="kg"
      value={weightText}
      editable={!isSubmitting}
      onChangeText={handleWeightChange}
      errorMessage={allFieldsFilled ? fieldError(fieldErrors, 'weightKg') : undefined}
    />
  );

  const waistInput = isNewMeasurement ? (
    <ProfileMeasurementField
      label={t('health.new.waist')}
      unit="cm"
      value={waistText}
      placeholder={t('health.new.placeholder')}
      editable={!isSubmitting}
      uppercaseLabel={false}
      stacked
      onChangeText={handleWaistChange}
      errorMessage={allFieldsFilled ? fieldError(fieldErrors, 'waistCm') : undefined}
    />
  ) : (
    <MeasurementInput
      label={t('health.new.waist')}
      unit="cm"
      value={waistText}
      editable={!isSubmitting}
      onChangeText={handleWaistChange}
      errorMessage={allFieldsFilled ? fieldError(fieldErrors, 'waistCm') : undefined}
    />
  );

  const neckInput = isNewMeasurement ? (
    <ProfileMeasurementField
      label={t('health.new.neck')}
      unit="cm"
      value={neckText}
      placeholder={t('health.new.placeholder')}
      editable={!isSubmitting}
      uppercaseLabel={false}
      stacked
      onChangeText={handleNeckChange}
      errorMessage={allFieldsFilled ? fieldError(fieldErrors, 'neckCm') : undefined}
    />
  ) : (
    <MeasurementInput
      label={t('health.new.neck')}
      unit="cm"
      value={neckText}
      editable={!isSubmitting}
      onChangeText={handleNeckChange}
      errorMessage={allFieldsFilled ? fieldError(fieldErrors, 'neckCm') : undefined}
    />
  );

  const hipInput = isNewMeasurement ? (
    <ProfileMeasurementField
      label={t('health.new.hip')}
      unit="cm"
      value={hipText}
      placeholder={t('health.new.placeholder')}
      editable={!isSubmitting}
      uppercaseLabel={false}
      stacked
      onChangeText={handleHipChange}
      errorMessage={allFieldsFilled ? fieldError(fieldErrors, 'hipCm') : undefined}
    />
  ) : (
    <MeasurementInput
      label={t('health.new.hip')}
      unit="cm"
      value={hipText}
      editable={!isSubmitting}
      onChangeText={handleHipChange}
      errorMessage={allFieldsFilled ? fieldError(fieldErrors, 'hipCm') : undefined}
    />
  );

  const saveSection = (
    <View style={styles.saveSection}>
      <View style={styles.saveButtonContainer}>
        <Button
          label={isSubmitting ? ' ' : t('health.new.save')}
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

      {isNewMeasurement && isPartialSuccess && onNavigateToHistory ? (
        <Button
          label={MEASUREMENT_PARTIAL_CONTINUE_LABEL()}
          variant="onboarding"
          style={[styles.saveButton, styles.newMeasurementSaveButton]}
          onPress={onNavigateToHistory}
          accessibilityLabel={MEASUREMENT_PARTIAL_CONTINUE_LABEL()}
        />
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
        <Pressable
          style={({ pressed }) => [
            styles.measurementHelpLink,
            pressed && styles.measurementHelpLinkPressed,
          ]}
          onPress={() => setMeasurementHelpVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={t('health.new.help')}
        >
          <View style={styles.measurementHelpLabelGroup}>
            <Ionicons
              name="information-circle-outline"
              size={onboardingProfileLayout.helpIconSize}
              color={colors.onboardingAccent}
            />
            <Text style={styles.measurementHelpLinkText} numberOfLines={1}>
              {t('health.new.help')}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={healthNewMeasurementLayout.helpChevronSize}
            color={colors.onboardingAccent}
          />
        </Pressable>

        <View style={styles.newMeasurementSection}>
          <Text style={styles.sectionLabel}>{t('health.new.section')}</Text>
          <Card
            padding={onboardingProfileLayout.formCardPadding}
            borderRadius={onboardingProfileLayout.formCardRadius}
            style={styles.measurementCard}
          >
            {weightInput}
            {waistInput}
            {neckInput}
            {hipInput}
          </Card>
        </View>

        <View style={styles.newMeasurementSaveSection}>
          <View style={styles.newMeasurementSaveInner}>{saveSection}</View>
        </View>

        <MeasurementHelpModal
          visible={measurementHelpVisible}
          title={t('onboarding.howToMeasure')}
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
      {hipInput}
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
