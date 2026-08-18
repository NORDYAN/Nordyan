import { DevelopmentTrendsView } from '@/components/development';
import { useDevelopmentTrends } from '@/lib/hooks/development';

export default function DevelopmentTrendsScreen() {
  const {
    state,
    period,
    metric,
    setPeriod,
    setMetric,
    periodOptions,
    metricOptions,
  } = useDevelopmentTrends();

  return (
    <DevelopmentTrendsView
      state={state}
      period={period}
      metric={metric}
      periodOptions={periodOptions}
      metricOptions={metricOptions}
      onPeriodChange={setPeriod}
      onMetricChange={setMetric}
    />
  );
}
