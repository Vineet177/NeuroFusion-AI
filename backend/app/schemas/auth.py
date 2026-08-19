from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator, model_validator
from app.schemas.user import UserResponse


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[UserResponse] = None


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    code: Optional[str] = None
    role_hint: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    contact_type: str  # 'email' or 'phone'
    contact_value: str

    @field_validator("contact_type")
    @classmethod
    def validate_contact_type(cls, v: str) -> str:
        v_clean = v.strip().lower()
        if v_clean not in ("email", "phone"):
            raise ValueError("Contact type must be either 'email' or 'phone'.")
        return v_clean

    @field_validator("contact_value")
    @classmethod
    def validate_contact_value(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Please enter your registered email address or phone number.")
        return v.strip()


class ForgotPasswordResponse(BaseModel):
    success: bool = True
    message: str = "If an account exists, an OTP has been sent."
    masked_contact: str
    contact_type: str
    dev_otp: Optional[str] = None


class VerifyResetOtpRequest(BaseModel):
    contact_value: str
    otp: str

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned or len(cleaned) != 6 or not cleaned.isdigit():
            raise ValueError("Please enter a valid 6-digit OTP code.")
        return cleaned


class VerifyResetOtpResponse(BaseModel):
    success: bool = True
    message: str = "OTP verified successfully."
    reset_token: str


class ResendResetOtpRequest(BaseModel):
    contact_value: str


class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str
    confirm_password: Optional[str] = None

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if not v:
            raise ValueError("Password is required.")
        if len(v) < 8:
            raise ValueError("Password must contain at least 8 characters.")
        return v

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.confirm_password is not None and self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class ResetPasswordResponse(BaseModel):
    success: bool = True
    message: str = "Your password has been updated successfully."
