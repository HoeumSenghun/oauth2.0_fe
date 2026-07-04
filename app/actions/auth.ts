"use server";

import { redirect } from "next/navigation";
import { backendFetch, getLogoutUrl } from "@/lib/auth.server";
import type { AuthActionState } from "@/lib/auth.types";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";

async function persistSessionFromResponse(response: Response): Promise<void> {
  if (!response.ok) {
    return;
  }

  try {
    const data = (await response.clone().json()) as {
      token?: string;
      session?: string;
    };

    await setSessionCookie(data.token ?? data.session ?? "1");
    return;
  } catch {
    await setSessionCookie();
  }
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

  const response = await backendFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

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

  const response = await backendFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    return { error: "Sign up failed. Please try again." };
  }

  await persistSessionFromResponse(response);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  try {
    await fetch(getLogoutUrl(), { method: "POST", cache: "no-store" });
  } catch {
    // Backend may be unavailable during local development.
  }

  await clearSessionCookie();
  redirect("/");
}
