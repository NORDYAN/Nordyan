import { describe, expect, it } from 'vitest';

import { runCoachDecisionEngine } from './coachDecisionEngine';
import { COACH_SCENARIOS } from './coachScenarioLibrary';
import { buildCoachPromptPayload, serializeCoachPrompt } from './coachPromptBuilder';

describe('coachDecisionEngine scenarios', () => {
  it.each(COACH_SCENARIOS.map((scenario) => [scenario.id, scenario] as const))(
    '%s',
    (_id, scenario) => {
      const decision = runCoachDecisionEngine(scenario.data);
      const { expectation } = scenario;

      expect(decision.topStrength).toBe(expectation.topStrength);
      expect(decision.topOpportunity).toBe(expectation.topOpportunity);
      expect(decision.coachGoal).toBe(expectation.coachGoal);
      expect(decision.recommendedAction).toBe(expectation.recommendedAction);
      expect(decision.confidence).toBeGreaterThanOrEqual(expectation.confidenceMin);
      expect(decision.confidence).toBeLessThanOrEqual(expectation.confidenceMax);

      if (expectation.insufficientData) {
        expect(decision.insufficientData).toBe(true);
        expect(decision.recommendedAction).toBe('Ingen rekommendation');
      } else {
        expect(decision.insufficientData).toBe(false);
      }

      if (expectation.silenceEligible) {
        expect(decision.silenceEligible).toBe(true);
      }
    },
  );

  it('is deterministic for the same input', () => {
    const scenario = COACH_SCENARIOS[0];
    const first = runCoachDecisionEngine(scenario.data);
    const second = runCoachDecisionEngine(scenario.data);

    expect(first).toEqual(second);
  });

  it('prioritizes waist improvement over minor weight increase', () => {
    const scenario = COACH_SCENARIOS.find((item) => item.id === 'vikt-upp-midja-ned');
    expect(scenario).toBeDefined();

    const decision = runCoachDecisionEngine(scenario!.data);
    expect(decision.topStrength).toBe('Midjemått');
    expect(decision.recommendedAction).not.toBe('Balansera motstridiga signaler');
  });

  it('does not use exaggerated coaching for stable development', () => {
    const scenario = COACH_SCENARIOS.find((item) => item.id === 'stabil-utveckling');
    expect(scenario).toBeDefined();

    const decision = runCoachDecisionEngine(scenario!.data);
    expect(decision.coachGoal).toBe('Guida');
    expect(decision.coachGoal).not.toBe('Motivate');
    expect(decision.recommendedAction).toBe('Bekräfta stabil trend');
  });
});

describe('coachPromptBuilder security shape', () => {
  it('does not include raw health history in prompt payload', () => {
    const scenario = COACH_SCENARIOS[0];
    const decision = runCoachDecisionEngine(scenario.data);
    const payload = buildCoachPromptPayload(decision);
    const serialized = serializeCoachPrompt(payload);

    expect(serialized).not.toContain('"weightKg"');
    expect(serialized).not.toContain('"testData"');
    expect(payload.supportingFacts.length).toBeGreaterThan(0);
  });
});
