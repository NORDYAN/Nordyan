export function liveCopy<T extends Record<string, string>>(
  factories: { [K in keyof T]: () => T[K] },
): T {
  const target = {} as T;
  for (const key of Object.keys(factories) as (keyof T)[]) {
    Object.defineProperty(target, key, {
      enumerable: true,
      get: factories[key],
    });
  }
  return target;
}

export function liveArray<T>(factory: () => readonly T[]): readonly T[] {
  return new Proxy([] as T[], {
    get(_target, prop) {
      const current = factory();
      const value = Reflect.get(current, prop, current);
      if (typeof value === 'function') {
        return (value as (...args: unknown[]) => unknown).bind(current);
      }
      return value;
    },
  }) as readonly T[];
}
