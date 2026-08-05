# NORDYAN Architecture v1.0

**Status:** Draft — awaiting architecture review  
**Scope:** NORDYAN Core v1.0 and boundaries for future modules  
**Last updated:** 2026-07-30

---

## 1. Purpose

This document defines the **architectural and product boundaries** for NORDYAN Core v1.0.

It describes:

- what NORDYAN Core is responsible for today
- how layers, engines, and services interact
- where the single source of truth lives for each health outcome
- what is frozen, what is planned, and how changes are approved

This document is the reference for future modules such as Measurement, Health Journey, Score Timeline, and external health integrations. It does **not** authorize implementation of those modules by itself.

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

### Current v1.0 state vs future direction

In Core v1.0, weight, waist, and neck are still stored on the Supabase `profiles` row and updated through onboarding and profile save flows. This is a transitional model.

When the **Measurement Module** is introduced:

- weight, waist, and neck must **no longer be treated as ordinary profile edits**
- new measurement events should be captured explicitly with a measurement date
- recalculation and snapshot creation should be triggered from measurement capture, not casual profile field edits

This document records that direction without implementing the Measurement Module.

### Snapshots

A snapshot is an append-only record of engine output at a moment in time: Health Score, driver scores, focus, coach recommendation ID, and the measurements used when the snapshot was taken.

### Progress

Progress is a **derived view** comparing the latest snapshots — for example, score change and trend since the previous snapshot. Progress is not stored as a separate mutable entity; it is computed by ProgressService from snapshot history.

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
| Focus | Focus Engine → `primaryFocus`, reasoning | Home injects focus copy into priorities; no separate Focus card in v1.0 |
| Coach recommendation | Coach Engine → `recommendationId` and presentation copy | Home Coach card and onboarding results consume the same pipeline |
| Snapshot history | SnapshotService | append-only `health_snapshots` rows |
| Progress comparison | ProgressService | compares latest two snapshots; returns `ProgressSummary` |

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
- high-level health overview metrics derived from approved sources

**Approved Home hierarchy (Core v1.0):**

1. Score
2. Progress
3. Focus
4. Coach

Home is a presentation surface over current engine and service output. It is not a second calculation layer.

### Measurement — “How does my health look today?”

**Status:** Planned module

**Future responsibility:**

- capture a dated measurement event
- trigger Health Score, focus, coach, and snapshot recalculation
- separate measurement capture from identity/profile edits

Not implemented in Core v1.0.

### Health Journey — “How has my health developed?”

**Status:** Planned module

**Future responsibility:**

- show historical measurements and snapshots over time
- support longitudinal review without mutating history

Not implemented in Core v1.0. Progress card on Home provides a minimal latest-vs-previous view only.

### Profile — “Who am I?”

**Responsibility:**

- identity and slowly changing baseline fields
- gender, birth year, height, activity level, goal
- account actions such as sign-out

In Core v1.0, profile save may still update weight, waist, and neck for transitional reasons. This is expected to move to Measurement Module capture later.

---

## 8. Snapshot and Progress Rules

### Snapshot rules

- Snapshots are **append-only**
- SnapshotService owns all create/read access to `health_snapshots`
- Snapshot rows store engine output plus the measurements used at capture time
- UI never writes snapshots directly
- UI never compares snapshots directly

### Snapshot creation pipeline

Approved orchestration:

```
profile save or onboarding sync
→ calculateHomeHealthScoreFromProfile()
→ determineFocus()
→ generateRecommendation()
→ snapshotService.createSnapshot()
```

Snapshot creation is **best-effort** after a successful profile save. A snapshot failure must **not** cause a successful profile save to be reported as failed to the user.

### Current snapshot reasons in use

| Reason | When used |
|--------|-----------|
| `onboarding` | after onboarding profile sync |
| `profile_update` | after profile tab save |

The domain and database schema also define `weekly_checkin`, but it is not yet used by an approved product flow in Core v1.0.

The Measurement Module is expected to introduce a measurement-specific snapshot reason later. No final enum name is declared here beyond what already exists in the schema.

### Progress rules

- ProgressService derives comparisons from SnapshotService history
- current approved comparison type: `latest_vs_previous` using two snapshots
- domain trends: `improving`, `stable`, `declining`, `insufficient_history`
- UI reads `ProgressSummary`; it does not compute deltas or trends
- Home Progress Card v1.0 displays score, score delta, and trend message only

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

## 12. Planned Modules

The following are **planned**, not frozen, and not implemented in Core v1.0:

| Module | Purpose |
|--------|---------|
| Measurement Module v1.0 | dated measurement capture separated from profile identity |
| Health Journey | longitudinal history of measurements and snapshots |
| Score Timeline | visual history of Health Score over time |
| Future health integrations | Apple Health, Health Connect, Garmin, device-derived sleep/steps |

Until a planned module is approved and frozen, Core v1.0 behavior in this document remains authoritative.

Health overview metrics such as sleep and steps must not display synthetic values as real user data. Until an integration exists, surfaces show approved empty states such as **“Ingen data”**.

---

## 13. Architecture Decision Summary

| Decision | Rationale | Status |
|----------|-----------|--------|
| Profile and measurements are separate concepts | identity/baseline vs time-stamped health readings | Approved direction; transitional profile storage in v1.0 |
| Engines are deterministic | reproducible outcomes, test vectors, auditability | Frozen |
| AI is explanation-only | Coach Engine selects approved templates; no LLM health math | Frozen |
| Snapshots are append-only | preserve history, enable progress and future journey views | Frozen |
| Progress is derived from snapshots | one comparison pipeline, no UI-side delta math | Frozen |
| UI is presentation-only | prevent drift between screens and engines | Approved |
| Service-first architecture | screens stay thin, business rules stay testable | Approved |
| Snapshot failure is non-blocking for profile save | user profile is source of operational truth; snapshots are best-effort history | Approved |
| Shared body fat formatting | onboarding and Home must show the same engine-derived value | Approved |
| Home hierarchy: Score → Progress → Focus → Coach | consistent “how am I doing now?” reading order | Approved |
| Measurement Module will own weight/waist/neck capture | profile should not remain the long-term edit path for measurements | Planned |

---

## Document Status

This file is a **draft** for architecture review.

It is **not** yet:

> Approved & Frozen — NORDYAN Architecture v1.0

No application code, database schema, services, engines, navigation, or UI were modified to produce this document.
