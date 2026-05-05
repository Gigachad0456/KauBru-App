"""
Shared SlowAPI rate limiter instance.
Import `limiter` and use @limiter.limit("N/minute") on route handlers.

On Railway (and other reverse proxies), the real client IP is in the
X-Forwarded-For header. We use a custom key function to read it so that
rate limits are applied per real user, not per proxy IP.
"""

from fastapi import Request
from slowapi import Limiter


def get_real_ip(request: Request) -> str:
    """
    Extract the real client IP from X-Forwarded-For (set by Railway/nginx proxy).
    Falls back to the direct connection IP if the header is absent.
    """
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Header can be a comma-separated list; the first entry is the real client
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


limiter = Limiter(key_func=get_real_ip, default_limits=["60/minute"])
