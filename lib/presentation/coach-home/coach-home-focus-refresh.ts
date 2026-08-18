/**
 * Coach tabs stay mounted. Refetch persisted Focus and Plan on focus so a
 * newly-created measurement snapshot is reflected without restarting the app.
 * Existing ready content remains rendered during the silent refresh.
 */
export const COACH_HOME_FOCUS_REFRESH = {
  refetchOnFocus: true,
  showLoading: false,
} as const;
