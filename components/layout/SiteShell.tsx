import { Suspense } from "react";
import { AuthModal } from "@/components/auth/AuthModal";
import { AuthModalProvider } from "@/components/auth/AuthModalContext";
import { AuthSessionProvider } from "@/components/auth/AuthSessionContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AuthSessionProvider>
        <AuthModalProvider>
          <SiteHeader />
          <RouteGuard>
            <div className="flex flex-1 flex-col">{children}</div>
          </RouteGuard>
          <SiteFooter />
          <AuthModal />
        </AuthModalProvider>
      </AuthSessionProvider>
    </Suspense>
  );
}
