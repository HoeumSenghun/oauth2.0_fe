const STORAGE_KEY = "oauth_signed_in";

let signedIn = false;
const listeners = new Set<() => void>();

function readStoredSignedIn(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

if (typeof window !== "undefined") {
  signedIn = readStoredSignedIn();
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function getSignedInSnapshot(): boolean {
  return signedIn;
}

export function getSignedInServerSnapshot(): boolean {
  return false;
}

export function subscribeSignedIn(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setSignedIn(value: boolean): void {
  signedIn = value;

  if (typeof window !== "undefined") {
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  emitChange();
}

export function signOutSession(): void {
  setSignedIn(false);
}
