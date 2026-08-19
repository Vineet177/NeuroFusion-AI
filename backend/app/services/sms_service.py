import re
import logging
import httpx
from typing import Tuple, Dict, Any, Optional, List
from abc import ABC, abstractmethod

from app.config import settings

logger = logging.getLogger("neurofusion.sms_service")
logger.setLevel(logging.INFO)


def parse_and_normalize_indian_phone(raw_phone: str) -> Dict[str, Any]:
    """
    Parses and normalizes Indian mobile numbers from various input formats:
    - 9876543210
    - +919876543210
    - +91 9876543210
    - +91 98765 43210
    - 919876543210
    - 09876543210

    Returns standardized dictionary with formats, validation status, and search variants.
    """
    if not raw_phone:
        return {
            "raw": "",
            "digits_10": "",
            "e164": "",
            "intl": "",
            "spaced": "",
            "display": "",
            "masked": "+91 ******",
            "is_valid": False,
            "db_search_variants": []
        }

    raw_str = str(raw_phone).strip()
    digits_only = re.sub(r"\D", "", raw_str)

    # Extract the 10-digit mobile number
    digits_10 = ""
    if len(digits_only) == 10:
        digits_10 = digits_only
    elif len(digits_only) == 11 and digits_only.startswith("0"):
        digits_10 = digits_only[1:]
    elif len(digits_only) == 12 and digits_only.startswith("91"):
        digits_10 = digits_only[2:]
    elif len(digits_only) > 10:
        # Take the last 10 digits if prefaced by country code
        digits_10 = digits_only[-10:]

    # Validate standard Indian mobile number (starts with 6, 7, 8, or 9 and exactly 10 digits)
    is_valid = bool(len(digits_10) == 10 and digits_10[0] in "6789")

    e164 = f"+91{digits_10}" if digits_10 else raw_str
    intl = f"91{digits_10}" if digits_10 else raw_str
    spaced = f"+91 {digits_10}" if digits_10 else raw_str
    display = f"+91 {digits_10[:5]} {digits_10[5:]}" if len(digits_10) == 10 else raw_str

    masked = "+91 ******"
    if len(digits_10) == 10:
        masked = f"+91 ******{digits_10[-4:]}"

    # Generate all common database storage variants for lookup
    db_variants = list({
        raw_str,
        digits_10,
        e164,
        spaced,
        intl,
        f"0{digits_10}" if digits_10 else raw_str,
        display
    }) if digits_10 else [raw_str]

    return {
        "raw": raw_str,
        "digits_10": digits_10,
        "e164": e164,
        "intl": intl,
        "spaced": spaced,
        "display": display,
        "masked": masked,
        "is_valid": is_valid,
        "db_search_variants": db_variants
    }


class BaseSMSProvider(ABC):
    """Abstract SMS Provider Interface"""
    provider_name: str = "base"

    @abstractmethod
    async def send_sms_otp(self, phone_info: Dict[str, Any], otp: str, expiry_minutes: int) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Dispatches SMS OTP to the recipient.
        Returns: (success: bool, status_message: str, provider_meta: Optional[dict])
        """
        pass


class Fast2SMSProvider(BaseSMSProvider):
    """
    Fast2SMS Provider Implementation (Popular for Indian SMS delivery)
    API Docs: https://www.fast2sms.com/dev/bulkV2
    """
    provider_name = "fast2sms"

    def __init__(self, api_key: str, sender_id: str = "NEUROFUSION"):
        self.api_key = api_key
        self.sender_id = sender_id

    async def send_sms_otp(self, phone_info: Dict[str, Any], otp: str, expiry_minutes: int) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        if not self.api_key:
            return False, "Fast2SMS API key is not configured.", None

        sms_number = phone_info["digits_10"]
        message = f"NeuroFusion: Your password reset OTP is {otp}. It expires in {expiry_minutes} minutes. Do not share this code with anyone."
        
        headers = {
            "authorization": self.api_key,
            "Content-Type": "application/json"
        }

        # Try OTP route first, with fallback to Quick SMS
        payload = {
            "variables_values": otp,
            "route": "otp",
            "numbers": sms_number
        }

        url = "https://www.fast2sms.com/dev/bulkV2"
        logger.info(f"SMS provider request sent [Fast2SMS] to {phone_info['masked']}...")

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                try:
                    resp_data = response.json()
                except Exception:
                    resp_data = {"raw_text": response.text}

                logger.info(f"SMS provider response received: status={response.status_code}, body={resp_data}")

                if response.status_code == 200 and resp_data.get("return") is True:
                    logger.info("SMS request accepted by Fast2SMS (OTP Route)")
                    return True, "SMS request accepted", resp_data
                
                # If OTP route failed or returned false, attempt GET query param route
                try:
                    get_url = f"https://www.fast2sms.com/dev/bulkV2?authorization={self.api_key.strip()}&route=otp&variables_values={otp}&numbers={sms_number}"
                    get_resp = await client.get(get_url)
                    get_data = get_resp.json() if get_resp.content else {}
                    if get_resp.status_code == 200 and get_data.get("return") is True:
                        logger.info("SMS request accepted by Fast2SMS (GET Route)")
                        return True, "SMS request accepted", get_data
                except Exception:
                    pass

                # If OTP route requires DLT, attempt quick SMS route
                logger.info("Fast2SMS fallback: trying quick SMS route...")
                quick_payload = {
                    "message": message,
                    "language": "english",
                    "route": "q",
                    "numbers": sms_number
                }
                quick_resp = await client.post(url, headers=headers, json=quick_payload)
                try:
                    quick_data = quick_resp.json()
                except Exception:
                    quick_data = {"raw_text": quick_resp.text}

                if quick_resp.status_code == 200 and quick_data.get("return") is True:
                    logger.info("SMS request accepted by Fast2SMS (Quick Route)")
                    return True, "SMS request accepted", quick_data
                
                err_msg = quick_data.get("message", ["SMS provider error"])[0] if isinstance(quick_data.get("message"), list) else quick_data.get("message", "SMS provider error")
                logger.warning(f"Fast2SMS delivery notice: {err_msg}")
                return False, f"Fast2SMS: {err_msg}", quick_data

        except httpx.RequestError as exc:
            logger.error(f"Fast2SMS HTTP connection error: {exc}")
            return False, "Failed to connect to Fast2SMS gateway.", None


class TwilioProvider(BaseSMSProvider):
    """
    Twilio SMS Provider Implementation
    API Docs: https://www.twilio.com/docs/sms/api/message-resource
    """
    provider_name = "twilio"

    def __init__(self, account_sid: str, auth_token: str, from_phone: str):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_phone = from_phone

    async def send_sms_otp(self, phone_info: Dict[str, Any], otp: str, expiry_minutes: int) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        if not self.account_sid or not self.auth_token or not self.from_phone:
            return False, "Twilio credentials (Account SID, Auth Token, From Number) are not configured.", None

        to_number = phone_info["e164"]
        message = f"NeuroFusion: Your password reset OTP is {otp}. It expires in {expiry_minutes} minutes. Do not share this code with anyone."
        
        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
        data = {
            "From": self.from_phone,
            "To": to_number,
            "Body": message
        }

        logger.info(f"SMS provider request sent [Twilio] to {phone_info['masked']}...")

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(url, data=data, auth=(self.account_sid, self.auth_token))
                resp_data = response.json() if response.content else {}
                logger.info(f"SMS provider response received: status={response.status_code}")

                if response.status_code in (200, 201) and resp_data.get("sid"):
                    logger.info(f"SMS request accepted by Twilio, SID: {resp_data.get('sid')}")
                    return True, "SMS request accepted", resp_data
                else:
                    err_msg = resp_data.get("message", f"Twilio HTTP Error {response.status_code}")
                    logger.error(f"Twilio delivery failed: {err_msg}")
                    return False, f"Twilio error: {err_msg}", resp_data

        except httpx.RequestError as exc:
            logger.error(f"Twilio HTTP connection error: {exc}")
            return False, "Failed to connect to Twilio gateway.", None


class MSG91Provider(BaseSMSProvider):
    """
    MSG91 Provider Implementation
    API Docs: https://docs.msg91.com/p/tf9GText/5/msg91-api-reference
    """
    provider_name = "msg91"

    def __init__(self, auth_key: str, template_id: str = ""):
        self.auth_key = auth_key
        self.template_id = template_id

    async def send_sms_otp(self, phone_info: Dict[str, Any], otp: str, expiry_minutes: int) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        if not self.auth_key:
            return False, "MSG91 Auth Key is not configured.", None

        url = "https://control.msg91.com/api/v5/otp"
        params = {
            "authkey": self.auth_key,
            "mobile": phone_info["intl"],
            "otp": otp,
            "otp_expiry": expiry_minutes
        }
        if self.template_id:
            params["template_id"] = self.template_id

        logger.info(f"SMS provider request sent [MSG91] to {phone_info['masked']}...")

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(url, params=params)
                resp_data = response.json() if response.content else {}
                logger.info(f"SMS provider response received: status={response.status_code}")

                if response.status_code == 200 and resp_data.get("type") == "success":
                    logger.info("SMS request accepted by MSG91")
                    return True, "SMS request accepted", resp_data
                else:
                    err_msg = resp_data.get("message", "MSG91 delivery error")
                    logger.error(f"MSG91 delivery failed: {err_msg}")
                    return False, f"MSG91 error: {err_msg}", resp_data

        except httpx.RequestError as exc:
            logger.error(f"MSG91 HTTP connection error: {exc}")
            return False, "Failed to connect to MSG91 gateway.", None


class DevelopmentSMSProvider(BaseSMSProvider):
    """
    Development SMS Provider:
    Safely logs OTP to server console/logger for development and testing
    without external SMS gateway costs or credentials.
    """
    provider_name = "development"

    async def send_sms_otp(self, phone_info: Dict[str, Any], otp: str, expiry_minutes: int) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        logger.info(f"""
============================================================
📱  [DEVELOPMENT ONLY]
SMS Provider: None configured / Development Mode (SMS_MODE=development)
Recipient: {phone_info['display']} ({phone_info['e164']})
Message: NeuroFusion: Your password reset OTP is {otp}.
Expiry: {expiry_minutes} minutes. Do not share this code with anyone.
============================================================
""")
        logger.info("SMS request accepted (Development Mode)")
        return True, "SMS request accepted (Development Mode)", {"mode": "development", "recipient": phone_info["e164"]}


class SMSService:
    """
    Unified SMS Service Manager:
    Selects the configured provider (Fast2SMS, Twilio, MSG91, Development)
    and dispatches OTP messages reliably with Indian mobile number normalization.
    """

    @staticmethod
    def get_provider() -> BaseSMSProvider:
        sms_mode = getattr(settings, "SMS_MODE", "development").lower().strip()
        provider_name = getattr(settings, "SMS_PROVIDER", "development").lower().strip()

        # If explicitly in development mode, return development provider
        if sms_mode == "development" or provider_name in ("development", "dev", "mock", "none", ""):
            # Check if user has provided credentials anyway for testing real SMS
            fast2sms_key = getattr(settings, "FAST2SMS_API_KEY", "") or getattr(settings, "SMS_API_KEY", "")
            twilio_sid = getattr(settings, "TWILIO_ACCOUNT_SID", "")
            msg91_key = getattr(settings, "MSG91_AUTH_KEY", "")

            if provider_name == "fast2sms" and fast2sms_key:
                return Fast2SMSProvider(api_key=fast2sms_key, sender_id=getattr(settings, "SMS_SENDER_ID", "NEUROFUSION"))
            elif provider_name == "twilio" and twilio_sid:
                return TwilioProvider(
                    account_sid=twilio_sid,
                    auth_token=getattr(settings, "TWILIO_AUTH_TOKEN", ""),
                    from_phone=getattr(settings, "TWILIO_PHONE_NUMBER", "")
                )
            elif provider_name == "msg91" and msg91_key:
                return MSG91Provider(auth_key=msg91_key, template_id=getattr(settings, "MSG91_TEMPLATE_ID", ""))
            
            return DevelopmentSMSProvider()

        # Production Mode:
        if provider_name == "fast2sms":
            api_key = getattr(settings, "FAST2SMS_API_KEY", "") or getattr(settings, "SMS_API_KEY", "")
            return Fast2SMSProvider(api_key=api_key, sender_id=getattr(settings, "SMS_SENDER_ID", "NEUROFUSION"))
        elif provider_name == "twilio":
            return TwilioProvider(
                account_sid=getattr(settings, "TWILIO_ACCOUNT_SID", ""),
                auth_token=getattr(settings, "TWILIO_AUTH_TOKEN", ""),
                from_phone=getattr(settings, "TWILIO_PHONE_NUMBER", "")
            )
        elif provider_name == "msg91":
            return MSG91Provider(
                auth_key=getattr(settings, "MSG91_AUTH_KEY", ""),
                template_id=getattr(settings, "MSG91_TEMPLATE_ID", "")
            )
        else:
            # Return development provider as safe fallback with warning
            logger.warning(f"Unknown SMS_PROVIDER '{provider_name}'. Falling back to DevelopmentSMSProvider.")
            return DevelopmentSMSProvider()

    @staticmethod
    async def send_password_reset_otp(phone_raw: str, otp: str, expiry_minutes: int = 10) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Main entry point for dispatching Password Reset OTP via SMS.
        """
        phone_info = parse_and_normalize_indian_phone(phone_raw)
        
        if not phone_info["is_valid"]:
            logger.warning(f"Invalid Indian mobile number supplied: '{phone_raw}'")
            return False, "Invalid mobile number. Please provide a valid 10-digit Indian phone number.", phone_info

        provider = SMSService.get_provider()
        logger.info(f"Using SMS Provider: {provider.provider_name} (Mode: {getattr(settings, 'SMS_MODE', 'development')})")

        success, status_msg, meta = await provider.send_sms_otp(phone_info, otp, expiry_minutes)
        return success, status_msg, phone_info
