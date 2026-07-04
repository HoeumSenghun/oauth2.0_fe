"use client";

import { Suspense } from "react";
import { AuthModal } from "@/components/auth/AuthModal";
import { AuthModalProvider } from "@/components/auth/AuthModalContext";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeaderNav } from "@/components/layout/SiteHeaderNav";

type AuthProvidersProps = {
  children: React.ReactNode;
  isSignedIn: boolean;
};

export function AuthProviders({ children, isSignedIn }: AuthProvidersProps) {
  return (
    <AuthModalProvider>
      <SiteHeaderNav isSignedIn={isSignedIn} />
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter />
      <Suspense fallback={null}>
        <AuthModal />
      </Suspense>
    </AuthModalProvider>
  );
}
