import cors from 'cors';
import express from 'express';

import { loadCoachServerConfig, type CoachServerConfig } from './config';
import { registerCoachRoutes, type CoachRouteOptions } from './routes/coachRoutes';

export type CoachLanguageApp = {
  app: express.Express;
  config: CoachServerConfig;
};

function resolveCorsOrigin(env: NodeJS.ProcessEnv): cors.CorsOptions['origin'] {
  const raw = env.COACH_CORS_ORIGINS?.trim();
  if (!raw || raw === '*') {
    // Local Expo / simulator development default.
    return true;
  }

  return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
}

export function createCoachLanguageApp(
  env: NodeJS.ProcessEnv = process.env,
  routeOptions: CoachRouteOptions = {},
): CoachLanguageApp {
  const config = loadCoachServerConfig(env);
  const app = express();

  app.use(
    cors({
      origin: resolveCorsOrigin(env),
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use(express.json({ limit: '32kb' }));

  registerCoachRoutes(app, config, routeOptions);

  return { app, config };
}

export function startCoachLanguageServer(env: NodeJS.ProcessEnv = process.env) {
  const { app, config } = createCoachLanguageApp(env);
  // Bind all interfaces so Expo Go on a LAN device can reach the host (not loopback-only).
  const host = '0.0.0.0';

  app.listen(config.port, host, () => {
    console.info(
      JSON.stringify({
        event: 'coach.server.started',
        host,
        port: config.port,
        openaiConfigured: Boolean(config.openaiApiKey),
        authConfigured: Boolean(config.supabaseUrl && config.supabaseAnonKey),
        model: config.openaiCoachModel,
      }),
    );
  });

  return app;
}
