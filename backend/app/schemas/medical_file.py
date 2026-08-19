from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class MedicalFileBase(BaseModel):
    patient_id: int = Field(..., description="ID of the patient linked to this file")
    filename: str = Field(..., description="Original filename of the upload")
    file_type: str = Field(..., description="Type of medical file (mri or eeg)")


class MedicalFileCreate(MedicalFileBase):
    file_path: str
    file_size: int = 0
    scan_type: Optional[str] = "Structural MRI"
    recording_date: Optional[str] = None
    notes: Optional[str] = None
    processing_status: Optional[str] = "Analysis Complete"
    ml_status: Optional[str] = "ANALYSIS_COMPLETE"
    ml_results: Optional[str] = None


class MedicalFileResponse(MedicalFileBase):
    id: int
    file_path: str
    file_size: int
    upload_date: datetime
    uploaded_by: Optional[int] = None
    uploaded_by_name: Optional[str] = "Admin"
    scan_type: Optional[str] = "Structural MRI"
    recording_date: Optional[str] = None
    notes: Optional[str] = None
    processing_status: str = "Analysis Complete"
    ml_status: str = "ANALYSIS_COMPLETE"
    ml_results: Optional[str] = None
    patient_name: Optional[str] = None
    patient_code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ClinicalUploadStatsResponse(BaseModel):
    total_mri: int = 0
    total_eeg: int = 0
    total_files: int = 0
    recent_uploads: List[MedicalFileResponse] = []
