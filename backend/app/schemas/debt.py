from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import DebtStatus, DebtType


class DebtBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    debt_type: DebtType = DebtType.other
    principal: float = Field(ge=0)
    interest_rate: float = Field(ge=0, le=100, default=0)
    minimum_payment: float = Field(ge=0, default=0)
    due_day: int = Field(ge=1, le=31, default=1)
    remaining_balance: float = Field(ge=0)
    start_date: date
    end_date: date | None = None
    status: DebtStatus = DebtStatus.active

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Debt name cannot be empty")
        return v

    @field_validator("principal", "remaining_balance", "minimum_payment")
    @classmethod
    def round_amount(cls, v: float) -> float:
        return round(v, 2)

    @field_validator("interest_rate")
    @classmethod
    def round_rate(cls, v: float) -> float:
        return round(v, 2)


class DebtCreate(DebtBase):
    pass


class DebtUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    debt_type: DebtType | None = None
    interest_rate: float | None = Field(default=None, ge=0, le=100)
    minimum_payment: float | None = Field(default=None, ge=0)
    due_day: int | None = Field(default=None, ge=1, le=31)
    end_date: date | None = None
    status: DebtStatus | None = None


class DebtRead(DebtBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime


class DebtPaymentCreate(BaseModel):
    amount: float = Field(gt=0)
    payment_date: date
    note: str | None = Field(default=None, max_length=500)

    @field_validator("amount")
    @classmethod
    def round_amount(cls, v: float) -> float:
        return round(v, 2)


class DebtPaymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    debt_id: int
    amount: float
    payment_date: date
    note: str | None
    created_at: datetime


class DebtSummary(BaseModel):
    total_debt: float
    total_paid: float
    total_remaining: float
    active_debts: int
    monthly_payments: float
    debts: list[DebtRead]
