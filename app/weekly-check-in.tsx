import { router } from 'expo-router';

import { WeeklyCheckInView } from '@/components/weekly-check-in';
import { routes } from '@/constants/routes';
import { useWeeklyCheckIn } from '@/lib/hooks/weekly-check-in';

export default function WeeklyCheckInScreen() {
  const flow = useWeeklyCheckIn();

  return (
    <WeeklyCheckInView flow={flow} onExit={() => router.replace(routes.home)} />
  );
}
