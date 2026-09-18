import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime


def generate_uuid() -> str:
    return str(uuid.uuid4())


class TimestampMixin:
    """Provides automatic created_at and updated_at timestamps."""

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
