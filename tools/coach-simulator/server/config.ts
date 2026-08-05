/** Server-only configuration. OPENAI_API_KEY is never exposed to the browser. */
export type CoachServerConfig = {
  port: number;
  openaiApiKey: string | undefined;
  openaiCoachModel: string;
  openaiTimeoutMs: number;
  isDevelopment: boolean;
};

const DEFAULT_MODEL = 'gpt-4o-mini';

export function loadCoachServerConfig(env: NodeJS.ProcessEnv = process.env): CoachServerConfig {
  return {
    port: Number(env.COACH_SERVER_PORT ?? '8787'),
    openaiApiKey: env.OPENAI_API_KEY?.trim() || undefined,
    openaiCoachModel: env.OPENAI_COACH_MODEL?.trim() || DEFAULT_MODEL,
    openaiTimeoutMs: Number(env.OPENAI_COACH_TIMEOUT_MS ?? '15000'),
    isDevelopment: env.NODE_ENV !== 'production',
  };
}

export function isOpenAiConfigured(config: CoachServerConfig): boolean {
  return Boolean(config.openaiApiKey);
}

export const DOCUMENTED_DEFAULT_MODEL = DEFAULT_MODEL;

/**
 * OpenAI platform data-control and retention settings must be reviewed before
 * production use. Requests use store: false to avoid intentional product history storage.
 */
