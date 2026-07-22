from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.models.models import User, RefreshToken
from app.config import get_settings
import hashlib

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    pre_hashed = hashlib.sha256(password.encode()).hexdigest()
    return pwd_context.hash(pre_hashed)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    pre_hashed = hashlib.sha256(plain_password.encode()).hexdigest()
    return pwd_context.verify(pre_hashed, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        return None


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.user_id == user_id).first()


def create_user(db: Session, full_name: str, phone: str, email: str, password: str) -> User:
    user = User(
        full_name=full_name,
        phone=phone,
        email=email,
        hashed_password=hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def save_refresh_token(db: Session, user_id: str, token: str) -> RefreshToken:
    existing = db.query(RefreshToken).filter(RefreshToken.token == token).first()
    if existing:
        return existing

    expires_at = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    refresh_token = RefreshToken(
        user_id=user_id,
        token=token,
        expires_at=expires_at,
    )
    db.add(refresh_token)
    db.commit()
    return refresh_token


def revoke_refresh_token(db: Session, token: str) -> bool:
    refresh_token = db.query(RefreshToken).filter(RefreshToken.token == token).first()
    if not refresh_token:
        return False
    db.delete(refresh_token)
    db.commit()
    return True


def validate_refresh_token(db: Session, token: str) -> Optional[User]:
    payload = decode_token(token)
    if not payload or payload.get("type") != "refresh":
        return None

    stored = db.query(RefreshToken).filter(RefreshToken.token == token).first()
    if not stored or stored.expires_at < datetime.utcnow():
        return None

    user = get_user_by_id(db, payload.get("sub"))
    return user