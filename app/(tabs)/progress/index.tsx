import { DevelopmentHomeView } from '@/components/development';
import { useDevelopmentHome } from '@/lib/hooks/development';

export default function DevelopmentHomeScreen() {
  const { state } = useDevelopmentHome();
  return <DevelopmentHomeView state={state} />;
}
