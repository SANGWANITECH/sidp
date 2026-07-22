from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from app.models.models import AccountStatus


class AccountCreate(BaseModel):
    institution_code: str


class AccountResponse(BaseModel):
    account_id: UUID
    account_number: str
    balance: Decimal
    currency: str
    status: AccountStatus
    institution_id: UUID
    user_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class AccountDetailResponse(BaseModel):
    account_id: UUID
    account_number: str
    balance: Decimal
    currency: str
    status: AccountStatus
    created_at: datetime
    institution: "InstitutionInfo"
    user: "UserInfo"

    model_config = {"from_attributes": True}


class InstitutionInfo(BaseModel):
    institution_id: UUID
    name: str
    code: str
    type: str

    model_config = {"from_attributes": True}


class UserInfo(BaseModel):
    user_id: UUID
    full_name: str
    email: str

    model_config = {"from_attributes": True}