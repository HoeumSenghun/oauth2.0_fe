import { NextResponse, type NextRequest } from "next/server";
import { backendFetch } from "@/lib/auth.server";
import { setSessionCookie } from "@/lib/session";

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("auth", "login");
    loginUrl.searchParams.set("error", error);
    return NextResponse.redirect(loginUrl);
  }

  const meResponse = await backendFetch("/auth/me");

  if (meResponse.ok) {
    await setSessionCookie();
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const loginUrl = new URL("/", request.url);
  loginUrl.searchParams.set("auth", "login");
  loginUrl.searchParams.set("error", "oauth_failed");
  return NextResponse.redirect(loginUrl);
}
