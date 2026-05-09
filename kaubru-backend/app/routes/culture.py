"""
Culture & Heritage routes — articles about KauBru/Bru/Reang history, dance, music, etc.

Public endpoints use prefix /culture-articles (via router prefix).
Admin endpoints use full paths /admin/culture-articles/... (no prefix on those routes,
so we use a single router with prefix="" and spell out all paths explicitly).
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os, uuid

from app import models, schemas
from app.auth import get_current_user, get_verified_user
from app.database import get_db

# Single router with no prefix — all paths are spelled out explicitly so that
# public routes live under /culture-articles and admin routes under /admin/culture-articles.
router = APIRouter(tags=["Culture"])

COVERS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "culture_covers")
os.makedirs(COVERS_DIR, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


# ─── Helper ───────────────────────────────────────────────────────────────────

def _build_vocab(article: models.CultureArticle) -> List[schemas.CultureVocabOut]:
    """Build a list of CultureVocabOut from the article's vocabulary relationship."""
    return [
        schemas.CultureVocabOut(
            id=aw.word.id,
            english=aw.word.english,
            kaubru=aw.word.kaubru,
            audio_url=aw.word.audio_url,
        )
        for aw in article.vocabulary if aw.word
    ]


def _article_out(article: models.CultureArticle) -> schemas.CultureArticleOut:
    """Build a full CultureArticleOut (with content and vocabulary)."""
    return schemas.CultureArticleOut(
        id=article.id,
        title=article.title,
        category=article.category,
        summary=article.summary,
        content=article.content,
        cover_image_url=article.cover_image_url,
        tags=article.tags,
        read_time_minutes=article.read_time_minutes,
        is_published=article.is_published,
        vocabulary=_build_vocab(article),
        created_at=article.created_at,
    )


def _require_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    """Dependency: raises 403 if the current user is not an admin."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ─── Public: List articles ────────────────────────────────────────────────────

@router.get("/culture-articles", response_model=List[schemas.CultureArticleListItem])
def list_culture_articles(
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = Query(default=50, le=100),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_verified_user),
):
    """
    List published culture articles ordered by created_at descending.
    Supports optional ?category= and ?search= (case-insensitive match on title or tags).
    Returns CultureArticleListItem (no content field).
    """
    q = db.query(models.CultureArticle)
    if category:
        q = q.filter(models.CultureArticle.category == category)
    if search:
        pattern = f"%{search}%"
        q = q.filter(
            models.CultureArticle.title.ilike(pattern)
            | models.CultureArticle.tags.ilike(pattern)
        )
    articles = q.order_by(models.CultureArticle.created_at.desc()).offset(skip).limit(limit).all()
    return [
        schemas.CultureArticleListItem(
            id=a.id,
            title=a.title,
            category=a.category,
            summary=a.summary,
            cover_image_url=a.cover_image_url,
            tags=a.tags,
            read_time_minutes=a.read_time_minutes,
            is_published=a.is_published,
            created_at=a.created_at,
        )
        for a in articles
    ]


# ─── Public: Get single article (full content + vocabulary) ──────────────────

@router.get("/culture-articles/{article_id}", response_model=schemas.CultureArticleOut)
def get_culture_article(
    article_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_verified_user),
):
    """
    Return a single culture article with full content and vocabulary.
    Returns 404 if not found.
    """
    article = db.query(models.CultureArticle).filter(
        models.CultureArticle.id == article_id
    ).first()
    if not article:
        raise HTTPException(status_code=404, detail="Culture article not found")
    return _article_out(article)


# ─── Admin: List all articles ─────────────────────────────────────────────────

@router.get("/admin/culture-articles", response_model=List[schemas.CultureArticleOut])
def admin_list_culture_articles(
    db: Session = Depends(get_db),
    _: models.User = Depends(_require_admin),
):
    """Admin view: list all culture articles (including unpublished), with full content."""
    articles = db.query(models.CultureArticle).order_by(
        models.CultureArticle.created_at.desc()
    ).all()
    return [_article_out(a) for a in articles]


# ─── Admin: Create article ────────────────────────────────────────────────────

@router.post("/admin/culture-articles", response_model=schemas.CultureArticleOut, status_code=201)
def admin_create_culture_article(
    payload: schemas.CultureArticleCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(_require_admin),
):
    """Admin: create a new culture article. Returns HTTP 201."""
    article = models.CultureArticle(
        title=payload.title,
        category=payload.category,
        summary=payload.summary,
        content=payload.content,
        cover_image_url=payload.cover_image_url,
        tags=payload.tags,
        read_time_minutes=payload.read_time_minutes,
        is_published=payload.is_published,
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return _article_out(article)


# ─── Admin: Update article (partial) ─────────────────────────────────────────

@router.put("/admin/culture-articles/{article_id}", response_model=schemas.CultureArticleOut)
def admin_update_culture_article(
    article_id: int,
    payload: schemas.CultureArticleUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(_require_admin),
):
    """Admin: partially update a culture article. Returns 404 if not found."""
    article = db.query(models.CultureArticle).filter(
        models.CultureArticle.id == article_id
    ).first()
    if not article:
        raise HTTPException(status_code=404, detail="Culture article not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(article, field, value)

    db.commit()
    db.refresh(article)
    return _article_out(article)


# ─── Admin: Delete article ────────────────────────────────────────────────────

@router.delete("/admin/culture-articles/{article_id}", status_code=204)
def admin_delete_culture_article(
    article_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(_require_admin),
):
    """Admin: delete a culture article (cascade deletes vocabulary links). Returns 204."""
    article = db.query(models.CultureArticle).filter(
        models.CultureArticle.id == article_id
    ).first()
    if not article:
        raise HTTPException(status_code=404, detail="Culture article not found")
    db.delete(article)
    db.commit()


# ─── Admin: Upload cover image ────────────────────────────────────────────────

@router.post("/admin/culture-articles/{article_id}/cover", response_model=schemas.CultureArticleOut)
def admin_upload_cover(
    article_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: models.User = Depends(_require_admin),
):
    """
    Admin: upload a cover image for a culture article.
    Accepts JPEG, PNG, or WebP; max 10 MB.
    Saves to uploads/culture_covers/ and updates cover_image_url.
    """
    article = db.query(models.CultureArticle).filter(
        models.CultureArticle.id == article_id
    ).first()
    if not article:
        raise HTTPException(status_code=404, detail="Culture article not found")

    content_type = file.content_type or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image type. Use jpg, png, or webp.",
        )

    data = file.file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 10 MB.")

    ext = os.path.splitext(file.filename or "cover.jpg")[1] or ".jpg"
    filename = f"culture_{article_id}_{uuid.uuid4().hex}{ext}"
    with open(os.path.join(COVERS_DIR, filename), "wb") as f:
        f.write(data)

    article.cover_image_url = f"/uploads/culture_covers/{filename}"
    db.commit()
    db.refresh(article)
    return _article_out(article)


# ─── Admin: Link vocabulary word ──────────────────────────────────────────────

class VocabLinkRequest(BaseModel):
    word_id: int


@router.post("/admin/culture-articles/{article_id}/vocabulary", response_model=schemas.CultureArticleOut)
def admin_add_vocabulary(
    article_id: int,
    payload: VocabLinkRequest,
    db: Session = Depends(get_db),
    _: models.User = Depends(_require_admin),
):
    """
    Admin: link a vocabulary word to a culture article.
    Idempotent — silently ignores if the link already exists.
    Returns 404 if article or word not found.
    """
    article = db.query(models.CultureArticle).filter(
        models.CultureArticle.id == article_id
    ).first()
    if not article:
        raise HTTPException(status_code=404, detail="Culture article not found")

    word = db.query(models.Word).filter(models.Word.id == payload.word_id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")

    # Check if link already exists — idempotent (silently ignore duplicates)
    existing = db.query(models.CultureArticleWord).filter(
        models.CultureArticleWord.article_id == article_id,
        models.CultureArticleWord.word_id == payload.word_id,
    ).first()
    if not existing:
        link = models.CultureArticleWord(article_id=article_id, word_id=payload.word_id)
        db.add(link)
        db.commit()

    db.refresh(article)
    return _article_out(article)


# ─── Admin: Unlink vocabulary word ───────────────────────────────────────────

@router.delete("/admin/culture-articles/{article_id}/vocabulary/{word_id}", status_code=204)
def admin_remove_vocabulary(
    article_id: int,
    word_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(_require_admin),
):
    """
    Admin: remove a vocabulary word link from a culture article.
    Returns 204. Returns 404 if the article or link is not found.
    """
    article = db.query(models.CultureArticle).filter(
        models.CultureArticle.id == article_id
    ).first()
    if not article:
        raise HTTPException(status_code=404, detail="Culture article not found")

    link = db.query(models.CultureArticleWord).filter(
        models.CultureArticleWord.article_id == article_id,
        models.CultureArticleWord.word_id == word_id,
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Vocabulary link not found")

    db.delete(link)
    db.commit()
