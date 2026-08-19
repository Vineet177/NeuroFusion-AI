import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, setAuthTokens, clearAuthStorage, getStoredUser, getAuthToken } from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser() || null);
  const [token, setToken] = useState(() => getAuthToken() || null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getAuthToken() && !!getStoredUser());
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);


  // Clear global authentication errors
  const clearError = () => setAuthError(null);

  // Login handler
  const login = async (email, password) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await authApi.login({ email, password });
      const authUser = response.user || {
        name: response.name || email.split('@')[0],
        email: email,
        role: response.role || 'Doctor'
      };
      const authToken = response.access_token || response.token;

      setUser(authUser);
      setToken(authToken);
      setIsAuthenticated(true);
      setAuthTokens({ token: authToken, refreshToken: authToken, user: authUser });
      return { success: true };
    } catch (err) {
      console.error('Backend MySQL Login Error:', err);
      const errMsg = err?.message || err?.detail || 'Invalid email or password credentials.';
      setAuthError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Register handler for Doctor accounts (Name, Email, Phone, Gender, Password, Confirm Password)
  const register = async (doctorData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const payload = {
        name: doctorData.name,
        email: doctorData.email,
        phone: doctorData.phone,
        gender: doctorData.gender,
        password: doctorData.password,
        confirm_password: doctorData.confirm_password || doctorData.confirmPassword,
        role: 'Doctor'
      };

      const response = await authApi.register(payload);
      const authUser = response.user || {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        gender: payload.gender,
        role: 'Doctor'
      };
      const authToken = response.access_token || response.token;

      setUser(authUser);
      setToken(authToken);
      setIsAuthenticated(true);
      setAuthTokens({ token: authToken, refreshToken: authToken, user: authUser });
      return { success: true, user: authUser };
    } catch (err) {
      console.error('Backend MySQL Registration Error:', err);
      const errMsg = err?.response?.data?.message || err?.response?.data?.detail || err?.message || err?.detail || 'Registration failed. Please check your credentials.';
      setAuthError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login handler (supports ID Token credential or OAuth code)
  const loginWithGoogle = async (googleCredential, roleHint = 'Doctor') => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const payload = typeof googleCredential === 'string' 
        ? { credential: googleCredential, role_hint: roleHint }
        : { ...googleCredential, role_hint: roleHint };

      const response = await authApi.googleLogin(payload);

      const authUser = response.user || {
        name: 'Google User',
        email: 'user@google.com',
        role: roleHint
      };

      const cleanName = authUser.name || authUser.email.split('@')[0];
      const userObj = {
        ...authUser,
        initials: authUser.initials || cleanName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
        title: authUser.title || (authUser.role === 'Doctor' ? 'Attending Neurologist' : 'System Administrator')
      };

      const authToken = response.access_token || response.token;
      const refreshToken = response.refresh_token || ('refresh_' + Date.now());

      setUser(userObj);
      setToken(authToken);
      setIsAuthenticated(true);
      setAuthTokens({ token: authToken, refreshToken, user: userObj });
      return { success: true, user: userObj };
    } catch (err) {
      console.error('Google login failed:', err);
      const errorMsg = err.message || 'Unable to authenticate with Google. Please try again.';
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Direct Session Setting Handler (for URL token callbacks)
  const setSession = ({ token: authToken, user: authUser }) => {
    const cleanName = authUser.name || authUser.email.split('@')[0];
    const userObj = {
      ...authUser,
      initials: authUser.initials || cleanName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
      title: authUser.title || (authUser.role === 'Doctor' ? 'Attending Neurologist' : 'System Administrator')
    };
    setUser(userObj);
    setToken(authToken);
    setIsAuthenticated(true);
    setAuthTokens({ token: authToken, refreshToken: 'refresh_' + Date.now(), user: userObj });
  };

  // Update user state helper
  const updateUser = (updatedFields) => {
    setUser(prev => {
      if (!prev) return prev;
      const merged = { ...prev, ...updatedFields };
      if (updatedFields.name) {
        merged.initials = updatedFields.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
      }
      localStorage.setItem('neurofusion_user', JSON.stringify(merged));
      return merged;
    });
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    clearAuthStorage();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated, 
      isLoading, 
      authError, 
      setAuthError,
      login, 
      loginWithGoogle,
      setSession,
      updateUser,
      register, 
      logout, 
      clearError 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
