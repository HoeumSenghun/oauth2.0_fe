import { NextResponse } from "next/server";
import {
  callBackendLogout,
  finalizeLogoutResponse,
} from "@/lib/logout";

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const result = await callBackendLogout(cookieHeader);

  if (!result.backendRevoked) {
    console.warn(
      "POST /api/auth/logout: backend logout did not complete; local session cleared",
    );
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  return finalizeLogoutResponse(response, result);
}
