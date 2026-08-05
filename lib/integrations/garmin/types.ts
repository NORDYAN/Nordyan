export type GarminConnectionStatus = 'disconnected' | 'connected' | 'syncing' | 'error';

export type GarminSyncResult = {
  syncedAt: string;
  metricsImported: number;
};
