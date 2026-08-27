import threading
import time
from collections import deque

from fastapi import Request

from app.core.errors import AppError

_buckets: dict[str, deque[float]] = {}
_lock = threading.Lock()


def rate_limit(times: int, window_seconds: float):
    def dependency(request: Request) -> None:
        key = request.client.host if request.client else "anonymous"
        now = time.monotonic()
        with _lock:
            bucket = _buckets.setdefault(key, deque())
            while bucket and bucket[0] <= now - window_seconds:
                bucket.popleft()
            if len(bucket) >= times:
                raise AppError(429, "Too many attempts. Please wait a moment and try again.")
            bucket.append(now)

    return dependency
