"""
Admin-only routes — all endpoints require role == "admin".
"""
from typing import List, Optional
from datetime import datetime
import csv, io

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, EmailStr

from app import models
from app.auth import get_current_user, hash_password
from app.database import get_db

router = APIRouter(prefix="/admin", tags=["Admin"])


# ─── Guard ────────────────────────────────────────────────────────────────────

def require_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ─── Activity log helper ──────────────────────────────────────────────────────

def log_action(
    db: Session,
    admin: models.User,
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[int] = None,
    detail: Optional[str] = None,
):
    db.add(models.ActivityLog(
        admin_id=admin.id,
        admin_name=admin.name,
        action=action,
        target_type=target_type,
        target_id=target_id,
        detail=detail,
    ))
    # committed by caller


# ─── Pydantic schemas ─────────────────────────────────────────────────────────

class UserAdminOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    points: int
    is_premium: bool
    is_verified: bool = False
    created_at: datetime
    translation_count: int = 0
    saved_count: int = 0
    contribution_count: int = 0

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    points: Optional[int] = None
    is_premium: Optional[bool] = None
    password: Optional[str] = None


class WordCreateRequest(BaseModel):
    english: str
    kaubru: str
    category: str = "general"
    example_english: Optional[str] = None
    example_kaubru: Optional[str] = None
    audio_url: Optional[str] = None


class WordUpdateRequest(BaseModel):
    english: Optional[str] = None
    kaubru: Optional[str] = None
    category: Optional[str] = None
    example_english: Optional[str] = None
    example_kaubru: Optional[str] = None
    audio_url: Optional[str] = None


class WordOut(BaseModel):
    id: int
    english: str
    kaubru: str
    category: str
    example_english: Optional[str] = None
    example_kaubru: Optional[str] = None
    audio_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ContributionAdminOut(BaseModel):
    id: int
    user_id: int
    user_name: str = ""
    user_email: str = ""
    english: str
    kaubru: str
    meaning: Optional[str] = None
    category: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ContributionStatusUpdate(BaseModel):
    status: str


class BulkStatusUpdate(BaseModel):
    ids: List[int]
    status: str


class LessonCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "general"
    progress: float = 0.0
    is_premium: bool = False


class LessonUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    progress: Optional[float] = None
    is_premium: Optional[bool] = None


class LessonOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category: str
    progress: float
    is_premium: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_users: int
    total_words: int
    total_translations: int
    total_contributions: int
    pending_contributions: int
    total_lessons: int
    premium_users: int
    recent_signups: int


class TimeSeriesPoint(BaseModel):
    date: str
    value: int


class TranslationHistoryAdminOut(BaseModel):
    id: int
    user_id: int
    user_name: str = ""
    source_text: str
    translated_text: str
    direction: str
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityLogOut(BaseModel):
    id: int
    admin_id: int
    admin_name: str
    action: str
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    detail: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WordImportResult(BaseModel):
    imported: int
    skipped: int
    errors: List[str]


# ─── Dashboard ────────────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=DashboardStats)
def dashboard(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    from datetime import timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)

    return DashboardStats(
        total_users=db.query(func.count(models.User.id)).scalar(),
        total_words=db.query(func.count(models.Word.id)).scalar(),
        total_translations=db.query(func.count(models.TranslationHistory.id)).scalar(),
        total_contributions=db.query(func.count(models.Contribution.id)).scalar(),
        pending_contributions=db.query(func.count(models.Contribution.id))
            .filter(models.Contribution.status == "pending").scalar(),
        total_lessons=db.query(func.count(models.Lesson.id)).scalar(),
        premium_users=db.query(func.count(models.User.id))
            .filter(models.User.is_premium == True).scalar(),
        recent_signups=db.query(func.count(models.User.id))
            .filter(models.User.created_at >= week_ago).scalar(),
    )


@router.get("/dashboard/translations-per-day", response_model=List[TimeSeriesPoint])
def translations_per_day(
    days: int = Query(default=30, le=90),
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    from datetime import timedelta
    since = datetime.utcnow() - timedelta(days=days)
    rows = (
        db.query(
            func.strftime("%Y-%m-%d", models.TranslationHistory.created_at).label("day"),
            func.count(models.TranslationHistory.id).label("cnt"),
        )
        .filter(models.TranslationHistory.created_at >= since)
        .group_by("day")
        .order_by("day")
        .all()
    )
    return [TimeSeriesPoint(date=r.day, value=r.cnt) for r in rows if r.day]


@router.get("/dashboard/signups-per-day", response_model=List[TimeSeriesPoint])
def signups_per_day(
    days: int = Query(default=30, le=90),
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    from datetime import timedelta
    since = datetime.utcnow() - timedelta(days=days)
    rows = (
        db.query(
            func.strftime("%Y-%m-%d", models.User.created_at).label("day"),
            func.count(models.User.id).label("cnt"),
        )
        .filter(models.User.created_at >= since)
        .group_by("day")
        .order_by("day")
        .all()
    )
    return [TimeSeriesPoint(date=r.day, value=r.cnt) for r in rows if r.day]


# ─── Users ────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserAdminOut])
def list_users(
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_premium: Optional[bool] = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    q = db.query(models.User)
    if search:
        pattern = f"%{search}%"
        q = q.filter(
            models.User.name.ilike(pattern) | models.User.email.ilike(pattern)
        )
    if role:
        q = q.filter(models.User.role == role)
    if is_premium is not None:
        q = q.filter(models.User.is_premium == is_premium)
    users = q.order_by(models.User.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for u in users:
        result.append(UserAdminOut(
            id=u.id, name=u.name, email=u.email, role=u.role,
            points=u.points, is_premium=u.is_premium, is_verified=u.is_verified,
            created_at=u.created_at,
            translation_count=len(u.translations),
            saved_count=len(u.saved_words),
            contribution_count=len(u.contributions),
        ))
    return result


@router.get("/users/count")
def count_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_premium: Optional[bool] = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    q = db.query(func.count(models.User.id))
    if search:
        pattern = f"%{search}%"
        q = q.filter(
            models.User.name.ilike(pattern) | models.User.email.ilike(pattern)
        )
    if role:
        q = q.filter(models.User.role == role)
    if is_premium is not None:
        q = q.filter(models.User.is_premium == is_premium)
    return {"total": q.scalar()}


@router.get("/users/{user_id}", response_model=UserAdminOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return UserAdminOut(
        id=u.id, name=u.name, email=u.email, role=u.role,
        points=u.points, is_premium=u.is_premium, is_verified=u.is_verified,
        created_at=u.created_at,
        translation_count=len(u.translations),
        saved_count=len(u.saved_words),
        contribution_count=len(u.contributions),
    )


@router.get("/users/{user_id}/activity")
def get_user_activity(
    user_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    translations = (
        db.query(models.TranslationHistory)
        .filter(models.TranslationHistory.user_id == user_id)
        .order_by(models.TranslationHistory.created_at.desc())
        .limit(50).all()
    )
    contributions = (
        db.query(models.Contribution)
        .filter(models.Contribution.user_id == user_id)
        .order_by(models.Contribution.created_at.desc())
        .all()
    )
    saved = (
        db.query(models.SavedWord)
        .filter(models.SavedWord.user_id == user_id)
        .all()
    )

    return {
        "user": UserAdminOut(
            id=u.id, name=u.name, email=u.email, role=u.role,
            points=u.points, is_premium=u.is_premium, is_verified=u.is_verified,
            created_at=u.created_at,
            translation_count=len(u.translations),
            saved_count=len(u.saved_words),
            contribution_count=len(u.contributions),
        ),
        "translations": [
            {
                "id": t.id, "source_text": t.source_text,
                "translated_text": t.translated_text,
                "direction": t.direction,
                "created_at": t.created_at.isoformat(),
            }
            for t in translations
        ],
        "contributions": [
            {
                "id": c.id, "english": c.english, "kaubru": c.kaubru,
                "category": c.category, "status": c.status,
                "created_at": c.created_at.isoformat(),
            }
            for c in contributions
        ],
        "saved_words": [
            {
                "id": s.word.id, "english": s.word.english,
                "kaubru": s.word.kaubru, "category": s.word.category,
            }
            for s in saved if s.word
        ],
    }


@router.put("/users/{user_id}", response_model=UserAdminOut)
def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.name is not None:
        u.name = payload.name
    if payload.email is not None:
        u.email = payload.email
    if payload.role is not None:
        u.role = payload.role
    if payload.points is not None:
        u.points = payload.points
    if payload.is_premium is not None:
        u.is_premium = payload.is_premium
    if payload.password:
        u.password_hash = hash_password(payload.password)

    log_action(db, admin, "updated_user", "user", u.id, f"Updated user: {u.email}")
    db.commit()
    db.refresh(u)
    return UserAdminOut(
        id=u.id, name=u.name, email=u.email, role=u.role,
        points=u.points, is_premium=u.is_premium, is_verified=u.is_verified,
        created_at=u.created_at,
        translation_count=len(u.translations),
        saved_count=len(u.saved_words),
        contribution_count=len(u.contributions),
    )


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    log_action(db, admin, "deleted_user", "user", u.id, f"Deleted user: {u.email}")
    db.delete(u)
    db.commit()
    return {"message": "User deleted"}


# ─── Words / Dictionary ───────────────────────────────────────────────────────

@router.get("/words", response_model=List[WordOut])
def list_words(
    skip: int = 0,
    limit: int = Query(default=100, le=500),
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    q = db.query(models.Word)
    if search:
        pattern = f"%{search}%"
        q = q.filter(
            models.Word.english.ilike(pattern) | models.Word.kaubru.ilike(pattern)
        )
    if category:
        q = q.filter(models.Word.category == category)
    return q.order_by(models.Word.id).offset(skip).limit(limit).all()


@router.get("/words/count")
def count_words(
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    q = db.query(func.count(models.Word.id))
    if search:
        pattern = f"%{search}%"
        q = q.filter(
            models.Word.english.ilike(pattern) | models.Word.kaubru.ilike(pattern)
        )
    if category:
        q = q.filter(models.Word.category == category)
    return {"total": q.scalar()}


@router.post("/words", response_model=WordOut, status_code=201)
def create_word(
    payload: WordCreateRequest,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    word = models.Word(**payload.model_dump())
    db.add(word)
    db.commit()
    db.refresh(word)
    return word


@router.put("/words/{word_id}", response_model=WordOut)
def update_word(
    word_id: int,
    payload: WordUpdateRequest,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    word = db.query(models.Word).filter(models.Word.id == word_id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(word, field, value)

    db.commit()
    db.refresh(word)
    return word


@router.delete("/words/{word_id}")
def delete_word(
    word_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    word = db.query(models.Word).filter(models.Word.id == word_id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    log_action(db, admin, "deleted_word", "word", word.id, f"Deleted word: '{word.english}'")
    db.delete(word)
    db.commit()
    return {"message": "Word deleted"}


# ─── Contributions ────────────────────────────────────────────────────────────

@router.get("/contributions", response_model=List[ContributionAdminOut])
def list_contributions(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    q = db.query(models.Contribution)
    if status:
        q = q.filter(models.Contribution.status == status)
    contribs = q.order_by(models.Contribution.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for c in contribs:
        result.append(ContributionAdminOut(
            id=c.id, user_id=c.user_id,
            user_name=c.user.name if c.user else "",
            user_email=c.user.email if c.user else "",
            english=c.english, kaubru=c.kaubru,
            meaning=c.meaning, category=c.category,
            status=c.status, created_at=c.created_at,
        ))
    return result


@router.put("/contributions/{contrib_id}/status")
def update_contribution_status(
    contrib_id: int,
    payload: ContributionStatusUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    if payload.status not in ("pending", "approved", "rejected"):
        raise HTTPException(status_code=400, detail="Invalid status")

    c = db.query(models.Contribution).filter(models.Contribution.id == contrib_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contribution not found")

    c.status = payload.status

    # Send Notification
    title = "Contribution Approved!" if payload.status == "approved" else "Contribution Update"
    msg = f"Your contribution '{c.english}' has been {payload.status}."
    if payload.status == "rejected":
        title = "Contribution Rejected"

    db.add(models.AppNotification(
        user_id=c.user_id,
        title=title,
        message=msg,
        type="success" if payload.status == "approved" else "warning"
    ))

    if payload.status == "approved":
        existing = db.query(models.Word).filter(
            models.Word.english == c.english
        ).first()
        if not existing:
            db.add(models.Word(
                english=c.english,
                kaubru=c.kaubru,
                category=c.category,
            ))
        if c.user:
            c.user.points = (c.user.points or 0) + 10

    log_action(db, admin, f"{payload.status}_contribution", "contribution", c.id,
               f"{payload.status.capitalize()} contribution: '{c.english}' → '{c.kaubru}'")
    db.commit()
    return {"message": f"Contribution {payload.status}"}


@router.post("/contributions/bulk-status")
def bulk_update_contribution_status(
    payload: BulkStatusUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    if payload.status not in ("pending", "approved", "rejected"):
        raise HTTPException(status_code=400, detail="Invalid status")
    if not payload.ids:
        raise HTTPException(status_code=400, detail="No IDs provided")

    updated = 0
    for contrib_id in payload.ids:
        c = db.query(models.Contribution).filter(models.Contribution.id == contrib_id).first()
        if not c:
            continue
        c.status = payload.status
        
        # Send Notification
        title = "Contribution Approved!" if payload.status == "approved" else "Contribution Update"
        msg = f"Your contribution '{c.english}' has been {payload.status}."
        db.add(models.AppNotification(
            user_id=c.user_id,
            title=title,
            message=msg,
            type="success" if payload.status == "approved" else "warning"
        ))

        if payload.status == "approved":
            existing = db.query(models.Word).filter(models.Word.english == c.english).first()
            if not existing:
                db.add(models.Word(english=c.english, kaubru=c.kaubru, category=c.category))
            if c.user:
                c.user.points = (c.user.points or 0) + 10
        updated += 1

    log_action(db, admin, f"bulk_{payload.status}_contributions", "contribution", None,
               f"Bulk {payload.status}: {updated} contributions (IDs: {payload.ids})")
    db.commit()
    return {"message": f"{updated} contributions set to {payload.status}"}


@router.delete("/contributions/{contrib_id}")
def delete_contribution(
    contrib_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    c = db.query(models.Contribution).filter(models.Contribution.id == contrib_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contribution not found")
    log_action(db, admin, "deleted_contribution", "contribution", c.id,
               f"Deleted contribution: '{c.english}'")
    db.delete(c)
    db.commit()
    return {"message": "Contribution deleted"}


# ─── Lessons ──────────────────────────────────────────────────────────────────

@router.get("/lessons", response_model=List[LessonOut])
def list_lessons(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    return db.query(models.Lesson).order_by(models.Lesson.id).all()


@router.post("/lessons", response_model=LessonOut, status_code=201)
def create_lesson(
    payload: LessonCreateRequest,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    lesson = models.Lesson(**payload.model_dump())
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.put("/lessons/{lesson_id}", response_model=LessonOut)
def update_lesson(
    lesson_id: int,
    payload: LessonUpdateRequest,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(lesson, field, value)

    db.commit()
    db.refresh(lesson)
    return lesson


@router.delete("/lessons/{lesson_id}")
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    db.delete(lesson)
    db.commit()
    return {"message": "Lesson deleted"}


# ─── Translation History ──────────────────────────────────────────────────────

@router.get("/translations", response_model=List[TranslationHistoryAdminOut])
def list_translations(
    skip: int = 0,
    limit: int = Query(default=100, le=500),
    search: Optional[str] = None,
    direction: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    q = db.query(models.TranslationHistory)
    if search:
        pattern = f"%{search}%"
        q = q.filter(
            models.TranslationHistory.source_text.ilike(pattern)
            | models.TranslationHistory.translated_text.ilike(pattern)
        )
    if direction:
        q = q.filter(models.TranslationHistory.direction == direction)
    if user_id:
        q = q.filter(models.TranslationHistory.user_id == user_id)

    records = (
        q.order_by(models.TranslationHistory.created_at.desc())
        .offset(skip).limit(limit).all()
    )
    return [
        TranslationHistoryAdminOut(
            id=r.id, user_id=r.user_id,
            user_name=r.user.name if r.user else "",
            source_text=r.source_text,
            translated_text=r.translated_text,
            direction=r.direction,
            created_at=r.created_at,
        )
        for r in records
    ]


@router.get("/translations/count")
def count_translations(
    search: Optional[str] = None,
    direction: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    q = db.query(func.count(models.TranslationHistory.id))
    if search:
        pattern = f"%{search}%"
        q = q.filter(
            models.TranslationHistory.source_text.ilike(pattern)
            | models.TranslationHistory.translated_text.ilike(pattern)
        )
    if direction:
        q = q.filter(models.TranslationHistory.direction == direction)
    if user_id:
        q = q.filter(models.TranslationHistory.user_id == user_id)
    return {"total": q.scalar()}


# ─── CSV Export ───────────────────────────────────────────────────────────────

def _csv_response(rows: list[dict], filename: str) -> StreamingResponse:
    if not rows:
        raise HTTPException(status_code=404, detail="No data to export")
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/users")
def export_users(
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    users = db.query(models.User).order_by(models.User.id).all()
    rows = [
        {
            "id": u.id, "name": u.name, "email": u.email,
            "role": u.role, "points": u.points,
            "is_premium": u.is_premium, "is_verified": u.is_verified,
            "translations": len(u.translations),
            "contributions": len(u.contributions),
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]
    log_action(db, admin, "exported_users", detail=f"Exported {len(rows)} users to CSV")
    db.commit()
    return _csv_response(rows, "kaubru_users.csv")


@router.get("/export/words")
def export_words(
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    words = db.query(models.Word).order_by(models.Word.id).all()
    rows = [
        {
            "id": w.id, "english": w.english, "kaubru": w.kaubru,
            "category": w.category,
            "example_english": w.example_english or "",
            "example_kaubru": w.example_kaubru or "",
            "audio_url": w.audio_url or "",
            "created_at": w.created_at.isoformat(),
        }
        for w in words
    ]
    log_action(db, admin, "exported_words", detail=f"Exported {len(rows)} words to CSV")
    db.commit()
    return _csv_response(rows, "kaubru_words.csv")


@router.get("/export/translations")
def export_translations(
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    records = (
        db.query(models.TranslationHistory)
        .order_by(models.TranslationHistory.id)
        .all()
    )
    rows = [
        {
            "id": r.id,
            "user_id": r.user_id,
            "user_name": r.user.name if r.user else "",
            "source_text": r.source_text,
            "translated_text": r.translated_text,
            "direction": r.direction,
            "created_at": r.created_at.isoformat(),
        }
        for r in records
    ]
    log_action(db, admin, "exported_translations", detail=f"Exported {len(rows)} translations to CSV")
    db.commit()
    return _csv_response(rows, "kaubru_translations.csv")


# ─── Word CSV Import ──────────────────────────────────────────────────────────

@router.post("/import/words", response_model=WordImportResult)
async def import_words(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    """
    Upload a CSV with columns: english, kaubru, category (optional),
    example_english (optional), example_kaubru (optional).
    Skips rows where the english word already exists.
    """
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")  # handle BOM
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded")

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames or "english" not in reader.fieldnames or "kaubru" not in reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV must have 'english' and 'kaubru' columns")

    imported = 0
    skipped = 0
    errors: list[str] = []

    for i, row in enumerate(reader, start=2):  # row 1 = header
        english = (row.get("english") or "").strip()
        kaubru = (row.get("kaubru") or "").strip()

        if not english or not kaubru:
            errors.append(f"Row {i}: missing english or kaubru value")
            continue

        existing = db.query(models.Word).filter(
            models.Word.english.ilike(english)
        ).first()
        if existing:
            skipped += 1
            continue

        db.add(models.Word(
            english=english,
            kaubru=kaubru,
            category=(row.get("category") or "general").strip(),
            example_english=(row.get("example_english") or "").strip() or None,
            example_kaubru=(row.get("example_kaubru") or "").strip() or None,
        ))
        imported += 1

    log_action(db, admin, "imported_words", detail=f"CSV import: {imported} added, {skipped} skipped")
    db.commit()
    return WordImportResult(imported=imported, skipped=skipped, errors=errors[:20])


# ─── Activity Log ─────────────────────────────────────────────────────────────

@router.get("/activity", response_model=List[ActivityLogOut])
def get_activity_log(
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    admin_id: Optional[int] = None,
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    q = db.query(models.ActivityLog)
    if admin_id:
        q = q.filter(models.ActivityLog.admin_id == admin_id)
    if action:
        q = q.filter(models.ActivityLog.action.ilike(f"%{action}%"))
    return q.order_by(models.ActivityLog.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/activity/count")
def count_activity(
    admin_id: Optional[int] = None,
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    q = db.query(func.count(models.ActivityLog.id))
    if admin_id:
        q = q.filter(models.ActivityLog.admin_id == admin_id)
    if action:
        q = q.filter(models.ActivityLog.action.ilike(f"%{action}%"))
    return {"total": q.scalar()}


# ─── Stories ──────────────────────────────────────────────────────────────────

class StoryCreateRequest(BaseModel):
    title: str
    title_kaubru: Optional[str] = None
    summary: Optional[str] = None
    content_english: Optional[str] = None
    content_kaubru: Optional[str] = None
    category: str = "folktale"
    is_premium: bool = False
    read_time_minutes: int = 5


class StoryUpdateRequest(BaseModel):
    title: Optional[str] = None
    title_kaubru: Optional[str] = None
    summary: Optional[str] = None
    content_english: Optional[str] = None
    content_kaubru: Optional[str] = None
    category: Optional[str] = None
    is_premium: Optional[bool] = None
    read_time_minutes: Optional[int] = None


class StoryAdminOut(BaseModel):
    id: int
    title: str
    title_kaubru: Optional[str] = None
    summary: Optional[str] = None
    content_english: Optional[str] = None
    content_kaubru: Optional[str] = None
    cover_image_url: Optional[str] = None
    audio_url: Optional[str] = None
    category: str
    is_premium: bool
    read_time_minutes: int
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/stories", response_model=List[StoryAdminOut])
def list_stories(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    return db.query(models.Story).order_by(models.Story.created_at.desc()).all()


@router.post("/stories", response_model=StoryAdminOut, status_code=201)
def create_story(
    payload: StoryCreateRequest,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    story = models.Story(**payload.model_dump())
    db.add(story)
    log_action(db, admin, "created_story", "story", None, f"Created story: '{payload.title}'")
    db.commit()
    db.refresh(story)
    return story


@router.put("/stories/{story_id}", response_model=StoryAdminOut)
def update_story(
    story_id: int,
    payload: StoryUpdateRequest,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(story, field, value)
    log_action(db, admin, "updated_story", "story", story.id, f"Updated story: '{story.title}'")
    db.commit()
    db.refresh(story)
    return story


@router.delete("/stories/{story_id}")
def delete_story(
    story_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    log_action(db, admin, "deleted_story", "story", story.id, f"Deleted story: '{story.title}'")
    db.delete(story)
    db.commit()
    return {"message": "Story deleted"}
