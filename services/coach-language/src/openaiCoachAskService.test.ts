import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { CoachAskRequest } from '../../../shared/coach-language';
import { NORDYAN_COACH_ASK_V11_SYSTEM_INSTRUCTIONS } from './instructions/nordyan-coach-ask-v1.1';
import { NORDYAN_COACH_ASK_V12_SYSTEM_INSTRUCTIONS } from './instructions/nordyan-coach-ask-v1.2';
import { NORDYAN_COACH_ASK_V13_SYSTEM_INSTRUCTIONS } from './instructions/nordyan-coach-ask-v1.3';
import { NORDYAN_COACH_ASK_V14_SYSTEM_INSTRUCTIONS } from './instructions/nordyan-coach-ask-v1.4';
import { NORDYAN_COACH_ASK_V15_SYSTEM_INSTRUCTIONS } from './instructions/nordyan-coach-ask-v1.5';
import {
  buildNordyanCoachAskV16SystemInstructions,
  NORDYAN_COACH_ASK_V16_SYSTEM_INSTRUCTIONS,
} from './instructions/nordyan-coach-ask-v1.6';
import {
  buildAskUserPrompt,
  generateOpenAiCoachAskAnswer,
  getCoachAskSystemInstructions,
  readCompleteCoachAskOutput,
  CoachAskIncompleteError,
  COACH_ASK_MAX_GENERATION_ATTEMPTS,
  COACH_ASK_MAX_OUTPUT_TOKENS,
} from './openaiCoachAskService';

const focus = {
  type: 'reduce_waist' as const,
  title: 'Minska midjemåttet',
  subtitle: 'Det är den förändring som har störst potential att förbättra din NORDYAN Score.',
};

const plan = {
  recommendationId: 'waist_walk_after_dinner_v1',
  title: 'Promenad efter middagen',
  description: 'Promenera 30 minuter efter middagen fyra dagar den här veckan.',
  durationMinutes: 30,
  frequencyPerWeek: 4,
};

const availability = {
  healthScoreAvailable: false,
  measurementHistoryComparable: false,
  sleepDataAvailable: false as const,
  deviceActivityAvailable: false as const,
  integratedHealthAvailable: false as const,
  stepsDataAvailable: false as const,
};

const v11Request: CoachAskRequest = {
  version: 'coach-ask-v1.1',
  locale: 'sv-SE',
  generatedAt: '2026-08-12T12:00:00.000Z',
  context: { focus, plan, availability },
  question: 'Varför är detta mitt fokus?',
};

const v12AbsentRequest: CoachAskRequest = {
  version: 'coach-ask-v1.2',
  locale: 'sv-SE',
  generatedAt: '2026-08-12T12:00:00.000Z',
  context: { focus, plan, availability, weeklyCheckIn: null },
  question: 'Hur har min vecka varit?',
};

const v13BaselineAlcoholRequest: CoachAskRequest = {
  version: 'coach-ask-v1.3',
  locale: 'sv-SE',
  generatedAt: '2026-08-12T12:00:00.000Z',
  context: {
    focus,
    plan,
    availability,
    weeklyCheckIn: null,
    initialLifestyle: {
      source: 'onboarding_baseline_self_report',
      sleepQuality: { value: 4, polarity: 'higher_better', meaning: 'good' },
      energy: { value: 3, polarity: 'higher_better', meaning: 'normal' },
      stress: { value: 2, polarity: 'higher_worse', meaning: 'low' },
      lessHealthyFoodFrequency: {
        value: 'once',
        meaning: 'once_per_typical_week',
        kind: 'neutral_self_reported_frequency',
      },
      everydayActivity: { value: 3, polarity: 'higher_better', meaning: 'moderate' },
      eatingQuality: { value: 4, polarity: 'higher_better', meaning: 'good' },
      alcoholConsumption: {
        value: '15_plus',
        meaning: 'fifteen_or_more_drinks',
        kind: 'neutral_self_reported_bucket',
      },
    },
  },
  question: 'Dricker jag för mycket?',
};

const v14BodyFatRequest: CoachAskRequest = {
  version: 'coach-ask-v1.4',
  locale: 'sv-SE',
  generatedAt: '2026-08-15T12:00:00.000Z',
  context: {
    focus,
    plan,
    availability,
    weeklyCheckIn: null,
    initialLifestyle: null,
    healthState: {
      overallScore: 74,
      scoreBandLabel: 'Bra hälsonivå',
      scoreChange: { status: 'insufficient_history' },
      weight: { status: 'insufficient_history', currentKg: 80 },
      waist: { status: 'insufficient_history', currentCm: 90 },
      healthScoreActivity: { status: 'insufficient_history', current: 58 },
      bodyComposition: {
        status: 'ready',
        bodyFatPercent: 20.1,
        estimationKind: 'calculated_from_latest_snapshot',
      },
    },
    development: { trend: 'insufficient_history', historyStatus: 'insufficient_history' },
    ageBand: '40_49',
    sex: 'male',
  },
  question: 'Vad är min fettprocent?',
};

const v15BodyFatReferenceRequest: CoachAskRequest = {
  version: 'coach-ask-v1.5',
  locale: 'sv-SE',
  generatedAt: '2026-08-15T12:00:00.000Z',
  context: {
    ...v14BodyFatRequest.context,
    ageBand: '50_59',
    bodyFatReference: {
      status: 'ready',
      source: 'acsm_getp_10_11_cooper_institute',
      sex: 'male',
      referenceAgeGroup: '50_59',
      bodyFatPercent: 20.83,
      referenceMedianPercent: 23.2,
      comparisonToReferenceMedian: 'below',
      referencePositionBand: 'below_median',
    },
  },
  question: 'Hur ligger min fettprocent till jämfört med andra i min ålder?',
};

const v16SwedishRequest: CoachAskRequest = {
  ...v15BodyFatReferenceRequest,
  version: 'coach-ask-v1.6',
  locale: 'sv-SE',
};

const v16NorwegianRequest: CoachAskRequest = {
  ...v15BodyFatReferenceRequest,
  version: 'coach-ask-v1.6',
  locale: 'nb-NO',
  question: 'Hvordan ligger fettprosenten min an sammenlignet med andre på min alder?',
};

describe('buildAskUserPrompt', () => {
  it('omits weeklyCheckIn from v1.1 OpenAI JSON', () => {
    const parsed = JSON.parse(buildAskUserPrompt(v11Request)) as Record<string, unknown>;
    assert.equal('weeklyCheckIn' in parsed, false);
    assert.equal('initialLifestyle' in parsed, false);
  });

  it('includes weeklyCheckIn null in v1.2 OpenAI JSON when absent', () => {
    const parsed = JSON.parse(buildAskUserPrompt(v12AbsentRequest)) as {
      weeklyCheckIn: unknown;
      initialLifestyle?: unknown;
    };
    assert.equal(parsed.weeklyCheckIn, null);
    assert.equal('initialLifestyle' in parsed, false);
  });

  it('includes both v1.3 sources and baseline 15_plus without a current week', () => {
    const parsed = JSON.parse(buildAskUserPrompt(v13BaselineAlcoholRequest)) as {
      weeklyCheckIn: unknown;
      initialLifestyle: { alcoholConsumption: { value: string } } | null;
    };
    assert.equal(parsed.weeklyCheckIn, null);
    assert.equal(parsed.initialLifestyle?.alcoholConsumption.value, '15_plus');
  });

  it('includes v1.4 body composition, ageBand, and sex without DOB', () => {
    const text = buildAskUserPrompt(v14BodyFatRequest);
    const parsed = JSON.parse(text) as {
      ageBand: string;
      sex: string;
      healthState: { bodyComposition: { bodyFatPercent: number } };
    };
    assert.equal(parsed.ageBand, '40_49');
    assert.equal(parsed.sex, 'male');
    assert.equal(parsed.healthState.bodyComposition.bodyFatPercent, 20.1);
    assert.equal(text.includes('dateOfBirth'), false);
    assert.equal(text.includes('ageYears'), false);
    assert.equal(text.includes('neckCm'), false);
    assert.equal(text.includes('bodyFatScore'), false);
  });

  it('includes v1.5 bodyFatReference without the raw ACSM table or DOB', () => {
    const text = buildAskUserPrompt(v15BodyFatReferenceRequest);
    const parsed = JSON.parse(text) as {
      bodyFatReference: { referenceMedianPercent: number; comparisonToReferenceMedian: string };
    };
    assert.equal(parsed.bodyFatReference.referenceMedianPercent, 23.2);
    assert.equal(parsed.bodyFatReference.comparisonToReferenceMedian, 'below');
    assert.equal(text.includes('dateOfBirth'), false);
    assert.equal(text.includes('acsmTable'), false);
    assert.equal(text.includes('BODY_FAT_REFERENCE_MIDPOINTS'), false);
  });
});

describe('getCoachAskSystemInstructions', () => {
  it('keeps v1.1 prompt for v1.1 payloads', () => {
    assert.equal(getCoachAskSystemInstructions(v11Request), NORDYAN_COACH_ASK_V11_SYSTEM_INSTRUCTIONS);
    assert.equal(NORDYAN_COACH_ASK_V11_SYSTEM_INSTRUCTIONS.includes('weeklyCheckIn'), false);
  });

  it('uses v1.2 prompt for v1.2 payloads', () => {
    assert.equal(
      getCoachAskSystemInstructions(v12AbsentRequest),
      NORDYAN_COACH_ASK_V12_SYSTEM_INSTRUCTIONS,
    );
    assert.match(NORDYAN_COACH_ASK_V12_SYSTEM_INSTRUCTIONS, /Använd inte Initial Lifestyle/);
  });

  it('uses v1.3 prompt for v1.3 payloads', () => {
    assert.equal(
      getCoachAskSystemInstructions(v13BaselineAlcoholRequest),
      NORDYAN_COACH_ASK_V13_SYSTEM_INSTRUCTIONS,
    );
  });

  it('uses v1.4 prompt for v1.4 payloads', () => {
    assert.equal(
      getCoachAskSystemInstructions(v14BodyFatRequest),
      NORDYAN_COACH_ASK_V14_SYSTEM_INSTRUCTIONS,
    );
  });

  it('uses v1.5 prompt for v1.5 payloads', () => {
    assert.equal(
      getCoachAskSystemInstructions(v15BodyFatReferenceRequest),
      NORDYAN_COACH_ASK_V15_SYSTEM_INSTRUCTIONS,
    );
  });
});

describe('nordyan-coach-ask-v1.2 instructions', () => {
  it('distinguishes subjective sleep from device sleep', () => {
    const text = NORDYAN_COACH_ASK_V12_SYSTEM_INSTRUCTIONS;
    assert.match(text, /sleepQuality/);
    assert.match(text, /sleepDataAvailable/);
    assert.match(text, /subjektiv veckokoll/i);
    assert.match(text, /mätt \/ enhets- \/ integrerad sömn/i);
  });

  it('encodes stress higher_worse polarity', () => {
    assert.match(NORDYAN_COACH_ASK_V12_SYSTEM_INSTRUCTIONS, /higher_worse/);
    assert.match(NORDYAN_COACH_ASK_V12_SYSTEM_INSTRUCTIONS, /stress\.value 5/);
  });

  it('does not require mentioning all eight answers', () => {
    const text = NORDYAN_COACH_ASK_V12_SYSTEM_INSTRUCTIONS;
    assert.match(text, /minsta relevanta delmängden/);
    assert.match(text, /Räkna inte mekaniskt upp alla åtta/);
    assert.doesNotMatch(text, /nämn alla åtta/);
  });
});

describe('nordyan-coach-ask-v1.3 instructions', () => {
  it('distinguishes onboarding baseline from current-week self-report', () => {
    const text = NORDYAN_COACH_ASK_V13_SYSTEM_INSTRUCTIONS;
    assert.match(text, /onboarding_baseline_self_report/);
    assert.match(text, /current_week_self_report/);
    assert.match(text, /ALDRIG slås ihop/i);
    assert.match(text, /inte nödvändigtvis användarens nuvarande tillstånd/i);
    assert.match(text, /långsiktig minskning|långsiktig identitet|inte en trend/i);
  });

  it('protects the alcohol baseline product case', () => {
    const text = NORDYAN_COACH_ASK_V13_SYSTEM_INSTRUCTIONS;
    assert.match(text, /Dricker jag för mycket/);
    assert.match(text, /15_plus/);
    assert.match(text, /HAR baslinjeinformation/);
    assert.match(text, /inte har lämnat någon alkoholinformation/);
    assert.match(text, /Diagnostisera inte/);
  });

  it('keeps nutrition frequency distinct from eatingQuality and without polarity', () => {
    const text = NORDYAN_COACH_ASK_V13_SYSTEM_INSTRUCTIONS;
    assert.match(text, /lessHealthyFoodFrequency/);
    assert.match(text, /SEPARAT från eatingQuality/);
    assert.match(text, /INGEN polarity/);
    assert.match(text, /Moralisera inte/);
  });

  it('does not dump all lifestyle fields and does not change authority', () => {
    const text = NORDYAN_COACH_ASK_V13_SYSTEM_INSTRUCTIONS;
    assert.match(text, /minsta relevanta delmängden/);
    assert.match(text, /alla sju baslinjesvar/);
    assert.match(text, /inte skapa en ny auktoritativ NORDYAN-plan/i);
    assert.match(text, /Ändra inte Health Score, Focus eller Plan/);
    assert.match(text, /sleepDataAvailable/);
    assert.match(text, /INTE steg/);
  });

  it('answers the immediate question first and treats context as evidence not a checklist', () => {
    const text = NORDYAN_COACH_ASK_V13_SYSTEM_INSTRUCTIONS;
    assert.match(text, /omedelbara fråga FÖRST/);
    assert.match(text, /tillgänglig evidens, inte en checklista/);
    assert.match(text, /Räkna inte upp profil, baslinje eller veckodata/);
    assert.match(text, /Nämn INTE Health Score, Focus, Plan/);
  });

  it('handles missing body-fat without dumping unrelated context', () => {
    const text = NORDYAN_COACH_ASK_V13_SYSTEM_INSTRUCTIONS;
    assert.match(text, /body-fat percentage/);
    assert.match(text, /värdet saknas/);
    assert.match(text, /Dumpa INTE Health Score, Focus, Plan/);
  });

  it('adapts a 20-minute constraint without reciting unrelated health fields', () => {
    const text = NORDYAN_COACH_ASK_V13_SYSTEM_INSTRUCTIONS;
    assert.match(text, /Jag har bara 20 minuter/);
    assert.match(text, /25 min promenad/);
    assert.match(text, /Upprepa INTE Health Score, midjefokus, sömn, energi, stress eller nutrition/);
  });
});

describe('nordyan-coach-ask-v1.4 instructions', () => {
  it('answers body-fat percentage directly and never calls an available value missing', () => {
    const text = NORDYAN_COACH_ASK_V14_SYSTEM_INSTRUCTIONS;
    assert.match(text, /Vad är min fettprocent/);
    assert.match(text, /beräknad kroppsfettprocent/);
    assert.match(text, /Beräknat från senaste mätningen/);
    assert.match(text, /påstå ALDRIG att kroppsfettinformation saknas/);
    assert.match(text, /Påstå aldrig DEXA, BIA, caliper/);
  });

  it('forbids invented age-specific reference thresholds', () => {
    const text = NORDYAN_COACH_ASK_V14_SYSTEM_INSTRUCTIONS;
    assert.match(text, /Är min fettprocent bra för min ålder/);
    assert.match(text, /INGEN godkänd Coach-vänd åldersspecifik referenstabell/);
    assert.match(text, /Hitta inte på frisk\/normal\/hög\/låg-gränser/);
    assert.match(text, /Saknad ageBand\/sex är INTE detsamma som saknad kroppsfettprocent/);
  });

  it('keeps weight, food, and 20-minute answers focused', () => {
    const text = NORDYAN_COACH_ASK_V14_SYSTEM_INSTRUCTIONS;
    assert.match(text, /Vad väger jag/);
    assert.match(text, /Vad bör jag äta/);
    assert.match(text, /Jag har bara 20 minuter/);
    assert.match(text, /Introducera inte kroppssammansättning/);
  });

  it('preserves v1.3 relevance and authority discipline', () => {
    const text = NORDYAN_COACH_ASK_V14_SYSTEM_INSTRUCTIONS;
    assert.match(text, /omedelbara fråga FÖRST/);
    assert.match(text, /tillgänglig evidens, inte en checklista/);
    assert.match(text, /inte skapa en ny auktoritativ NORDYAN-plan/i);
    assert.match(text, /Ändra inte Health Score, Focus eller Plan/);
    assert.doesNotMatch(text, /60–180/);
    assert.doesNotMatch(text, /bodyFatReference/);
  });
});

describe('nordyan-coach-ask-v1.5 instructions', () => {
  it('answers calculated body fat directly without a healthy-for-age claim', () => {
    const text = NORDYAN_COACH_ASK_V15_SYSTEM_INSTRUCTIONS;
    assert.match(text, /Vad är min fettprocent/);
    assert.match(text, /beräknad kroppsfettprocent/);
    assert.match(text, /jämfört med referensgruppen/);
    assert.match(text, /uppmätt kroppsfett/);
    assert.match(text, /det hälsosamma värdet för din ålder/);
    assert.match(text, /Lägg INTE till åldersreferens/);
    assert.match(text, /Avsluta alltid med en komplett mening/);
    assert.match(text, /ofullständig sista mening/);
    assert.match(text, /2–4 korta kompletta stycken/);
    assert.match(text, /60–180/);
  });

  it('uses deterministic bodyFatReference for the age-comparison question', () => {
    const text = NORDYAN_COACH_ASK_V15_SYSTEM_INSTRUCTIONS;
    assert.match(text, /Hur ligger min fettprocent till jämfört med andra i min ålder/);
    assert.match(text, /comparisonToReferenceMedian/);
    assert.match(text, /Invertera INTE/);
    assert.match(text, /Exponera INTE ett naket percentiltal/);
  });

  it('keeps the three quick questions and plan-relative instead', () => {
    const text = NORDYAN_COACH_ASK_V15_SYSTEM_INSTRUCTIONS;
    assert.match(text, /Varför är detta mitt fokus/);
    assert.match(text, /Vad kan jag göra istället idag/);
    assert.match(text, /Hårdkoda inte promenadalternativ/);
  });

  it('keeps weight, food, sleep, and 20-minute answers free of body-fat reference leak', () => {
    const text = NORDYAN_COACH_ASK_V15_SYSTEM_INSTRUCTIONS;
    assert.match(text, /Vad väger jag/);
    assert.match(text, /Vad bör jag äta/);
    assert.match(text, /Sömnfrågor/);
    assert.match(text, /Jag har bara 20 minuter/);
    assert.match(text, /Introducera inte kroppssammansättning eller bodyFatReference/);
  });

  it('stays Swedish-only and does not mention nb-NO', () => {
    const text = NORDYAN_COACH_ASK_V15_SYSTEM_INSTRUCTIONS;
    assert.match(text, /Svara på svenska/);
    assert.doesNotMatch(text, /nb-NO/);
    assert.doesNotMatch(text, /bokmål/i);
  });
});

describe('nordyan-coach-ask-v1.6 instructions', () => {
  it('keeps frozen v1.5 behavioral rules and adds locale-only language switching', () => {
    const text = NORDYAN_COACH_ASK_V16_SYSTEM_INSTRUCTIONS;
    assert.match(text, /omedelbara fråga FÖRST/);
    assert.match(text, /bodyFatReference/);
    assert.match(text, /comparisonToReferenceMedian/);
    assert.match(text, /Avsluta alltid med en komplett mening/);
    assert.match(text, /2–4 korta kompletta stycken/);
    assert.match(text, /NORDYAN and Health Score remain product terms/);
    assert.match(text, /Do not translate JSON field names/);
  });

  it('builds a locale-specific final instruction without an unconditional Swedish rule', () => {
    const swedish = buildNordyanCoachAskV16SystemInstructions('sv-SE');
    const bokmal = buildNordyanCoachAskV16SystemInstructions('nb-NO');

    assert.match(swedish, /Answer in natural Swedish/);
    assert.match(bokmal, /Answer in natural Norwegian Bokmål/);
    assert.match(bokmal, /Do not answer in Swedish unless the user explicitly requests Swedish/);
    assert.match(bokmal, /Internal enum values, JSON field names/);
    assert.match(bokmal, /NORDYAN and Health Score/);
    assert.doesNotMatch(bokmal, /Svara på svenska/);
    assert.doesNotMatch(bokmal, /Answer in natural Swedish/);
  });
});

describe('generateOpenAiCoachAskAnswer store:false', () => {
  it('sends store false and the v1.2 prompt', async () => {
    let captured: Record<string, unknown> | undefined;
    const answer = await generateOpenAiCoachAskAnswer(
      v12AbsentRequest,
      {
        openaiApiKey: 'test-key',
        openaiCoachModel: 'gpt-test',
        openaiTimeoutMs: 1000,
      },
      {
        responses: {
          create: async (params) => {
            captured = params;
            return { output_text: 'Behåll samma plan och ta en kortare promenad idag.' };
          },
        },
      },
    );

    assert.equal(answer.answer, 'Behåll samma plan och ta en kortare promenad idag.');
    assert.equal(captured?.store, false);
    const input = captured?.input as Array<{ role: string; content: string }>;
    assert.equal(input[0]?.content, NORDYAN_COACH_ASK_V12_SYSTEM_INSTRUCTIONS);
    assert.match(input[1]?.content ?? '', /"weeklyCheckIn": null/);
  });

  it('sends store false and the v1.3 prompt with baseline alcohol', async () => {
    let captured: Record<string, unknown> | undefined;
    const answer = await generateOpenAiCoachAskAnswer(
      v13BaselineAlcoholRequest,
      {
        openaiApiKey: 'test-key',
        openaiCoachModel: 'gpt-test',
        openaiTimeoutMs: 1000,
      },
      {
        responses: {
          create: async (params) => {
            captured = params;
            return { output_text: 'Under onboarding uppgav du 15+ glas en vanlig vecka.' };
          },
        },
      },
    );

    assert.equal(answer.answer, 'Under onboarding uppgav du 15+ glas en vanlig vecka.');
    assert.equal(captured?.store, false);
    const input = captured?.input as Array<{ role: string; content: string }>;
    assert.equal(input[0]?.content, NORDYAN_COACH_ASK_V13_SYSTEM_INSTRUCTIONS);
    assert.match(input[1]?.content ?? '', /"weeklyCheckIn": null/);
    assert.match(input[1]?.content ?? '', /"15_plus"/);
    assert.match(input[1]?.content ?? '', /onboarding_baseline_self_report/);
  });

  it('sends store false and the v1.4 prompt with calculated body fat', async () => {
    let captured: Record<string, unknown> | undefined;
    const answer = await generateOpenAiCoachAskAnswer(
      v14BodyFatRequest,
      {
        openaiApiKey: 'test-key',
        openaiCoachModel: 'gpt-test',
        openaiTimeoutMs: 1000,
      },
      {
        responses: {
          create: async (params) => {
            captured = params;
            return { output_text: 'Din senaste beräknade kroppsfettprocent är 20,1 %.' };
          },
        },
      },
    );

    assert.equal(answer.answer, 'Din senaste beräknade kroppsfettprocent är 20,1 %.');
    assert.equal(captured?.store, false);
    const input = captured?.input as Array<{ role: string; content: string }>;
    assert.equal(input[0]?.content, NORDYAN_COACH_ASK_V14_SYSTEM_INSTRUCTIONS);
    assert.match(input[1]?.content ?? '', /20\.1/);
    assert.equal((input[1]?.content ?? '').includes('dateOfBirth'), false);
  });

  it('sends store false and the v1.5 prompt with deterministic reference facts', async () => {
    let captured: Record<string, unknown> | undefined;
    const answer = await generateOpenAiCoachAskAnswer(
      v15BodyFatReferenceRequest,
      {
        openaiApiKey: 'test-key',
        openaiCoachModel: 'gpt-test',
        openaiTimeoutMs: 1000,
      },
      {
        responses: {
          create: async (params) => {
            captured = params;
            return {
              output_text:
                'Din senaste beräknade kroppsfettprocent är 20,8 %. Jämfört med referensgruppen ligger du något lägre än medianen.',
            };
          },
        },
      },
    );

    assert.match(answer.answer, /beräknade kroppsfettprocent/);
    assert.equal(captured?.store, false);
    const input = captured?.input as Array<{ role: string; content: string }>;
    assert.equal(input[0]?.content, NORDYAN_COACH_ASK_V15_SYSTEM_INSTRUCTIONS);
    assert.match(input[1]?.content ?? '', /23\.2/);
    assert.equal((input[1]?.content ?? '').includes('dateOfBirth'), false);
  });

  it('sends store false and the v1.6 Swedish prompt with locale in the user JSON', async () => {
    let captured: Record<string, unknown> | undefined;
    await generateOpenAiCoachAskAnswer(
      v16SwedishRequest,
      {
        openaiApiKey: 'test-key',
        openaiCoachModel: 'gpt-test',
        openaiTimeoutMs: 1000,
      },
      {
        responses: {
          create: async (params) => {
            captured = params;
            return {
              output_text:
                'Din senaste beräknade kroppsfettprocent är 20,8 %. Jämfört med referensgruppen ligger du något lägre än medianen.',
            };
          },
        },
      },
    );

    assert.equal(captured?.store, false);
    const input = captured?.input as Array<{ role: string; content: string }>;
    assert.equal(
      input[0]?.content,
      buildNordyanCoachAskV16SystemInstructions('sv-SE'),
    );
    assert.match(input[0]?.content ?? '', /Answer in natural Swedish/);
    assert.match(input[1]?.content ?? '', /"locale": "sv-SE"/);
    assert.match(input[1]?.content ?? '', /bodyFatReference/);
    assert.match(input[1]?.content ?? '', /23\.2/);
    assert.equal((input[1]?.content ?? '').includes('dateOfBirth'), false);
  });

  it('sends store false and the v1.6 Bokmål prompt with nb-NO locale', async () => {
    let captured: Record<string, unknown> | undefined;
    await generateOpenAiCoachAskAnswer(
      v16NorwegianRequest,
      {
        openaiApiKey: 'test-key',
        openaiCoachModel: 'gpt-test',
        openaiTimeoutMs: 1000,
      },
      {
        responses: {
          create: async (params) => {
            captured = params;
            return {
              output_text:
                'Den siste beregnede kroppsfettprosenten din er 20,8 %. Sammenlignet med referansegruppen ligger du noe lavere enn medianen.',
            };
          },
        },
      },
    );

    assert.equal(captured?.store, false);
    const input = captured?.input as Array<{ role: string; content: string }>;
    assert.equal(
      input[0]?.content,
      buildNordyanCoachAskV16SystemInstructions('nb-NO'),
    );
    assert.match(input[0]?.content ?? '', /Answer in natural Norwegian Bokmål/);
    assert.match(
      input[0]?.content ?? '',
      /Do not answer in Swedish unless the user explicitly requests Swedish/,
    );
    assert.doesNotMatch(input[0]?.content ?? '', /Svara på svenska/);
    assert.doesNotMatch(input[0]?.content ?? '', /Answer in natural Swedish/);
    assert.match(input[1]?.content ?? '', /"locale": "nb-NO"/);
    assert.match(input[1]?.content ?? '', /"comparisonToReferenceMedian": "below"/);
    assert.doesNotMatch(input[1]?.content ?? '', /below_median_svenska/);
    assert.equal(
      getCoachAskSystemInstructions(v16NorwegianRequest),
      buildNordyanCoachAskV16SystemInstructions('nb-NO'),
    );
    assert.equal(getCoachAskSystemInstructions(v15BodyFatReferenceRequest), NORDYAN_COACH_ASK_V15_SYSTEM_INSTRUCTIONS);
  });

  it('sets a bounded max_output_tokens budget and keeps store false', async () => {
    let captured: Record<string, unknown> | undefined;
    await generateOpenAiCoachAskAnswer(
      v15BodyFatReferenceRequest,
      {
        openaiApiKey: 'test-key',
        openaiCoachModel: 'gpt-test',
        openaiTimeoutMs: 1000,
      },
      {
        responses: {
          create: async (params) => {
            captured = params;
            return {
              status: 'completed',
              output_text: 'Din senaste beräknade kroppsfettprocent är 20,8 %.',
              usage: { output_tokens: 42 },
            };
          },
        },
      },
    );

    assert.equal(captured?.store, false);
    assert.equal(captured?.max_output_tokens, COACH_ASK_MAX_OUTPUT_TOKENS);
    assert.equal(COACH_ASK_MAX_OUTPUT_TOKENS, 4096);
  });

  it('returns a long-but-complete answer without slicing', async () => {
    const complete =
      'Detta är ditt fokus eftersom midjemåttet är den förändring som just nu har störst potential att förbättra din NORDYAN Score. Planen stödjer samma mål. Inget mer behöver läggas till här.';
    const generated = await generateOpenAiCoachAskAnswer(
      v15BodyFatReferenceRequest,
      {
        openaiApiKey: 'test-key',
        openaiCoachModel: 'gpt-test',
        openaiTimeoutMs: 1000,
      },
      {
        responses: {
          create: async () => ({
            status: 'completed',
            output_text: complete,
          }),
        },
      },
    );

    assert.equal(generated.answer, complete);
    assert.equal(generated.diagnostics.answerCharCount, complete.length);
    assert.equal(generated.diagnostics.retryAttempt, 0);
    assert.equal(generated.answer.includes(complete.slice(-18)), true);
  });

  it('retries once when provider status is incomplete', async () => {
    let calls = 0;
    const generated = await generateOpenAiCoachAskAnswer(
      v15BodyFatReferenceRequest,
      {
        openaiApiKey: 'test-key',
        openaiCoachModel: 'gpt-test',
        openaiTimeoutMs: 1000,
      },
      {
        responses: {
          create: async () => {
            calls += 1;
            if (calls === 1) {
              return {
                status: 'incomplete',
                incomplete_details: { reason: 'max_output_tokens' },
                output_text: 'Detta är ditt fokus eftersom midjemåttet är den förändring som',
              };
            }
            return {
              status: 'completed',
              output_text:
                'Detta är ditt fokus eftersom midjemåttet är den förändring som just nu har störst potential.',
            };
          },
        },
      },
    );

    assert.equal(calls, 2);
    assert.equal(COACH_ASK_MAX_GENERATION_ATTEMPTS, 2);
    assert.equal(generated.diagnostics.retryAttempt, 1);
    assert.match(generated.answer, /störst potential\.$/);
  });

  it('retries once when status is completed but the answer is a mid-word fragment', async () => {
    let calls = 0;
    const generated = await generateOpenAiCoachAskAnswer(
      v15BodyFatReferenceRequest,
      {
        openaiApiKey: 'test-key',
        openaiCoachModel: 'gpt-test',
        openaiTimeoutMs: 1000,
      },
      {
        responses: {
          create: async () => {
            calls += 1;
            if (calls === 1) {
              return {
                status: 'completed',
                output_text: 'Att prioritera fysisk aktivitet är en effektiv stra',
              };
            }
            return {
              status: 'completed',
              output_text: 'Att prioritera fysisk aktivitet är en effektiv strategi för just ditt fokus.',
            };
          },
        },
      },
    );

    assert.equal(calls, 2);
    assert.equal(generated.diagnostics.retryAttempt, 1);
    assert.equal(
      generated.answer,
      'Att prioritera fysisk aktivitet är en effektiv strategi för just ditt fokus.',
    );
  });

  it('retries once when a completed answer lacks terminal punctuation', async () => {
    let calls = 0;
    const generated = await generateOpenAiCoachAskAnswer(
      v15BodyFatReferenceRequest,
      {
        openaiApiKey: 'test-key',
        openaiCoachModel: 'gpt-test',
        openaiTimeoutMs: 1000,
      },
      {
        responses: {
          create: async () => {
            calls += 1;
            if (calls === 1) {
              return {
                status: 'completed',
                output_text: 'Detta är ditt fokus eftersom midjemåttet är 90',
              };
            }
            return {
              status: 'completed',
              output_text: 'Detta är ditt fokus eftersom midjemåttet är 90 cm.',
            };
          },
        },
      },
    );

    assert.equal(calls, 2);
    assert.equal(generated.answer, 'Detta är ditt fokus eftersom midjemåttet är 90 cm.');
  });

  it('returns the complete retry answer when the first attempt is incomplete', async () => {
    const retryAnswer =
      'Din senaste beräknade kroppsfettprocent är 20,8 %. Jämfört med referensgruppen ligger du något lägre än medianen.';
    let calls = 0;
    const generated = await generateOpenAiCoachAskAnswer(
      v15BodyFatReferenceRequest,
      {
        openaiApiKey: 'test-key',
        openaiCoachModel: 'gpt-test',
        openaiTimeoutMs: 1000,
      },
      {
        responses: {
          create: async () => {
            calls += 1;
            if (calls === 1) {
              return {
                status: 'incomplete',
                output_text: 'Din senaste beräknade kroppsfettprocent är',
              };
            }
            return { status: 'completed', output_text: retryAnswer };
          },
        },
      },
    );

    assert.equal(calls, 2);
    assert.equal(generated.answer, retryAnswer);
    assert.equal(generated.diagnostics.retryAttempt, 1);
  });

  it('does not return an incomplete OpenAI fragment as a successful answer', async () => {
    let calls = 0;
    await assert.rejects(
      () =>
        generateOpenAiCoachAskAnswer(
          v15BodyFatReferenceRequest,
          {
            openaiApiKey: 'test-key',
            openaiCoachModel: 'gpt-test',
            openaiTimeoutMs: 1000,
          },
          {
            responses: {
              create: async () => {
                calls += 1;
                return {
                  status: 'incomplete',
                  incomplete_details: { reason: 'max_output_tokens' },
                  output_text: 'Detta är ditt fokus eftersom midjemåttet är den förändring som',
                };
              },
            },
          },
        ),
      (error: unknown) => {
        assert.equal(calls, 2);
        assert.equal(error instanceof CoachAskIncompleteError, true);
        assert.match(String(error), /incomplete/);
        return true;
      },
    );
  });

  it('retries at most once even when both generations are incomplete', async () => {
    let calls = 0;
    await assert.rejects(
      () =>
        generateOpenAiCoachAskAnswer(
          v15BodyFatReferenceRequest,
          {
            openaiApiKey: 'test-key',
            openaiCoachModel: 'gpt-test',
            openaiTimeoutMs: 1000,
          },
          {
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
        ),
      (error: unknown) => {
        assert.equal(calls, COACH_ASK_MAX_GENERATION_ATTEMPTS);
        assert.equal(error instanceof CoachAskIncompleteError, true);
        assert.equal((error as CoachAskIncompleteError).diagnostics.retryAttempt, 1);
        assert.equal((error as CoachAskIncompleteError).diagnostics.completenessReason, 'mid_word');
        return true;
      },
    );
  });

  it('does not retry a normal complete answer', async () => {
    let calls = 0;
    const generated = await generateOpenAiCoachAskAnswer(
      v15BodyFatReferenceRequest,
      {
        openaiApiKey: 'test-key',
        openaiCoachModel: 'gpt-test',
        openaiTimeoutMs: 1000,
      },
      {
        responses: {
          create: async () => {
            calls += 1;
            return {
              status: 'completed',
              output_text: 'Din senaste beräknade kroppsfettprocent är 20,8 %.',
            };
          },
        },
      },
    );

    assert.equal(calls, 1);
    assert.equal(generated.diagnostics.retryAttempt, 0);
    assert.equal(generated.answer, 'Din senaste beräknade kroppsfettprocent är 20,8 %.');
  });

  it('keeps store false on both the first attempt and the retry', async () => {
    const stores: unknown[] = [];
    const systemContents: string[] = [];
    const userContents: string[] = [];
    await generateOpenAiCoachAskAnswer(
      v15BodyFatReferenceRequest,
      {
        openaiApiKey: 'test-key',
        openaiCoachModel: 'gpt-test',
        openaiTimeoutMs: 1000,
      },
      {
        responses: {
          create: async (params) => {
            stores.push(params.store);
            const input = params.input as Array<{ role: string; content: string }>;
            systemContents.push(input[0]?.content ?? '');
            userContents.push(input[1]?.content ?? '');
            if (stores.length === 1) {
              return {
                status: 'completed',
                output_text: 'Att prioritera fysisk aktivitet är en effektiv stra',
              };
            }
            return {
              status: 'completed',
              output_text: 'Att prioritera fysisk aktivitet är en effektiv strategi för just ditt fokus.',
            };
          },
        },
      },
    );

    assert.deepEqual(stores, [false, false]);
    assert.equal(systemContents[0], NORDYAN_COACH_ASK_V15_SYSTEM_INSTRUCTIONS);
    assert.equal(systemContents[1], NORDYAN_COACH_ASK_V15_SYSTEM_INSTRUCTIONS);
    assert.equal(userContents[0]?.includes('NYTT FÖRSÖK'), false);
    assert.match(userContents[1] ?? '', /NYTT FÖRSÖK/);
    assert.equal((userContents[1] ?? '').includes('en effektiv stra'), false);
    assert.match(userContents[1] ?? '', /23\.2/);
  });
});

describe('readCompleteCoachAskOutput', () => {
  it('does not return a mid-sentence fragment from an incomplete OpenAI response', () => {
    assert.throws(
      () =>
        readCompleteCoachAskOutput({
          status: 'incomplete',
          incomplete_details: { reason: 'max_output_tokens' },
          output_text: 'Detta är ditt fokus eftersom midjemåttet är den förändring som',
        }),
      /incomplete/,
    );
  });

  it('does not return a completed mid-word fragment', () => {
    assert.throws(
      () =>
        readCompleteCoachAskOutput({
          status: 'completed',
          output_text: 'Att prioritera fysisk aktivitet är en effektiv stra',
        }),
      /incomplete/,
    );
  });

  it('returns a completed answer in full', () => {
    assert.equal(
      readCompleteCoachAskOutput({
        status: 'completed',
        output_text: 'Detta är ditt fokus eftersom midjemåttet är den viktigaste förbättringen just nu.',
      }),
      'Detta är ditt fokus eftersom midjemåttet är den viktigaste förbättringen just nu.',
    );
  });
});
