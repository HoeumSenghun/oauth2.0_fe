---
name: run-oauth_fe
description: Build, run, and drive the oauth_fe Next.js frontend. Use when asked to start oauth_fe, run its dev server, build it, take a screenshot of its UI, or interact with the sign-in modal / dashboard / proxy redirects.
---

Next.js 16 App Router frontend with no backend of its own — it's a thin
client for a separate Spring Boot API (`NEXT_PUBLIC_API_URL`). Drive it
by starting the dev server, then piping commands to the Playwright REPL
driver at `.claude/skills/run-oauth_fe/driver.mjs` (chromium-cli is not
available in this environment, so this project has its own minimal
equivalent).

All paths below are relative to the repo root.

## Prerequisites / Setup

Playwright + a local Chromium build are already dev dependencies /
already downloaded in this repo (added for this driver):

```bash
npm install                               # installs playwright among normal deps
npx playwright install chromium           # downloads the browser binary (~200MB, one-time, cached under %LOCALAPPDATA%\ms-playwright)
```

No other setup is required — `.env.local` already has working defaults
(`NEXT_PUBLIC_API_URL=https://oauth2-0-be.onrender.com`,
`NEXT_PUBLIC_APP_URL=http://localhost:3000`).

## Build

Not required to drive the dev server. If you need a production build:

```bash
npm run build
```

## Run (agent path)

Start the dev server in the background and poll until it answers,
rather than sleeping a fixed amount — Turbopack is fast (~1s) but don't
race it:

```bash
npm run dev > /tmp/oauth_fe_dev.log 2>&1 &
timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'
```

Stop it when done. `npm run dev &`'s `$!` is only the npm wrapper and
won't take the real server down with it — kill whatever's actually
bound to the port instead:

```bash
# Linux/macOS:
lsof -ti:3000 -sTCP:LISTEN | xargs -r kill
# Windows (this repo's dev environment — Git Bash, no lsof):
pid=$(netstat -ano | grep ':3000' | grep LISTENING | awk '{print $5}' | head -1)
[ -n "$pid" ] && taskkill //PID "$pid" //F
```

Then pipe commands to the driver over stdin:

```bash
node .claude/skills/run-oauth_fe/driver.mjs <<'EOF'
nav /
wait-for-text Web OAuth2.0
screenshot home
click text=Sign in
wait-for input[name="email"]
screenshot login-modal
console-errors
quit
EOF
```

Screenshots land in `.claude/skills/run-oauth_fe/shots/<name>.png`
(gitignored — regenerate, don't commit them).

| command | what it does |
|---|---|
| `nav <path>` | goto `http://localhost:3000<path>` (or a full URL) |
| `wait-for <selector>` | wait for a CSS/text selector to become visible |
| `wait-for-text <text>` | wait for text to appear anywhere on the page |
| `click <selector>` | click an element (Playwright selector syntax, e.g. `text=Sign in`) |
| `fill <selector> <value>` | fill an input (rest of the line is the value) |
| `screenshot <name>` | save a full-page PNG to `shots/<name>.png` |
| `console-errors` | print any `console.error`/uncaught page errors seen so far |
| `eval <js>` | run `page.evaluate(js)` and print the JSON result |
| `quit` | close the browser and exit |

This is the whole verified loop: home page renders → click "Sign in" →
modal with email/password + Google/GitHub buttons renders → no console
errors. Also verified: `nav /dashboard` while signed out redirects to
`/?auth=login` (the `proxy.ts` guard), matching the `307` `curl` gives
for the same path.

**Do not submit the login/signup form or click "Continue with
Google/GitHub"** unless you intend to actually exercise the real
backend at `oauth2-0-be.onrender.com` — there is no mock/test backend,
every form submission and the whole `/auth/callback` fallback path hit
that live Render service for real (see Gotchas).

## Run (human path)

```bash
npm run dev   # -> http://localhost:3000, Ctrl-C to stop
```

## Test

No test suite is configured in this repo (`npm run lint` is the only
other script, besides `dev`/`build`/`start`).

## Gotchas

- **The backend is live and on Render's free tier.** `lib/env.ts`
  defaults `NEXT_PUBLIC_API_URL` to `https://oauth2-0-be.onrender.com`
  — there's no local/mock backend. Any flow that calls it
  (`loginAction`/`registerAction` in `app/actions/auth.ts`, or
  `/auth/callback`'s fallback `/api/auth/me` check when hit with
  neither `?token=` nor `?error=`) can **hang for tens of seconds on a
  cold start**, or longer. Confirmed: `curl http://localhost:3000/auth/callback`
  with no query params did not return within 120s. Don't drive those
  paths in a smoke test unless you intend to wait on a real network
  call to a third-party host.
- **`proxy.ts` is this Next.js 16 fork's renamed `middleware.ts`** —
  see `AGENTS.md`/`CLAUDE.md` at repo root. Verified: it does what a
  normal Next middleware would (redirect unauthenticated `/dashboard`
  hits to `/?auth=login`, matching `config.matcher`).
- **The login/signup UI is a modal, not a route.** It's driven by the
  `?auth=login`/`?auth=signup` query param (`AuthModalContext.tsx`),
  opened client-side by clicking "Sign in"/"Sign up" in the header —
  `nav /?auth=login` directly also opens it pre-rendered, both work.
