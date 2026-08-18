import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEVELOPMENT_FOCUS_REFRESH } from './development-focus-refresh';

describe('Development focus refresh', () => {
  it('refetches Development Home on focus without a loading flash', () => {
    assert.equal(DEVELOPMENT_FOCUS_REFRESH.home.refetchOnFocus, true);
    assert.equal(DEVELOPMENT_FOCUS_REFRESH.home.showLoading, false);
  });

  it('refetches Development Trends on focus without resetting the selected period', () => {
    assert.equal(DEVELOPMENT_FOCUS_REFRESH.trends.refetchOnFocus, true);
    assert.equal(DEVELOPMENT_FOCUS_REFRESH.trends.showLoading, false);
    assert.equal(DEVELOPMENT_FOCUS_REFRESH.trends.preservePeriod, true);
  });
});
