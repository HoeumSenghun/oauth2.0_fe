import "server-only";

import { cookies } from "next/headers";
import { env, getSessionCookieOptions } from "@/lib/env";

export async function hasSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(env.SESSION_COOKIE)?.value);
}

export async function setSessionCookie(value = "1"): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(env.SESSION_COOKIE, value, getSessionCookieOptions());
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(env.SESSION_COOKIE);
}

export async function requireSession(): Promise<void> {
  if (!(await hasSession())) {
    throw new Error("Unauthorized");
  }
}
