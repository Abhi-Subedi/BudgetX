# BudgetX

**Money, considered.** A personal and family budgeting application — track income and expenses,
plan monthly budgets, save toward goals, manage shared group finances, and understand where your
money actually goes.

BudgetX is a full-stack product:

- **Frontend:** React 18 + TypeScript + Next.js 14 (App Router) + Tailwind CSS
- **Backend:** Python + FastAPI + SQLAlchemy 2.0 + Pydantic v2
- **Database:** PostgreSQL (SQLite supported for instant local development)
- **Migrations:** Alembic · **Auth:** JWT access/refresh tokens, scrypt password hashing

---

## Quick start (5 minutes)

Prerequisites: Node 18+, Python 3.11+.

```bash
# 1. Backend
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt   # Windows
# source .venv/bin/activate && pip install -r requirements.txt   # macOS/Linux
copy .env.example .env
.venv\Scripts\python -m alembic upgrade head
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev          # http://localhost:3000
```

Open http://localhost:3000, create an account, and you're in.

Detailed setup (PostgreSQL, Docker, production builds): see [SETUP.md](SETUP.md).

## What's inside

| Area | Highlights |
|---|---|
| Transactions | Fast add-transaction flow, searchable ledger grouped by day, filters, recurring rules |
| Budgets | Monthly category budgets with live progress, threshold notifications at 80% / 100% |
| Goals | Savings targets with contributions, deadlines and progress |
| Accounts | Cash / bank / wallet / credit / savings / investment with computed balances |
| Groups | Shared spaces: members & roles, email invites + join codes, equal-split expenses, who-owes-who settlement |
| Analytics | Month overview, income vs expense trends, category breakdown, savings rate, largest expenses |
| Localization | User-selectable currency (USD, EUR, GBP, INR, NPR, AUD, CAD) and locale-aware formatting |
| Security | JWT auth with refresh rotation, per-user ownership checks on every resource, rate-limited auth endpoints, Pydantic validation everywhere |

## Documentation

- [SETUP.md](SETUP.md) — install, configure, run everything
- [ARCHITECTURE.md](ARCHITECTURE.md) — how the system is structured and why
- [API.md](API.md) — REST endpoint reference
- [DATABASE.md](DATABASE.md) — schema and relationships
- [CONTRIBUTING.md](CONTRIBUTING.md) — workflow, conventions, testing

## Tests

```bash
# Backend (28 tests)
cd backend && .venv\Scripts\python -m pytest

# Frontend (unit tests) + type check + production build
cd frontend && npm test && npm run typecheck && npm run build
```

## License

All rights reserved. Private project.
