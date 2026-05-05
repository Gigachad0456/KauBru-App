from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, Float,
    DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user")
    points = Column(Integer, default=0)
    is_premium = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    avatar_url = Column(String(600), nullable=True)
    push_token = Column(String(200), nullable=True)
    social_id = Column(String(100), nullable=True, index=True)
    social_provider = Column(String(20), nullable=True) # google
    created_at = Column(DateTime, default=datetime.utcnow)

    translations = relationship("TranslationHistory", back_populates="user")
    saved_words = relationship("SavedWord", back_populates="user")
    contributions = relationship("Contribution", back_populates="user")


class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(64), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(64), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class ActivityLog(Base):
    """Records every admin action for the activity log."""
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    admin_name = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)   # e.g. "approved_contribution"
    target_type = Column(String(50), nullable=True) # "contribution" | "word" | "user" | ...
    target_id = Column(Integer, nullable=True)
    detail = Column(Text, nullable=True)            # human-readable summary
    created_at = Column(DateTime, default=datetime.utcnow)


class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, index=True)
    english = Column(String(200), nullable=False, index=True)
    kaubru = Column(String(200), nullable=False)
    category = Column(String(100), default="general")
    example_english = Column(Text, nullable=True)
    example_kaubru = Column(Text, nullable=True)
    audio_url = Column(String(300), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    saved_by = relationship("SavedWord", back_populates="word")


class TranslationHistory(Base):
    __tablename__ = "translation_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    source_text = Column(Text, nullable=False)
    translated_text = Column(Text, nullable=False)
    direction = Column(String(20), nullable=False)   # en_to_kb | kb_to_en
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="translations")


class SavedWord(Base):
    __tablename__ = "saved_words"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    word_id = Column(Integer, ForeignKey("words.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="saved_words")
    word = relationship("Word", back_populates="saved_by")


class Contribution(Base):
    __tablename__ = "contributions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    english = Column(String(300), nullable=False)
    kaubru = Column(String(300), nullable=False)
    meaning = Column(Text, nullable=True)
    category = Column(String(100), default="general")
    status = Column(String(20), default="pending")   # pending | approved | rejected
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="contributions")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="general")
    progress = Column(Float, default=0.0)
    is_premium = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    lesson_words = relationship("LessonWord", back_populates="lesson")
    lesson_progress = relationship("LessonProgress", back_populates="lesson")


class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    progress = Column(Float, default=0.0)
    score = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    lesson = relationship("Lesson", back_populates="lesson_progress")


class LessonWord(Base):
    __tablename__ = "lesson_words"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    word_id = Column(Integer, ForeignKey("words.id"), nullable=False)

    lesson = relationship("Lesson", back_populates="lesson_words")
    word = relationship("Word")


class Story(Base):
    """A KauBru folktale or cultural story."""
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    title_kaubru = Column(String(300), nullable=True)
    summary = Column(Text, nullable=True)           # short teaser shown on card
    content_english = Column(Text, nullable=True)   # full story in English
    content_kaubru = Column(Text, nullable=True)    # full story in KauBru
    cover_image_url = Column(String(500), nullable=True)
    audio_url = Column(String(500), nullable=True)  # narration audio
    category = Column(String(100), default="folktale")  # folktale | legend | proverb | poem
    is_premium = Column(Boolean, default=False)
    read_time_minutes = Column(Integer, default=5)
    created_at = Column(DateTime, default=datetime.utcnow)

    vocabulary = relationship("StoryWord", back_populates="story")


class StoryWord(Base):
    """Vocabulary words highlighted in a story."""
    __tablename__ = "story_words"

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("stories.id"), nullable=False)
    word_id = Column(Integer, ForeignKey("words.id"), nullable=False)

    story = relationship("Story", back_populates="vocabulary")
    word = relationship("Word")


class AppNotification(Base):
    __tablename__ = "app_notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info")  # info | success | warning | error
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class PictureWord(Base):
    """A vocabulary word with an illustration image for the Learn with Pictures section."""
    __tablename__ = "picture_words"

    id = Column(Integer, primary_key=True, index=True)
    english = Column(String(200), nullable=False)
    kaubru = Column(String(200), nullable=False)
    category = Column(String(100), default="Animals")  # Animals | Nature | Food | Objects | etc.
    image_url = Column(String(500), nullable=True)
    audio_url = Column(String(500), nullable=True)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
