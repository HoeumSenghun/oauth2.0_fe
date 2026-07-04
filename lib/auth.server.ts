import "server-only";

import { env } from "@/lib/env";
import type { EmailAuthMode, OAuthProvider } from "@/lib/auth.types";

export function getOAuthUrl(provider: OAuthProvider): string {
  return `${env.API_URL}/auth/${provider}`;
}

export function getEmailAuthUrl(mode: EmailAuthMode): string {
  return mode === "login"
    ? `${env.API_URL}/auth/login`
    : `${env.API_URL}/auth/register`;
}

export function getLogoutUrl(): string {
  return `${env.API_URL}/auth/logout`;
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

export async function getCurrentUser(): Promise<Record<string, unknown> | null> {
  const response = await backendFetch("/auth/me");

  if (!response.ok) {
    return null;
  }

  return response.json();
}
