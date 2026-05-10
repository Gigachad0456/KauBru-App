from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app import models
from app.auth import get_verified_user
from app.database import get_db
from app.jobs_common import (
    JOB_MODERATION_STATUS_OPTIONS,
    JOB_SORT_OPTIONS,
    JOB_TYPE_OPTIONS,
    QUALIFICATION_OPTIONS,
    compute_is_open,
    normalize_qualification_tags,
    normalize_url,
    to_public_job_status,
)
from app.services.jobs_fetcher import fetch_and_store_jobs_once


router = APIRouter(tags=["Jobs"])


class JobOut(BaseModel):
    id: int
    title: str
    organization: str
    job_type: str
    location: str
    qualification_tags: List[str]
    qualification_text: Optional[str] = None
    last_date: Optional[date] = None
    apply_link: Optional[str] = None
    source_link: str
    description: Optional[str] = None
    status: str
    is_open: bool
    job_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class JobCreateRequest(BaseModel):
    title: str
    organization: str
    job_type: str = "Government"
    location: str = "Tripura"
    qualification_tags: List[str] = []
    qualification_text: Optional[str] = None
    last_date: Optional[date] = None
    apply_link: Optional[str] = None
    source_link: str
    description: Optional[str] = None
    status: str = "pending"
    is_open: Optional[bool] = None

    @field_validator("job_type")
    @classmethod
    def validate_job_type(cls, v: str) -> str:
        if v not in JOB_TYPE_OPTIONS:
            raise ValueError(f"job_type must be one of {sorted(JOB_TYPE_OPTIONS)}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in JOB_MODERATION_STATUS_OPTIONS:
            raise ValueError(f"status must be one of {sorted(JOB_MODERATION_STATUS_OPTIONS)}")
        return v

    @field_validator("source_link")
    @classmethod
    def validate_source_link(cls, v: str) -> str:
        normalized = normalize_url(v)
        if not normalized:
            raise ValueError("source_link is required")
        return normalized

    @field_validator("apply_link")
    @classmethod
    def validate_apply_link(cls, v: Optional[str]) -> Optional[str]:
        return normalize_url(v)


class JobUpdateRequest(BaseModel):
    title: Optional[str] = None
    organization: Optional[str] = None
    job_type: Optional[str] = None
    location: Optional[str] = None
    qualification_tags: Optional[List[str]] = None
    qualification_text: Optional[str] = None
    last_date: Optional[date] = None
    apply_link: Optional[str] = None
    source_link: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    is_open: Optional[bool] = None

    @field_validator("job_type")
    @classmethod
    def validate_job_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in JOB_TYPE_OPTIONS:
            raise ValueError(f"job_type must be one of {sorted(JOB_TYPE_OPTIONS)}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in JOB_MODERATION_STATUS_OPTIONS:
            raise ValueError(f"status must be one of {sorted(JOB_MODERATION_STATUS_OPTIONS)}")
        return v

    @field_validator("source_link")
    @classmethod
    def validate_source_link(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        normalized = normalize_url(v)
        if not normalized:
            raise ValueError("source_link cannot be empty")
        return normalized

    @field_validator("apply_link")
    @classmethod
    def validate_apply_link(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return normalize_url(v)


def require_admin(current_user: models.User = Depends(get_verified_user)) -> models.User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def to_job_out(job: models.Job) -> JobOut:
    return JobOut(
        id=job.id,
        title=job.title,
        organization=job.organization,
        job_type=job.job_type,
        location=job.location,
        qualification_tags=job.qualification_tags or [],
        qualification_text=job.qualification_text,
        last_date=job.last_date,
        apply_link=job.apply_link,
        source_link=job.source_link,
        description=job.description,
        status=job.status,
        is_open=job.is_open,
        job_status=to_public_job_status(job.is_open),
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


def _apply_search_filter_sort(
    jobs: List[models.Job],
    search: Optional[str],
    qualification: Optional[str],
    sort: str,
) -> List[models.Job]:
    items = jobs

    if search:
        needle = search.lower().strip()
        items = [
            j for j in items
            if needle in (j.title or "").lower() or needle in (j.organization or "").lower()
        ]

    if qualification and qualification != "All":
        items = [j for j in items if qualification in (j.qualification_tags or [])]

    if sort == "latest":
        items.sort(key=lambda j: j.id, reverse=True)
    elif sort == "closing":
        items.sort(
            key=lambda j: (
                j.last_date is None,
                j.last_date or date.max,
                -(j.created_at.timestamp() if j.created_at else 0),
            )
        )
    elif sort == "qualification":
        items.sort(
            key=lambda j: (
                (j.qualification_tags or ["zzz"])[0].lower(),
                -(j.created_at.timestamp() if j.created_at else 0),
            )
        )

    return items


def _validate_sort(sort: str) -> str:
    if sort not in JOB_SORT_OPTIONS:
        raise HTTPException(status_code=400, detail=f"sort must be one of {sorted(JOB_SORT_OPTIONS)}")
    return sort


@router.get("/jobs/qualifications", response_model=List[str])
def list_job_qualifications(
    _: models.User = Depends(get_verified_user),
):
    return QUALIFICATION_OPTIONS


@router.get("/jobs", response_model=List[JobOut])
def list_public_jobs(
    search: Optional[str] = None,
    qualification: Optional[str] = None,
    sort: str = Query(default="latest"),
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_verified_user),
):
    _validate_sort(sort)

    rows = db.query(models.Job).filter(
        models.Job.status == "published",
        models.Job.is_open == True,
    ).all()
    rows = _apply_search_filter_sort(rows, search, qualification, sort)
    paged = rows[skip: skip + limit]
    return [to_job_out(j) for j in paged]


@router.get("/admin/jobs", response_model=List[JobOut])
def admin_list_jobs(
    status: Optional[str] = None,
    job_status: Optional[str] = Query(default=None, description="open | closed"),
    search: Optional[str] = None,
    qualification: Optional[str] = None,
    sort: str = Query(default="latest"),
    skip: int = 0,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    _validate_sort(sort)

    if status and status not in JOB_MODERATION_STATUS_OPTIONS:
        raise HTTPException(status_code=400, detail=f"status must be one of {sorted(JOB_MODERATION_STATUS_OPTIONS)}")
    if job_status and job_status not in {"open", "closed"}:
        raise HTTPException(status_code=400, detail="job_status must be open or closed")

    rows = db.query(models.Job).all()
    if status:
        rows = [j for j in rows if j.status == status]
    if job_status == "open":
        rows = [j for j in rows if j.is_open]
    elif job_status == "closed":
        rows = [j for j in rows if not j.is_open]

    rows = _apply_search_filter_sort(rows, search, qualification, sort)
    paged = rows[skip: skip + limit]
    return [to_job_out(j) for j in paged]


@router.post("/admin/jobs", response_model=JobOut, status_code=201)
def admin_create_job(
    payload: JobCreateRequest,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    existing = db.query(models.Job).filter(
        models.Job.title == payload.title.strip(),
        models.Job.source_link == payload.source_link,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="A job with the same title and source link already exists")

    qualification_tags = normalize_qualification_tags(payload.qualification_tags, payload.qualification_text)
    is_open = payload.is_open if payload.is_open is not None else compute_is_open(payload.last_date)

    job = models.Job(
        title=payload.title.strip(),
        organization=payload.organization.strip(),
        job_type=payload.job_type,
        location=(payload.location or "Tripura").strip() or "Tripura",
        qualification_tags=qualification_tags,
        qualification_text=(payload.qualification_text or "").strip() or None,
        last_date=payload.last_date,
        apply_link=payload.apply_link,
        source_link=payload.source_link,
        description=(payload.description or "").strip() or None,
        status=payload.status,
        is_open=is_open,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return to_job_out(job)


@router.put("/admin/jobs/{job_id}", response_model=JobOut)
def admin_update_job(
    job_id: int,
    payload: JobUpdateRequest,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    data = payload.model_dump(exclude_unset=True)

    if "title" in data and data["title"] is not None:
        data["title"] = data["title"].strip()
    if "organization" in data and data["organization"] is not None:
        data["organization"] = data["organization"].strip()
    if "location" in data and data["location"] is not None:
        data["location"] = data["location"].strip() or "Tripura"
    if "description" in data and data["description"] is not None:
        data["description"] = data["description"].strip() or None
    if "qualification_text" in data and data["qualification_text"] is not None:
        data["qualification_text"] = data["qualification_text"].strip() or None

    if "title" in data or "source_link" in data:
        check_title = data.get("title", job.title)
        check_source = data.get("source_link", job.source_link)
        duplicate = db.query(models.Job).filter(
            models.Job.id != job.id,
            models.Job.title == check_title,
            models.Job.source_link == check_source,
        ).first()
        if duplicate:
            raise HTTPException(status_code=400, detail="Another job already exists with this title and source link")

    if "qualification_tags" in data or "qualification_text" in data:
        data["qualification_tags"] = normalize_qualification_tags(
            data.get("qualification_tags", job.qualification_tags),
            data.get("qualification_text", job.qualification_text),
        )

    for field, value in data.items():
        setattr(job, field, value)

    # If last date changed and explicit is_open wasn't provided, re-evaluate open status.
    if "last_date" in data and "is_open" not in data:
        job.is_open = compute_is_open(job.last_date)

    job.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(job)
    return to_job_out(job)


@router.put("/admin/jobs/{job_id}/publish", response_model=JobOut)
def admin_publish_job(
    job_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = "published"
    if job.last_date:
        job.is_open = compute_is_open(job.last_date)
    job.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(job)
    return to_job_out(job)


@router.put("/admin/jobs/{job_id}/reject", response_model=JobOut)
def admin_reject_job(
    job_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = "rejected"
    job.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(job)
    return to_job_out(job)


@router.put("/admin/jobs/{job_id}/close", response_model=JobOut)
def admin_close_job(
    job_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.is_open = False
    job.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(job)
    return to_job_out(job)


@router.put("/admin/jobs/{job_id}/open", response_model=JobOut)
def admin_open_job(
    job_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.is_open = True
    job.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(job)
    return to_job_out(job)


@router.delete("/admin/jobs/{job_id}")
def admin_delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return {"message": "Job deleted"}


@router.post("/admin/jobs/fetch")
def admin_fetch_jobs_now(
    _: models.User = Depends(require_admin),
):
    try:
        summary = fetch_and_store_jobs_once()
        return {"message": "Job fetch completed", "summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fetcher failed: {str(e)}")
