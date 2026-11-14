# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start the dev server (Next.js, Turbopack by default)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint (flat config via `eslint.config.mjs`, `eslint-config-next`)

There is no test suite configured in this repo.

## Architecture

This is a Next.js App Router frontend that is a thin client for a separate Spring Boot backend (`NEXT_PUBLIC_API_URL`, default `https://oauth2-0-be.onrender.com`). This repo has no database and no real auth logic of its own — it only brokers cookies/redirects between the browser and the backend.

### This is Next.js 16 — "Middleware" is renamed "Proxy"

`proxy.ts` (project root) is the replacement for the old `middleware.ts` convention — same semantics, new name/export (`export function proxy(...)`, same `config.matcher`). Do not create a `middleware.ts` file; it won't be picked up. See `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` for the full convention, and check the rest of `node_modules/next/dist/docs/` before relying on API shape from training data — this package has diverged from upstream Next.js in ways that aren't yet reflected in most tooling/knowledge.

### Auth flow (the core thing to understand before touching anything here)

There are two parallel session mechanisms because the backend and frontend are on different origins (`oauth2-0-be.onrender.com` vs the Netlify app), so the backend's own cookies can't simply be set on the frontend origin:

1. **Email/password** (`app/actions/auth.ts`, Server Actions `loginAction`/`registerAction`/`logoutAction`): the frontend calls the backend directly via `backendFetch` (`lib/auth.server.ts`), then manually re-plays every `Set-Cookie` header from the backend response onto the frontend's own response in `persistSessionFromResponse` — a server-to-server fetch's `Set-Cookie` is never relayed to the real browser automatically, so this has to be done by hand or the browser never gets a working session.
2. **OAuth (Google/GitHub)**: `app/api/auth/[provider]/route.ts` redirects the browser straight to the backend's `/oauth2/authorization/{provider}` (no `redirect_uri` is passed — the backend is configured to always return to `NEXT_PUBLIC_APP_URL/auth/callback`). The backend redirects back to `app/auth/callback/route.ts` either with a `?token=` query param (because backend-set cookies aren't visible to this frontend's origin) or with nothing, in which case the route falls back to checking `/api/auth/me` using whatever cookies the browser already has.

Both paths converge on a frontend-only `oauth_session` cookie (`SESSION_COOKIE_NAME`, default `oauth_session`) set via `lib/session.ts`. This cookie is **just a flag** — it does not carry the actual credential; it exists purely so `proxy.ts` and server components can cheaply check "is someone logged in" without calling the backend. The actual credential is whatever cookie(s) the backend issued (or the `access_token` cookie set directly in the OAuth callback). `lib/auth.server.ts#getCurrentUser` always re-validates against the backend's `/api/auth/me` using the forwarded cookie header — never trust `hasSession()` alone for anything that returns user data.

`proxy.ts` only does the cheap optimistic redirect (protects `/dashboard/*`, bounces signed-in users away from `/` and `/auth/callback`) per the Proxy docs' own guidance that it's not a full session/authorization solution.

### Route map

- `app/page.tsx` — marketing/home page; login/signup happens in a modal (`components/auth/AuthModal.tsx`) driven by the `?auth=login|signup` query param, not a dedicated route (see `AuthModalContext.tsx`).
- `app/dashboard/page.tsx` — protected page; double-checks `hasSession()` itself even though `proxy.ts` already guards `/dashboard/:path*`.
- `app/auth/callback/route.ts` — OAuth landing route, see above.
- `app/api/auth/[provider]/route.ts` — kicks off OAuth for `google`/`github`.
- `app/api/auth/logout/route.ts` — logout via a plain GET-redirecting route (separate from the `logoutAction` Server Action used by the UI).

### Env vars

Defined/documented in `.env.example`, read via `lib/env.ts` (which supplies hardcoded fallbacks — `lib/env.ts` is the single source of truth for defaults, don't duplicate `process.env.NEXT_PUBLIC_API_URL` lookups elsewhere):

- `NEXT_PUBLIC_API_URL` — backend origin
- `NEXT_PUBLIC_APP_URL` — this frontend's own origin (used to build the OAuth `redirect_uri` target)
- `SESSION_COOKIE_NAME` — name of the frontend-only session-flag cookie

### Deployment

Deploys to Netlify (`netlify.toml`, `@netlify/plugin-nextjs`) — not Vercel, despite the generated README's Vercel-oriented boilerplate.
