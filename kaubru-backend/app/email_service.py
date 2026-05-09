"""
Email service — sends verification and password-reset emails.

If SMTP credentials are not configured the emails are printed to stdout
so development works without a mail server.
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import settings

logger = logging.getLogger(__name__)


def _send(to: str, subject: str, html: str) -> None:
    """Low-level send.  Falls back to console log if SMTP is not configured."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        # Dev mode — print directly to stdout so it always shows in the terminal
        print("\n" + "─" * 50)
        print(f"[DEV EMAIL] To:      {to}")
        print(f"[DEV EMAIL] Subject: {subject}")
        # Extract just the OTP from the HTML body for easy reading
        import re
        otp_match = re.search(r'letter-spacing:[^>]+>([^<]+)<', html)
        if otp_match:
            print(f"[DEV EMAIL] OTP CODE: {otp_match.group(1).strip()}")
        else:
            print(f"[DEV EMAIL] Body:\n{html}")
        print("─" * 50 + "\n")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, to, msg.as_string())
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to, exc)
        raise


# ─── Email templates ──────────────────────────────────────────────────────────

def send_verification_email(to: str, name: str, token: str) -> None:
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;
                background:#0A0A1A;color:#fff;border-radius:12px;">
      <h1 style="color:#00E5FF;margin-bottom:8px;">🌿 KauBru AI Translator</h1>
      <h2 style="font-weight:700;margin-bottom:16px;">Verify your email</h2>
      <p style="color:#a0a0c0;line-height:1.6;">
        Hi {name}, thanks for signing up! Click the button below to verify your
        email address. The link expires in <strong>24 hours</strong>.
      </p>
      <a href="{verify_url}"
         style="display:inline-block;margin-top:24px;padding:12px 28px;
                background:linear-gradient(90deg,#00E5FF,#7C3AED);
                color:#fff;font-weight:700;border-radius:8px;text-decoration:none;">
        Verify Email
      </a>
      <p style="color:#606080;font-size:12px;margin-top:24px;">
        Or copy this link:<br>
        <a href="{verify_url}" style="color:#00E5FF;">{verify_url}</a>
      </p>
      <p style="color:#606080;font-size:12px;margin-top:16px;">
        If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
    """
    _send(to, "Verify your KauBru account", html)


def send_otp_email(to: str, name: str, otp: str) -> None:
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;
                background:#0A0A1A;color:#fff;border-radius:12px;">
      <h1 style="color:#00E5FF;margin-bottom:8px;">🌿 KauBru AI Translator</h1>
      <h2 style="font-weight:700;margin-bottom:16px;">Verify your email</h2>
      <p style="color:#a0a0c0;line-height:1.6;">
        Hi {name}, here is your verification code:
      </p>
      <div style="text-align:center;margin:32px 0;">
        <span style="font-size:48px;font-weight:800;letter-spacing:12px;color:#00E5FF;">
          {otp}
        </span>
      </div>
      <p style="color:#a0a0c0;line-height:1.6;text-align:center;">
        This code expires in <strong>10 minutes</strong>.
      </p>
      <p style="color:#606080;font-size:12px;margin-top:24px;">
        If you didn't sign up for KauBru, you can safely ignore this email.
      </p>
    </div>
    """
    _send(to, "Your KauBru verification code", html)


def send_password_reset_email(to: str, name: str, token: str) -> None:
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;
                background:#0A0A1A;color:#fff;border-radius:12px;">
      <h1 style="color:#00E5FF;margin-bottom:8px;">🌿 KauBru AI Translator</h1>
      <h2 style="font-weight:700;margin-bottom:16px;">Reset your password</h2>
      <p style="color:#a0a0c0;line-height:1.6;">
        Hi {name}, we received a request to reset your password.
        Click the button below — the link expires in <strong>1 hour</strong>.
      </p>
      <a href="{reset_url}"
         style="display:inline-block;margin-top:24px;padding:12px 28px;
                background:linear-gradient(90deg,#00E5FF,#7C3AED);
                color:#fff;font-weight:700;border-radius:8px;text-decoration:none;">
        Reset Password
      </a>
      <p style="color:#606080;font-size:12px;margin-top:24px;">
        Or copy this link:<br>
        <a href="{reset_url}" style="color:#00E5FF;">{reset_url}</a>
      </p>
      <p style="color:#606080;font-size:12px;margin-top:16px;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
    """
    _send(to, "Reset your KauBru password", html)
