import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        You are signed in. Replace this with data from your OAuth backend.
      </p>

      {user ? (
        <pre className="mt-8 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          {JSON.stringify(user, null, 2)}
        </pre>
      ) : null}
    </main>
  );
}
