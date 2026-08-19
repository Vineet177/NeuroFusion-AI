import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from './Loader';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <Loader message="Verifying Neural Security Access..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Case-insensitive role-based check
  if (allowedRoles.length > 0 && user?.role) {
    const userRoleStr = String(user.role).trim().toLowerCase();
    const allowedLower = allowedRoles.map(r => String(r).trim().toLowerCase());
    if (!allowedLower.includes(userRoleStr)) {
      return (
        <div className="p-8 rounded-2xl bg-[#FFFFFF] border border-[#E2E8F0] text-center space-y-4 max-w-xl mx-auto my-12 shadow-xs">
          <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 inline-block font-mono text-xs font-bold">
            403 Access Denied: Admin Privilege Required
          </div>
          <h2 className="text-lg font-bold text-[#0F172A]">Insufficient Role Authorization</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Your current account role (<strong>{user.role}</strong>) cannot access data upload or administrative intake pages. Please use the Doctor Clinical Review tools in the sidebar.
          </p>
        </div>
      );
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
