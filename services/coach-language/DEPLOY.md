# Deploying `services/coach-language`

## Production status — VERIFIED & FROZEN

| Field | Value |
|-------|--------|
| **Status** | **VERIFIED & FROZEN** |
| Fly app | `coach-language` |
| Region | `arn` |
| Production URL | `https://coach-language.fly.dev` |
| Internal port | `8788` |
| Runtime | Node/Express (`npm start`) |
| Docker context | NORDYAN repo root (`services/coach-language` + `shared/coach-language`) |
| Deploy command | `fly deploy . --config services/coach-language/fly.toml` |

**End-to-end verification completed:**

- `GET /health` succeeds on the production URL
- Fly secrets present: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Expo `EXPO_PUBLIC_COACH_LANGUAGE_API_URL=https://coach-language.fly.dev`
- Expo Go real-device: authenticated `coach.generate` reaches OpenAI; `usedFallback: false`
- Fly auto-stop / auto-start verified
- Production logs: no secrets, bearer tokens, or user prompt content observed

**Freeze scope:** Do not change this hosting target, public URL contract, internal port, Docker monorepo layout, or secret names without an explicit versioned change request. Architecture remains: deterministic engines decide; this service only formulates language. Home `/generate` keeps the Swedish template on any failure. Coach Ask `/ask` dual-accepts frozen `coach-ask-v1.1`–`v1.5` and current `coach-ask-v1.6` / `nordyan-coach-ask-v1.6`. See [COACH_V1.md](../../docs/COACH_V1.md). Changes to Ask contract, context scope, or AI authority require architecture review.

## Hosting target

**Node.js Express on Fly.io** (same package as local development).

**Chosen and frozen** after Sprint 21B–21C. Supabase Edge Functions were not chosen — there is no existing `supabase/functions` surface, and moving Express → Deno would be a rewrite without infrastructure benefit for this slice.

In-memory rate limiting resets on process restart (including Fly auto-stop); acceptable for current production use.

## Architecture

```
Expo app (signed-in)
  → EXPO_PUBLIC_COACH_LANGUAGE_API_URL (HTTPS)
  → Authorization: Bearer <Supabase access_token>
  → POST /api/coach/generate  (Home language)
  → POST /api/coach/ask       (Coach Home Q&A, frozen coach-ask-v1.1–v1.5 + current coach-ask-v1.6)
  → validate JWT (Supabase getUser)
  → shared in-memory rate limit (per user; generate + ask)
  → strict payload schema
  → OpenAI (store:false) + strict output validation
  → JSON { message, meta } or { answer, meta }
```

On any client-visible `/generate` failure (timeout, 4xx/5xx, fallback meta, invalid JSON), Home keeps the production Swedish template. On `/ask` failure, Coach Home keeps Focus/Plan and shows a soft Ask error only.

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
7. In Expo `.env`: `EXPO_PUBLIC_COACH_LANGUAGE_API_URL=https://coach-language.fly.dev` (no trailing slash).
8. Restart Expo so the public env is picked up.
9. Sign in → open Home → template first, AI replace only on OpenAI success.

Production Fly deploy (from NORDYAN repo root):

```bash
fly deploy . --config services/coach-language/fly.toml
```

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

CORS never replaces auth: generate/ask/status still require a valid Supabase Bearer JWT.

## Rate limit

In-memory: **6 requests / minute / user** and **40 / UTC day / user**, **shared** across `/generate` and `/ask`. No Supabase schema. Multi-instance hosts do not share buckets — upgrade later only if needed (and stop for schema approval if persistence requires a migration).

Client behavior on **429**: treat as failure, keep Home template, and do **not** retry the same recommendation key for the rest of the JS session.
