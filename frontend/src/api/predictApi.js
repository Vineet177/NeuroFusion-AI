import axiosInstance from './axios';

/**
 * Frontend Predict API Client for NeuroFusion AI.
 * Handles MRI inference, EEG sequence inference, and Multimodal decision fusion requests.
 * Uses axiosInstance which automatically injects JWT Authorization headers.
 */
export const predictApi = {
  // POST /predict/mri - Accepts File object and optional patientId
  predictMRI: async (file, patientId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (patientId && !isNaN(parseInt(patientId))) {
      formData.append('patient_id', parseInt(patientId));
    }

    try {
      const response = await axiosInstance.post('/api/v1/predict/mri', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response;
    } catch (error) {
      console.error('Error executing MRI prediction:', error);
      throw error;
    }
  },

  // POST /predict/eeg - Accepts File object (.csv, .edf, .set) and optional patientId
  predictEEG: async (file, patientId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (patientId && !isNaN(parseInt(patientId))) {
      formData.append('patient_id', parseInt(patientId));
    }

    try {
      const response = await axiosInstance.post('/api/v1/predict/eeg', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response;
    } catch (error) {
      console.error('Error executing EEG prediction:', error);
      throw error;
    }
  },

  // POST /predict/multimodal - Accepts optional mriFile, eegFile, mmseScore, mocaScore, patientId
  predictMultimodal: async ({ mriFile = null, eegFile = null, mmseScore = null, mocaScore = null, patientId = null }) => {
    const formData = new FormData();
    if (mriFile) formData.append('mri_file', mriFile);
    if (eegFile) formData.append('eeg_file', eegFile);
    if (mmseScore !== null && mmseScore !== undefined && mmseScore !== '' && !isNaN(Number(mmseScore))) {
      formData.append('mmse_score', mmseScore);
    }
    if (mocaScore !== null && mocaScore !== undefined && mocaScore !== '' && !isNaN(Number(mocaScore))) {
      formData.append('moca_score', mocaScore);
    }
    if (patientId && !isNaN(parseInt(patientId))) {
      formData.append('patient_id', parseInt(patientId));
    }

    try {
      const response = await axiosInstance.post('/api/v1/predict/multimodal', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response;
    } catch (error) {
      console.error('Error executing Multimodal fusion prediction:', error);
      throw error;
    }
  }
};
