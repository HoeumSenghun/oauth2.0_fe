import { Suspense } from "react";
import { AuthProviders } from "@/components/layout/AuthProviders";
import { getCurrentUser } from "@/lib/auth.server";
import { hasSession } from "@/lib/session";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const isSignedIn = await hasSession();
  const user = isSignedIn ? await getCurrentUser() : null;

  return (
    <Suspense fallback={null}>
      <AuthProviders isSignedIn={isSignedIn} user={user}>
        {children}
      </AuthProviders>
    </Suspense>
  );
}
