from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user, get_verified_user
from app.database import get_db

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.post("/register")
def register_push_token(
    payload: schemas.PushTokenRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_verified_user),
):
    current_user.push_token = payload.token
    db.commit()
    return {"message": "Token registered"}


@router.get("/", response_model=list[schemas.AppNotificationOut])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_verified_user),
):
    return db.query(models.AppNotification)\
        .filter(models.AppNotification.user_id == current_user.id)\
        .order_by(models.AppNotification.created_at.desc()).all()


@router.put("/{notif_id}/read")
def mark_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_verified_user),
):
    n = db.query(models.AppNotification)\
        .filter(models.AppNotification.id == notif_id, models.AppNotification.user_id == current_user.id).first()
    if not n:
        return {"error": "Not found"}
    n.is_read = True
    db.commit()
    return {"message": "Read"}
