/**
 * Home-only Weekly Check-in status.
 * Isolated from the Veckokoll wizard, Health Score, Focus, Coach, and Plan.
 * Never includes the eight answers.
 */

export type HomeWeeklyCheckInStatus =
  | { status: 'loading' }
  | { status: 'available'; weekStartDate: string }
  | { status: 'completed'; weekStartDate: string }
  | { status: 'suppressed'; weekStartDate: string }
  | { status: 'unavailable' };

export type HomeWeeklyCheckInResolvedStatus = Exclude<
  HomeWeeklyCheckInStatus,
  { status: 'loading' }
>;
