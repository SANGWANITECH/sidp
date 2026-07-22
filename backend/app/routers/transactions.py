from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.transactions import TransactionCreate, TransactionResponse, TransactionListResponse
from app.services.transaction_service import (
    process_payment, get_transactions_by_account,
    get_transaction_by_id, get_account_by_number
)
from app.utils.dependencies import get_current_user
from app.models.models import User, Transaction, Account, Institution
from decimal import Decimal

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        transaction = process_payment(
            db=db,
            user_id=str(current_user.user_id),
            sender_account_number=payload.sender_account_number,
            receiver_account_number=payload.receiver_account_number,
            amount=payload.amount,
            nonce=payload.nonce,
            signature=payload.signature,
            description=payload.description,
        )
        return transaction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/all", response_model=TransactionListResponse)
def get_all_transactions(
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transactions = db.query(Transaction).order_by(
        Transaction.created_at.desc()
    ).offset(offset).limit(limit).all()
    total = db.query(Transaction).count()
    return TransactionListResponse(transactions=transactions, total=total)


@router.get("/institution/{institution_code}", response_model=TransactionListResponse)
def get_institution_transactions(
    institution_code: str,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    institution = db.query(Institution).filter(
        Institution.code == institution_code
    ).first()
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")

    institution_account_ids = [
        str(a[0]) for a in db.query(Account.account_id).filter(
            Account.institution_id == institution.institution_id
        ).all()
    ]

    transactions = db.query(Transaction).filter(
        (Transaction.sender_account_id.in_(institution_account_ids)) |
        (Transaction.receiver_account_id.in_(institution_account_ids))
    ).order_by(Transaction.created_at.desc()).offset(offset).limit(limit).all()

    total = db.query(Transaction).filter(
        (Transaction.sender_account_id.in_(institution_account_ids)) |
        (Transaction.receiver_account_id.in_(institution_account_ids))
    ).count()

    return TransactionListResponse(transactions=transactions, total=total)


@router.get("/account/{account_number}", response_model=TransactionListResponse)
def get_account_transactions(
    account_number: str,
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = get_account_by_number(db, account_number)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if str(account.user_id) != str(current_user.user_id):
        raise HTTPException(status_code=403, detail="Not your account")

    transactions = get_transactions_by_account(
        db, str(account.account_id), limit, offset
    )
    return TransactionListResponse(
        transactions=transactions,
        total=len(transactions)
    )


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction = get_transaction_by_id(db, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction