# Database

PostgreSQL in production, SQLite for friction-free local development.
Schema is owned by SQLAlchemy models and managed exclusively through Alembic
migrations — never edit live schemas by hand.

## Entity relationship overview

```
User 1─* Account          (cascade delete)
User 1─* Category         (seeded with 12 expense + 5 income defaults)
User 1─* Transaction      ─1 Category (SET NULL)
                          ─1 Account  (cascade)
                          ─? Group    (SET NULL)
Transaction 1─* TransactionSplit   (group expense shares)
Budget 1─* BudgetItem     ─1 Category   (unique per budget+category)
SavingsGoal               (optional group_id for shared goals)
Group 1─* GroupMember     (unique group+user; role: owner/admin/member)
Group 1─* Invitation      (email-bound code, pending/accepted/declined)
RecurringTransaction      ─1 Account, ─? Category
Notification              (user-scoped, read flag indexed)
```

## Tables

| Table | Key columns | Notes |
|---|---|---|
| `users` | `email` unique idx | scrypt hash embeds KDF parameters |
| `accounts` | `user_id` idx, `type` enum | balance = opening + Σ(signed transactions) |
| `categories` | `user_id` idx | kind: expense/income |
| `transactions` | `(user_id)`, `(occurred_at)`, `account_id`, `group_id` idx | amount Numeric(14,2); type: expense/income |
| `transaction_splits` | `transaction_id`, `user_id` idx | equal split of shared expenses |
| `budgets` | `(user_id, month)` | one plan per month |
| `budget_items` | unique `(budget_id, category_id)` | monthly allowance per category |
| `goals` | `user_id` idx | target/current amounts |
| `groups` | `invite_code` unique idx | open join code |
| `group_members` | unique `(group_id, user_id)` | owner/admin/member roles |
| `invitations` | `code` unique, `email` idx | email-bound personal invites |
| `recurring_transactions` | `user_id` idx | daily/weekly/monthly/yearly cadence |
| `notifications` | `(user_id)`, `is_read` idx | budget/goal/recurring/invitation events |

## Conventions

- All money columns are `Numeric(14,2)`.
- Timestamps are timezone-aware UTC (`created_at`, `updated_at` where applicable).
- Deletes cascade from User and from parent entities (Budget→Items,
  Transaction→Splits, Group→Members). References that must survive deletion
  (e.g. a transaction's category) use `SET NULL`.
- Enums are stored as strings (`native_enum=False`) for portable migrations.

## Migration workflow

```bash
# after changing models:
python -m alembic revision --autogenerate -m "describe change"
# review the generated file in alembic/versions/
python -m alembic upgrade head
```

The initial migration is `ee799c3232ae_initial_schema.py`.
