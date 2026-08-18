# NORDYAN Architecture v1.0

**Status:** Draft — awaiting architecture review  
**Scope:** NORDYAN Core v1.0 and boundaries for future modules  
**Last updated:** 2026-08-14 (Coach Context v1.3 Ask expansion; 26D/26E Weekly Check-in and Initial Lifestyle frozen)

---

## 1. Purpose

This document defines the **architectural and product boundaries** for NORDYAN Core v1.0.

It describes:

- what NORDYAN Core is responsible for today
- how layers, engines, and services interact
- where the single source of truth lives for each health outcome
- what is frozen, what is planned, and how changes are approved

This document is the reference for Core boundaries and frozen modules (including Measurement Module v1.0, Progress / Utveckling v1, Health Score Explained / Factors v1, Coach v1, Weekly Check-in capture, and Initial Lifestyle). Further modules such as expanded Health Journey, Score Timeline, methodology education, and external health integrations require explicit future milestones.

---

## 2. Core Principles

### Deterministic engines

Health outcomes are produced by pure, versioned TypeScript domain engines. Given the same validated input, an engine always returns the same result. Engines do not call Supabase, UI, or external APIs.

### Service-first architecture

Screens and components do not own business rules. Use-case logic lives in application services under `lib/services/` and orchestration modules such as `lib/onboarding/`. UI consumes service results.

### Presentation-only UI

UI renders state, copy, and formatting. UI must not calculate body fat, Health Score, trends, focus, or coach recommendations. Presentation code may format numbers and Swedish copy but must not replace domain logic.

### One source of truth

Each product outcome has exactly one canonical owner. Body fat comes from the Health Score Engine. Progress comes from ProgressService. Snapshot history comes from SnapshotService. UI reads these sources; it does not invent parallel values.

### Append-only health history

Health snapshots are historical records. They are inserted, not updated or deleted by the app. Progress and journey views derive meaning from snapshot history rather than mutating past records.

### AI explains but never calculates

Coach recommendations are produced by the deterministic Coach Engine from Focus and Health Score results. AI-style language is presentation. The Coach Engine selects from approved recommendation templates; it does not invent health math.

Coach Ask (Sprint 25) is the same rule for Q&A: NORDYAN determines Focus, Plan, and Health Score; Coach Language explains and helps adapt execution. AI must not recalculate scores, replace Focus/Plan, invent missing data, or mutate health state.

### Small milestones followed by verification and freeze

Work proceeds in small milestones:

1. Design
2. Implement
3. TypeScript verification
4. Expo Go runtime verification
5. Architecture review
6. Approved & Frozen

Each milestone has explicit scope. After approval, a component or engine is frozen until a versioned change request explicitly authorizes modification.

---

## 3. Product Domain Model

NORDYAN models a user’s health journey through four related concepts:

```
User
├── Profile
├── Measurements
├── Snapshots
└── Progress
```

### Profile

Profile describes **who the user is** — relatively stable identity and baseline inputs:

- gender
- birth year / date of birth
- height
- activity level
- optional identity fields such as first name and goal

Profile answers: *Who am I?*

### Measurements

Measurement describes **the user’s health data at a specific time**:

- weight
- waist
- neck
- measurement date

Measurement answers: *What did my body look like at this point in time?*

### Approved product principle

> **A profile describes the person. A measurement describes the person’s health at a specific point in time.**

### Current v1.0 state (Measurement Module Approved & Frozen)

Recurring weight, waist, and neck readings are captured as append-only **measurement** events (Measurement Module v1.0 — Approved & Frozen). Profile UI does not edit body fields.

Profile `weight` / `waist` / `neck` remain **transitional** onboarding and Home `profile_fallback` storage. Measurement submission does not mirror body values onto the profile. After a successful measurement snapshot, Home uses the latest health snapshot as source of truth. Deprecation of transitional profile body fields requires a later ADR (ADR-007).

### Snapshots

A snapshot is an append-only record of engine output at a moment in time: Health Score, driver scores, focus, coach recommendation ID, and the measurements used when the snapshot was taken.

### Progress

Progress is a **derived view** over snapshot history. It is not stored as a separate mutable entity.

- **Home Progress Card** (Core v1.0, frozen): latest-vs-previous summary via `ProgressService` / `ProgressSummary`.
- **Progress / Utveckling v1** (Sprint 23, Approved & Frozen): Development Home and Development Trends via `developmentService`, reading `health_snapshots` only. See [PROGRESS_UTVECKLING_V1.md](./PROGRESS_UTVECKLING_V1.md).
- **Health Score Explained / Factors v1** (Sprint 24, Approved & Frozen): Factors destination via `healthScoreExplainedService` composing Development Home / Snapshot data. See [HEALTH_SCORE_EXPLAINED_V1.md](./HEALTH_SCORE_EXPLAINED_V1.md).
- **Coach v1** (Sprint 25, Approved & Frozen): Coach Home + Coach Ask over persisted snapshot Focus/Plan, with Coach Context v1.1 composed from Coach Home + Development Home. See [COACH_V1.md](./COACH_V1.md).

---

## 4. Layered Architecture

NORDYAN uses a strict top-down dependency flow:

```
UI
↓
Hooks
↓
Application / orchestration services
↓
Domain engines and domain services
↓
Persistence services
↓
Supabase
```

### UI

**Location:** `app/`, `components/`

**Responsibility:**

- render screens and product surfaces
- handle local interaction state such as loading spinners and form inputs
- display formatted values and Swedish copy
- never calculate domain health outcomes

### Hooks

**Location:** `lib/hooks/`

**Responsibility:**

- bind React lifecycle to service calls
- expose fetch/UI state such as `loading`, `unavailable`, and `ready`
- keep screens thin
- examples: `useHomeHealthScore`, `useHomeProgress`, `useOnboardingResult`

Presentation-specific view-state types may live in `lib/presentation/` close to the feature they serve.

### Application / orchestration services

**Location:** `lib/services/`, `lib/onboarding/`

**Responsibility:**

- coordinate use cases across engines and persistence
- map profiles and measurements into engine inputs
- build Home and onboarding presentation models from engine output
- examples: `profileService`, `snapshot-after-profile-save`, `onboarding-result.service`, `sync-pending-profile`

These services orchestrate; they do not replace domain engines.

### Domain engines and domain services

**Location:** `lib/domain/`

**Responsibility:**

- pure business logic
- deterministic calculation and ranking
- typed inputs and outputs
- no Supabase, React, or network imports

Engines:

- `lib/domain/health-score/`
- `lib/domain/focus-engine/`
- `lib/domain/coach-engine/`

Domain types also exist for `profile`, `snapshot`, and `progress`.

### Persistence services

**Location:** `lib/services/snapshots/`, `lib/repositories/`, `lib/services/profile/`, `lib/services/auth/`

**Responsibility:**

- read and write Supabase data
- enforce service-level validation before persistence
- map database rows to domain types
- hide PostgREST and RLS details from UI and engines

SnapshotService is the only approved app entry point for `health_snapshots` persistence and retrieval.

### Supabase

**Location:** `supabase/migrations/`, `lib/supabase/`

**Responsibility:**

- auth
- relational storage
- row-level security
- schema migrations applied to the linked project

Current Core tables include `profiles` and `health_snapshots`.

---

## 5. Engine Boundaries

The following engines are **deterministic** and **frozen** in Core v1.0:

| Engine | Location | Output |
|--------|----------|--------|
| Health Score Engine | `lib/domain/health-score/` | score, driver scores, body fat %, bands, metrics |
| Focus Engine | `lib/domain/focus-engine/` | primary focus, secondary focus, reasoning |
| Coach Engine | `lib/domain/coach-engine/` | recommendation ID, category, duration, frequency |

Each engine exports a version and frozen status constant.

### UI must never calculate

UI and presentation layers must **not** calculate or infer:

- body fat percentage
- NORDYAN Health Score
- progress trends
- primary focus
- coach recommendations

UI reads values produced by engines and services.

### Approved engine pipeline

For score, focus, and coach outcomes, the canonical pipeline is:

```
Profile / measurement input
→ Health Score Engine
→ Focus Engine
→ Coach Engine
→ optional Snapshot persistence
→ presentation formatting
```

Onboarding results, Home cards, and snapshot creation all use this pipeline or a subset of it. They must not introduce alternate formulas.

---

## 6. Data Ownership and Sources of Truth

| Outcome | Canonical owner | Notes |
|---------|-----------------|-------|
| Body fat % | Health Score Engine → `result.metrics.bodyFatPct` | formatted by shared presentation helpers such as `formatBodyFatPercent()` |
| Health Score | Health Score Engine → `result.score` | also surfaced on Home Score card |
| Focus | Focus Engine → `primaryFocus`, reasoning | Home Priority 1 and Coach Home present this; engines remain authoritative |
| Coach recommendation | Coach Engine → `recommendationId` and presentation copy | Home Coach card and onboarding results consume the same pipeline |
| Snapshot history | SnapshotService | append-only `health_snapshots` rows |
| Progress comparison (Home) | ProgressService | compares latest two snapshots; returns `ProgressSummary` |
| Progress / Utveckling (tab) | DevelopmentService | Home + Trends composition from SnapshotService / `health_snapshots` |
| Health Score Explained / Factors | HealthScoreExplainedService | Composes DevelopmentService Home summary; presentation-only factor/coach VM |
| Coach Home Focus / Plan | CoachHomeService | Read-only composition from latest snapshot + existing Focus/Coach presentation |
| Coach Ask context | CoachContext composer | Allowlisted facts from Coach Home + Development Home; no engine rerun |
| Home priorities 2–3 | Local curated advice bank | Presentation-only; not a health authority |

Presentation code may:

- format numbers and percentages
- map trends to Swedish copy
- define UI fetch states such as `loading` and `unavailable`

Presentation code may **not**:

- recalculate body fat, score, trend, focus, or coach outputs
- compare snapshots directly
- query Supabase outside approved services

---

## 7. Product Surfaces

Each product area has a single primary question.

### Home — “How am I doing now?”

**Responsibility:**

- current Health Score
- progress since last snapshot
- current focus context
- current coach recommendation
- Home CTA “Visa dagens plan” → Coach tab
- “Dagens prioriteringar”: Priority 1 = authoritative Focus; Priorities 2–3 = local general advice (Sprint 25 Integrity v1)
- high-level health overview metrics derived from approved sources

**Approved Home hierarchy (Core v1.0):**

1. Score
2. Progress
3. Focus
4. Coach

Home is a presentation surface over current engine and service output. It is not a second calculation layer.

### Measurement — “How does my health look today?”

**Status:** **Approved & Frozen — Measurement Module v1.0** (Sprint 22 completed). See [MEASUREMENT_MODULE_V1.md](./MEASUREMENT_MODULE_V1.md).

**Responsibility:**

- capture a dated append-only measurement event (weight, waist, neck, date)
- orchestrate Health Score → Focus → Coach → snapshot (`reason: measurement`) via Measurement Workflow
- keep measurement capture separate from Profile identity edits
- present measurement history on the Health tab

**Source of truth (v1.0):** After a successful measurement snapshot, Home uses the latest health snapshot. Profile `weight` / `waist` / `neck` remain transitional onboarding / profile_fallback storage and are not updated by measurement submission.

### Progress / Utveckling — “How has my health developed?”

**Status:** **Approved & Frozen — Progress / Utveckling v1** (Sprint 23 completed). See [PROGRESS_UTVECKLING_V1.md](./PROGRESS_UTVECKLING_V1.md).

**Responsibility:**

- Development Home (`/(tabs)/progress`): current Health Score, latest-vs-previous deltas (score, waist, weight, `activity_score`), sleep limitation (`Ingen data`), deterministic Coach presentation
- Development Trends (`/(tabs)/progress/trends`): period-scoped series (7d / 30d / 90d / 1y) for Health Score, weight, waist, neck, activity (`activity_score`)
- read-only composition from SnapshotService / `health_snapshots` only

**Source of truth:** `health_snapshots`. Measurement history is not a second Progress timeline. UI does not calculate health-domain outcomes.

**Factors CTA:** “Vad påverkar min Health Score?” on Development Trends navigates to Health Score Explained / Factors v1 (`/health-score`). See [HEALTH_SCORE_EXPLAINED_V1.md](./HEALTH_SCORE_EXPLAINED_V1.md).

### Health Score Explained / Factors — “What affects my Health Score right now?”

**Status:** **Approved & Frozen — Health Score Explained / Factors v1** (Sprint 24 completed). See [HEALTH_SCORE_EXPLAINED_V1.md](./HEALTH_SCORE_EXPLAINED_V1.md).

**Responsibility:**

- replace the previous mock `/health-score` with the real Explained surface
- display persisted latest Health Score, band, and latest-vs-previous change
- present fixed-order factor cards (Midjemått, Aktivitet, Sömn, Vikt) describing observed development / availability — not ranked contribution
- reuse Development Home / Snapshot composition via `HealthScoreExplainedService` (no second pipeline, no UI Health Score calculation)
- deterministic Coach presentation only (no Coach Language / engine rerun)

**Source of truth:** `health_snapshots` via existing DevelopmentService Home summary.

**Deferred:** “Hur beräknas Health Score?” CTA is visual only — **ACCEPTED DEFERRED PRODUCT SURFACE** (no approved methodology destination Figma).

### Coach — “What should I do now?”

**Status:** **Approved & Frozen — Coach v1** (Sprint 25 completed). See [COACH_V1.md](./COACH_V1.md).

**Responsibility:**

- dedicated Coach tab (`/(tabs)/coach`) presenting persisted Focus and Plan
- Coach Ask Q&A via `POST /api/coach/ask` (new client: `coach-ask-v1.3` / `nordyan-coach-ask-v1.3`; server accepts frozen `coach-ask-v1.1` / `nordyan-coach-ask-v1.1` and `coach-ask-v1.2` / `nordyan-coach-ask-v1.2`)
- Coach Context v1.1 composed from existing Coach Home + Development Home read paths
- Coach Context v1.2 adds allowlisted current-week Weekly Check-in only (`weeklyCheckIn: null | object`); not an engine input
- Coach Context v1.3 adds allowlisted onboarding Initial Lifestyle baseline (`initialLifestyle: null | object`) alongside Weekly Check-in; sources stay separate; not an engine input
- Home CTA “Visa dagens plan” navigates to the Coach tab
- Home Priorities Integrity v1: Priority 1 = Focus; Priorities 2–3 = local general advice

**Source of truth:** persisted snapshot Focus/Plan (deterministic engines). Coach Language explains; it does not determine.

**Known unavailable in v1:** measured sleep, steps, Apple Health, Health Connect. Current-week Weekly Check-in may appear in Ask v1.2/v1.3 as subjective self-report; onboarding Initial Lifestyle may appear in Ask v1.3 as a baseline self-report. Neither makes device sleep or steps available. Future context widening requires explicit architecture review.

### Health Journey (future expansion)

**Status:** Planned beyond Progress / Utveckling v1 and Health Score Explained v1

Further longitudinal journey surfaces beyond the frozen Development Home / Trends / Explained contracts remain planned and require a future milestone.

### Profile — “Who am I?”

**Responsibility:**

- identity and slowly changing baseline fields
- gender, birth year, height, activity level, goal
- account actions such as sign-out

Profile may still store weight, waist, and neck for **transitional** onboarding and Home profile_fallback. Recurring body readings are captured through the Measurement Module. Deprecation of profile body fields requires a later ADR.

---

## 8. Snapshot and Progress Rules

### Snapshot rules

- Snapshots are **append-only**
- SnapshotService owns all create/read access to `health_snapshots`
- Snapshot rows store engine output plus the measurements used at capture time
- UI never writes snapshots directly
- UI never compares snapshots directly

### Snapshot creation pipelines

**Onboarding / transitional profile path:**

```
profile save or onboarding sync
→ calculateHomeHealthScoreFromProfile()
→ determineFocus()
→ generateRecommendation()
→ snapshotService.createSnapshot()
```

Snapshot creation is **best-effort** after a successful profile save. A snapshot failure must **not** cause a successful profile save to be reported as failed to the user.

**Measurement Module path (implemented):**

```
validate measurement
→ persist measurement
→ load/resolve profile
→ map profile + measurement
→ Health Score → Focus → Coach
→ snapshotService.createSnapshot(reason: measurement)
```

Persist-first is intentional: measurement rows are kept even when snapshot orchestration fails (`measurement_persisted_snapshot_failed`), aligning with the non-blocking snapshot policy.

### Current snapshot reasons in use

| Reason | When used |
|--------|-----------|
| `onboarding` | after onboarding profile sync |
| `profile_update` | after transitional profile-triggered snapshot path |
| `measurement` | after successful Measurement Workflow snapshot persist |

The domain and database schema also define snapshot reason `weekly_checkin`, but it is not used by an approved product flow. Recurring Veckokoll persists in `weekly_check_ins` and does not create snapshots.

### Progress rules

**Home Progress Card (frozen Core v1.0):**

- ProgressService derives comparisons from SnapshotService history
- approved comparison type: `latest_vs_previous` using two snapshots
- domain trends: `improving`, `stable`, `declining`, `insufficient_history`
- UI reads `ProgressSummary`; it does not compute deltas or trends
- Home Progress Card displays score, score delta, and trend message only

**Progress / Utveckling v1 (Approved & Frozen — Sprint 23):**

- DevelopmentService composes Development Home and Trends from SnapshotService
- historical source of truth: `health_snapshots` only
- period history uses query-level `created_at` range filters
- Aktivitet = `activity_score` (not steps/device activity)
- Sleep = explicit limitation `"Ingen data"` (no derived sleep)
- fewer than 2 valid period points → insufficient-history; no fake trends or synthetic points
- Coach on Development screens is deterministic snapshot presentation only (no Coach Language)
- UI reads Development presentation/view-model output only
- freeze contract: [PROGRESS_UTVECKLING_V1.md](./PROGRESS_UTVECKLING_V1.md)

**Health Score Explained / Factors v1 (Approved & Frozen — Sprint 24):**

- HealthScoreExplainedService composes existing DevelopmentService Home summary (no duplicated delta math)
- displays persisted latest score + band + latest-vs-previous change only
- factor order fixed: Midjemått → Aktivitet → Sömn → Vikt (no contribution ranking)
- Aktivitet = `activity_score`; Sleep = explicit `Ingen data` limitation
- Vikt / Midjemått development statuses use existing latest-vs-previous deltas
- Coach is deterministic snapshot/Development presentation only (no Coach Language)
- “Hur beräknas Health Score?” remains deferred (no destination)
- freeze contract: [HEALTH_SCORE_EXPLAINED_V1.md](./HEALTH_SCORE_EXPLAINED_V1.md)

**Coach v1 (Approved & Frozen — Sprint 25):**

- Coach Home composes persisted snapshot Focus + Plan via `coachHomeService` (no engine rerun)
- Coach Ask uses Coach Context v1.1 from Coach Home + Development Home; v1.2 additionally may include allowlisted current-week Weekly Check-in; v1.3 additionally may include allowlisted onboarding Initial Lifestyle
- payload `coach-ask-v1.3` (client) with accept of frozen `coach-ask-v1.1` and `coach-ask-v1.2`; prompts `nordyan-coach-ask-v1.3` / `nordyan-coach-ask-v1.2` / `nordyan-coach-ask-v1.1`; OpenAI `store: false`
- AI failure is non-destructive (soft Ask error; Focus/Plan/health state remain)
- Home Priorities Integrity v1 is presentation-only for slots 2–3
- freeze contract: [COACH_V1.md](./COACH_V1.md)

### Runtime error handling

- integration failures are returned as typed service errors
- dev builds may log detailed errors
- user-facing copy must not expose raw PostgREST or database errors
- missing snapshot table or empty history degrades to approved UI states such as `insufficient_history` or `unavailable`, not fabricated values

---

## 9. Frozen Core v1.0

The following areas are **Approved & Frozen** for Core v1.0:

| Area | Scope |
|------|-------|
| Authentication | Supabase auth, session lifecycle, sign-in/sign-up |
| Onboarding | steps 1–5, pending profile sync, app gate |
| Profile persistence | `profiles` table, profile service and repository |
| Health Score Engine | deterministic score and body fat calculation |
| Focus Engine | deterministic focus selection |
| Coach Engine | deterministic recommendation selection |
| Snapshot Service | append-only snapshot persistence and retrieval |
| Progress Service | snapshot-based progress summary |
| Home Score | Health Score card on Home |
| Home Progress Card | score, delta, trend presentation |
| Onboarding Results Screen | engine-driven body fat, score, coach message |
| Runtime/UI consistency fixes | shared body fat source, priority defaults, no synthetic sleep/steps |
| Measurement Module v1.0 | append-only measurements, persist-first workflow, Health tab capture/history (see Measurement Module freeze) |
| Progress / Utveckling v1 | Development Home + Trends over `health_snapshots` (see Progress / Utveckling freeze) |
| Health Score Explained / Factors v1 | Factors destination over Development/Snapshot composition (see Health Score Explained freeze) |
| Coach v1 | Coach Home, Coach Context v1.1, Coach Ask v1.1, Home Priorities Integrity v1 (see Coach freeze) |

### What “frozen” means

Frozen does **not** prohibit bug fixes.

Frozen **does** require:

- an explicit versioned change request before behavior or contract changes
- architecture review before re-approval
- no silent redesign of engine logic, service boundaries, or product contracts

---

## 10. Development and Freeze Process

Every milestone follows the same sequence:

```
Design
→ Implement
→ TypeScript verification
→ Expo Go runtime verification
→ Architecture review
→ Approved & Frozen
```

### Definition of Done

A milestone is done only when all of the following are true:

- [ ] specification fulfilled
- [ ] architectural boundaries respected
- [ ] no duplicated business logic
- [ ] no unintended changes to frozen components
- [ ] `npx tsc --noEmit` passes
- [ ] manual Expo Go smoke test passes
- [ ] architecture review completed

Documentation-only tasks such as this file follow the same review step but do not require runtime smoke tests unless they claim runtime behavior incorrectly.

---

## 11. Versioning Policy

| Change type | Version bump | Example |
|-------------|--------------|---------|
| Bug fix | Patch | snapshot error handling, UI wrapping fix |
| Backward-compatible feature | Minor | new Home card, new presentation state |
| Breaking engine or contract change | Major | new Health Score formula, changed `ProgressSummary` shape |

Engine version constants and snapshot `engine_version` fields support auditability across formula changes.

---

## 12. Module status beyond Core freeze

| Module | Purpose | Status |
|--------|---------|--------|
| Measurement Module v1.0 | dated measurement capture separated from profile identity | **Approved & Frozen** (Sprint 22 completed) |
| Progress / Utveckling v1 | Development Home + Trends over snapshot history | **Approved & Frozen** (Sprint 23 completed) |
| Health Score Explained / Factors v1 | Factors destination explaining current Health Score context | **Approved & Frozen** (Sprint 24 completed) |
| Coach v1 | Coach Home + Ask explanation layer over persisted Focus/Plan | **Approved & Frozen** (Sprint 25 completed) |
| Initial Lifestyle | onboarding typical-lifestyle baseline | **Approved & Frozen** (Ask v1.3 allowlisted projection only) |
| Weekly Check-in | recurring current-week self-report (Veckokoll) | **Approved & Frozen** (26D capture, 26E Home cadence/suppression) |
| Coach Context v1.2 | Ask enrichment from allowlisted current-week Weekly Check-in | Implemented — keep frozen; not silently widened by v1.3 |
| Coach Context v1.3–v1.5 | Ask enrichment through Initial Lifestyle, body composition, and deterministic body-fat reference | **Approved & Frozen** |
| Coach Ask v1.6 | locale-only Ask contract (`sv-SE` / `nb-NO`) over the frozen v1.5 allowlist | **Live verified & Frozen** |
| i18n foundation (`sv` / `nb`) | typed resources, locale ownership, selector, enum isolation, Swedish fallback | **Live verified & Frozen** |
| Future product locales (`da` / `fi` / `en`) | separately scoped language expansion over the frozen foundation | Planned — language expansion itself is not frozen |
| Health Journey (further expansion) | additional longitudinal journey surfaces beyond Progress / Explained v1 | Planned |
| Score Timeline | dedicated score-timeline product beyond Trends metric chart | Planned — not a separate product surface in Progress v1 |
| Health Score methodology surface | destination for “Hur beräknas Health Score?” | Planned — accepted deferred product surface (no approved Figma yet) |
| Future health integrations | Apple Health, Health Connect, Garmin, device-derived sleep/steps | Planned — not implemented |

Measurement Module v1.0 freeze contract: [MEASUREMENT_MODULE_V1.md](./MEASUREMENT_MODULE_V1.md).
Progress / Utveckling v1 freeze contract: [PROGRESS_UTVECKLING_V1.md](./PROGRESS_UTVECKLING_V1.md).
Health Score Explained / Factors v1 freeze contract: [HEALTH_SCORE_EXPLAINED_V1.md](./HEALTH_SCORE_EXPLAINED_V1.md).
Coach v1 freeze contract: [COACH_V1.md](./COACH_V1.md).
Core v1.0 frozen engines and Home Progress Card contracts remain authoritative and must not be redesigned by Progress / Utveckling, Health Score Explained, or Coach.

Health overview metrics such as sleep and steps must not display synthetic values as real user data. Until an integration exists, surfaces show approved empty states such as **“Ingen data”**.

### Locale ownership and storage fallback

The active product locales are `sv` and `nb`. The system/device locale is read from `expo-localization` on hydration (`sv*` → `sv`; `nb`, `nn`, or `no` → `nb`; unsupported locales → `sv`) and is not redefined by a user selection.

The current i18n foundation is **approved and frozen**: typed `sv` / `nb` resources, Swedish fallback behavior, domain enum/value isolation, Profile language selection, and the ownership/storage rules below. Adding `da`, `fi`, or `en` remains future versioned product work and is not prohibited by this freeze.

- Authenticated manual override: `@nordyan/locale/user/{userId}`. A signed-in language change writes only this key.
- Unauthenticated manual override: `@nordyan/locale/manual`.
- Legacy key: `@nordyan/locale/device` is no longer written.

Migration/fallback behavior is intentionally storage-only and requires no database migration:

1. For a signed-in user, read only their user key. If it is absent or invalid, use the current system/device locale. Never fall back to the legacy device key or the unauthenticated manual key.
2. For an unauthenticated session, read the manual key first. If absent, copy a valid legacy device value to the manual key and use it.
3. The legacy key is left intact; existing user keys are never deleted or overwritten.
4. Therefore an existing user preference survives restart, while a new account receives the actual system/device default instead of another account’s manual choice.

Home OpenAI `/generate` is a known deferred Swedish-only contract. Under `nb`, Home intentionally uses deterministic localized Bokmål presentation instead of Swedish AI-generated copy. Any future Bokmål AI generation requires a separate generate-contract version and locale-aware cache behavior.

---

## 13. Architecture Decision Summary

| Decision | Rationale | Status |
|----------|-----------|--------|
| Profile and measurements are separate concepts | identity/baseline vs time-stamped health readings | Approved; transitional profile body storage in v1.0 |
| Engines are deterministic | reproducible outcomes, test vectors, auditability | Frozen |
| AI is explanation-only | Coach Engine selects approved templates; no LLM health math | Frozen |
| Production coach language bridge on Fly.io (`coach-language`, `arn`, `https://coach-language.fly.dev`, port 8788) | Server-side OpenAI formulation only; Supabase JWT auth; Home `/generate` template fallback; Coach Ask `/ask` accepts frozen v1.1–v1.6 | Hosting and Ask v1.6 **VERIFIED & FROZEN** |
| Snapshots are append-only | preserve history, enable progress and future journey views | Frozen |
| Progress is derived from snapshots | one comparison pipeline, no UI-side delta math | Frozen |
| Progress / Utveckling v1 reads `health_snapshots` only | no measurement-history second timeline; activity = `activity_score`; sleep = Ingen data | **Approved & Frozen** (Sprint 23) |
| Health Score Explained composes Development Home | no second pipeline; factors describe development/availability, not ranked contribution; sleep = Ingen data | **Approved & Frozen** (Sprint 24) |
| Coach Ask consumes allowlisted existing facts only | v1.1–v1.5 remain unchanged; v1.6 changes presentation locale only (`sv-SE` / `nb-NO`); AI explains; engines remain authoritative; no silent context widening | v1.1–v1.6 **VERIFIED & FROZEN** |
| Coach Home Ask UX | composer/answer placement, quick-question structure, blur-cleared transient state, persisted per-user body-fat discovery, localized presentation | **Live verified & Frozen** |
| i18n foundation | typed `sv` / `nb`, locale ownership, Profile selector, enum isolation, Swedish fallback | **Live verified & Frozen**; future locale expansion remains planned |
| Home Priorities Integrity v1 | Priority 1 = Focus; 2–3 = local general advice; checkboxes local-only | **Approved & Frozen** (Sprint 25) |
| UI is presentation-only | prevent drift between screens and engines | Approved |
| Service-first architecture | screens stay thin, business rules stay testable | Approved |
| Snapshot failure is non-blocking for profile save | user profile is source of operational truth; snapshots are best-effort history | Approved |
| Measurement persist-first + typed partial snapshot failure | measurement rows kept if snapshot/engines fail; Home may lag | **Frozen** (Measurement Module v1.0) |
| Shared body fat formatting | onboarding and Home must show the same engine-derived value | Approved |
| Home hierarchy: Score → Progress → Focus → Coach | consistent “how am I doing now?” reading order | Approved |
| Measurement Module owns recurring weight/waist/neck capture | Profile UI does not edit body fields; Home prefers measurement snapshots; profile body fields transitional fallback | **Approved & Frozen** (Sprint 22) |
| Deprecate transitional profile body fields | remove dual storage after Measurement freeze | Planned (ADR-007) |

---

## Document Status

This file remains a **draft** for full Architecture v1.0 document freeze.

It is **not** yet:

> Approved & Frozen — NORDYAN Architecture v1.0

**Related freezes:**

- **Sprint 22 completed:** Measurement Module v1.0 is **Approved & Frozen** — see [MEASUREMENT_MODULE_V1.md](./MEASUREMENT_MODULE_V1.md).
- **Sprint 23 completed:** Progress / Utveckling v1 is **Approved & Frozen** — see [PROGRESS_UTVECKLING_V1.md](./PROGRESS_UTVECKLING_V1.md) and §7 / §8 / §9 / §12 / §13 in this document.
- **Sprint 24 completed:** Health Score Explained / Factors v1 is **Approved & Frozen** — see [HEALTH_SCORE_EXPLAINED_V1.md](./HEALTH_SCORE_EXPLAINED_V1.md) and §7 / §8 / §9 / §12 / §13 in this document.
- **Sprint 25 completed:** Coach v1 is **Approved & Frozen** — see [COACH_V1.md](./COACH_V1.md) and §7 / §8 / §9 / §12 / §13 in this document.

Sprint 25 documentation freeze updates did not change application code, schema, config, or deployment.
