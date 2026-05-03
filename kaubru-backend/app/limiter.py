"""
Shared SlowAPI rate limiter instance.
Import `limiter` and use @limiter.limit("N/minute") on route handlers.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
