export type CoachHomeBodyFatDiscoveryKeyValueStore = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

export const COACH_HOME_BODY_FAT_DISCOVERY_USED_VALUE = 'true';

export function coachHomeBodyFatDiscoveryKey(userId: string): string {
  return `@nordyan/coach_home/body_fat_comparison_used/${userId}`;
}

export type CoachHomeBodyFatDiscoveryStore = {
  getUsed(userId: string): Promise<boolean>;
  markUsed(userId: string): Promise<void>;
};

/**
 * Per-user local flag: the body-fat comparison discovery chip has been used.
 * Stores only `'true'`. Never stores questions, answers, or history.
 * Read failures fail closed to unused (`false`).
 */
export function createCoachHomeBodyFatDiscoveryStore(
  storage: CoachHomeBodyFatDiscoveryKeyValueStore,
): CoachHomeBodyFatDiscoveryStore {
  return {
    async getUsed(userId: string): Promise<boolean> {
      const trimmed = userId.trim();
      if (!trimmed) {
        return false;
      }

      try {
        const raw = await storage.getItem(coachHomeBodyFatDiscoveryKey(trimmed));
        return raw === COACH_HOME_BODY_FAT_DISCOVERY_USED_VALUE;
      } catch {
        return false;
      }
    },

    async markUsed(userId: string): Promise<void> {
      const trimmed = userId.trim();
      if (!trimmed) {
        return;
      }

      try {
        await storage.setItem(
          coachHomeBodyFatDiscoveryKey(trimmed),
          COACH_HOME_BODY_FAT_DISCOVERY_USED_VALUE,
        );
      } catch {
        // Best-effort persist. In-memory Coach Home state is independent.
      }
    },
  };
}

export function createMemoryCoachHomeBodyFatDiscoveryKeyValueStore(): CoachHomeBodyFatDiscoveryKeyValueStore {
  const values = new Map<string, string>();

  return {
    async getItem(key: string): Promise<string | null> {
      return values.get(key) ?? null;
    },
    async setItem(key: string, value: string): Promise<void> {
      values.set(key, value);
    },
  };
}
