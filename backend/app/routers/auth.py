from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import (
    UserRegister, UserLogin, TokenResponse,
    RefreshTokenRequest, UserResponse
)
from app.services.auth_service import (
    get_user_by_email, create_user, verify_password,
    create_access_token, create_refresh_token,
    save_refresh_token, validate_refresh_token,
    revoke_refresh_token
)
from app.services.device_service import generate_nonce
from app.utils.dependencies import get_current_user
from app.models.models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    if get_user_by_email(db, payload.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    user = create_user(
        db=db,
        full_name=payload.full_name,
        phone=payload.phone,
        email=payload.email,
        password=payload.password,
    )
    access_token = create_access_token({"sub": str(user.user_id)})
    refresh_token = create_refresh_token({"sub": str(user.user_id)})
    save_refresh_token(db, str(user.user_id), refresh_token)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = get_user_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    access_token = create_access_token({"sub": str(user.user_id)})
    refresh_token = create_refresh_token({"sub": str(user.user_id)})
    save_refresh_token(db, str(user.user_id), refresh_token)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    user = validate_refresh_token(db, payload.refresh_token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    revoke_refresh_token(db, payload.refresh_token)
    access_token = create_access_token({"sub": str(user.user_id)})
    new_refresh_token = create_refresh_token({"sub": str(user.user_id)})
    save_refresh_token(db, str(user.user_id), new_refresh_token)
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/logout")
def logout(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    revoke_refresh_token(db, payload.refresh_token)
    return {"message": "Logged out successfully"}


@router.post("/nonce")
def request_nonce(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    nonce = generate_nonce(db, str(current_user.user_id))
    return {"nonce": nonce, "expires_in": 300}