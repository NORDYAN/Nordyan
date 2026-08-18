import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  HOME_GENERAL_ADVICE_BANK,
  HOME_PRIORITY_FORBIDDEN_PROGRESS_PATTERNS,
} from './home-priorities.advice';
import {
  buildHomeDailyPriorities,
  hashHomeDayKey,
  selectGeneralHomeAdvice,
} from './home-priorities.presentation';

describe('HOME_GENERAL_ADVICE_BANK', () => {
  it('contains a focused bank without fabricated progress copy', () => {
    assert.ok(HOME_GENERAL_ADVICE_BANK.length >= 15);
    assert.ok(HOME_GENERAL_ADVICE_BANK.length <= 20);

    for (const item of HOME_GENERAL_ADVICE_BANK) {
      const joined = `${item.title} ${item.subtitle}`;
      for (const pattern of HOME_PRIORITY_FORBIDDEN_PROGRESS_PATTERNS) {
        assert.equal(
          pattern.test(joined),
          false,
          `Forbidden progress pattern ${pattern} matched: ${joined}`,
        );
      }
      assert.equal(/\d+\s*glas/i.test(joined), false);
      assert.equal(/\d+\s*steg/i.test(joined), false);
      assert.equal(/\d+\s*timmar?\s+sömn/i.test(joined), false);
    }
  });

  it('has unique ids', () => {
    const ids = HOME_GENERAL_ADVICE_BANK.map((item) => item.id);
    assert.equal(new Set(ids).size, ids.length);
  });
});

describe('selectGeneralHomeAdvice', () => {
  it('is deterministic for the same day key', () => {
    const a = selectGeneralHomeAdvice('2026-08-12');
    const b = selectGeneralHomeAdvice('2026-08-12');
    assert.deepEqual(a, b);
  });

  it('varies across different day keys', () => {
    const a = selectGeneralHomeAdvice('2026-08-12');
    const b = selectGeneralHomeAdvice('2026-08-13');
    assert.notDeepEqual(a, b);
  });

  it('picks different categories and no duplicate ids', () => {
    for (let day = 1; day <= 28; day += 1) {
      const dayKey = `2026-08-${String(day).padStart(2, '0')}`;
      const [first, second] = selectGeneralHomeAdvice(dayKey);
      assert.notEqual(first.category, second.category);
      assert.notEqual(first.id, second.id);
      assert.ok(HOME_GENERAL_ADVICE_BANK.some((item) => item.id === first.id));
      assert.ok(HOME_GENERAL_ADVICE_BANK.some((item) => item.id === second.id));
    }
  });

  it('uses a stable hash helper', () => {
    assert.equal(hashHomeDayKey('2026-08-12'), hashHomeDayKey('2026-08-12'));
    assert.notEqual(hashHomeDayKey('2026-08-12'), hashHomeDayKey('2026-08-13'));
  });
});

describe('buildHomeDailyPriorities', () => {
  it('keeps authoritative Focus as priority 1 when available', () => {
    const priorities = buildHomeDailyPriorities({
      dayKey: '2026-08-12',
      personal: {
        title: 'Minska midjemåttet',
        subtitle: 'Det är den förändring som har störst potential att förbättra din NORDYAN Score.',
      },
    });

    assert.equal(priorities.length, 3);
    assert.equal(priorities[0]!.kind, 'personal');
    assert.equal(priorities[0]!.id, 'personal_focus');
    assert.equal(priorities[0]!.title, 'Minska midjemåttet');
    assert.equal(priorities[1]!.kind, 'general');
    assert.equal(priorities[2]!.kind, 'general');
    assert.notEqual(priorities[1]!.id, priorities[2]!.id);
  });

  it('uses honest fallback when Focus is unavailable', () => {
    const priorities = buildHomeDailyPriorities({
      dayKey: '2026-08-12',
      personal: null,
    });

    assert.equal(priorities[0]!.id, 'personal_fallback');
    assert.match(priorities[0]!.title, /hälsoplan/i);
    assert.equal(/\d+\s*glas/i.test(priorities.map((p) => p.subtitle).join(' ')), false);
  });

  it('applies local completion acknowledgement only', () => {
    const [generalA] = selectGeneralHomeAdvice('2026-08-12');
    const priorities = buildHomeDailyPriorities({
      dayKey: '2026-08-12',
      personal: { title: 'Öka din aktivitet', subtitle: 'Mer regelbunden rörelse.' },
      completedById: { [generalA.id]: true },
    });

    assert.equal(priorities[0]!.completed, false);
    assert.equal(priorities[1]!.completed, true);
    assert.equal(priorities[2]!.completed, false);
  });

  it('never emits removed fabricated Home priority copy', () => {
    const priorities = buildHomeDailyPriorities({
      dayKey: '2026-08-12',
      personal: null,
    });
    const text = priorities.map((item) => `${item.title} ${item.subtitle}`).join(' | ');
    assert.equal(text.includes('4 glas kvar'), false);
    assert.equal(text.includes('Drick 2L vatten'), false);
    assert.equal(text.includes('Lägg dig före 22:30'), false);
    assert.equal(text.includes('30 min promenad'), false);
  });
});
