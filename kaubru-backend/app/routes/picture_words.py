"""
Picture Words routes — vocabulary with images for the Learn with Pictures section.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
import os, uuid

from app import models, schemas
from app.auth import get_current_user, get_verified_user
from app.database import get_db

router = APIRouter(prefix="/picture-words", tags=["Picture Words"])

IMAGES_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "picture_words")
os.makedirs(IMAGES_DIR, exist_ok=True)
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE = 5 * 1024 * 1024  # 5 MB


# ─── Public: list all active picture words ────────────────────────────────────

@router.get("", response_model=List[schemas.PictureWordOut])
def list_picture_words(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_verified_user),
):
    q = db.query(models.PictureWord).filter(models.PictureWord.is_active == True)
    if category:
        q = q.filter(models.PictureWord.category == category)
    return q.order_by(models.PictureWord.sort_order, models.PictureWord.id).all()


@router.get("/categories", response_model=List[str])
def list_categories(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_verified_user),
):
    rows = db.query(models.PictureWord.category).distinct().all()
    return [r[0] for r in rows]


# ─── Admin: full CRUD ─────────────────────────────────────────────────────────

def require_admin(current_user: models.User = Depends(get_verified_user)) -> models.User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/admin/all", response_model=List[schemas.PictureWordOut])
def admin_list_all(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    return db.query(models.PictureWord).order_by(models.PictureWord.sort_order, models.PictureWord.id).all()


@router.post("/admin", response_model=schemas.PictureWordOut, status_code=201)
def create_picture_word(
    english: str,
    kaubru: str,
    category: str = "Animals",
    sort_order: int = 0,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    pw = models.PictureWord(
        english=english, kaubru=kaubru,
        category=category, sort_order=sort_order,
    )
    db.add(pw)
    db.commit()
    db.refresh(pw)
    return pw


@router.put("/admin/{pw_id}", response_model=schemas.PictureWordOut)
def update_picture_word(
    pw_id: int,
    english: Optional[str] = None,
    kaubru: Optional[str] = None,
    category: Optional[str] = None,
    sort_order: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    pw = db.query(models.PictureWord).filter(models.PictureWord.id == pw_id).first()
    if not pw:
        raise HTTPException(status_code=404, detail="Picture word not found")
    if english is not None: pw.english = english
    if kaubru is not None: pw.kaubru = kaubru
    if category is not None: pw.category = category
    if sort_order is not None: pw.sort_order = sort_order
    if is_active is not None: pw.is_active = is_active
    db.commit()
    db.refresh(pw)
    return pw


@router.delete("/admin/{pw_id}")
def delete_picture_word(
    pw_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    pw = db.query(models.PictureWord).filter(models.PictureWord.id == pw_id).first()
    if not pw:
        raise HTTPException(status_code=404, detail="Picture word not found")
    db.delete(pw)
    db.commit()
    return {"message": "Deleted"}


@router.post("/admin/{pw_id}/image", response_model=schemas.PictureWordOut)
def upload_image(
    pw_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    pw = db.query(models.PictureWord).filter(models.PictureWord.id == pw_id).first()
    if not pw:
        raise HTTPException(status_code=404, detail="Picture word not found")

    content_type = file.content_type or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image type. Use jpg, png, webp, or gif.")

    data = file.file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 5 MB.")

    ext = os.path.splitext(file.filename or "img.jpg")[1] or ".jpg"
    filename = f"pw_{pw_id}_{uuid.uuid4().hex}{ext}"
    dest = os.path.join(IMAGES_DIR, filename)

    # Delete old image if exists
    if pw.image_url and pw.image_url.startswith("/uploads/picture_words/"):
        old = os.path.join(os.path.dirname(__file__), "..", "..", pw.image_url.lstrip("/"))
        if os.path.exists(old):
            os.remove(old)

    with open(dest, "wb") as f:
        f.write(data)

    pw.image_url = f"/uploads/picture_words/{filename}"
    db.commit()
    db.refresh(pw)
    return pw
