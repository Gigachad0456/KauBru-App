from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import os
import mimetypes

# Ensure .m4a and other audio files are served with correct MIME types
mimetypes.add_type('audio/mp4', '.m4a')
mimetypes.add_type('audio/mp4', '.m4v')
mimetypes.add_type('audio/aac', '.aac')

from app.config import settings
from app.database import Base, engine
from app.limiter import limiter
from app.routes import auth, translation, dictionary, contributions, lessons, premium, admin, tts, notifications, stories, picture_words, chat

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for KauBru AI Translator — Preserve. Translate. Learn.",
    version="1.0.0",
)

# ── Rate limiting ─────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files (uploaded audio) ─────────────────────────────────────────────
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
# ── Static files (generated TTS audio) ────────────────────────────────────────
GENERATED_AUDIO_DIR = os.path.join(os.path.dirname(__file__), "..", "generated_audio")
os.makedirs(GENERATED_AUDIO_DIR, exist_ok=True)
app.mount("/generated_audio", StaticFiles(directory=GENERATED_AUDIO_DIR), name="generated_audio")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(translation.router)
app.include_router(dictionary.router)
app.include_router(contributions.router)
app.include_router(lessons.router)
app.include_router(premium.router)
app.include_router(admin.router)
app.include_router(tts.router)
app.include_router(notifications.router)
app.include_router(stories.router)
app.include_router(picture_words.router)
app.include_router(chat.router)


@app.get("/", tags=["Health"])
def root():
    return {"message": "KauBru AI Translator API is running 🌿"}
