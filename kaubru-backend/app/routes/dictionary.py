from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
import os
import uuid
import shutil

from app import models, schemas
from app.auth import get_current_user, get_verified_user
from app.database import get_db
from app.services.tts_service import GENERATED_AUDIO_DIR
from app.services.pronunciation_service import add_or_update_pronunciation

router = APIRouter(prefix="/dictionary", tags=["Dictionary"])

# Audio files stored locally under /uploads/audio/
AUDIO_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)
ALLOWED_AUDIO_TYPES = {
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm",
    "audio/mp4", "audio/m4a", "audio/x-m4a", "video/mp4", "application/octet-stream"
}
MAX_AUDIO_SIZE = 5 * 1024 * 1024  # 5 MB


@router.get("", response_model=List[schemas.WordOut])
def get_all_words(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_verified_user),
):
    return db.query(models.Word).offset(skip).limit(limit).all()


@router.get("/search", response_model=List[schemas.WordOut])
def search_words(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_verified_user),
):
    pattern = f"%{q.lower()}%"
    results = (
        db.query(models.Word)
        .filter(
            models.Word.english.ilike(pattern) | models.Word.kaubru.ilike(pattern)
        )
        .limit(30)
        .all()
    )
    return results


@router.get("/categories", response_model=List[str])
def get_categories(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_verified_user),
):
    rows = db.query(models.Word.category).distinct().all()
    return [r[0] for r in rows]


@router.post("/save/{word_id}", status_code=201)
def save_word(
    word_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_verified_user),
):
    word = db.query(models.Word).filter(models.Word.id == word_id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")

    already = (
        db.query(models.SavedWord)
        .filter(
            models.SavedWord.user_id == current_user.id,
            models.SavedWord.word_id == word_id,
        )
        .first()
    )
    if already:
        raise HTTPException(status_code=400, detail="Word already saved")

    saved = models.SavedWord(user_id=current_user.id, word_id=word_id)
    db.add(saved)
    db.commit()
    return {"message": "Word saved successfully"}


@router.get("/saved", response_model=List[schemas.WordOut])
def get_saved_words(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_verified_user),
):
    saved = (
        db.query(models.SavedWord)
        .filter(models.SavedWord.user_id == current_user.id)
        .all()
    )
    return [s.word for s in saved]


@router.delete("/saved/{word_id}")
def unsave_word(
    word_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_verified_user),
):
    saved = (
        db.query(models.SavedWord)
        .filter(
            models.SavedWord.user_id == current_user.id,
            models.SavedWord.word_id == word_id,
        )
        .first()
    )
    if not saved:
        raise HTTPException(status_code=404, detail="Word not in saved list")

    db.delete(saved)
    db.commit()
    return {"message": "Word removed"}


# ─── Audio Upload ─────────────────────────────────────────────────────────────

@router.post("/words/{word_id}/audio", response_model=schemas.WordOut)
def upload_word_audio(
    word_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_verified_user),
):
    """
    Upload an audio file for a dictionary word.
    Requires admin role.  Stores file locally and updates audio_url on the word.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    word = db.query(models.Word).filter(models.Word.id == word_id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")

    # Validate content type or extension
    content_type = file.content_type or ""
    ext = os.path.splitext(file.filename or "")[1].lower()
    
    if content_type not in ALLOWED_AUDIO_TYPES and ext not in [".mp3", ".wav", ".ogg", ".webm", ".m4a", ".aac"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{content_type}' or extension '{ext}'. Allowed: mp3, wav, ogg, webm, m4a",
        )

    # Read and size-check
    data = file.file.read()
    if len(data) > MAX_AUDIO_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 5 MB.")

    # Save with a unique filename
    ext = os.path.splitext(file.filename or "audio.mp3")[1] or ".mp3"
    filename = f"word_{word_id}_{uuid.uuid4().hex}{ext}"
    dest = os.path.join(AUDIO_DIR, filename)

    with open(dest, "wb") as f:
        f.write(data)

    # Delete old file if it was a local upload
    if word.audio_url and word.audio_url.startswith("/uploads/"):
        old_path = os.path.join(
            os.path.dirname(__file__), "..", "..", word.audio_url.lstrip("/")
        )
        if os.path.exists(old_path):
            os.remove(old_path)

    word.audio_url = f"/uploads/audio/{filename}"
    db.commit()
    db.refresh(word)
    
    # Also sync with our new TTS dictionary for translation playback!
    try:
        # Save a copy to the TTS generated_audio directory
        tts_filename = f"{word.kaubru.lower().strip().replace(' ', '_')}{ext}"
        GENERATED_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
        tts_dest = GENERATED_AUDIO_DIR / tts_filename
        shutil.copy2(dest, tts_dest)
        
        # Add to the JSON dictionary
        add_or_update_pronunciation(
            word=word.kaubru,
            meaning=word.english,
            phonetic="", # Admin panel doesn't have phonetic input yet
            audio_file=tts_filename
        )
    except Exception as e:
        print(f"Warning: Failed to sync audio to TTS dictionary: {e}")

    return word
