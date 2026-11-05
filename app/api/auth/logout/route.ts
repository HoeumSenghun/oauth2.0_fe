import { NextResponse } from "next/server";
import { fetchWithTimeout, getLogoutUrl } from "@/lib/auth.server";
import { clearSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  try {
    await fetchWithTimeout(getLogoutUrl(), { method: "POST", cache: "no-store" });
  } catch {
    // Allow logout even if the backend is down or slow to respond.
  }

  await clearSessionCookie();

  return NextResponse.redirect(new URL("/", request.url));
}
