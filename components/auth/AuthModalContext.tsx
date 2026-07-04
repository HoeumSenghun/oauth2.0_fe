"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type AuthModalType = "login" | "signup";

type AuthModalContextValue = {
  activeModal: AuthModalType | null;
  openLogin: () => void;
  openSignUp: () => void;
  closeModal: () => void;
  switchToLogin: () => void;
  switchToSignUp: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

function parseAuthParam(value: string | null): AuthModalType | null {
  if (value === "login" || value === "signup") {
    return value;
  }
  return null;
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeModal = parseAuthParam(searchParams.get("auth"));

  const updateUrl = useCallback(
    (modal: AuthModalType | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (modal) {
        params.set("auth", modal);
      } else {
        params.delete("auth");
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const openLogin = useCallback(() => {
    updateUrl("login");
  }, [updateUrl]);

  const openSignUp = useCallback(() => {
    updateUrl("signup");
  }, [updateUrl]);

  const closeModal = useCallback(() => {
    updateUrl(null);
  }, [updateUrl]);

  const switchToLogin = useCallback(() => {
    updateUrl("login");
  }, [updateUrl]);

  const switchToSignUp = useCallback(() => {
    updateUrl("signup");
  }, [updateUrl]);

  const value = useMemo(
    () => ({
      activeModal,
      openLogin,
      openSignUp,
      closeModal,
      switchToLogin,
      switchToSignUp,
    }),
    [
      activeModal,
      openLogin,
      openSignUp,
      closeModal,
      switchToLogin,
      switchToSignUp,
    ],
  );

  return (
    <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);

  if (!context) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }

  return context;
}
