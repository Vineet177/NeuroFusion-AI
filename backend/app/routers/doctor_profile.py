import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, status, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.utils.security import get_current_user, get_password_hash, verify_password
from app.models.user import User
from app.schemas.doctor_profile import (
    DoctorProfileUpdate,
    DoctorProfileResponse,
    DoctorExperienceCreate,
    DoctorExperienceResponse,
    DoctorEducationCreate,
    DoctorEducationResponse,
    DoctorCertificationCreate,
    DoctorCertificationResponse,
    PasswordChangeRequest
)
from app.services.doctor_profile_service import DoctorProfileService

logger = logging.getLogger("neurofusion.profile_router")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/profile", tags=["Doctor Profile"])


@router.get("", response_model=DoctorProfileResponse, summary="Get Doctor Profile")
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve full doctor profile including personal, professional, hospital, experience, education, and certifications."""
    return await DoctorProfileService.get_full_profile_response(db, user=current_user)


@router.put("", response_model=DoctorProfileResponse, summary="Update Doctor Profile")
async def update_profile(
    profile_in: DoctorProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update doctor profile in MySQL database."""
    return await DoctorProfileService.update_profile(db, user=current_user, obj_in=profile_in)


@router.post("/photo", summary="Upload Doctor Profile Photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload and update circular profile photo in MySQL."""
    photo_url = await DoctorProfileService.upload_photo(db, user=current_user, file=file)
    return {"success": True, "profile_photo": photo_url, "message": "Profile photo updated successfully"}


@router.delete("/photo", summary="Remove Doctor Profile Photo")
async def remove_profile_photo(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove doctor profile photo and restore default initials avatar."""
    await DoctorProfileService.remove_photo(db, user=current_user)
    return {"success": True, "message": "Profile photo removed successfully"}


# ============================================================================
# Experience Endpoints
# ============================================================================

@router.post("/experience", response_model=DoctorExperienceResponse, status_code=status.HTTP_201_CREATED, summary="Add Professional Experience")
async def add_experience(
    exp_in: DoctorExperienceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await DoctorProfileService.add_experience(db, user=current_user, obj_in=exp_in)


@router.delete("/experience/{exp_id}", summary="Delete Professional Experience")
async def delete_experience(
    exp_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await DoctorProfileService.delete_experience(db, user=current_user, exp_id=exp_id)
    return {"success": True, "message": "Experience record deleted successfully"}


# ============================================================================
# Education Endpoints
# ============================================================================

@router.post("/education", response_model=DoctorEducationResponse, status_code=status.HTTP_201_CREATED, summary="Add Education Record")
async def add_education(
    edu_in: DoctorEducationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await DoctorProfileService.add_education(db, user=current_user, obj_in=edu_in)


@router.delete("/education/{edu_id}", summary="Delete Education Record")
async def delete_education(
    edu_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await DoctorProfileService.delete_education(db, user=current_user, edu_id=edu_id)
    return {"success": True, "message": "Education record deleted successfully"}


# ============================================================================
# Certification Endpoints
# ============================================================================

@router.post("/certifications", response_model=DoctorCertificationResponse, status_code=status.HTTP_201_CREATED, summary="Add Certification")
async def add_certification(
    cert_in: DoctorCertificationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await DoctorProfileService.add_certification(db, user=current_user, obj_in=cert_in)


@router.delete("/certifications/{cert_id}", summary="Delete Certification")
async def delete_certification(
    cert_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await DoctorProfileService.delete_certification(db, user=current_user, cert_id=cert_id)
    return {"success": True, "message": "Certification record deleted successfully"}


# ============================================================================
# Account & Security Endpoints
# ============================================================================

@router.post("/change-password", summary="Change Account Password")
async def change_password(
    pwd_in: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.password_hash or not verify_password(pwd_in.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    if len(pwd_in.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters."
        )

    current_user.password_hash = get_password_hash(pwd_in.new_password)
    await db.commit()
    return {"success": True, "message": "Password updated successfully in database."}
