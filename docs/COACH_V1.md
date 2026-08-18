# NORDYAN Coach v1.0

**Status:** Approved & Frozen — Coach v1, Coach Home Ask UX, and Coach Ask v1.6  
**Sprint:** 25 — Coach Home, Coach Context v1.1, Coach Ask v1.1, Home Priorities Integrity v1 (**completed**)  
**Later expansion:** Coach Context v1.2 — allowlisted current-week Weekly Check-in for Coach Ask only (no new sprint number)  
**Later expansion:** Coach Context v1.3 — allowlisted onboarding Initial Lifestyle baseline for Coach Ask only (no new sprint number)  
**Frozen locale expansion:** Coach Ask v1.6 — `sv-SE` / `nb-NO` response and localized Focus/Plan presentation only  
**Parent reference:** [NORDYAN Architecture v1.0](./NORDYAN_ARCHITECTURE_V1.md)  
**Related frozen modules:** [Progress / Utveckling v1](./PROGRESS_UTVECKLING_V1.md), [Health Score Explained / Factors v1](./HEALTH_SCORE_EXPLAINED_V1.md), [Measurement Module v1.0](./MEASUREMENT_MODULE_V1.md)  
**Last updated:** 2026-08-16

---

## 1. Purpose

Coach v1 is the dedicated product surface and explanation layer for the user’s **already decided** NORDYAN Focus and Plan.

It answers:

> **What should I do now, and how do I understand / adapt that plan?**

Its role is to:

- present authoritative Focus and Plan from the persisted health snapshot
- allow grounded questions about that plan (Coach Ask)
- send only allowlisted structured facts to Coach Language
- keep AI as explanation / contextualization — never as a health authority
- keep Home “Dagens prioriteringar” honest (Focus + local general advice)

This document is the **Approved & Frozen** specification for Sprint 25 Coach architecture and contracts. Behavioral or contract changes require an explicit versioned change request and architecture review.

---

## 2. Status

**Sprint 25 — Coach**

> **APPROVED & FROZEN**

---

## 3. Coach Home responsibility

**Route:** `/(tabs)/coach`

Coach Home is a **read-only presentation surface**. It does not calculate Health Score, Focus, or Plan.

It presents:

- NORDYAN Master Coach Avatar
- deterministic current Focus (persisted snapshot + existing Focus presentation)
- deterministic current Plan (persisted snapshot + existing Coach presentation)
- suggested questions
- Ask input / send flow with keyboard avoidance / scroll UX
- approved premium gold visual system

**Source of truth:** latest `health_snapshots` row via `SnapshotService` → `coachHomeService` → Coach Home presentation → Coach UI.

Coach Home does **not** invoke Health Score Engine, Focus Engine, or Coach Engine.

The approved Coach Home Ask UX is frozen:

- composer placement and answer surface
- three-slot quick-question structure and selection behavior
- question / answer / pending / error state remains visible while Coach stays focused
- transient Ask state and composer draft clear when Coach loses focus
- per-user body-fat discovery flag remains local and persisted; tab blur never clears it
- Focus and Plan presentation follows the active `sv` / `nb` locale without changing internal Focus type or Plan recommendation ID

---

## 4. Architecture flows

### Coach Home

```
UI (Coach tab)
→ useCoachHome()
→ Coach Home presentation / view-model
→ coachHomeService
→ SnapshotService.getLatestSnapshot()
→ health_snapshots
```

### Coach Ask

```
User question
→ useCoachQuestion()
→ Coach Context composer
    → existing Coach Home read path
    → existing Development Home read path
    → optional current-week Weekly Check-in (`getCurrentWeek` only; fail-closed)
    → optional onboarding Initial Lifestyle (`initialLifestyleService.get` only; fail-closed)
→ coach-ask-v1.6 allowlisted payload (current client)
→ POST /api/coach/ask (Coach Language, coach-language.fly.dev)
→ OpenAI (store: false, nordyan-coach-ask-v1.6)
→ explanatory answer (session UI only)
```

The server accepts frozen `coach-ask-v1.1`–`coach-ask-v1.6` and selects the matching frozen prompt. Earlier versions are not silently widened. v1.1–v1.5 remain Swedish-only; v1.6 accepts only `sv-SE` / `nb-NO`.

AI output is rendered in local Ask UI state. It is **not** persisted as health history and does **not** write snapshots, measurements, Focus, Plan, Development, or user health state.

### Home → Coach

Home Coach card CTA **“Visa dagens plan”** navigates to the existing Coach tab (`routes.coach` → `/(tabs)/coach`).

### Home Priorities Integrity v1

```
Existing Home health composition / Focus
→ Priority 1 (authoritative Focus presentation, or honest fallback)

Local curated advice bank (deterministic day-key selection)
→ Priorities 2–3 (presentation-only general advice)
```

No AI. No backend. No schema. Checkboxes are local acknowledgement only (`useState`).

---

## 5. Authority boundaries

| Outcome | Authoritative owner | Coach / AI may |
|---------|---------------------|----------------|
| Health Score | Health Score Engine → persisted snapshot | Consume existing score / band / change facts only. Never recalculate. |
| Focus | Focus Engine → persisted snapshot | Explain the current Focus. Never replace it. |
| Plan | Deterministic Coach Engine → persisted coach recommendation | Help execute / adapt the same plan. Never replace it as the NORDYAN plan. |
| Development | DevelopmentService over `health_snapshots` | Reuse Home summary facts. No parallel Progress engine. |
| Measurement | Measurement Module v1.0 | Must not reinterpret raw measurement history. |
| Home priorities 2–3 | Local curated advice bank | Presentation only. Not health authority. |

**Authority rule:**

> **NORDYAN determines. AI explains.**

AI must not:

- recalculate Health Score
- replace Focus
- replace the authoritative Plan / recommendation ID
- invent missing health data
- diagnose medical conditions

---

## 6. Coach Context v1.1

Coach Ask may receive **approved structured existing NORDYAN facts** composed from frozen read paths:

- current persisted Health Score
- Health Score band label (existing presentation helper)
- existing score change **or** `insufficient_history`
- current weight + existing change **or** `insufficient_history`
- current waist + existing change **or** `insufficient_history`
- Health Score **activity driver** development (`activity_score` — never step count)
- overall Development trend / history state
- authoritative Focus (type / title / subtitle)
- authoritative Plan (recommendationId / title / description / duration / frequency)
- explicit availability flags

If Development Home is not ready, `healthState` / `development` are omitted. Missing data is never invented.

Coach Context reuses frozen Development Home composition (`developmentService.getHomeSummary`). It does **not** read Trends series, Measurement history, or raw Supabase rows for Ask.

### Explicitly excluded

- PII (name, email, DOB, user ID in the OpenAI payload)
- raw history / full Trends arrays
- raw Supabase rows / snapshot IDs / capture timestamps
- neck
- body-fat percentage / body-fat driver score **on v1.1–v1.3** (v1.4 allowlists calculated `bodyFatPercent` only)
- exact age / date of birth / height / hip / `bodyFatCategory` / scoring midpoints
- raw BMI / WHtR driver scores
- sleep values
- step values
- Apple Health / Health Connect
- labs / testosterone
- nutrition
- previous chat history
- client-supplied system instructions / extra context
- auth tokens

Future additions (sleep tracking, steps, Apple Health, Health Connect, labs) **must extend this architecture explicitly**. Silent widening of Coach Context is forbidden.

### Coach Context v1.2 (Weekly Check-in)

v1.2 adds **only** `context.weeklyCheckIn: null | allowlisted object` to new client Ask requests (`coach-ask-v1.2`, prompt `nordyan-coach-ask-v1.2`).

- Current-week self-report via `weeklyCheckInService.getCurrentWeek` only
- Empty, fetch failure, or mapping failure → `weeklyCheckIn: null`; Ask continues
- Never previous week, never Initial Lifestyle, never raw `WeeklyCheckIn` / DB row
- Not an input to Health Score, Focus, Plan, Snapshot, Measurement, or Progress
- `sleepDataAvailable` remains `false`; subjective `sleepQuality` is not measured sleep

Initial Lifestyle is implemented and frozen as an onboarding baseline. Coach Ask v1.3 may use the allowlisted projection only.

### Coach Context v1.3 (Initial Lifestyle baseline)

v1.3 adds **only** `context.initialLifestyle: null | allowlisted object` alongside the existing required `context.weeklyCheckIn` key (`coach-ask-v1.3`, prompt `nordyan-coach-ask-v1.3`).

- Onboarding baseline via `initialLifestyleService.get` only
- Empty, fetch failure, or mapping failure → `initialLifestyle: null`; Ask continues
- Legacy `lessHealthyFoodFrequency: null` is preserved on an otherwise valid baseline
- Never raw `InitialLifestyleCheck` / DB row, never IDs/timestamps, never `trainingFrequency` / `planAdherence`
- Not merged with Weekly Check-in. Sources remain `onboarding_baseline_self_report` vs `current_week_self_report`
- Not an input to Health Score, Focus, Plan, Snapshot, Measurement, or Progress
- No onboarding date in the OpenAI payload

v1.2 remains Weekly Check-in-only.

### Coach Context v1.4 (body composition)

v1.4 adds **calculated** body-fat percentage from the latest snapshot plus derived `ageBand` and `sex`. It does **not** freeze. It does **not** change engines.

- `healthState.bodyComposition.bodyFatPercent` from `HealthSnapshot.bodyFatPct` / `health_snapshots.body_fat_pct`
- `estimationKind: calculated_from_latest_snapshot` — never measured DEXA/BIA/device
- `ageBand` derived locally; DOB and exact age never enter the OpenAI payload
- `sex`: `male | female | other | null`
- ageBand + sex do **not** authorize age-specific classification; NORDYAN has no Coach-facing age-reference table in v1.4

v1.1, v1.2, and v1.3 remain frozen and reject v1.4-only fields.

### Coach Context v1.5 (ACSM body-fat reference)

v1.5 adds a **deterministic** ACSM/Cooper population comparison as `context.bodyFatReference`. It does **not** freeze. It does **not** change Health Score, Focus, Plan, Measurement, or snapshot engines.

Source: ACSM *Guidelines for Exercise Testing and Prescription*, 10th and 11th editions, Tables 4.4 (men) and 4.5 (women), adapted from The Cooper Institute *Physical Fitness Assessments and Norms for Adults and Law Enforcement*. Skinfold-derived % body fat. Population/fitness reference only — not a diagnosis, clinical cutoff, or optimal-health target.

- USER VALUE remains `healthState.bodyComposition.bodyFatPercent` (calculated from latest snapshot)
- REFERENCE is the precomputed `bodyFatReference` result. The raw table is never sent to OpenAI
- `comparisonToReferenceMedian` is in body-fat % space (`below` = lower % than the median). Do not expose a naked fitness percentile (99 = leanest)
- Age mapping: `18_29` → ACSM `20_29`; `60_plus` → ACSM `60_69` (`70_79` is stored but unused without exact age)
- `sex: other` or missing inputs → `unavailable` with a concise reason

v1.1–v1.4 remain accepted and reject `bodyFatReference`.

Coach Home quick questions (sent to Ask, not static answers):

1. `Varför är detta mitt fokus?`
2. `Hur ligger min fettprocent till jämfört med andra i min ålder?`
3. `Vad kan jag göra istället idag?` — Plan-relative alternative; not a hardcoded walk

---

## 7. Coach Ask contract

| Field | Value |
|-------|--------|
| Endpoint | `POST /api/coach/ask` |
| Production service | `https://coach-language.fly.dev` |
| Payload version | **Frozen** `coach-ask-v1.6` (current client). Server also accepts frozen `coach-ask-v1.1`–`v1.5`. |
| Prompt | **Frozen** `nordyan-coach-ask-v1.6`. Server selects prompt by payload version. |
| Locale | `sv-SE` or `nb-NO` (app `sv` → `sv-SE`, app `nb` → `nb-NO`). v1.1–v1.5 remain `sv-SE` only. |
| Auth | Supabase Bearer JWT (same as `/generate`) |
| Rate limit | Shared user bucket with `/generate`: **6/min**, **40/day** |

Allowlist validation rejects unknown fields, forbidden PII/history keys, client `instructions` / `system` / `messages` / `extraContext` / `previousMessages`, and any attempt to mark sleep / steps / device / integrated health as available.

`/api/coach/generate` behavior remains intact (Home Coach Language). Ask must not be used as generate, and generate must not be used as Q&A.

**Deferred limitation:** Home OpenAI `/generate` remains frozen Swedish-only. Under `nb`, the app intentionally skips Swedish AI copy and uses the deterministic localized Bokmål Coach presentation. Future Bokmål AI generation requires a separately versioned generate contract and locale-aware cache keys; do not widen the current generate contract in place.

---

## 8. Coach Language authority boundary

Coach Language remains an **explanation / contextualization layer**.

- Deterministic engines decide Focus, Plan, and Health Score.
- OpenAI formulates language from allowlisted facts + the user question.
- System instructions are server-owned (`nordyan-coach-ask-v1.6` for v1.6 payloads; frozen `nordyan-coach-ask-v1.5` for v1.5; frozen `nordyan-coach-ask-v1.3` for v1.3 payloads; frozen `nordyan-coach-ask-v1.2` for v1.2; frozen `nordyan-coach-ask-v1.1` for v1.1). Clients cannot inject instructions.
- OpenAI requests set `store: false`.
- Production logs are **metadata-only** (`requestId`, endpoint, request/prompt version, locale, model, response source, status/category, latency, provider). Question text, AI answers, user ID, JWT, health context, Weekly Check-in values, and Initial Lifestyle values must not be logged.

`store: false` is not a Zero Data Retention (ZDR) claim. Organizational OpenAI retention remains a separate control. See [DATA_CONTROL.md](../shared/coach-language/DATA_CONTROL.md).

---

## 9. AI failure behavior

Coach Language unavailable, timeout, validation failure, rate limit, or OpenAI error:

- Focus remains (snapshot presentation)
- Plan remains (snapshot presentation)
- Health state remains
- Ask shows a **soft error** only (`Nordyan kunde inte svara just nu. Försök igen.` / unavailable copy)
- no engine recalculation
- no snapshot write
- no mutation of Measurement, Development, Focus, Plan, or Health Score

Development unavailable → Ask omits / fails closed; **no invented development**.  
Insufficient history → `insufficient_history` flags; **no invented trend/delta**.  
Sleep unavailable → `sleepDataAvailable: false`; Coach must not invent measured sleep. Subjective `weeklyCheckIn.sleepQuality` may still be present in v1.2.  
Steps unavailable → `stepsDataAvailable: false`; Coach must acknowledge missing data.  
Weekly Check-in missing or fetch failure → `weeklyCheckIn: null`; Ask continues; do not invent a week.  
Initial Lifestyle missing or fetch failure → `initialLifestyle: null`; Ask continues; do not invent a baseline.  
`healthScoreActivity` is never semantically treated as step count.

---

## 10. Home Priorities Integrity v1

“Dagens prioriteringar” is **not** a new health authority.

- **Priority 1:** existing authoritative Focus presentation from Home health composition (honest fallback if Focus is unavailable)
- **Priorities 2–3:** deterministically selected general habits from a curated **local** advice bank
- Selection is stable for the local calendar day key (`YYYY-MM-DD`)
- General advice does not imply tracking, fabricate progress, or claim observed user behavior
- Advice does not affect Health Score, Focus, or Plan
- Checkbox completion is **local acknowledgement only** (in-memory). No persistence, streak, or scoring semantics

Removed fabricated / pseudo-tracked copy, including:

- “4 glas kvar att dricka”
- fixed 2L tracking implication
- fixed 22:30 bedtime claim
- fake hydration / sleep / step progress

The advice bank must not be silently expanded into a tracking or scoring system.

---

## 11. Privacy / minimum-disclosure boundary

Only the allowlisted, version-validated `CoachAskRequest` (`coach-ask-v1.1`–`coach-ask-v1.6`) may reach Coach Language / OpenAI.

Protected against:

- name, email, DOB
- user ID in the OpenAI payload (JWT is used only for Coach Language auth + rate limit)
- raw snapshot / snapshot IDs
- full measurement history / full Trends arrays
- raw Supabase records
- Weekly Check-in id / timestamps / `weekStartDate` / snake_case columns
- Initial Lifestyle id / timestamps / snake_case columns / `trainingFrequency` / `planAdherence` (v1.3 allowlists only the seven baseline dimensions, with legacy nutrition `null`)
- auth tokens in logs or OpenAI input
- client-supplied system instructions
- previous messages / arbitrary extra context

---

## 12. Frozen module protection

Sprint 25 did **not** behaviorally alter:

- Measurement Module v1.0
- Health Score Engine
- Focus Engine
- existing deterministic Coach Engine
- Development / Progress contracts (Coach Context **reads** Development Home; it does not duplicate or replace it)
- Health Score Explained / Factors v1
- HomeProgressCard
- schema / migrations
- authentication
- onboarding
- device integrations

SnapshotService gained `getSnapshotHistoryInRange` for Progress / Utveckling v1 (Sprint 23). Coach Home uses `getLatestSnapshot` only. Coach Ask does not call that range API.

---

## 13. Known intentional limitations

Sprint 25 does **not** include:

- measured / device sleep values (`sleepDataAvailable` remains false)
- step counts (always unavailable)
- Apple Health
- Health Connect
- wearable / device activity streams
- nutrition / weight-management coaching beyond existing Plan adaptation
- Food Scanner
- blood / lab / testosterone insights
- Initial Lifestyle in Coach Ask before v1.3
- persisted chat history
- Ask answers as a second source of Focus / Plan / Score
- dedicated Plan details / action surface (“Visa detaljer” is not shown on Coach Home; `/health-score` remains Health Score Explained only)

Weekly Check-in **capture** (26D) and Home cadence / same-week Initial Lifestyle suppression (26E) are implemented and frozen. They do not feed Health Score, Focus, Plan, Snapshot, Measurement, or Progress. Coach Ask v1.2 may use the current-week allowlisted projection only. Coach Ask v1.3 may additionally use the allowlisted onboarding Initial Lifestyle projection.

The snapshot reason `weekly_checkin` remains unused. Product Veckokoll persists in `weekly_check_ins`.

---

## 14. Future roadmap (record only)

Implemented after Sprint 25 (no new sprint number assigned):

- Weekly Check-in capture + Home cadence (26D / 26E) — **frozen**
- Initial Lifestyle onboarding baseline — **frozen**
- Coach Context v1.2 — current-week Weekly Check-in explanation context
- Coach Context v1.3 — onboarding Initial Lifestyle baseline explanation context

Later:
- dedicated Plan details / action surface (not `/health-score`; introduce only when a real plan-details destination exists)
- Apple Health
- Health Connect
- richer activity / sleep context
- nutrition / weight management
- Food Scanner
- blood / lab / testosterone insights

Do not silently widen Coach Context for these.

---

## 15. Verification (Sprint 25)

| Check | Result |
|-------|--------|
| Coach Context composer + Coach Home tests | 11/11 PASS |
| Home Priorities tests | 10/10 PASS |
| `npm run test --prefix services/coach-language` | 26/26 PASS |
| `npm run test:coach-language` | 26/26 lib + 26/26 service PASS |
| `npx tsc --noEmit` | PASS |
| Product-owner Expo Go — Coach Home visual/functionality | PASS (recorded) |
| Product-owner Expo Go — Master Avatar, premium gold, keyboard UX | PASS (recorded) |
| Product-owner Expo Go — Focus + Plan | PASS (recorded) |
| Product-owner — production Coach Ask | PASS (recorded) |
| Product-owner — broader Coach Context questions | PASS (recorded) |
| Product-owner — missing sleep / missing steps behavior | PASS (recorded) |
| Product-owner — Health Score recalculation refusal | PASS (recorded) |
| Product-owner — Home Coach Language regression | PASS (recorded) |
| Product-owner — Home → “Visa dagens plan” → Coach | PASS (recorded) |
| Product-owner — Home Priorities Integrity v1 | PASS (recorded) |
| Final architecture review | PASS — APPROVED & FROZEN |

---

## 16. Freeze rule

Changes to the following now require explicit architecture review:

- Coach Ask contracts and prompts (`coach-ask-v1.1`–`v1.6`, including `nordyan-coach-ask-v1.6`)
- Coach Home Ask UX lifecycle, quick-question structure, and per-user body-fat discovery persistence
- `sv` / `nb` localized Focus and Plan presentation supplied to v1.6 Ask
- Coach Context data scope
- AI authority
- Health Score / Focus / Plan authority
- privacy / minimum-disclosure boundary
- Weekly Check-in as an engine input (forbidden)
- Initial Lifestyle as an engine input (forbidden)

Visual / copy improvements may still occur through normal controlled product work **without** redefining authority.

---

## Document status

> **APPROVED & FROZEN — Coach v1 (Sprint 25)**  
> **APPROVED & FROZEN — Coach Ask v1.6 / `nordyan-coach-ask-v1.6` (`sv-SE` + `nb-NO`)**  
> Weekly Check-in and Initial Lifestyle remain non-authoritative context. v1.1–v1.5 semantics are unchanged.

This documentation freeze does not change application code, schema, config, deployment, Home cadence, or scoring.
