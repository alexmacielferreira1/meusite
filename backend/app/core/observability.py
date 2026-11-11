import logging
import re
from uuid import uuid4

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

VALID_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$")
logger = logging.getLogger("meusite.operations")


class CorrelationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        incoming = request.headers.get("X-Correlation-ID", "")
        correlation = incoming if VALID_ID.fullmatch(incoming) else uuid4().hex
        request.state.correlation_id = correlation
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation
        response.headers["X-Request-ID"] = correlation
        return response


def error_payload(request, code, message, retryable=False):
    correlation = getattr(request.state, "correlation_id", uuid4().hex)
    return {
        "detail": message,
        "error": {
            "code": code,
            "message": message,
            "reference": correlation,
            "correlation_id": correlation,
            "retryable": retryable,
        },
    }
