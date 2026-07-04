import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Home",
  description: "OAuth frontend for Google and GitHub backend integration",
};

export default function Home() {
  return (
    <main className="mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-4xl font-semibold text-zinc-900 dark:text-zinc-50 sm:text-5xl">
        {SITE_NAME}
      </h1>
      <p className="mt-4 max-w-md text-zinc-600 dark:text-zinc-400">
        OAuth frontend sample. Sign in or sign up from the navbar to connect
        Google and GitHub with your backend.
      </p>
    </main>
  );
}
