# NORDYAN Health Score Explained / Factors v1.0

**Status:** Approved & Frozen — Health Score Explained / Factors v1  
**Sprint:** 24 — Health Score Explained / Factors v1 (**completed**)  
**Parent reference:** [NORDYAN Architecture v1.0](./NORDYAN_ARCHITECTURE_V1.md)  
**Related frozen modules:** [Progress / Utveckling v1](./PROGRESS_UTVECKLING_V1.md)  
**Approved Figma:** `nordyan-health-score-explained`  
**Last updated:** 2026-08-11

---

## 1. Purpose

Health Score Explained / Factors v1 is the dedicated product surface that answers:

> **What affects my Health Score right now?**

Its role is to:

- present the persisted latest Health Score with band and latest-vs-previous change
- present factor cards describing observed development / availability
- reuse Development Home / Snapshot composition (no second data pipeline)
- keep UI presentation-only (no Health Score or contribution calculations in components)

This document is the **Approved & Frozen** specification for Health Score Explained / Factors v1. Behavioral or contract changes require an explicit versioned change request and architecture review.

---

## 2. Status

**Sprint 24 — Health Score Explained / Factors v1**

> **APPROVED & FROZEN**

---

## 3. User journey

```
Development Trends
→ "Vad påverkar min Health Score?"
→ /health-score
→ Health Score Explained
```

The previous orphan/mock `/health-score` screen has been replaced by this real surface. There is no duplicate Explained route.

---

## 4. Architecture flow

```
app/health-score.tsx
→ useHealthScoreExplained()
→ Health Score Explained presentation / view-model
→ HealthScoreExplainedService
→ existing DevelopmentService (getHomeSummary)
→ existing SnapshotService
→ health_snapshots
```

Rules:

- UI consumes display-ready view-model data only.
- No Health Score calculation occurs in UI.
- No Supabase queries from UI.
- No engine calls from UI/hooks.
- No duplicated delta pipeline — Explained composes existing Development Home output.

---

## 5. Health Score contract

The screen displays:

- persisted latest Health Score
- static denominator (`AV 100`)
- existing Health Score band label (`getHealthScoreBandLabel`)
- existing latest-vs-previous score change (`formatDevelopmentScoreChange`)

Sprint 24 introduced **no**:

- Health Score formula changes
- new score weights
- score recalculation
- contribution calculations
- factor ranking

---

## 6. Factor contract

Fixed v1 visual order:

1. Midjemått
2. Aktivitet
3. Sömn
4. Vikt

Factors describe **observed development / availability**.  
They do **not** represent ranked Health Score contribution.

No implementation may claim “störst påverkan”, contribution points, or factor ranking unless such information already exists as persisted truth (it does not in v1).

---

## 7. Midjemått

Uses existing persisted waist data and the existing latest-vs-previous waist delta.

Supported presentation states include:

- Positiv utveckling (waist decreased)
- Negativ utveckling (waist increased)
- Oförändrad
- insufficient history (`För lite historik`)

No new WHtR / Health Score calculation is performed for this screen.

---

## 8. Aktivitet

**Aktivitet** means **only**:

> `health_snapshots.activity_score`

It does **not** mean:

- steps
- Garmin
- Apple Health
- Health Connect
- device-derived activity
- exercise minutes

Presentation uses the existing `activityScore` latest-vs-previous comparison only.

---

## 9. Sömn

No persisted sleep data exists in v1.

UI displays:

> **Ingen data**

with honest limitation copy equivalent to: sleep data is missing and is not part of the current Health Score calculation.

The screen must **not**:

- derive sleep
- create sleep scores
- create sleep trends
- generate sleep recommendations
- claim sleep currently contributes to the frozen Health Score

Sleep limitation remains explicit.

---

## 10. Vikt

Uses the existing latest-vs-previous weight delta.

Approved presentation semantics:

| Weight delta | Status |
|--------------|--------|
| decreased | Positiv utveckling |
| unchanged | Oförändrad |
| increased | Negativ utveckling |
| insufficient history | existing insufficient-history state |

This describes **weight development only**. It does **not** imply:

- Health Score contribution points
- medical benefit ranking
- factor ranking

No new Health Score logic exists for weight on this screen.

---

## 11. Coach contract

Health Score Explained uses **deterministic Coach presentation** from existing persisted snapshot / Development data.

No:

- Coach Engine rerun
- new recommendation generation
- Coach Language call
- hardcoded Figma example coach text
- unsupported sleep-tip action button

---

## 12. Required data states

Supported states:

- loading
- error
- no snapshot / empty
- one snapshot / insufficient history
- multiple snapshots / comparable history

No fake health values or synthetic observations.

---

## 13. Deferred product surface

**“Hur beräknas Health Score?”** is visible in the approved Figma and implementation.

Its destination is intentionally **not** implemented. There is currently no approved Figma design for that methodology surface.

> **ACCEPTED DEFERRED PRODUCT SURFACE**

It is not part of Sprint 24 v1 and is not a freeze blocker. Do not invent its future destination in this freeze.

---

## 14. Frozen module protection

Sprint 24 did **not** behaviorally modify:

- Measurement Module v1.0
- Health Score Engine
- Focus Engine
- Coach Engine
- Progress / Utveckling v1 service contracts (except wiring the previously deferred Factors CTA)
- Development Home behavior
- Development Trends behavior (beyond Factors CTA navigation)
- HomeProgressCard
- Home progress contract
- Coach Language
- schema / migrations
- Fly / deployment
- device integrations

---

## 15. Accepted non-blocking debt

| Item | Notes |
|------|--------|
| “Hur beräknas Health Score?” destination deferred | Visual CTA only; no methodology surface in v1 |
| HealthScoreExplainedService composition | Intentionally composes existing Development Home data |
| Unused hook `refresh` | May be cleaned later |
| Empty/error summary chrome | Honest placeholder (`—` / `…`) accepted as v1 UX debt |

---

## 16. Verification (Sprint 24)

| Check | Result |
|-------|--------|
| Relevant Sprint 24 tests | 24/24 PASS |
| `npx tsc --noEmit` | PASS |
| Expo Go — functional | PASS |
| Expo Go — visual (`nordyan-health-score-explained`) | PASS |
| Weight decrease → Positiv utveckling | PASS |
| Final architecture review | PASS — APPROVED & READY TO FREEZE |

---

## 17. Freeze rule

Behavioral changes to Health Score Explained / Factors v1 now require an explicit, versioned future milestone / change request and architecture review.

---

## Document status

> **APPROVED & FROZEN — Health Score Explained / Factors v1**

Sprint 24 documentation freeze updates did not change application code, schema, config, or deployment.
