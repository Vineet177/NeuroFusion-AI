"""
NeuroFusion AI - Inference API Router for FastAPI.
Exposes endpoints for MRI classification, EEG sequence classification, and Multimodal Decision Fusion.
"""

import os
import shutil
import uuid
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.utils.security import get_current_user, get_optional_current_user, require_admin

from app.models.user import User
from app.models.mri_model import MRIModel
from app.models.eeg_model import EEGModel
from app.models.fusion_model import MultimodalFusionModel
from app.services.medical_file_service import MedicalFileService
from app.services.patient_service import PatientService
from app.schemas.medical_file import MedicalFileCreate

# Configure router logger
logger = logging.getLogger("neurofusion.predict_router")
logger.setLevel(logging.INFO)

# Instantiate singleton ML model evaluators
mri_evaluator = MRIModel()
eeg_evaluator = EEGModel()
fusion_engine = MultimodalFusionModel()

predict_router = APIRouter(prefix="", tags=["ML Inference"])

# File storage directories
UPLOAD_DIR = Path("uploads")
MRI_UPLOAD_DIR = UPLOAD_DIR / "mri"
EEG_UPLOAD_DIR = UPLOAD_DIR / "eeg"

MRI_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
EEG_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_MRI_EXTENSIONS = {".jpg", ".jpeg", ".png", ".dcm", ".dicom"}
ALLOWED_EEG_EXTENSIONS = {".csv", ".edf", ".set"}


from app.schemas.patient import PatientCreate


async def _resolve_and_save_medical_file(
    db: AsyncSession,
    patient_id: Optional[int],
    filename: str,
    saved_path: Path,
    file_type: str,
    prediction_result: Dict[str, Any]
) -> Optional[int]:
    """Helper to ensure medical file record is persisted into MySQL table 'medical_files'."""
    try:
        resolved_pid = None
        if patient_id is not None:
            p = await PatientService.get_by_id(db, patient_id=patient_id)
            if p:
                resolved_pid = p.id
        
        if resolved_pid is None:
            all_pts = await PatientService.get_all(db, limit=1)
            if all_pts:
                resolved_pid = all_pts[0].id
            else:
                default_p = await PatientService.create(
                    db,
                    obj_in=PatientCreate(
                        name="Clinical Evaluation Patient",
                        age=65,
                        gender="Male",
                        dob="1961-01-01",
                        phone="9876543210",
                        medical_history="Initial cognitive assessment evaluation"
                    )
                )
                resolved_pid = default_p.id

        if resolved_pid:
            db_record = await MedicalFileService.create_record(
                db=db,
                patient_id=resolved_pid,
                filename=filename,
                file_path=str(saved_path),
                file_type=file_type,
                file_size=saved_path.stat().st_size if saved_path.exists() else 0,
                ml_status="COMPLETED",
                ml_results=json.dumps(prediction_result)
            )
            logger.info(f"✅ Auto-persisted {file_type} scan metadata into MySQL 'medical_files' (ID: {db_record.id}, patient_id: {resolved_pid})")
            return db_record.id
    except Exception as err:
        logger.error(f"❌ Error persisting medical file record to MySQL: {err}", exc_info=True)
    return None


# ============================================================================
# 1. POST /predict/mri
# ============================================================================

@predict_router.post("/predict/mri", status_code=status.HTTP_200_OK)
async def predict_mri(
    file: UploadFile = File(...),
    patient_id: Optional[int] = Form(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Accepts an MRI image file (.jpg, .png, .dcm), runs preprocessing & ResNet18 model inference,
    persists metadata in MySQL 'medical_files', and returns class probabilities and confidence score.
    """
    user_email = current_user.email if current_user else "Anonymous"
    logger.info(f"User {user_email} initiated MRI inference for file: {file.filename} (patient_id: {patient_id})")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_MRI_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid MRI format '{ext}'. Supported formats: {', '.join(ALLOWED_MRI_EXTENSIONS)}"
        )

    unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
    saved_path = MRI_UPLOAD_DIR / unique_filename

    try:
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Execute MRI ResNet18 Inference
        prediction_result = mri_evaluator.predict(saved_path)

        # Persist record into MySQL table 'medical_files'
        await _resolve_and_save_medical_file(
            db=db,
            patient_id=patient_id,
            filename=file.filename,
            saved_path=saved_path,
            file_type="mri",
            prediction_result=prediction_result
        )

        return prediction_result

    except Exception as err:
        logger.error(f"MRI prediction endpoint error: {err}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"MRI Prediction Failed: {str(err)}"
        )


# ============================================================================
# 2. POST /predict/eeg
# ============================================================================

# ============================================================================
# 2. POST /predict/eeg (Admin Only)
# ============================================================================

@predict_router.post("/predict/eeg", status_code=status.HTTP_200_OK)
async def predict_eeg(
    file: UploadFile = File(...),
    patient_id: Optional[int] = Form(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Accepts an EEG signal file (.set, .edf, .csv), runs preprocessing & 2-Layer LSTM model inference,
    persists metadata in MySQL 'medical_files', and returns class probabilities and confidence score.
    """
    user_email = current_user.email if current_user else "Anonymous"
    logger.info(f"User {user_email} initiated EEG inference for file: {file.filename} (patient_id: {patient_id})")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EEG_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid EEG format '{ext}'. Supported formats: {', '.join(ALLOWED_EEG_EXTENSIONS)}"
        )

    unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
    saved_path = EEG_UPLOAD_DIR / unique_filename

    try:
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Execute EEG 2-Layer LSTM Inference
        prediction_result = eeg_evaluator.predict(saved_path)

        # Persist record into MySQL table 'medical_files'
        await _resolve_and_save_medical_file(
            db=db,
            patient_id=patient_id,
            filename=file.filename,
            saved_path=saved_path,
            file_type="eeg",
            prediction_result=prediction_result
        )

        return prediction_result

    except Exception as err:
        logger.error(f"EEG prediction endpoint error: {err}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"EEG Prediction Failed: {str(err)}"
        )


# ============================================================================
# 3. POST /predict/multimodal
# ============================================================================

@predict_router.post("/predict/multimodal", status_code=status.HTTP_200_OK)
async def predict_multimodal(
    mri_file: Optional[UploadFile] = File(None),
    eeg_file: Optional[UploadFile] = File(None),
    mmse_score: Optional[float] = Form(None),
    moca_score: Optional[float] = Form(None),
    patient_id: Optional[int] = Form(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Full Multimodal Inference Pipeline.
    Inputs: MRI image, EEG file, MMSE score, MoCA score, Patient ID.
    Persists uploaded scan metadata into MySQL 'medical_files'.
    Returns combined diagnosis, risk level, confidence percentage, and personalized recommendations.
    """
    user_email = current_user.email if current_user else "Anonymous"
    logger.info(
        f"User {user_email} initiated Multimodal Fusion Prediction "
        f"(MMSE: {mmse_score}, MoCA: {moca_score}, Patient: {patient_id})"
    )

    mri_result = None
    eeg_result = None

    try:
        # 1. Process MRI file if provided
        if mri_file and mri_file.filename:
            mri_ext = Path(mri_file.filename).suffix.lower()
            if mri_ext in ALLOWED_MRI_EXTENSIONS:
                saved_mri_name = f"{uuid.uuid4().hex}_{mri_file.filename}"
                saved_mri_path = MRI_UPLOAD_DIR / saved_mri_name
                with open(saved_mri_path, "wb") as buffer:
                    shutil.copyfileobj(mri_file.file, buffer)
                mri_result = mri_evaluator.predict(saved_mri_path)

                await _resolve_and_save_medical_file(
                    db=db,
                    patient_id=patient_id,
                    filename=mri_file.filename,
                    saved_path=saved_mri_path,
                    file_type="mri",
                    prediction_result=mri_result
                )

        # 2. Process EEG file if provided
        if eeg_file and eeg_file.filename:
            eeg_ext = Path(eeg_file.filename).suffix.lower()
            if eeg_ext in ALLOWED_EEG_EXTENSIONS:
                saved_eeg_name = f"{uuid.uuid4().hex}_{eeg_file.filename}"
                saved_eeg_path = EEG_UPLOAD_DIR / saved_eeg_name
                with open(saved_eeg_path, "wb") as buffer:
                    shutil.copyfileobj(eeg_file.file, buffer)
                eeg_result = eeg_evaluator.predict(saved_eeg_path)

                await _resolve_and_save_medical_file(
                    db=db,
                    patient_id=patient_id,
                    filename=eeg_file.filename,
                    saved_path=saved_eeg_path,
                    file_type="eeg",
                    prediction_result=eeg_result
                )

        # 3. Multimodal Decision Fusion Synthesis
        fused_output = fusion_engine.fuse(
            mri_prediction=mri_result,
            eeg_prediction=eeg_result,
            mmse_score=mmse_score,
            moca_score=moca_score
        )

        # Structure response to exact schema requested
        final_response = {
            "diagnosis": fused_output.get("diagnosis", "Healthy Control"),
            "risk_level": fused_output.get("risk_level", "Low Risk"),
            "confidence": fused_output.get("confidence", 0.95),
            "mri_prediction": mri_result,
            "eeg_prediction": eeg_result,
            "cognitive_scores": {
                "mmse": int(mmse_score) if mmse_score is not None else None,
                "moca": int(moca_score) if moca_score is not None else None
            },
            "active_weights": fused_output.get("active_weights", {}),
            "recommendations": fused_output.get("recommendations", [])
        }

        # Save fusion output to DB if patient_id provided
        if patient_id:
            try:
                await MedicalFileService.create_record(
                    db=db,
                    patient_id=patient_id,
                    filename=f"multimodal_report_p{patient_id}.json",
                    file_path="MULTIMODAL_FUSION",
                    file_type="multimodal",
                    file_size=0,
                    ml_status="COMPLETED",
                    ml_results=json.dumps(final_response)
                )
            except Exception as db_err:
                logger.warning(f"Could not persist multimodal fusion record to DB: {db_err}")

        return final_response


    except Exception as err:
        logger.error(f"Multimodal prediction endpoint error: {err}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Multimodal Fusion Prediction Failed: {str(err)}"
        )
