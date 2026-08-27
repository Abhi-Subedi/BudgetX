# Architecture

## Overview

```
frontend/  React SPA (Vite + TS + Tailwind)
backend/
  app/
    api/routes/    HTTP layer — thin routers, no business logic
    api/deps.py    Authentication & session dependencies
    schemas/       Pydantic request/response contracts
    services/      Business logic (the real application)
    models/        SQLAlchemy ORM entities
    core/          Config, security primitives, errors, rate limiting
    db/            Engine, session factory, model registry
  alembic/         Migrations
```

Dependency direction: `api → services → models`, with `schemas` as the contract
layer between HTTP and domain. Services never import from `api`; models never
import from services.

## Backend decisions

### Layering

Every route handler does three things at most: parse input, call a service,
return a response. All rules that matter (ownership checks, balance math,
split arithmetic, threshold notifications) live in `services/`. This makes the
business logic unit-testable without HTTP and reusable by future workers/CLIs.

### Ownership and authorization

Authentication (`who are you`) is handled once in `deps.get_current_user`.
Authorization (`may you touch this row`) is enforced in service queries —
every lookup filters by `user_id`, so a guessed ID returns **404**, not 403,
and never leaks another user's data. Group resources additionally check
membership and role via `group_service.require_role`.

### Password hashing

Passwords use **scrypt** from the Python standard library
(N=2^14, r=8, p=1, per-user random salt, constant-time comparison).
This is memory-hard and avoids fragile native dependency chains; the stored
format embeds its parameters so they can be upgraded later without breaking
existing hashes.

### Tokens

- Access tokens: short-lived JWTs (`type=access`)
- Refresh tokens: longer-lived JWTs (`type=refresh`), accepted only by
  `/auth/refresh`
- The frontend keeps both in `localStorage` and transparently refreshes on a
  401 before failing a request. Token type confusion is rejected server-side.

### Rate limiting

A small in-process sliding-window limiter protects `/auth/*`. For multi-worker
deployments swap the backing store for Redis; the interface is one function.

### Money

Amounts are `Numeric(14,2)` columns. The API accepts/returns JSON numbers
rounded to two decimals; SQLite stores them as decimals via SQLAlchemy.
Multi-currency conversion is intentionally out of scope v1 — each account and
group carries an explicit currency code, and totals assume consistent currency.

### Recurring engine

`recurring_service.materialize_due` runs opportunistically on dashboard load:
due rules post their transactions (catch-up capped), advance `next_run_date`
with calendar-aware month arithmetic, and raise a notification. Idempotent by
construction because `next_run_date` only moves forward after posting.

## Frontend decisions

### Data flow

No heavyweight state library. A typed `api.ts` client wraps fetch with token
refresh; `useResource(path)` covers read state (loading/error/data/reload);
mutations call the client directly then trigger `reload()`. Server state stays
server-owned; the app holds no duplicate cache to invalidate.

### Design system

Custom Tailwind theme (`tailwind.config.js`) defines the identity:

- Warm paper background, ink typography, deep emerald brand, muted semantics
- Fraunces (serif) for display moments; Inter for UI; tabular numerals for money
- Hairline dividers instead of card grids; cards used sparingly where hierarchy demands
- Charts are hand-built SVG components (no chart library) for a distinctive look
  and a tiny bundle (~79 KB gzipped total)

Motion is purposeful (page rise-in, chart draw-in, progress fill) and gated on
`prefers-reduced-motion`.

### Accessibility

Semantic landmarks, labelled inputs, `aria-live` toasts, focus-visible rings,
keyboard-complete flows (Enter submits the amount-first transaction form),
and status communicated by icon + text + color, never color alone.

## Known trade-offs (v1)

- Notifications are polled on shell mount, not pushed.
- Group expenses split equally; custom ratios are a future extension.
- Recurring catch-up caps at 60 occurrences per run.
- Rate limiter is per-process memory (fine for single-node deploys).
