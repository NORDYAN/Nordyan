import { supabaseInitialLifestyleRepository } from '@/lib/repositories/supabase-initial-lifestyle.repository';

import { DefaultInitialLifestyleService } from './initial-lifestyle.service';

export { DefaultInitialLifestyleService } from './initial-lifestyle.service';
export type { InitialLifestyleService } from './initial-lifestyle.service.types';

export const initialLifestyleService = new DefaultInitialLifestyleService(
  supabaseInitialLifestyleRepository,
);
