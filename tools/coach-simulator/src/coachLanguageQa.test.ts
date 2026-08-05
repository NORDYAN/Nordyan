import { describe, expect, it, vi } from 'vitest';

import {
  allAutomatedCriteriaPass,
  scoreCoachMessage,
} from '../shared/coachLanguageScoring';
import { detectNearDuplicateVariants } from '../shared/coachRepetitionCheck';
import {
  NORDYAN_COACH_PROMPT_VERSION_V1,
  NORDYAN_COACH_PROMPT_VERSION_V2,
} from '../shared/coachPromptVersions';
import { getCoachInstructionBundle } from '../server/instructions';
import { generateCoachLanguage } from '../server/services/coachLanguageOrchestrator';
import { buildCoachPromptPayload } from './coachPromptBuilder';
import { runCoachDecisionEngine } from './coachDecisionEngine';
import { COACH_SCENARIOS } from './coachScenarioLibrary';
import {
  allScenariosEvaluated,
  allVariantsShareDecision,
  BATCH_VARIANT_COUNT,
  runBatchLanguageEvaluation,
} from '../src/runBatchLanguageEvaluation';
import {
  buildEvaluationExportReport,
  assertExportReportIsSafe,
} from '../src/exportEvaluationReport';
import {
  clearManualReviews,
  loadManualReviews,
  saveManualReview,
  createEmptyManualRatings,
} from '../src/coachManualReviewStorage';
import { generateMockCoachMessage } from '../src/mockCoachAi';

function samplePayload(scenarioId = 'positiv-utveckling') {
  const scenario = COACH_SCENARIOS.find((item) => item.id === scenarioId)!;
  const decision = runCoachDecisionEngine(scenario.data);
  return buildCoachPromptPayload(decision);
}

describe('coach language QA', () => {
  it('batch evaluates all scenarios', async () => {
    const result = await runBatchLanguageEvaluation({
      provider: 'mock',
      coachPromptVersion: NORDYAN_COACH_PROMPT_VERSION_V2,
    });

    expect(allScenariosEvaluated(result)).toBe(true);
    expect(result.scenarios).toHaveLength(10);
  });

  it('generates three variants for non-quiet scenarios and one for quiet scenarios', async () => {
    const result = await runBatchLanguageEvaluation({
      provider: 'mock',
      coachPromptVersion: NORDYAN_COACH_PROMPT_VERSION_V2,
    });

    const quiet = result.scenarios.find((item) => item.scenarioId === 'otillracklig-data');
    const active = result.scenarios.find((item) => item.scenarioId === 'positiv-utveckling');

    expect(quiet?.variants).toHaveLength(1);
    expect(result.scenarios.find((item) => item.scenarioId === 'positiv-utveckling')?.variants).toHaveLength(
      BATCH_VARIANT_COUNT,
    );
    expect(active?.variants).toHaveLength(BATCH_VARIANT_COUNT);
  });

  it('preserves the same decision across three variants', async () => {
    const result = await runBatchLanguageEvaluation({
      provider: 'mock',
      coachPromptVersion: NORDYAN_COACH_PROMPT_VERSION_V2,
    });

    expect(allVariantsShareDecision(result)).toBe(true);

    for (const scenario of result.scenarios) {
      for (const variant of scenario.variants) {
        expect(variant.response.message.recommendedAction).toBe(
          scenario.decision.recommendedAction === 'Ingen rekommendation'
            ? null
            : scenario.decision.recommendedAction,
        );
      }
    }
  });

  it('does not call OpenAI for quiet scenarios', async () => {
    const payload = samplePayload('otillracklig-data');
    const create = vi.fn();
    const openAiClient = { responses: { create } };

    await generateCoachLanguage(payload, {
      config: {
        port: 8787,
        openaiApiKey: 'test-key',
        openaiCoachModel: 'gpt-4o-mini',
        openaiTimeoutMs: 5000,
        isDevelopment: true,
      },
      coachPromptVersion: NORDYAN_COACH_PROMPT_VERSION_V2,
      openAiClient,
    });

    expect(create).not.toHaveBeenCalled();
  });

  it('keeps prompt versions separate without overwriting', () => {
    const v1 = getCoachInstructionBundle(NORDYAN_COACH_PROMPT_VERSION_V1);
    const v2 = getCoachInstructionBundle(NORDYAN_COACH_PROMPT_VERSION_V2);

    expect(v1.version).toBe(NORDYAN_COACH_PROMPT_VERSION_V1);
    expect(v2.version).toBe(NORDYAN_COACH_PROMPT_VERSION_V2);
    expect(v1.systemInstructions).toContain('nordyan-coach-v1');
    expect(v2.systemInstructions).toContain('nordyan-coach-v2');
    expect(v2.systemInstructions).toContain('Tillverka aldrig beröm');
  });

  it('does not allow invalid messages to pass automated scoring', () => {
    const payload = samplePayload();
    const invalidMessage = {
      headline: 'You should take medicine now.',
      body: 'This is an AI diagnosis with insulin and kolesterol recommendations immediately.',
      recommendedAction: 'Hitta på en ny åtgärd',
      tone: 'encouraging' as const,
      promptVersion: NORDYAN_COACH_PROMPT_VERSION_V2,
    };

    const scores = scoreCoachMessage(invalidMessage, payload);
    expect(allAutomatedCriteriaPass(scores)).toBe(false);
  });

  it('exports reports without secrets or forbidden raw data', async () => {
    clearManualReviews();
    const batch = await runBatchLanguageEvaluation({
      provider: 'mock',
      coachPromptVersion: NORDYAN_COACH_PROMPT_VERSION_V2,
    });

    saveManualReview({
      scenarioId: 'positiv-utveckling',
      variantIndex: 0,
      coachPromptVersion: batch.coachPromptVersion,
      batchRunId: batch.batchRunId,
      ratings: { ...createEmptyManualRatings(), clear: 4 },
      note: 'Good clarity',
      updatedAt: new Date().toISOString(),
    });

    const report = buildEvaluationExportReport(batch);
    expect(() => assertExportReportIsSafe(report)).not.toThrow();
    expect(JSON.stringify(report)).not.toContain('OPENAI_API_KEY');
    expect(JSON.stringify(report)).not.toContain('weightKg');
  });

  it('persists manual reviews locally and can clear them', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    });

    clearManualReviews();

    saveManualReview({
      scenarioId: 'stabil-utveckling',
      variantIndex: 1,
      coachPromptVersion: NORDYAN_COACH_PROMPT_VERSION_V1,
      batchRunId: 'batch_test',
      ratings: { ...createEmptyManualRatings(), naturalSwedish: 5 },
      updatedAt: new Date().toISOString(),
    });

    expect(loadManualReviews()).toHaveLength(1);
    clearManualReviews();
    expect(loadManualReviews()).toHaveLength(0);

    vi.unstubAllGlobals();
  });

  it('flags near-duplicate variants', () => {
    const message = generateMockCoachMessage(samplePayload(), NORDYAN_COACH_PROMPT_VERSION_V2);
    const flags = detectNearDuplicateVariants([message, message, message]);
    expect(flags.length).toBeGreaterThan(0);
  });
});

describe('example outputs for all scenarios', () => {
  it('generates deterministic mock examples', () => {
    const examples = COACH_SCENARIOS.map((scenario) => {
      const decision = runCoachDecisionEngine(scenario.data);
      const prompt = buildCoachPromptPayload(decision);
      const message = generateMockCoachMessage(prompt, NORDYAN_COACH_PROMPT_VERSION_V2);
      return {
        scenarioId: scenario.id,
        label: scenario.label,
        decision: {
          topStrength: decision.topStrength,
          topOpportunity: decision.topOpportunity,
          coachGoal: decision.coachGoal,
          recommendedAction: decision.recommendedAction,
        },
        message,
      };
    });

    expect(examples).toHaveLength(10);
    expect(examples[0].message.headline.length).toBeGreaterThan(0);
  });
});
