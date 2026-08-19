from typing import List, Optional

from fastapi import APIRouter, Depends, status, Form, File, UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.medical_file import MedicalFileResponse, ClinicalUploadStatsResponse
from app.services.medical_file_service import MedicalFileService
from app.utils.security import get_current_user, require_admin, require_doctor_or_admin
from app.models.user import User

router = APIRouter(prefix="/upload", tags=["Medical File Uploads & Clinical Management"])


@router.post("/mri", response_model=MedicalFileResponse, status_code=status.HTTP_201_CREATED, summary="Upload MRI Scan (Admin Only)")
async def upload_mri(
    patient_id: int = Form(..., description="ID of the patient linked to this MRI scan"),
    file: UploadFile = File(..., description="MRI scan file (.dcm, .dicom, .nii, .jpg, .png)"),
    scan_type: Optional[str] = Form("Structural MRI", description="MRI scan type (e.g. Structural MRI, T1-weighted, T2-weighted, FLAIR)"),
    scan_date: Optional[str] = Form(None, description="Scan acquisition date (YYYY-MM-DD)"),
    notes: Optional[str] = Form(None, description="Clinical notes or acquisition parameters"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Admin uploads an MRI brain image scan. Doctors are forbidden from uploading.
    """
    return await MedicalFileService.upload_mri(
        db=db,
        patient_id=patient_id,
        file=file,
        scan_type=scan_type,
        scan_date=scan_date,
        notes=notes,
        uploaded_by=current_user.id
    )


@router.post("/eeg", response_model=MedicalFileResponse, status_code=status.HTTP_201_CREATED, summary="Upload EEG Signal (Admin Only)")
async def upload_eeg(
    patient_id: int = Form(..., description="ID of the patient linked to this EEG recording"),
    file: UploadFile = File(..., description="EEG signal recording data file (.edf, .set, .csv)"),
    recording_type: Optional[str] = Form("EEG Signal Recording", description="Type of EEG acquisition (e.g. 10-20 Scalp EEG, Resting State, Event-Related)"),
    recording_date: Optional[str] = Form(None, description="Recording date (YYYY-MM-DD)"),
    notes: Optional[str] = Form(None, description="Electrode montage or sampling rate notes"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Admin uploads an EEG signal recording. Doctors are forbidden from uploading.
    """
    return await MedicalFileService.upload_eeg(
        db=db,
        patient_id=patient_id,
        file=file,
        recording_type=recording_type,
        recording_date=recording_date,
        notes=notes,
        uploaded_by=current_user.id
    )


@router.get("/stats", response_model=ClinicalUploadStatsResponse, summary="Get Clinical Upload Statistics & Recent Scans (Admin)")
async def get_clinical_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """Retrieve total MRI and EEG counts plus recent uploads list from MySQL."""
    return await MedicalFileService.get_clinical_upload_stats(db)


@router.get("/recent", response_model=List[MedicalFileResponse], summary="List Recent Medical Uploads")
async def get_recent_uploads(
    file_type: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """Retrieve list of recent medical files across patients."""
    return await MedicalFileService.get_all_medical_files(db, file_type=file_type, limit=limit)


@router.get("/files/{id}", response_model=MedicalFileResponse, summary="Get Medical Upload Metadata by ID")
async def get_medical_file(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """Retrieve file metadata, storage location, and processing status by file ID."""
    medical_file = await MedicalFileService.get_by_id(db, file_id=id)
    if not medical_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medical file record with ID {id} not found in MySQL database."
        )
    return medical_file


@router.get("/patient/{patient_id}", response_model=List[MedicalFileResponse], summary="List Medical Files by Patient ID")
async def get_patient_medical_files(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """Retrieve all uploaded MRI and EEG file records for a specific patient."""
    return await MedicalFileService.get_by_patient(db, patient_id=patient_id)


@router.delete("/files/{id}", summary="Delete Medical File (Admin Only)")
async def delete_medical_file(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin deleting a medical file record from MySQL."""
    deleted = await MedicalFileService.delete_medical_file(db, file_id=id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medical file with ID {id} not found."
        )
    return {"success": True, "message": f"Medical file #{id} deleted successfully from MySQL."}
