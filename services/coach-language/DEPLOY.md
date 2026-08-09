# Deploying `services/coach-language`

## Hosting target

**Node.js Express process** (same package as local development).

Not chosen for Sprint 21B: Supabase Edge Functions — there is no existing `supabase/functions` surface, and moving Express → Deno would be a rewrite without infrastructure benefit for this slice.

Prefer any already-used NORDYAN host that can run a long-lived Node service (Fly.io, Railway, Render, a small VPS, etc.). In-memory rate limiting resets on restart; that is acceptable for initial production testing.

## Architecture

```
Expo app (signed-in)
  → EXPO_PUBLIC_COACH_LANGUAGE_API_URL (HTTPS)
  → Authorization: Bearer <Supabase access_token>
  → POST /api/coach/generate
  → validate JWT (Supabase getUser)
  → in-memory rate limit (per user)
  → strict payload schema
  → OpenAI (store:false) + strict output validation
  → JSON { message, meta }
```

On any client-visible failure (timeout, 4xx/5xx, fallback meta, invalid JSON), Home keeps the production Swedish template.

## Secrets (server only)

Set on the host — never in Expo / `EXPO_PUBLIC_*`:

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | OpenAI authentication |
| `OPENAI_COACH_MODEL` | Model id (default `gpt-4o-mini`) |
| `SUPABASE_URL` | JWT verification project URL |
| `SUPABASE_ANON_KEY` or `SUPABASE_PUBLISHABLE_KEY` | Used with `auth.getUser(token)` |
| `COACH_SERVER_PORT` | Listen port (default `8788`) |
| `COACH_CORS_ORIGINS` | Optional comma list; `*` / unset allows local Expo |

## Deploy steps

1. Provision a Node 20+ host with HTTPS (reverse proxy or platform TLS).
2. Clone this repo (or deploy only `services/coach-language` + `shared/coach-language`).
3. `cd services/coach-language && npm ci`
4. Set secrets from `.env.example` (production values).
5. `npm start` (or process manager / container `CMD`).
6. Confirm `GET /health` → `{ ok: true, service: "nordyan-coach-language" }`.
7. In Expo `.env`: `EXPO_PUBLIC_COACH_LANGUAGE_API_URL=https://your-host` (no trailing slash).
8. Restart Expo so the public env is picked up.
9. Sign in → open Home → template first, AI replace only on OpenAI success.

## Local development

```bash
cd services/coach-language
cp .env.example .env
# OPENAI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY
npm install
npm run dev   # default http://localhost:8788
```

### Expo Go physical device (LAN)

| Step | Action |
|------|--------|
| 1 | `npm run coach-language` (listens `0.0.0.0:8788`) |
| 2 | Same Wi‑Fi as the phone |
| 3 | Read host IPv4 (`ipconfig` / `ifconfig`) — example shape `192.168.1.154` |
| 4 | Root `.env`: `EXPO_PUBLIC_COACH_LANGUAGE_API_URL=http://192.168.x.x:8788` (no trailing slash) |
| 5 | Restart Expo so env is picked up |
| 6 | Confirm `http://192.168.x.x:8788/health` from the phone browser |

Never hardcode the LAN IP in source. Never use `localhost` from Expo Go on device.

## CORS

| Environment | `COACH_CORS_ORIGINS` | Behavior |
|-------------|----------------------|----------|
| Local Expo Go / sim | unset or `*` | Reflect/allow request origins (`cors` `origin: true`) |
| Production | comma-separated allowlist of app origins | Only listed origins |

CORS never replaces auth: generate/status still require a valid Supabase Bearer JWT.

## Rate limit

In-memory: **6 requests / minute / user** and **40 / UTC day / user**. No Supabase schema. Multi-instance hosts do not share buckets — upgrade later only if needed (and stop for schema approval if persistence requires a migration).

Client behavior on **429**: treat as failure, keep Home template, and do **not** retry the same recommendation key for the rest of the JS session.
