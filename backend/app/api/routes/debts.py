from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.debt import (
    DebtCreate,
    DebtPaymentCreate,
    DebtPaymentRead,
    DebtRead,
    DebtSummary,
    DebtUpdate,
)
from app.services import debt_service

router = APIRouter(tags=["debts"])


@router.get("/debts")
def list_debts(
    user: CurrentUser,
    db: DbSession,
    status: str | None = Query(default=None),
) -> dict:
    debts = debt_service.list_debts(db, user.id, status)
    return {"items": debts, "total": len(debts)}


@router.post("/debts", status_code=status.HTTP_201_CREATED)
def create_debt(payload: DebtCreate, user: CurrentUser, db: DbSession) -> DebtRead:
    return debt_service.create_debt(db, user.id, payload)


@router.get("/debts/{debt_id}")
def get_debt(debt_id: int, user: CurrentUser, db: DbSession) -> DebtRead:
    from app.services.common import get_owned
    from app.models import Debt

    debt = get_owned(db, Debt, debt_id, user.id, "Debt")
    return debt


@router.patch("/debts/{debt_id}")
def update_debt(debt_id: int, payload: DebtUpdate, user: CurrentUser, db: DbSession) -> DebtRead:
    return debt_service.update_debt(db, user.id, debt_id, payload)


@router.delete("/debts/{debt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_debt(debt_id: int, user: CurrentUser, db: DbSession) -> None:
    debt_service.delete_debt(db, user.id, debt_id)


@router.post("/debts/{debt_id}/payments", status_code=status.HTTP_201_CREATED)
def create_payment(debt_id: int, payload: DebtPaymentCreate, user: CurrentUser, db: DbSession) -> DebtPaymentRead:
    return debt_service.make_payment(db, user.id, debt_id, payload)


@router.get("/debts/summary")
def get_summary(user: CurrentUser, db: DbSession) -> DebtSummary:
    summary = debt_service.get_debt_summary(db, user.id)
    return summary
