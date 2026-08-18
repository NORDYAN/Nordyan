import { routes } from '@/constants/routes';
import { t } from '@/lib/i18n';

/**
 * After a completed new-measurement save, replace the entry screen so the
 * Health tab cannot reopen the completed form from leftover stack state.
 *
 * Partial snapshot failure stays on the entry screen so the orange warning
 * remains visible until the user continues to history.
 */
export const MEASUREMENT_SAVE_SUCCESS_NAVIGATION = {
  method: 'replace',
  destination: routes.healthMeasurementHistory,
  entryRoute: routes.healthNewMeasurement,
} as const;

export const MEASUREMENT_PARTIAL_CONTINUE_LABEL = () => t('health.new.continueToHistory');

export type MeasurementSaveNavigationOutcome = 'completed' | 'partial';

export type MeasurementSaveNavigationDecision = {
  action: 'replace' | 'stay';
  destination: typeof routes.healthMeasurementHistory;
  showPartialWarning: boolean;
  continueToHistory: boolean;
};

export function resolveMeasurementSaveNavigation(
  outcome: MeasurementSaveNavigationOutcome,
): MeasurementSaveNavigationDecision {
  if (outcome === 'completed') {
    return {
      action: 'replace',
      destination: MEASUREMENT_SAVE_SUCCESS_NAVIGATION.destination,
      showPartialWarning: false,
      continueToHistory: false,
    };
  }

  return {
    action: 'stay',
    destination: MEASUREMENT_SAVE_SUCCESS_NAVIGATION.destination,
    showPartialWarning: true,
    continueToHistory: true,
  };
}
