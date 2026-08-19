from typing import Optional
from fastapi import APIRouter, Depends, status, Request, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.auth import (
    Token, 
    LoginRequest, 
    GoogleAuthRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    VerifyResetOtpRequest,
    VerifyResetOtpResponse,
    ResendResetOtpRequest,
    ResetPasswordRequest,
    ResetPasswordResponse
)
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import UserService
from app.services.auth_service import AuthService
from app.services.google_auth_service import GoogleAuthService
from app.services.otp_service import OTPService
from app.utils.security import get_current_user, create_access_token
from app.models.user import User
from app.config import settings
from fastapi.responses import RedirectResponse
import urllib.parse

import logging

logger = logging.getLogger("neurofusion.auth_router")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED, summary="Doctor Registration")
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new Doctor user in NeuroFusion AI system.
    Persists into MySQL 'users' table and returns JWT token & user profile.
    """
    logger.info(f"POST /auth/register request received for email: {user_in.email}")
    db_user = await UserService.create(db, obj_in=user_in)
    
    role_str = str(db_user.role)
    access_token = create_access_token(
        subject=str(db_user.id),
        extra_claims={"email": db_user.email, "role": role_str}
    )
    logger.info(f"Generated JWT access token for user ID {db_user.id}")
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(db_user)
    )


@router.post("/login", response_model=Token, summary="User Login")
async def login(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user with credentials and return JWT Access Token.
    Supports both JSON body (`{"email": "...", "password": "..."}`) and Form Data (Swagger UI Authorize button).
    """
    content_type = request.headers.get("content-type", "")
    email = None
    password = None

    if "application/json" in content_type:
        try:
            body = await request.json()
            email = body.get("email") or body.get("username")
            password = body.get("password")
        except Exception:
            pass

    if not email or not password:
        try:
            form = await request.form()
            email = form.get("email") or form.get("username")
            password = form.get("password")
        except Exception:
            pass

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required."
        )

    return await AuthService.login_user(db, email=str(email), password=str(password))


@router.post("/forgot-password", response_model=ForgotPasswordResponse, summary="Request Password Reset OTP")
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Initiates password recovery by generating and dispatching a 6-digit OTP to the registered Email or Phone.
    Maintains strict anti-enumeration: always returns generic message even if account is not found.
    """
    return await OTPService.request_password_reset_otp(
        db,
        contact_type=payload.contact_type,
        contact_value=payload.contact_value
    )


@router.post("/verify-reset-otp", response_model=VerifyResetOtpResponse, summary="Verify Password Reset OTP")
async def verify_reset_otp(
    payload: VerifyResetOtpRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Verifies the 6-digit OTP code against MySQL hashed records.
    Enforces maximum 5 attempts, expiration (10 min), and issues a temporary 15-minute reset_token authorization.
    """
    return await OTPService.verify_reset_otp(
        db,
        contact_value=payload.contact_value,
        entered_otp=payload.otp
    )


@router.post("/resend-reset-otp", response_model=ForgotPasswordResponse, summary="Resend Password Reset OTP")
async def resend_reset_otp(
    payload: ResendResetOtpRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Generates and resends a fresh 6-digit OTP, enforcing a 60-second rate-limiting cooldown.
    """
    return await OTPService.resend_password_reset_otp(
        db,
        contact_value=payload.contact_value
    )


@router.post("/reset-password", response_model=ResetPasswordResponse, summary="Confirm Password Reset")
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Updates the account password in MySQL using verified reset_token authorization.
    Immediately invalidates the token, prevents replay attacks, and preserves user role (Admin/Doctor).
    """
    return await OTPService.reset_password_with_token(
        db,
        reset_token=payload.reset_token,
        new_password=payload.new_password
    )


@router.post("/google", response_model=Token, summary="Google OAuth Sign-In")
async def google_login(
    payload: GoogleAuthRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user with verified Google ID Token or OAuth Authorization Code.
    Returns standard NeuroFusion JWT Access Token & user profile.
    """
    google_info = None
    if payload.credential:
        google_info = await GoogleAuthService.verify_google_id_token(payload.credential)
    elif payload.code:
        google_info = await GoogleAuthService.exchange_code_for_user_info(payload.code)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'credential' (Google ID Token) or 'code' (OAuth Authorization Code) must be provided."
        )

    return await GoogleAuthService.authenticate_google_user(
        db,
        google_info=google_info,
        role_hint=payload.role_hint
    )


@router.get("/google/login", summary="Redirect to Google OAuth Consent Page")
async def google_login_redirect():
    """
    Redirects browser to official Google OAuth 2.0 consent page.
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_ID.strip():
        err_msg = "Google Client ID is not configured on the backend. Please add GOOGLE_CLIENT_ID to backend/.env."
        redirect_url = f"{settings.FRONTEND_URL}/login?error={urllib.parse.quote(err_msg)}"
        return RedirectResponse(url=redirect_url)

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=url)


@router.get("/google/callback", summary="Google OAuth Callback Endpoint")
async def google_login_callback(
    code: Optional[str] = None,
    error: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Callback endpoint for Google OAuth authorization code flow.
    Exchanges code, authenticates user, and redirects to frontend with JWT token.
    """
    if error or not code:
        err_msg = error or "Authorization denied by user."
        redirect_url = f"{settings.FRONTEND_URL}/login?error={urllib.parse.quote(err_msg)}"
        return RedirectResponse(url=redirect_url)

    try:
        google_info = await GoogleAuthService.exchange_code_for_user_info(code)
        token_obj = await GoogleAuthService.authenticate_google_user(db, google_info=google_info)
        
        # Redirect to frontend dashboard with token
        user_json = urllib.parse.quote(token_obj.user.model_dump_json())
        redirect_url = f"{settings.FRONTEND_URL}/login?token={token_obj.access_token}&user={user_json}"
        return RedirectResponse(url=redirect_url)
    except HTTPException as e:
        redirect_url = f"{settings.FRONTEND_URL}/login?error={urllib.parse.quote(e.detail)}"
        return RedirectResponse(url=redirect_url)
    except Exception as e:
        redirect_url = f"{settings.FRONTEND_URL}/login?error={urllib.parse.quote('Google authentication failed.')}"
        return RedirectResponse(url=redirect_url)


@router.get("/me", response_model=UserResponse, summary="Get Current Authenticated User (Protected Route)")
async def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve profile details for currently authenticated user."""
    return current_user
