# NORDYAN Progress / Utveckling v1.0

**Status:** Approved & Frozen — Progress / Utveckling v1  
**Sprint:** 23 — Progress / Utveckling v1 (**completed**)  
**Parent reference:** [NORDYAN Architecture v1.0](./NORDYAN_ARCHITECTURE_V1.md)  
**Last updated:** 2026-08-11 (Factors CTA destination recorded → Health Score Explained v1)

---

## 1. Purpose

Progress / Utveckling v1 is the dedicated product surface for reviewing how health has developed over time from **persisted health snapshots**.

It answers:

> **How has my health developed?**

Its role is to:

- present current Health Score and latest-vs-previous change on Development Home
- present period-scoped historical series on Development Trends
- compose read-only views from SnapshotService / `health_snapshots`
- keep UI presentation-only (no health-domain calculations in components)

This document is the **Approved & Frozen** specification for Progress / Utveckling v1. Behavioral or contract changes require an explicit versioned change request and architecture review.

---

## 2. Implemented surfaces

| Surface | Figma | Route |
|---------|-------|-------|
| Development Home | `nordyan-development-home` | `/(tabs)/progress` |
| Development Trends | `nordyan-development-trends` | `/(tabs)/progress/trends` |

The Utveckling tab (`progress`) label and icon behavior remain unchanged.

---

## 3. Architecture flow

```
UI (Development Home / Trends)
→ Development hooks (useDevelopmentHome / useDevelopmentTrends)
→ Development presentation / view-model
→ Development service
→ SnapshotService
→ health_snapshots
```

Rules:

- UI consumes display-ready view-model values only.
- UI must **not** perform Health Score, trend, driver, or period business calculations.
- Hooks call `developmentService` only (no direct Supabase, no engines, no Coach Language).

---

## 4. Historical source of truth

**`health_snapshots` is the sole historical source for Progress v1.**

- Period history is read with a query-level `created_at` range filter (`getSnapshotHistoryInRange`).
- Measurement history is **not** a second Progress timeline.
- Progress v1 does not invent observations outside persisted snapshots.

---

## 5. Development Home

Development Home records and presents:

- current Health Score
- latest-vs-previous Health Score change
- waist change
- weight change
- `activity_score` change
- Sleep limitation state (`Ingen data`)
- deterministic Coach presentation from persisted snapshot Coach fields

Insufficient history (fewer than two snapshots for comparison) uses prepared presentation states — not fabricated deltas.

---

## 6. Development Trends

### Periods

- 7 days (`7d`)
- 30 days (`30d`)
- 90 days (`90d`)
- 1 year (`1y`)

### Metrics

- Health Score
- Weight (Vikt)
- Waist (Midja)
- Neck (Hals)
- Activity (Aktivitet)

Historical series use persisted snapshot timestamps (`created_at`) and persisted snapshot field values.

### Sparse history

When fewer than **2** valid points exist in the selected period:

- show the prepared **insufficient-history** state
- do **not** draw a fake trend
- do **not** create synthetic health points
- do **not** interpolate invented observations

---

## 7. Activity contract

**Aktivitet** means:

> `health_snapshots.activity_score`

It does **not** mean:

- steps
- Garmin activity
- Apple Health activity
- Health Connect activity
- device-derived activity

Changing this semantics requires a future versioned architecture/product change.

---

## 8. Sleep contract

No persisted sleep data exists in Progress v1.

UI displays:

> **Ingen data**

No sleep value may be invented or derived.

---

## 9. Coach contract

Development screens use **deterministic Coach presentation** from persisted snapshot Coach fields (`coachRecommendationId`, duration, frequency) via existing Coach presentation helpers.

**Coach Language / Fly.io is not called by Progress v1.**

---

## 10. Frozen module boundaries

Sprint 23 did **not** change:

- Measurement Module v1.0
- Health Score Engine
- Focus Engine
- Coach Engine
- HomeProgressCard contract / Home progress contract
- database schema
- migrations
- Coach Language
- deployment configuration

Home Progress Card on Home remains the separate latest-vs-previous Home surface (`ProgressService` / `ProgressSummary`). Progress / Utveckling v1 adds Development Home and Trends without redesigning that Home contract.

---

## 11. Factors CTA destination

The CTA **“Vad påverkar min Health Score?”** on Development Trends navigates to **Health Score Explained / Factors v1** (`/health-score`).

That destination is owned by Sprint 24 and is frozen separately:

→ [HEALTH_SCORE_EXPLAINED_V1.md](./HEALTH_SCORE_EXPLAINED_V1.md)

Progress / Utveckling v1 service contracts remain unchanged except for this previously deferred CTA wiring.

---

## 12. Accepted non-blocking debt

| Item | Notes |
|------|--------|
| Snapshot range query limit = 500 | Upper bound for period-scoped history reads |
| Chart segments | Straight visual segments between real persisted points |
| No synthetic observations | Chart/layout scaling must not invent health values |

---

## 13. Verification (Sprint 23)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| Sprint 23 tests | 15/15 PASS |
| Expo Go — Development Home | VISUAL + FUNCTIONAL PASS |
| Expo Go — Development Trends | VISUAL + FUNCTIONAL PASS |
| Final architecture review | PASS — APPROVED & READY TO FREEZE |

---

## 14. Freeze rule

Behavioral changes to Progress / Utveckling v1 now require an explicit, versioned change request / future milestone and architecture review.

---

## Document status

> **Approved & Frozen — Progress / Utveckling v1**

Sprint 23 documentation freeze updates did not change application code, schema, config, or deployment.
