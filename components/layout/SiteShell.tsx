import { Suspense } from "react";
import { AuthProviders } from "@/components/layout/AuthProviders";
import { hasSession } from "@/lib/session";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const isSignedIn = await hasSession();

  return (
    <Suspense fallback={null}>
      <AuthProviders isSignedIn={isSignedIn}>{children}</AuthProviders>
    </Suspense>
  );
}
