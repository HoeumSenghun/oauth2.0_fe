const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://oauth2-0-be.onrender.com";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "oauth_session";

export const env = {
  API_URL,
  APP_URL,
  SESSION_COOKIE,
  isProduction: process.env.NODE_ENV === "production",
} as const;

/** Frontend OAuth return URL after backend finishes Google/GitHub login */
export function getOAuthRedirectUri(): string {
  return `${env.APP_URL}/auth/callback`;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}
