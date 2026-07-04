"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  getSignedInServerSnapshot,
  getSignedInSnapshot,
  setSignedIn as persistSignedIn,
  signOutSession,
  subscribeSignedIn,
} from "@/lib/auth-session";

type AuthSessionContextValue = {
  isSignedIn: boolean;
  setSignedIn: (value: boolean) => void;
  signOut: () => void;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isSignedIn = useSyncExternalStore(
    subscribeSignedIn,
    getSignedInSnapshot,
    getSignedInServerSnapshot,
  );

  const setSignedIn = useCallback((value: boolean) => {
    persistSignedIn(value);
  }, []);

  const signOut = useCallback(() => {
    signOutSession();
  }, []);

  const value = useMemo(
    () => ({
      isSignedIn,
      setSignedIn,
      signOut,
    }),
    [isSignedIn, setSignedIn, signOut],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }

  return context;
}
