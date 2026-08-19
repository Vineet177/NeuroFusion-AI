"""
NeuroFusion AI - MRI Image Classifier (ResNet50 Architecture).
Performs inference on 3D/2D Brain MRI scans for dementia classification.
Target classes: Mild Demented, Moderate Demented, Non Demented, Very Mild Demented.
"""

import os
import logging
from pathlib import Path
from typing import Dict, Union, Any, Optional

import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models

from app.models.preprocessing import load_and_preprocess_mri

# Configure module logger
logger = logging.getLogger("neurofusion.mri_model")
logger.setLevel(logging.INFO)


def create_resnet50_model(num_classes: int = 4) -> nn.Module:
    """Creates ResNet50 model matching exact checkpoint layer layout."""
    model = models.resnet50(weights=None)
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)
    return model

ResNet50Classifier = create_resnet50_model
ResNet18Classifier = create_resnet50_model


class MRIModel:
    """
    Production Inference Wrapper for MRI ResNet50 Classifier.
    Manages weight loading, hardware acceleration (CPU/CUDA), and prediction formatting.
    """

    CLASS_MAPPING = {
        0: "Mild Demented",
        1: "Moderate Demented",
        2: "Non Demented",
        3: "Very Mild Demented"
    }

    DEFAULT_WEIGHTS_RELATIVE_PATH = Path("app") / "trained_models" / "dementia_resnet18.pth"

    def __init__(self, weights_path: Optional[Union[str, Path]] = None, device: Optional[str] = None):
        """
        Initialize MRI Classifier and load trained weights.
        
        Args:
            weights_path: Path to dementia_resnet18.pth weights file.
            device: Hardware device ('cuda', 'cpu', or None for auto-detection).
        """
        if device:
            self.device = torch.device(device)
        else:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            
        logger.info(f"MRIModel executing on device: {self.device}")

        # Initialize ResNet50 network architecture matching exact checkpoint layer layout
        self.num_classes = len(self.CLASS_MAPPING)
        self.model = create_resnet50_model(num_classes=self.num_classes).to(self.device)
        self.is_weights_loaded = False

        # Determine weight file path
        if weights_path:
            self.weights_path = Path(weights_path)
        else:
            base_dir = Path(__file__).resolve().parent.parent.parent
            default_path = base_dir / self.DEFAULT_WEIGHTS_RELATIVE_PATH
            if default_path.exists():
                self.weights_path = default_path
            elif Path("app/trained_models/dementia_resnet18.pth").exists():
                self.weights_path = Path("app/trained_models/dementia_resnet18.pth")
            elif Path("backend/app/trained_models/dementia_resnet18.pth").exists():
                self.weights_path = Path("backend/app/trained_models/dementia_resnet18.pth")
            else:
                self.weights_path = default_path

        # Load trained weights into model
        self.load_model(self.weights_path)

    def load_model(self, weights_path: Union[str, Path]) -> bool:
        target_path = Path(weights_path)
        logger.info(f"Attempting to load MRI ResNet50 weights from: {target_path}")

        if not target_path.exists():
            msg = f"[WARNING] MRI ResNet50 model weights file not found at '{target_path}'."
            print(msg)
            logger.warning(msg)
            self.model.eval()
            self.is_weights_loaded = False
            return False

        try:
            checkpoint = torch.load(target_path, map_location=self.device)

            if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
                state_dict = checkpoint["state_dict"]
            elif isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
                state_dict = checkpoint["model_state_dict"]
            elif isinstance(checkpoint, dict):
                state_dict = checkpoint
            else:
                state_dict = checkpoint.state_dict() if hasattr(checkpoint, "state_dict") else checkpoint

            # Load state dict strictly into ResNet50 model
            self.model.load_state_dict(state_dict, strict=True)
            self.model.to(self.device)
            self.model.eval()
            
            for param in self.model.parameters():
                param.requires_grad = False

            self.is_weights_loaded = True
            success_msg = f"[SUCCESS] MRI ResNet50 model weights loaded cleanly from '{target_path}'."
            print(success_msg)
            logger.info(success_msg)
            return True

        except Exception as err:
            err_msg = f"[ERROR] Failed to load MRI ResNet50 weights from '{target_path}': {err}"
            print(err_msg)
            logger.error(err_msg, exc_info=True)
            self.model.eval()
            self.is_weights_loaded = False
            return False


    @torch.no_grad()
    def predict(self, image_path: Union[str, Path, bytes, Any]) -> Dict[str, Any]:
        """
        Executes end-to-end inference on input MRI image file.
        
        Args:
            image_path: Path to MRI image file (.jpg, .png, .dcm), bytes, or PIL Image.
            
        Returns:
            Dict matching required schema:
            {
                "prediction": "Non Demented" | "Mild Demented" | "Moderate Demented" | "Very Mild Demented",
                "confidence": 0.95,
                "probabilities": {
                    "Mild Demented": 0.02,
                    "Moderate Demented": 0.01,
                    "Non Demented": 0.95,
                    "Very Mild Demented": 0.02
                }
            }
        """
        logger.info("Executing MRI ResNet50 model inference...")

        try:
            # 1. Preprocess MRI image into PyTorch tensor (1, 3, 224, 224)
            tensor_batch = load_and_preprocess_mri(image_path).to(self.device)

            # 2. Forward pass through ResNet50
            self.model.eval()
            logits = self.model(tensor_batch)

            # 3. Softmax probability activation
            probabilities_tensor = F.softmax(logits, dim=1).squeeze(0) # Shape: (num_classes,)

            # 4. Extract class probabilities
            probs_np = probabilities_tensor.cpu().numpy()
            
            probabilities_dict = {}
            for idx, label in self.CLASS_MAPPING.items():
                if idx < len(probs_np):
                    probabilities_dict[label] = float(round(probs_np[idx], 4))
                else:
                    probabilities_dict[label] = 0.0

            # Determine top predicted class index and confidence
            top_class_idx = int(torch.argmax(probabilities_tensor).item())
            predicted_class_name = self.CLASS_MAPPING.get(top_class_idx, "Non Demented")
            confidence_score = float(round(probs_np[top_class_idx], 4))

            result = {
                "prediction": predicted_class_name,
                "confidence": confidence_score,
                "probabilities": probabilities_dict
            }

            logger.info(f"MRI Prediction complete: {predicted_class_name} (Confidence: {confidence_score:.4f})")
            return result

        except Exception as err:
            logger.error(f"MRI prediction error: {str(err)}", exc_info=True)
            # Return graceful error schema rather than unhandled exception
            return {
                "prediction": "Error",
                "confidence": 0.0,
                "probabilities": {
                    "Mild Demented": 0.0,
                    "Moderate Demented": 0.0,
                    "Non Demented": 0.0,
                    "Very Mild Demented": 0.0
                },
                "error_message": str(err)
            }
