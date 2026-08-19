import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query, Path, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.utils.security import get_current_user
from app.models.user import User
from app.models.doctor_profile import DoctorProfile
from app.schemas.doctor_profile import (
    AvailableDoctorsResponse,
    UpdateAvailabilityRequest,
    DoctorProfileResponse
)
from app.services.doctor_profile_service import DoctorProfileService

logger = logging.getLogger("neurofusion.admin_doctors")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/admin/doctors", tags=["Admin Doctor Directory"])


@router.get("/available", response_model=AvailableDoctorsResponse, summary="Get Available Doctors Directory")
async def get_available_doctors(
    specialization: Optional[str] = Query(None, description="Filter by doctor specialization or clinical expertise"),
    availability: Optional[str] = Query(None, description="Filter by status: Available, Busy, Offline, On Leave"),
    search: Optional[str] = Query(None, description="Search by doctor name, email, specialty, hospital"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve list of registered medical doctors with live availability status and specialty summaries."""
    return await DoctorProfileService.get_available_doctors(
        db=db,
        specialization=specialization,
        availability=availability,
        search=search
    )


@router.put("/{doctor_id}/availability", summary="Update Doctor Availability Status")
async def update_doctor_availability(
    req: UpdateAvailabilityRequest,
    doctor_id: int = Path(..., description="Doctor Profile ID or User ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Admin or doctor updating doctor availability (Available, Busy, Offline, On Leave)."""
    valid_statuses = {"Available", "Busy", "Offline", "On Leave"}
    if req.availability_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid availability status '{req.availability_status}'. Allowed: {', '.join(valid_statuses)}"
        )

    await DoctorProfileService.update_availability_status(db, doctor_id, req.availability_status)
    return {"success": True, "message": f"Doctor availability updated to '{req.availability_status}' in database."}


@router.get("/{doctor_id}", response_model=DoctorProfileResponse, summary="Get Full Doctor Details")
async def get_doctor_details(
    doctor_id: int = Path(..., description="Doctor Profile ID or User ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve complete clinical profile of a specific doctor."""
    stmt = select(DoctorProfile).where((DoctorProfile.id == doctor_id) | (DoctorProfile.user_id == doctor_id))
    res = await db.execute(stmt)
    prof = res.scalars().first()
    if not prof:
        raise HTTPException(status_code=404, detail="Doctor not found")

    u_res = await db.execute(select(User).where(User.id == prof.user_id))
    u = u_res.scalars().first()
    if not u:
        raise HTTPException(status_code=404, detail="User account not found")

    return await DoctorProfileService.get_full_profile_response(db, u)


@router.delete("/{doctor_id}", summary="Delete / Remove Doctor from System")
async def delete_doctor(
    doctor_id: int = Path(..., description="Doctor Profile ID or User ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Admin removing a doctor account and clinical profile from MySQL."""
    if str(current_user.role).strip().lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can remove doctor accounts."
        )

    await DoctorProfileService.delete_doctor(db, doctor_id)
    return {"success": True, "message": "Doctor account and profile removed successfully."}
