from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/contributions", tags=["Contributions"])


@router.post("", response_model=schemas.ContributionOut, status_code=201)
def submit_contribution(
    payload: schemas.ContributionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    contribution = models.Contribution(
        user_id=current_user.id,
        english=payload.english,
        kaubru=payload.kaubru,
        meaning=payload.meaning,
        category=payload.category,
        status="pending",
    )
    db.add(contribution)
    db.commit()
    db.refresh(contribution)
    return contribution


@router.get("/my", response_model=List[schemas.ContributionOut])
def my_contributions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Contribution)
        .filter(models.Contribution.user_id == current_user.id)
        .order_by(models.Contribution.created_at.desc())
        .all()
    )
