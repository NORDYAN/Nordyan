import type {
  CoachGenerateResponse,
  CoachPromptPayload,
} from './coachSimulator.types';
import { generateMockCoachMessage } from './mockCoachAi';
import { DEFAULT_NORDYAN_COACH_PROMPT_VERSION } from '../shared/coachPromptVersions';
import type { NordyanCoachPromptVersion } from '../shared/coachPromptVersions';

function createMockMeta(
  coachPromptVersion: NordyanCoachPromptVersion,
): CoachGenerateResponse['meta'] {
  return {
    provider: 'mock',
    latencyMs: 0,
    promptVersion: coachPromptVersion,
    validationStatus: 'valid',
    usedFallback: false,
    requestId: 'mock_local',
  };
}

export class MockCoachLanguageService {
  async generate(
    payload: CoachPromptPayload,
    coachPromptVersion: NordyanCoachPromptVersion = DEFAULT_NORDYAN_COACH_PROMPT_VERSION,
  ): Promise<CoachGenerateResponse> {
    return {
      message: generateMockCoachMessage(payload, coachPromptVersion),
      meta: createMockMeta(coachPromptVersion),
    };
  }
}

export class ServerCoachLanguageService {
  async generate(
    payload: CoachPromptPayload,
    coachPromptVersion: NordyanCoachPromptVersion = DEFAULT_NORDYAN_COACH_PROMPT_VERSION,
  ): Promise<CoachGenerateResponse> {
    const response = await fetch('/api/coach/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        coachPromptVersion,
      }),
    });

    if (!response.ok) {
      throw new Error('Coach language request failed.');
    }

    return (await response.json()) as CoachGenerateResponse;
  }
}

export async function fetchCoachServerStatus(): Promise<{
  openaiConfigured: boolean;
  promptVersion: string;
  availablePromptVersions: NordyanCoachPromptVersion[];
  defaultModel: string;
}> {
  const response = await fetch('/api/coach/status');
  if (!response.ok) {
    return {
      openaiConfigured: false,
      promptVersion: 'nordyan-coach-v1',
      availablePromptVersions: ['nordyan-coach-v1'],
      defaultModel: 'gpt-4o-mini',
    };
  }

  return (await response.json()) as {
    openaiConfigured: boolean;
    promptVersion: string;
    availablePromptVersions: NordyanCoachPromptVersion[];
    defaultModel: string;
  };
}

export const mockCoachLanguageService = new MockCoachLanguageService();
export const serverCoachLanguageService = new ServerCoachLanguageService();
