import "server-only";

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { CurrentUser, EmailAuthMode, OAuthProvider } from "@/lib/auth.types";

/**
 * Start Spring OAuth2 login.
 * Do NOT pass redirect_uri here — Google/GitHub must use the backend callback:
 *   https://oauth2-0-be.onrender.com/login/oauth2/code/{provider}
 * Backend should redirect the browser to NEXT_PUBLIC_APP_URL/auth/callback after success.
 */
export function getOAuthUrl(provider: OAuthProvider): string {
  return `${env.API_URL}/oauth2/authorization/${provider}`;
}

export function getEmailAuthUrl(mode: EmailAuthMode): string {
  return mode === "login"
    ? `${env.API_URL}/api/auth/login`
    : `${env.API_URL}/api/auth/register`;
}

export function getLogoutUrl(): string {
  return `${env.API_URL}/api/auth/logout`;
}

export async function backendFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${env.API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
}

function isCurrentUser(value: unknown): value is CurrentUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Record<string, unknown>;
  return (
    typeof user.email === "string" &&
    (user.name === null || typeof user.name === "string") &&
    (user.avatarUrl === null || typeof user.avatarUrl === "string")
  );
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore
    .getAll()
    .map((entry) => `${entry.name}=${entry.value}`)
    .join("; ");
  const response = await backendFetch("/api/auth/me", {
    headers: cookie ? { cookie } : {},
  });

  if (!response.ok) {
    return null;
  }

  const body: unknown = await response.json();
  return isCurrentUser(body) ? body : null;
}
