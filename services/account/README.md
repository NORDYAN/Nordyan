# NORDYAN account service

HTTPS API that deletes the **currently authenticated** Supabase Auth user. Public application rows are removed by existing `ON DELETE CASCADE` foreign keys. This service does **not** formulate Coach language and must **not** share `services/coach-language` secrets or routes.

**Hosting:** Node.js Express on **Fly.io**, region `arn`, app name `nordyan-account`.

| | |
|--|--|
| Internal port | `8789` |
| Health | `GET /health` → `{ "ok": true, "service": "nordyan-account" }` |
| Delete | `POST /api/account/delete` |

The Expo app must never hold `SUPABASE_SERVICE_ROLE_KEY`.

## Endpoints

| Method | Path | Auth | Purpose |
|--|--|--|--|
| `GET` | `/health` | none | Liveness |
| `POST` | `/api/account/delete` | Bearer JWT | Delete the JWT subject via Auth Admin API |

Request body is ignored as authority. A client-supplied `user_id` / `userId` is never used.

## Auth

`Authorization: Bearer <supabase_access_token>` is verified with `auth.getUser(token)` using server-side `SUPABASE_URL` + anon/publishable key. The verified `user.id` is the only deletion target.

Admin delete uses a **separate** service-role client: `auth.admin.deleteUser(userId)`.

If the Auth user is already gone (`404` / user not found), the endpoint still returns `{ ok: true }`.

## Secrets (server only)

Set on Fly — never in Expo / `EXPO_PUBLIC_*`:

| Variable | Purpose |
|--|--|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` or `SUPABASE_PUBLISHABLE_KEY` | `auth.getUser(token)` |
| `SUPABASE_SERVICE_ROLE_KEY` | `auth.admin.deleteUser` |
| `ACCOUNT_SERVER_PORT` | Listen port (default `8789`) |
| `ACCOUNT_CORS_ORIGINS` | Optional CORS allowlist |

## Local development

```bash
cd services/account
cp .env.example .env
# fill SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev   # default http://localhost:8789
```

From repo root: `npm run account`

## Observability

Metadata-only logs (`account.delete`): `requestId`, `latencyMs`, `category`, optional `alreadyDeleted`.

Never logged: access tokens, emails, user UUIDs, health data.

## Manual end-to-end test

See [DEPLOY.md](./DEPLOY.md#manual-end-to-end-test).
