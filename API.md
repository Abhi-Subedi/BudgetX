# API Reference

Base URL: `/api` · JSON in/out · Bearer token auth unless noted.
Errors use `{ "detail": "human readable message" }`; validation failures also
include `"errors": [{ "field", "message" }]`.

## Auth

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | `{name,email,password,currency?,locale?}` → 201 `{user, tokens}`. Rate limited. |
| POST | `/auth/login` | `{email,password}` → `{user, tokens}`. Rate limited. |
| POST | `/auth/refresh` | `{refresh_token}` → `{tokens}`. Rate limited. |

## Users

| Method | Path | Notes |
|---|---|---|
| GET | `/users/me` | Current profile |
| PATCH | `/users/me` | Update `name`, `currency`, `locale` |
| POST | `/users/me/password` | `{current_password,new_password}` |

## Accounts & categories

| Method | Path | Notes |
|---|---|---|
| GET | `/accounts?include_archived=` | `{items:[{...account, balance}], total_balance}` |
| POST | `/accounts` | `{name,type,opening_balance?,currency?}` → 201 |
| PATCH | `/accounts/{id}` | `{name?,archived?}` |
| DELETE | `/accounts/{id}` | Blocked with 409 if transactions exist |
| GET | `/categories?kind=expense\|income` | Seeded defaults at registration |

## Transactions

| Method | Path | Notes |
|---|---|---|
| GET | `/transactions` | Query: `page`, `page_size≤100`, `from`, `to`, `type`, `category_id`, `account_id`, `group_id`, `q`. Returns `{items,total,page,page_size}` sorted newest first |
| POST | `/transactions` | `{amount>0,type,account_id,category_id?,occurred_at,payee?,note?}` → 201 |
| GET | `/transactions/{id}` | Ownership enforced (404 otherwise) |
| PUT | `/transactions/{id}` | Partial update |
| DELETE | `/transactions/{id}` | 204 |

## Budgets

| Method | Path | Notes |
|---|---|---|
| GET | `/budgets` | Progress-enriched list: totals, per-item spent/remaining/pct, days left |
| POST | `/budgets` | `{name?,month:YYYY-MM-DD,items:[{category_id,amount}]}` — one budget per month (409) |
| PUT | `/budgets/{id}` | Replace name/items |
| DELETE | `/budgets/{id}` | 204 |

## Goals

| Method | Path | Notes |
|---|---|---|
| GET | `/goals` | List |
| POST | `/goals` | `{name,target_amount,deadline?,color?}` → 201 |
| PUT | `/goals/{id}` | Update |
| POST | `/goals/{id}/contributions` | `{amount>0}` — raises notification on completion |
| DELETE | `/goals/{id}` | 204 |

## Groups

| Method | Path | Notes |
|---|---|---|
| GET | `/groups` | Groups you belong to |
| POST | `/groups` | `{name,currency?}` → you become owner → 201 |
| GET | `/groups/{id}` | Detail incl. members and your role |
| POST | `/groups/{id}/invite` | `{email}` → `{code}` (owner/admin only) |
| POST | `/groups/join` | `{code}` — accepts personal invite (email-bound) or the group's open code |
| PATCH | `/groups/{id}/members/{user_id}/role` | `{role:"admin"\|"member"}` owner only |
| DELETE | `/groups/{id}/members/{user_id}` | Remove (admin) or leave (self) |
| POST | `/groups/{id}/expenses` | `{description,amount,paid_by_user_id?,occurred_at,split_with?}` — equal split, cents remainder to earliest members |
| GET | `/groups/{id}/balances` | Per-member net + simplified who-pays-whom edges |
| GET | `/groups/{id}/activity` | Shared expense feed with your share per item |

## Recurring

| Method | Path | Notes |
|---|---|---|
| GET | `/recurring` | Rules ordered by next run date |
| POST | `/recurring` | `{amount,type,account_id,frequency,next_run_date,end_date?,payee?,note?}` → 201 |
| PUT | `/recurring/{id}` | Update / pause via `active:false` |
| DELETE | `/recurring/{id}` | 204 |

Due rules materialize automatically when the dashboard loads.

## Notifications & insights

| Method | Path | Notes |
|---|---|---|
| GET | `/notifications` | Latest 50 + unread count; `unread_only=true` supported |
| POST | `/notifications/read-all` | Mark all read |
| GET | `/dashboard` | Balance, month/prev totals, cumulative spending series, attention items, recent activity, goals, upcoming recurring |
| GET | `/analytics/overview?month=YYYY-MM` | Totals, category slices with pct, largest expenses |
| GET | `/analytics/trends?months=6&end_month=YYYY-MM` | Income vs expense per month |

## Meta

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | Liveness probe |
