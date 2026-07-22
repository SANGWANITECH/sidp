from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.models import (
    Account, Transaction, TransactionStatus
)
from app.services.ledger_service import create_ledger_entries
from app.services.device_service import verify_transaction_signature, consume_nonce
from decimal import Decimal
from typing import Optional
import uuid


def get_account_by_number(db: Session, account_number: str) -> Optional[Account]:
    return db.query(Account).filter(
        Account.account_number == account_number
    ).first()


def get_account_by_id(db: Session, account_id: str) -> Optional[Account]:
    return db.query(Account).filter(
        Account.account_id == account_id
    ).first()


def get_transactions_by_account(
    db: Session,
    account_id: str,
    limit: int = 50,
    offset: int = 0,
) -> list:
    return db.query(Transaction).filter(
        (Transaction.sender_account_id == account_id) |
        (Transaction.receiver_account_id == account_id)
    ).order_by(Transaction.created_at.desc()).offset(offset).limit(limit).all()


def get_transaction_by_id(db: Session, transaction_id: str) -> Optional[Transaction]:
    return db.query(Transaction).filter(
        Transaction.transaction_id == transaction_id
    ).first()


def flag_transaction(transaction: Transaction, reason: str):
    transaction.is_flagged = True
    transaction.flag_reason = reason


def process_payment(
    db: Session,
    user_id: str,
    sender_account_number: str,
    receiver_account_number: str,
    amount: Decimal,
    nonce: str,
    signature: str,
    description: str = None,
) -> Transaction:

    # ── STEP 1: Validate sender account ──────────────────────────────
    sender_account = get_account_by_number(db, sender_account_number)
    if not sender_account:
        raise ValueError("Sender account not found")
    if str(sender_account.user_id) != user_id:
        raise ValueError("Sender account does not belong to this user")
    if sender_account.status.value != "active":
        raise ValueError("Sender account is not active")

    # ── STEP 2: Validate receiver account ────────────────────────────
    receiver_account = get_account_by_number(db, receiver_account_number)
    if not receiver_account:
        raise ValueError("Receiver account not found")
    if receiver_account.status.value != "active":
        raise ValueError("Receiver account is not active")

    # ── STEP 3: Check amount ──────────────────────────────────────────
    if amount <= Decimal("0"):
        raise ValueError("Amount must be greater than zero")
    if amount > Decimal("999999999.99"):
        raise ValueError("Amount exceeds maximum transaction limit")

    # ── STEP 4: Check balance ─────────────────────────────────────────
    if sender_account.balance < amount:
        raise ValueError("Insufficient funds")

    # ── STEP 5: Consume nonce ─────────────────────────────────────────
    nonce_valid = consume_nonce(db, user_id, nonce)
    if not nonce_valid:
        raise ValueError("Invalid or expired nonce")

    # ── STEP 6: Verify signature ──────────────────────────────────────
    payload = {
        "amount": str(amount),
        "nonce": nonce,
        "receiver_account": receiver_account_number,
        "sender_account": sender_account_number,
    }
    sig_valid = verify_transaction_signature(db, user_id, payload, signature)
    if not sig_valid:
        raise ValueError("Invalid transaction signature — rejected")

    # ── STEP 7: Create transaction record ─────────────────────────────
    transaction = Transaction(
        sender_account_id=sender_account.account_id,
        receiver_account_id=receiver_account.account_id,
        amount=amount,
        status=TransactionStatus.processing,
        signature=signature,
        nonce=nonce,
        description=description,
    )
    db.add(transaction)
    db.flush()  # Get transaction_id without committing

    # ── STEP 8: Update balances ───────────────────────────────────────
    sender_account.balance -= amount
    receiver_account.balance += amount

    # ── STEP 9: Create ledger entries ─────────────────────────────────
    create_ledger_entries(
        db=db,
        transaction_id=str(transaction.transaction_id),
        sender_account=sender_account,
        receiver_account=receiver_account,
        amount=amount,
    )

    # ── STEP 10: Fraud check ──────────────────────────────────────────
    if amount >= Decimal("500000"):
        flag_transaction(transaction, "Large transaction — amount exceeds MWK 500,000")

    # ── STEP 11: Mark complete and commit ─────────────────────────────
    transaction.status = TransactionStatus.completed
    db.commit()
    db.refresh(transaction)

    return transaction