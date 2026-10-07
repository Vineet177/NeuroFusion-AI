#!/usr/bin/env python3
"""
NeuroFusion AI - Admin User Seeding & Provisioning CLI Script
Usage:
    python create_admin.py
    python create_admin.py --email admin@neurofusion.ai --password "Admin@12345" --name "System Administrator"
"""

import asyncio
import argparse
import sys
from datetime import datetime
from sqlalchemy import select

from app.database.session import AsyncSessionLocal, engine
from app.database.base import Base
from app.models.user import User
from app.models.doctor_profile import DoctorProfile
from app.utils.security import get_password_hash
from app.config import settings


async def create_or_update_admin(email: str, password: str, name: str, phone: str = "+91 9999999999"):
    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    normalized_email = email.strip().lower()
    hashed_pwd = get_password_hash(password)

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == normalized_email))
        user = result.scalars().first()

        if user:
            print(f"[*] Account with email '{normalized_email}' already exists (ID: {user.id}). Updating to Admin...")
            user.role = "Admin"
            user.is_superuser = True
            user.is_active = True
            user.password_hash = hashed_pwd
            user.name = name
            await session.commit()
            print(f"[SUCCESS] User '{normalized_email}' has been updated to Admin with the new password.")
        else:
            print(f"[*] Creating new Admin account for '{normalized_email}'...")
            user = User(
                name=name,
                email=normalized_email,
                phone=phone,
                gender="Other",
                password_hash=hashed_pwd,
                role="Admin",
                is_active=True,
                is_superuser=True,
                email_verified=True,
                phone_verified=True
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)

            # Create corresponding Doctor/Admin profile
            profile = DoctorProfile(
                user_id=user.id,
                full_name=name,
                gender="Other",
                phone=phone,
                specialization="Platform Operations & AI Core",
                sub_specialization="Infrastructure & Security",
                professional_title="System Administrator",
                hospital_name="NeuroFusion Clinical & Cognitive Center",
                medical_degree="B.Tech / M.S. Health Informatics",
                years_experience=10,
                availability_status="Available",
                bio="Primary system administrator and clinical AI operations director for NeuroFusion AI.",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(profile)
            await session.commit()
            print(f"[SUCCESS] Admin account created successfully! (User ID: {user.id})")

    await engine.dispose()


def main():
    parser = argparse.ArgumentParser(description="Create or update an Admin user for NeuroFusion AI.")
    parser.add_argument("--email", default=settings.ADMIN_EMAIL, help="Admin email address")
    parser.add_argument("--password", default=settings.ADMIN_PASSWORD, help="Admin password")
    parser.add_argument("--name", default="System Administrator", help="Admin display name")
    parser.add_argument("--phone", default="+91 9999999999", help="Admin phone number")

    args = parser.parse_args()

    print("==================================================")
    print("      NeuroFusion AI - Admin Provisioning Tool    ")
    print("==================================================")
    print(f"Email:    {args.email}")
    print(f"Name:     {args.name}")
    print("==================================================")

    asyncio.run(create_or_update_admin(
        email=args.email,
        password=args.password,
        name=args.name,
        phone=args.phone
    ))


if __name__ == "__main__":
    main()
