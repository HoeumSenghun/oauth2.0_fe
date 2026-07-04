import { NextResponse } from "next/server";
import { getLogoutUrl } from "@/lib/auth.server";
import { clearSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  try {
    await fetch(getLogoutUrl(), { method: "POST", cache: "no-store" });
  } catch {
    // Allow local logout even if backend is down.
  }

  await clearSessionCookie();

  return NextResponse.redirect(new URL("/", request.url));
}
