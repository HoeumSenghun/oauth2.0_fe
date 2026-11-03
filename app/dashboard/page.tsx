import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { displayName } from "@/lib/auth.types";
import { getCurrentUser } from "@/lib/auth.server";
import { hasSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Authenticated dashboard",
};

export default async function DashboardPage() {
  if (!(await hasSession())) {
    redirect("/?auth=login");
  }

  const user = await getCurrentUser();

  return (
    <main className="mx-auto flex max-w-5xl flex-1 flex-col px-6 py-16">
      <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
        Dashboard
      </h1>
      {user ? (
        <div className="mt-8 flex items-center gap-4">
          <UserAvatar
            name={displayName(user)}
            avatarUrl={user.avatarUrl}
            size="lg"
          />
          <div className="min-w-0">
            <p className="truncate text-xl font-medium text-zinc-900 dark:text-zinc-50">
              {displayName(user)}
            </p>
            <p className="truncate text-sm text-zinc-500">{user.email}</p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Signed in, but the profile could not be loaded.
        </p>
      )}
    </main>
  );
}
