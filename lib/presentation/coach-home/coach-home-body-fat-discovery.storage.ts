import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createCoachHomeBodyFatDiscoveryStore,
  type CoachHomeBodyFatDiscoveryStore,
} from './coach-home-body-fat-discovery.store';

const coachHomeBodyFatDiscoveryStore: CoachHomeBodyFatDiscoveryStore =
  createCoachHomeBodyFatDiscoveryStore(AsyncStorage);

export function getCoachHomeBodyFatComparisonUsed(userId: string): Promise<boolean> {
  return coachHomeBodyFatDiscoveryStore.getUsed(userId);
}

export function markCoachHomeBodyFatComparisonUsed(userId: string): Promise<void> {
  return coachHomeBodyFatDiscoveryStore.markUsed(userId);
}
