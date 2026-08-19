import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetails from './pages/PatientDetails';
import UploadMRI from './pages/UploadMRI';
import UploadEEG from './pages/UploadEEG';
import CognitiveTest from './pages/CognitiveTest';
import PredictionResult from './pages/PredictionResult';
import AiReport from './pages/AiReport';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Flagship Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Clinical Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/patients/:id" element={<PatientDetails />} />
              
              {/* MRI & EEG Upload & Analysis Routes */}
              <Route path="/mri-upload" element={<UploadMRI />} />
              <Route path="/mri-analysis" element={<UploadMRI />} />
              <Route path="/upload-mri" element={<UploadMRI />} />
              <Route path="/eeg-upload" element={<UploadEEG />} />
              <Route path="/eeg-analysis" element={<UploadEEG />} />
              <Route path="/upload-eeg" element={<UploadEEG />} />

              {/* Cognitive & Diagnostic Assessment Routes */}
              <Route path="/cognitive-test" element={<CognitiveTest />} />
              <Route path="/cognitive-assessment" element={<CognitiveTest />} />
              <Route path="/prediction-result" element={<PredictionResult />} />
              <Route path="/prediction-result/:id" element={<PredictionResult />} />
              <Route path="/reports" element={<AiReport />} />
              <Route path="/ai-reports" element={<AiReport />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
  );
}

export default App;
