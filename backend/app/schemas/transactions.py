from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from app.models.models import TransactionStatus


class TransactionCreate(BaseModel):
    sender_account_number: str
    receiver_account_number: str
    amount: Decimal
    nonce: str
    signature: str
    description: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Amount must be greater than zero")
        return round(v, 2)


class TransactionResponse(BaseModel):
    transaction_id: UUID
    sender_account_id: UUID
    receiver_account_id: UUID
    amount: Decimal
    currency: str
    status: TransactionStatus
    description: Optional[str]
    is_flagged: bool
    flag_reason: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class TransactionListResponse(BaseModel):
    transactions: list[TransactionResponse]
    total: int