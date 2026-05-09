from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_verified_user
from app.database import get_db

router = APIRouter(prefix="/game", tags=["Game"])


# ─── POST /game/word-rush/scores ─────────────────────────────────────────────

@router.post(
    "/word-rush/scores",
    response_model=schemas.WordRushScoreOut,
    status_code=status.HTTP_201_CREATED,
)
def submit_score(
    payload: schemas.WordRushScoreCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_verified_user),
):
    """Submit a Word Rush game score. Idempotent — duplicate session_id returns the existing record."""
    existing = (
        db.query(models.WordRushScore)
        .filter(models.WordRushScore.session_id == payload.session_id)
        .first()
    )
    if existing:
        # Return the existing record with HTTP 200 (override the default 201)
        from fastapi.responses import JSONResponse
        from fastapi.encoders import jsonable_encoder

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=jsonable_encoder(schemas.WordRushScoreOut.model_validate(existing)),
        )

    new_score = models.WordRushScore(
        user_id=current_user.id,
        score=payload.score,
        level_reached=payload.level_reached,
        direction=payload.direction,
        correct_count=payload.correct_count,
        session_id=payload.session_id,
    )
    db.add(new_score)
    db.commit()
    db.refresh(new_score)
    return new_score


# ─── GET /game/word-rush/leaderboard ─────────────────────────────────────────

@router.get(
    "/word-rush/leaderboard",
    response_model=List[schemas.LeaderboardEntry],
)
def get_leaderboard(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_verified_user),
):
    """Return the top-N leaderboard entries, one best score per user, ordered by score descending."""
    # Subquery: best score per user
    best_per_user = (
        db.query(
            models.WordRushScore.user_id,
            func.max(models.WordRushScore.score).label("best_score"),
        )
        .group_by(models.WordRushScore.user_id)
        .subquery()
    )

    # Join back to get the full score record for each user's best score, then join User for name
    rows = (
        db.query(models.WordRushScore, models.User.name.label("user_name"))
        .join(
            best_per_user,
            (models.WordRushScore.user_id == best_per_user.c.user_id)
            & (models.WordRushScore.score == best_per_user.c.best_score),
        )
        .join(models.User, models.WordRushScore.user_id == models.User.id)
        .order_by(models.WordRushScore.score.desc())
        .limit(limit)
        .all()
    )

    entries: List[schemas.LeaderboardEntry] = []
    for rank, (score_record, user_name) in enumerate(rows, start=1):
        entries.append(
            schemas.LeaderboardEntry(
                rank=rank,
                user_id=score_record.user_id,
                user_name=user_name,
                score=score_record.score,
                level_reached=score_record.level_reached,
                direction=score_record.direction,
                created_at=score_record.created_at,
            )
        )

    return entries


# ─── POST /game/word-rush/award-points ───────────────────────────────────────

@router.post("/word-rush/award-points")
def award_points(
    request: schemas.AwardPointsRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_verified_user),
):
    """Award points to the current user for a Word Rush session. Idempotent — duplicate session_id is a no-op."""
    existing = (
        db.query(models.WordRushScore)
        .filter(models.WordRushScore.session_id == request.session_id)
        .first()
    )
    if existing:
        # Idempotent no-op: session already processed
        return {"awarded": 0, "total_points": current_user.points}

    current_user.points += request.points
    db.commit()
    db.refresh(current_user)
    return {"awarded": request.points, "total_points": current_user.points}
