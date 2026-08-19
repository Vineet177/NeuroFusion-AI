from typing import Optional, Dict, Any
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.config import settings
from app.models.user import User, UserRole
from app.schemas.auth import Token
from app.schemas.user import UserResponse
from app.utils.security import create_access_token


class GoogleAuthService:
    @staticmethod
    async def verify_google_id_token(id_token_str: str) -> Dict[str, Any]:
        """
        Verifies Google ID token using Google's tokeninfo API and google-auth library.
        Validates issuer, client ID (if configured), expiration, and email verification status.
        """
        if not id_token_str or not id_token_str.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google ID token is required."
            )

        # 1. First attempt verification using google-auth library if installed
        verified_claims: Optional[Dict[str, Any]] = None
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests
            
            # Verify using google-auth
            request = google_requests.Request()
            # If GOOGLE_CLIENT_ID is set in config, enforce audience check; otherwise verify general valid token
            target_audience = settings.GOOGLE_CLIENT_ID if settings.GOOGLE_CLIENT_ID else None
            claims = id_token.verify_oauth2_token(id_token_str, request, audience=target_audience)
            verified_claims = claims
        except Exception:
            # Fallback to HTTP call to Google's official tokeninfo endpoint
            pass

        if not verified_claims:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(
                        "https://oauth2.googleapis.com/tokeninfo",
                        params={"id_token": id_token_str}
                    )
                    if resp.status_code != 200:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unable to verify Google identity token. Token may be invalid or expired."
                        )
                    verified_claims = resp.json()
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Google token verification failed: {str(e)}"
                )

        # 2. Validate Issuer
        iss = verified_claims.get("iss", "")
        if iss not in ["accounts.google.com", "https://accounts.google.com"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Google token issuer: {iss}"
            )

        # 3. Validate Audience if configured
        aud = verified_claims.get("aud", "")
        if settings.GOOGLE_CLIENT_ID and aud != settings.GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google token client ID (aud) does not match application configuration."
            )

        # 4. Validate Email Verification
        email_verified = verified_claims.get("email_verified")
        if email_verified is False or str(email_verified).lower() == "false":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unverified Google email address. Please verify your Google email first."
            )

        email = verified_claims.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google ID token does not contain a valid email address."
            )

        return {
            "sub": verified_claims.get("sub"),
            "email": email.lower(),
            "name": verified_claims.get("name") or email.split("@")[0],
            "picture": verified_claims.get("picture"),
            "given_name": verified_claims.get("given_name"),
            "family_name": verified_claims.get("family_name"),
        }

    @staticmethod
    async def exchange_code_for_user_info(code: str) -> Dict[str, Any]:
        """
        Exchanges an OAuth authorization code for Google user info.
        """
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google OAuth Client credentials not configured on backend."
            )

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                token_resp = await client.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "code": code,
                        "client_id": settings.GOOGLE_CLIENT_ID,
                        "client_secret": settings.GOOGLE_CLIENT_SECRET,
                        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                        "grant_type": "authorization_code"
                    }
                )
                if token_resp.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Failed to exchange authorization code with Google."
                    )
                token_data = token_resp.json()
                id_token_str = token_data.get("id_token")
                if id_token_str:
                    return await GoogleAuthService.verify_google_id_token(id_token_str)

                # Fallback to userinfo API if id_token is not returned
                access_token = token_data.get("access_token")
                userinfo_resp = await client.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                user_info = userinfo_resp.json()
                return {
                    "sub": user_info.get("sub"),
                    "email": user_info.get("email", "").lower(),
                    "name": user_info.get("name"),
                    "picture": user_info.get("picture")
                }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Google OAuth code exchange failed: {str(e)}"
            )

    @staticmethod
    async def authenticate_google_user(
        db: AsyncSession,
        google_info: Dict[str, Any],
        role_hint: Optional[str] = None
    ) -> Token:
        """
        Finds or creates a NeuroFusion user based on verified Google identity information.
        Links existing accounts by email, enforces admin role policies, and returns standard JWT.
        """
        google_id = google_info.get("sub")
        email = google_info.get("email", "").lower()
        name = google_info.get("name") or email.split("@")[0]
        picture = google_info.get("picture")

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Valid email required for Google authentication."
            )

        # 1. Search existing user by google_id
        user: Optional[User] = None
        if google_id:
            res = await db.execute(select(User).where(User.google_id == google_id))
            user = res.scalars().first()

        # 2. Search existing user by email if not found by google_id
        if not user:
            res = await db.execute(select(User).where(User.email == email))
            user = res.scalars().first()
            if user and google_id:
                # Link google_id to existing account
                user.google_id = google_id

        # 3. Create user if no existing user found
        if not user:
            # Enforce security role policy for new Google accounts:
            # Check if email is in ADMIN_EMAIL_WHITELIST
            whitelist = settings.ADMIN_EMAIL_WHITELIST
            if isinstance(whitelist, str):
                whitelist_list = [e.strip().lower() for e in whitelist.split(",") if e.strip()]
            else:
                whitelist_list = [str(e).lower() for e in whitelist]

            if email in whitelist_list:
                assigned_role = UserRole.Admin
            else:
                # Default role for self-registration via Google is Doctor
                assigned_role = UserRole.Doctor

            # If user selected Admin tab in UI but is not authorized in whitelist, raise unauthorized error if strictly required
            if role_hint == "Admin" and assigned_role != UserRole.Admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This Google account is not authorized for Admin access to NeuroFusion. Please contact system administrator."
                )

            user = User(
                name=name,
                email=email,
                google_id=google_id,
                picture=picture,
                password_hash=None,
                role=assigned_role,
                is_active=True,
                is_superuser=(assigned_role == UserRole.Admin)
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            # Update user profile picture if provided
            if picture and user.picture != picture:
                user.picture = picture
                db.add(user)
                await db.commit()
                await db.refresh(user)

        # Check active state
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive account. Please contact system administrator."
            )

        role_str = user.role.value if hasattr(user.role, "value") else str(user.role)

        # Generate NeuroFusion JWT Token
        access_token = create_access_token(
            subject=str(user.id),
            extra_claims={"email": user.email, "role": role_str}
        )

        return Token(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )
