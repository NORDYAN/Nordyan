import { supabaseHealthDataConsentRepository } from '@/lib/repositories/supabase-health-data-consent.repository';

import { DefaultHealthDataConsentService } from './health-data-consent.service';

export { DefaultHealthDataConsentService } from './health-data-consent.service';
export type { HealthDataConsentService } from './health-data-consent.service';

export const healthDataConsentService = new DefaultHealthDataConsentService(
  supabaseHealthDataConsentRepository,
);
