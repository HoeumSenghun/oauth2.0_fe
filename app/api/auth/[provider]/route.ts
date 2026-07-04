import { NextResponse } from "next/server";
import { getOAuthUrl } from "@/lib/auth.server";
import type { OAuthProvider } from "@/lib/auth.types";

type RouteContext = {
  params: Promise<{ provider: string }>;
};

const providers = new Set<OAuthProvider>(["google", "github"]);

export async function GET(_request: Request, context: RouteContext) {
  const { provider } = await context.params;

  if (!providers.has(provider as OAuthProvider)) {
    return NextResponse.json({ error: "Unsupported provider" }, { status: 404 });
  }

  return NextResponse.redirect(getOAuthUrl(provider as OAuthProvider));
}
