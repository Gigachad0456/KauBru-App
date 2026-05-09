"""
Email service — sends OTP and verification emails.

Uses Resend API (HTTPS) when RESEND_API_KEY is set — works on Render free tier.
Falls back to SMTP (Gmail) if SMTP credentials are set.
Falls back to console log in dev mode if neither is configured.
"""

import logging
import httpx
from app.config import settings

logger = logging.getLogger(__name__)


def _send_via_resend(to: str, subject: str, html: str) -> None:
    """Send email via Resend HTTPS API — works on Render free tier."""
    import os
    api_key = os.getenv("RESEND_API_KEY", "")
    if not api_key:
        raise ValueError("RESEND_API_KEY not set")

    # Use the email you signed up to Resend with as the from address
    # Until you verify a domain, Resend only allows sending FROM onboarding@resend.dev
    # AND only TO the email you registered with.
    # Set RESEND_FROM in Render env vars to your Resend signup email.
    from_addr = os.getenv("RESEND_FROM", "onboarding@resend.dev")

    # If no custom domain, Resend test mode only sends to verified addresses.
    # Override the recipient to the Resend account email for testing.
    resend_test_email = os.getenv("RESEND_TEST_EMAIL", "")
    actual_to = resend_test_email if resend_test_email else to

    response = httpx.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "from": from_addr,
            "to": [actual_to],
            "subject": subject,
            "html": html,
        },
        timeout=15.0,
    )
    response.raise_for_status()
    if resend_test_email and resend_test_email != to:
        print(f"[RESEND] Email for {to} redirected to test address {resend_test_email}")


def _send_via_smtp(to: str, subject: str, html: str) -> None:
    """Send email via SMTP (Gmail). May be blocked on Render free tier."""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.EMAIL_FROM, to, msg.as_string())


def _send(to: str, subject: str, html: str) -> None:
    """Send email — tries Resend first, then SMTP, then logs to console."""
    import os
    resend_key = os.getenv("RESEND_API_KEY", "")
    smtp_ready = bool(settings.SMTP_USER and settings.SMTP_PASSWORD)

    if resend_key:
        try:
            _send_via_resend(to, subject, html)
            logger.info(f"Email sent via Resend to {to}")
            return
        except Exception as exc:
            logger.error(f"Resend failed: {exc}")
            # Log OTP to console as fallback so it's visible in Render logs
            import re
            otp_match = re.search(r'letter-spacing:[^>]+>([^<]+)<', html)
            if otp_match:
                print(f"\n[EMAIL FALLBACK] To: {to} | OTP: {otp_match.group(1).strip()}\n")
            # Don't raise — let signup succeed even if email fails

    if smtp_ready:
        try:
            _send_via_smtp(to, subject, html)
            logger.info(f"Email sent via SMTP to {to}")
            return
        except Exception as exc:
            logger.error(f"SMTP failed for {to}: {exc}")
            # Log OTP as fallback so it's visible in Render logs
            import re
            otp_match = re.search(r'letter-spacing:[^>]+>([^<]+)<', html)
            if otp_match:
                print(f"\n[EMAIL FALLBACK] To: {to} | OTP: {otp_match.group(1).strip()}\n")
            # Don't raise — let signup succeed even if email fails

    # Dev fallback — print OTP to console
    import re
    print("\n" + "-" * 50)
    print(f"[DEV EMAIL] To:      {to}")
    print(f"[DEV EMAIL] Subject: {subject}")
    otp_match = re.search(r'letter-spacing:[^>]+>([^<]+)<', html)
    if otp_match:
        print(f"[DEV EMAIL] OTP CODE: {otp_match.group(1).strip()}")
    else:
        print(f"[DEV EMAIL] Body (truncated): {html[:200]}")
    print("-" * 50 + "\n")


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
