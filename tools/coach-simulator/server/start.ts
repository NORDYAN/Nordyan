import { config as loadEnv } from 'dotenv';

loadEnv();

const { startCoachServer } = await import('./index');

startCoachServer();