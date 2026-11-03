"use client";

import { Suspense } from "react";
import { AuthModal } from "@/components/auth/AuthModal";
import { AuthModalProvider } from "@/components/auth/AuthModalContext";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeaderNav } from "@/components/layout/SiteHeaderNav";
import type { CurrentUser } from "@/lib/auth.types";

type AuthProvidersProps = {
  children: React.ReactNode;
  isSignedIn: boolean;
  user: CurrentUser | null;
};

export function AuthProviders({ children, isSignedIn, user }: AuthProvidersProps) {
  return (
    <AuthModalProvider>
      <SiteHeaderNav isSignedIn={isSignedIn} user={user} />
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter />
      <Suspense fallback={null}>
        <AuthModal />
      </Suspense>
    </AuthModalProvider>
  );
}
