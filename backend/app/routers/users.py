from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.user import UserResponse, UserUpdate
from app.services.user_service import UserService
from app.utils.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=List[UserResponse], summary="List Users")
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve list of registered users."""
    return await UserService.get_all(db, skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserResponse, summary="Get User by ID")
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch user details by ID."""
    return await UserService.get_by_id(db, user_id=user_id)


@router.put("/{user_id}", response_model=UserResponse, summary="Update User")
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update existing user information."""
    return await UserService.update(db, user_id=user_id, obj_in=user_in)
