import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseConfig } from '@/lib/core/config/env';
import type { Database } from '@/lib/supabase/database.types';

let client: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (client) {
    return client;
  }

  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  client = createClient<Database>(config.url, config.key, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  });

  return client;
}
