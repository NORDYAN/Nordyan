import { router } from 'expo-router';

import { HealthScoreExplainedView } from '@/components/health-score-explained';
import { useHealthScoreExplained } from '@/lib/hooks/health-score-explained';

export default function HealthScoreScreen() {
  const { state } = useHealthScoreExplained();

  return (
    <HealthScoreExplainedView state={state} onBackPress={() => router.back()} />
  );
}
