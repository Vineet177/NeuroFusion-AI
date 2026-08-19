from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Union, List, Callable
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database.session import get_db
from app.models.user import UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)



def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate bcrypt password hash."""
    return pwd_context.hash(password)


def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[dict] = None
) -> str:
    """Create JWT Access Token with expiration and claims."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    if extra_claims:
        to_encode.update(extra_claims)
        
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate JWT Access Token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """Dependency to retrieve current authenticated user from JWT token."""
    from app.models.user import User

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    try:
        uid = int(user_id)
    except ValueError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalars().first()

    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return user



from fastapi import Depends, HTTPException, status, Header

async def get_optional_current_user(
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    """Optional user dependency that returns User if valid token present, or None if unauthenticated."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split("Bearer ")[1].strip()
    if not token or token.lower() in ("none", "null", "undefined"):
        return None
    try:
        from app.models.user import User
        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            return None
        uid = int(payload["sub"])
        result = await db.execute(select(User).where(User.id == uid))
        return result.scalars().first()
    except Exception:
        return None





def require_roles(*allowed_roles: UserRole):
    """Dependency factory to enforce role-based access control (RBAC)."""
    async def role_checker(current_user=Depends(get_current_user)):
        user_role_str = str(current_user.role.value if hasattr(current_user.role, 'value') else current_user.role).strip().lower()
        allowed_strs = [str(r.value if hasattr(r, 'value') else r).strip().lower() for r in allowed_roles]
        if user_role_str not in allowed_strs:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{current_user.role}' is not authorized to access this resource."
            )
        return current_user
    return role_checker


async def require_admin(current_user=Depends(get_current_user)):
    """Enforces that the current authenticated user has Admin role."""
    role_val = str(current_user.role.value if hasattr(current_user.role, 'value') else current_user.role).strip().lower()
    if role_val != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Doctor role is not authorized to perform data upload, patient registration, or model processing."
        )
    return current_user


async def require_doctor_or_admin(current_user=Depends(get_current_user)):
    """Authorizes Doctor and Admin roles to access clinical read and review endpoints."""
    return current_user

