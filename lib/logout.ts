import "server-only";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { fetchWithTimeout, getLogoutUrl } from "@/lib/auth.server";
import { env } from "@/lib/env";
import { clearSessionCookie } from "@/lib/session";

/** Auth cookies issued/cleared by the Spring backend and mirrored on this origin. */
export const BACKEND_AUTH_COOKIES = ["access_token", "refresh_token"] as const;

export type BackendLogoutResult = {
  /** True only when the backend accepted logout (2xx). */
  backendRevoked: boolean;
  /** Raw Set-Cookie headers from the backend (often expire auth cookies). */
  setCookieHeaders: string[];
};

type CookieWriteOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
  maxAge?: number;
};

type ParsedSetCookie = {
  name: string;
  value: string;
  options: CookieWriteOptions;
};

export function buildCookieHeader(
  entries: Array<{ name: string; value: string }>,
): string {
  return entries
    .filter((entry) => entry.name && entry.value !== undefined)
    .map((entry) => `${entry.name}=${entry.value}`)
    .join("; ");
}

export async function getRequestCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return buildCookieHeader(cookieStore.getAll());
}

/**
 * Call the backend logout endpoint with the browser's auth cookies.
 * Does not throw: network/timeout failures yield backendRevoked=false.
 */
export async function callBackendLogout(
  cookieHeader: string,
): Promise<BackendLogoutResult> {
  try {
    const response = await fetchWithTimeout(getLogoutUrl(), {
      method: "POST",
      cache: "no-store",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });

    return {
      backendRevoked: response.ok,
      setCookieHeaders: response.headers.getSetCookie(),
    };
  } catch {
    return { backendRevoked: false, setCookieHeaders: [] };
  }
}

export function parseSetCookieHeader(header: string): ParsedSetCookie | null {
  const parts = header.split(";").map((part) => part.trim());
  const [nameValue, ...attributes] = parts;
  if (!nameValue) {
    return null;
  }

  const separatorIndex = nameValue.indexOf("=");
  if (separatorIndex === -1) {
    return null;
  }

  const name = nameValue.slice(0, separatorIndex).trim();
  const value = nameValue.slice(separatorIndex + 1).trim();
  if (!name) {
    return null;
  }

  const options: CookieWriteOptions = {
    path: "/",
    sameSite: "lax",
    secure: env.isProduction,
    httpOnly: false,
  };

  for (const attribute of attributes) {
    const [rawKey, ...rawValue] = attribute.split("=");
    const key = rawKey.trim().toLowerCase();
    const attrValue = rawValue.join("=").trim();

    if (key === "httponly") {
      options.httpOnly = true;
    } else if (key === "secure") {
      options.secure = true;
    } else if (key === "path" && attrValue) {
      options.path = attrValue;
    } else if (key === "max-age" && attrValue) {
      const maxAge = Number(attrValue);
      if (!Number.isNaN(maxAge)) {
        options.maxAge = maxAge;
      }
    } else if (key === "samesite" && attrValue) {
      const sameSite = attrValue.toLowerCase();
      if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") {
        options.sameSite = sameSite;
      }
    }
  }

  return { name, value, options };
}

/** Apply backend Set-Cookie headers via next/headers (Server Actions). */
export async function applySetCookieHeaders(
  setCookieHeaders: string[],
): Promise<void> {
  const cookieStore = await cookies();

  for (const header of setCookieHeaders) {
    const parsed = parseSetCookieHeader(header);
    if (!parsed) {
      continue;
    }
    cookieStore.set(parsed.name, parsed.value, parsed.options);
  }
}

/** Apply backend Set-Cookie headers onto a Route Handler response. */
export function applySetCookieHeadersToResponse(
  response: NextResponse,
  setCookieHeaders: string[],
): void {
  for (const header of setCookieHeaders) {
    const parsed = parseSetCookieHeader(header);
    if (!parsed) {
      continue;
    }
    response.cookies.set(parsed.name, parsed.value, parsed.options);
  }
}

/**
 * Clear mirrored backend auth cookies on this origin.
 * Uses the known cookie names/paths when the backend did not return Set-Cookie.
 */
export async function clearMirroredAuthCookies(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set("access_token", "", {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  cookieStore.set("refresh_token", "", {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 0,
  });
}

export function clearMirroredAuthCookiesOnResponse(response: NextResponse): void {
  response.cookies.set("access_token", "", {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 0,
  });
}

/**
 * Full local + backend logout used by both the Server Action and POST route.
 * Always clears the frontend session marker. Backend revocation is best-effort:
 * failure is reported via backendRevoked=false (never pretended to succeed).
 */
export async function performLogout(): Promise<BackendLogoutResult> {
  const cookieHeader = await getRequestCookieHeader();
  const result = await callBackendLogout(cookieHeader);

  if (result.setCookieHeaders.length > 0) {
    await applySetCookieHeaders(result.setCookieHeaders);
  } else {
    await clearMirroredAuthCookies();
  }

  await clearSessionCookie();
  return result;
}

export function finalizeLogoutResponse(
  response: NextResponse,
  result: BackendLogoutResult,
): NextResponse {
  if (result.setCookieHeaders.length > 0) {
    applySetCookieHeadersToResponse(response, result.setCookieHeaders);
  } else {
    clearMirroredAuthCookiesOnResponse(response);
  }

  response.cookies.set(env.SESSION_COOKIE, "", {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
