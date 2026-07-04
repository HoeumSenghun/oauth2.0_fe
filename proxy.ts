import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

const PUBLIC_PATHS = new Set(["/", "/auth/callback"]);

function isProtectedPath(pathname: string): boolean {
  return pathname.startsWith("/dashboard");
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const hasSession = Boolean(
    request.cookies.get(env.SESSION_COOKIE)?.value,
  );

  if (isProtectedPath(pathname) && !hasSession) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("auth", "login");
    return NextResponse.redirect(loginUrl);
  }

  if (PUBLIC_PATHS.has(pathname) && hasSession && !searchParams.get("auth")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/auth/callback"],
};
