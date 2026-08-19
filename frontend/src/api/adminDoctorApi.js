import axiosInstance from './axios';

/**
 * Frontend Admin Doctor API Client
 * Queries /api/v1/admin/doctors/available directly from MySQL backend
 */
export const adminDoctorApi = {
  // GET /api/v1/admin/doctors/available
  getAvailableDoctors: async ({ specialization = '', availability = '', search = '' } = {}) => {
    try {
      const params = {};
      if (specialization && specialization !== 'All' && specialization !== 'All Specializations') {
        params.specialization = specialization;
      }
      if (availability && availability !== 'All') {
        params.availability = availability;
      }
      if (search) {
        params.search = search;
      }

      const response = await axiosInstance.get('/api/v1/admin/doctors/available', { params });
      return response;
    } catch (error) {
      console.error('Error fetching available doctors from MySQL:', error);
      throw error;
    }
  },

  // GET /api/v1/admin/doctors/:id
  getDoctorDetails: async (doctorId) => {
    try {
      const response = await axiosInstance.get(`/api/v1/admin/doctors/${doctorId}`);
      return response;
    } catch (error) {
      console.error(`Error fetching doctor #${doctorId} details:`, error);
      throw error;
    }
  },

  // PUT /api/v1/admin/doctors/:id/availability
  updateAvailability: async (doctorId, availabilityStatus) => {
    try {
      const response = await axiosInstance.put(`/api/v1/admin/doctors/${doctorId}/availability`, {
        availability_status: availabilityStatus
      });
      return response;
    } catch (error) {
      console.error(`Error updating doctor #${doctorId} availability:`, error);
      throw error;
    }
  },

  // DELETE /api/v1/admin/doctors/:id
  deleteDoctor: async (doctorId) => {
    try {
      const response = await axiosInstance.delete(`/api/v1/admin/doctors/${doctorId}`);
      return response;
    } catch (error) {
      console.error(`Error deleting doctor #${doctorId}:`, error);
      throw error;
    }
  }
};

export default adminDoctorApi;
