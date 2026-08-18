# Coach language data control

## OpenAI `store: false`

Production and simulator language requests set `store: false` so outputs are not intentionally retained as product history in the OpenAI Responses API.

**Important:** `store: false` does **not** by itself guarantee Zero Data Retention (ZDR). Organizational OpenAI data-control and retention settings must be reviewed and verified separately before claiming ZDR.

## Payload hygiene

### `/api/coach/generate`

Coach language generate requests may only include the approved decision result and minimal supporting facts. Never send names, emails, user IDs, dates of birth, raw measurement history, Supabase IDs, device IDs, or full health snapshots.

### `/api/coach/ask` (Coach Context v1.1)

Ask requests with payload `coach-ask-v1.1` remain supported. They may only include the allowlisted v1.1 `CoachAskRequest` fields:

- `focus` presentation (type/title/subtitle)
- `plan` presentation (recommendationId/title/description/duration/frequency)
- optional structured `healthState` from existing Development Home composition:
  - persisted overall Health Score
  - score band label
  - latest-vs-previous score change or insufficient_history
  - weight current + existing change or insufficient_history
  - waist current + existing change or insufficient_history
  - `healthScoreActivity` (NORDYAN Health Score **activity driver** — not steps/device data)
- optional `development` trend + historyStatus from Development Home
- required `availability` flags (sleep/steps/device/integrated health are product-false)
- `question`

v1.1 must not include `weeklyCheckIn`. Unknown fields remain rejected. The v1.1 prompt (`nordyan-coach-ask-v1.1`) is unchanged.

### `/api/coach/ask` (Coach Context v1.2)

Frozen client requests use payload `coach-ask-v1.2` and prompt `nordyan-coach-ask-v1.2`. v1.2 includes every v1.1 allowlisted field plus one required context key:

- `weeklyCheckIn`: `null` | allowlisted current-week self-report object

When present, `weeklyCheckIn` may only include:

- `source: 'current_week_self_report'`
- `sleepQuality` / `energy` / `stress` / `everydayActivity` / `eatingQuality` / `planAdherence` as `{ value, polarity, meaning }`
- `trainingFrequency` as `{ value, meaning, kind: 'self_reported_session_count' }`
- `alcoholConsumption` as `{ value, meaning, kind: 'neutral_self_reported_bucket' }`

This is an intentional, versioned expansion of Coach Ask minimum disclosure. It is **not** permission to broadly export health data. Weekly Check-in is explanation context only — not Health Score, Focus, Plan, Measurement, or snapshot input.

`availability.sleepDataAvailable` remains `false` (no measured/device/integrated sleep) even when `weeklyCheckIn.sleepQuality` is present. Those facts are not contradictory.

v1.2 must not include `initialLifestyle`. Unknown fields remain rejected. The v1.2 prompt (`nordyan-coach-ask-v1.2`) is unchanged.

### `/api/coach/ask` (Coach Context v1.3)

New client requests use payload `coach-ask-v1.3` and prompt `nordyan-coach-ask-v1.3`. v1.3 includes every v1.2 allowlisted field plus one required context key:

- `initialLifestyle`: `null` | allowlisted onboarding baseline self-report object

When present, `initialLifestyle` may only include:

- `source: 'onboarding_baseline_self_report'`
- `sleepQuality` / `energy` / `stress` / `everydayActivity` / `eatingQuality` as `{ value, polarity, meaning }` (same v1.2 meaning tables; stress remains `higher_worse`)
- `lessHealthyFoodFrequency`: `null` (legacy row) | `{ value, meaning, kind: 'neutral_self_reported_frequency' }`
- `alcoholConsumption` as `{ value, meaning, kind: 'neutral_self_reported_bucket' }`

Do not send an onboarding date or timestamp. Source semantics are sufficient.

`weeklyCheckIn` and `initialLifestyle` remain separate objects. They must not be merged. This is explanation context only — not Health Score, Focus, Plan, Measurement, snapshot, or Progress input.

`availability.sleepDataAvailable` remains `false` even when subjective `sleepQuality` exists on either source.

The server continues to accept frozen `coach-ask-v1.1` and `coach-ask-v1.2`. v1.1 and v1.2 are not silently widened. `initialLifestyle` on a v1.1 or v1.2 body is rejected. Top-level `initialLifestyle` / `initial_lifestyle` remain rejected. `lessHealthyFoodFrequency` remains forbidden outside the v1.3 Initial Lifestyle object.

### `/api/coach/ask` (Coach Context v1.4)

The server continues to accept `coach-ask-v1.4` / `nordyan-coach-ask-v1.4`. v1.4 includes every v1.3 allowlisted field plus:

- `healthState.bodyComposition` when `healthState` is present:
  - `status: 'ready' | 'unavailable'`
  - `bodyFatPercent: number | null` (latest snapshot `body_fat_pct` / `HealthSnapshot.bodyFatPct`)
  - `estimationKind: 'calculated_from_latest_snapshot' | 'unavailable'`
- required `context.ageBand`: `'18_29' | '30_39' | '40_49' | '50_59' | '60_plus' | null` (derived locally from date of birth; DOB and exact age never leave the device/composer)
- required `context.sex`: `'male' | 'female' | 'other' | null`

Body-fat percentage is **calculated/estimated**, never a measured DEXA/BIA/device value. `ageBand` and `sex` are comparison context only. They do **not** authorize age-specific cutoffs. Internal scoring midpoints and `bodyFatCategory` are not sent.

The server continues to accept frozen `coach-ask-v1.1`, `coach-ask-v1.2`, and `coach-ask-v1.3`. v1.1–v1.3 reject `ageBand`, `sex`, and `bodyComposition`.

### `/api/coach/ask` (Coach Context v1.5)

The server accepts payload `coach-ask-v1.5` and prompt `nordyan-coach-ask-v1.5` without freezing v1.4. v1.5 includes every v1.4 allowlisted field plus required `context.bodyFatReference`:

- ready: `source: 'acsm_getp_10_11_cooper_institute'`, `sex`, `referenceAgeGroup`, `bodyFatPercent`, `referenceMedianPercent`, `comparisonToReferenceMedian` (`below` | `approximately` | `above` in **body-fat % space**), `referencePositionBand`
- unavailable: `unavailableReason` only (`missing_body_fat_percent` | `missing_sex` | `missing_age_band` | `unsupported_sex`)

`bodyFatReference` is a locally computed ACSM/Cooper comparison result. Never send the raw percentile table, a naked `percentile`, Health Score `BODY_FAT_REFERENCE_MIDPOINTS`, or `bodyFatCategory`. `comparisonToReferenceMedian` must not be inverted into a fitness percentile (ACSM 99 = leanest).

v1.1–v1.4 reject `bodyFatReference`. v1.5 remains frozen and accepted. Current client composer uses `coach-ask-v1.6`.

### `/api/coach/ask` (Coach Context v1.6)

**Status: APPROVED & FROZEN.**

v1.6 is locale-only. Health/context/privacy fields and semantics are identical to frozen v1.5. Allowed presentation locales: `sv-SE` | `nb-NO`. App locale `sv` maps to `sv-SE`; `nb` maps to `nb-NO`. User-facing Focus/Plan presentation in v1.6 follows that locale; internal Focus types, recommendation IDs, enums, polarities, and stored meanings stay unchanged.

v1.1–v1.5 continue to require `locale: 'sv-SE'`. v1.5 rejects `nb-NO`. Any change to the v1.6 allowlist, locale set, prompt behavior, completeness guard, one-retry limit, or privacy/logging boundary requires explicit versioned architecture review.

Never send:

- names, emails, user IDs, dates of birth, access tokens
- raw Supabase rows, snapshot IDs, capture timestamps
- Weekly Check-in `id`, `userId`, `weekStartDate`, `createdAt`, `updatedAt`, snake_case DB columns
- previous-week Weekly Check-in answers
- Initial Lifestyle on v1.1 or v1.2
- Initial Lifestyle `id`, `userId`, `createdAt`, `updatedAt`, snake_case DB columns, `trainingFrequency`, `planAdherence`, notes
- onboarding dates / timestamps in the OpenAI payload
- full measurement history or Trends series
- raw `bmiScore` / `whtrScore` / `bodyFatScore`
- neck, height, hip, `bodyFatPct` (use allowlisted `bodyFatPercent` only), `bodyFatCategory`, `bodyFatMethod`, exact `ageYears`
- raw ACSM/Cooper percentile table, `percentile`, `acsmTable`, `referenceTable`
- measurement inputs used to calculate body fat
- chat history / previous messages
- client `instructions` / `system` / `messages` / `extraContext`
- arbitrary loose `healthScore` / `health_score` / `healthScoreBand` injection outside allowlisted `healthState`
- Apple Health / Health Connect, lab, or nutrition fields beyond the allowlisted Weekly Check-in / v1.3 Initial Lifestyle objects

Unknown fields remain rejected by allowlist validation.

Logs for both endpoints are metadata-only (requestId, status/category, latency, endpoint, provider metadata). Ask logs may include request/prompt version, `locale`, model, and response source as non-health routing metadata. Never log question text, AI answers, user ID, JWT, health context (score/weight/waist/activity/bodyFatPercent), ageBand, sex, bodyFatReference, Weekly Check-in values/meanings, Initial Lifestyle values/meanings, whether Weekly Check-in or Initial Lifestyle is present, or plan/focus payload content.
