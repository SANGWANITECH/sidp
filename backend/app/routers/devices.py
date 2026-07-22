from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.devices import DeviceRegister, DeviceResponse, SignatureVerifyRequest
from app.services.device_service import (
    register_device, get_devices_by_user,
    revoke_device, generate_nonce, get_device_by_id,
    verify_transaction_signature
)
from app.utils.dependencies import get_current_user
from app.models.models import User

router = APIRouter(prefix="/devices", tags=["Devices"])


@router.post(
    "/register",
    response_model=DeviceResponse,
    status_code=status.HTTP_201_CREATED
)
def register_new_device(
    payload: DeviceRegister,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.public_key_jwk.get("kty") == "EC":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only EC keys are accepted"
        )
    device = register_device(
        db=db,
        user_id=str(current_user.user_id),
        public_key_jwk=payload.public_key_jwk,
        device_label=payload.device_label,
    )
    return device


@router.get("/", response_model=list[DeviceResponse])
def list_my_devices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_devices_by_user(db, str(current_user.user_id))


@router.delete("/{device_id}", status_code=status.HTTP_200_OK)
def revoke_my_device(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success = revoke_device(db, device_id, str(current_user.user_id))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found or already revoked"
        )
    return {"message": "Device revoked successfully"}


@router.post("/verify-signature")
def verify_signature(
    payload: SignatureVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    valid = verify_transaction_signature(
        db=db,
        user_id=str(current_user.user_id),
        payload=payload.payload,
        signature_b64=payload.signature,
    )
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature — transaction rejected"
        )
    return {"verified": True, "message": "Signature valid — transaction authorized"}