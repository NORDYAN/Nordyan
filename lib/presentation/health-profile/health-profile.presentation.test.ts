import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  HEALTH_PROFILE_DATE_OF_BIRTH_INPUT,
  healthProfilePersonalFields,
} from './health-profile.presentation';

describe('health profile personal fields', () => {
  it('uses the editable date-picker path for date of birth', () => {
    assert.equal(HEALTH_PROFILE_DATE_OF_BIRTH_INPUT, 'date-picker');
    assert.equal(healthProfilePersonalFields.dateOfBirth.input, 'date-picker');
    assert.notEqual(healthProfilePersonalFields.dateOfBirth.input, 'decimal-pad');
  });

  it('keeps date of birth and height stacked', () => {
    assert.equal(healthProfilePersonalFields.dateOfBirth.stacked, true);
    assert.equal(healthProfilePersonalFields.height.stacked, true);
  });
});
