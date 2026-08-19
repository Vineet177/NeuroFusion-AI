import os
import uuid
import logging
from typing import List, Optional, Set
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func

from app.models.medical_file import MedicalFile
from app.models.patient import Patient
from app.models.user import User
from app.schemas.medical_file import MedicalFileResponse, ClinicalUploadStatsResponse
from app.services.patient_service import PatientService

logger = logging.getLogger("neurofusion.medical_file_service")
logger.setLevel(logging.INFO)

# Root uploads directory relative to backend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")


class MedicalFileService:
    ALLOWED_MRI_EXTENSIONS: Set[str] = {".jpg", ".jpeg", ".png", ".dcm", ".dicom", ".nii", ".gz"}
    ALLOWED_EEG_EXTENSIONS: Set[str] = {".csv", ".edf", ".set", ".txt"}

    @staticmethod
    def _validate_extension(filename: str, allowed_extensions: Set[str]) -> str:
        lower_name = (filename or "").lower()
        if lower_name.endswith(".nii.gz"):
            return ".nii.gz"
        _, ext = os.path.splitext(lower_name)
        if ext not in allowed_extensions:
            allowed_str = ", ".join(sorted(allowed_extensions))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file extension '{ext}'. Allowed extensions: {allowed_str}"
            )
        return ext

    @staticmethod
    async def _save_file_to_disk(file: UploadFile, subfolder: str) -> tuple[str, int]:
        target_dir = os.path.join(UPLOADS_DIR, subfolder)
        os.makedirs(target_dir, exist_ok=True)

        original_filename = file.filename or "file"
        _, ext = os.path.splitext(original_filename.lower())
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        stored_path = os.path.join(target_dir, unique_filename)

        content = await file.read()
        file_size = len(content)

        with open(stored_path, "wb") as f:
            f.write(content)

        # Store relative path for portability
        relative_path = os.path.relpath(stored_path, BASE_DIR).replace("\\", "/")
        return relative_path, file_size

    @staticmethod
    def _to_response_schema(db_file: MedicalFile) -> MedicalFileResponse:
        """Convert MedicalFile ORM object to enriched MedicalFileResponse."""
        patient_name = db_file.patient.name if db_file.patient else f"Patient #{db_file.patient_id}"
        patient_code = f"NF-PAT-{db_file.patient_id:06d}"
        uploader_name = db_file.uploader.name if db_file.uploader else "Administrator"

        return MedicalFileResponse(
            id=db_file.id,
            patient_id=db_file.patient_id,
            filename=db_file.filename,
            file_path=db_file.file_path,
            file_type=db_file.file_type,
            file_size=db_file.file_size,
            upload_date=db_file.upload_date,
            uploaded_by=db_file.uploaded_by,
            uploaded_by_name=uploader_name,
            scan_type=db_file.scan_type or ("Structural MRI" if db_file.file_type == "mri" else "EEG Signal Recording"),
            recording_date=db_file.recording_date or db_file.upload_date.strftime("%Y-%m-%d"),
            notes=db_file.notes,
            processing_status=db_file.processing_status or "Analysis Complete",
            ml_status=db_file.ml_status or "ANALYSIS_COMPLETE",
            ml_results=db_file.ml_results,
            patient_name=patient_name,
            patient_code=patient_code
        )

    @staticmethod
    async def upload_mri(
        db: AsyncSession,
        patient_id: int,
        file: UploadFile,
        scan_type: Optional[str] = "Structural MRI",
        scan_date: Optional[str] = None,
        notes: Optional[str] = None,
        uploaded_by: Optional[int] = None
    ) -> MedicalFileResponse:
        """Process, validate, store MRI medical upload and create record in MySQL medical_files table."""
        logger.info(f"Processing Admin MRI upload for patient_id: {patient_id}, filename: '{file.filename}'")
        patient = await PatientService.get_by_id(db, patient_id=patient_id)
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient with ID {patient_id} does not exist in MySQL database."
            )

        MedicalFileService._validate_extension(file.filename or "", MedicalFileService.ALLOWED_MRI_EXTENSIONS)
        file_path, file_size = await MedicalFileService._save_file_to_disk(file, subfolder="mri")

        db_file = MedicalFile(
            patient_id=patient_id,
            uploaded_by=uploaded_by,
            filename=file.filename or "mri_scan.dcm",
            file_path=file_path,
            file_type="mri",
            file_size=file_size,
            scan_type=scan_type or "Structural MRI",
            recording_date=scan_date,
            notes=notes,
            processing_status="Analysis Complete",
            ml_status="ANALYSIS_COMPLETE"
        )
        try:
            db.add(db_file)
            await db.commit()
            await db.refresh(db_file)
            logger.info(f"✅ Admin MRI scan persisted into MySQL 'medical_files' table with ID: {db_file.id}")
            return MedicalFileService._to_response_schema(db_file)
        except Exception as e:
            await db.rollback()
            logger.error(f"❌ Failed to insert MRI scan into MySQL: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error saving MRI upload: {str(e)}"
            )

    @staticmethod
    async def upload_eeg(
        db: AsyncSession,
        patient_id: int,
        file: UploadFile,
        recording_type: Optional[str] = "EEG Recording",
        recording_date: Optional[str] = None,
        notes: Optional[str] = None,
        uploaded_by: Optional[int] = None
    ) -> MedicalFileResponse:
        """Process, validate, store EEG signal upload and create record in MySQL medical_files table."""
        logger.info(f"Processing Admin EEG upload for patient_id: {patient_id}, filename: '{file.filename}'")
        patient = await PatientService.get_by_id(db, patient_id=patient_id)
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient with ID {patient_id} does not exist in MySQL database."
            )

        MedicalFileService._validate_extension(file.filename or "", MedicalFileService.ALLOWED_EEG_EXTENSIONS)
        file_path, file_size = await MedicalFileService._save_file_to_disk(file, subfolder="eeg")

        db_file = MedicalFile(
            patient_id=patient_id,
            uploaded_by=uploaded_by,
            filename=file.filename or "eeg_record.edf",
            file_path=file_path,
            file_type="eeg",
            file_size=file_size,
            scan_type=recording_type or "EEG Recording",
            recording_date=recording_date,
            notes=notes,
            processing_status="Analysis Complete",
            ml_status="ANALYSIS_COMPLETE"
        )
        try:
            db.add(db_file)
            await db.commit()
            await db.refresh(db_file)
            logger.info(f"✅ Admin EEG record persisted into MySQL 'medical_files' table with ID: {db_file.id}")
            return MedicalFileService._to_response_schema(db_file)
        except Exception as e:
            await db.rollback()
            logger.error(f"❌ Failed to insert EEG record into MySQL: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error saving EEG upload: {str(e)}"
            )

    @staticmethod
    async def get_by_id(db: AsyncSession, file_id: int) -> Optional[MedicalFileResponse]:
        """Fetch medical file by primary key."""
        result = await db.execute(select(MedicalFile).where(MedicalFile.id == file_id))
        db_file = result.scalars().first()
        return MedicalFileService._to_response_schema(db_file) if db_file else None

    @staticmethod
    async def get_by_patient(db: AsyncSession, patient_id: int) -> List[MedicalFileResponse]:
        """Fetch all MRI & EEG files uploaded for a specific patient."""
        result = await db.execute(
            select(MedicalFile)
            .where(MedicalFile.patient_id == patient_id)
            .order_by(MedicalFile.upload_date.desc())
        )
        return [MedicalFileService._to_response_schema(f) for f in result.scalars().all()]

    @staticmethod
    async def get_all_medical_files(
        db: AsyncSession,
        file_type: Optional[str] = None,
        limit: int = 50
    ) -> List[MedicalFileResponse]:
        """Fetch recent clinical uploads across all patients for Admin dashboard."""
        stmt = select(MedicalFile)
        if file_type:
            stmt = stmt.where(MedicalFile.file_type == file_type)
        stmt = stmt.order_by(MedicalFile.upload_date.desc()).limit(limit)

        result = await db.execute(stmt)
        return [MedicalFileService._to_response_schema(f) for f in result.scalars().all()]

    @staticmethod
    async def get_clinical_upload_stats(db: AsyncSession) -> ClinicalUploadStatsResponse:
        """Calculate counts of MRI and EEG uploads and return recent items."""
        mri_res = await db.execute(select(func.count(MedicalFile.id)).where(MedicalFile.file_type == "mri"))
        total_mri = mri_res.scalar() or 0

        eeg_res = await db.execute(select(func.count(MedicalFile.id)).where(MedicalFile.file_type == "eeg"))
        total_eeg = eeg_res.scalar() or 0

        recent_files = await MedicalFileService.get_all_medical_files(db, limit=20)

        return ClinicalUploadStatsResponse(
            total_mri=total_mri,
            total_eeg=total_eeg,
            total_files=total_mri + total_eeg,
            recent_uploads=recent_files
        )

    @staticmethod
    async def create_record(
        db: AsyncSession,
        patient_id: int,
        filename: str,
        file_path: str,
        file_type: str,
        file_size: int = 0,
        uploaded_by: Optional[int] = None,
        scan_type: Optional[str] = None,
        processing_status: str = "Analysis Complete",
        ml_status: str = "completed",
        ml_results: Optional[str] = None
    ) -> MedicalFile:
        """Create a new medical file database record."""
        record = MedicalFile(
            patient_id=patient_id,
            uploaded_by=uploaded_by,
            filename=filename,
            file_path=file_path,
            file_type=file_type,
            file_size=file_size,
            scan_type=scan_type or ("Structural MRI" if file_type == "mri" else "EEG Signal Recording"),
            processing_status=processing_status,
            ml_status=ml_status,
            ml_results=ml_results
        )
        db.add(record)
        await db.commit()
        await db.refresh(record)
        return record

    @staticmethod
    async def delete_medical_file(db: AsyncSession, file_id: int) -> bool:
        """Admin deleting a medical file record from MySQL."""
        logger.info(f"Admin deleting medical file #{file_id} from MySQL database")
        stmt = delete(MedicalFile).where(MedicalFile.id == file_id)
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount > 0
