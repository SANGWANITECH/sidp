from sqlalchemy.orm import Session
from app.models.models import Account, Institution, User
from typing import Optional
import random
import string


def generate_account_number() -> str:
    return "SIDP" + "".join(random.choices(string.digits, k=10))


def get_institution_by_code(db: Session, code: str) -> Optional[Institution]:
    return db.query(Institution).filter(
        Institution.code == code,
        Institution.is_active == True
    ).first()


def get_account_by_id(db: Session, account_id: str) -> Optional[Account]:
    return db.query(Account).filter(Account.account_id == account_id).first()


def get_accounts_by_user(db: Session, user_id: str) -> list[Account]:
    return db.query(Account).filter(Account.user_id == user_id).all()


def get_account_by_number(db: Session, account_number: str) -> Optional[Account]:
    return db.query(Account).filter(Account.account_number == account_number).first()


def create_account(db: Session, user_id: str, institution_id: str) -> Account:
    account_number = generate_account_number()
    while get_account_by_number(db, account_number):
        account_number = generate_account_number()

    account = Account(
        user_id=user_id,
        institution_id=institution_id,
        account_number=account_number,
        balance=10000.00,
        currency="MWK",
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account