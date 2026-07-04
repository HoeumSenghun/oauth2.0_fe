"use client";

import { useActionState } from "react";
import { loginAction, registerAction } from "@/app/actions/auth";
import type { AuthActionState, EmailAuthMode } from "@/lib/auth.types";

const inputClassName =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500";

const initialState: AuthActionState = {};

type EmailAuthFormProps = {
  mode: EmailAuthMode;
};

export function EmailAuthForm({ mode }: EmailAuthFormProps) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isSignUp = mode === "signup";

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor={`${mode}-email`}
          className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Email
        </label>
        <input
          id={`${mode}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@gmail.com"
          className={inputClassName}
        />
      </div>

      <div>
        <label
          htmlFor={`${mode}-password`}
          className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Password
        </label>
        <input
          id={`${mode}-password`}
          name="password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          required
          minLength={8}
          placeholder="••••••••"
          className={inputClassName}
        />
      </div>

      {isSignUp ? (
        <div>
          <label
            htmlFor={`${mode}-confirm`}
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Confirm password
          </label>
          <input
            id={`${mode}-confirm`}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="••••••••"
            className={inputClassName}
          />
        </div>
      ) : null}

      {state.error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="h-11 w-full rounded-xl bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {isPending ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
