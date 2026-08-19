import axiosInstance from './axios';

/**
 * Frontend Medical File API Client for MRI & EEG Scan Management
 * Connects directly to backend /api/v1/upload endpoints
 */
export const medicalFileApi = {
  // Admin Upload MRI Scan
  uploadMRI: async ({ patientId, file, scanType = 'Structural MRI', scanDate = '', notes = '' }) => {
    const formData = new FormData();
    formData.append('patient_id', patientId);
    formData.append('file', file);
    formData.append('scan_type', scanType);
    if (scanDate) formData.append('scan_date', scanDate);
    if (notes) formData.append('notes', notes);

    try {
      const response = await axiosInstance.post('/api/v1/upload/mri', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response;
    } catch (error) {
      console.error('Error uploading MRI scan to MySQL backend:', error);
      throw error;
    }
  },

  // Admin Upload EEG Signal
  uploadEEG: async ({ patientId, file, recordingType = 'EEG Signal Recording', recordingDate = '', notes = '' }) => {
    const formData = new FormData();
    formData.append('patient_id', patientId);
    formData.append('file', file);
    formData.append('recording_type', recordingType);
    if (recordingDate) formData.append('recording_date', recordingDate);
    if (notes) formData.append('notes', notes);

    try {
      const response = await axiosInstance.post('/api/v1/upload/eeg', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response;
    } catch (error) {
      console.error('Error uploading EEG file to MySQL backend:', error);
      throw error;
    }
  },

  // Get Clinical Upload Stats & Recent Uploads
  getClinicalStats: async () => {
    try {
      const response = await axiosInstance.get('/api/v1/upload/stats');
      return response;
    } catch (error) {
      console.error('Error fetching clinical stats:', error);
      throw error;
    }
  },

  // List recent uploads
  getRecentUploads: async (fileType = '') => {
    try {
      const params = fileType ? { file_type: fileType } : {};
      const response = await axiosInstance.get('/api/v1/upload/recent', { params });
      return response;
    } catch (error) {
      console.error('Error fetching recent uploads:', error);
      throw error;
    }
  },

  // Get patient medical files
  getPatientFiles: async (patientId) => {
    try {
      const response = await axiosInstance.get(`/api/v1/upload/patient/${patientId}`);
      return response;
    } catch (error) {
      console.error(`Error fetching medical files for patient #${patientId}:`, error);
      throw error;
    }
  },

  // Admin delete medical file
  deleteMedicalFile: async (fileId) => {
    try {
      const response = await axiosInstance.delete(`/api/v1/upload/files/${fileId}`);
      return response;
    } catch (error) {
      console.error(`Error deleting medical file #${fileId}:`, error);
      throw error;
    }
  }
};

export default medicalFileApi;
