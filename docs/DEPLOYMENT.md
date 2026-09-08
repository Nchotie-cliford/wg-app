# Deployment

Production deploys are driven by **`.github/workflows/deploy.yml`**, not by
Vercel's Git integration (that is disabled for `main` in `vercel.json` so it
can't race the workflow).

The workflow runs, in order, and stops on the first failure:

1. **Sync secrets** GitHub → Vercel (`vercel env add`)
2. **`prisma migrate deploy`** against the production database
3. **`vercel build` + `vercel deploy --prebuilt --prod`**

If step 1 or 2 fails, step 3 never runs and the previously-live deployment
keeps serving. There is no traffic split / canary: the schema migration is
**additive and backward-compatible** (new `Member` columns + indexes only), so
the old code keeps working against the migrated database until the new code is
deployed. Rollback = re-promote the previous deployment in Vercel.

## One-time setup

### 1. Get Vercel identifiers (needs Vercel access once)

Someone with access to the Vercel project runs, from a local clone:

```bash
npx vercel link        # writes .vercel/project.json
cat .vercel/project.json   # -> "orgId" and "projectId"
```

and creates a token at **Vercel → Account Settings → Tokens** (scope: the team
that owns this project).

### 2. Add GitHub repository secrets

**Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|---|---|
| `VERCEL_TOKEN` | the token from step 1 |
| `VERCEL_ORG_ID` | `orgId` from `project.json` |
| `VERCEL_PROJECT_ID` | `projectId` from `project.json` |
| `SESSION_SECRET` | `openssl rand -base64 32` |
| `CRON_SECRET` | `openssl rand -base64 32` |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | `openssl rand -base64 32` |
| `DATABASE_URL` | a **direct / unpooled** Postgres URL (used only for migrations) |

> `DATABASE_URL` for the *running app* is already configured in the Vercel
> project. The `DATABASE_URL` secret here is only for `prisma migrate deploy`
> and can point at the same database (use the unpooled host if your Vercel one
> is a pooler).

### 3. Dry run before touching production

Actions tab → **Deploy** → **Run workflow** → `environment: preview`.

This syncs the secrets to Vercel's **Preview** scope, applies the migration,
and gives you a preview URL. Verify on that URL:

- the app loads (proves `SESSION_SECRET` is wired — otherwise every route 500s)
- you can pick a flatmate and log in with the existing PIN (proves the
  migration ran and the new auth path works)
- `curl -s -o /dev/null -w '%{http_code}' https://<preview>/api/cron/recurring`
  returns `401` (proves `CRON_SECRET` is required)

### 4. Go live

Merge to `main`. The workflow runs the same steps against **production** and
deploys. Everyone is signed out once (the session cookie format changed) and
logs back in with their existing PIN.

## Notes

- Vercel still builds **PR previews** automatically. Those previews won't have
  the new secrets until you've done at least one `environment: preview` run
  (which populates the Preview scope).
- The daily recurring-bill cron (`vercel.json` → `/api/cron/recurring`) needs
  `CRON_SECRET` set in the Vercel **Production** scope — the `main` deploy does
  that.
- To rotate a secret: update the GitHub secret, re-run the workflow.
