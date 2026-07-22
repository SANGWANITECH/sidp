from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.models import LedgerEntry, Account, EntryType
from decimal import Decimal


def create_ledger_entries(
    db: Session,
    transaction_id: str,
    sender_account: Account,
    receiver_account: Account,
    amount: Decimal,
) -> tuple:
    sender_balance_after = sender_account.balance - amount
    receiver_balance_after = receiver_account.balance + amount

    debit_entry = LedgerEntry(
        transaction_id=transaction_id,
        account_id=sender_account.account_id,
        entry_type=EntryType.debit,
        amount=amount,
        balance_after=sender_balance_after,
    )

    credit_entry = LedgerEntry(
        transaction_id=transaction_id,
        account_id=receiver_account.account_id,
        entry_type=EntryType.credit,
        amount=amount,
        balance_after=receiver_balance_after,
    )

    db.add(debit_entry)
    db.add(credit_entry)

    return debit_entry, credit_entry


def get_ledger_entries_by_account(
    db: Session,
    account_id: str,
    limit: int = 50,
    offset: int = 0,
) -> list:
    return db.query(LedgerEntry).filter(
        LedgerEntry.account_id == account_id
    ).order_by(LedgerEntry.created_at.desc()).offset(offset).limit(limit).all()


def get_ledger_entries_by_transaction(
    db: Session,
    transaction_id: str,
) -> list:
    return db.query(LedgerEntry).filter(
        LedgerEntry.transaction_id == transaction_id
    ).all()


def verify_ledger_balance(db: Session, account_id: str) -> Decimal:
    """
    Recalculate account balance from ledger entries.
    Credits increase balance, debits decrease it.
    Used for reconciliation checks.
    """
    entries = db.query(LedgerEntry).filter(
        LedgerEntry.account_id == account_id
    ).all()

    balance = Decimal("0.00")
    for entry in entries:
        if entry.entry_type == EntryType.credit:
            balance += entry.amount
        else:
            balance -= entry.amount

    return balance