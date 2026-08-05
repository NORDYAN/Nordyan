import type { CoachMessage } from './coachContracts';
import { combinedCoachText, countWords } from './coachLanguageScoring';

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zåäö0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(text: string): Set<string> {
  return new Set(normalizeForComparison(text).split(' ').filter(Boolean));
}

/** Jaccard similarity between two word sets. */
export function textSimilarity(a: string, b: string): number {
  const setA = tokenSet(a);
  const setB = tokenSet(b);

  if (setA.size === 0 && setB.size === 0) {
    return 1;
  }

  const intersection = [...setA].filter((token) => setB.has(token)).length;
  const union = new Set([...setA, ...setB]).size;

  return union === 0 ? 0 : intersection / union;
}

export type RepetitionFlag = {
  variantA: number;
  variantB: number;
  similarity: number;
  reason: 'near_duplicate';
};

const NEAR_DUPLICATE_THRESHOLD = 0.82;

export function detectNearDuplicateVariants(messages: CoachMessage[]): RepetitionFlag[] {
  const flags: RepetitionFlag[] = [];

  for (let i = 0; i < messages.length; i += 1) {
    for (let j = i + 1; j < messages.length; j += 1) {
      const similarity = textSimilarity(
        combinedCoachText(messages[i]),
        combinedCoachText(messages[j]),
      );

      if (similarity >= NEAR_DUPLICATE_THRESHOLD) {
        flags.push({
          variantA: i,
          variantB: j,
          similarity: Number(similarity.toFixed(2)),
          reason: 'near_duplicate',
        });
      }
    }
  }

  return flags;
}

export function tonesAreCompatible(messages: CoachMessage[]): boolean {
  if (messages.length <= 1) {
    return true;
  }

  const tones = new Set(messages.map((message) => message.tone));
  return tones.size <= 2;
}

export function factsPreservedAcrossVariants(
  messages: CoachMessage[],
  expectedAction: string | null,
): boolean {
  return messages.every((message) => message.recommendedAction === expectedAction);
}

export function variantWordCounts(messages: CoachMessage[]): number[] {
  return messages.map((message) => countWords(combinedCoachText(message)));
}
