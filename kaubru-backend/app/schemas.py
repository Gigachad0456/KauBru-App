from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, field_validator


# ─── Auth ────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SocialLoginRequest(BaseModel):
    token: str
    provider: str  # "google"
    email: EmailStr
    name: str
    social_id: str
    avatar_url: Optional[str] = None


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    points: int
    is_premium: bool
    is_verified: bool = False
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class VerifyOTPRequest(BaseModel):
    otp: str

    @field_validator("otp")
    @classmethod
    def otp_must_be_six_digits(cls, v: str) -> str:
        import re
        if not re.fullmatch(r"\d{6}", v):
            raise ValueError("OTP must be exactly 6 digits")
        return v


class SignupOTPResponse(TokenResponse):
    is_verified: bool


class VerifyEmailRequest(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ─── Translation ─────────────────────────────────────────────────────────────

class TranslateRequest(BaseModel):
    text: str
    direction: str  # "en_to_kb" | "kb_to_en"


class TranslateResponse(BaseModel):
    source_text: str
    translated_text: str
    direction: str
    unknown_words: List[str] = []


class TranslationHistoryOut(BaseModel):
    id: int
    source_text: str
    translated_text: str
    direction: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Dictionary ──────────────────────────────────────────────────────────────

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


# ─── Contributions ───────────────────────────────────────────────────────────

class ContributionRequest(BaseModel):
    english: str
    kaubru: str
    meaning: Optional[str] = None
    category: str = "general"


class ContributionOut(BaseModel):
    id: int
    english: str
    kaubru: str
    meaning: Optional[str] = None
    category: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Lessons ─────────────────────────────────────────────────────────────────

class LessonWordOut(BaseModel):
    id: int
    english: str
    kaubru: str
    audio_url: Optional[str] = None

    class Config:
        from_attributes = True


class LessonOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category: str
    progress: float
    is_premium: bool
    words: Optional[List[LessonWordOut]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Profile Update ───────────────────────────────────────────────────────────

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


class AvatarResponse(BaseModel):
    avatar_url: str


# ─── Push Notifications ───────────────────────────────────────────────────────

class PushTokenRequest(BaseModel):
    token: str


# ─── Lesson Progress ─────────────────────────────────────────────────────────

class LessonProgressRequest(BaseModel):
    progress: float  # 0.0 – 1.0
    score: float     # 0.0 – 1.0


# ─── Premium ─────────────────────────────────────────────────────────────────

class PremiumPlan(BaseModel):
    id: str
    name: str
    price: str
    period: str
    is_best_value: bool
    benefits: List[str]


# ─── Stories ─────────────────────────────────────────────────────────────────

class StoryVocabOut(BaseModel):
    id: int
    english: str
    kaubru: str
    audio_url: Optional[str] = None

    class Config:
        from_attributes = True


class StoryOut(BaseModel):
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
    vocabulary: Optional[List[StoryVocabOut]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AppNotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Picture Words ────────────────────────────────────────────────────────────

class PictureWordOut(BaseModel):
    id: int
    english: str
    kaubru: str
    category: str
    image_url: Optional[str] = None
    audio_url: Optional[str] = None
    sort_order: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Word Rush Game ───────────────────────────────────────────────────────────

class WordRushScoreCreate(BaseModel):
    score: int
    level_reached: int
    direction: str
    correct_count: int
    session_id: str


class WordRushScoreOut(BaseModel):
    id: int
    user_id: int
    score: int
    level_reached: int
    direction: str
    correct_count: int
    session_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    user_name: str
    score: int
    level_reached: int
    direction: str
    created_at: datetime

    class Config:
        from_attributes = True


class AwardPointsRequest(BaseModel):
    session_id: str
    points: int

    @field_validator("points")
    @classmethod
    def points_must_be_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("points must be a non-negative integer")
        return v


# ─── Culture & Heritage ───────────────────────────────────────────────────────

VALID_CATEGORIES = {"history", "dance", "music", "traditions", "language", "festivals"}


class CultureArticleCreate(BaseModel):
    title: str
    category: str
    summary: Optional[str] = None
    content: str
    cover_image_url: Optional[str] = None
    tags: Optional[str] = None
    read_time_minutes: int = 5
    is_published: bool = True

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in VALID_CATEGORIES:
            raise ValueError(f"category must be one of {sorted(VALID_CATEGORIES)}")
        return v


class CultureArticleUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    cover_image_url: Optional[str] = None
    tags: Optional[str] = None
    read_time_minutes: Optional[int] = None
    is_published: Optional[bool] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_CATEGORIES:
            raise ValueError(f"category must be one of {sorted(VALID_CATEGORIES)}")
        return v


class CultureVocabOut(BaseModel):
    id: int
    english: str
    kaubru: str
    audio_url: Optional[str] = None

    class Config:
        from_attributes = True


class CultureArticleOut(BaseModel):
    id: int
    title: str
    category: str
    summary: Optional[str] = None
    content: Optional[str] = None          # omitted in list view
    cover_image_url: Optional[str] = None
    tags: Optional[str] = None
    read_time_minutes: int
    is_published: bool
    vocabulary: Optional[List[CultureVocabOut]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CultureArticleListItem(BaseModel):
    """List view — no content field."""
    id: int
    title: str
    category: str
    summary: Optional[str] = None
    cover_image_url: Optional[str] = None
    tags: Optional[str] = None
    read_time_minutes: int
    is_published: bool
    created_at: datetime

    class Config:
        from_attributes = True
