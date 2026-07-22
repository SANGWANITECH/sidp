from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.models import InstitutionType


class InstitutionResponse(BaseModel):
    institution_id: UUID
    name: str
    type: InstitutionType
    code: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}