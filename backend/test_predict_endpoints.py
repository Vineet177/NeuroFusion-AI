import asyncio
import time
import tempfile
import pytest
import numpy as np
import pandas as pd
from PIL import Image
from httpx import AsyncClient, ASGITransport
from main import app
from app.database.session import engine
from app.database.base import Base


@pytest.mark.asyncio
async def test_predict_endpoints():
    print("=== Testing NeuroFusion AI FastAPI Prediction Endpoints ===")

    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        ts = int(time.time())

        # 1. Register & login user to obtain JWT token
        user_payload = {
            "name": "Dr. Sarah Connor",
            "email": f"dr.sarah.{ts}@neurofusion.ai",
            "password": "SecurePassword123!",
            "role": "Doctor"
        }
        reg_resp = await client.post("/api/v1/auth/register", json=user_payload)
        assert reg_resp.status_code == 201

        login_resp = await client.post("/api/v1/auth/login", json={
            "email": user_payload["email"],
            "password": user_payload["password"]
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Register test patient
        patient_resp = await client.post("/api/v1/patients", json={
            "name": "Sarah Test Patient",
            "age": 68,
            "gender": "Female",
            "medical_history": "Baseline evaluation"
        }, headers=headers)
        assert patient_resp.status_code == 201
        created_pt_id = patient_resp.json()["id"]

        # 3. Test POST /predict/mri
        print("\n1. Testing POST /api/v1/predict/mri...")
        synthetic_mri = np.random.randint(0, 255, (224, 224), dtype=np.uint8)
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_mri:
            Image.fromarray(synthetic_mri).save(tmp_mri.name)
            tmp_mri_path = tmp_mri.name

        try:
            with open(tmp_mri_path, "rb") as f:
                mri_files = {"file": ("test_mri.png", f, "image/png")}
                mri_data_form = {"patient_id": str(created_pt_id)}
                mri_resp = await client.post("/api/v1/predict/mri", files=mri_files, data=mri_data_form, headers=headers)

            print(f"Status Code: {mri_resp.status_code}")
            print(f"Response: {mri_resp.json()}")
            assert mri_resp.status_code == 200
            mri_data = mri_resp.json()
            assert "prediction" in mri_data
            assert "confidence" in mri_data
            assert "probabilities" in mri_data
        finally:
            import os
            if os.path.exists(tmp_mri_path):
                os.remove(tmp_mri_path)

        # 4. Test POST /predict/eeg
        print("\n2. Testing POST /api/v1/predict/eeg...")
        num_samples = 1250
        num_channels = 19
        eeg_array = np.random.randn(num_samples, num_channels).astype(np.float32)
        df_eeg = pd.DataFrame(eeg_array, columns=[f"Ch{i+1}" for i in range(19)])

        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp_eeg:
            df_eeg.to_csv(tmp_eeg.name, index=False)
            tmp_eeg_path = tmp_eeg.name

        try:
            with open(tmp_eeg_path, "rb") as f:
                eeg_files = {"file": ("test_eeg.csv", f, "text/csv")}
                eeg_data_form = {"patient_id": str(created_pt_id)}
                eeg_resp = await client.post("/api/v1/predict/eeg", files=eeg_files, data=eeg_data_form, headers=headers)

            print(f"Status Code: {eeg_resp.status_code}")
            print(f"Response: {eeg_resp.json()}")
            assert eeg_resp.status_code == 200
            eeg_data = eeg_resp.json()
            assert "prediction" in eeg_data
            assert "confidence" in eeg_data
            assert "probabilities" in eeg_data
        finally:
            if os.path.exists(tmp_eeg_path):
                os.remove(tmp_eeg_path)

        # 5. Test POST /predict/multimodal
        print("\n3. Testing POST /api/v1/predict/multimodal...")
        multimodal_data = {
            "mmse_score": "24",
            "moca_score": "21",
            "patient_id": str(created_pt_id)
        }

        multimodal_resp = await client.post(
            "/api/v1/predict/multimodal",
            data=multimodal_data,
            headers=headers
        )
        print(f"Status Code: {multimodal_resp.status_code}")
        print(f"Response: {multimodal_resp.json()}")
        assert multimodal_resp.status_code == 200
        fusion_data = multimodal_resp.json()

        assert "diagnosis" in fusion_data
        assert "risk_level" in fusion_data
        assert "confidence" in fusion_data
        assert "cognitive_scores" in fusion_data
        assert "recommendations" in fusion_data
        assert fusion_data["cognitive_scores"]["mmse"] == 24
        assert fusion_data["cognitive_scores"]["moca"] == 21

        print("\n[SUCCESS] All FastAPI Prediction Endpoints Tested & Verified Successfully!")


if __name__ == "__main__":
    asyncio.run(test_predict_endpoints())
