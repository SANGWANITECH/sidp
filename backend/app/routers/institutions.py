from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.institutions import InstitutionResponse
from app.models.models import Institution
from app.utils.dependencies import get_current_user
from app.models.models import User

router = APIRouter(prefix="/institutions", tags=["Institutions"])


@router.get("/", response_model=list[InstitutionResponse])
def list_institutions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Institution).filter(Institution.is_active == True).all()