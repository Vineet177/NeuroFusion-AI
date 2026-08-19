import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, 
  Lock, 
  Mail, 
  AlertCircle, 
  ArrowRight,
  Stethoscope,
  HeartHandshake,
  Shield,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import LoginTransition from '../components/LoginTransition';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, authError, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [selectedRole, setSelectedRole] = useState('Doctor'); // Doctor, Admin
  const [showTransition, setShowTransition] = useState(false);
  const [authenticatedRole, setAuthenticatedRole] = useState('Doctor');

  // Handle Form Inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (authError) clearError();
  };

  // Form Validation Logic
  const validateForm = () => {
    const errors = {};
    const emailRegex = /^\S+@\S+\.\S+$/;

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const res = await login(formData.email, formData.password);
    if (res?.success) {
      const role = res?.user?.role || selectedRole || 'Doctor';
      setAuthenticatedRole(role);
      setShowTransition(true);
    }
  };

  const handleTransitionComplete = () => {
    navigate('/dashboard');
  };

  // Preset Role Switcher
  const selectDemoRole = (roleName) => {
    setSelectedRole(roleName);
    setFormData({
      email: '',
      password: ''
    });
    setFieldErrors({});
    if (authError) clearError();
  };

  // Quick fill helper for convenience
  const quickFillCredentials = (emailPreset, passPreset = 'Password123!') => {
    setFormData({
      email: emailPreset,
      password: passPreset
    });
    setFieldErrors({});
    if (authError) clearError();
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] dark:bg-[#171321] text-[#171321] dark:text-[#F7F7F5] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Soft Aurora Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#A78BFA]/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#F0A7C0]/15 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md liquid-glass-card p-8 rounded-3xl shadow-2xl relative z-10 space-y-6"
      >
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] text-white shadow-lg shadow-purple-500/25">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#171321] dark:text-[#F7F7F5]">
            Neuro<span className="text-[#7C3AED] dark:text-[#A78BFA]">Fusion</span> AI
          </h1>
          <p className="text-xs text-[#6B6875] dark:text-slate-400 font-medium">
            Multimodal Dementia Diagnosis & Clinical Cognitive Platform
          </p>
        </div>

        {/* Preset Role Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-xl bg-purple-500/5 dark:bg-white/5 border border-purple-200/40 dark:border-purple-900/40 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => selectDemoRole('Doctor')}
            className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer ${
              selectedRole === 'Doctor'
                ? 'bg-white dark:bg-purple-900/80 text-[#7C3AED] dark:text-white font-bold shadow-xs border border-purple-200/60 dark:border-purple-500/30'
                : 'text-[#6B6875] dark:text-slate-400 hover:text-[#171321]'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor</span>
          </button>

          <button
            type="button"
            onClick={() => selectDemoRole('Admin')}
            className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer ${
              selectedRole === 'Admin'
                ? 'bg-white dark:bg-purple-900/80 text-[#7C3AED] dark:text-white font-bold shadow-xs border border-purple-200/60 dark:border-purple-500/30'
                : 'text-[#6B6875] dark:text-slate-400 hover:text-[#171321]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Global Auth Error Alert */}
        {authError && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            <span className="font-medium">{authError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Email Field */}
          <div>
            <label className="block text-[#171321] dark:text-slate-200 font-semibold mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border text-[#171321] dark:text-[#F7F7F5] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition ${
                  fieldErrors.email 
                    ? 'border-red-500 focus:border-red-500 bg-red-50/20' 
                    : 'border-purple-200/60 dark:border-purple-900/50 focus:border-[#7C3AED]'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[#171321] dark:text-slate-200 font-semibold">Password</label>
              <Link to="/forgot-password" className="text-[11px] text-[#7C3AED] dark:text-[#A78BFA] font-bold hover:underline cursor-pointer">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full pl-10 pr-11 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border text-[#171321] dark:text-[#F7F7F5] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition ${
                  fieldErrors.password 
                    ? 'border-red-500 focus:border-red-500 bg-red-50/20' 
                    : 'border-purple-200/60 dark:border-purple-900/50 focus:border-[#7C3AED]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] transition cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
                tabIndex="-1"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">{fieldErrors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl glass-btn-primary font-bold transition flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer shadow-md shadow-purple-500/25"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to NeuroFusion</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        {/* Footer Navigation Link to Register */}
        <div className="pt-2 text-center text-xs text-[#6B6875] dark:text-slate-400 border-t border-purple-100 dark:border-purple-900/30">
          <span>Don't have a medical account? </span>
          <Link to="/register" className="text-[#7C3AED] dark:text-[#A78BFA] font-bold hover:underline">
            Register Account
          </Link>
        </div>

      </motion.div>

      {/* Cinematic AI Transition Animation */}
      <AnimatePresence>
        {showTransition && (
          <LoginTransition
            userRole={authenticatedRole}
            onComplete={handleTransitionComplete}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default Login;
