import { supabaseAuthRepository } from '@/lib/repositories/supabase-auth.repository';
import { createAuthService } from '@/lib/services/auth/auth.service.factory';

export const authService = createAuthService(supabaseAuthRepository);

export { createAuthService };
