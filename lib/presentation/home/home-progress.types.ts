import type { ProgressSummary } from '@/lib/domain/progress';

export type HomeProgressFetchState =
  | { status: 'loading' }
  | { status: 'unavailable'; message: string }
  | { status: 'loaded'; summary: ProgressSummary };
