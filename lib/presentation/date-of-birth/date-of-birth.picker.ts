export const DATE_OF_BIRTH_IOS_DISPLAY = 'spinner' as const;
export const DATE_OF_BIRTH_ANDROID_DISPLAY = 'spinner' as const;

/**
 * Android Material calendar (`display="default"`) requires month-by-month
 * paging. Spinner wheels expose an independent year column so a user can
 * jump decades without traversing months.
 */
export const dateOfBirthPickerConfig = {
  persistFormat: 'YYYY-MM-DD',
  ios: {
    display: DATE_OF_BIRTH_IOS_DISPLAY,
    startOnYearSelection: false,
  },
  android: {
    display: DATE_OF_BIRTH_ANDROID_DISPLAY,
    startOnYearSelection: true,
  },
} as const;
