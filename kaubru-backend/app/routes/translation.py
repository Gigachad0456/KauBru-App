from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user, get_verified_user
from app.database import get_db
from app.translation_service import translate
from app.limiter import limiter

router = APIRouter(tags=["Translation"])


@router.post("/translate", response_model=schemas.TranslateResponse)
@limiter.limit("30/minute")
def translate_text(
    request: Request,
    payload: schemas.TranslateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_verified_user),
):
    if payload.direction not in ("en_to_kb", "kb_to_en"):
        raise HTTPException(status_code=400, detail="direction must be 'en_to_kb' or 'kb_to_en'")

    translated, unknown = translate(payload.text, payload.direction, db)

    # Save to history
    history = models.TranslationHistory(
        user_id=current_user.id,
        source_text=payload.text,
        translated_text=translated,
        direction=payload.direction,
    )
    db.add(history)
    db.commit()

    return schemas.TranslateResponse(
        source_text=payload.text,
        translated_text=translated,
        direction=payload.direction,
        unknown_words=unknown,
    )


@router.get("/translations/history", response_model=List[schemas.TranslationHistoryOut])
def get_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_verified_user),
):
    records = (
        db.query(models.TranslationHistory)
        .filter(models.TranslationHistory.user_id == current_user.id)
        .order_by(models.TranslationHistory.created_at.desc())
        .limit(50)
        .all()
    )
    return records
