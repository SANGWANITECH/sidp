from sqlalchemy.orm import Session
from app.models.models import Device, Nonce, User
from typing import Optional
from datetime import datetime, timedelta
import secrets
import json
from cryptography.hazmat.primitives.asymmetric.ec import (
    EllipticCurvePublicKey, ECDSA
)
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature
from cryptography.exceptions import InvalidSignature
import base64


# ── NONCE ─────────────────────────────────────────────────────────────

def generate_nonce(db: Session, user_id: str) -> str:
    db.query(Nonce).filter(
        Nonce.user_id == user_id,
        Nonce.used == False,
        Nonce.expires_at < datetime.utcnow()
    ).delete()
    db.commit()

    value = secrets.token_hex(32)
    nonce = Nonce(
        user_id=user_id,
        value=value,
        expires_at=datetime.utcnow() + timedelta(minutes=5),
    )
    db.add(nonce)
    db.commit()
    return value


def consume_nonce(db: Session, user_id: str, value: str) -> bool:
    nonce = db.query(Nonce).filter(
        Nonce.user_id == user_id,
        Nonce.value == value,
        Nonce.used == False,
        Nonce.expires_at > datetime.utcnow()
    ).first()

    if not nonce:
        return False

    nonce.used = True
    db.commit()
    return True


# ── DEVICE REGISTRATION ───────────────────────────────────────────────

def register_device(
    db: Session,
    user_id: str,
    public_key_jwk: dict,
    device_label: str
) -> Device:
    device = Device(
        user_id=user_id,
        public_key=json.dumps(public_key_jwk),
        device_label=device_label,
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


def get_devices_by_user(db: Session, user_id: str) -> list:
    return db.query(Device).filter(
        Device.user_id == user_id,
        Device.is_active == True
    ).all()


def get_device_by_id(db: Session, device_id: str) -> Optional[Device]:
    return db.query(Device).filter(
        Device.device_id == device_id
    ).first()


def get_active_device_for_user(db: Session, user_id: str) -> Optional[Device]:
    return db.query(Device).filter(
        Device.user_id == user_id,
        Device.is_active == True
    ).first()


def revoke_device(db: Session, device_id: str, user_id: str) -> bool:
    device = db.query(Device).filter(
        Device.device_id == device_id,
        Device.user_id == user_id,
    ).first()
    if not device:
        return False
    device.is_active = False
    db.commit()
    return True


# ── SIGNATURE VERIFICATION ────────────────────────────────────────────

def _jwk_to_public_key(jwk_dict: dict) -> EllipticCurvePublicKey:
    x = base64.urlsafe_b64decode(jwk_dict["x"] + "==")
    y = base64.urlsafe_b64decode(jwk_dict["y"] + "==")

    public_numbers = ec.EllipticCurvePublicNumbers(
        x=int.from_bytes(x, "big"),
        y=int.from_bytes(y, "big"),
        curve=ec.SECP256R1()
    )
    return public_numbers.public_key()


def verify_transaction_signature(
    db: Session,
    user_id: str,
    payload: dict,
    signature_b64: str
) -> bool:
    device = get_active_device_for_user(db, user_id)
    if not device:
        return False

    try:
        jwk_dict = json.loads(device.public_key)
        public_key = _jwk_to_public_key(jwk_dict)

        message = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()

        # Fix base64url padding
        padding = 4 - len(signature_b64) % 4
        if padding != 4:
            signature_b64 += '=' * padding
        raw_sig = base64.urlsafe_b64decode(signature_b64)

        # Web Crypto API produces IEEE P1363 format (raw 64 bytes)
        # Python cryptography expects DER format — convert
        if len(raw_sig) == 64:
            r = int.from_bytes(raw_sig[:32], 'big')
            s = int.from_bytes(raw_sig[32:], 'big')
            signature = encode_dss_signature(r, s)
        else:
            signature = raw_sig

        public_key.verify(signature, message, ECDSA(hashes.SHA256()))
        return True

    except (InvalidSignature, Exception):
        return False