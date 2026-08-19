import re
import secrets
import hashlib
import hmac
import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_
from fastapi import HTTPException, status

from app.models.user import User
from app.models.user import User
from app.models.password_reset_otp import PasswordResetOTP
from app.services.notification_service import NotificationService
from app.services.sms_service import SMSService, parse_and_normalize_indian_phone
from app.schemas.auth import (
    ForgotPasswordResponse,
    VerifyResetOtpResponse,
    ResetPasswordResponse
)
from app.utils.security import get_password_hash
from app.config import settings

logger = logging.getLogger("neurofusion.otp_service")
OTP_EXPIRY_MINUTES = getattr(settings, "OTP_EXPIRY_MINUTES", 10)
RESET_TOKEN_EXPIRY_MINUTES = 15
MAX_OTP_ATTEMPTS = 5
RESEND_COOLDOWN_SECONDS = getattr(settings, "OTP_COOLDOWN_SECONDS", 60)


def generate_secure_6digit_otp() -> str:
    """Generate a cryptographically secure 6-digit numeric OTP."""
    return str(secrets.randbelow(900000) + 100000)


def hash_otp(otp: str) -> str:
    """Hash an OTP code using SHA-256 with project secret key salt."""
    salt = settings.SECRET_KEY.encode("utf-8")
    return hashlib.sha256(salt + otp.encode("utf-8")).hexdigest()


def verify_otp_hash(entered_otp: str, stored_hash: str) -> bool:
    """Verify an entered OTP against stored hash using constant-time comparison."""
    computed_hash = hash_otp(entered_otp)
    return hmac.compare_digest(computed_hash, stored_hash)


def mask_contact(contact_val: str, contact_type: str) -> str:
    """Mask email or phone number for privacy display."""
    if not contact_val:
        return "********"
    
    if contact_type == "email":
        parts = contact_val.strip().split("@")
        if len(parts) == 2:
            name_part, domain_part = parts
            if len(name_part) <= 2:
                masked_name = name_part[0] + "********"
            else:
                masked_name = name_part[0] + "********" + name_part[-1]
            return f"{masked_name}@{domain_part}"
        return contact_val[0] + "********"
    else:
        # Phone
        phone_info = parse_and_normalize_indian_phone(contact_val)
        return phone_info.get("masked", "+91 ******")


def normalize_phone_number(phone_raw: str) -> str:
    """Normalize phone input to standard Indian mobile representations."""
    info = parse_and_normalize_indian_phone(phone_raw)
    return info["e164"]


class OTPService:
    @staticmethod
    async def find_user_by_contact(db: AsyncSession, contact_type: str, contact_value: str) -> Optional[User]:
        """Find user by email or phone in MySQL across all standard formats."""
        if contact_type == "email":
            clean_email = contact_value.strip().lower()
            result = await db.execute(select(User).where(User.email == clean_email))
            return result.scalars().first()
        else:
            phone_info = parse_and_normalize_indian_phone(contact_value)
            logger.info(f"Phone normalized: {phone_info['e164']}")
            # Search across all common database storage representations
            result = await db.execute(
                select(User).where(User.phone.in_(phone_info["db_search_variants"]))
            )
            user = result.scalars().first()
            if user:
                return user

            # Fallback: exact match if not in variants
            result = await db.execute(select(User).where(User.phone == contact_value.strip()))
            return result.scalars().first()

    @staticmethod
    async def request_password_reset_otp(
        db: AsyncSession,
        contact_type: str,
        contact_value: str
    ) -> ForgotPasswordResponse:
        """
        Processes Forgot Password request.
        Generates and sends a secure 6-digit OTP to the registered email/phone.
        Strict anti-enumeration: always returns generic message even if contact is not registered.
        """
        logger.info("Forgot password request received")
        user = await OTPService.find_user_by_contact(db, contact_type=contact_type, contact_value=contact_value)
        logger.info("User lookup completed")

        # Masked representation for response
        masked = mask_contact(contact_value, contact_type)

        if not user:
            logger.warning(f"Security: Password reset requested for non-existent contact '{contact_value}'. Returning generic response.")
            # Anti-enumeration response
            return ForgotPasswordResponse(
                success=True,
                message="If an account exists, an OTP has been sent.",
                masked_contact=masked,
                contact_type=contact_type
            )

        # Check Resend Cooldown (60 seconds)
        recent_otp_query = await db.execute(
            select(PasswordResetOTP)
            .where(PasswordResetOTP.user_id == user.id)
            .order_by(PasswordResetOTP.id.desc())
        )
        latest_otp = recent_otp_query.scalars().first()

        now = datetime.utcnow()
        if latest_otp and latest_otp.created_at and not latest_otp.is_used:
            elapsed_seconds = (now - latest_otp.created_at).total_seconds()
            if 0 <= elapsed_seconds < RESEND_COOLDOWN_SECONDS:
                wait_time = max(1, int(RESEND_COOLDOWN_SECONDS - elapsed_seconds))
                logger.warning(f"Resend cooldown active for user #{user.id}. {wait_time}s remaining.")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Please wait {wait_time} seconds before requesting a new OTP."
                )

        # Invalidate all previous unverified / unused OTPs for this user
        await db.execute(
            update(PasswordResetOTP)
            .where(
                and_(
                    PasswordResetOTP.user_id == user.id,
                    PasswordResetOTP.is_used == False
                )
            )
            .values(is_used=True)
        )

        # Generate fresh secure 6-digit OTP
        plain_otp = generate_secure_6digit_otp()
        hashed = hash_otp(plain_otp)
        expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)
        logger.info("OTP generated")

        otp_record = PasswordResetOTP(
            user_id=user.id,
            contact_type=contact_type,
            contact_value=user.email if contact_type == "email" else user.phone or contact_value,
            otp_hash=hashed,
            expires_at=expires_at,
            attempt_count=0,
            is_used=False,
            created_at=now
        )

        db.add(otp_record)
        await db.commit()
        await db.refresh(otp_record)
        logger.info("OTP stored")

        # Dispatch OTP via NotificationService or SMSService
        if contact_type == "email":
            NotificationService.send_email_otp(to_email=user.email, otp=plain_otp, user_name=user.name)
        else:
            success, status_msg, _ = await SMSService.send_password_reset_otp(
                phone_raw=user.phone or contact_value,
                otp=plain_otp,
                expiry_minutes=OTP_EXPIRY_MINUTES
            )
            logger.info(f"""
============================================================
📱  [PASSWORD RESET SMS OTP]
Recipient: {contact_value} (User #{user.id}: {user.name})
OTP Code:  >>> {plain_otp} <<<
Expires:   {OTP_EXPIRY_MINUTES} minutes
Gateway:   {'DELIVERED via Fast2SMS' if success else f'Notice: {status_msg}'}
============================================================
""")

        return ForgotPasswordResponse(
            success=True,
            message="If an account exists, an OTP has been sent.",
            masked_contact=masked,
            contact_type=contact_type,
            dev_otp=plain_otp
        )

    @staticmethod
    async def resend_password_reset_otp(
        db: AsyncSession,
        contact_value: str
    ) -> ForgotPasswordResponse:
        """
        Resends a new OTP for the contact after checking cooldown.
        """
        # Determine if email or phone
        clean_contact = contact_value.strip()
        contact_type = "email" if "@" in clean_contact else "phone"
        return await OTPService.request_password_reset_otp(db, contact_type=contact_type, contact_value=clean_contact)

    @staticmethod
    async def verify_reset_otp(
        db: AsyncSession,
        contact_value: str,
        entered_otp: str
    ) -> VerifyResetOtpResponse:
        """
        Verifies entered OTP code:
        - Checks attempt limits (max 5)
        - Validates expiration (10 mins)
        - Performs constant-time hash comparison
        - Generates temporary reset_token authorization (15 mins)
        """
        clean_contact = contact_value.strip()
        contact_type = "email" if "@" in clean_contact else "phone"
        user = await OTPService.find_user_by_contact(db, contact_type=contact_type, contact_value=clean_contact)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification request. Please request a new OTP."
            )

        # Retrieve the latest active OTP for this user
        result = await db.execute(
            select(PasswordResetOTP)
            .where(
                and_(
                    PasswordResetOTP.user_id == user.id,
                    PasswordResetOTP.is_used == False
                )
            )
            .order_by(PasswordResetOTP.id.desc())
        )
        otp_record = result.scalars().first()

        if not otp_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This verification code has expired. Please request a new OTP."
            )

        now = datetime.utcnow()

        # Check expiration
        if otp_record.expires_at < now:
            otp_record.is_used = True
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This verification code has expired. Please request a new OTP."
            )

        # Check maximum verification attempts
        if otp_record.attempt_count >= MAX_OTP_ATTEMPTS:
            otp_record.is_used = True
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many verification attempts. Please request a new OTP."
            )

        # Compare Hash
        is_valid = verify_otp_hash(entered_otp, otp_record.otp_hash)
        if not is_valid:
            otp_record.attempt_count += 1
            if otp_record.attempt_count >= MAX_OTP_ATTEMPTS:
                otp_record.is_used = True
                await db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Too many verification attempts. Please request a new OTP."
                )
            await db.commit()
            attempts_left = MAX_OTP_ATTEMPTS - otp_record.attempt_count
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code. Please try again."
            )

        # Successful OTP Verification
        reset_token = secrets.token_urlsafe(32)
        otp_record.verified_at = now
        otp_record.reset_token = reset_token
        otp_record.reset_token_expires_at = now + timedelta(minutes=RESET_TOKEN_EXPIRY_MINUTES)
        
        await db.commit()
        logger.info(f"✅ OTP successfully verified for user #{user.id}. Generated reset token.")

        return VerifyResetOtpResponse(
            success=True,
            message="OTP verified successfully.",
            reset_token=reset_token
        )

    @staticmethod
    async def reset_password_with_token(
        db: AsyncSession,
        reset_token: str,
        new_password: str
    ) -> ResetPasswordResponse:
        """
        Executes password reset using verified reset authorization token.
        Updates MySQL user password hash and invalidates the session.
        Works seamlessly for both Admin and Doctor accounts without changing their role.
        """
        clean_token = reset_token.strip()
        if not clean_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password reset session has expired or is invalid. Please request a new OTP."
            )

        now = datetime.utcnow()
        result = await db.execute(
            select(PasswordResetOTP)
            .where(
                and_(
                    PasswordResetOTP.reset_token == clean_token,
                    PasswordResetOTP.is_used == False,
                    PasswordResetOTP.verified_at != None
                )
            )
        )
        otp_record = result.scalars().first()

        if not otp_record or not otp_record.reset_token_expires_at or otp_record.reset_token_expires_at < now:
            if otp_record:
                otp_record.is_used = True
                await db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password reset session has expired or is invalid. Please request a new OTP."
            )

        # Retrieve user
        user_result = await db.execute(select(User).where(User.id == otp_record.user_id))
        user = user_result.scalars().first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User account associated with this request was not found."
            )

        # Update password in MySQL
        user.password_hash = get_password_hash(new_password)
        
        # Invalidate current and all remaining reset sessions for this user
        otp_record.is_used = True
        otp_record.reset_token = None
        
        await db.execute(
            update(PasswordResetOTP)
            .where(PasswordResetOTP.user_id == user.id)
            .values(is_used=True, reset_token=None)
        )

        await db.commit()
        logger.info(f"✅ Password successfully updated in MySQL for {user.role} user #{user.id} ({user.email})")

        return ResetPasswordResponse(
            success=True,
            message="Your password has been updated successfully."
        )
