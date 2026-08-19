import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import LogoutModal from '../components/LogoutModal';
import LogoutTransition from '../components/LogoutTransition';
import { useAuth } from '../hooks/useAuth';
import { MOCK_PATIENTS } from '../utils/constants';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutAnimating, setIsLogoutAnimating] = useState(false);

  const [selectedPatient, setSelectedPatientState] = useState(() => {
    try {
      const saved = localStorage.getItem('neurofusion_active_patient');
      return saved ? JSON.parse(saved) : MOCK_PATIENTS[0];
    } catch (e) {
      return MOCK_PATIENTS[0];
    }
  });

  const setSelectedPatient = (patient) => {
    setSelectedPatientState(patient);
    try {
      if (patient) {
        localStorage.setItem('neurofusion_active_patient', JSON.stringify(patient));
      }
    } catch (e) {}
  };

  const handleInitiateLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Clear authentication state, tokens, user session
      logout();
      localStorage.removeItem('neurofusion_active_patient');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
      setIsLogoutAnimating(true);
    }
  };

  const handleLogoutTransitionComplete = () => {
    setIsLogoutAnimating(false);
    navigate('/', { replace: true });
  };

  return (
    <div className="flex h-screen bg-[#F7F7F5] dark:bg-[#171321] overflow-hidden text-[#171321] dark:text-[#F7F7F5] font-sans relative transition-colors">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onInitiateLogout={handleInitiateLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Navbar */}
        <Navbar 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          selectedPatient={selectedPatient}
          setSelectedPatient={setSelectedPatient}
          onInitiateLogout={handleInitiateLogout}
        />

        {/* Dynamic Page Outlet with Patient Context */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
          <Outlet context={{ selectedPatient, setSelectedPatient }} />
        </main>

      </div>

      {/* Logout Confirmation Dialog Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => !isLoggingOut && setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        isLoggingOut={isLoggingOut}
      />

      {/* Cinematic Logout Deactivation Transition */}
      {isLogoutAnimating && (
        <LogoutTransition
          onComplete={handleLogoutTransitionComplete}
        />
      )}

    </div>
  );
};

export default DashboardLayout;
