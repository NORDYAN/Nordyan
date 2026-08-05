# NORDYAN Application Architecture

## Current state (UI layer)

The project is an **Expo Router** app with a clear presentation layer:

| Path | Role |
|------|------|
| `app/` | Routes and screens (onboarding, tabs, health-score) |
| `components/` | Reusable UI (home, onboarding, ui, layout, branding) |
| `theme/` | Design tokens (colors, typography, spacing) |
| `constants/` | App constants (routes) |
| `data/mocks/` | Temporary mock state for UI development |
| `assets/` | Static assets |

There is **no backend layer** yet. Screens use local state and mocks.

---

## Target architecture

NORDYAN uses a **layered, modular architecture**. UI never talks directly to Supabase, Garmin, RevenueCat, or AI APIs.

```
┌─────────────────────────────────────────────────────────┐
│  app/ + components/          Presentation (Expo Router) │
├─────────────────────────────────────────────────────────┤
│  hooks/                      React data hooks           │
├─────────────────────────────────────────────────────────┤
│  providers/                  Session & domain context   │
├─────────────────────────────────────────────────────────┤
│  lib/services/               Use-case orchestration   │
├─────────────────────────────────────────────────────────┤
│  lib/repositories/           Data access contracts      │
├─────────────────────────────────────────────────────────┤
│  lib/domain/                 Types & business models    │
├─────────────────────────────────────────────────────────┤
│  lib/integrations/           Third-party adapters       │
│    garmin · revenuecat · healthkit                      │
├─────────────────────────────────────────────────────────┤
│  lib/supabase/               Supabase client & DB types │
├─────────────────────────────────────────────────────────┤
│  lib/core/                   Config, errors, shared     │
└─────────────────────────────────────────────────────────┘
```

**Dependency rule:** outer layers depend inward. Domain types have zero infrastructure imports.

---

## Module responsibilities

### Supabase (`lib/supabase/`)

- Single Supabase client initialization point
- Generated/hand-maintained `Database` types
- Future: RLS-aware queries live behind repositories, not in screens

### Authentication (`lib/domain/auth`, `lib/services/auth`, `lib/repositories/auth`)

- Domain: `AuthSession`, `AuthUser`, auth status
- Repository: sign-in/out, session refresh (Supabase Auth)
- Service: coordinates auth + profile bootstrap on first login
- Hooks: `useAuth`, `useRequireAuth`

### User Profile (`lib/domain/profile`)

- Onboarding measurements, display name, preferences, coach context
- Repository: CRUD against `profiles` table
- Service: profile creation after onboarding step 4, profile reads for Home

### Health Data (`lib/domain/health-data`)

- Normalized metrics: weight, body fat, sleep, steps, measurements
- Repository: read/write health snapshots and daily aggregates
- Integrations feed this layer (Garmin, future HealthKit)

### Health Score (`lib/domain/health-score`)

- Score model, breakdown, trend deltas
- Service: pure calculation + repository persistence
- Decoupled from UI gauge components

### AI Coach (`lib/domain/coach`)

- Coach message, daily plan, priorities
- Service: builds prompts from profile + health data; calls AI adapter later
- Repository: stores coach sessions and recommendations

### Garmin (`lib/integrations/garmin/`)

- OAuth/token handling, sync jobs, mapping Garmin payloads → `health-data` models
- Adapter interface swappable for testing

### RevenueCat (`lib/integrations/revenuecat/`)

- Subscription status, entitlements, offering metadata
- Adapter wraps RevenueCat SDK; exposes domain-friendly `SubscriptionStatus`

### HealthKit (`lib/integrations/healthkit/`)

- Reserved for future iOS health reads
- Same adapter pattern as Garmin

---

## Data flow example (future)

1. **Garmin sync** → `GarminAdapter` → `HealthDataRepository` → Supabase
2. **Health score job** → `HealthScoreService` reads health data → computes score → persists
3. **Home screen** → `useHealthScore` hook → `HealthScoreService` → repository
4. **Coach card** → `useCoachRecommendation` → `CoachService` → AI adapter (later)

---

## What was added in this foundation

See `lib/` folder tree. Each module contains:

- `types.ts` — domain models (no IO)
- `*.repository.ts` — interfaces for data access
- `*.service.types.ts` — interfaces for use cases
- `*.adapter.types.ts` — interfaces for third-party SDKs
- `index.ts` — barrel exports

**Not implemented yet:** client init, API calls, SDK wiring, hooks with logic, providers with state.

---

## Next steps (when implementing features)

1. Add Supabase project + env vars → implement `lib/supabase/client.ts`
2. Implement `AuthRepository` + `AppProviders` + auth gate in `app/index.tsx`
3. Persist onboarding profile → `ProfileRepository`
4. Replace Home mocks with `HealthScoreService` + `CoachService`
5. Add Garmin OAuth → `GarminAdapter`
6. Add RevenueCat → gate premium coach features
