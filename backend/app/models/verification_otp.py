from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base


class VerificationOTP(Base):
    __tablename__ = "verification_otps"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_type: Mapped[str] = mapped_column(String(20), nullable=False) # 'email' or 'phone'
    otp_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    attempt_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<VerificationOTP(id={self.id}, user_id={self.user_id}, type='{self.contact_type}', verified={self.verified_at is not None})>"
