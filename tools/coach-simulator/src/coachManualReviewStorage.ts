import type { NordyanCoachPromptVersion } from '../shared/coachPromptVersions';

export type ManualReviewDimension =
  | 'soundsLikeNordyanCoach'
  | 'warmButProfessional'
  | 'clear'
  | 'motivating'
  | 'naturalSwedish'
  | 'notRepetitive'
  | 'notPatronizing'
  | 'notOverlyEnthusiastic';

export type ManualReviewRatings = Record<ManualReviewDimension, number>;

export type ManualReviewRecord = {
  scenarioId: string;
  variantIndex: number;
  coachPromptVersion: NordyanCoachPromptVersion;
  batchRunId: string;
  ratings: ManualReviewRatings;
  note?: string;
  updatedAt: string;
};

export const MANUAL_REVIEW_DIMENSIONS: Array<{ id: ManualReviewDimension; label: string }> = [
  { id: 'soundsLikeNordyanCoach', label: 'Sounds like NORDYAN Coach' },
  { id: 'warmButProfessional', label: 'Warm but professional' },
  { id: 'clear', label: 'Clear' },
  { id: 'motivating', label: 'Motivating' },
  { id: 'naturalSwedish', label: 'Natural Swedish' },
  { id: 'notRepetitive', label: 'Not repetitive' },
  { id: 'notPatronizing', label: 'Not patronizing' },
  { id: 'notOverlyEnthusiastic', label: 'Not overly enthusiastic' },
];

export const QA_STORAGE_KEY = 'nordyan-coach-qa-reviews';

export function createEmptyManualRatings(): ManualReviewRatings {
  return {
    soundsLikeNordyanCoach: 0,
    warmButProfessional: 0,
    clear: 0,
    motivating: 0,
    naturalSwedish: 0,
    notRepetitive: 0,
    notPatronizing: 0,
    notOverlyEnthusiastic: 0,
  };
}

export function buildManualReviewKey(
  scenarioId: string,
  variantIndex: number,
  coachPromptVersion: NordyanCoachPromptVersion,
  batchRunId: string,
): string {
  return `${scenarioId}:${variantIndex}:${coachPromptVersion}:${batchRunId}`;
}

export function loadManualReviews(): ManualReviewRecord[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(QA_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as ManualReviewRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveManualReview(record: ManualReviewRecord): ManualReviewRecord[] {
  const reviews = loadManualReviews().filter(
    (item) =>
      buildManualReviewKey(
        item.scenarioId,
        item.variantIndex,
        item.coachPromptVersion,
        item.batchRunId,
      ) !==
      buildManualReviewKey(
        record.scenarioId,
        record.variantIndex,
        record.coachPromptVersion,
        record.batchRunId,
      ),
  );

  reviews.push(record);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(QA_STORAGE_KEY, JSON.stringify(reviews));
  }

  return reviews;
}

export function clearManualReviews(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(QA_STORAGE_KEY);
  }
}

export function findManualReview(
  scenarioId: string,
  variantIndex: number,
  coachPromptVersion: NordyanCoachPromptVersion,
  batchRunId: string,
): ManualReviewRecord | undefined {
  const key = buildManualReviewKey(scenarioId, variantIndex, coachPromptVersion, batchRunId);
  return loadManualReviews().find(
    (item) =>
      buildManualReviewKey(
        item.scenarioId,
        item.variantIndex,
        item.coachPromptVersion,
        item.batchRunId,
      ) === key,
  );
}
