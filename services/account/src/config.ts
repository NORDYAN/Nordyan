/** Server-only configuration. Secrets are never exposed to clients. */
export type AccountServerConfig = {
  port: number;
  isDevelopment: boolean;
  supabaseUrl: string | undefined;
  supabaseAnonKey: string | undefined;
  supabaseServiceRoleKey: string | undefined;
};

export function loadAccountServerConfig(env: NodeJS.ProcessEnv = process.env): AccountServerConfig {
  const supabaseAnonKey =
    env.SUPABASE_ANON_KEY?.trim() || env.SUPABASE_PUBLISHABLE_KEY?.trim() || undefined;

  return {
    port: Number(env.ACCOUNT_SERVER_PORT ?? '8789'),
    isDevelopment: env.NODE_ENV !== 'production',
    supabaseUrl: env.SUPABASE_URL?.trim() || undefined,
    supabaseAnonKey,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined,
  };
}

export function isSupabaseAuthConfigured(config: AccountServerConfig): boolean {
  return Boolean(config.supabaseUrl && config.supabaseAnonKey);
}

export function isAccountAdminConfigured(config: AccountServerConfig): boolean {
  return Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
}
