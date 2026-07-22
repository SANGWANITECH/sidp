from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal
from app.models.models import SettlementStatus


class SettlementResponse(BaseModel):
    settlement_id: UUID
    from_institution_id: UUID
    to_institution_id: UUID
    net_amount: Decimal
    settlement_date: date
    status: SettlementStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class SettlementRunRequest(BaseModel):
    settlement_date: Optional[date] = None


class SettlementReportItem(BaseModel):
    from_institution: str
    to_institution: str
    net_amount: float
    status: str


class SettlementReportResponse(BaseModel):
    settlement_date: str
    total_settlements: int
    total_net_amount: float
    settlements: list[SettlementReportItem]