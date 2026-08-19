from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.patient import PatientCreate, PatientResponse, PatientUpdate
from app.services.patient_service import PatientService
from app.utils.security import get_current_user, get_optional_current_user, require_admin, require_doctor_or_admin
from app.models.user import User

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED, summary="Create Patient")
async def create_patient(
    patient_in: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Create a new patient record in the database.
    """
    return await PatientService.create(db, obj_in=patient_in)


@router.get("", response_model=List[PatientResponse], summary="List Patients")
async def list_patients(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Retrieve list of patients with optional pagination."""
    return await PatientService.get_all(db, skip=skip, limit=limit)


@router.get("/{id}", response_model=PatientResponse, summary="Get Patient by ID")
async def get_patient(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Fetch specific patient record details by ID."""
    patient = await PatientService.get_by_id(db, patient_id=id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {id} not found."
        )
    return patient


@router.put("/{id}", response_model=PatientResponse, summary="Update Patient")
async def update_patient(
    id: int,
    patient_in: PatientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Update patient information by ID."""
    return await PatientService.update(db, patient_id=id, obj_in=patient_in)


@router.delete("/{id}", status_code=status.HTTP_200_OK, summary="Delete Patient")
async def delete_patient(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Delete a patient record by ID."""
    await PatientService.delete(db, patient_id=id)
    return {"message": f"Patient with ID {id} has been successfully deleted."}


@router.post("/batch-delete", summary="Batch Delete Patients (Admin Only)")
async def batch_delete_patients(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Batch delete multiple patient records by IDs."""
    patient_ids = payload.get("patient_ids", [])
    count = await PatientService.batch_delete(db, patient_ids=patient_ids)
    return {"success": True, "count": count, "message": f"{count} patient records deleted from MySQL."}


@router.post("/batch-assign-doctor", summary="Batch Assign Primary Doctor (Doctor or Admin)")
async def batch_assign_doctor(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """Batch assign primary attending doctor for selected patients."""
    patient_ids = payload.get("patient_ids", [])
    doctor_name = payload.get("doctor_name", "")
    count = await PatientService.batch_assign_doctor(db, patient_ids=patient_ids, doctor_name=doctor_name)
    return {"success": True, "count": count, "message": f"{count} patients assigned to {doctor_name}."}
