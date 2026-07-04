"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthSession } from "@/components/auth/AuthSessionContext";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn } = useAuthSession();

  const isHome = pathname === "/";
  const isDashboard = pathname === "/dashboard";
  const shouldRedirect =
    (isDashboard && !isSignedIn) || (isHome && isSignedIn);

  useEffect(() => {
    if (isDashboard && !isSignedIn) {
      router.replace("/?auth=login");
    } else if (isHome && isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isDashboard, isHome, isSignedIn, router]);

  if (shouldRedirect) {
    return (
      <main className="mx-auto flex flex-1 items-center justify-center px-6 py-16">
        <p className="text-sm text-zinc-500">Loading...</p>
      </main>
    );
  }

  return children;
}
