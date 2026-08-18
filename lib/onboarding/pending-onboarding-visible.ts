/**
 * Onboarding screens must show the same logical bundle that persist will use.
 * Another user's bound record is never passed in as ownedByViewer or unowned.
 */
export function selectVisiblePendingValue<T>(input: {
  viewerUserId: string | null;
  ownedByViewer: T | null;
  unowned: T | null;
}): T | null {
  if (input.viewerUserId && input.ownedByViewer) {
    return input.ownedByViewer;
  }

  return input.unowned;
}
