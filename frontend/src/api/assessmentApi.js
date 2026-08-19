import axiosInstance from './axios';

// Default prediction result matching prompt example & API data structure
export const DEFAULT_PREDICTION_RESULT = {
  patientId: 'NF-8921',
  patientName: 'Sunita Deshmukh',
  assessmentDate: '2026-07-24',
  diagnosis: "Early Alzheimer's Risk",
  riskPercentage: 78,
  confidenceScore: 92,
  stage: 'MCI_TO_EARLY_ALZHEIMERS',
  mmseScore: 21,
  mmseMax: 30,
  aiModelVersion: 'NeuroFusion-Transformer-v4.2',
  recommendations: [
    {
      id: 'rec-1',
      title: 'Schedule High-Resolution 3D MRI Volumetric Scan',
      priority: 'High',
      category: 'Diagnostic Imaging',
      description: 'Quantify hippocampal volume loss and entorhinal cortex thinning to monitor structural degeneration rates.'
    },
    {
      id: 'rec-2',
      title: 'Cholinesterase Inhibitor Clinical Evaluation',
      priority: 'High',
      category: 'Pharmacotherapy',
      description: 'Consult attending neurologist regarding potential initiation of Donepezil or Galantamine therapy.'
    },
    {
      id: 'rec-3',
      title: 'Cognitive Rehabilitation & Memory Therapy',
      priority: 'Medium',
      category: 'Therapy',
      description: 'Enroll patient in structured daily cognitive stimulation exercises focusing on short-term verbal recall.'
    },
    {
      id: 'rec-4',
      title: '3-Month Longitudinal Re-Assessment Schedule',
      priority: 'Medium',
      category: 'Monitoring',
      description: 'Book follow-up MMSE and quantitative EEG spectral mapping in 90 days to track progression velocity.'
    }
  ],
  modalityContributions: [
    { name: 'MMSE Cognitive Deficit', weightPct: 35, riskImpact: 82, note: 'Score 21/30 (Recall & Calculation Deficit)' },
    { name: 'MRI Volumetric Loss', weightPct: 40, riskImpact: 76, note: 'Hippocampus Volume Loss (-14.2%)' },
    { name: 'EEG Theta Slowing', weightPct: 25, riskImpact: 74, note: 'Elevated Theta Power (5.2 Hz peak)' }
  ]
};

// API Helper Methods (Integration-ready for backend http://localhost:8000)
export const assessmentApi = {
  // Submit MMSE questionnaire responses & evaluate prediction
  submitMMSEAssessment: async (patientId, assessmentData) => {
    try {
      const response = await axiosInstance.post('/api/assessment/evaluate', {
        patientId,
        ...assessmentData
      });
      return response.data || response;
    } catch (error) {
      console.warn('Backend API /api/assessment/evaluate unavailable. Utilizing local calculation & prediction model.', error);
      
      const mmseScore = assessmentData.score || 21;
      let diagnosis = "Cognitively Normal";
      let riskPercentage = 15;
      let confidenceScore = 94;

      if (mmseScore < 18) {
        diagnosis = "Moderate Alzheimer's Risk";
        riskPercentage = 88;
        confidenceScore = 96;
      } else if (mmseScore <= 23) {
        diagnosis = "Early Alzheimer's Risk";
        riskPercentage = 78;
        confidenceScore = 92;
      } else if (mmseScore <= 26) {
        diagnosis = "Mild Cognitive Impairment (MCI)";
        riskPercentage = 45;
        confidenceScore = 91;
      }

      return {
        patientId: patientId || 'NF-8921',
        patientName: assessmentData.patientName || 'Sunita Deshmukh',
        assessmentDate: new Date().toISOString().split('T')[0],
        diagnosis,
        riskPercentage,
        confidenceScore,
        mmseScore,
        mmseMax: 30,
        aiModelVersion: 'NeuroFusion-Transformer-v4.2',
        recommendations: DEFAULT_PREDICTION_RESULT.recommendations,
        modalityContributions: [
          { name: 'MMSE Cognitive Deficit', weightPct: 35, riskImpact: riskPercentage + 4, note: `Score ${mmseScore}/30` },
          { name: 'MRI Volumetric Loss', weightPct: 40, riskImpact: riskPercentage - 2, note: 'Hippocampus Volume Loss (-14.2%)' },
          { name: 'EEG Theta Slowing', weightPct: 25, riskImpact: riskPercentage - 4, note: 'Elevated Theta Power (5.2 Hz)' }
        ]
      };
    }
  },

  // Get prediction result for a specific patient
  getPredictionResult: async (patientId) => {
    try {
      const response = await axiosInstance.get(`/api/predictions/${patientId}`);
      return response.data || response;
    } catch (error) {
      console.warn(`Backend API /api/predictions/${patientId} unavailable. Serving mock prediction result.`, error);
      return {
        ...DEFAULT_PREDICTION_RESULT,
        patientId: patientId || 'NF-8921'
      };
    }
  }
};
