# Coach language data control

## OpenAI `store: false`

Production and simulator language requests set `store: false` so outputs are not intentionally retained as product history in the OpenAI Responses API.

**Important:** `store: false` does **not** by itself guarantee Zero Data Retention (ZDR). Organizational OpenAI data-control and retention settings must be reviewed and verified separately before claiming ZDR.

## Payload hygiene

Coach language requests may only include the approved decision result and minimal supporting facts. Never send names, emails, user IDs, dates of birth, raw measurement history, Supabase IDs, device IDs, or full health snapshots.
