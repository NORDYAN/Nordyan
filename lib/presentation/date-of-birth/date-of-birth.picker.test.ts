import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { dateOfBirthPickerConfig } from './date-of-birth.picker';

describe('date of birth picker', () => {
  it('uses Android spinner with year-first selection so decades are not paged month-by-month', () => {
    assert.equal(dateOfBirthPickerConfig.android.display, 'spinner');
    assert.equal(dateOfBirthPickerConfig.android.startOnYearSelection, true);
    assert.notEqual(dateOfBirthPickerConfig.android.display, 'default');
    assert.notEqual(dateOfBirthPickerConfig.android.display, 'calendar');
  });

  it('preserves the iOS spinner path and ISO persistence format', () => {
    assert.equal(dateOfBirthPickerConfig.ios.display, 'spinner');
    assert.equal(dateOfBirthPickerConfig.ios.startOnYearSelection, false);
    assert.equal(dateOfBirthPickerConfig.persistFormat, 'YYYY-MM-DD');
  });
});
