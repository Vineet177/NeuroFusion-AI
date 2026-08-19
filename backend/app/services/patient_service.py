import logging
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate

logger = logging.getLogger("neurofusion.patient_service")
logger.setLevel(logging.INFO)


class PatientService:
    @staticmethod
    async def get_by_id(db: AsyncSession, patient_id: int) -> Optional[Patient]:
        """Fetch patient record by primary key ID."""
        logger.info(f"Querying MySQL patient by ID: {patient_id}")
        result = await db.execute(select(Patient).where(Patient.id == patient_id))
        return result.scalars().first()

    @staticmethod
    async def get_all(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Patient]:
        """Retrieve paginated list of patient records."""
        logger.info(f"Querying patients list from MySQL (skip={skip}, limit={limit})")
        result = await db.execute(
            select(Patient)
            .order_by(Patient.id.desc())
            .offset(skip)
            .limit(limit)
        )
        patients = list(result.scalars().all())
        logger.info(f"Retrieved {len(patients)} patient record(s) from MySQL")
        return patients

    @staticmethod
    async def create(db: AsyncSession, obj_in: PatientCreate) -> Patient:
        """Create and persist a new patient record into MySQL."""
        logger.info(f"Attempting to insert patient into MySQL: '{obj_in.name}', Age: {obj_in.age}, Gender: '{obj_in.gender}', Phone: '{obj_in.phone}'")
        db_patient = Patient(
            name=obj_in.name,
            age=obj_in.age,
            gender=obj_in.gender,
            dob=obj_in.dob,
            phone=obj_in.phone,
            address=obj_in.address,
            medical_history=obj_in.medical_history
        )

        try:
            db.add(db_patient)
            await db.commit()
            await db.refresh(db_patient)
            logger.info(f"✅ Patient successfully persisted to MySQL table 'patients' with ID: {db_patient.id}")
            return db_patient
        except Exception as e:
            await db.rollback()
            logger.error(f"❌ Failed to insert patient into MySQL: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error during patient creation: {str(e)}"
            )

    @staticmethod
    async def update(db: AsyncSession, patient_id: int, obj_in: PatientUpdate) -> Patient:
        """Update existing patient details by ID."""
        patient = await PatientService.get_by_id(db, patient_id=patient_id)
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient with ID {patient_id} not found."
            )

        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(patient, field, value)

        db.add(patient)
        await db.commit()
        await db.refresh(patient)
        return patient

    @staticmethod
    async def delete(db: AsyncSession, patient_id: int) -> bool:
        """Delete patient record and associated medical files by ID."""
        patient = await PatientService.get_by_id(db, patient_id=patient_id)
        if not patient and patient_id >= 1000:
            patient = await PatientService.get_by_id(db, patient_id=patient_id - 1000)
            if patient:
                patient_id = patient.id

        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient with ID {patient_id} not found."
            )

        from app.models.medical_file import MedicalFile
        from sqlalchemy import delete
        await db.execute(delete(MedicalFile).where(MedicalFile.patient_id == patient_id))

        await db.delete(patient)
        await db.commit()
        logger.info(f"✅ Patient ID {patient_id} deleted successfully from MySQL.")
        return True

    @staticmethod
    async def batch_delete(db: AsyncSession, patient_ids: List[int]) -> int:
        """Batch delete multiple patients and their medical files from MySQL."""
        if not patient_ids:
            return 0
        from app.models.medical_file import MedicalFile
        from sqlalchemy import delete

        normalized_ids = set()
        for pid in patient_ids:
            normalized_ids.add(pid)
            if pid >= 1000:
                normalized_ids.add(pid - 1000)

        id_list = list(normalized_ids)
        await db.execute(delete(MedicalFile).where(MedicalFile.patient_id.in_(id_list)))
        stmt = delete(Patient).where(Patient.id.in_(id_list))
        result = await db.execute(stmt)
        await db.commit()
        logger.info(f"✅ Batch deleted {result.rowcount} patient records from MySQL.")
        return result.rowcount

    @staticmethod
    async def batch_assign_doctor(db: AsyncSession, patient_ids: List[int], doctor_name: str) -> int:
        """Batch assign a primary doctor to multiple patients."""
        if not patient_ids:
            return 0
        from sqlalchemy import update
        normalized_ids = set()
        for pid in patient_ids:
            normalized_ids.add(pid)
            if pid >= 1000:
                normalized_ids.add(pid - 1000)

        id_list = list(normalized_ids)
        stmt = update(Patient).where(Patient.id.in_(id_list)).values(primary_doctor=doctor_name)
        result = await db.execute(stmt)
        await db.commit()
        logger.info(f"✅ Batch assigned {result.rowcount} patients to doctor '{doctor_name}' in MySQL.")
        return result.rowcount
