# Contributing

## Ground rules

1. **Understand before changing.** Read the relevant service and its tests
   before touching behavior. Never overwrite working code blindly.
2. **Layer discipline.** HTTP concerns stay in `api/routes`; business rules go
   in `services/`; persistence shapes live in `models/`. If a route handler
   grows logic, it's in the wrong place.
3. **Migrations only.** Schema changes happen through Alembic revisions, never
   manual DDL.
4. **Security is not optional.** Every new resource needs ownership checks;
   every new input needs a Pydantic schema; secrets never enter the repo.
5. **Design with intent.** UI changes should follow the existing design system
   (tokens in `tailwind.config.js`, components in `components/ui`). No one-off
   colors, no decorative noise.

## Workflow

```bash
# 1. Branch
git checkout -b feat/short-description

# 2. Make changes

# 3. Verify — all of these must pass:
cd backend && .venv\Scripts\python -m pytest
cd frontend && npm run typecheck && npm test && npm run build

# 4. Commit with a concise, imperative message
```

## Backend conventions

- Python 3.11+; SQLAlchemy 2.0 typed style (`Mapped[...]`).
- Services raise `AppError(status, message)` with human-readable messages;
  technical detail goes to logs, never to responses.
- Money math rounds to two decimals at boundaries.
- Add tests for any new behavior — see `backend/tests` for patterns covering
  auth, ownership isolation, split arithmetic and threshold notifications.

## Frontend conventions

- TypeScript strict mode is the floor, not the ceiling.
- Server state via `useResource`; no duplicated caches.
- Financial figures use `formatMoney` (tabular numerals) — never hand-roll.
- Respect `prefers-reduced-motion` for anything animated.
- Empty/error states are designed states, not afterthoughts.

## Commit style

```
feat: add goal contribution reminders
fix: correct split remainder rounding in group expenses
docs: expand API reference for budgets
test: cover cross-user budget isolation
```
