import axios from 'axios';

// Backend Base URL as specified: http://localhost:8000 or from environment
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Configured Axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes to allow full ML model inference on large EEG/MRI files
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request Interceptor: Attach JWT Bearer Token from localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('neurofusion_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle status codes & structure responses
axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const status = error.response?.status;
    let message = 
      error.response?.data?.detail || 
      error.response?.data?.message;

    if (!message) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
        message = 'Unable to connect to NeuroFusion backend server on http://localhost:8000. Please ensure the FastAPI backend is running.';
      } else {
        message = error.message || 'An unexpected error occurred. Please try again.';
      }
    }

    if (status === 401) {
      localStorage.removeItem('neurofusion_token');
      localStorage.removeItem('neurofusion_refresh_token');
      localStorage.removeItem('neurofusion_user');
    }

    return Promise.reject({
      status,
      message,
      data: error.response?.data
    });
  }
);

// Auth Token Helper Utilities
export const setAuthTokens = ({ token, refreshToken, user }) => {
  if (token) localStorage.setItem('neurofusion_token', token);
  if (refreshToken) localStorage.setItem('neurofusion_refresh_token', refreshToken);
  if (user) localStorage.setItem('neurofusion_user', JSON.stringify(user));
};

export const getAuthToken = () => localStorage.getItem('neurofusion_token');
export const getRefreshToken = () => localStorage.getItem('neurofusion_refresh_token');
export const getStoredUser = () => {
  const user = localStorage.getItem('neurofusion_user');
  return user ? JSON.parse(user) : null;
};
export const clearAuthStorage = () => {
  localStorage.removeItem('neurofusion_token');
  localStorage.removeItem('neurofusion_refresh_token');
  localStorage.removeItem('neurofusion_user');
};

// API Endpoint Helper Methods (Integration ready for backend http://localhost:8000)
export const authApi = {
  login: async (credentials) => {
    // Post to /api/auth/login or /auth/token
    return await axiosInstance.post('/api/auth/login', credentials);
  },
  googleLogin: async (payload) => {
    return await axiosInstance.post('/api/auth/google', payload);
  },
  register: async (userData) => {
    // Post to /api/auth/register
    return await axiosInstance.post('/api/auth/register', userData);
  },
  forgotPassword: async (data) => {
    return await axiosInstance.post('/api/auth/forgot-password', data);
  },
  verifyResetOtp: async (data) => {
    return await axiosInstance.post('/api/auth/verify-reset-otp', data);
  },
  resendResetOtp: async (data) => {
    return await axiosInstance.post('/api/auth/resend-reset-otp', data);
  },
  resetPassword: async (data) => {
    return await axiosInstance.post('/api/auth/reset-password', data);
  },
  getProfile: async () => {
    return await axiosInstance.get('/api/auth/me');
  },
  logout: async () => {
    return await axiosInstance.post('/api/auth/logout');
  }
};

export default axiosInstance;
