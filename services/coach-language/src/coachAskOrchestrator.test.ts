import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { CoachAskRequest } from '../../../shared/coach-language';
import { generateCoachAskAnswer } from './coachAskOrchestrator';
import type { CoachServerConfig } from './config';

process.env.NODE_ENV = 'test';

const request: CoachAskRequest = {
  version: 'coach-ask-v1.5',
  locale: 'sv-SE',
  generatedAt: '2026-08-15T12:00:00.000Z',
  context: {
    focus: {
      type: 'reduce_waist',
      title: 'Minska midjemåttet',
      subtitle: 'Det är den förändring som har störst potential att förbättra din NORDYAN Score.',
    },
    plan: {
      recommendationId: 'waist_walk_after_dinner_v1',
      title: 'Promenad efter middagen',
      description: 'Promenera 30 minuter efter middagen fyra dagar den här veckan.',
      durationMinutes: 30,
      frequencyPerWeek: 4,
    },
    availability: {
      healthScoreAvailable: false,
      measurementHistoryComparable: false,
      sleepDataAvailable: false,
      deviceActivityAvailable: false,
      integratedHealthAvailable: false,
      stepsDataAvailable: false,
    },
    weeklyCheckIn: null,
    initialLifestyle: null,
    ageBand: null,
    sex: null,
    bodyFatReference: {
      status: 'unavailable',
      unavailableReason: 'missing_body_fat_percent',
    },
  },
  question: 'Varför är detta mitt fokus?',
};

const config = {
  openaiApiKey: 'test-key',
  openaiCoachModel: 'gpt-test',
  openaiTimeoutMs: 1000,
} as CoachServerConfig;

describe('generateCoachAskAnswer completeness fallback', () => {
  it('uses the existing soft Ask error when both generations are incomplete', async () => {
    let calls = 0;
    const result = await generateCoachAskAnswer(request, {
      config,
      openAiClient: {
        responses: {
          create: async () => {
            calls += 1;
            return {
              status: 'completed',
              output_text: 'Att prioritera fysisk aktivitet är en effektiv stra',
            };
          },
        },
      },
    });

    assert.equal(calls, 2);
    assert.equal(result.answer, '');
    assert.equal(result.meta.source, 'unavailable');
  });
});
