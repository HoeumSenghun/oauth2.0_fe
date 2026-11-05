import "server-only";

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { CurrentUser, EmailAuthMode, OAuthProvider } from "@/lib/auth.types";

// Render's free tier can cold-start in 30-50s+. Routes that call the backend
// (Server Actions, Route Handlers) run inside platform functions with their
// own hard execution limits, so every outbound call needs its own bound —
// otherwise a slow/unreachable backend hangs the caller indefinitely instead
// of failing fast with a message the UI can show.
const BACKEND_TIMEOUT_MS = 8000;

export async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs = BACKEND_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

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
  return fetchWithTimeout(`${env.API_URL}${path}`, {
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

  // Never let a slow/unreachable backend take down every page that renders
  // the header (SiteShell calls this on every request). Treat any failure
  // the same as "could not verify" rather than crashing or hanging — this
  // only withholds profile data, it never grants access (hasSession() is
  // the actual gate, and it's a pure cookie check unaffected by the backend).
  let response: Response;
  try {
    response = await backendFetch("/api/auth/me", {
      headers: cookie ? { cookie } : {},
    });
  } catch (error) {
    console.error("getCurrentUser: backend unreachable", error);
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const body: unknown = await response.json();
  return isCurrentUser(body) ? body : null;
}
