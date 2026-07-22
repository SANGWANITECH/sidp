from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.accounts import AccountCreate, AccountResponse
from app.services.account_service import (
    get_institution_by_code, create_account,
    get_accounts_by_user, get_account_by_id
)
from app.utils.dependencies import get_current_user
from app.models.models import User, Account, Institution

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.post("/", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_new_account(
    payload: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    institution = get_institution_by_code(db, payload.institution_code)
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Institution with code '{payload.institution_code}' not found"
        )
    account = create_account(db, str(current_user.user_id), str(institution.institution_id))
    return account


@router.get("/all")
def get_all_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    accounts = db.query(Account).all()
    return accounts


@router.get("/institution/{institution_code}")
def get_institution_accounts(
    institution_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    institution = db.query(Institution).filter(
        Institution.code == institution_code
    ).first()
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")
    accounts = db.query(Account).filter(
        Account.institution_id == institution.institution_id
    ).all()
    return accounts


@router.get("/", response_model=list[AccountResponse])
def list_my_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_accounts_by_user(db, str(current_user.user_id))


@router.get("/{account_id}", response_model=AccountResponse)
def get_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = get_account_by_id(db, account_id)
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    if str(account.user_id) != str(current_user.user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your account")
    return account