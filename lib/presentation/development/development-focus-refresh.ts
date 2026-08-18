/**
 * Development screens stay mounted inside Expo tabs. Refetch snapshot history
 * on focus so new measurements appear without restarting the app.
 * Silent refresh avoids replacing an already-rendered view with a loading flash.
 */
export const DEVELOPMENT_FOCUS_REFRESH = {
  home: {
    refetchOnFocus: true,
    showLoading: false,
  },
  trends: {
    refetchOnFocus: true,
    showLoading: false,
    preservePeriod: true,
  },
} as const;
