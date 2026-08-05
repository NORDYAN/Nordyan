import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';

import { buildCoachPromptPayload } from '../src/coachPromptBuilder';
import { runCoachDecisionEngine } from '../src/coachDecisionEngine';
import { COACH_SCENARIOS } from '../src/coachScenarioLibrary';
import { runCoachSimulatorPipeline } from '../src/runCoachSimulatorPipeline';
import type { CoachMessage, CoachPromptPayload } from '../shared/coachContracts';
import {
  NORDYAN_COACH_PROMPT_VERSION_V1,
  NORDYAN_COACH_PROMPT_VERSION_V2,
} from '../shared/coachPromptVersions';
import { createCoachServer } from './index';
import { generateCoachLanguage } from './services/coachLanguageOrchestrator';
import type { OpenAiCoachClient } from './services/openaiCoachLanguageService';
import {
  validateCoachMessageContent,
  validateCoachMessageSchema,
} from './validation/contentValidation';

function samplePayload(overrides?: Partial<CoachPromptPayload['decision']>): CoachPromptPayload {
  const scenario = COACH_SCENARIOS.find((item) => item.id === 'positiv-utveckling')!;
  const decision = runCoachDecisionEngine(scenario.data);
  const payload = buildCoachPromptPayload(decision);

  if (overrides) {
    payload.decision = { ...payload.decision, ...overrides };
  }

  return payload;
}

function validCoachMessage(recommendedAction: string, body?: string): CoachMessage {
  return {
    headline: 'Bra riktning just nu.',
    body:
      body ??
      'Midjemåttet visar förbättring enligt tillgänglig data. Fortsätt med små steg framåt.',
    recommendedAction,
    tone: 'encouraging',
    promptVersion: NORDYAN_COACH_PROMPT_VERSION_V1,
  };
}

describe('coach language server', () => {
  it('accepts valid requests and returns schema-valid CoachMessage via OpenAI mock', async () => {
    const payload = samplePayload();
    const create = vi.fn().mockResolvedValue({
      output_text: JSON.stringify(validCoachMessage(payload.decision.recommendedAction)),
    });
    const openAiClient = { responses: { create } } as unknown as OpenAiCoachClient;

    const result = await generateCoachLanguage(payload, {
      config: {
        port: 8787,
        openaiApiKey: 'test-key',
        openaiCoachModel: 'gpt-4o-mini',
        openaiTimeoutMs: 5000,
        isDevelopment: true,
      },
      coachPromptVersion: NORDYAN_COACH_PROMPT_VERSION_V1,
      openAiClient,
    });

    expect(create).toHaveBeenCalledOnce();
    expect(validateCoachMessageSchema(result.message)).not.toBeNull();
    expect(result.meta.provider).toBe('openai');
    expect(result.meta.validationStatus).toBe('valid');
    expect(result.message.recommendedAction).toBe(payload.decision.recommendedAction);
  });

  it('rejects unexpected fields', async () => {
    const { app } = createCoachServer();
    const payload = samplePayload();

    const response = await request(app)
      .post('/api/coach/generate')
      .send({ ...payload, email: 'user@example.com' });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Unexpected field');
  });

  it('uses fallback safely when API key is missing', async () => {
    const payload = samplePayload();

    const result = await generateCoachLanguage(payload, {
      config: {
        port: 8787,
        openaiApiKey: undefined,
        openaiCoachModel: 'gpt-4o-mini',
        openaiTimeoutMs: 5000,
        isDevelopment: true,
      },
      coachPromptVersion: NORDYAN_COACH_PROMPT_VERSION_V2,
    });

    expect(result.meta.provider).toBe('fallback');
    expect(result.meta.usedFallback).toBe(true);
    expect(result.message.promptVersion).toBe(NORDYAN_COACH_PROMPT_VERSION_V2);
  });

  it('uses fallback on OpenAI timeout', async () => {
    const payload = samplePayload();
    const create = vi.fn().mockRejectedValue(new Error('Request timed out'));
    const openAiClient = { responses: { create } } as unknown as OpenAiCoachClient;

    const result = await generateCoachLanguage(payload, {
      config: {
        port: 8787,
        openaiApiKey: 'test-key',
        openaiCoachModel: 'gpt-4o-mini',
        openaiTimeoutMs: 5000,
        isDevelopment: true,
      },
      coachPromptVersion: NORDYAN_COACH_PROMPT_VERSION_V1,
      openAiClient,
    });

    expect(result.meta.provider).toBe('fallback');
    expect(result.meta.usedFallback).toBe(true);
  });

  it('uses fallback on invalid model JSON', async () => {
    const payload = samplePayload();
    const create = vi.fn().mockResolvedValue({ output_text: '{not-json' });
    const openAiClient = { responses: { create } } as unknown as OpenAiCoachClient;

    const result = await generateCoachLanguage(payload, {
      config: {
        port: 8787,
        openaiApiKey: 'test-key',
        openaiCoachModel: 'gpt-4o-mini',
        openaiTimeoutMs: 5000,
        isDevelopment: true,
      },
      coachPromptVersion: NORDYAN_COACH_PROMPT_VERSION_V1,
      openAiClient,
    });

    expect(result.meta.provider).toBe('fallback');
    expect(result.meta.usedFallback).toBe(true);
  });

  it('rejects unsupported recommendation and falls back', async () => {
    const payload = samplePayload();
    const create = vi.fn().mockResolvedValue({
      output_text: JSON.stringify(
        validCoachMessage('Hitta på en ny åtgärd'),
      ),
    });
    const openAiClient = { responses: { create } } as unknown as OpenAiCoachClient;

    const result = await generateCoachLanguage(payload, {
      config: {
        port: 8787,
        openaiApiKey: 'test-key',
        openaiCoachModel: 'gpt-4o-mini',
        openaiTimeoutMs: 5000,
        isDevelopment: true,
      },
      coachPromptVersion: NORDYAN_COACH_PROMPT_VERSION_V1,
      openAiClient,
    });

    expect(result.meta.validationStatus).toBe('fallback');
    expect(result.message.recommendedAction).toBe(payload.decision.recommendedAction);
  });

  it('rejects output longer than 80 words', () => {
    const payload = samplePayload();
    const longBody = Array.from({ length: 85 }, (_, index) => `ord${index}`).join(' ');
    const message = validCoachMessage(payload.decision.recommendedAction, longBody);
    const validation = validateCoachMessageContent(message, payload, NORDYAN_COACH_PROMPT_VERSION_V1);

    expect(validation.valid).toBe(false);
    if (!validation.valid) {
      expect(validation.reason).toBe('word limit exceeded');
    }
  });

  it('rejects medical diagnosis language', () => {
    const payload = samplePayload();
    const message = validCoachMessage(
      payload.decision.recommendedAction,
      'Du har en diagnos som kräver medicin.',
    );
    const validation = validateCoachMessageContent(message, payload, NORDYAN_COACH_PROMPT_VERSION_V1);

    expect(validation.valid).toBe(false);
    if (!validation.valid) {
      expect(validation.reason).toBe('forbidden medical language');
    }
  });

  it('requires cautious wording for low confidence', () => {
    const payload = samplePayload({ confidence: 50 });
    const message = validCoachMessage(
      payload.decision.recommendedAction,
      'Allt ser absolut säkert ut utan reservationer.',
    );
    const validation = validateCoachMessageContent(message, payload, NORDYAN_COACH_PROMPT_VERSION_V1);

    expect(validation.valid).toBe(false);
    if (!validation.valid) {
      expect(validation.reason).toBe('missing cautious language for low confidence');
    }
  });

  it('does not call OpenAI for Tiga or insufficient data', async () => {
    const quietPayload = samplePayload({ coachGoal: 'Tiga', insufficientData: true });
    const create = vi.fn();
    const openAiClient = { responses: { create } } as unknown as OpenAiCoachClient;

    const result = await generateCoachLanguage(quietPayload, {
      config: {
        port: 8787,
        openaiApiKey: 'test-key',
        openaiCoachModel: 'gpt-4o-mini',
        openaiTimeoutMs: 5000,
        isDevelopment: true,
      },
      coachPromptVersion: NORDYAN_COACH_PROMPT_VERSION_V1,
      openAiClient,
    });

    expect(create).not.toHaveBeenCalled();
    expect(result.message.isQuiet).toBe(true);
    expect(result.message.recommendedAction).toBeNull();
  });

  it('preserves the same Decision Engine result across Generate Again', async () => {
    const scenario = COACH_SCENARIOS[0];
    const first = await runCoachSimulatorPipeline(scenario.data, { provider: 'mock' });
    const second = await runCoachSimulatorPipeline(scenario.data, {
      provider: 'mock',
      existingDecision: first.decision,
      existingPrompt: first.prompt,
    });

    expect(second.decision).toEqual(first.decision);
    expect(second.prompt).toEqual(first.prompt);
  });
});

describe('coach language server HTTP', () => {
  it('returns status without exposing secrets', async () => {
    const { app } = createCoachServer();
    const response = await request(app).get('/api/coach/status');

    expect(response.status).toBe(200);
    expect(response.body.openaiConfigured).toBe(false);
    expect(JSON.stringify(response.body)).not.toContain('sk-');
  });
});
