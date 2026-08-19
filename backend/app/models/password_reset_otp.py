from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base


class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'email' or 'phone'
    contact_value: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    otp_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    attempt_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    reset_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    reset_token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<PasswordResetOTP(id={self.id}, user_id={self.user_id}, type='{self.contact_type}', used={self.is_used})>"
