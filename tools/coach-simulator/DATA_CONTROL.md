# NORDYAN Coach Simulator — Data Control

This document applies to the internal coach simulator and the future production coach language service.

## OpenAI request configuration

The server-side language service sends coach requests with:

- `store: false` on OpenAI Responses API calls
- Only the approved `CoachPromptPayload` (decision + supportingFacts + instructions)
- No user identifiers, raw measurement history, or Supabase/device IDs

## Important limitation

`store: false` **does not by itself guarantee Zero Data Retention (ZDR)**.

Before using real health data in production you must also review:

- OpenAI organisation/platform data control settings
- Data retention and logging policies for your deployment environment
- Whether your OpenAI account tier supports the required retention controls
- Contractual and regulatory requirements for health-related data in your market

Treat `store: false` as one control among several — not a complete privacy guarantee.

## Simulator data

- All scenarios in the scenario library are **synthetic**
- Do not paste real user names, emails, or measurement exports into the simulator
- Manual QA reviews are stored **locally in the browser only** (`localStorage`)
- Exported JSON reports must not contain API keys, PII, or raw health records

## Logging

Server logs include only:

- request ID
- prompt version
- provider
- latency
- success/failure category

Server logs do **not** include full request payloads, generated coach text, or API keys by default.

## Environment variables

- `OPENAI_API_KEY` must remain **server-side only**
- Do **not** use `VITE_OPENAI_API_KEY` or any client-exposed env prefix
- See `.env.example` for local development setup

## Before production Expo integration

1. Confirm OpenAI organisational retention settings with your security review
2. Add authenticated backend access to the coach endpoint
3. Wire production decision payloads without raw history leakage
4. Complete Swedish language QA sign-off on `nordyan-coach-v2` (or later version)
