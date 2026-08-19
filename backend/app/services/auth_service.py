from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.user import User
from app.services.user_service import UserService
from app.utils.security import verify_password, create_access_token
from app.schemas.auth import Token
from app.schemas.user import UserResponse


class AuthService:
    @staticmethod
    async def authenticate(db: AsyncSession, email: str, password: str) -> Optional[User]:
        user = await UserService.get_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    @staticmethod
    async def login_user(db: AsyncSession, email: str, password: str) -> Token:
        user = await AuthService.authenticate(db, email=email, password=password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )

        role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
        access_token = create_access_token(
            subject=str(user.id),
            extra_claims={"email": user.email, "role": role_str}
        )
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )


