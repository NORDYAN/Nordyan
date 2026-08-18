import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  assessCoachAskCompleteness,
  collectCoachAskOutputText,
} from './coachAskCompleteness';

describe('assessCoachAskCompleteness', () => {
  it('rejects empty or whitespace answers', () => {
    assert.deepEqual(assessCoachAskCompleteness({ text: '' }), { ok: false, reason: 'empty' });
    assert.deepEqual(assessCoachAskCompleteness({ text: '   ' }), { ok: false, reason: 'empty' });
  });

  it('rejects provider status incomplete even if text looks finished', () => {
    assert.deepEqual(
      assessCoachAskCompleteness({
        text: 'Detta är ditt fokus.',
        providerStatus: 'incomplete',
      }),
      { ok: false, reason: 'provider_incomplete' },
    );
  });

  it('rejects an obvious mid-word fragment', () => {
    assert.deepEqual(
      assessCoachAskCompleteness({
        text: 'Att prioritera fysisk aktivitet är en effektiv stra',
        providerStatus: 'completed',
      }),
      { ok: false, reason: 'mid_word' },
    );
  });

  it('rejects prose without terminal punctuation', () => {
    assert.deepEqual(
      assessCoachAskCompleteness({
        text: 'Detta är ditt fokus eftersom midjemåttet är 90',
        providerStatus: 'completed',
      }),
      { ok: false, reason: 'missing_terminal_punctuation' },
    );
  });

  it('accepts a normal complete sentence', () => {
    assert.deepEqual(
      assessCoachAskCompleteness({
        text: 'Detta är ditt fokus eftersom midjemåttet är den viktigaste förbättringen just nu.',
        providerStatus: 'completed',
      }),
      { ok: true },
    );
  });

  it('accepts a calculated body-fat answer ending with percent', () => {
    assert.deepEqual(
      assessCoachAskCompleteness({
        text: 'Din senaste beräknade kroppsfettprocent är 20,8 %.',
        providerStatus: 'completed',
      }),
      { ok: true },
    );
  });
});

describe('collectCoachAskOutputText', () => {
  it('concatenates message output_text parts when output_text is missing', () => {
    assert.equal(
      collectCoachAskOutputText({
        output: [
          { type: 'reasoning', content: [] },
          {
            type: 'message',
            content: [
              { type: 'output_text', text: 'Första delen. ' },
              { type: 'output_text', text: 'Andra delen.' },
            ],
          },
        ],
      }),
      'Första delen. Andra delen.',
    );
  });
});
