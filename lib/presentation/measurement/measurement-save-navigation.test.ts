import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { routes } from '../../../constants/routes';

import {
  MEASUREMENT_PARTIAL_CONTINUE_LABEL,
  MEASUREMENT_SAVE_SUCCESS_NAVIGATION,
  resolveMeasurementSaveNavigation,
} from './measurement-save-navigation';

describe('measurement save success navigation', () => {
  it('replaces the new-measurement screen with Health history after completed save', () => {
    const decision = resolveMeasurementSaveNavigation('completed');

    assert.equal(decision.action, 'replace');
    assert.equal(decision.showPartialWarning, false);
    assert.equal(
      MEASUREMENT_SAVE_SUCCESS_NAVIGATION.destination,
      routes.healthMeasurementHistory,
    );
    assert.equal(decision.destination, '/(tabs)/health');
    assert.notEqual(
      MEASUREMENT_SAVE_SUCCESS_NAVIGATION.destination,
      MEASUREMENT_SAVE_SUCCESS_NAVIGATION.entryRoute,
    );
  });

  it('does not keep the completed success/entry screen as the Health tab route', () => {
    assert.equal(MEASUREMENT_SAVE_SUCCESS_NAVIGATION.entryRoute, routes.healthNewMeasurement);
    assert.equal(resolveMeasurementSaveNavigation('completed').action, 'replace');
    assert.notEqual(MEASUREMENT_SAVE_SUCCESS_NAVIGATION.method, 'push');
  });

  it('returning to Health after completed save cannot reopen the success screen', () => {
    const decision = resolveMeasurementSaveNavigation('completed');
    assert.equal(decision.destination, '/(tabs)/health');
    assert.notEqual(decision.destination, '/(tabs)/health/new-measurement');
    assert.equal(decision.action, 'replace');
  });

  it('does not immediately replace after partial snapshot failure', () => {
    const decision = resolveMeasurementSaveNavigation('partial');

    assert.equal(decision.action, 'stay');
    assert.equal(decision.showPartialWarning, true);
    assert.equal(decision.continueToHistory, true);
    assert.equal(MEASUREMENT_PARTIAL_CONTINUE_LABEL(), 'Till mäthistorik');
    assert.equal(decision.destination, routes.healthMeasurementHistory);
  });

  it('keeps Home reminder and Health + on the same new-measurement workflow route', () => {
    assert.equal(MEASUREMENT_SAVE_SUCCESS_NAVIGATION.entryRoute, routes.healthNewMeasurement);
    assert.equal(routes.healthNewMeasurement, '/(tabs)/health/new-measurement');
  });

  it('does not alter snapshot pipeline fields', () => {
    assert.deepEqual(Object.keys(MEASUREMENT_SAVE_SUCCESS_NAVIGATION).sort(), [
      'destination',
      'entryRoute',
      'method',
    ]);
  });
});
