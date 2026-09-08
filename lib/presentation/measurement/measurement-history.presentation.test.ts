import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { routes } from '../../../constants/routes';

import { MEASUREMENT_SAVE_SUCCESS_NAVIGATION } from './measurement-save-navigation';
import {
  MEASUREMENT_HISTORY_DETAIL_DESTINATION,
  formatMeasurementHistoryCircumference,
  formatMeasurementHistoryDate,
  formatMeasurementHistoryWeight,
} from './measurement-history.presentation';

describe('measurement history card', () => {
  it('does not expose a Detaljer destination', () => {
    assert.equal(MEASUREMENT_HISTORY_DETAIL_DESTINATION, null);
  });

  it('keeps date and measurement value formatting', () => {
    assert.equal(formatMeasurementHistoryDate('2026-08-10'), '10 augusti 2026');
    assert.equal(formatMeasurementHistoryWeight(82.4), '82,4 kg');
    assert.equal(formatMeasurementHistoryCircumference(91.2), '91 cm');
    assert.equal(formatMeasurementHistoryCircumference(null), '—');
    assert.equal(formatMeasurementHistoryCircumference(undefined), '—');
  });

  it('is the destination after a successful save so the new row can appear in history', () => {
    assert.equal(
      MEASUREMENT_SAVE_SUCCESS_NAVIGATION.destination,
      routes.healthMeasurementHistory,
    );
    assert.equal(MEASUREMENT_HISTORY_DETAIL_DESTINATION, null);
  });
});
