import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Stethoscope, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ArrowRight 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
];

const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading, authError, clearError } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    password: '',
    confirmPassword: ''
  });

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    gender: false,
    password: false,
    confirmPassword: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Real-time field validation calculations
  const errors = useMemo(() => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // 1. Full Name Validation
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      errs.name = 'Full Name is required.';
    } else if (trimmedName.length < 2) {
      errs.name = 'Full Name must be at least 2 characters.';
    } else if (/^\d+$/.test(trimmedName)) {
      errs.name = 'Full Name cannot contain only numbers.';
    } else if (!/[a-zA-Z]/.test(trimmedName)) {
      errs.name = 'Full Name must contain alphabetic characters.';
    }

    // 2. Email Validation
    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      errs.email = 'Email address is required.';
    } else if (!emailRegex.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address.';
    }

    // 3. Phone Number Validation (India-friendly: 10 digits starting with 6-9)
    const cleanedPhone = formData.phone.replace(/[\s\-\(\)\+]/g, '').replace(/^91/, '');
    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required.';
    } else if (!/^\d{10}$/.test(cleanedPhone)) {
      errs.phone = 'Please enter a valid 10-digit mobile number.';
    } else if (!/^[6-9]/.test(cleanedPhone)) {
      errs.phone = 'Phone number must start with 6, 7, 8, or 9.';
    }

    // 4. Gender Validation
    if (!formData.gender) {
      errs.gender = 'Gender is required.';
    }

    // 5. Password Validation
    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }

    // 6. Confirm Password Validation
    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Confirm password is required.';
    } else if (formData.password && formData.confirmPassword !== formData.password) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    return errs;
  }, [formData]);

  // Overall form validity
  const isFormValid = useMemo(() => {
    return Object.keys(errors).length === 0 &&
      formData.name.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.phone.trim() !== '' &&
      formData.gender !== '' &&
      formData.password !== '' &&
      formData.confirmPassword !== '';
  }, [errors, formData]);

  // Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (authError) clearError();
  };

  // Blur handler to mark field as touched
  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      phone: true,
      gender: true,
      password: true,
      confirmPassword: true
    });

    if (!isFormValid || isLoading) return;

    const cleanedPhone = formData.phone.replace(/[\s\-\(\)\+]/g, '').replace(/^91/, '');
    const formattedPhone = `+91 ${cleanedPhone}`;

    const res = await register({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formattedPhone,
      gender: formData.gender,
      password: formData.password,
      confirm_password: formData.confirmPassword
    });

    if (res?.success) {
      setSuccessMessage('✓ Doctor account created successfully.');
      setTimeout(() => {
        navigate('/');
      }, 1200);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] dark:bg-[#171321] text-[#171321] dark:text-[#F7F7F5] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans transition-colors">
      
      {/* Soft Aurora Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#A78BFA]/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#F0A7C0]/15 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg liquid-glass-card p-6 sm:p-8 rounded-3xl shadow-2xl relative z-10 space-y-6"
      >
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] text-white shadow-lg shadow-purple-500/25">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#171321] dark:text-[#F7F7F5] uppercase">
            CREATE DOCTOR ACCOUNT
          </h1>
          <p className="text-xs text-[#6B6875] dark:text-slate-400 font-medium">
            Register your clinical credentials to access multimodal dementia triage
          </p>
        </div>

        {/* Success Alert */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2.5 font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Error Alert (e.g. Duplicate Email / Duplicate Phone) */}
        <AnimatePresence>
          {authError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start space-x-2.5"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <span className="font-medium">{authError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Full Name */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="name"
                placeholder="Dr. Vineet Mantur"
                value={formData.name}
                onChange={handleChange}
                onBlur={() => handleBlur('name')}
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-900 border text-[#0F172A] dark:text-[#F8FAFC] placeholder-slate-400 focus:outline-none transition ${
                  touched.name && errors.name 
                    ? 'border-red-500 focus:border-red-500 bg-red-50/20' 
                    : 'border-[#CBD5E1] dark:border-slate-700 focus:border-[#2563EB]'
                }`}
              />
            </div>
            {touched.name && errors.name && (
              <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium flex items-center gap-1">
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                name="email"
                placeholder="vineet@example.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-900 border text-[#0F172A] dark:text-[#F8FAFC] placeholder-slate-400 focus:outline-none transition ${
                  touched.email && errors.email 
                    ? 'border-red-500 focus:border-red-500 bg-red-50/20' 
                    : 'border-[#CBD5E1] dark:border-slate-700 focus:border-[#2563EB]'
                }`}
              />
            </div>
            {touched.email && errors.email && (
              <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone Number with India (+91) Prefix */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="flex rounded-xl overflow-hidden shadow-xs border border-[#CBD5E1] dark:border-slate-700 focus-within:border-[#2563EB] transition">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2.5 text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1 border-r border-[#CBD5E1] dark:border-slate-700 shrink-0 select-none">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>+91</span>
              </div>
              <input
                type="tel"
                name="phone"
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
                onBlur={() => handleBlur('phone')}
                disabled={isLoading}
                maxLength={14}
                className={`w-full px-3.5 py-2.5 bg-[#F8FAFC] dark:bg-slate-900 text-[#0F172A] dark:text-[#F8FAFC] placeholder-slate-400 focus:outline-none ${
                  touched.phone && errors.phone ? 'bg-red-50/20' : ''
                }`}
              />
            </div>
            {touched.phone && errors.phone && (
              <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">
                {errors.phone}
              </p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              onBlur={() => handleBlur('gender')}
              disabled={isLoading}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-900 border text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none transition cursor-pointer ${
                touched.gender && errors.gender 
                  ? 'border-red-500 focus:border-red-500 bg-red-50/20' 
                  : 'border-[#CBD5E1] dark:border-slate-700 focus:border-[#2563EB]'
              } ${!formData.gender ? 'text-slate-400' : ''}`}
            >
              <option value="" disabled>Select Gender</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value} value={g.value} className="text-[#0F172A] dark:text-[#F8FAFC]">
                  {g.label}
                </option>
              ))}
            </select>
            {touched.gender && errors.gender && (
              <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">
                {errors.gender}
              </p>
            )}
          </div>

          {/* Password & Confirm Password Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Password */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  disabled={isLoading}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-900 border text-[#0F172A] dark:text-[#F8FAFC] placeholder-slate-400 focus:outline-none transition ${
                    touched.password && errors.password 
                      ? 'border-red-500 focus:border-red-500 bg-red-50/20' 
                      : 'border-[#CBD5E1] dark:border-slate-700 focus:border-[#2563EB]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur('confirmPassword')}
                  disabled={isLoading}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-900 border text-[#0F172A] dark:text-[#F8FAFC] placeholder-slate-400 focus:outline-none transition ${
                    touched.confirmPassword && errors.confirmPassword 
                      ? 'border-red-500 focus:border-red-500 bg-red-50/20' 
                      : 'border-[#CBD5E1] dark:border-slate-700 focus:border-[#2563EB]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Required Fields Note */}
          <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
            * Required fields
          </p>

          {/* Register Button */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full py-3 rounded-xl glass-btn-primary font-bold transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-purple-500/25"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <span>Create Doctor Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        {/* Footer Navigation Link to Login */}
        <div className="pt-2 text-center text-xs text-[#6B6875] dark:text-slate-400 border-t border-purple-100 dark:border-purple-900/30">
          <span>Already registered as Doctor? </span>
          <Link to="/login" className="text-[#7C3AED] dark:text-[#A78BFA] font-bold hover:underline">
            Sign In Here
          </Link>
        </div>

      </motion.div>

    </div>
  );
};

export default Register;
