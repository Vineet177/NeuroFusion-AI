from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class PatientBase(BaseModel):
    name: str = Field(..., description="Full name of the patient")
    age: int = Field(..., ge=0, description="Age of the patient in years")
    gender: str = Field(..., description="Gender identity of the patient (e.g. Male, Female, Other)")
    dob: Optional[str] = Field(None, description="Date of birth")
    phone: Optional[str] = Field(None, description="Contact phone number")
    address: Optional[str] = Field(None, description="Residential address")
    medical_history: Optional[str] = Field(None, description="Patient medical background or diagnostic notes")
    primary_doctor: Optional[str] = Field(None, description="Primary attending neurologist or physician")


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Full name of the patient")
    age: Optional[int] = Field(None, ge=0, description="Age of the patient in years")
    gender: Optional[str] = Field(None, description="Gender identity of the patient")
    dob: Optional[str] = Field(None, description="Date of birth")
    phone: Optional[str] = Field(None, description="Contact phone number")
    address: Optional[str] = Field(None, description="Residential address")
    medical_history: Optional[str] = Field(None, description="Patient medical background or diagnostic notes")
    primary_doctor: Optional[str] = Field(None, description="Primary attending neurologist or physician")



class PatientResponse(PatientBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
