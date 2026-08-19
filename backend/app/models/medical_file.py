from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class MedicalFile(Base):
    __tablename__ = "medical_files"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True, nullable=False)
    uploaded_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "mri" or "eeg"
    file_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    scan_type: Mapped[Optional[str]] = mapped_column(String(100), default="Structural MRI", nullable=True)
    recording_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    upload_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    processing_status: Mapped[str] = mapped_column(String(50), default="Analysis Complete", nullable=False)
    ml_status: Mapped[str] = mapped_column(String(50), default="ANALYSIS_COMPLETE", nullable=False)
    ml_results: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    patient = relationship("Patient", backref="medical_files", lazy="joined")
    uploader = relationship("User", backref="uploaded_files", lazy="joined")

    def __repr__(self) -> str:
        return f"<MedicalFile(id={self.id}, patient_id={self.patient_id}, filename='{self.filename}', type='{self.file_type}')>"
