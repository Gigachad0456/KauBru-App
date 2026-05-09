"""
Auth routes — signup, login, email verification, password reset.
"""

import secrets
import logging
import os
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request, UploadFile, File
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token, get_current_user, get_verified_user
from app.config import settings
from app.database import get_db
from app.email_service import send_verification_email, send_password_reset_email, send_otp_email
from app.limiter import limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Auth"])

VERIFY_TOKEN_EXPIRE_HOURS = 24
RESET_TOKEN_EXPIRE_HOURS = 1


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _make_token() -> str:
    return secrets.token_urlsafe(32)


def _make_otp() -> str:
    """Generate a cryptographically random 6-digit OTP string."""
    return str(secrets.randbelow(1_000_000)).zfill(6)


def _create_otp_token(user_id: int, db: Session) -> str:
    """Invalidate existing unused OTP tokens and create a new one. Returns the OTP string."""
    # Invalidate all existing unused tokens for this user
    db.query(models.EmailVerificationToken).filter(
        models.EmailVerificationToken.user_id == user_id,
        models.EmailVerificationToken.used == False,
    ).update({"used": True})

    otp = _make_otp()
    vtoken = models.EmailVerificationToken(
        user_id=user_id,
        token=otp,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
        used=False,
    )
    db.add(vtoken)
    db.commit()
    return otp


# ─── Signup ───────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=schemas.SignupOTPResponse, status_code=201)
@limiter.limit("10/minute")
def signup(
    request: Request,
    payload: schemas.SignupRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    email = payload.email.lower().strip()
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        name=payload.name,
        email=email,
        password_hash=hash_password(payload.password),
        is_verified=True,  # Email verification disabled — users verified on signup
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": str(user.id)})
    return {"access_token": access_token, "is_verified": True}


# ─── OTP Verification ─────────────────────────────────────────────────────────

@router.post("/verify-otp")
def verify_otp(
    payload: schemas.VerifyOTPRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    vtoken = (
        db.query(models.EmailVerificationToken)
        .filter(
            models.EmailVerificationToken.user_id == current_user.id,
            models.EmailVerificationToken.token == payload.otp,
            models.EmailVerificationToken.used == False,
        )
        .first()
    )
    if not vtoken:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if vtoken.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP has expired")

    vtoken.used = True
    current_user.is_verified = True
    db.commit()
    return {"message": "Email verified successfully"}


@router.post("/resend-otp")
@limiter.limit("3/10minute")
def resend_otp(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    otp = _create_otp_token(current_user.id, db)
    background_tasks.add_task(send_otp_email, current_user.email, current_user.name, otp)
    return {"message": "OTP sent"}


# ─── Login ────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=schemas.TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Auto-verify users who signed up before OTP was introduced
    if not user.is_verified:
        user.is_verified = True
        db.commit()

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token}


@router.post("/social-login", response_model=schemas.TokenResponse)
def social_login(payload: schemas.SocialLoginRequest, db: Session = Depends(get_db)):
    # Look for existing user by social_id + provider
    user = (
        db.query(models.User)
        .filter(models.User.social_id == payload.social_id)
        .filter(models.User.social_provider == payload.provider)
        .first()
    )

    if not user:
        # Check if user with this email already exists
        user = db.query(models.User).filter(models.User.email == payload.email).first()
        if user:
            # Link social account to existing email account
            user.social_id = payload.social_id
            user.social_provider = payload.provider
            if not user.avatar_url:
                user.avatar_url = payload.avatar_url
            user.is_verified = True
            db.commit()
        else:
            # Create new user
            user = models.User(
                name=payload.name,
                email=payload.email,
                social_id=payload.social_id,
                social_provider=payload.provider,
                avatar_url=payload.avatar_url,
                is_verified=True,  # Social logins are pre-verified
                password_hash=hash_password(secrets.token_urlsafe(16)), # dummy password
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token}


# ─── Me ───────────────────────────────────────────────────────────────────────

@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=schemas.UserOut)
def update_me(
    payload: schemas.UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_verified_user),
):
    if payload.name is not None:
        current_user.name = payload.name.strip()

    if payload.new_password is not None:
        if not payload.current_password:
            raise HTTPException(status_code=400, detail="Current password is required to set a new password")
        if not verify_password(payload.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        if len(payload.new_password) < 8:
            raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
        current_user.password_hash = hash_password(payload.new_password)

    db.commit()
    db.refresh(current_user)
    return current_user


# ─── Avatar Upload ────────────────────────────────────────────────────────────

AVATAR_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "avatars")
os.makedirs(AVATAR_DIR, exist_ok=True)
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5 MB


def _upload_to_cloudinary(data: bytes, public_id: str) -> str:
    """Upload image bytes to Cloudinary and return the secure URL."""
    import cloudinary
    import cloudinary.uploader
    import io

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )
    result = cloudinary.uploader.upload(
        io.BytesIO(data),
        public_id=public_id,
        folder="kaubru/avatars",
        overwrite=True,
        resource_type="image",
        transformation=[
            {"width": 256, "height": 256, "crop": "fill", "gravity": "face"},
            {"quality": "auto", "fetch_format": "auto"},
        ],
    )
    return result["secure_url"]


@router.post("/avatar", response_model=schemas.AvatarResponse)
def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_verified_user),
):
    content_type = file.content_type or ""
    ext = os.path.splitext(file.filename or "")[1].lower()

    if content_type not in ALLOWED_IMAGE_TYPES and ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        raise HTTPException(status_code=400, detail="Unsupported image type. Allowed: jpg, png, webp, gif")

    data = file.file.read()
    if len(data) > MAX_AVATAR_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 5 MB.")

    # Use Cloudinary if all credentials are configured
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
        try:
            public_id = f"user_{current_user.id}"
            avatar_url = _upload_to_cloudinary(data, public_id)
        except Exception as e:
            logger.error(f"Cloudinary upload failed: {e}")
            raise HTTPException(status_code=500, detail="Avatar upload failed. Please try again.")
    else:
        # Local fallback — works but files are lost on Railway redeploy
        file_ext = os.path.splitext(file.filename or "avatar.jpg")[1] or ".jpg"
        filename = f"avatar_{current_user.id}_{uuid.uuid4().hex}{file_ext}"
        dest = os.path.join(AVATAR_DIR, filename)
        with open(dest, "wb") as f:
            f.write(data)
        # Delete old local avatar if it exists
        if current_user.avatar_url and current_user.avatar_url.startswith("/uploads/avatars/"):
            old_path = os.path.join(
                os.path.dirname(__file__), "..", "..", current_user.avatar_url.lstrip("/")
            )
            if os.path.exists(old_path):
                os.remove(old_path)
        avatar_url = f"/uploads/avatars/{filename}"

    current_user.avatar_url = avatar_url
    db.commit()
    db.refresh(current_user)
    return {"avatar_url": avatar_url}


# ─── Email Verification ───────────────────────────────────────────────────────

@router.post("/verify-email")
def verify_email(payload: schemas.VerifyEmailRequest, db: Session = Depends(get_db)):
    vtoken = (
        db.query(models.EmailVerificationToken)
        .filter(models.EmailVerificationToken.token == payload.token)
        .first()
    )
    if not vtoken:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    if vtoken.used:
        raise HTTPException(status_code=400, detail="Token already used")
    if vtoken.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification token expired")

    user = db.query(models.User).filter(models.User.id == vtoken.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_verified = True
    vtoken.used = True
    db.commit()
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
def resend_verification(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    # Invalidate old tokens
    db.query(models.EmailVerificationToken).filter(
        models.EmailVerificationToken.user_id == current_user.id,
        models.EmailVerificationToken.used == False,
    ).update({"used": True})

    token_str = _make_token()
    vtoken = models.EmailVerificationToken(
        user_id=current_user.id,
        token=token_str,
        expires_at=datetime.utcnow() + timedelta(hours=VERIFY_TOKEN_EXPIRE_HOURS),
    )
    db.add(vtoken)
    db.commit()

    background_tasks.add_task(
        send_verification_email, current_user.email, current_user.name, token_str
    )
    return {"message": "Verification email sent"}


# ─── Password Reset ───────────────────────────────────────────────────────────

@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(
    request: Request,
    payload: schemas.ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    # Always return 200 to avoid email enumeration
    if not user:
        return {"message": "If that email exists, a reset link has been sent"}

    # Invalidate old reset tokens
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == user.id,
        models.PasswordResetToken.used == False,
    ).update({"used": True})

    token_str = _make_token()
    rtoken = models.PasswordResetToken(
        user_id=user.id,
        token=token_str,
        expires_at=datetime.utcnow() + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS),
    )
    db.add(rtoken)
    db.commit()

    background_tasks.add_task(
        send_password_reset_email, user.email, user.name, token_str
    )
    return {"message": "If that email exists, a reset link has been sent"}


@router.post("/reset-password")
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    rtoken = (
        db.query(models.PasswordResetToken)
        .filter(models.PasswordResetToken.token == payload.token)
        .first()
    )
    if not rtoken:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    if rtoken.used:
        raise HTTPException(status_code=400, detail="Token already used")
    if rtoken.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset token expired")

    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user = db.query(models.User).filter(models.User.id == rtoken.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(payload.new_password)
    rtoken.used = True
    db.commit()
    return {"message": "Password reset successfully"}
