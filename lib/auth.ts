export type OAuthProvider = "google" | "github";
export type EmailAuthMode = "login" | "signup";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function getOAuthUrl(provider: OAuthProvider): string {
  return `${API_BASE_URL}/auth/${provider}`;
}

export function getEmailAuthUrl(mode: EmailAuthMode): string {
  return mode === "login"
    ? `${API_BASE_URL}/auth/login`
    : `${API_BASE_URL}/auth/register`;
}

export function getLogoutUrl(): string {
  return `${API_BASE_URL}/auth/logout`;
}

export function startOAuth(provider: OAuthProvider): void {
  window.location.href = getOAuthUrl(provider);
}

export function startLogout(): void {
  window.location.href = getLogoutUrl();
}

export async function submitEmailAuth(
  mode: EmailAuthMode,
  payload: { email: string; password: string },
): Promise<void> {
  const response = await fetch(getEmailAuthUrl(mode), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      mode === "login"
        ? "Sign in failed. Check your email and password."
        : "Sign up failed. Please try again.",
    );
  }
}
