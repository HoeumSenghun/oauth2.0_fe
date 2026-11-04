import { NextResponse, type NextRequest } from "next/server";
import { backendFetch } from "@/lib/auth.server";
import { env, getSessionCookieOptions } from "@/lib/env";
import { setSessionCookie } from "@/lib/session";

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error");
  const token = request.nextUrl.searchParams.get("token");

  if (error) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("auth", "login");
    loginUrl.searchParams.set("error", error);
    return NextResponse.redirect(loginUrl);
  }

  // Backend OAuth success redirects here with ?token=JWT because cookies set on
  // oauth2-0-be.onrender.com are not available to this frontend origin.
  if (token) {
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set("access_token", token, getSessionCookieOptions());
    response.cookies.set(env.SESSION_COOKIE, "1", getSessionCookieOptions());
    return response;
  }

  const meResponse = await backendFetch("/api/auth/me", {
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });

  if (meResponse.ok) {
    await setSessionCookie();
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const loginUrl = new URL("/", request.url);
  loginUrl.searchParams.set("auth", "login");
  loginUrl.searchParams.set("error", "oauth_failed");
  return NextResponse.redirect(loginUrl);
}
