import asyncio
import time
from httpx import AsyncClient, ASGITransport
from main import app
from app.database.session import engine
from app.database.base import Base


async def test_patient_management_system():
    print("=== Testing NeuroFusion AI Patient Management System ===")

    # Ensure tables are created
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        ts = int(time.time())
        # 1. Register & login user to obtain JWT token for protected routes
        doctor_payload = {
            "name": "Dr. Gregory House",
            "email": f"dr.house.{ts}@neurofusion.ai",
            "password": "MedicalSuperPassword123!",
            "role": "Doctor"
        }
        reg_resp = await client.post("/api/v1/auth/register", json=doctor_payload)
        assert reg_resp.status_code == 201

        login_resp = await client.post("/api/v1/auth/login", json={
            "email": doctor_payload["email"],
            "password": doctor_payload["password"]
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Test POST /patients (Create Patient)
        print("\n1. Testing POST /api/v1/patients (Create Patient)...")
        new_patient = {
            "name": "John Doe",
            "age": 45,
            "gender": "Male",
            "dob": "1981-05-15",
            "phone": "+91 98765 43210",
            "address": "402 Marine Drive, Mumbai",
            "medical_history": "Hypertension, mild memory loss, early-stage cognitive assessment pending."
        }
        create_resp = await client.post("/api/v1/patients", json=new_patient, headers=headers)
        print(f"Status Code: {create_resp.status_code}")
        print(f"Response: {create_resp.json()}")
        assert create_resp.status_code == 201
        created_data = create_resp.json()
        assert created_data["name"] == new_patient["name"]
        assert created_data["age"] == new_patient["age"]
        assert created_data["gender"] == new_patient["gender"]
        assert created_data["dob"] == new_patient["dob"]
        assert created_data["phone"] == new_patient["phone"]
        assert created_data["address"] == new_patient["address"]
        assert created_data["medical_history"] == new_patient["medical_history"]
        patient_id = created_data["id"]


        # 3. Test GET /patients (List Patients)
        print(f"\n2. Testing GET /api/v1/patients (List Patients)...")
        list_resp = await client.get("/api/v1/patients", headers=headers)
        print(f"Status Code: {list_resp.status_code}")
        patients_list = list_resp.json()
        print(f"Total Patients Found: {len(patients_list)}")
        assert list_resp.status_code == 200
        assert any(p["id"] == patient_id for p in patients_list)

        # 4. Test GET /patients/{id} (Get Patient by ID)
        print(f"\n3. Testing GET /api/v1/patients/{patient_id}...")
        get_resp = await client.get(f"/api/v1/patients/{patient_id}", headers=headers)
        print(f"Status Code: {get_resp.status_code}")
        print(f"Response: {get_resp.json()}")
        assert get_resp.status_code == 200
        assert get_resp.json()["id"] == patient_id

        # 5. Test PUT /patients/{id} (Update Patient)
        print(f"\n4. Testing PUT /api/v1/patients/{patient_id} (Update Patient)...")
        update_payload = {
            "age": 46,
            "medical_history": "Hypertension under control with medication. Memory scores stabilized."
        }
        put_resp = await client.put(f"/api/v1/patients/{patient_id}", json=update_payload, headers=headers)
        print(f"Status Code: {put_resp.status_code}")
        print(f"Response: {put_resp.json()}")
        assert put_resp.status_code == 200
        updated_data = put_resp.json()
        assert updated_data["age"] == 46
        assert updated_data["medical_history"] == update_payload["medical_history"]

        # 6. Test DELETE /patients/{id} (Delete Patient)
        print(f"\n5. Testing DELETE /api/v1/patients/{patient_id}...")
        del_resp = await client.delete(f"/api/v1/patients/{patient_id}", headers=headers)
        print(f"Status Code: {del_resp.status_code}")
        print(f"Response: {del_resp.json()}")
        assert del_resp.status_code == 200

        # 7. Verify Patient is Deleted (404 Not Found)
        print(f"\n6. Verifying Patient {patient_id} is Deleted (404)...")
        verify_resp = await client.get(f"/api/v1/patients/{patient_id}", headers=headers)
        print(f"Status Code: {verify_resp.status_code}")
        assert verify_resp.status_code == 404

        print("\n[SUCCESS] All Patient Management System Tests Passed Successfully!")


if __name__ == "__main__":
    asyncio.run(test_patient_management_system())
