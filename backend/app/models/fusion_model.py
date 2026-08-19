"""
NeuroFusion AI - Multimodal Decision Fusion Model.
Inference-only multimodal decision fusion combining MRI structural imaging, EEG spectral signals,
and clinical cognitive assessments (MMSE & MoCA) into unified diagnostic intelligence.
"""

import logging
from typing import Dict, Any, List, Optional, Union

# Configure module logger
logger = logging.getLogger("neurofusion.fusion_model")
logger.setLevel(logging.INFO)


class MultimodalFusionModel:
    """
    Inference-Only Decision Fusion Engine.
    Combines MRI structural predictions, EEG temporal predictions, and Mini-Mental (MMSE) / MoCA cognitive scores.
    Determines final diagnosis, overall risk level, overall confidence, and dynamic clinical recommendations.
    """

    CLASS_NAMES = ["Alzheimer", "Healthy", "FTD"]
    
    DISPLAY_DIAGNOSIS_MAP = {
        "Alzheimer": "Alzheimer's Disease",
        "Healthy": "Healthy Control",
        "FTD": "Frontotemporal Dementia"
    }

    def __init__(self, mri_weight: float = 0.45, eeg_weight: float = 0.40, cognitive_weight: float = 0.15):
        """
        Initialize fusion weights.
        
        Args:
            mri_weight: Relative weight for MRI structural probabilities (default: 0.45).
            eeg_weight: Relative weight for EEG spectral probabilities (default: 0.40).
            cognitive_weight: Relative weight for MMSE/MoCA prior probabilities (default: 0.15).
        """
        total = mri_weight + eeg_weight + cognitive_weight
        self.mri_weight = mri_weight / total
        self.eeg_weight = eeg_weight / total
        self.cognitive_weight = cognitive_weight / total
        
        logger.info(
            f"Multimodal Fusion Engine initialized (Weights -> MRI: {self.mri_weight:.2f}, "
            f"EEG: {self.eeg_weight:.2f}, Cognitive: {self.cognitive_weight:.2f})"
        )

    def fuse(
        self,
        mri_prediction: Optional[Dict[str, Any]] = None,
        eeg_prediction: Optional[Dict[str, Any]] = None,
        mmse_score: Optional[Union[int, float]] = None,
        moca_score: Optional[Union[int, float]] = None
    ) -> Dict[str, Any]:
        """
        Executes multimodal probability fusion and recommendation synthesis.
        All input modalities (MRI, EEG, MMSE, MoCA) are fully optional.
        Weights are dynamically rebalanced among the modalities that are provided.
        """
        logger.info("Executing multimodal fusion synthesis...")

        try:
            has_mri = bool(mri_prediction and isinstance(mri_prediction, dict) and "probabilities" in mri_prediction)
            has_eeg = bool(eeg_prediction and isinstance(eeg_prediction, dict) and "probabilities" in eeg_prediction)
            has_cog = (mmse_score is not None) or (moca_score is not None)

            # Determine dynamic active weights
            raw_mri_w = 0.45 if has_mri else 0.0
            raw_eeg_w = 0.40 if has_eeg else 0.0
            raw_cog_w = 0.15 if has_cog else 0.0

            weight_sum = raw_mri_w + raw_eeg_w + raw_cog_w

            if weight_sum > 0:
                mri_w = raw_mri_w / weight_sum
                eeg_w = raw_eeg_w / weight_sum
                cog_w = raw_cog_w / weight_sum
            else:
                # Default fallback equal prior if nothing provided
                mri_w, eeg_w, cog_w = 0.333, 0.333, 0.334

            # 1. Extract MRI Probabilities if present
            mri_probs = self._extract_probabilities(mri_prediction) if has_mri else {}
            
            # 2. Extract EEG Probabilities if present
            eeg_probs = self._extract_probabilities(eeg_prediction) if has_eeg else {}

            # 3. Derive Cognitive Risk Prior from MMSE and/or MoCA if present
            cog_prior = self._compute_cognitive_prior(mmse_score, moca_score) if has_cog else {}

            # 4. Multimodal Probability Weighted Fusion
            fused_probs = {}
            for cls in self.CLASS_NAMES:
                val = 0.0
                if has_mri:
                    val += mri_w * mri_probs.get(cls, 0.33)
                if has_eeg:
                    val += eeg_w * eeg_probs.get(cls, 0.33)
                if has_cog:
                    val += cog_w * cog_prior.get(cls, 0.33)
                
                if not (has_mri or has_eeg or has_cog):
                    val = 0.333

                fused_probs[cls] = val

            # Normalize fused probabilities to sum to 1.0
            prob_sum = sum(fused_probs.values())
            if prob_sum > 0:
                fused_probs = {k: v / prob_sum for k, v in fused_probs.items()}

            # 5. Determine Top Predicted Diagnosis & Confidence
            top_class = max(fused_probs, key=fused_probs.get)
            fused_confidence = float(round(fused_probs[top_class], 4))
            display_diagnosis = self.DISPLAY_DIAGNOSIS_MAP.get(top_class, top_class)

            # 6. Determine Risk Level
            risk_level = self._compute_risk_level(top_class, fused_confidence, mmse_score, moca_score)

            # 7. Generate Dynamic Recommendations based on Diagnosis, MMSE, MoCA, & Confidence
            recommendations = self.generate_recommendations(
                diagnosis=top_class,
                display_diagnosis=display_diagnosis,
                mmse=float(mmse_score) if mmse_score is not None else 24.0,
                moca=float(moca_score) if moca_score is not None else 21.0,
                confidence=fused_confidence,
                mri_pred=mri_prediction if has_mri else None,
                eeg_pred=eeg_prediction if has_eeg else None
            )

            result = {
                "diagnosis": display_diagnosis,
                "risk_level": risk_level,
                "confidence": fused_confidence,
                "mri_prediction": mri_prediction if has_mri else None,
                "eeg_prediction": eeg_prediction if has_eeg else None,
                "cognitive_scores": {
                    "MMSE": int(mmse_score) if mmse_score is not None else None,
                    "MoCA": int(moca_score) if moca_score is not None else None
                },
                "active_weights": {
                    "mri": round(mri_w * 100, 1) if has_mri else 0,
                    "eeg": round(eeg_w * 100, 1) if has_eeg else 0,
                    "cognitive": round(cog_w * 100, 1) if has_cog else 0
                },
                "recommendations": recommendations
            }

            logger.info(f"Multimodal Fusion Complete: {display_diagnosis} | Risk: {risk_level} | Conf: {fused_confidence:.4f}")
            return result

        except Exception as err:
            logger.error(f"Multimodal fusion error: {str(err)}", exc_info=True)
            return {
                "diagnosis": "Uncertain / Clinical Evaluation Required",
                "risk_level": "Undetermined",
                "confidence": 0.0,
                "mri_prediction": mri_prediction,
                "eeg_prediction": eeg_prediction,
                "cognitive_scores": {
                    "MMSE": int(mmse_score) if mmse_score is not None else None,
                    "MoCA": int(moca_score) if moca_score is not None else None
                },
                "recommendations": [
                    "Perform comprehensive clinical consultation with attending neurologist.",
                    "Repeat structural MRI and quantitative EEG testing."
                ]
            }

    def _extract_probabilities(self, pred_dict: Dict[str, Any]) -> Dict[str, float]:
        """Extracts and normalizes probabilities dictionary from individual modality output."""
        if not pred_dict or "probabilities" not in pred_dict:
            return {"Alzheimer": 0.333, "Healthy": 0.333, "FTD": 0.334}

        probs = pred_dict["probabilities"]
        standardized = {}
        for k, v in probs.items():
            k_lower = k.lower()
            if "non" in k_lower or "healthy" in k_lower:
                standardized["Healthy"] = float(v)
            elif "ftd" in k_lower or "frontotemporal" in k_lower:
                standardized["FTD"] = float(v)
            elif "demented" in k_lower or "alzheimer" in k_lower:
                standardized["Alzheimer"] = standardized.get("Alzheimer", 0.0) + float(v)
            else:
                standardized[k] = float(v)

        return standardized

    def _compute_cognitive_prior(self, mmse: Optional[Union[int, float]], moca: Optional[Union[int, float]]) -> Dict[str, float]:
        """
        Derives prior probability distribution based on validated MMSE and/or MoCA diagnostic cutoffs.
        Allows either one or both scores to be passed.
        """
        has_mmse = mmse is not None
        has_moca = moca is not None

        if not has_mmse and not has_moca:
            return {"Alzheimer": 0.33, "Healthy": 0.34, "FTD": 0.33}

        val_mmse = float(mmse) if has_mmse else (float(moca) if has_moca else 24.0)
        val_moca = float(moca) if has_moca else (float(mmse) if has_mmse else 21.0)

        if val_mmse >= 27 and val_moca >= 26:
            return {"Alzheimer": 0.05, "Healthy": 0.85, "FTD": 0.10}
        elif val_mmse >= 21 and val_moca >= 18:
            return {"Alzheimer": 0.55, "Healthy": 0.20, "FTD": 0.25}
        elif val_mmse >= 14:
            return {"Alzheimer": 0.70, "Healthy": 0.05, "FTD": 0.25}
        else:
            return {"Alzheimer": 0.80, "Healthy": 0.02, "FTD": 0.18}

    def _compute_risk_level(self, top_class: str, confidence: float, mmse: Optional[float], moca: Optional[float]) -> str:
        """Calculates risk level string ('Low Risk', 'Moderate Risk', 'High Risk', 'Severe Risk') with optional scores."""
        has_mmse = mmse is not None
        has_moca = moca is not None

        if has_mmse and has_moca:
            cog_deficit_pct = ((30.0 - float(mmse)) / 30.0 * 0.6 + (30.0 - float(moca)) / 30.0 * 0.4) * 100.0
        elif has_mmse:
            cog_deficit_pct = ((30.0 - float(mmse)) / 30.0) * 100.0
        elif has_moca:
            cog_deficit_pct = ((30.0 - float(moca)) / 30.0) * 100.0
        else:
            cog_deficit_pct = 0.0

        if top_class == "Healthy":
            return "Low Risk"
        elif top_class == "Alzheimer":
            risk_pct = min(99, max(70, round(68.0 + cog_deficit_pct * 0.32)))
            return "Severe Risk" if risk_pct >= 85 else "High Risk"
        elif top_class == "FTD":
            return "High Risk"
        return "Moderate Risk"

    def generate_recommendations(
        self,
        diagnosis: str,
        display_diagnosis: str,
        mmse: float,
        moca: float,
        confidence: float,
        mri_pred: Optional[Dict[str, Any]] = None,
        eeg_pred: Optional[Dict[str, Any]] = None
    ) -> List[str]:
        """
        Synthesizes personalized clinical recommendations based on diagnosis, MMSE, MoCA, and confidence.
        """
        recs = []

        # 1. Diagnostic Specific Recommendations
        if diagnosis == "Alzheimer":
            recs.append("Schedule 3.0T volumetric T1 MRI for longitudinal hippocampal atrophy tracking.")
            recs.append("Initiate clinical evaluation for Acetylcholinesterase inhibitors (AChEIs) or NMDA receptor antagonists.")
            recs.append("Recommend structured cognitive stimulation therapy (CST) and daily orientation exercises.")

        elif diagnosis == "FTD":
            recs.append("Schedule specialized FDG-PET imaging to assess frontotemporal hypometabolism.")
            recs.append("Consult behavioral neurology for executive function evaluation and language baseline mapping.")
            recs.append("Implement caregiver support protocols for behavioral management and social cognitive safety.")

        else: # Healthy
            recs.append("Maintain routine annual neuro-cognitive screening and baseline monitoring.")
            recs.append("Promote cardiovascular exercise, Mediterranean diet, and active cognitive engagement.")

        # 2. Score Specific Recommendations (MMSE & MoCA)
        if mmse < 20:
            recs.append(f"MMSE score of {int(mmse)} indicates moderate cognitive deficit; initiate daily caregiver assistance.")
        elif mmse < 25:
            recs.append(f"MMSE score of {int(mmse)} reflects mild cognitive impairment; recommend formal neuropsychological testing.")

        if moca < 22:
            recs.append(f"MoCA score of {int(moca)} flags executive function impairment; assess visuospatial safety.")

        # 3. Missing Modality Guidance
        if not mri_pred:
            recs.append("No MRI scan image was provided for this assessment; consider acquiring a 3D T1 MRI scan for structural atrophy mapping.")
        if not eeg_pred:
            recs.append("No EEG signal recording was provided for this assessment; consider quantitative EEG for spectral slowing analysis.")

        # 4. Confidence & Multimodal Divergence Recommendations
        mri_top = mri_pred.get("prediction", "") if mri_pred else ""
        eeg_top = eeg_pred.get("prediction", "") if eeg_pred else ""

        if mri_top and eeg_top and mri_top != eeg_top:
            recs.append(f"Multimodal discrepancy detected between MRI ({mri_top}) and EEG ({eeg_top}); recommend clinical consensus review.")

        if confidence < 0.70:
            recs.append("Borderline AI confidence score (<70%); schedule follow-up diagnostic validation in 3 months.")

        return recs
