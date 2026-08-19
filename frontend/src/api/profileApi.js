import axiosInstance from './axios';

/**
 * Frontend Profile API Client for Doctor / Neurologist Profile
 * Connects directly to backend /api/v1/profile (and /api/profile)
 */
export const profileApi = {
  // GET /api/v1/profile
  getProfile: async () => {
    try {
      const response = await axiosInstance.get('/api/v1/profile');
      return response;
    } catch (error) {
      console.error('Error fetching doctor profile from MySQL:', error);
      throw error;
    }
  },

  // PUT /api/v1/profile
  updateProfile: async (profileData) => {
    try {
      const response = await axiosInstance.put('/api/v1/profile', profileData);
      return response;
    } catch (error) {
      console.error('Error updating doctor profile in MySQL:', error);
      throw error;
    }
  },

  // POST /api/v1/profile/photo
  uploadPhoto: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axiosInstance.post('/api/v1/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response;
    } catch (error) {
      console.error('Error uploading doctor profile photo:', error);
      throw error;
    }
  },

  // DELETE /api/v1/profile/photo
  removePhoto: async () => {
    try {
      const response = await axiosInstance.delete('/api/v1/profile/photo');
      return response;
    } catch (error) {
      console.error('Error removing doctor profile photo:', error);
      throw error;
    }
  },

  // Experience Endpoints
  addExperience: async (expData) => {
    return await axiosInstance.post('/api/v1/profile/experience', expData);
  },

  deleteExperience: async (expId) => {
    return await axiosInstance.delete(`/api/v1/profile/experience/${expId}`);
  },

  // Education Endpoints
  addEducation: async (eduData) => {
    return await axiosInstance.post('/api/v1/profile/education', eduData);
  },

  deleteEducation: async (eduId) => {
    return await axiosInstance.delete(`/api/v1/profile/education/${eduId}`);
  },

  // Certification Endpoints
  addCertification: async (certData) => {
    return await axiosInstance.post('/api/v1/profile/certifications', certData);
  },

  deleteCertification: async (certId) => {
    return await axiosInstance.delete(`/api/v1/profile/certifications/${certId}`);
  },

  // Security / Password
  changePassword: async (currentPassword, newPassword) => {
    return await axiosInstance.post('/api/v1/profile/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
  }
};

export default profileApi;
