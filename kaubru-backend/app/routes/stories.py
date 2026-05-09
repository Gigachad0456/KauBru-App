"""
Stories routes — folktales, legends, proverbs, poems.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
import os, uuid

from app import models, schemas
from app.auth import get_current_user, get_verified_user
from app.database import get_db

router = APIRouter(prefix="/stories", tags=["Stories"])

COVERS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "story_covers")
AUDIO_DIR  = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "story_audio")
os.makedirs(COVERS_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR,  exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/mp4"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def _build_vocab(story: models.Story) -> List[schemas.StoryVocabOut]:
    return [
        schemas.StoryVocabOut(
            id=sw.word.id,
            english=sw.word.english,
            kaubru=sw.word.kaubru,
            audio_url=sw.word.audio_url,
        )
        for sw in story.vocabulary if sw.word
    ]



# ─── List all stories ─────────────────────────────────────────────────────────

@router.get("", response_model=List[schemas.StoryOut])
def list_stories(
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = Query(default=50, le=100),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_verified_user),
):
    q = db.query(models.Story)
    if category:
        q = q.filter(models.Story.category == category)
    stories = q.order_by(models.Story.created_at.desc()).offset(skip).limit(limit).all()
    return [
        schemas.StoryOut(
            id=s.id, title=s.title, title_kaubru=s.title_kaubru,
            summary=s.summary, content_english=None, content_kaubru=None,
            cover_image_url=s.cover_image_url, audio_url=s.audio_url,
            category=s.category, is_premium=s.is_premium,
            read_time_minutes=s.read_time_minutes,
            vocabulary=None,
            created_at=s.created_at,
        )
        for s in stories
    ]


# ─── Get single story (with full content + vocabulary) ───────────────────────

@router.get("/{story_id}", response_model=schemas.StoryOut)
def get_story(
    story_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_verified_user),
):
    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    return schemas.StoryOut(
        id=story.id, title=story.title, title_kaubru=story.title_kaubru,
        summary=story.summary,
        content_english=story.content_english,
        content_kaubru=story.content_kaubru,
        cover_image_url=story.cover_image_url,
        audio_url=story.audio_url,
        category=story.category, is_premium=story.is_premium,
        read_time_minutes=story.read_time_minutes,
        vocabulary=_build_vocab(story),
        created_at=story.created_at,
    )


# ─── Upload cover image ───────────────────────────────────────────────────────

@router.post("/{story_id}/cover", response_model=schemas.StoryOut)
def upload_cover(
    story_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_verified_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    content_type = file.content_type or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image type. Use jpg, png, or webp.")

    data = file.file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 10 MB.")

    ext = os.path.splitext(file.filename or "cover.jpg")[1] or ".jpg"
    filename = f"story_{story_id}_{uuid.uuid4().hex}{ext}"
    with open(os.path.join(COVERS_DIR, filename), "wb") as f:
        f.write(data)

    story.cover_image_url = f"/uploads/story_covers/{filename}"
    db.commit()
    db.refresh(story)
    return schemas.StoryOut(
        id=story.id, title=story.title, title_kaubru=story.title_kaubru,
        summary=story.summary, content_english=story.content_english,
        content_kaubru=story.content_kaubru,
        cover_image_url=story.cover_image_url, audio_url=story.audio_url,
        category=story.category, is_premium=story.is_premium,
        read_time_minutes=story.read_time_minutes,
        vocabulary=_build_vocab(story), created_at=story.created_at,
    )


# ─── Upload narration audio ───────────────────────────────────────────────────

@router.post("/{story_id}/audio", response_model=schemas.StoryOut)
def upload_audio(
    story_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_verified_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    content_type = file.content_type or ""
    if content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported audio type.")

    data = file.file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 10 MB.")

    ext = os.path.splitext(file.filename or "audio.mp3")[1] or ".mp3"
    filename = f"story_{story_id}_{uuid.uuid4().hex}{ext}"
    with open(os.path.join(AUDIO_DIR, filename), "wb") as f:
        f.write(data)

    story.audio_url = f"/uploads/story_audio/{filename}"
    db.commit()
    db.refresh(story)
    return schemas.StoryOut(
        id=story.id, title=story.title, title_kaubru=story.title_kaubru,
        summary=story.summary, content_english=story.content_english,
        content_kaubru=story.content_kaubru,
        cover_image_url=story.cover_image_url, audio_url=story.audio_url,
        category=story.category, is_premium=story.is_premium,
        read_time_minutes=story.read_time_minutes,
        vocabulary=_build_vocab(story), created_at=story.created_at,
    )
