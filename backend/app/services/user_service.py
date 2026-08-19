import logging
from datetime import datetime
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.user import User
from app.models.doctor_profile import DoctorProfile
from app.schemas.user import UserCreate, UserUpdate
from app.utils.security import get_password_hash

logger = logging.getLogger("neurofusion.user_service")
logger.setLevel(logging.INFO)


class UserService:
    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        logger.info(f"Querying MySQL user by ID: {user_id}")
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        logger.info(f"Querying MySQL user by email: {email}")
        result = await db.execute(select(User).where(User.email == email.strip().lower()))
        return result.scalars().first()

    @staticmethod
    async def get_by_phone(db: AsyncSession, phone: str) -> Optional[User]:
        logger.info(f"Querying MySQL user by phone: {phone}")
        result = await db.execute(select(User).where(User.phone == phone.strip()))
        return result.scalars().first()

    @staticmethod
    async def get_all(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[User]:
        logger.info(f"Querying all users from MySQL (skip={skip}, limit={limit})")
        result = await db.execute(select(User).offset(skip).limit(limit))
        return list(result.scalars().all())

    @staticmethod
    async def create(db: AsyncSession, obj_in: UserCreate) -> User:
        logger.info(f"Attempting to register Doctor in MySQL: {obj_in.email} (name: '{obj_in.name}')")
        
        # 1. Check duplicate email
        normalized_email = obj_in.email.strip().lower()
        existing_email = await UserService.get_by_email(db, email=normalized_email)
        if existing_email:
            logger.warning(f"Registration failed: User with email '{normalized_email}' already exists in MySQL.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email is already registered."
            )

        # 2. Check duplicate phone
        if obj_in.phone:
            existing_phone = await UserService.get_by_phone(db, phone=obj_in.phone)
            if existing_phone:
                logger.warning(f"Registration failed: User with phone '{obj_in.phone}' already exists in MySQL.")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This phone number is already registered."
                )

        # 3. Force role to 'Doctor' (Never trust frontend to register as Admin)
        enforced_role = "Doctor"

        db_user = User(
            name=obj_in.name.strip(),
            email=normalized_email,
            phone=obj_in.phone.strip() if obj_in.phone else None,
            gender=obj_in.gender.strip() if obj_in.gender else None,
            password_hash=get_password_hash(obj_in.password),
            role=enforced_role,
            is_active=True,
            is_superuser=False,
            email_verified=False,
            phone_verified=False
        )

        try:
            db.add(db_user)
            await db.commit()
            await db.refresh(db_user)
            logger.info(f"✅ Doctor user successfully persisted to MySQL table 'users' with ID: {db_user.id}")

            # 4. Automatically create corresponding DoctorProfile in doctor_profiles table
            doctor_profile = DoctorProfile(
                user_id=db_user.id,
                full_name=db_user.name,
                gender=db_user.gender,
                phone=db_user.phone,
                specialization="Clinical Neurology",
                sub_specialization="Cognitive Disorders & Dementia",
                professional_title="Attending Neurologist",
                hospital_name="NeuroFusion Clinical & Cognitive Medical Center",
                medical_degree="MD in Neurology",
                years_experience=5,
                availability_status="Available",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(doctor_profile)
            await db.commit()
            logger.info(f"✅ DoctorProfile created in MySQL for user ID: {db_user.id}")

            return db_user
        except HTTPException:
            await db.rollback()
            raise
        except Exception as e:
            await db.rollback()
            logger.error(f"❌ Failed to insert user into MySQL: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error during user registration: {str(e)}"
            )

    @staticmethod
    async def update(db: AsyncSession, user_id: int, obj_in: UserUpdate) -> User:
        user = await UserService.get_by_id(db, user_id=user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        update_data = obj_in.model_dump(exclude_unset=True)
        if "password" in update_data and update_data["password"]:
            update_data["password_hash"] = get_password_hash(update_data.pop("password"))

        for field, value in update_data.items():
            setattr(user, field, value)

        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
