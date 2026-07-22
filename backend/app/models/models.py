import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, DateTime, Numeric,
    ForeignKey, Enum, Date, Text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class InstitutionType(str, enum.Enum):
    bank = "bank"
    mobile_money = "mobile_money"
    central_bank = "central_bank"


class AccountStatus(str, enum.Enum):
    active = "active"
    suspended = "suspended"
    closed = "closed"


class TransactionStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class EntryType(str, enum.Enum):
    debit = "debit"
    credit = "credit"


class SettlementStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"


class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    devices = relationship("Device", back_populates="user", cascade="all, delete-orphan")
    accounts = relationship("Account", back_populates="user")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


class Device(Base):
    __tablename__ = "devices"

    device_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    public_key = Column(Text, nullable=False)
    device_label = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    registered_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="devices")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    token_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    token = Column(Text, unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="refresh_tokens")


class Institution(Base):
    __tablename__ = "institutions"

    institution_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    type = Column(Enum(InstitutionType), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    accounts = relationship("Account", back_populates="institution")


class Account(Base):
    __tablename__ = "accounts"

    account_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    institution_id = Column(UUID(as_uuid=True), ForeignKey("institutions.institution_id"), nullable=False)
    account_number = Column(String(20), unique=True, nullable=False)
    balance = Column(Numeric(18, 2), default=0.00)
    currency = Column(String(10), default="MWK")
    status = Column(Enum(AccountStatus), default=AccountStatus.active)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="accounts")
    institution = relationship("Institution", back_populates="accounts")
    sent_transactions = relationship("Transaction", foreign_keys="Transaction.sender_account_id", back_populates="sender_account")
    received_transactions = relationship("Transaction", foreign_keys="Transaction.receiver_account_id", back_populates="receiver_account")
    ledger_entries = relationship("LedgerEntry", back_populates="account")


class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.account_id"), nullable=False)
    receiver_account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.account_id"), nullable=False)
    amount = Column(Numeric(18, 2), nullable=False)
    currency = Column(String(10), default="MWK")
    status = Column(Enum(TransactionStatus), default=TransactionStatus.pending)
    signature = Column(Text, nullable=True)
    nonce = Column(String(255), nullable=True)
    description = Column(String(500), nullable=True)
    is_flagged = Column(Boolean, default=False)
    flag_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sender_account = relationship("Account", foreign_keys=[sender_account_id], back_populates="sent_transactions")
    receiver_account = relationship("Account", foreign_keys=[receiver_account_id], back_populates="received_transactions")
    ledger_entries = relationship("LedgerEntry", back_populates="transaction")


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    entry_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.transaction_id"), nullable=False)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.account_id"), nullable=False)
    entry_type = Column(Enum(EntryType), nullable=False)
    amount = Column(Numeric(18, 2), nullable=False)
    balance_after = Column(Numeric(18, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    transaction = relationship("Transaction", back_populates="ledger_entries")
    account = relationship("Account", back_populates="ledger_entries")


class Settlement(Base):
    __tablename__ = "settlements"

    settlement_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    from_institution_id = Column(UUID(as_uuid=True), ForeignKey("institutions.institution_id"), nullable=False)
    to_institution_id = Column(UUID(as_uuid=True), ForeignKey("institutions.institution_id"), nullable=False)
    net_amount = Column(Numeric(18, 2), nullable=False)
    settlement_date = Column(Date, nullable=False)
    status = Column(Enum(SettlementStatus), default=SettlementStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)

    from_institution = relationship("Institution", foreign_keys=[from_institution_id])
    to_institution = relationship("Institution", foreign_keys=[to_institution_id])


class Nonce(Base):
    __tablename__ = "nonces"

    nonce_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    value = Column(String(255), unique=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    used = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)