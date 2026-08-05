import type { Express, Request, Response } from 'express';

import {
  DEFAULT_NORDYAN_COACH_PROMPT_VERSION,
  NORDYAN_COACH_PROMPT_VERSION_V1,
} from '../../shared/coachPromptVersions';
import {
  DOCUMENTED_DEFAULT_MODEL,
  isOpenAiConfigured,
  loadCoachServerConfig,
  type CoachServerConfig,
} from '../config';
import { listCoachInstructionVersions } from '../instructions';
import { generateCoachLanguage } from '../services/coachLanguageOrchestrator';
import {
  CoachRequestValidationError,
  validateCoachGenerateRequest,
} from '../validation/requestValidation';

export function registerCoachRoutes(app: Express, config: CoachServerConfig = loadCoachServerConfig()): void {
  app.get('/api/coach/status', (_request: Request, response: Response) => {
    response.json({
      openaiConfigured: isOpenAiConfigured(config),
      promptVersion: DEFAULT_NORDYAN_COACH_PROMPT_VERSION,
      availablePromptVersions: listCoachInstructionVersions(),
      defaultModel: config.openaiCoachModel || DOCUMENTED_DEFAULT_MODEL,
    });
  });

  app.post('/api/coach/generate', async (request: Request, response: Response) => {
    try {
      const { payload, coachPromptVersion } = validateCoachGenerateRequest(request.body);
      const result = await generateCoachLanguage(payload, { config, coachPromptVersion });
      response.json(result);
    } catch (error) {
      if (error instanceof CoachRequestValidationError) {
        response.status(400).json({ error: error.message });
        return;
      }

      response.status(500).json({ error: 'Coach language generation failed.' });
    }
  });
}

export { validateCoachGenerateRequest };
export { NORDYAN_COACH_PROMPT_VERSION_V1 };
