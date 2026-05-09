from fastapi import FastAPI, Request, Response
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
from app.routes import auth, translation, dictionary, contributions, lessons, premium, admin, tts, notifications, stories, picture_words, chat, game, culture

# Create all tables on startup
Base.metadata.create_all(bind=engine)

# Auto-seed missing words on every startup (safe — skips existing entries)
def _auto_seed():
    import ast
    import os
    from app.database import SessionLocal
    from app import models

    seed_path = os.path.join(os.path.dirname(__file__), "..", "seed.py")
    if not os.path.exists(seed_path):
        return

    try:
        with open(seed_path, encoding="utf-8") as f:
            source = f.read()
        tree = ast.parse(source)
        WORDS = None
        for node in ast.walk(tree):
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name) and target.id == "WORDS":
                        WORDS = ast.literal_eval(node.value)
        if not WORDS:
            return

        db = SessionLocal()
        existing_keys = {
            (w.english.lower().strip(), w.category.lower().strip())
            for w in db.query(models.Word).all()
        }
        added = 0
        for w in WORDS:
            key = (w["english"].lower().strip(), w["category"].lower().strip())
            if key not in existing_keys:
                db.add(models.Word(
                    english=w["english"],
                    kaubru=w["kaubru"],
                    category=w["category"],
                    example_english=w.get("example_english", ""),
                    example_kaubru=w.get("example_kaubru", ""),
                ))
                existing_keys.add(key)
                added += 1
        if added:
            db.commit()
            print(f"[startup] Auto-seeded {added} new words (total: {len(existing_keys)})")
        else:
            print(f"[startup] All {len(existing_keys)} words already in DB")
        db.close()
    except Exception as e:
        print(f"[startup] Auto-seed failed: {e}")

_auto_seed()

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for KauBru AI Translator — Preserve. Translate. Learn.",
    version="1.0.0",
)

# ── Trust Railway's reverse proxy so real client IPs are visible ──────────────
# This makes request.client.host return the real IP, not the proxy IP.
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

# ── Rate limiting ─────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ─────────────────────────────────────────────────────────────────────
# List your Vercel URL explicitly just in case "*" is being ignored
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://admin-panel-lunvenn3a-isac-reangs-projects.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Keep this but we'll also try to handle it in a custom way if it fails
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware to FORCE headers even on error
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# ── Static files ─────────────────────────────────────────────────────────────
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

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
app.include_router(culture.router)
app.include_router(picture_words.router)
app.include_router(chat.router)
app.include_router(game.router)

@app.get("/", tags=["Health"])
def root():
    return {"message": "KauBru AI Translator API is running 🌿"}
