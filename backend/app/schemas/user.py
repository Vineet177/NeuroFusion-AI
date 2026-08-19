import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator, model_validator


VALID_GENDERS = ["Male", "Female", "Other", "Prefer not to say"]


def normalize_indian_phone(phone_raw: str) -> str:
    if not phone_raw or not str(phone_raw).strip():
        raise ValueError("Phone number is required.")
    
    # Strip whitespace, hyphens, parentheses
    cleaned = re.sub(r"[\s\-\(\)]", "", str(phone_raw).strip())
    
    # Remove leading +91, 91, or 0 if present
    if cleaned.startswith("+91"):
        cleaned = cleaned[3:]
    elif cleaned.startswith("91") and len(cleaned) == 12:
        cleaned = cleaned[2:]
    elif cleaned.startswith("0") and len(cleaned) == 11:
        cleaned = cleaned[1:]
        
    # Check if exactly 10 digits and only numeric
    if not cleaned.isdigit() or len(cleaned) != 10:
        raise ValueError("Please enter a valid 10-digit mobile number.")
    
    # Check if starts with 6, 7, 8, or 9 (Indian mobile operator standards)
    if cleaned[0] not in ("6", "7", "8", "9"):
        raise ValueError("Phone number must start with 6, 7, 8, or 9.")
        
    return f"+91 {cleaned}"


class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    gender: Optional[str] = None
    role: str = "Doctor"
    is_active: bool = True
    is_superuser: bool = False
    email_verified: bool = False
    phone_verified: bool = False

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Full Name is required.")
        v_clean = v.strip()
        if len(v_clean) < 2:
            raise ValueError("Full Name must be at least 2 characters.")
        if v_clean.isdigit():
            raise ValueError("Full Name cannot contain only numbers.")
        # Ensure not purely symbols
        if not re.search(r"[a-zA-Z]", v_clean):
            raise ValueError("Full Name must contain alphabetic characters.")
        return v_clean

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v):
        if isinstance(v, str):
            v_clean = v.strip().lower()
            if not v_clean:
                raise ValueError("Email address is required.")
            return v_clean
        return v

    @field_validator("role", mode="before")
    @classmethod
    def normalize_role(cls, v):
        # Force doctor registration security policy: public registration is strictly Doctor
        if isinstance(v, str):
            v_lower = v.strip().lower()
            if v_lower in ("doctor", "neurologist", "clinician"):
                return "Doctor"
            elif v_lower in ("admin", "administrator"):
                # Strictly disallowed for public registration
                return "Doctor"
            elif v_lower in ("patient", "caregiver"):
                return "Patient"
            return "Doctor"
        return "Doctor"


class UserCreate(UserBase):
    phone: str
    gender: str
    password: str
    confirm_password: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return normalize_indian_phone(v)

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Gender is required.")
        v_clean = v.strip()
        # Case-insensitive match
        for valid in VALID_GENDERS:
            if v_clean.lower() == valid.lower():
                return valid
        raise ValueError(f"Gender must be one of: {', '.join(VALID_GENDERS)}.")

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not v:
            raise ValueError("Password is required.")
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.confirm_password is not None and self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    email_verified: Optional[bool] = None
    phone_verified: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    gender: Optional[str] = None
    role: str
    picture: Optional[str] = None
    google_id: Optional[str] = None
    is_active: bool = True
    email_verified: bool = False
    phone_verified: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
