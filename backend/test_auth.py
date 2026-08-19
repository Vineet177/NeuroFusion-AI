import asyncio
import sys
import time
from httpx import AsyncClient, ASGITransport

from main import app
from app.database.session import engine
from app.database.base import Base


async def test_authentication_system():
    print("=== Testing NeuroFusion AI Authentication System ===")

    # Initialize in-memory / test database schema and apply column updates
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        try:
            from sqlalchemy import text
            dialect_name = conn.dialect.name
            if dialect_name == "postgresql":
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);"))
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS picture VARCHAR(512);"))
                await conn.execute(text("ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;"))
            elif dialect_name == "mysql":
                try:
                    await conn.execute(text("ALTER TABLE users ADD COLUMN google_id VARCHAR(255);"))
                except Exception:
                    pass
                try:
                    await conn.execute(text("ALTER TABLE users ADD COLUMN picture VARCHAR(512);"))
                except Exception:
                    pass
                try:
                    await conn.execute(text("ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL;"))
                except Exception:
                    pass
        except Exception:
            pass

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        ts = int(time.time())
        # 1. Register User with Doctor role
        doctor_payload = {
            "name": "Dr. Sarah Connor",
            "email": f"sarah.doctor.{ts}@neurofusion.ai",
            "password": "SecurePassword123!",
            "role": "Doctor"
        }
        print(f"\n1. Registering Doctor: {doctor_payload['email']}...")
        reg_resp = await client.post("/api/v1/auth/register", json=doctor_payload)
        print(f"Status Code: {reg_resp.status_code}")
        print(f"Response: {reg_resp.json()}")
        assert reg_resp.status_code == 201, f"Expected 201, got {reg_resp.status_code}"
        doc_data = reg_resp.json()
        assert doc_data["name"] == doctor_payload["name"]
        assert doc_data["email"] == doctor_payload["email"]
        assert doc_data["role"] == "Doctor"
        assert "id" in doc_data
        assert "password_hash" not in doc_data  # Hashed password should not be exposed in user response schema

        # 2. Register User with Admin role
        admin_payload = {
            "name": "Alice Admin",
            "email": f"admin.{ts}@neurofusion.ai",
            "password": "AdminSuperSecret789!",
            "role": "Admin"
        }
        print(f"\n3. Registering Admin: {admin_payload['email']}...")
        admin_resp = await client.post("/api/v1/auth/register", json=admin_payload)
        assert admin_resp.status_code == 201
        admin_data = admin_resp.json()
        assert admin_data["role"] == "Admin"

        # 4. Duplicate Email Registration Prevention
        print("\n4. Testing Duplicate Email Registration...")
        dup_resp = await client.post("/api/v1/auth/register", json=doctor_payload)
        print(f"Status Code: {dup_resp.status_code}")
        print(f"Response: {dup_resp.json()}")
        assert dup_resp.status_code == 400

        # 5. User Login with JSON payload
        print("\n5. Testing User Login (JSON Payload)...")
        login_payload = {
            "email": doctor_payload["email"],
            "password": "SecurePassword123!"
        }
        login_resp = await client.post("/api/v1/auth/login", json=login_payload)
        print(f"Status Code: {login_resp.status_code}")
        login_data = login_resp.json()
        print(f"Response: {login_data}")
        assert login_resp.status_code == 200
        assert "access_token" in login_data
        assert login_data["token_type"] == "bearer"
        token = login_data["access_token"]

        # 6. User Login with Form Data (Swagger UI format)
        print("\n6. Testing User Login (Form Data for Swagger UI)...")
        form_data = {
            "username": doctor_payload["email"],
            "password": "SecurePassword123!"
        }
        form_login_resp = await client.post("/api/v1/auth/login", data=form_data)
        assert form_login_resp.status_code == 200
        assert "access_token" in form_login_resp.json()

        # 7. User Login Failure with Incorrect Password
        print("\n7. Testing User Login Failure (Wrong Password)...")
        bad_login_resp = await client.post(
            "/api/v1/auth/login",
            json={"email": doctor_payload["email"], "password": "WrongPassword!"}
        )
        print(f"Status Code: {bad_login_resp.status_code}")
        assert bad_login_resp.status_code == 401

        # 8. Test Protected Route (/auth/me) with JWT Token
        print("\n8. Accessing Protected Route /auth/me with JWT Token...")
        headers = {"Authorization": f"Bearer {token}"}
        me_resp = await client.get("/api/v1/auth/me", headers=headers)
        print(f"Status Code: {me_resp.status_code}")
        print(f"Response: {me_resp.json()}")
        assert me_resp.status_code == 200
        me_data = me_resp.json()
        assert me_data["email"] == doctor_payload["email"]
        assert me_data["role"] == "Doctor"


        # 9. Test Protected Route without JWT Token
        print("\n9. Accessing Protected Route /auth/me WITHOUT Token...")
        unauth_resp = await client.get("/api/v1/auth/me")
        assert unauth_resp.status_code == 401

        # 10. Test Google OAuth login endpoint validation
        print("\n10. Testing Google OAuth endpoint with empty payload...")
        google_bad_resp = await client.post("/api/v1/auth/google", json={})
        assert google_bad_resp.status_code == 400

        # 11. Test Google User Account Linking and Authenticate directly
        print("\n11. Testing Google AuthService Account Linking & User Creation...")
        from app.database.session import AsyncSessionLocal
        from app.services.google_auth_service import GoogleAuthService

        async with AsyncSessionLocal() as db_session:
            # Authenticate Google user with same email as doctor registered above
            linked_token = await GoogleAuthService.authenticate_google_user(
                db_session,
                google_info={
                    "sub": f"google_id_{ts}",
                    "email": doctor_payload["email"],
                    "name": doctor_payload["name"],
                    "picture": "https://lh3.googleusercontent.com/a/mock_photo"
                }
            )
            assert linked_token.access_token is not None
            assert linked_token.user.email == doctor_payload["email"]
            assert linked_token.user.google_id == f"google_id_{ts}"
            assert linked_token.user.picture == "https://lh3.googleusercontent.com/a/mock_photo"
            assert linked_token.user.role == "Doctor"  # Pre-existing Doctor role preserved!

            # Attempting to sign in with Admin role hint when not in whitelist must raise HTTP 403 Forbidden!
            new_google_email = f"new.google.{ts}@neurofusion.ai"
            from fastapi import HTTPException
            try:
                await GoogleAuthService.authenticate_google_user(
                    db_session,
                    google_info={
                        "sub": f"google_sub_{ts}",
                        "email": new_google_email,
                        "name": "Dr. New Google User",
                        "picture": "https://lh3.googleusercontent.com/a/mock_photo_2"
                    },
                    role_hint="Admin"
                )
                assert False, "Expected 403 Forbidden for unauthorized Admin request"
            except HTTPException as exc:
                assert exc.status_code == 403
                print("Confirmed: Unauthorized Admin role request correctly rejected with HTTP 403 Forbidden.")

            # Standard Doctor self-registration via Google
            new_google_token = await GoogleAuthService.authenticate_google_user(
                db_session,
                google_info={
                    "sub": f"google_sub_{ts}",
                    "email": new_google_email,
                    "name": "Dr. New Google User",
                    "picture": "https://lh3.googleusercontent.com/a/mock_photo_2"
                },
                role_hint="Doctor"
            )
            assert new_google_token.user.email == new_google_email
            assert new_google_token.user.role == "Doctor"

        print("\n[SUCCESS] All Authentication System & Google OAuth Tests Passed Successfully!")


if __name__ == "__main__":
    asyncio.run(test_authentication_system())
