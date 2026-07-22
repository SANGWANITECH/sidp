from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models.models import (
    Transaction, TransactionStatus, Settlement,
    SettlementStatus, Account, Institution
)
from decimal import Decimal
from datetime import date, datetime
from typing import Optional
import uuid


def get_pending_cross_institution_transactions(
    db: Session,
    settlement_date: date,
) -> list:
    """
    Get all completed cross-institution transactions
    that have not yet been included in a settlement.
    """
    return db.query(Transaction).join(
        Account, Transaction.sender_account_id == Account.account_id
    ).filter(
        Transaction.status == TransactionStatus.completed,
        func.date(Transaction.created_at) == settlement_date,
    ).all()


def calculate_net_positions(
    db: Session,
    transactions: list,
) -> dict:
    """
    Calculate bilateral net positions between institution pairs.
    Returns dict of {(from_institution_id, to_institution_id): net_amount}
    """
    gross_flows = {}

    for tx in transactions:
        sender_account = db.query(Account).filter(
            Account.account_id == tx.sender_account_id
        ).first()
        receiver_account = db.query(Account).filter(
            Account.account_id == tx.receiver_account_id
        ).first()

        if not sender_account or not receiver_account:
            continue

        sender_inst = str(sender_account.institution_id)
        receiver_inst = str(receiver_account.institution_id)

        if sender_inst == receiver_inst:
            continue  # Skip intra-institution transactions

        key = (sender_inst, receiver_inst)
        if key not in gross_flows:
            gross_flows[key] = Decimal("0.00")
        gross_flows[key] += tx.amount

    # Calculate net positions
    net_positions = {}
    processed_pairs = set()

    for (inst_a, inst_b), amount_ab in gross_flows.items():
        if (inst_a, inst_b) in processed_pairs:
            continue

        amount_ba = gross_flows.get((inst_b, inst_a), Decimal("0.00"))
        net = amount_ab - amount_ba

        if net > Decimal("0"):
            net_positions[(inst_a, inst_b)] = net
        elif net < Decimal("0"):
            net_positions[(inst_b, inst_a)] = abs(net)

        processed_pairs.add((inst_a, inst_b))
        processed_pairs.add((inst_b, inst_a))

    return net_positions


def run_settlement(
    db: Session,
    settlement_date: date = None,
) -> list:
    """
    Run the settlement engine for a given date.
    Returns list of settlement records created.
    """
    if settlement_date is None:
        settlement_date = date.today()

    # Check if settlement already ran for this date
    existing = db.query(Settlement).filter(
        Settlement.settlement_date == settlement_date,
        Settlement.status == SettlementStatus.completed,
    ).first()
    if existing:
        raise ValueError(f"Settlement for {settlement_date} has already been completed")

    # Get all transactions for the period
    transactions = get_pending_cross_institution_transactions(db, settlement_date)

    if not transactions:
        raise ValueError(f"No transactions found for settlement date {settlement_date}")

    # Calculate net positions
    net_positions = calculate_net_positions(db, transactions)

    if not net_positions:
        raise ValueError("No cross-institution transactions to settle")

    # Create settlement records
    settlements = []
    for (from_inst_id, to_inst_id), net_amount in net_positions.items():
        settlement = Settlement(
            from_institution_id=from_inst_id,
            to_institution_id=to_inst_id,
            net_amount=net_amount,
            settlement_date=settlement_date,
            status=SettlementStatus.completed,
        )
        db.add(settlement)
        settlements.append(settlement)

    db.commit()
    for s in settlements:
        db.refresh(s)

    return settlements


def get_settlement_history(
    db: Session,
    limit: int = 20,
    offset: int = 0,
) -> list:
    return db.query(Settlement).order_by(
        Settlement.created_at.desc()
    ).offset(offset).limit(limit).all()


def get_settlement_report(
    db: Session,
    settlement_date: date,
) -> dict:
    settlements = db.query(Settlement).filter(
        Settlement.settlement_date == settlement_date
    ).all()

    if not settlements:
        return None

    report = {
        "settlement_date": str(settlement_date),
        "total_settlements": len(settlements),
        "total_net_amount": sum(s.net_amount for s in settlements),
        "settlements": []
    }

    for s in settlements:
        from_inst = db.query(Institution).filter(
            Institution.institution_id == s.from_institution_id
        ).first()
        to_inst = db.query(Institution).filter(
            Institution.institution_id == s.to_institution_id
        ).first()

        report["settlements"].append({
            "from_institution": from_inst.name if from_inst else str(s.from_institution_id),
            "to_institution": to_inst.name if to_inst else str(s.to_institution_id),
            "net_amount": float(s.net_amount),
            "status": s.status.value,
        })

    return report