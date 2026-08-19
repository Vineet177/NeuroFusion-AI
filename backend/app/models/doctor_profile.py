from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    # Header & Media
    profile_photo = Column(String(500), nullable=True)
    
    # Personal Info
    full_name = Column(String(255), nullable=True)
    preferred_name = Column(String(255), nullable=True)
    gender = Column(String(50), nullable=True)
    date_of_birth = Column(String(50), nullable=True)
    phone = Column(String(50), nullable=True)
    alternate_phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True, default="India")
    pincode = Column(String(50), nullable=True)

    # Professional Info
    specialization = Column(String(100), nullable=True, default="Neurology")
    sub_specialization = Column(String(100), nullable=True, default="Cognitive & Behavioral Neurology")
    professional_title = Column(String(100), nullable=True, default="Attending Neurologist")
    medical_degree = Column(String(100), nullable=True, default="MBBS, MD (Neurology)")
    additional_qualifications = Column(String(255), nullable=True, default="DM (Neurology), DNB, Fellowship in Cognitive Neurology")
    university = Column(String(255), nullable=True, default="All India Institute of Medical Sciences (AIIMS)")
    graduation_year = Column(String(50), nullable=True, default="2016")
    years_experience = Column(Integer, nullable=True, default=8)
    medical_license_number = Column(String(100), nullable=True, default="MCI-NEURO-84920")
    medical_council = Column(String(100), nullable=True, default="Medical Council of India (MCI)")
    license_expiry = Column(String(50), nullable=True, default="2029-12-31")

    # Hospital Info
    hospital_name = Column(String(255), nullable=True, default="NeuroFusion Clinical & Cognitive Medical Center")
    department = Column(String(100), nullable=True, default="Department of Neurology & Neuroimaging")
    designation = Column(String(100), nullable=True, default="Senior Consultant Neurologist")
    hospital_address = Column(Text, nullable=True, default="Health City, Tertiary Neuro Institute Block B")
    hospital_city = Column(String(100), nullable=True, default="Bangalore")
    hospital_state = Column(String(100), nullable=True, default="Karnataka")
    hospital_country = Column(String(100), nullable=True, default="India")
    hospital_phone = Column(String(50), nullable=True, default="+91 80 2849 5500")
    hospital_email = Column(String(255), nullable=True, default="neurology.clinical@neurofusion.org")
    consultation_room = Column(String(50), nullable=True, default="OPD Room 304 (Neuro Wing)")
    bio = Column(Text, nullable=True)

    # Clinical Expertise (JSON encoded list)
    clinical_expertise = Column(Text, nullable=True, default='["Dementia", "Alzheimer\'s Disease", "EEG Analysis", "MRI Analysis", "Neurodegenerative Disorders", "Cognitive Disorders"]')

    # Availability Details (Available, Busy, Offline, On Leave)
    availability_status = Column(String(50), nullable=False, default="Available")
    last_active_at = Column(DateTime, default=datetime.utcnow, nullable=True)
    available_from = Column(String(50), nullable=True, default="09:00 AM")
    available_until = Column(String(50), nullable=True, default="06:00 PM")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", backref="doctor_profile")


class DoctorExperience(Base):
    __tablename__ = "doctor_experience"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    organization = Column(String(255), nullable=False)
    position = Column(String(255), nullable=False)
    department = Column(String(255), nullable=True)
    start_date = Column(String(50), nullable=False)
    end_date = Column(String(50), nullable=True)
    currently_working = Column(Boolean, default=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", backref="experiences")


class DoctorEducation(Base):
    __tablename__ = "doctor_education"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    degree = Column(String(255), nullable=False)
    specialization = Column(String(255), nullable=True)
    institution = Column(String(255), nullable=False)
    start_year = Column(String(50), nullable=True)
    graduation_year = Column(String(50), nullable=False)
    grade = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", backref="educations")


class DoctorCertification(Base):
    __tablename__ = "doctor_certifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    certification_name = Column(String(255), nullable=False)
    issuing_organization = Column(String(255), nullable=False)
    certificate_number = Column(String(100), nullable=True)
    issue_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    certificate_document = Column(String(500), nullable=True)
    verification_status = Column(String(50), default="Verified")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", backref="certifications")
