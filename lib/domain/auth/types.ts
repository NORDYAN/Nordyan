export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

export type AuthUser = {
  id: string;
  email: string | null;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  expiresAt: number | null;
};
