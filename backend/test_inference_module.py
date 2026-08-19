"""
NeuroFusion AI - Complete ML Inference Module Test Suite.
Tests MRI ResNet18 model, EEG 2-Layer LSTM model, Preprocessing pipelines, and Multimodal Fusion.
"""

import sys
import os
import tempfile
import numpy as np
import pandas as pd
from PIL import Image
import torch

from app.models.preprocessing import (
    load_and_preprocess_mri,
    load_eeg_file,
    bandpass_filter,
    notch_filter,
    normalize_eeg,
    segment_eeg_into_windows,
    preprocess_eeg_pipeline
)
from app.models.mri_model import MRIModel, ResNet18Classifier
from app.models.eeg_model import EEGModel, EEGLSTMClassifier
from app.models.fusion_model import MultimodalFusionModel


def test_mri_preprocessing_and_model():
    print("\n--- 1. Testing MRI Preprocessing & ResNet18 Model ---")
    
    # Generate synthetic 224x224 grayscale MRI test image
    synthetic_mri = np.random.randint(0, 255, (224, 224), dtype=np.uint8)
    
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_file:
        tmp_mri_path = tmp_file.name
        Image.fromarray(synthetic_mri).save(tmp_mri_path)

    try:
        # Preprocessing test
        tensor_batch = load_and_preprocess_mri(tmp_mri_path)
        print(f"[SUCCESS] MRI Preprocessed Tensor Shape: {tensor_batch.shape}")
        assert tensor_batch.shape == (1, 3, 224, 224)

        # ResNet18 Architecture Test
        model_arch = ResNet18Classifier(num_classes=3)
        logits = model_arch(tensor_batch)
        print(f"[SUCCESS] ResNet18 Forward Pass Output Shape: {logits.shape}")
        assert logits.shape == (1, 3)

        # MRI Model Inference Wrapper Test
        mri_evaluator = MRIModel()
        mri_result = mri_evaluator.predict(tmp_mri_path)
        print(f"[SUCCESS] MRI Prediction Result: {mri_result}")

        assert "prediction" in mri_result
        assert "confidence" in mri_result
        assert "probabilities" in mri_result
        for label in mri_evaluator.CLASS_MAPPING.values():
            assert label in mri_result["probabilities"]

        print("[PASSED] MRI Preprocessing & Model Test")
        return mri_result

    finally:
        if os.path.exists(tmp_mri_path):
            os.remove(tmp_mri_path)


def test_eeg_preprocessing_and_model():
    print("\n--- 2. Testing EEG Preprocessing & 2-Layer LSTM Model ---")

    # Generate synthetic 19-channel EEG signal CSV (1250 samples = 5 sec @ 250Hz)
    num_samples = 1250
    num_channels = 19
    t = np.linspace(0, 5, num_samples)
    
    # Create multi-frequency signals across 19 channels
    eeg_data = np.zeros((num_samples, num_channels), dtype=np.float32)
    for c in range(num_channels):
        eeg_data[:, c] = np.sin(2 * np.pi * 10 * t + c) + 0.5 * np.sin(2 * np.pi * 50 * t) + np.random.randn(num_samples) * 0.1

    col_names = [f"EEG_Ch{i+1}" for i in range(num_channels)]
    df = pd.DataFrame(eeg_data, columns=col_names)

    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp_file:
        tmp_eeg_path = tmp_file.name
        df.to_csv(tmp_eeg_path, index=False)

    try:
        # Preprocessing test
        loaded_data = load_eeg_file(tmp_eeg_path)
        print(f"[SUCCESS] Loaded EEG Raw Array Shape: {loaded_data.shape}")
        assert loaded_data.shape == (num_samples, num_channels)

        bp_filtered = bandpass_filter(loaded_data, lowcut=0.5, highcut=45.0, fs=250.0)
        notch_filtered = notch_filter(bp_filtered, freq=50.0, fs=250.0)
        norm_data = normalize_eeg(notch_filtered)
        windows = segment_eeg_into_windows(norm_data, window_size=500, overlap=250)
        print(f"[SUCCESS] EEG Windows Shape: {windows.shape}")
        assert windows.shape[1] == 500
        assert windows.shape[2] == 19

        # Pipeline test
        pipeline_tensor = preprocess_eeg_pipeline(tmp_eeg_path)
        print(f"[SUCCESS] Pipeline Output Tensor Shape: {pipeline_tensor.shape}")

        # LSTM Architecture Test
        lstm_arch = EEGLSTMClassifier(in_channels=19, num_classes=3)
        logits = lstm_arch(pipeline_tensor)
        print(f"[SUCCESS] LSTM Forward Pass Output Shape: {logits.shape}")
        assert logits.shape == (pipeline_tensor.shape[0], 3)

        # EEG Model Inference Wrapper Test
        eeg_evaluator = EEGModel()
        eeg_result = eeg_evaluator.predict(tmp_eeg_path)
        print(f"[SUCCESS] EEG Prediction Result: {eeg_result}")

        assert "prediction" in eeg_result
        assert "confidence" in eeg_result
        assert "probabilities" in eeg_result
        assert "Alzheimer" in eeg_result["probabilities"]
        assert "Healthy" in eeg_result["probabilities"]
        assert "FTD" in eeg_result["probabilities"]
        assert eeg_result["signal_info"]["processed_sampling_frequency"] == 250.0
        assert eeg_result["signal_info"]["original_sampling_frequency"] > 0.0
        assert eeg_result["signal_info"]["num_channels"] == 19
        assert "frequency_analysis" in eeg_result
        bands = eeg_result["frequency_analysis"]["frequency_bands"]
        for b_name in ["Delta", "Theta", "Alpha", "Beta", "Gamma"]:
            assert b_name in bands
            assert "range" in bands[b_name]
            assert "relative_power" in bands[b_name]
            assert "absolute_power" in bands[b_name]

        print("[PASSED] EEG Preprocessing & Model Test")
        return eeg_result

    finally:
        if os.path.exists(tmp_eeg_path):
            os.remove(tmp_eeg_path)


def test_multimodal_fusion(mri_res, eeg_res):
    print("\n--- 3. Testing Multimodal Decision Fusion ---")
    
    fusion_engine = MultimodalFusionModel()
    
    mmse = 24
    moca = 21

    # Case A: Full Modalities Present
    fusion_result_full = fusion_engine.fuse(
        mri_prediction=mri_res,
        eeg_prediction=eeg_res,
        mmse_score=mmse,
        moca_score=moca
    )
    print(f"[SUCCESS] Full Fusion Result: Diagnosis = {fusion_result_full['diagnosis']}, Risk = {fusion_result_full['risk_level']}")
    assert fusion_result_full["active_weights"]["mri"] > 0
    assert fusion_result_full["active_weights"]["eeg"] > 0
    assert fusion_result_full["active_weights"]["cognitive"] > 0

    # Case B: Optional MRI Missing (Only EEG + Cognitive Scores)
    fusion_result_no_mri = fusion_engine.fuse(
        mri_prediction=None,
        eeg_prediction=eeg_res,
        mmse_score=mmse,
        moca_score=moca
    )
    print(f"[SUCCESS] No-MRI Fusion Result: Diagnosis = {fusion_result_no_mri['diagnosis']}, Weights = {fusion_result_no_mri['active_weights']}")
    assert fusion_result_no_mri["mri_prediction"] is None
    assert fusion_result_no_mri["active_weights"]["mri"] == 0
    assert fusion_result_no_mri["active_weights"]["eeg"] > 0
    assert fusion_result_no_mri["active_weights"]["cognitive"] > 0

    # Case C: Only Cognitive Scores Present (No MRI, No EEG)
    fusion_result_cog_only = fusion_engine.fuse(
        mri_prediction=None,
        eeg_prediction=None,
        mmse_score=mmse,
        moca_score=moca
    )
    print(f"[SUCCESS] Cognitive-Only Fusion Result: Weights = {fusion_result_cog_only['active_weights']}")
    assert fusion_result_cog_only["mri_prediction"] is None
    assert fusion_result_cog_only["eeg_prediction"] is None
    assert fusion_result_cog_only["active_weights"]["mri"] == 0
    assert fusion_result_cog_only["active_weights"]["eeg"] == 0
    assert fusion_result_cog_only["active_weights"]["cognitive"] == 100.0

    print("[PASSED] Multimodal Decision Fusion Test (All Optional Modality Combinations Verified)")


if __name__ == "__main__":
    print("==================================================")
    print("   NEUROFUSION AI - ML INFERENCE MODULE TEST SUITE")
    print("==================================================")
    
    mri_res = test_mri_preprocessing_and_model()
    eeg_res = test_eeg_preprocessing_and_model()
    test_multimodal_fusion(mri_res, eeg_res)

    print("\n==================================================")
    print("   [ALL ML INFERENCE MODULE TESTS PASSED 100%]")
    print("==================================================")
