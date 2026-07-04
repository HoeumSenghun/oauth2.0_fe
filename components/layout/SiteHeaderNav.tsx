"use client";

import Link from "next/link";
import { useAuthModal } from "@/components/auth/AuthModalContext";
import { UserMenu } from "@/components/auth/UserMenu";
import { SITE_NAME } from "@/lib/site";

type SiteHeaderNavProps = {
  isSignedIn: boolean;
};

export function SiteHeaderNav({ isSignedIn }: SiteHeaderNavProps) {
  const { openLogin, openSignUp } = useAuthModal();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <UserMenu />
          ) : (
            <>
              <button
                type="button"
                onClick={openLogin}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={openSignUp}
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
              >
                Sign up
              </button>
            </>
          )}
        </div>

        <Link
          href={isSignedIn ? "/dashboard" : "/"}
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          {SITE_NAME}
        </Link>
      </div>
    </header>
  );
}
