# Deploying `services/account`

Do **not** run these commands as part of a normal code change. Set secrets first, then deploy when ready.

## Fly app

| Field | Value |
|-------|--------|
| Fly app | `nordyan-account` |
| Region | `arn` |
| Internal port | `8789` |
| Expected URL | `https://nordyan-account.fly.dev` |
| Health | `GET /health` |

## First-time app create (once)

From the NORDYAN repository root (requires Fly auth):

```bash
fly apps create nordyan-account
```

Skip if the app already exists.

## Secrets

```bash
fly secrets set --app nordyan-account \
  SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co" \
  SUPABASE_ANON_KEY="YOUR_ANON_OR_PUBLISHABLE_KEY" \
  SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
```

Never put `SUPABASE_SERVICE_ROLE_KEY` in Expo `.env` or any `EXPO_PUBLIC_*` variable.

## Deploy

From the NORDYAN repository root:

```bash
fly deploy . --config services/account/fly.toml
```

Confirm:

```bash
curl https://nordyan-account.fly.dev/health
```

Expected: `{"ok":true,"service":"nordyan-account"}`

## Expo after deploy

In the **root** Expo `.env` (restart Expo after changing):

```
EXPO_PUBLIC_ACCOUNT_API_URL=https://nordyan-account.fly.dev
```

No trailing slash. Local device testing may use `http://<LAN-IP>:8789` instead.

## Manual end-to-end test

1. Create a throwaway user through real onboarding (profile + measurements + snapshot + initial lifestyle; add a weekly check-in if possible).
2. In Supabase, confirm rows exist for that `user_id` in:
   - `public.profiles`
   - `public.measurements`
   - `public.health_snapshots`
   - `public.initial_lifestyle_checks`
   - `public.weekly_check_ins` (if a row was created)
3. In the app: **Profil → Integritet och data → Radera konto**. Check the confirmation box, tap **Radera konto**, confirm the native alert **Radera**.
4. Verify the Auth user is gone (Authentication → Users).
5. Verify public rows for that user id are gone (CASCADE).
6. Verify the app is on the unauthenticated/onboarding-or-login gate, not signed-in tabs.
7. Kill and reopen the app: old session must not open authenticated tabs.
8. On another signed-in throwaway user: enable airplane mode, attempt deletion — remain signed in; local data and server rows still present.
9. Confirm Coach Home / Ask still works (`services/coach-language` unchanged; `https://coach-language.fly.dev/health`).
