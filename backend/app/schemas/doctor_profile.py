from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr


# ============================================================================
# Doctor Experience Schemas
# ============================================================================

class DoctorExperienceBase(BaseModel):
    organization: str
    position: str
    department: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None
    currently_working: bool = False
    description: Optional[str] = None


class DoctorExperienceCreate(DoctorExperienceBase):
    pass


class DoctorExperienceUpdate(BaseModel):
    organization: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    currently_working: Optional[bool] = None
    description: Optional[str] = None


class DoctorExperienceResponse(DoctorExperienceBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Doctor Education Schemas
# ============================================================================

class DoctorEducationBase(BaseModel):
    degree: str
    specialization: Optional[str] = None
    institution: str
    start_year: Optional[str] = None
    graduation_year: str
    grade: Optional[str] = None


class DoctorEducationCreate(DoctorEducationBase):
    pass


class DoctorEducationUpdate(BaseModel):
    degree: Optional[str] = None
    specialization: Optional[str] = None
    institution: Optional[str] = None
    start_year: Optional[str] = None
    graduation_year: Optional[str] = None
    grade: Optional[str] = None


class DoctorEducationResponse(DoctorEducationBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Doctor Certification Schemas
# ============================================================================

class DoctorCertificationBase(BaseModel):
    certification_name: str
    issuing_organization: str
    certificate_number: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    certificate_document: Optional[str] = None
    verification_status: str = "Verified"


class DoctorCertificationCreate(DoctorCertificationBase):
    pass


class DoctorCertificationUpdate(BaseModel):
    certification_name: Optional[str] = None
    issuing_organization: Optional[str] = None
    certificate_number: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    certificate_document: Optional[str] = None
    verification_status: Optional[str] = None


class DoctorCertificationResponse(DoctorCertificationBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Doctor Profile Schemas
# ============================================================================

class DoctorProfileBase(BaseModel):
    profile_photo: Optional[str] = None
    full_name: Optional[str] = None
    preferred_name: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    phone: Optional[str] = None
    alternate_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    pincode: Optional[str] = None

    specialization: Optional[str] = "Neurology"
    sub_specialization: Optional[str] = "Cognitive & Behavioral Neurology"
    professional_title: Optional[str] = "Attending Neurologist"
    medical_degree: Optional[str] = "MBBS, MD (Neurology)"
    additional_qualifications: Optional[str] = None
    university: Optional[str] = None
    graduation_year: Optional[str] = None
    years_experience: Optional[int] = 0
    medical_license_number: Optional[str] = None
    medical_council: Optional[str] = None
    license_expiry: Optional[str] = None

    hospital_name: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    hospital_address: Optional[str] = None
    hospital_city: Optional[str] = None
    hospital_state: Optional[str] = None
    hospital_country: Optional[str] = "India"
    hospital_phone: Optional[str] = None
    hospital_email: Optional[str] = None
    consultation_room: Optional[str] = None
    bio: Optional[str] = None
    clinical_expertise: Optional[List[str]] = None

    # Availability
    availability_status: Optional[str] = "Available"
    last_active_at: Optional[datetime] = None
    available_from: Optional[str] = "09:00 AM"
    available_until: Optional[str] = "06:00 PM"


class DoctorProfileUpdate(DoctorProfileBase):
    pass


class DoctorProfileResponse(DoctorProfileBase):
    id: int
    user_id: int
    doctor_id: str = "NF-DOC-000001"
    email: Optional[str] = None
    role: Optional[str] = "Doctor"
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    experiences: List[DoctorExperienceResponse] = []
    educations: List[DoctorEducationResponse] = []
    certifications: List[DoctorCertificationResponse] = []

    model_config = ConfigDict(from_attributes=True)


class AvailableDoctorItem(BaseModel):
    id: int
    user_id: int
    doctor_id: str
    name: str
    email: str
    photo: Optional[str] = None
    professional_title: str = "Neurologist"
    specialization: str = "Neurology"
    sub_specialization: Optional[str] = None
    specializations: List[str] = []
    hospital: Optional[str] = "NeuroFusion Hospital"
    department: Optional[str] = "Neurology"
    experience_years: int = 5
    availability_status: str = "Available"
    last_active_at: Optional[datetime] = None
    available_from: Optional[str] = "09:00 AM"
    available_until: Optional[str] = "06:00 PM"
    phone: Optional[str] = None
    consultation_room: Optional[str] = None
    medical_license_number: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DoctorAvailabilityStats(BaseModel):
    total_doctors: int = 0
    available: int = 0
    busy: int = 0
    offline: int = 0
    on_leave: int = 0


class AvailableDoctorsResponse(BaseModel):
    doctors: List[AvailableDoctorItem]
    stats: DoctorAvailabilityStats
    specialty_summary: dict[str, int]
    available_specializations: List[str]


class UpdateAvailabilityRequest(BaseModel):
    availability_status: str


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
