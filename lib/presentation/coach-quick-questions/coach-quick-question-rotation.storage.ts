import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createCoachQuickQuestionRotationStore,
  type CoachQuickQuestionRotationStore,
} from './coach-quick-question-rotation.store';

const coachQuickQuestionRotationStore: CoachQuickQuestionRotationStore =
  createCoachQuickQuestionRotationStore(AsyncStorage);

export function readCoachQuickQuestionRotation(userId: string) {
  return coachQuickQuestionRotationStore.read(userId);
}

export function writeCoachQuickQuestionRotation(
  userId: string,
  state: Parameters<CoachQuickQuestionRotationStore['write']>[1],
) {
  return coachQuickQuestionRotationStore.write(userId, state);
}
