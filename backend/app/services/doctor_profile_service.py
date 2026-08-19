import os
import json
import uuid
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from fastapi import UploadFile, HTTPException, status

from app.models.doctor_profile import DoctorProfile, DoctorExperience, DoctorEducation, DoctorCertification
from app.models.user import User
from app.schemas.doctor_profile import (
    DoctorProfileUpdate,
    DoctorProfileResponse,
    DoctorExperienceResponse,
    DoctorEducationResponse,
    DoctorCertificationResponse,
    DoctorExperienceCreate,
    DoctorExperienceUpdate,
    DoctorEducationCreate,
    DoctorEducationUpdate,
    DoctorCertificationCreate,
    DoctorCertificationUpdate,
    AvailableDoctorsResponse,
    AvailableDoctorItem,
    DoctorAvailabilityStats
)

logger = logging.getLogger("neurofusion.doctor_profile_service")
logger.setLevel(logging.INFO)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
AVATAR_DIR = BASE_DIR / "uploads" / "avatars"
AVATAR_DIR.mkdir(parents=True, exist_ok=True)


class DoctorProfileService:
    @staticmethod
    async def get_or_create_profile(db: AsyncSession, user: User) -> DoctorProfile:
        """Fetch doctor profile from MySQL or create baseline profile for the user."""
        logger.info(f"Fetching doctor profile for user ID: {user.id} ({user.email})")
        result = await db.execute(select(DoctorProfile).where(DoctorProfile.user_id == user.id))
        profile = result.scalars().first()

        if not profile:
            logger.info(f"Creating initial MySQL doctor_profiles record for user {user.id}")
            profile = DoctorProfile(
                user_id=user.id,
                full_name=user.name,
                preferred_name=user.name,
                gender="Male" if "dr" in user.name.lower() else "Female",
                phone="9876543210",
                specialization="Neurology",
                sub_specialization="Cognitive & Behavioral Neurology",
                professional_title="Attending Neurologist",
                medical_degree="MBBS, MD (Neurology)",
                additional_qualifications="DM (Neurology), Fellowship in Cognitive Neurology",
                university="All India Institute of Medical Sciences (AIIMS)",
                graduation_year="2016",
                years_experience=8,
                hospital_name="NeuroFusion Clinical & Cognitive Medical Center",
                department="Department of Neurology & Neuroimaging",
                designation="Senior Consultant Neurologist",
                medical_license_number=f"MCI-NEURO-{user.id + 84900}",
                medical_council="Medical Council of India (MCI)",
                license_expiry="2029-12-31",
                hospital_phone="+91 80 2849 5500",
                hospital_email="neurology.clinical@neurofusion.org",
                consultation_room="OPD Room 304 (Neuro Wing)",
                bio=f"Dr. {user.name} is a board-certified neurologist specializing in cognitive disorders, early-stage dementia diagnosis, and advanced multimodal neuroimaging assessment.",
                clinical_expertise=json.dumps([
                    "Dementia",
                    "Alzheimer's Disease",
                    "EEG Analysis",
                    "MRI Analysis",
                    "Neurodegenerative Disorders",
                    "Cognitive Disorders"
                ])
            )
            db.add(profile)
            await db.commit()
            await db.refresh(profile)

            # Also seed default baseline experience, education, and certification
            exp = DoctorExperience(
                user_id=user.id,
                organization="NeuroFusion Institute of Neurosciences",
                position="Senior Attending Neurologist",
                department="Department of Clinical Neurology",
                start_date="2020-01",
                currently_working=True,
                description="Lead clinical investigations into early neurodegenerative markers and computerized EEG/MRI multimodal triage."
            )
            edu1 = DoctorEducation(
                user_id=user.id,
                degree="MD in Neurology",
                specialization="Clinical & Cognitive Neurosciences",
                institution="All India Institute of Medical Sciences (AIIMS)",
                start_year="2013",
                graduation_year="2016",
                grade="First Class with Distinction"
            )
            edu2 = DoctorEducation(
                user_id=user.id,
                degree="Bachelor of Medicine & Surgery (MBBS)",
                specialization="Medicine",
                institution="King George's Medical University",
                start_year="2007",
                graduation_year="2012",
                grade="Honors"
            )
            cert = DoctorCertification(
                user_id=user.id,
                certification_name="Board Certified Clinical Neurologist",
                issuing_organization="National Board of Medical Examiners",
                certificate_number=f"NBME-{user.id + 42000}",
                issue_date="2017-04",
                expiry_date="2027-04",
                verification_status="Verified"
            )
            db.add_all([exp, edu1, edu2, cert])
            await db.commit()

        return profile

    @staticmethod
    async def get_full_profile_response(db: AsyncSession, user: User) -> DoctorProfileResponse:
        """Return aggregated profile response with related experiences, educations, and certifications."""
        profile = await DoctorProfileService.get_or_create_profile(db, user)
        
        # Query experiences
        exp_res = await db.execute(select(DoctorExperience).where(DoctorExperience.user_id == user.id).order_by(DoctorExperience.id.desc()))
        experiences = list(exp_res.scalars().all())

        # Query educations
        edu_res = await db.execute(select(DoctorEducation).where(DoctorEducation.user_id == user.id).order_by(DoctorEducation.graduation_year.desc()))
        educations = list(edu_res.scalars().all())

        # Query certifications
        cert_res = await db.execute(select(DoctorCertification).where(DoctorCertification.user_id == user.id).order_by(DoctorCertification.id.desc()))
        certifications = list(cert_res.scalars().all())

        # Parse clinical expertise
        expertise_list = []
        if profile.clinical_expertise:
            try:
                expertise_list = json.loads(profile.clinical_expertise)
            except Exception:
                expertise_list = [profile.clinical_expertise]

        user_role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
        is_admin_user = str(user_role_str).lower() == "admin"

        return DoctorProfileResponse(
            id=profile.id,
            user_id=user.id,
            doctor_id=f"NF-ADM-{user.id:06d}" if is_admin_user else f"NF-DOC-{user.id:06d}",
            email=user.email,
            role=user_role_str,
            is_active=user.is_active,
            profile_photo=profile.profile_photo or (user.picture if hasattr(user, 'picture') else None),
            full_name=profile.full_name or user.name,
            preferred_name=profile.preferred_name or user.name,
            gender=profile.gender or "Male",
            date_of_birth=profile.date_of_birth,
            phone=profile.phone or "9876543210",
            alternate_phone=profile.alternate_phone,
            address=profile.address,
            city=profile.city or "Bangalore",
            state=profile.state or "Karnataka",
            country=profile.country or "India",
            pincode=profile.pincode,
            specialization=profile.specialization or ("Platform Operations & AI Core" if is_admin_user else "Neurology"),
            sub_specialization=profile.sub_specialization or ("Infrastructure & Security" if is_admin_user else "Cognitive & Behavioral Neurology"),
            professional_title=profile.professional_title or ("System Administrator" if is_admin_user else "Attending Neurologist"),
            medical_degree=profile.medical_degree or ("B.Tech / M.S. Health Informatics" if is_admin_user else "MBBS, MD (Neurology)"),
            additional_qualifications=profile.additional_qualifications,
            university=profile.university,
            graduation_year=profile.graduation_year,
            years_experience=profile.years_experience or 0,
            hospital_name=profile.hospital_name or "NeuroFusion Clinical & Cognitive Medical Center",
            department=profile.department or ("System Operations & Neural AI Infrastructure" if is_admin_user else "Department of Neurology & Neuroimaging"),
            designation=profile.designation or ("Lead AI & System Administrator" if is_admin_user else "Senior Consultant Neurologist"),
            medical_license_number=profile.medical_license_number,
            medical_council=profile.medical_council,
            license_expiry=profile.license_expiry,
            hospital_address=profile.hospital_address,
            hospital_city=profile.hospital_city,
            hospital_state=profile.hospital_state,
            hospital_country=profile.hospital_country or "India",
            hospital_phone=profile.hospital_phone,
            hospital_email=profile.hospital_email,
            consultation_room=profile.consultation_room or ("Admin Suite 101" if is_admin_user else "OPD Room 304"),
            bio=profile.bio or f"{user.name} is an authorized system administrator of the NeuroFusion AI clinical core platform.",
            clinical_expertise=expertise_list,
            created_at=profile.created_at,
            updated_at=profile.updated_at,
            experiences=[DoctorExperienceResponse.model_validate(exp) for exp in experiences],
            educations=[DoctorEducationResponse.model_validate(edu) for edu in educations],
            certifications=[DoctorCertificationResponse.model_validate(cert) for cert in certifications]
        )

    @staticmethod
    async def update_profile(db: AsyncSession, user: User, obj_in: DoctorProfileUpdate) -> DoctorProfileResponse:
        """Update doctor profile in MySQL."""
        logger.info(f"Updating doctor profile for user ID {user.id}")
        profile = await DoctorProfileService.get_or_create_profile(db, user)

        update_data = obj_in.model_dump(exclude_unset=True)
        if "clinical_expertise" in update_data and update_data["clinical_expertise"] is not None:
            update_data["clinical_expertise"] = json.dumps(update_data["clinical_expertise"])

        for field, value in update_data.items():
            if hasattr(profile, field) and field not in ("user_id", "id"):
                # Do not accidentally overwrite existing profile_photo with None/empty string in general profile update
                if field == "profile_photo" and not value:
                    continue
                # Do not set last_active_at or system timestamp columns to None if no value provided
                if field in ("last_active_at", "created_at", "updated_at"):
                    if value is None:
                        continue
                if field == "availability_status" and not value:
                    continue
                setattr(profile, field, value)

        if profile.profile_photo:
            user.picture = profile.profile_photo

        if obj_in.full_name and obj_in.full_name != user.name:
            user.name = obj_in.full_name

        try:
            await db.commit()
            await db.refresh(profile)
            await db.refresh(user)
            logger.info(f"✅ Doctor profile successfully updated in MySQL for user ID {user.id}")
            return await DoctorProfileService.get_full_profile_response(db, user)
        except Exception as e:
            await db.rollback()
            logger.error(f"❌ Failed to update doctor profile: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error updating doctor profile: {str(e)}"
            )

    @staticmethod
    async def upload_photo(db: AsyncSession, user: User, file: UploadFile) -> str:
        """Save doctor avatar to disk and store URL in MySQL doctor_profiles."""
        logger.info(f"Uploading doctor photo for user ID: {user.id}, filename: '{file.filename}'")
        ALLOWED_PHOTO_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
        _, ext = os.path.splitext((file.filename or "").lower())
        if ext not in ALLOWED_PHOTO_EXTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image format '{ext}'. Allowed: .jpg, .jpeg, .png, .webp"
            )

        unique_name = f"doc_{user.id}_{uuid.uuid4().hex[:8]}{ext}"
        target_path = AVATAR_DIR / unique_name

        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds maximum limit of 5MB."
            )

        with open(target_path, "wb") as f:
            f.write(content)

        photo_url = f"/uploads/avatars/{unique_name}"
        
        profile = await DoctorProfileService.get_or_create_profile(db, user)
        profile.profile_photo = photo_url
        user.picture = photo_url

        await db.commit()
        await db.refresh(profile)
        await db.refresh(user)
        logger.info(f"✅ Doctor photo saved to MySQL: {photo_url}")
        return photo_url

    @staticmethod
    async def remove_photo(db: AsyncSession, user: User) -> None:
        """Remove doctor photo and set profile_photo to None in MySQL."""
        logger.info(f"Removing doctor photo for user ID {user.id}")
        profile = await DoctorProfileService.get_or_create_profile(db, user)
        profile.profile_photo = None
        user.picture = None
        await db.commit()
        await db.refresh(profile)
        await db.refresh(user)

    # =========================================================================
    # Experience CRUD
    # =========================================================================
    @staticmethod
    async def add_experience(db: AsyncSession, user: User, obj_in: DoctorExperienceCreate) -> DoctorExperience:
        exp = DoctorExperience(
            user_id=user.id,
            organization=obj_in.organization,
            position=obj_in.position,
            department=obj_in.department,
            start_date=obj_in.start_date,
            end_date=obj_in.end_date,
            currently_working=obj_in.currently_working,
            description=obj_in.description
        )
        db.add(exp)
        await db.commit()
        await db.refresh(exp)
        return exp

    @staticmethod
    async def delete_experience(db: AsyncSession, user: User, exp_id: int) -> bool:
        await db.execute(delete(DoctorExperience).where(DoctorExperience.id == exp_id, DoctorExperience.user_id == user.id))
        await db.commit()
        return True

    # =========================================================================
    # Education CRUD
    # =========================================================================
    @staticmethod
    async def add_education(db: AsyncSession, user: User, obj_in: DoctorEducationCreate) -> DoctorEducation:
        edu = DoctorEducation(
            user_id=user.id,
            degree=obj_in.degree,
            specialization=obj_in.specialization,
            institution=obj_in.institution,
            start_year=obj_in.start_year,
            graduation_year=obj_in.graduation_year,
            grade=obj_in.grade
        )
        db.add(edu)
        await db.commit()
        await db.refresh(edu)
        return edu

    @staticmethod
    async def delete_education(db: AsyncSession, user: User, edu_id: int) -> bool:
        await db.execute(delete(DoctorEducation).where(DoctorEducation.id == edu_id, DoctorEducation.user_id == user.id))
        await db.commit()
        return True

    # =========================================================================
    # Certification CRUD
    # =========================================================================
    @staticmethod
    async def add_certification(db: AsyncSession, user: User, obj_in: DoctorCertificationCreate) -> DoctorCertification:
        cert = DoctorCertification(
            user_id=user.id,
            certification_name=obj_in.certification_name,
            issuing_organization=obj_in.issuing_organization,
            certificate_number=obj_in.certificate_number,
            issue_date=obj_in.issue_date,
            expiry_date=obj_in.expiry_date,
            certificate_document=obj_in.certificate_document,
            verification_status=obj_in.verification_status
        )
        db.add(cert)
        await db.commit()
        await db.refresh(cert)
        return cert

    @staticmethod
    async def delete_certification(db: AsyncSession, user: User, cert_id: int) -> bool:
        await db.execute(delete(DoctorCertification).where(DoctorCertification.id == cert_id, DoctorCertification.user_id == user.id))
        await db.commit()
        return True

    # =========================================================================
    # Admin Available Doctors & Specialist Directory Methods
    # =========================================================================
    @staticmethod
    async def seed_clinical_doctors(db: AsyncSession) -> None:
        """Seed realistic clinical neurology specialists if fewer than 5 exist in database."""
        stmt = select(User).where(User.role.in_(["Doctor", "Admin"]))
        res = await db.execute(stmt)
        existing_users = list(res.scalars().all())

        if len(existing_users) < 6:
            logger.info("Auto-seeding clinical neurology specialists into MySQL database...")
            from app.utils.security import get_password_hash
            default_pwd = get_password_hash("Doctor@123")

            specialist_seeds = [
                {
                    "name": "Dr. Sunita Sharma",
                    "email": "sunita.sharma@neurofusion.org",
                    "specialization": "Dementia & Alzheimer's Care",
                    "sub_spec": "Early Cognitive Decline & Neuroimaging",
                    "title": "Senior Consultant Neurologist",
                    "degree": "MBBS, MD (Neurology), DM (Cognitive Neuro)",
                    "hospital": "NeuroFusion Clinical Medical Center",
                    "dept": "Memory & Cognitive Disorders Clinic",
                    "exp": 12,
                    "phone": "+91 98450 33441",
                    "room": "OPD 201 (Cognitive Suite)",
                    "license": "KMC-NEURO-77182",
                    "status": "Available",
                    "expertise": ["Dementia", "Alzheimer's Disease", "MRI Analysis", "Cognitive Disorders"]
                },
                {
                    "name": "Dr. Rahul Sharma",
                    "email": "rahul.sharma@neurofusion.org",
                    "specialization": "Epileptology & Stroke",
                    "sub_spec": "Clinical EEG & Neurophysiology",
                    "title": "Associate Professor & Neurophysiologist",
                    "degree": "MBBS, MD, DNB (Neurology)",
                    "hospital": "Fortis Neuro-Care Institute",
                    "dept": "Comprehensive Epilepsy & EEG Unit",
                    "exp": 9,
                    "phone": "+91 98860 55112",
                    "room": "OPD 108 (EEG Wing)",
                    "license": "DMC-NEURO-66419",
                    "status": "Available",
                    "expertise": ["Epilepsy", "Stroke", "EEG Analysis", "Neurodegenerative Disorders"]
                },
                {
                    "name": "Dr. Ananya Iyer",
                    "email": "ananya.iyer@neurofusion.org",
                    "specialization": "Movement Disorders & Parkinson's",
                    "sub_spec": "Basal Ganglia Neurodegenerative Care",
                    "title": "Consultant Neurologist & Movement Specialist",
                    "degree": "MBBS, MD, Fellowship in Movement Disorders",
                    "hospital": "Manipal Brain Health Center",
                    "dept": "Parkinson's & Movement Disorders Center",
                    "exp": 7,
                    "phone": "+91 99001 77334",
                    "room": "OPD 305 (Brain Center)",
                    "license": "KMC-NEURO-99214",
                    "status": "Busy",
                    "expertise": ["Parkinson's Disease", "Dementia", "Cognitive Disorders"]
                },
                {
                    "name": "Dr. Rajesh Kulkarni",
                    "email": "rajesh.kulkarni@neurofusion.org",
                    "specialization": "Neuroscience & Neuroimaging",
                    "sub_spec": "3D MRI Volumetrics & Triage",
                    "title": "Lead Neuroradiologist & Clinician",
                    "degree": "MBBS, MD (Radiodiagnosis), FRCR",
                    "hospital": "Tata Neuro-Imaging & Cognitive Hub",
                    "dept": "Department of Neuroradiology",
                    "exp": 15,
                    "phone": "+91 94480 88221",
                    "room": "Radiology Suite 4",
                    "license": "MCI-NEURO-55310",
                    "status": "Available",
                    "expertise": ["MRI Analysis", "Alzheimer's Disease", "Dementia", "Neuroimaging"]
                },
                {
                    "name": "Dr. Priya Deshmukh",
                    "email": "priya.deshmukh@neurofusion.org",
                    "specialization": "Cognitive Disorders & Neuropsychology",
                    "sub_spec": "Frontotemporal Dementia (FTD) Assessment",
                    "title": "Consultant Cognitive Neurologist",
                    "degree": "MBBS, MD, PhD in Behavioral Neurology",
                    "hospital": "NIMHANS Cognitive Center",
                    "dept": "Behavioral Neurology Division",
                    "exp": 10,
                    "phone": "+91 98112 44990",
                    "room": "OPD 402",
                    "license": "KMC-NEURO-88339",
                    "status": "On Leave",
                    "expertise": ["Frontotemporal Dementia (FTD)", "Dementia", "Cognitive Disorders", "EEG Analysis"]
                }
            ]

            for s in specialist_seeds:
                # Check if user already exists
                check_u = await db.execute(select(User).where(User.email == s["email"]))
                if not check_u.scalars().first():
                    new_u = User(
                        name=s["name"],
                        email=s["email"],
                        password_hash=default_pwd,
                        role="Doctor",
                        is_active=True
                    )
                    db.add(new_u)
                    await db.commit()
                    await db.refresh(new_u)

                    new_p = DoctorProfile(
                        user_id=new_u.id,
                        full_name=s["name"],
                        preferred_name=s["name"],
                        gender="Female" if "Dr. Sunita" in s["name"] or "Dr. Ananya" in s["name"] or "Dr. Priya" in s["name"] else "Male",
                        phone=s["phone"],
                        specialization=s["specialization"],
                        sub_specialization=s["sub_spec"],
                        professional_title=s["title"],
                        medical_degree=s["degree"],
                        years_experience=s["exp"],
                        hospital_name=s["hospital"],
                        department=s["dept"],
                        designation=s["title"],
                        medical_license_number=s["license"],
                        medical_council="Medical Council of India",
                        consultation_room=s["room"],
                        availability_status=s["status"],
                        clinical_expertise=json.dumps(s["expertise"])
                    )
                    db.add(new_p)
                    await db.commit()

    @staticmethod
    async def get_available_doctors(
        db: AsyncSession,
        specialization: Optional[str] = None,
        availability: Optional[str] = None,
        search: Optional[str] = None
    ) -> AvailableDoctorsResponse:
        """Query real doctor directory with availability and specialization stats from MySQL."""
        # Only select actual registered users whose role is Doctor
        from sqlalchemy import func
        user_stmt = select(User).where(
            (func.lower(User.role) == "doctor") & (User.is_active == True)
        )
        user_res = await db.execute(user_stmt)
        users = list(user_res.scalars().all())

        all_doc_items: List[AvailableDoctorItem] = []
        specialty_counts: dict[str, int] = {}
        all_specialties_set = set()

        stats = DoctorAvailabilityStats(
            total_doctors=0,
            available=0,
            busy=0,
            offline=0,
            on_leave=0
        )

        for u in users:
            # Only include users with Doctor or Admin role who practice clinically
            p = await DoctorProfileService.get_or_create_profile(db, u)
            
            # Specializations list
            specs = []
            if p.specialization:
                specs.append(p.specialization)
            if p.sub_specialization and p.sub_specialization not in specs:
                specs.append(p.sub_specialization)
            
            if p.clinical_expertise:
                try:
                    exp_tags = json.loads(p.clinical_expertise)
                    for t in exp_tags:
                        if t not in specs:
                            specs.append(t)
                except Exception:
                    pass

            for s in specs:
                all_specialties_set.add(s)

            avail_stat = p.availability_status or "Available"
            if avail_stat.lower() in ("available", "active", "online"):
                avail_stat = "Available"
                stats.available += 1
            elif avail_stat.lower() in ("busy", "in_consultation"):
                avail_stat = "Busy"
                stats.busy += 1
            elif avail_stat.lower() in ("offline", "inactive"):
                avail_stat = "Offline"
                stats.offline += 1
            elif avail_stat.lower() in ("on_leave", "on leave", "leave"):
                avail_stat = "On Leave"
                stats.on_leave += 1
            else:
                avail_stat = "Available"
                stats.available += 1

            stats.total_doctors += 1

            # Count available per specialty
            if avail_stat == "Available":
                for s in specs:
                    specialty_counts[s] = specialty_counts.get(s, 0) + 1

            doc_item = AvailableDoctorItem(
                id=p.id,
                user_id=u.id,
                doctor_id=f"NF-DOC-{u.id:06d}",
                name=p.full_name or u.name,
                email=u.email,
                photo=p.profile_photo,
                professional_title=p.professional_title or "Attending Neurologist",
                specialization=p.specialization or "Neurology",
                sub_specialization=p.sub_specialization,
                specializations=specs,
                hospital=p.hospital_name or "NeuroFusion Hospital",
                department=p.department or "Department of Neurology",
                experience_years=p.years_experience or 5,
                availability_status=avail_stat,
                last_active_at=p.last_active_at or p.updated_at,
                available_from=p.available_from or "09:00 AM",
                available_until=p.available_until or "06:00 PM",
                phone=p.phone,
                consultation_room=p.consultation_room,
                medical_license_number=p.medical_license_number
            )
            all_doc_items.append(doc_item)

        # Filter doctors based on query params
        filtered_docs = all_doc_items

        if availability and availability.lower() != "all":
            filtered_docs = [
                d for d in filtered_docs
                if d.availability_status.lower() == availability.lower()
            ]

        if specialization and specialization.lower() != "all" and specialization.lower() != "all specializations":
            spec_target = specialization.lower()
            filtered_docs = [
                d for d in filtered_docs
                if spec_target in d.specialization.lower()
                or (d.sub_specialization and spec_target in d.sub_specialization.lower())
                or any(spec_target in s.lower() for s in d.specializations)
            ]

        if search:
            query = search.lower().strip()
            filtered_docs = [
                d for d in filtered_docs
                if query in d.name.lower()
                or query in d.email.lower()
                or query in d.specialization.lower()
                or query in (d.hospital or "").lower()
                or any(query in s.lower() for s in d.specializations)
            ]

        return AvailableDoctorsResponse(
            doctors=filtered_docs,
            stats=stats,
            specialty_summary=specialty_counts,
            available_specializations=sorted(list(all_specialties_set))
        )

    @staticmethod
    async def update_availability_status(db: AsyncSession, doctor_id: int, new_status: str) -> None:
        """Update doctor availability status in MySQL."""
        logger.info(f"Updating doctor {doctor_id} availability to: {new_status}")
        stmt = select(DoctorProfile).where((DoctorProfile.id == doctor_id) | (DoctorProfile.user_id == doctor_id))
        res = await db.execute(stmt)
        profile = res.scalars().first()
        if not profile:
            raise HTTPException(status_code=404, detail="Doctor profile not found in MySQL")

        profile.availability_status = new_status
        profile.last_active_at = datetime.utcnow()
        await db.commit()
        await db.refresh(profile)

    @staticmethod
    async def delete_doctor(db: AsyncSession, doctor_id: int) -> None:
        """Delete doctor profile, sub-records, and user account from MySQL database."""
        logger.info(f"Admin deleting doctor ID / User ID: {doctor_id}")
        try:
            stmt = select(DoctorProfile).where((DoctorProfile.id == doctor_id) | (DoctorProfile.user_id == doctor_id))
            res = await db.execute(stmt)
            profile = res.scalars().first()

            user_id = profile.user_id if profile else doctor_id

            # 1. Delete associated doctor experience, education, certifications
            await db.execute(delete(DoctorExperience).where(DoctorExperience.user_id == user_id))
            await db.execute(delete(DoctorEducation).where(DoctorEducation.user_id == user_id))
            await db.execute(delete(DoctorCertification).where(DoctorCertification.user_id == user_id))
            
            # 2. Delete doctor profile
            if profile:
                await db.delete(profile)
            else:
                await db.execute(delete(DoctorProfile).where((DoctorProfile.id == doctor_id) | (DoctorProfile.user_id == doctor_id)))

            # 3. Delete user account
            u_res = await db.execute(select(User).where(User.id == user_id))
            user_to_delete = u_res.scalars().first()
            if user_to_delete:
                await db.delete(user_to_delete)
            else:
                await db.execute(delete(User).where(User.id == user_id))

            await db.commit()
            logger.info(f"✅ Doctor ID {doctor_id} (User ID {user_id}) permanently removed from MySQL.")
        except Exception as e:
            await db.rollback()
            logger.error(f"❌ Failed to delete doctor #{doctor_id}: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete doctor from database: {str(e)}"
            )

