import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CoachRequestValidationError } from './requestValidation';
import { validateCoachAskRequest } from './askRequestValidation';
import { NORDYAN_COACH_ASK_V11_SYSTEM_INSTRUCTIONS } from '../instructions/nordyan-coach-ask-v1.1';

const validBody = {
  version: 'coach-ask-v1.1',
  locale: 'sv-SE',
  generatedAt: '2026-08-12T12:00:00.000Z',
  context: {
    healthState: {
      overallScore: 74,
      scoreBandLabel: 'Bra hälsonivå',
      scoreChange: { status: 'ready', change: 6, direction: 'up' },
      weight: { status: 'ready', currentKg: 80, changeKg: -2, direction: 'down' },
      waist: { status: 'ready', currentCm: 90, changeCm: -2, direction: 'down' },
      healthScoreActivity: { status: 'ready', current: 58, change: 8, direction: 'up' },
    },
    development: {
      trend: 'improving',
      historyStatus: 'comparable',
    },
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
      healthScoreAvailable: true,
      measurementHistoryComparable: true,
      sleepDataAvailable: false,
      deviceActivityAvailable: false,
      integratedHealthAvailable: false,
      stepsDataAvailable: false,
    },
  },
  question: 'Hur går det för mig?',
};

describe('validateCoachAskRequest v1.1', () => {
  it('accepts a valid minimum-disclosure v1.1 request', () => {
    const request = validateCoachAskRequest(validBody);
    assert.equal(request.version, 'coach-ask-v1.1');
    assert.equal(request.context.healthState?.overallScore, 74);
    assert.equal(request.context.availability.stepsDataAvailable, false);
  });

  it('accepts plan-only context without healthState when availability says unavailable', () => {
    const body = {
      ...validBody,
      context: {
        focus: validBody.context.focus,
        plan: validBody.context.plan,
        availability: {
          ...validBody.context.availability,
          healthScoreAvailable: false,
          measurementHistoryComparable: false,
        },
      },
    };
    const request = validateCoachAskRequest(body);
    assert.equal(request.context.healthState, undefined);
  });

  it('rejects empty question', () => {
    assert.throws(
      () => validateCoachAskRequest({ ...validBody, question: '   ' }),
      CoachRequestValidationError,
    );
  });

  it('rejects oversized question', () => {
    assert.throws(
      () => validateCoachAskRequest({ ...validBody, question: 'a'.repeat(281) }),
      CoachRequestValidationError,
    );
  });

  it('rejects old payload version', () => {
    assert.throws(
      () => validateCoachAskRequest({ ...validBody, version: 'coach-ask-v1' }),
      CoachRequestValidationError,
    );
  });

  it('rejects v1.1 payloads that include weeklyCheckIn', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validBody,
          context: {
            ...validBody.context,
            weeklyCheckIn: null,
          },
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects v1.1 payloads that include initialLifestyle', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validBody,
          context: {
            ...validBody.context,
            initialLifestyle: null,
          },
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects invalid focus type', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validBody,
          context: {
            ...validBody.context,
            focus: { ...validBody.context.focus, type: 'not_a_focus' },
          },
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects invalid recommendation id', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validBody,
          context: {
            ...validBody.context,
            plan: { ...validBody.context.plan, recommendationId: 'unknown_v1' },
          },
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects arbitrary top-level healthScore and instructions injection', () => {
    assert.throws(
      () => validateCoachAskRequest({ ...validBody, healthScore: 74 }),
      CoachRequestValidationError,
    );
    assert.throws(
      () => validateCoachAskRequest({ ...validBody, instructions: { role: 'x' } }),
      CoachRequestValidationError,
    );
  });

  it('rejects PII and raw history fields', () => {
    assert.throws(
      () => validateCoachAskRequest({ ...validBody, email: 'a@b.c' }),
      CoachRequestValidationError,
    );
    assert.throws(
      () => validateCoachAskRequest({ ...validBody, userId: 'u1' }),
      CoachRequestValidationError,
    );
    assert.throws(
      () => validateCoachAskRequest({ ...validBody, measurementHistory: [] }),
      CoachRequestValidationError,
    );
  });

  it('rejects unknown nested fields and raw driver scores in healthState', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validBody,
          context: {
            ...validBody.context,
            plan: { ...validBody.context.plan, secret: true },
          },
        }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validBody,
          context: {
            ...validBody.context,
            healthState: {
              ...validBody.context.healthState,
              bmiScore: 70,
            },
          },
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects legacy limitations and true sleep/steps availability', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validBody,
          context: {
            ...validBody.context,
            limitations: { sleepDataAvailable: false, deviceActivityAvailable: false },
          },
        }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validBody,
          context: {
            ...validBody.context,
            availability: {
              ...validBody.context.availability,
              sleepDataAvailable: true,
            },
          },
        }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validBody,
          context: {
            ...validBody.context,
            availability: {
              ...validBody.context.availability,
              stepsDataAvailable: true,
            },
          },
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects invalid healthScoreActivity shape', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validBody,
          context: {
            ...validBody.context,
            healthState: {
              ...validBody.context.healthState,
              healthScoreActivity: {
                status: 'ready',
                steps: 8000,
                current: 58,
                change: 8,
                direction: 'up',
              },
            },
          },
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects mismatched healthState/development pair', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validBody,
          context: {
            ...validBody.context,
            development: undefined,
          },
        }),
      CoachRequestValidationError,
    );
  });
});

describe('nordyan-coach-ask-v1.1 instructions', () => {
  it('covers authority boundaries deterministically', () => {
    const text = NORDYAN_COACH_ASK_V11_SYSTEM_INSTRUCTIONS;
    assert.match(text, /inte beräkna, räkna om, uppskatta eller härleda en ny Health Score/i);
    assert.match(text, /inte välja ett nytt primärt fokus/i);
    assert.match(text, /inte skapa en ny auktoritativ NORDYAN-plan/i);
    assert.match(text, /INTE steg/i);
    assert.match(text, /sömn/i);
    assert.match(text, /Diagnostisera inte/i);
    assert.match(text, /healthScoreActivity/i);
    assert.match(text, /Svara på svenska/i);
  });
});

const validWeeklyCheckIn = {
  source: 'current_week_self_report',
  sleepQuality: { value: 2, polarity: 'higher_better', meaning: 'poor' },
  energy: { value: 2, polarity: 'higher_better', meaning: 'low' },
  stress: { value: 5, polarity: 'higher_worse', meaning: 'very_high' },
  trainingFrequency: {
    value: 'none',
    meaning: 'no_sessions',
    kind: 'self_reported_session_count',
  },
  everydayActivity: { value: 2, polarity: 'higher_better', meaning: 'low' },
  eatingQuality: { value: 3, polarity: 'higher_better', meaning: 'okay' },
  alcoholConsumption: {
    value: '1_3',
    meaning: 'one_to_three_drinks',
    kind: 'neutral_self_reported_bucket',
  },
  planAdherence: { value: 2, polarity: 'higher_better', meaning: 'poor' },
};

const validV12Body = {
  ...validBody,
  version: 'coach-ask-v1.2',
  context: {
    ...validBody.context,
    weeklyCheckIn: validWeeklyCheckIn,
  },
};

describe('validateCoachAskRequest v1.2', () => {
  it('accepts a valid v1.2 request with all eight Weekly Check-in fields', () => {
    const request = validateCoachAskRequest(validV12Body);
    assert.equal(request.version, 'coach-ask-v1.2');
    if (request.version !== 'coach-ask-v1.2') {
      return;
    }
    assert.deepEqual(request.context.weeklyCheckIn?.stress, {
      value: 5,
      polarity: 'higher_worse',
      meaning: 'very_high',
    });
    assert.equal(request.context.availability.sleepDataAvailable, false);
  });

  it('accepts weeklyCheckIn null', () => {
    const request = validateCoachAskRequest({
      ...validV12Body,
      context: { ...validV12Body.context, weeklyCheckIn: null },
    });
    if (request.version !== 'coach-ask-v1.2') {
      return;
    }
    assert.equal(request.context.weeklyCheckIn, null);
  });

  it('rejects omitted weeklyCheckIn key', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV12Body,
          context: validBody.context,
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects inverted stress polarity', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV12Body,
          context: {
            ...validV12Body.context,
            weeklyCheckIn: {
              ...validWeeklyCheckIn,
              stress: { value: 5, polarity: 'higher_better', meaning: 'very_high' },
            },
          },
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects stress meaning that does not match value 5', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV12Body,
          context: {
            ...validV12Body.context,
            weeklyCheckIn: {
              ...validWeeklyCheckIn,
              stress: { value: 5, polarity: 'higher_worse', meaning: 'very_good' },
            },
          },
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects partial Weekly Check-in objects', () => {
    const { energy: _removed, ...partial } = validWeeklyCheckIn;
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV12Body,
          context: {
            ...validV12Body.context,
            weeklyCheckIn: partial,
          },
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects unknown Weekly Check-in fields and metadata', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV12Body,
          context: {
            ...validV12Body.context,
            weeklyCheckIn: {
              ...validWeeklyCheckIn,
              weekStartDate: '2026-08-10',
            },
          },
        }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV12Body,
          context: {
            ...validV12Body.context,
            weeklyCheckIn: {
              ...validWeeklyCheckIn,
              notes: 'sov dåligt',
            },
          },
        }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV12Body,
          context: {
            ...validV12Body.context,
            weeklyCheckIn: {
              ...validWeeklyCheckIn,
              lessHealthyFoodFrequency: 'daily',
            },
          },
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects Initial Lifestyle leakage at top level', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV12Body,
          initialLifestyle: { sleepQuality: 3 },
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects context.initialLifestyle on v1.2', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV12Body,
          context: {
            ...validV12Body.context,
            initialLifestyle: null,
          },
        }),
      CoachRequestValidationError,
    );
  });
});

const validInitialLifestyle = {
  source: 'onboarding_baseline_self_report',
  sleepQuality: { value: 4, polarity: 'higher_better', meaning: 'good' },
  energy: { value: 3, polarity: 'higher_better', meaning: 'normal' },
  stress: { value: 5, polarity: 'higher_worse', meaning: 'very_high' },
  lessHealthyFoodFrequency: {
    value: 'two_three',
    meaning: 'two_to_three_times_per_typical_week',
    kind: 'neutral_self_reported_frequency',
  },
  everydayActivity: { value: 2, polarity: 'higher_better', meaning: 'low' },
  eatingQuality: { value: 4, polarity: 'higher_better', meaning: 'good' },
  alcoholConsumption: {
    value: '15_plus',
    meaning: 'fifteen_or_more_drinks',
    kind: 'neutral_self_reported_bucket',
  },
};

const validV13Body = {
  ...validV12Body,
  version: 'coach-ask-v1.3',
  context: {
    ...validV12Body.context,
    weeklyCheckIn: validWeeklyCheckIn,
    initialLifestyle: validInitialLifestyle,
  },
};

describe('validateCoachAskRequest v1.3', () => {
  it('accepts a valid v1.3 request with both sources', () => {
    const request = validateCoachAskRequest(validV13Body);
    assert.equal(request.version, 'coach-ask-v1.3');
    if (request.version !== 'coach-ask-v1.3') {
      return;
    }
    assert.equal(request.context.weeklyCheckIn?.source, 'current_week_self_report');
    assert.deepEqual(request.context.initialLifestyle?.stress, {
      value: 5,
      polarity: 'higher_worse',
      meaning: 'very_high',
    });
    assert.deepEqual(request.context.initialLifestyle?.alcoholConsumption, {
      value: '15_plus',
      meaning: 'fifteen_or_more_drinks',
      kind: 'neutral_self_reported_bucket',
    });
    assert.deepEqual(request.context.initialLifestyle?.lessHealthyFoodFrequency, {
      value: 'two_three',
      meaning: 'two_to_three_times_per_typical_week',
      kind: 'neutral_self_reported_frequency',
    });
  });

  it('accepts both sources as null', () => {
    const request = validateCoachAskRequest({
      ...validV13Body,
      context: {
        ...validV13Body.context,
        weeklyCheckIn: null,
        initialLifestyle: null,
      },
    });
    if (request.version !== 'coach-ask-v1.3') {
      return;
    }
    assert.equal(request.context.weeklyCheckIn, null);
    assert.equal(request.context.initialLifestyle, null);
  });

  it('accepts baseline 15_plus with no current Weekly alcohol context', () => {
    const request = validateCoachAskRequest({
      ...validV13Body,
      question: 'Dricker jag för mycket?',
      context: {
        ...validV13Body.context,
        weeklyCheckIn: null,
        initialLifestyle: validInitialLifestyle,
      },
    });
    if (request.version !== 'coach-ask-v1.3') {
      return;
    }
    assert.equal(request.context.weeklyCheckIn, null);
    assert.equal(request.context.initialLifestyle?.alcoholConsumption.value, '15_plus');
  });

  it('accepts legacy null nutrition while keeping other baseline fields', () => {
    const request = validateCoachAskRequest({
      ...validV13Body,
      context: {
        ...validV13Body.context,
        weeklyCheckIn: null,
        initialLifestyle: {
          ...validInitialLifestyle,
          lessHealthyFoodFrequency: null,
        },
      },
    });
    if (request.version !== 'coach-ask-v1.3') {
      return;
    }
    assert.equal(request.context.initialLifestyle?.lessHealthyFoodFrequency, null);
    assert.equal(request.context.initialLifestyle?.alcoholConsumption.value, '15_plus');
    assert.equal(request.context.initialLifestyle?.sleepQuality.value, 4);
  });

  it('locks every nutrition-frequency meaning', () => {
    const cases = [
      ['never', 'never'],
      ['once', 'once_per_typical_week'],
      ['two_three', 'two_to_three_times_per_typical_week'],
      ['four_six', 'four_to_six_times_per_typical_week'],
      ['daily', 'daily'],
    ] as const;
    for (const [value, meaning] of cases) {
      const request = validateCoachAskRequest({
        ...validV13Body,
        context: {
          ...validV13Body.context,
          initialLifestyle: {
            ...validInitialLifestyle,
            lessHealthyFoodFrequency: {
              value,
              meaning,
              kind: 'neutral_self_reported_frequency',
            },
          },
        },
      });
      if (request.version !== 'coach-ask-v1.3') {
        return;
      }
      assert.deepEqual(request.context.initialLifestyle?.lessHealthyFoodFrequency, {
        value,
        meaning,
        kind: 'neutral_self_reported_frequency',
      });
    }
  });

  it('rejects omitted initialLifestyle key', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV13Body,
          context: {
            ...validBody.context,
            weeklyCheckIn: null,
          },
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects unknown, partial, and wrong-semantic Initial Lifestyle fields', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV13Body,
          context: {
            ...validV13Body.context,
            initialLifestyle: {
              ...validInitialLifestyle,
              createdAt: '2026-08-01T09:00:00.000Z',
            },
          },
        }),
      CoachRequestValidationError,
    );
    const { energy: _removed, ...partial } = validInitialLifestyle;
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV13Body,
          context: {
            ...validV13Body.context,
            initialLifestyle: partial,
          },
        }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV13Body,
          context: {
            ...validV13Body.context,
            initialLifestyle: {
              ...validInitialLifestyle,
              stress: { value: 5, polarity: 'higher_better', meaning: 'very_high' },
            },
          },
        }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV13Body,
          context: {
            ...validV13Body.context,
            initialLifestyle: {
              ...validInitialLifestyle,
              lessHealthyFoodFrequency: {
                value: 'daily',
                meaning: 'daily',
                kind: 'neutral_self_reported_frequency',
                polarity: 'higher_worse',
              },
            },
          },
        }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV13Body,
          context: {
            ...validV13Body.context,
            initialLifestyle: {
              ...validInitialLifestyle,
              trainingFrequency: {
                value: 'none',
                meaning: 'no_sessions',
                kind: 'self_reported_session_count',
              },
            },
          },
        }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV13Body,
          context: {
            ...validV13Body.context,
            initialLifestyle: {
              ...validInitialLifestyle,
              source: 'current_week_self_report',
            },
          },
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects mismatched nutrition meaning and Weekly nutrition leakage', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV13Body,
          context: {
            ...validV13Body.context,
            initialLifestyle: {
              ...validInitialLifestyle,
              lessHealthyFoodFrequency: {
                value: 'daily',
                meaning: 'never',
                kind: 'neutral_self_reported_frequency',
              },
            },
          },
        }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV13Body,
          context: {
            ...validV13Body.context,
            weeklyCheckIn: {
              ...validWeeklyCheckIn,
              lessHealthyFoodFrequency: 'daily',
            },
          },
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects top-level initialLifestyle and snake_case initial_lifestyle on v1.3', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV13Body,
          initialLifestyle: validInitialLifestyle,
        }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV13Body,
          initial_lifestyle: validInitialLifestyle,
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects v1.4-only fields on v1.3', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV13Body,
          context: {
            ...validV13Body.context,
            ageBand: '40_49',
            sex: 'male',
          },
        }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV13Body,
          context: {
            ...validV13Body.context,
            healthState: {
              ...validV13Body.context.healthState,
              bodyComposition: {
                status: 'ready',
                bodyFatPercent: 20.1,
                estimationKind: 'calculated_from_latest_snapshot',
              },
            },
          },
        }),
      CoachRequestValidationError,
    );
  });
});

const validBodyComposition = {
  status: 'ready' as const,
  bodyFatPercent: 20.1,
  estimationKind: 'calculated_from_latest_snapshot' as const,
};

const validV14Body = {
  ...validV13Body,
  version: 'coach-ask-v1.4',
  context: {
    ...validV13Body.context,
    healthState: {
      ...validV13Body.context.healthState,
      bodyComposition: validBodyComposition,
    },
    ageBand: '40_49',
    sex: 'male',
  },
};

describe('validateCoachAskRequest v1.4', () => {
  it('accepts a valid v1.4 request', () => {
    const request = validateCoachAskRequest(validV14Body);
    assert.equal(request.version, 'coach-ask-v1.4');
    if (request.version !== 'coach-ask-v1.4') {
      return;
    }
    assert.deepEqual(request.context.healthState?.bodyComposition, validBodyComposition);
    assert.equal(request.context.ageBand, '40_49');
    assert.equal(request.context.sex, 'male');
  });

  it('accepts unavailable body composition with null ageBand and sex', () => {
    const request = validateCoachAskRequest({
      ...validV14Body,
      context: {
        ...validV14Body.context,
        healthState: {
          ...validV14Body.context.healthState,
          bodyComposition: {
            status: 'unavailable',
            bodyFatPercent: null,
            estimationKind: 'unavailable',
          },
        },
        ageBand: null,
        sex: null,
      },
    });
    if (request.version !== 'coach-ask-v1.4') {
      return;
    }
    assert.equal(request.context.healthState?.bodyComposition.status, 'unavailable');
    assert.equal(request.context.healthState?.bodyComposition.bodyFatPercent, null);
    assert.equal(request.context.ageBand, null);
    assert.equal(request.context.sex, null);
  });

  it('rejects omitted ageBand or sex keys', () => {
    const { ageBand: _age, ...withoutAge } = validV14Body.context;
    assert.throws(
      () => validateCoachAskRequest({ ...validV14Body, context: withoutAge }),
      CoachRequestValidationError,
    );
    const { sex: _sex, ...withoutSex } = validV14Body.context;
    assert.throws(
      () => validateCoachAskRequest({ ...validV14Body, context: withoutSex }),
      CoachRequestValidationError,
    );
  });

  it('rejects omitted bodyComposition on healthState', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV14Body,
          context: {
            ...validV14Body.context,
            healthState: validV13Body.context.healthState,
          },
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects DOB, exact age, neck, height, hip, and internal body-fat fields', () => {
    assert.throws(
      () => validateCoachAskRequest({ ...validV14Body, dateOfBirth: '1980-01-01' }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV14Body,
          context: { ...validV14Body.context, ageYears: 44 },
        }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV14Body,
          context: {
            ...validV14Body.context,
            healthState: {
              ...validV14Body.context.healthState,
              neckCm: 38,
            },
          },
        }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV14Body,
          context: {
            ...validV14Body.context,
            healthState: {
              ...validV14Body.context.healthState,
              heightCm: 180,
            },
          },
        }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV14Body,
          context: {
            ...validV14Body.context,
            healthState: {
              ...validV14Body.context.healthState,
              hipCm: 96,
            },
          },
        }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV14Body,
          context: {
            ...validV14Body.context,
            healthState: {
              ...validV14Body.context.healthState,
              bodyFatScore: 65,
            },
          },
        }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV14Body,
          context: {
            ...validV14Body.context,
            healthState: {
              ...validV14Body.context.healthState,
              bodyFatCategory: 'average',
            },
          },
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects mismatched ready/unavailable bodyComposition pairing', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV14Body,
          context: {
            ...validV14Body.context,
            healthState: {
              ...validV14Body.context.healthState,
              bodyComposition: {
                status: 'ready',
                bodyFatPercent: null,
                estimationKind: 'calculated_from_latest_snapshot',
              },
            },
          },
        }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV14Body,
          context: {
            ...validV14Body.context,
            healthState: {
              ...validV14Body.context.healthState,
              bodyComposition: {
                status: 'unavailable',
                bodyFatPercent: 20.1,
                estimationKind: 'unavailable',
              },
            },
          },
        }),
      CoachRequestValidationError,
    );
  });
});

describe('validateCoachAskRequest v1.1 and v1.2 reject v1.4 fields', () => {
  it('rejects ageBand, sex, and bodyComposition on v1.1', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validBody,
          context: { ...validBody.context, ageBand: '40_49' },
        }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validBody,
          context: { ...validBody.context, sex: 'male' },
        }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validBody,
          context: {
            ...validBody.context,
            healthState: {
              ...validBody.context.healthState,
              bodyComposition: validBodyComposition,
            },
          },
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects ageBand on v1.2', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV12Body,
          context: { ...validV12Body.context, ageBand: '30_39', sex: 'female' },
        }),
      CoachRequestValidationError,
    );
  });
});

const validBodyFatReference = {
  status: 'ready' as const,
  source: 'acsm_getp_10_11_cooper_institute' as const,
  sex: 'male' as const,
  referenceAgeGroup: '50_59' as const,
  bodyFatPercent: 20.83,
  referenceMedianPercent: 23.2,
  comparisonToReferenceMedian: 'below' as const,
  referencePositionBand: 'below_median' as const,
};

const validV15Body = {
  ...validV14Body,
  version: 'coach-ask-v1.5',
  context: {
    ...validV14Body.context,
    ageBand: '50_59',
    bodyFatReference: validBodyFatReference,
  },
};

describe('validateCoachAskRequest v1.5', () => {
  it('accepts a valid v1.5 request', () => {
    const request = validateCoachAskRequest(validV15Body);
    assert.equal(request.version, 'coach-ask-v1.5');
    if (request.version !== 'coach-ask-v1.5') {
      return;
    }
    assert.deepEqual(request.context.bodyFatReference, validBodyFatReference);
    assert.equal(JSON.stringify(request).includes('dateOfBirth'), false);
    assert.equal(JSON.stringify(request).includes('"percentile"'), false);
    assert.equal(JSON.stringify(request).includes('acsmTable'), false);
  });

  it('accepts all unavailable reasons', () => {
    for (const unavailableReason of [
      'missing_body_fat_percent',
      'missing_sex',
      'missing_age_band',
      'unsupported_sex',
    ] as const) {
      const request = validateCoachAskRequest({
        ...validV15Body,
        context: {
          ...validV15Body.context,
          bodyFatReference: { status: 'unavailable', unavailableReason },
        },
      });
      if (request.version !== 'coach-ask-v1.5') {
        return;
      }
      assert.equal(request.context.bodyFatReference.status, 'unavailable');
    }
  });

  it('rejects omitted bodyFatReference and raw table fields', () => {
    const { bodyFatReference: _ref, ...withoutRef } = validV15Body.context;
    assert.throws(
      () => validateCoachAskRequest({ ...validV15Body, context: withoutRef }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV15Body,
          context: {
            ...validV15Body.context,
            bodyFatReference: {
              ...validBodyFatReference,
              percentile: 70,
            },
          },
        }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV15Body,
          context: {
            ...validV15Body.context,
            acsmTable: { male: {} },
          },
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects bodyFatReference on v1.4', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV14Body,
          context: {
            ...validV14Body.context,
            bodyFatReference: validBodyFatReference,
          },
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects bodyFatReference on v1.1', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validBody,
          context: {
            ...validBody.context,
            bodyFatReference: validBodyFatReference,
          },
        }),
      CoachRequestValidationError,
    );
  });

  it('rejects v1.6-only nb-NO locale', () => {
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV15Body,
          locale: 'nb-NO',
        }),
      CoachRequestValidationError,
    );
  });
});

const validV16Body = {
  ...validV15Body,
  version: 'coach-ask-v1.6',
};

describe('validateCoachAskRequest v1.6', () => {
  it('accepts sv-SE and nb-NO with the same v1.5 health context', () => {
    const swedish = validateCoachAskRequest(validV16Body);
    assert.equal(swedish.version, 'coach-ask-v1.6');
    if (swedish.version !== 'coach-ask-v1.6') {
      return;
    }
    assert.equal(swedish.locale, 'sv-SE');
    assert.deepEqual(swedish.context, validateCoachAskRequest(validV15Body).context);

    const norwegian = validateCoachAskRequest({
      ...validV16Body,
      locale: 'nb-NO',
      question: 'Hvorfor er dette fokuset mitt?',
    });
    assert.equal(norwegian.version, 'coach-ask-v1.6');
    if (norwegian.version !== 'coach-ask-v1.6') {
      return;
    }
    assert.equal(norwegian.locale, 'nb-NO');
    assert.deepEqual(norwegian.context, swedish.context);
    assert.equal(JSON.stringify(norwegian).includes('dateOfBirth'), false);
  });

  it('rejects unsupported locales and extra health fields', () => {
    assert.throws(
      () => validateCoachAskRequest({ ...validV16Body, locale: 'en-US' }),
      CoachRequestValidationError,
    );
    assert.throws(
      () => validateCoachAskRequest({ ...validV16Body, locale: 'da-DK' }),
      CoachRequestValidationError,
    );
    assert.throws(
      () =>
        validateCoachAskRequest({
          ...validV16Body,
          context: {
            ...validV16Body.context,
            extraNote: 'nope',
          },
        }),
      CoachRequestValidationError,
    );
  });

  it('still accepts frozen v1.1–v1.5 Swedish payloads', () => {
    assert.equal(validateCoachAskRequest(validBody).version, 'coach-ask-v1.1');
    assert.equal(validateCoachAskRequest(validV12Body).version, 'coach-ask-v1.2');
    assert.equal(validateCoachAskRequest(validV13Body).version, 'coach-ask-v1.3');
    assert.equal(validateCoachAskRequest(validV14Body).version, 'coach-ask-v1.4');
    assert.equal(validateCoachAskRequest(validV15Body).version, 'coach-ask-v1.5');
    assert.equal(validateCoachAskRequest(validV15Body).locale, 'sv-SE');
  });
});

