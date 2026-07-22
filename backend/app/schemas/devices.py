from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class DeviceRegister(BaseModel):
    public_key_jwk: dict
    device_label: str


class DeviceResponse(BaseModel):
    device_id: UUID
    device_label: str
    is_active: bool
    registered_at: datetime

    model_config = {"from_attributes": True}


class NonceResponse(BaseModel):
    nonce: str
    expires_in: int = 300


class SignatureVerifyRequest(BaseModel):
    payload: dict
    signature: str