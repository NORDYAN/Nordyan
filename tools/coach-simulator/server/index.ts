import cors from 'cors';
import express from 'express';

import { loadCoachServerConfig } from './config';
import { registerCoachRoutes } from './routes/coachRoutes';

export function createCoachServer() {
  const config = loadCoachServerConfig();
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '32kb' }));

  registerCoachRoutes(app, config);

  return { app, config };
}

export function startCoachServer() {
  const { app, config } = createCoachServer();

  app.listen(config.port, () => {
    console.info(
      JSON.stringify({
        event: 'coach.server.started',
        port: config.port,
        openaiConfigured: Boolean(config.openaiApiKey),
        model: config.openaiCoachModel,
      }),
    );
  });

  return app;
}
