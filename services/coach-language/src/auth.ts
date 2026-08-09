import { createClient } from '@supabase/supabase-js';
import type { NextFunction, Request, Response } from 'express';

import type { CoachServerConfig } from './config';
import { isSupabaseAuthConfigured } from './config';
import { createRequestId, logCoachRequest } from './logger';

export type AuthenticatedCoachRequest = Request & {
  coachAuthUserId?: string;
};

/** Returns authenticated user id, or null when the token is invalid. */
export type AccessTokenVerifier = (token: string) => Promise<string | null>;

export type RequireAuthOptions = {
  /** Injected for tests; production uses Supabase getUser. */
  verifyAccessToken?: AccessTokenVerifier;
};

export function createDefaultAccessTokenVerifier(
  config: CoachServerConfig,
): AccessTokenVerifier {
  return async (token: string) => {
    if (!isSupabaseAuthConfigured(config)) {
      return null;
    }

    const supabase = createClient(config.supabaseUrl!, config.supabaseAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user?.id) {
      return null;
    }

    return data.user.id;
  };
}

/**
 * Verifies Supabase JWT from Authorization: Bearer <token>.
 * Rejects with 401 when missing or invalid. Does not log tokens or user PII.
 */
export function createRequireSupabaseAuth(
  config: CoachServerConfig,
  options: RequireAuthOptions = {},
) {
  const verifyAccessToken =
    options.verifyAccessToken ?? createDefaultAccessTokenVerifier(config);
  const skipEnvGate = Boolean(options.verifyAccessToken);

  return async function requireSupabaseAuth(
    request: AuthenticatedCoachRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    if (!skipEnvGate && !isSupabaseAuthConfigured(config)) {
      logCoachRequest({
        requestId: createRequestId(),
        promptVersion: 'n/a',
        provider: 'fallback',
        latencyMs: 0,
        category: 'auth_error',
        usedFallback: true,
      });
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const header = request.header('authorization') ?? request.header('Authorization');
    if (!header || !header.startsWith('Bearer ')) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const userId = await verifyAccessToken(token);
      if (!userId) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      request.coachAuthUserId = userId;
      next();
    } catch {
      response.status(401).json({ error: 'Unauthorized' });
    }
  };
}
