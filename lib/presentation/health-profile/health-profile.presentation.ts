export const HEALTH_PROFILE_DATE_OF_BIRTH_INPUT = 'date-picker' as const;

export const healthProfilePersonalFields = {
  dateOfBirth: {
    input: HEALTH_PROFILE_DATE_OF_BIRTH_INPUT,
    stacked: true,
  },
  height: {
    input: 'measurement' as const,
    stacked: true,
  },
} as const;
