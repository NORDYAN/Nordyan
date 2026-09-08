const consumedNotificationResponseIds = new Set<string>();

/**
 * Returns true the first time this identifier is seen in this JS session.
 * Non-string / empty / whitespace identifiers are a safe no-op (return false).
 */
export function markNotificationResponseConsumed(
  identifier: string | null | undefined,
): boolean {
  if (typeof identifier !== 'string') {
    return false;
  }

  const id = identifier.trim();
  if (!id || consumedNotificationResponseIds.has(id)) {
    return false;
  }

  consumedNotificationResponseIds.add(id);
  return true;
}

export function resetConsumedNotificationResponsesForTests(): void {
  consumedNotificationResponseIds.clear();
}
