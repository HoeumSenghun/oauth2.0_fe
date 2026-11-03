export type OAuthProvider = "google" | "github";
export type EmailAuthMode = "login" | "signup";

export type AuthActionState = {
  error?: string;
};

export type CurrentUser = {
  id: number;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
};

export function displayName(user: Pick<CurrentUser, "name" | "email">): string {
  const name = user.name?.trim();
  return name || user.email;
}

export const AUTH_ROUTES = {
  login: "/api/auth/login",
  register: "/api/auth/register",
  logout: "/api/auth/logout",
  oauth: (provider: OAuthProvider) => `/api/auth/${provider}`,
  callback: "/auth/callback",
} as const;
