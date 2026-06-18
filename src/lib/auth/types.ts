export type UserRole = 'client' | 'expert';

export type VerificationCodeType = 'email_verification' | 'password_reset';

export interface DbUser {
  id: string;
  email: string;
  password_hash: string | null;
  email_verified: boolean;
  role: UserRole;
  app_origin: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  user_metadata: {
    full_name?: string | null;
    avatar_url?: string | null;
  };
}

export interface AuthSessionPayload {
  sub: string;
  sid: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

export function toAuthUser(user: DbUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.email_verified,
    role: user.role,
    user_metadata: {
      full_name: user.full_name,
      avatar_url: user.avatar_url,
    },
  };
}
