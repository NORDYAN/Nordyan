export type PendingKeyValueStore = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export function createMemoryPendingKeyValueStore(): PendingKeyValueStore {
  const values = new Map<string, string>();

  return {
    async getItem(key: string): Promise<string | null> {
      return values.get(key) ?? null;
    },
    async setItem(key: string, value: string): Promise<void> {
      values.set(key, value);
    },
    async removeItem(key: string): Promise<void> {
      values.delete(key);
    },
  };
}
