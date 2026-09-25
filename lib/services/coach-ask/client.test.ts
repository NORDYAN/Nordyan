import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import type { AppLocale } from '@/lib/i18n';
import {
  COACH_ASK_PAYLOAD_VERSION_V16,
  COACH_ASK_PAYLOAD_VERSION_V17,
  mapAppLocaleToCoachAskLocale,
  type CoachAskRequestV16,
  type CoachAskRequestV17,
} from '@/shared/coach-language';

import { requestCoachAsk } from './client';

const previousApiUrl = process.env.EXPO_PUBLIC_COACH_LANGUAGE_API_URL;

afterEach(() => {
  if (previousApiUrl === undefined) {
    delete process.env.EXPO_PUBLIC_COACH_LANGUAGE_API_URL;
  } else {
    process.env.EXPO_PUBLIC_COACH_LANGUAGE_API_URL = previousApiUrl;
  }
});

function requestFor(locale: AppLocale): CoachAskRequestV16 {
  return {
    version: COACH_ASK_PAYLOAD_VERSION_V16,
    locale: mapAppLocaleToCoachAskLocale(locale),
    generatedAt: '2026-08-16T12:00:00.000Z',
    context: {
      focus: {
        type: 'reduce_waist',
        title: 'Minska midjemåttet',
        subtitle: 'Fokusera på midjemåttet.',
      },
      plan: {
        recommendationId: 'waist_walk_after_dinner_v1',
        title: 'Promenad efter middagen',
        description: 'Promenera efter middagen.',
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
    question:
      locale === 'nb'
        ? 'Hvorfor er dette fokuset mitt?'
        : 'Varför är detta mitt fokus?',
  };
}

describe('live Coach Ask locale routing', () => {
  for (const [appLocale, expectedLocale] of [
    ['sv', 'sv-SE'],
    ['nb', 'nb-NO'],
  ] as const) {
    it(`serializes ${appLocale} UI as v1.6 ${expectedLocale} without adapter override`, async () => {
      process.env.EXPO_PUBLIC_COACH_LANGUAGE_API_URL = 'https://coach-language.example';
      let serializedBody = '';

      const result = await requestCoachAsk({
        accessToken: 'token',
        request: requestFor(appLocale),
        fetchImpl: async (_url, init) => {
          serializedBody = String(init?.body ?? '');
          return new Response(
            JSON.stringify({
              answer: 'Komplett svar.',
              meta: {
                source: 'ai',
                requestId: 'coach_test',
                latencyMs: 1,
                promptVersion: 'nordyan-coach-ask-v1.6',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        },
      });

      assert.equal(result.ok, true);
      const body = JSON.parse(serializedBody) as Record<string, unknown>;
      assert.equal(body.version, 'coach-ask-v1.6');
      assert.equal(body.locale, expectedLocale);
    });
  }

  it('serializes a current v1.7 payload without rewriting locale or version', async () => {
    process.env.EXPO_PUBLIC_COACH_LANGUAGE_API_URL = 'https://coach-language.example';
    let serializedBody = '';
    const request: CoachAskRequestV17 = {
      ...requestFor('sv'),
      version: COACH_ASK_PAYLOAD_VERSION_V17,
    };

    const result = await requestCoachAsk({
      accessToken: 'token',
      request,
      fetchImpl: async (_url, init) => {
        serializedBody = String(init?.body ?? '');
        return new Response(
          JSON.stringify({
            answer: 'Komplett svar.',
            meta: {
              source: 'ai',
              requestId: 'coach_test',
              latencyMs: 1,
              promptVersion: 'nordyan-coach-ask-v1.7',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      },
    });

    assert.equal(result.ok, true);
    const body = JSON.parse(serializedBody) as Record<string, unknown>;
    assert.equal(body.version, 'coach-ask-v1.7');
    assert.equal(body.locale, 'sv-SE');
  });

  it('passes I18nProvider locale explicitly through the live hook and service', () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
    const hook = readFileSync(path.join(root, 'lib/hooks/coach/useCoachQuestion.ts'), 'utf8');
    const service = readFileSync(
      path.join(root, 'lib/services/coach-context/coach-context.service.ts'),
      'utf8',
    );
    const client = readFileSync(path.join(root, 'lib/services/coach-ask/client.ts'), 'utf8');

    assert.match(hook, /const \{ locale, isReady: isI18nReady \} = useI18n\(\)/);
    assert.match(hook, /if \(!isI18nReady\)/);
    assert.match(hook, /composeAskRequest\(userId, question, locale\)/);
    assert.match(service, /composeWithDeps\(userId, question, defaultDeps, locale\)/);
    assert.match(client, /body: JSON\.stringify\(options\.request\)/);
    assert.doesNotMatch(hook, /sv-SE/);
    assert.doesNotMatch(service, /sv-SE/);
    assert.doesNotMatch(client, /sv-SE/);
  });
});
