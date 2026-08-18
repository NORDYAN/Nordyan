import { supabaseAuthRepository } from '@/lib/repositories/supabase-auth.repository';
import { supabaseProfileRepository } from '@/lib/repositories/supabase-profile.repository';

import { DefaultProfileService } from './profile.service';

export const profileService = new DefaultProfileService({
  getCurrentUser: () => supabaseAuthRepository.getCurrentUser(),
  profileRepository: supabaseProfileRepository,
});
