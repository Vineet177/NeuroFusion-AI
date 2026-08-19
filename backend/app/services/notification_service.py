import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

logger = logging.getLogger("neurofusion.notification_service")
logger.setLevel(logging.INFO)


class NotificationService:
    @staticmethod
    def send_email_otp(to_email: str, otp: str, user_name: str = "User") -> bool:
        """
        Sends Password Reset OTP via Email using configured SMTP or development logger.
        """
        logger.info(f"📧 [EMAIL OTP DISPATCH] Destination: {to_email}")
        
        email_body = f"""NeuroFusion Password Reset

Hello {user_name},

We received a request to reset your NeuroFusion account password.

Your verification code is:

{otp}

This OTP expires in 30 seconds.

If you did not request this password reset, you can safely ignore this email.

NeuroFusion Security Team
"""
        
        # Check if SMTP settings are configured in environment
        smtp_host = getattr(settings, "SMTP_HOST", None)
        smtp_port = getattr(settings, "SMTP_PORT", 587)
        smtp_user = getattr(settings, "SMTP_USER", None)
        smtp_password = getattr(settings, "SMTP_PASSWORD", None)
        from_email = getattr(settings, "EMAILS_FROM_EMAIL", "security@neurofusion.org")

        if smtp_host and smtp_user and smtp_password:
            try:
                msg = MIMEMultipart()
                msg["From"] = f"NeuroFusion Security <{from_email}>"
                msg["To"] = to_email
                msg["Subject"] = "NeuroFusion Password Reset - Verification Code"
                msg.attach(MIMEText(email_body, "plain"))

                with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                    server.starttls()
                    server.login(smtp_user, smtp_password)
                    server.send_message(msg)
                logger.info(f"✅ Real SMTP Email OTP successfully dispatched to {to_email}")
                return True
            except Exception as e:
                logger.error(f"❌ Failed to send SMTP email to {to_email}: {e}")
                # Fallback to dev log
                pass
        
        # Development / Server Log Delivery
        logger.info(f"""
============================================================
✉️  [NEUROFUSION SECURITY EMAIL DELIVERY]
To: {to_email}
Subject: NeuroFusion Password Reset - Verification Code
------------------------------------------------------------
{email_body}
============================================================
""")
        return True

    @staticmethod
    async def send_sms_otp(to_phone: str, otp: str, expiry_minutes: int = 10) -> bool:
        """
        Sends Password Reset OTP via SMS using SMSService.
        """
        from app.services.sms_service import SMSService
        success, status_msg, _ = await SMSService.send_password_reset_otp(to_phone, otp, expiry_minutes)
        return success
