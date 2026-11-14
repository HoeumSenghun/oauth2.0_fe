"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendFetch, fetchWithTimeout, getLogoutUrl } from "@/lib/auth.server";
import { env } from "@/lib/env";
import type { AuthActionState } from "@/lib/auth.types";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";

const SERVICE_UNAVAILABLE_ERROR =
  "Service temporarily unavailable. Please try again in a moment.";

// A server-to-server fetch's Set-Cookie response header is never relayed to
// the real browser automatically (unlike a browser-initiated redirect/fetch).
// The backend's access_token/refresh_token cookies have to be re-set here by
// hand, or the browser never actually receives a working backend session.
async function persistSessionFromResponse(response: Response): Promise<void> {
  if (!response.ok) {
    return;
  }

  const cookieStore = await cookies();
  for (const setCookieHeader of response.headers.getSetCookie()) {
    const [nameValue] = setCookieHeader.split(";");
    const separatorIndex = nameValue.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }
    const name = nameValue.slice(0, separatorIndex).trim();
    const value = nameValue.slice(separatorIndex + 1).trim();
    if (!name || !value) {
      continue;
    }
    cookieStore.set(name, value, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: env.isProduction,
    });
  }

  await setSessionCookie();
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  let response: Response;
  try {
    response = await backendFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return { error: SERVICE_UNAVAILABLE_ERROR };
  }

  if (!response.ok) {
    return { error: "Sign in failed. Check your email and password." };
  }

  await persistSessionFromResponse(response);
  redirect("/dashboard");
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  let response: Response;
  try {
    response = await backendFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return { error: SERVICE_UNAVAILABLE_ERROR };
  }

  if (!response.ok) {
    return { error: "Sign up failed. Please try again." };
  }

  await persistSessionFromResponse(response);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  try {
    await fetchWithTimeout(getLogoutUrl(), { method: "POST", cache: "no-store" });
  } catch {
    // Backend may be unavailable or slow to respond — logout still proceeds
    // locally below, since clearing our own session cookie never depends on it.
  }

  await clearSessionCookie();
  redirect("/");
}
