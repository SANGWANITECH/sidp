import sys
import json
import base64
from decimal import Decimal
from datetime import datetime, timedelta
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.ec import ECDSA
from cryptography.hazmat.primitives import hashes
from app.database import SessionLocal
from app.models.models import (
    User, Device, Account, Institution,
    Transaction, TransactionStatus, LedgerEntry, EntryType
)
from app.services.auth_service import hash_password
import uuid

db = SessionLocal()

def to_b64url(n, length=32):
    return base64.urlsafe_b64encode(
        n.to_bytes(length, 'big')
    ).rstrip(b'=').decode()

def generate_account_number():
    import random, string
    return "SIDP" + "".join(random.choices(string.digits, k=10))

def get_institution(code):
    return db.query(Institution).filter(Institution.code == code).first()

def create_user_with_device(full_name, phone, email, password, is_admin=False):
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        print(f"  User {email} already exists, skipping")
        return existing, None

    user = User(
        full_name=full_name,
        phone=phone,
        email=email,
        hashed_password=hash_password(password),
        is_active=True,
        is_admin=is_admin,
    )
    db.add(user)
    db.flush()

    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()
    pub_numbers = public_key.public_numbers()

    jwk = {
        "kty": "EC",
        "crv": "P-256",
        "x": to_b64url(pub_numbers.x),
        "y": to_b64url(pub_numbers.y),
        "key_ops": ["verify"],
        "ext": True
    }

    device = Device(
        user_id=user.user_id,
        public_key=json.dumps(jwk),
        device_label=f"{full_name.split()[0]}'s Device",
        is_active=True,
    )
    db.add(device)
    db.flush()

    print(f"  Created: {full_name} ({email})")
    return user, private_key

def create_account(user, institution_code, opening_balance=50000):
    inst = get_institution(institution_code)
    if not inst:
        print(f"  Institution {institution_code} not found")
        return None

    account = Account(
        user_id=user.user_id,
        institution_id=inst.institution_id,
        account_number=generate_account_number(),
        balance=Decimal(str(opening_balance)),
        currency="MWK",
    )
    db.add(account)
    db.flush()
    print(f"  Account: {account.account_number} at {inst.name} — MWK {opening_balance:,}")
    return account

def seed_transaction(sender_account, receiver_account, amount, description, days_ago=0):
    amount = Decimal(str(amount))

    if sender_account.balance < amount:
        print(f"  Skipping — insufficient funds for {description}")
        return None

    transaction = Transaction(
        sender_account_id=sender_account.account_id,
        receiver_account_id=receiver_account.account_id,
        amount=amount,
        status=TransactionStatus.completed,
        signature="seeded_demo_transaction",
        nonce=str(uuid.uuid4()),
        description=description,
        is_flagged=amount >= Decimal("500000"),
        flag_reason="Large transaction — amount exceeds MWK 500,000" if amount >= Decimal("500000") else None,
        created_at=datetime.utcnow() - timedelta(days=days_ago, hours=1),
    )
    db.add(transaction)
    db.flush()

    sender_balance_after = sender_account.balance - amount
    receiver_balance_after = receiver_account.balance + amount

    debit = LedgerEntry(
        transaction_id=transaction.transaction_id,
        account_id=sender_account.account_id,
        entry_type=EntryType.debit,
        amount=amount,
        balance_after=sender_balance_after,
        created_at=transaction.created_at,
    )
    credit = LedgerEntry(
        transaction_id=transaction.transaction_id,
        account_id=receiver_account.account_id,
        entry_type=EntryType.credit,
        amount=amount,
        balance_after=receiver_balance_after,
        created_at=transaction.created_at,
    )
    db.add(debit)
    db.add(credit)

    sender_account.balance = sender_balance_after
    receiver_account.balance = receiver_balance_after

    print(f"  TX: {sender_account.account_number} → {receiver_account.account_number} MWK {amount:,} ({description})")
    return transaction


print("\n=== SEEDING DEMO DATA ===\n")

print("Creating users...")
john,          john_key    = create_user_with_device("John Banda",       "0991000001", "john@sidp.demo",   "demo1234")
grace,         grace_key   = create_user_with_device("Grace Phiri",      "0881000002", "grace@sidp.demo",  "demo1234")
david,         david_key   = create_user_with_device("David Mwale",      "0991000003", "david@sidp.demo",  "demo1234")
nbm_operator,  _           = create_user_with_device("NBM Operator",     "0991000010", "nbm@sidp.demo",    "demo1234")
airtel_op,     _           = create_user_with_device("Airtel Operator",  "0881000011", "airtel@sidp.demo", "demo1234")
rbm_admin,     _           = create_user_with_device("RBM Administrator","0991000099", "rbm@sidp.demo",    "demo1234", is_admin=True)

print("\nCreating accounts...")
john_nbm    = create_account(john,          "NBM", 80000)
john_tnm    = create_account(john,          "TNM", 30000)
grace_air   = create_account(grace,         "AIR", 60000)
grace_nbm   = create_account(grace,         "NBM", 40000)
david_fmb   = create_account(david,         "FMB", 100000)
david_std   = create_account(david,         "STD", 50000)
nbm_inst    = create_account(nbm_operator,  "NBM", 500000)
airtel_inst = create_account(airtel_op,     "AIR", 500000)

print("\nSeeding transactions...")

# Today
seed_transaction(john_nbm,  grace_air,  15000,  "School fees payment",    days_ago=0)
seed_transaction(grace_air, john_nbm,   8000,   "Market goods payment",   days_ago=0)
seed_transaction(david_fmb, john_nbm,   25000,  "Salary advance",         days_ago=0)
seed_transaction(john_tnm,  grace_air,  5000,   "Airtime reimbursement",  days_ago=0)
seed_transaction(grace_nbm, david_fmb,  12000,  "Rent contribution",      days_ago=0)
seed_transaction(david_std, grace_air,  600000, "Business payment",       days_ago=0)

# Yesterday
seed_transaction(john_nbm,  grace_air,  20000,  "Grocery payment",        days_ago=1)
seed_transaction(david_fmb, grace_air,  18000,  "Freelance payment",      days_ago=1)
seed_transaction(grace_air, david_std,  9000,   "Transport refund",       days_ago=1)
seed_transaction(john_tnm,  david_fmb,  35000,  "Equipment deposit",      days_ago=1)

# 2 days ago
seed_transaction(grace_nbm, john_nbm,   7500,   "Loan repayment",         days_ago=2)
seed_transaction(david_std, john_tnm,   11000,  "Event contribution",     days_ago=2)
seed_transaction(john_nbm,  david_fmb,  45000,  "Invoice payment",        days_ago=2)

db.commit()

print("\n=== SEED COMPLETE ===")
print("\nDemo credentials:")
print("  john@sidp.demo    / demo1234  — Customer (NBM + TNM accounts)")
print("  grace@sidp.demo   / demo1234  — Customer (Airtel + NBM accounts)")
print("  david@sidp.demo   / demo1234  — Customer (FMB + STD accounts)")
print("  nbm@sidp.demo     / demo1234  — NBM Operator")
print("  airtel@sidp.demo  / demo1234  — Airtel Operator")
print("  rbm@sidp.demo     / demo1234  — RBM Admin")
db.close()