from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/lessons", tags=["Lessons"])


@router.get("", response_model=List[schemas.LessonOut])
def get_lessons(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    lessons = db.query(models.Lesson).order_by(models.Lesson.id).all()
    # Attach per-user progress
    result = []
    for lesson in lessons:
        lp = (
            db.query(models.LessonProgress)
            .filter(
                models.LessonProgress.user_id == current_user.id,
                models.LessonProgress.lesson_id == lesson.id,
            )
            .first()
        )
        lesson_dict = {
            "id": lesson.id,
            "title": lesson.title,
            "description": lesson.description,
            "category": lesson.category,
            "progress": lp.progress if lp else lesson.progress,
            "is_premium": lesson.is_premium,
            "created_at": lesson.created_at,
        }
        result.append(lesson_dict)
    return result


@router.get("/{lesson_id}", response_model=schemas.LessonOut)
def get_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    lp = (
        db.query(models.LessonProgress)
        .filter(
            models.LessonProgress.user_id == current_user.id,
            models.LessonProgress.lesson_id == lesson_id,
        )
        .first()
    )

    # Build words list from LessonWord join
    lesson_words = (
        db.query(models.LessonWord)
        .filter(models.LessonWord.lesson_id == lesson_id)
        .all()
    )
    words = []
    for lw in lesson_words:
        word = db.query(models.Word).filter(models.Word.id == lw.word_id).first()
        if word:
            words.append(schemas.LessonWordOut(
                id=word.id,
                english=word.english,
                kaubru=word.kaubru,
                audio_url=word.audio_url,
            ))

    return {
        "id": lesson.id,
        "title": lesson.title,
        "description": lesson.description,
        "category": lesson.category,
        "progress": lp.progress if lp else lesson.progress,
        "is_premium": lesson.is_premium,
        "words": words,
        "created_at": lesson.created_at,
    }


@router.put("/{lesson_id}/progress", response_model=schemas.LessonOut)
def update_lesson_progress(
    lesson_id: int,
    payload: schemas.LessonProgressRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    lp = (
        db.query(models.LessonProgress)
        .filter(
            models.LessonProgress.user_id == current_user.id,
            models.LessonProgress.lesson_id == lesson_id,
        )
        .first()
    )

    if lp:
        lp.progress = payload.progress
        lp.score = payload.score
        lp.updated_at = datetime.utcnow()
    else:
        lp = models.LessonProgress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            progress=payload.progress,
            score=payload.score,
        )
        db.add(lp)

    db.commit()
    db.refresh(lesson)

    return {
        "id": lesson.id,
        "title": lesson.title,
        "description": lesson.description,
        "category": lesson.category,
        "progress": lp.progress,
        "is_premium": lesson.is_premium,
        "created_at": lesson.created_at,
    }
