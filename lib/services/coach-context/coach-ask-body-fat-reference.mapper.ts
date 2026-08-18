import { compareBodyFatToAcsmReference } from '@/lib/domain/body-fat-reference';
import type {
  CoachAskAgeBand,
  CoachAskBodyComposition,
  CoachAskBodyFatReference,
  CoachAskSex,
} from '@/shared/coach-language';

/**
 * Maps already-derived Coach Ask facts onto the ACSM comparison result.
 * Does not send the raw table, DOB, exact age, or Health Score midpoints.
 */
export function mapBodyFatReferenceForCoachAsk(input: {
  bodyComposition: CoachAskBodyComposition;
  ageBand: CoachAskAgeBand | null;
  sex: CoachAskSex | null;
}): CoachAskBodyFatReference {
  return compareBodyFatToAcsmReference({
    bodyFatPercent:
      input.bodyComposition.status === 'ready' ? input.bodyComposition.bodyFatPercent : null,
    ageBand: input.ageBand,
    sex: input.sex,
  });
}
