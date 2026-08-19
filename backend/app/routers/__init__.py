from app.routers.health import router as health_router
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.patients import router as patients_router
from app.routers.upload import router as upload_router
from app.routers.predict import predict_router
from app.routers.doctor_profile import router as profile_router
from app.routers.admin_doctors import router as admin_doctors_router

__all__ = ["health_router", "auth_router", "users_router", "patients_router", "upload_router", "predict_router", "profile_router", "admin_doctors_router"]



