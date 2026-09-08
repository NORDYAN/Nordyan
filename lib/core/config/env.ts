/** Environment variable keys — values are read at runtime when integrations are wired. */
export const envKeys = {
  supabaseUrl: 'EXPO_PUBLIC_SUPABASE_URL',
  supabasePublishableKey: 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  supabaseAnonKey: 'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  /** Public base URL only — never an OpenAI key. */
  coachLanguageApiUrl: 'EXPO_PUBLIC_COACH_LANGUAGE_API_URL',
  /** Public account-delete API URL only — never an Auth Admin secret. */
  accountApiUrl: 'EXPO_PUBLIC_ACCOUNT_API_URL',
  revenueCatAppleApiKey: 'EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY',
  revenueCatGoogleApiKey: 'EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY',
} as const;

export type EnvKey = (typeof envKeys)[keyof typeof envKeys];

export type SupabaseEnvConfig = {
  url: string;
  key: string;
};

/**
 * Reads public Supabase client credentials.
 * Prefers EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY; falls back to legacy anon key.
 * Never use Auth Admin secrets or other secret keys here.
 */
export function getSupabaseConfig(): SupabaseEnvConfig | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const key = publishableKey || anonKey;

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}
