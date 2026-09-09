# Deployment

Deploys run through **Vercel's Git integration** — push/merge to `main` and
Vercel builds and deploys. The build command
(`prisma generate && prisma migrate deploy && next build`) applies any pending
database migrations before building, using the `DATABASE_URL` already set in the
Vercel project.

The `20260902120000_security_and_perf` migration is **additive and
backward-compatible** (new `Member` columns + indexes only), so there is no
canary/blue-green step: the currently-live code keeps working against the
migrated schema until the new build is promoted. Rollback = re-promote the
previous deployment in Vercel.

## One-time setup

Add these in **Vercel → project → Settings → Environment Variables**, scope
**Production** (also add to **Preview** if you rely on PR preview deployments):

| Variable | Value |
|---|---|
| `SESSION_SECRET` | `openssl rand -base64 32` — app refuses to boot in production without it |
| `CRON_SECRET` | `openssl rand -base64 32` — required by `/api/cron/recurring` |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | `openssl rand -base64 32` |

`DATABASE_URL` is already configured. It must be reachable for DDL during the
build; if it points at a transaction-mode pooler that rejects `prisma migrate
deploy` (e.g. Supabase :6543), either switch it to the direct/session URL or run
`npx prisma migrate deploy` once by hand against a direct URL and drop
`prisma migrate deploy` from the build command.

## Go live

1. Add the three variables above in Vercel.
2. Merge to `main`. Vercel builds → runs the migration → deploys.
3. Everyone is signed out once (the session cookie format changed) and logs
   back in with their existing PIN.

## After go-live

- Confirm the daily cron appears under **Settings → Cron Jobs**.
- For lower latency, make the runtime `DATABASE_URL` a **pooled** endpoint
  (Neon `-pooler`, Accelerate, etc.).
