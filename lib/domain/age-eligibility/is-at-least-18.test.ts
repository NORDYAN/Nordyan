import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  calculateCompletedAgeYears,
  getLocalCalendarDate,
  isAtLeast18OnDate,
  isEligibleAdultDateOfBirth,
  parseCalendarDateParts,
} from './is-at-least-18';

describe('age eligibility calendar dates', () => {
  it('rejects impossible calendar dates', () => {
    assert.equal(parseCalendarDateParts('2020-02-31'), null);
    assert.equal(parseCalendarDateParts('2021-02-29'), null);
    assert.equal(parseCalendarDateParts('2020-13-01'), null);
    assert.equal(parseCalendarDateParts('2020-00-10'), null);
    assert.equal(parseCalendarDateParts('1990-1-01'), null);
    assert.equal(parseCalendarDateParts('not-a-date'), null);
    assert.equal(isAtLeast18OnDate('2010-02-31', '2026-08-23'), false);
  });

  it('accepts a real leap-day date', () => {
    assert.deepEqual(parseCalendarDateParts('2008-02-29'), {
      year: 2008,
      month: 2,
      day: 29,
    });
  });

  it('uses the local calendar date rather than UTC midnight', () => {
    const lateLocal = new Date(2026, 7, 23, 23, 30, 0);
    const earlyLocal = new Date(2026, 7, 23, 0, 15, 0);
    assert.equal(getLocalCalendarDate(lateLocal), '2026-08-23');
    assert.equal(getLocalCalendarDate(earlyLocal), '2026-08-23');
  });
});

describe('isAtLeast18OnDate', () => {
  it('blocks the day before the 18th birthday', () => {
    assert.equal(isAtLeast18OnDate('2008-08-24', '2026-08-23'), false);
    assert.equal(calculateCompletedAgeYears('2008-08-24', '2026-08-23'), 17);
  });

  it('allows the actual 18th birthday', () => {
    assert.equal(isAtLeast18OnDate('2008-08-23', '2026-08-23'), true);
    assert.equal(calculateCompletedAgeYears('2008-08-23', '2026-08-23'), 18);
  });

  it('allows the day after the 18th birthday', () => {
    assert.equal(isAtLeast18OnDate('2008-08-22', '2026-08-23'), true);
    assert.equal(calculateCompletedAgeYears('2008-08-22', '2026-08-23'), 18);
  });

  it('handles December 31 / January 1 boundaries', () => {
    assert.equal(isAtLeast18OnDate('2008-01-01', '2025-12-31'), false);
    assert.equal(isAtLeast18OnDate('2008-01-01', '2026-01-01'), true);
    assert.equal(isAtLeast18OnDate('2007-12-31', '2025-12-30'), false);
    assert.equal(isAtLeast18OnDate('2007-12-31', '2025-12-31'), true);
  });

  it('handles leap-day DOB without becoming eligible a day early', () => {
    assert.equal(isAtLeast18OnDate('2008-02-29', '2026-02-28'), false);
    assert.equal(isAtLeast18OnDate('2008-02-29', '2026-03-01'), true);
    assert.equal(isAtLeast18OnDate('2008-02-29', '2028-02-29'), true);
  });

  it('does not use currentYear - birthYear alone', () => {
    assert.equal(2026 - 2008, 18);
    assert.equal(isAtLeast18OnDate('2008-12-31', '2026-01-01'), false);
  });

  it('defaults eligibility as-of to the local calendar date', () => {
    const asOf = getLocalCalendarDate();
    assert.equal(isEligibleAdultDateOfBirth('1990-01-01'), isAtLeast18OnDate('1990-01-01', asOf));
    assert.equal(isEligibleAdultDateOfBirth('2015-01-01'), false);
  });
});
