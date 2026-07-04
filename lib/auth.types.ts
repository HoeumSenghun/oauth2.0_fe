export type OAuthProvider = "google" | "github";
export type EmailAuthMode = "login" | "signup";

export type AuthActionState = {
  error?: string;
};

export const AUTH_ROUTES = {
  login: "/api/auth/login",
  register: "/api/auth/register",
  logout: "/api/auth/logout",
  oauth: (provider: OAuthProvider) => `/api/auth/${provider}`,
  callback: "/auth/callback",
} as const;
