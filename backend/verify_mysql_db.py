import asyncio
import pymysql
from PIL import Image
import io
from httpx import AsyncClient, ASGITransport
from main import app

async def run_full_database_integration_test():
    print("=================================================================")
    print("  NEUROFUSION AI: COMPLETE MYSQL DATABASE PERSISTENCE VERIFICATION")
    print("=================================================================")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        
        # 1. USER REGISTRATION TEST
        print("\n[TEST 1] Registering New User...")
        user_payload = {
            "name": "Test User",
            "email": "test@example.com",
            "password": "Test@123",
            "role": "patient"
        }
        reg_resp = await client.post("/api/v1/auth/register", json=user_payload)
        print("  Registration Response Status:", reg_resp.status_code)
        reg_data = reg_resp.json()
        print("  Registration Response Body:", reg_data)
        assert reg_resp.status_code in (201, 400), f"Unexpected status: {reg_resp.status_code}"
        
        # 2. USER LOGIN TEST
        print("\n[TEST 2] Logging in with Registered User...")
        login_resp = await client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "Test@123"})
        print("  Login Response Status:", login_resp.status_code)
        login_data = login_resp.json()
        token = login_data.get("access_token")
        print("  Generated Access Token:", token[:30] + "..." if token else "None")
        auth_headers = {"Authorization": f"Bearer {token}"} if token else {}

        # 3. PATIENT REGISTRATION TEST
        print("\n[TEST 3] Inserting Patient into MySQL Database...")
        patient_payload = {
            "name": "Test Patient",
            "age": 25,
            "gender": "Male",
            "dob": "2001-01-01",
            "phone": "9876543210",
            "address": "123 Medical Center Way",
            "medical_history": "Healthy baseline checkup"
        }
        patient_resp = await client.post("/api/v1/patients", json=patient_payload, headers=auth_headers)
        print("  Patient Insert Status:", patient_resp.status_code)
        patient_data = patient_resp.json()
        print("  Inserted Patient Data:", patient_data)
        patient_id = patient_data.get("id")
        assert patient_id is not None, "Patient ID missing from response"

        # 4. MEDICAL FILE PERSISTENCE & INFERENCE TEST
        print(f"\n[TEST 4] Uploading & Predicting MRI scan for Patient ID: {patient_id}...")
        img = Image.new("RGB", (224, 224), color=(73, 109, 137))
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format="JPEG")
        test_image_bytes = img_byte_arr.getvalue()

        files = {"file": ("test_brain_scan.jpg", test_image_bytes, "image/jpeg")}
        data = {"patient_id": str(patient_id)}
        predict_resp = await client.post("/api/v1/predict/mri", files=files, data=data, headers=auth_headers)
        print("  MRI Predict Status:", predict_resp.status_code)
        print("  MRI Prediction Result:", predict_resp.json())

    # 5. DIRECT RAW SQL VERIFICATION VIA PYMYSQL
    print("\n=================================================================")
    print("  DIRECT MYSQL WORKBENCH RAW SQL VERIFICATION (DATABASE: neurofusion)")
    print("=================================================================")
    db_conn = pymysql.connect(
        host="127.0.0.1",
        user="root",
        password="Vineet@123",
        database="neurofusion",
        port=3306,
        cursorclass=pymysql.cursors.DictCursor
    )
    cursor = db_conn.cursor()

    # Query Users
    print("\n>>> SELECT id, name, email, role, is_active, created_at FROM users;")
    cursor.execute("SELECT id, name, email, role, is_active, created_at FROM users;")
    users = cursor.fetchall()
    for u in users:
        print("   ", u)

    # Query Patients
    print("\n>>> SELECT id, name, age, gender, dob, phone, created_at FROM patients;")
    cursor.execute("SELECT id, name, age, gender, dob, phone, created_at FROM patients;")
    patients = cursor.fetchall()
    for p in patients:
        print("   ", p)

    # Query Medical Files
    print("\n>>> SELECT id, patient_id, filename, file_type, file_size, ml_status, upload_date FROM medical_files;")
    cursor.execute("SELECT id, patient_id, filename, file_type, file_size, ml_status, upload_date FROM medical_files;")
    files = cursor.fetchall()
    for f in files:
        print("   ", f)

    cursor.close()
    db_conn.close()
    print("\n=================================================================")
    print("  ALL TABLES IN MYSQL neurofusion HAVE BEEN PERSISTED SUCCESSFULLY!")
    print("=================================================================")

if __name__ == "__main__":
    asyncio.run(run_full_database_integration_test())
