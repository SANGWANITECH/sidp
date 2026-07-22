from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.settlements import (
    SettlementResponse, SettlementRunRequest, SettlementReportResponse
)
from app.services.settlement_service import (
    run_settlement, get_settlement_history, get_settlement_report
)
from app.utils.dependencies import get_current_user, get_current_admin
from app.models.models import User
from datetime import date

router = APIRouter(prefix="/settlements", tags=["Settlements"])


@router.post("/run", response_model=list[SettlementResponse])
def trigger_settlement(
    payload: SettlementRunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        settlement_date = payload.settlement_date or date.today()
        settlements = run_settlement(db, settlement_date)
        return settlements
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/history", response_model=list[SettlementResponse])
def list_settlements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_settlement_history(db)


@router.get("/report/{settlement_date}", response_model=SettlementReportResponse)
def get_report(
    settlement_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = get_settlement_report(db, settlement_date)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No settlement found for {settlement_date}"
        )
    return report