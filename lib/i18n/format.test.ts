import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatDecimal, formatDisplayDate, intlLocaleFor } from './format';

describe('number and date localization', () => {
  it('uses Swedish and Norwegian Intl locales', () => {
    assert.equal(intlLocaleFor('sv'), 'sv-SE');
    assert.equal(intlLocaleFor('nb'), 'nb-NO');
  });

  it('formats decimals with a comma for both Swedish and Norwegian', () => {
    assert.equal(formatDecimal(82.4, 'sv'), '82,4');
    assert.equal(formatDecimal(82.4, 'nb'), '82,4');
  });

  it('formats month names in the active language', () => {
    const date = new Date(2026, 7, 10, 12, 0, 0);
    assert.match(formatDisplayDate(date, 'sv'), /augusti/i);
    assert.match(formatDisplayDate(date, 'nb'), /august/i);
  });
});
