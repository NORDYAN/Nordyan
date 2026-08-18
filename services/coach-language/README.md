# NORDYAN coach language service

Production HTTP bridge that turns an approved coach **decision payload** into short Swedish coach copy via OpenAI (with deterministic fallback).

**Hosting:** long-lived **Node/Express** on **Fly.io**.  
**Production status:** **VERIFIED & FROZEN** — see [DEPLOY.md](./DEPLOY.md).

| | |
|--|--|
| URL | `https://coach-language.fly.dev` |
| App / region | `coach-language` / `arn` |
| Internal port | `8788` |

Supabase Edge Functions were not chosen — no existing Edge Functions surface, and Express would need a Deno rewrite.

The Expo app calls this service over HTTP(S) with a Supabase access token. The app must never hold `OPENAI_API_KEY`.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/health` | none | Liveness (no secrets, no payload logging) |
| `GET` | `/api/coach/status` | Bearer JWT | Config / prompt version status (no secrets) |
| `POST` | `/api/coach/generate` | Bearer JWT | Validate payload → generate Home language |
| `POST` | `/api/coach/ask` | Bearer JWT | Coach Ask Q&A (`coach-ask-v1.1` dual-accept + `coach-ask-v1.2`) |

Shared request/response contracts live in [`../../shared/coach-language`](../../shared/coach-language).

## Local development

```bash
cd services/coach-language
cp .env.example .env
# fill OPENAI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY
npm install
npm run dev
```

Default port: **8788** (avoids coach-simulator on 8787). Listens on **0.0.0.0** so LAN devices can connect.

From repo root:

```bash
npm run coach-language
```

### Expo Go (physical device) — LAN URL

Do **not** set `EXPO_PUBLIC_COACH_LANGUAGE_API_URL=http://localhost:8788` for a real phone.

1. Start this service (`npm run coach-language`).
2. Find the PC LAN IPv4 (Windows: `ipconfig` → Wi‑Fi IPv4).
3. In the **Expo app** `.env` (repo root), set only:
   `EXPO_PUBLIC_COACH_LANGUAGE_API_URL=http://<LAN-IP>:8788`
4. Restart Expo (`npx expo start`) so the public env reloads.
5. Phone and PC on the same Wi‑Fi; allow TCP **8788** through the host firewall if blocked.
6. Optional check from the phone browser: `http://<LAN-IP>:8788/health` → `{ "ok": true, ... }`.

CORS default (`COACH_CORS_ORIGINS` unset or `*`) allows local Expo origins. Auth still requires a valid Supabase JWT.

Production start:

```bash
npm start
```

## Auth

`Authorization: Bearer <supabase_access_token>` is verified with Supabase `auth.getUser(token)` using server-side `SUPABASE_URL` + anon/publishable key. Missing or invalid tokens → `401`.

## Rate limiting

In-memory per authenticated user: 6/minute and 40/day (UTC). Resets on process restart. No database schema.

## Observability

Metadata-only logs (`coach.generate` / `coach.ask`): requestId, provider, promptVersion, latencyMs, category, usedFallback.

Never logged: PII, raw measurements, coach message text, prompt contents, Weekly Check-in values, API keys.

## Safety invariants

- Supabase JWT verified on generate/status.
- Strict request schema + structured output validation.
- OpenAI timeout via `OPENAI_COACH_TIMEOUT_MS` (default 15000).
- Never forward raw OpenAI errors to clients.
- OpenAI calls use `store: false` (not a ZDR guarantee — see `.env.example` and `shared/coach-language/DATA_CONTROL.md`).
- Do not import from `tools/coach-simulator`.

## Env

See [`.env.example`](./.env.example) and [DEPLOY.md](./DEPLOY.md).

## Tests

```bash
npm test
```
