import cors from 'cors';
import express from 'express';

import { loadAccountServerConfig, type AccountServerConfig } from './config';
import { registerAccountRoutes, type AccountRouteOptions } from './routes/accountRoutes';

export type AccountApp = {
  app: express.Express;
  config: AccountServerConfig;
};

function resolveCorsOrigin(env: NodeJS.ProcessEnv): cors.CorsOptions['origin'] {
  const raw = env.ACCOUNT_CORS_ORIGINS?.trim();
  if (!raw || raw === '*') {
    return true;
  }

  return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
}

export function createAccountApp(
  env: NodeJS.ProcessEnv = process.env,
  routeOptions: AccountRouteOptions = {},
): AccountApp {
  const config = loadAccountServerConfig(env);
  const app = express();

  app.use(
    cors({
      origin: resolveCorsOrigin(env),
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use(express.json({ limit: '8kb' }));

  registerAccountRoutes(app, config, routeOptions);

  return { app, config };
}

export function startAccountServer(env: NodeJS.ProcessEnv = process.env) {
  const { app, config } = createAccountApp(env);
  const host = '0.0.0.0';

  app.listen(config.port, host, () => {
    console.info(
      JSON.stringify({
        event: 'account.server.started',
        host,
        port: config.port,
        authConfigured: Boolean(config.supabaseUrl && config.supabaseAnonKey),
        adminConfigured: Boolean(config.supabaseServiceRoleKey),
      }),
    );
  });

  return app;
}
