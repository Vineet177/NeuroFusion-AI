import os
import time
import asyncio
from httpx import AsyncClient, ASGITransport
from main import app
from app.database.session import engine
from app.database.base import Base


async def test_medical_upload_system():
    print("=== Testing NeuroFusion AI Medical Upload System ===")

    # Ensure tables are created
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        ts = int(time.time())
        # 1. Setup Doctor user & token
        doctor_payload = {
            "name": "Dr. Clara Oswald",
            "email": f"dr.clara.{ts}@neurofusion.ai",
            "password": "SecureDoctorPass123!",
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

        # 2. Setup Patient
        patient_payload = {
            "name": "Test Patient Alpha",
            "age": 38,
            "gender": "Female",
            "medical_history": "Routine EEG and MRI neurological assessment."
        }
        patient_resp = await client.post("/api/v1/patients", json=patient_payload, headers=headers)
        assert patient_resp.status_code == 201
        patient_id = patient_resp.json()["id"]

        # 3. Test POST /upload/mri with .jpg file
        print("\n1. Uploading MRI image (.jpg)...")
        jpg_content = b"\xFF\xD8\xFF\xE0\x00\x10JFIF" + b"dummy_mri_jpg_data"
        mri_jpg_resp = await client.post(
            "/api/v1/upload/mri",
            data={"patient_id": patient_id},
            files={"file": ("brain_mri_scan.jpg", jpg_content, "image/jpeg")},
            headers=headers
        )
        print(f"Status Code: {mri_jpg_resp.status_code}")
        print(f"Response: {mri_jpg_resp.json()}")
        assert mri_jpg_resp.status_code == 201
        mri_jpg_data = mri_jpg_resp.json()
        assert mri_jpg_data["file_type"] == "mri"
        assert mri_jpg_data["patient_id"] == patient_id
        assert mri_jpg_data["filename"] == "brain_mri_scan.jpg"
        assert mri_jpg_data["ml_status"] == "PENDING_ANALYSIS"
        assert os.path.exists(mri_jpg_data["file_path"])

        # 4. Test POST /upload/mri with .png file
        print("\n2. Uploading MRI image (.png)...")
        png_content = b"\x89PNG\r\n\x1a\n" + b"dummy_mri_png_data"
        mri_png_resp = await client.post(
            "/api/v1/upload/mri",
            data={"patient_id": patient_id},
            files={"file": ("brain_scan.png", png_content, "image/png")},
            headers=headers
        )
        assert mri_png_resp.status_code == 201
        assert mri_png_resp.json()["filename"] == "brain_scan.png"

        # 5. Test POST /upload/mri with DICOM (.dcm) file
        print("\n3. Uploading DICOM MRI scan (.dcm)...")
        dcm_content = b"\x00" * 128 + b"DICM" + b"dummy_dicom_raw_bytes"
        mri_dcm_resp = await client.post(
            "/api/v1/upload/mri",
            data={"patient_id": patient_id},
            files={"file": ("patient_brain.dcm", dcm_content, "application/dicom")},
            headers=headers
        )
        assert mri_dcm_resp.status_code == 201
        assert mri_dcm_resp.json()["filename"] == "patient_brain.dcm"

        # 6. Test POST /upload/eeg with CSV (.csv) file
        print("\n4. Uploading EEG signal dataset (.csv)...")
        csv_content = b"timestamp,ch1,ch2,ch3,ch4\n0.00,12.4,-3.2,0.1,5.6\n0.01,11.8,-2.9,0.2,5.1\n"
        eeg_csv_resp = await client.post(
            "/api/v1/upload/eeg",
            data={"patient_id": patient_id},
            files={"file": ("eeg_recording_session1.csv", csv_content, "text/csv")},
            headers=headers
        )
        print(f"Status Code: {eeg_csv_resp.status_code}")
        print(f"Response: {eeg_csv_resp.json()}")
        assert eeg_csv_resp.status_code == 201
        eeg_data = eeg_csv_resp.json()
        assert eeg_data["file_type"] == "eeg"
        assert eeg_data["filename"] == "eeg_recording_session1.csv"
        assert os.path.exists(eeg_data["file_path"])

        # 7. Test invalid file extension rejection
        print("\n5. Testing invalid extension rejection (.exe to /upload/mri)...")
        invalid_resp = await client.post(
            "/api/v1/upload/mri",
            data={"patient_id": patient_id},
            files={"file": ("malicious.exe", b"MZdummy", "application/octet-stream")},
            headers=headers
        )
        print(f"Status Code: {invalid_resp.status_code}")
        print(f"Response: {invalid_resp.json()}")
        assert invalid_resp.status_code == 400

        # 8. Test non-existent patient ID
        print("\n6. Testing non-existent patient_id (99999)...")
        bad_patient_resp = await client.post(
            "/api/v1/upload/mri",
            data={"patient_id": 99999},
            files={"file": ("valid_mri.jpg", jpg_content, "image/jpeg")},
            headers=headers
        )
        print(f"Status Code: {bad_patient_resp.status_code}")
        assert bad_patient_resp.status_code == 404

        # 9. Test GET /upload/patient/{patient_id} (List files for patient)
        print(f"\n7. Retrieving medical files for patient {patient_id}...")
        patient_files_resp = await client.get(f"/api/v1/upload/patient/{patient_id}", headers=headers)
        print(f"Status Code: {patient_files_resp.status_code}")
        patient_files = patient_files_resp.json()
        print(f"Found {len(patient_files)} uploaded medical files.")
        assert patient_files_resp.status_code == 200
        assert len(patient_files) == 4  # 3 MRI + 1 EEG

        print("\n[SUCCESS] All Medical File Upload System Tests Passed Successfully!")


if __name__ == "__main__":
    asyncio.run(test_medical_upload_system())
