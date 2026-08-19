from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database.session import get_db

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Health Check")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint to verify backend status and database connectivity."""
    db_status = "healthy"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "online",
        "database": db_status,
        "service": "NeuroFusion AI Backend"
    }
