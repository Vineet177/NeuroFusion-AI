import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  KeyRound, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { authApi } from '../api/axios';

const ForgotPassword = () => {
  const navigate = useNavigate();

  // Current Step: 'CONTACT' | 'OTP' | 'PASSWORD' | 'SUCCESS'
  const [step, setStep] = useState('CONTACT');

  // Contact Method: 'email' | 'phone'
  const [contactType, setContactType] = useState('email');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  
  // State for OTP & Verification
  const [maskedContact, setMaskedContact] = useState('');
  const [activeContactValue, setActiveContactValue] = useState('');
  const [otpValue, setOtpValue] = useState(['', '', '', '', '', '']);
  const [devOtpHint, setDevOtpHint] = useState(null);
  const otpInputRefs = useRef([]);
  const [resetToken, setResetToken] = useState('');

  // Timers: 10 minutes OTP expiry countdown (600s), 60 seconds resend cooldown (60s)
  const [expirySeconds, setExpirySeconds] = useState(600); // 10 mins
  const [resendCooldown, setResendCooldown] = useState(60); // 60s cooldown

  // New Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // 10-minute expiry timer ticker
  useEffect(() => {
    let interval = null;
    if (step === 'OTP' && expirySeconds > 0) {
      interval = setInterval(() => {
        setExpirySeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, expirySeconds]);

  // 60-second resend cooldown timer ticker
  useEffect(() => {
    let interval = null;
    if (step === 'OTP' && resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendCooldown]);

  // Format MM:SS for countdown timer
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // STEP 1: REQUEST OTP (Email or Phone)
  // -------------------------------------------------------------
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    let contactVal = '';
    const errs = {};

    if (contactType === 'email') {
      const emailTrim = emailInput.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailTrim) {
        errs.email = 'Email address is required.';
      } else if (!emailRegex.test(emailTrim)) {
        errs.email = 'Please enter a valid email address.';
      }
      contactVal = emailTrim.toLowerCase();
    } else {
      const cleanedPhone = phoneInput.replace(/[\s\-\(\)\+]/g, '').replace(/^91/, '');
      if (!phoneInput.trim()) {
        errs.phone = 'Phone number is required.';
      } else if (!/^\d{10}$/.test(cleanedPhone)) {
        errs.phone = 'Please enter a valid 10-digit mobile number.';
      } else if (!/^[6-9]/.test(cleanedPhone)) {
        errs.phone = 'Phone number must start with 6, 7, 8, or 9.';
      }
      contactVal = `+91${cleanedPhone}`;
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword({
        contact_type: contactType,
        contact_value: contactVal
      });

      setActiveContactValue(contactVal);
      const masked = res?.masked_contact || res?.data?.masked_contact || (contactType === 'email' ? 'your registered email' : 'your registered phone');
      setMaskedContact(masked);
      
      const otpCode = res?.dev_otp || res?.data?.dev_otp;
      if (otpCode) {
        setDevOtpHint(String(otpCode));
      }

      setExpirySeconds(600); // 10 minutes
      setResendCooldown(60); // 60 seconds
      setOtpValue(['', '', '', '', '', '']);
      setStep('OTP');
    } catch (err) {
      console.error('Request OTP Error:', err);
      const msg = err?.detail || err?.message || err?.response?.data?.message || err?.response?.data?.detail || 'Failed to send verification code. Please try again.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 2: RESEND OTP
  // -------------------------------------------------------------
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await authApi.resendResetOtp({
        contact_value: activeContactValue
      });
      const otpCode = res?.dev_otp || res?.data?.dev_otp;
      if (otpCode) {
        setDevOtpHint(String(otpCode));
      }
      setResendCooldown(60);
      setExpirySeconds(600);
      setOtpValue(['', '', '', '', '', '']);
    } catch (err) {
      console.error('Resend OTP Error:', err);
      const msg = err?.detail || err?.message || err?.response?.data?.message || err?.response?.data?.detail || 'Failed to resend code. Please wait a moment.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Box inputs handler
  const handleOtpDigitChange = (index, val) => {
    if (!/^\d*$/.test(val)) return;

    const newOtp = [...otpValue];
    newOtp[index] = val.slice(-1); // Take last char if pasted
    setOtpValue(newOtp);
    setErrorMsg(null);

    // Auto-focus next input
    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValue[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split('');
      setOtpValue(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  // -------------------------------------------------------------
  // STEP 2: VERIFY OTP
  // -------------------------------------------------------------
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const fullOtp = otpValue.join('');
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }

    if (expirySeconds <= 0) {
      setErrorMsg('This verification code has expired. Please request a new OTP.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.verifyResetOtp({
        contact_value: activeContactValue,
        otp: fullOtp
      });

      if (res?.data?.reset_token) {
        setResetToken(res.data.reset_token);
        setStep('PASSWORD');
      } else {
        setErrorMsg('Invalid verification response from server.');
      }
    } catch (err) {
      console.error('Verify OTP Error:', err);
      const msg = err?.response?.data?.message || err?.response?.data?.detail || 'Invalid verification code. Please try again.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 3: CREATE NEW PASSWORD
  // -------------------------------------------------------------
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    const errs = {};
    if (!newPassword) {
      errs.newPassword = 'Password is required.';
    } else if (newPassword.length < 8) {
      errs.newPassword = 'Password must contain at least 8 characters.';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm password is required.';
    } else if (newPassword && newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        reset_token: resetToken,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      setStep('SUCCESS');
    } catch (err) {
      console.error('Reset Password Error:', err);
      const msg = err?.response?.data?.message || err?.response?.data?.detail || 'Failed to update password. Please request a new OTP.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
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
        key={step}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md liquid-glass-card p-6 sm:p-8 rounded-3xl shadow-2xl relative z-10 space-y-6"
      >
        
        {/* ========================================================= */}
        {/* STEP 1: SELECT METHOD & ENTER CONTACT                    */}
        {/* ========================================================= */}
        {step === 'CONTACT' && (
          <>
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] text-white shadow-lg shadow-purple-500/25">
                <KeyRound className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#171321] dark:text-[#F7F7F5] uppercase">
                RESET YOUR PASSWORD
              </h1>
              <p className="text-xs text-[#6B6875] dark:text-slate-400 font-medium">
                Choose how you want to receive your OTP
              </p>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
              
              {/* Option Selector: Email / Phone */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => { setContactType('email'); setErrorMsg(null); setFieldErrors({}); }}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition cursor-pointer ${
                    contactType === 'email'
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-[#7C3AED] text-[#7C3AED] dark:text-[#A78BFA] font-bold shadow-xs'
                      : 'bg-white/50 dark:bg-slate-900/50 border-purple-200/40 dark:border-purple-900/40 text-[#6B6875] dark:text-slate-300 hover:border-purple-300'
                  }`}
                >
                  <Mail className={`w-5 h-5 ${contactType === 'email' ? 'text-[#7C3AED]' : 'text-slate-400'}`} />
                  <span className="text-xs">Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setContactType('phone'); setErrorMsg(null); setFieldErrors({}); }}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition cursor-pointer ${
                    contactType === 'phone'
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-[#7C3AED] text-[#7C3AED] dark:text-[#A78BFA] font-bold shadow-xs'
                      : 'bg-white/50 dark:bg-slate-900/50 border-purple-200/40 dark:border-purple-900/40 text-[#6B6875] dark:text-slate-300 hover:border-purple-300'
                  }`}
                >
                  <Phone className={`w-5 h-5 ${contactType === 'phone' ? 'text-[#7C3AED]' : 'text-slate-400'}`} />
                  <span className="text-xs">Phone Number</span>
                </button>
              </div>

              {/* Dynamic Input based on selection */}
              {contactType === 'email' ? (
                <div>
                  <label className="block text-[#171321] dark:text-slate-200 font-semibold mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="Enter registered email"
                      value={emailInput}
                      onChange={(e) => { setEmailInput(e.target.value); if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null })); }}
                      disabled={isLoading}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border text-[#171321] dark:text-[#F7F7F5] placeholder-slate-400 focus:outline-none transition ${
                        fieldErrors.email ? 'border-red-500 focus:border-red-500 bg-red-50/20' : 'border-purple-200/60 dark:border-purple-900/50 focus:border-[#7C3AED]'
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">{fieldErrors.email}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-[#171321] dark:text-slate-200 font-semibold mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex rounded-xl overflow-hidden shadow-xs border border-purple-200/60 dark:border-purple-900/50 focus-within:border-[#7C3AED] transition">
                    <div className="bg-purple-50 dark:bg-slate-800 px-3 py-2.5 text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1 border-r border-purple-200/60 dark:border-purple-900/50 shrink-0 select-none">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      placeholder="Enter mobile number"
                      value={phoneInput}
                      onChange={(e) => { setPhoneInput(e.target.value); if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: null })); }}
                      disabled={isLoading}
                      maxLength={12}
                      className={`w-full px-3.5 py-2.5 bg-white/60 dark:bg-slate-900/60 text-[#171321] dark:text-[#F7F7F5] placeholder-slate-400 focus:outline-none ${
                        fieldErrors.phone ? 'bg-red-50/20' : ''
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">{fieldErrors.phone}</p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl glass-btn-primary font-bold transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer shadow-md shadow-purple-500/25"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Sending Verification Code...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-[#6B6875] dark:text-slate-400 border-t border-purple-100 dark:border-purple-900/30">
              <Link to="/login" className="text-[#7C3AED] dark:text-[#A78BFA] font-bold hover:underline flex items-center justify-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </Link>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* STEP 2: VERIFY OTP                                        */}
        {/* ========================================================= */}
        {step === 'OTP' && (
          <>
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] text-white shadow-lg shadow-purple-500/25">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#171321] dark:text-[#F7F7F5] uppercase">
                VERIFY OTP
              </h1>
              <p className="text-xs text-[#6B6875] dark:text-slate-400 font-medium">
                We sent a 6-digit verification code to:
              </p>
              <p className="text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA] font-mono bg-purple-500/10 border border-purple-200/50 dark:border-purple-900/50 py-1.5 px-3.5 rounded-xl inline-block">
                {maskedContact}
              </p>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-5 text-xs">
              
              {/* 6 Digit OTP Inputs */}
              <div>
                <label className="block text-center text-[#171321] dark:text-slate-300 font-bold mb-2">
                  Enter OTP
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                  {otpValue.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      disabled={isLoading}
                      className="w-11 h-12 sm:w-12 sm:h-13 text-center text-lg sm:text-xl font-mono font-bold rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/60 dark:border-purple-900/50 text-[#171321] dark:text-[#F7F7F5] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 focus:outline-none transition shadow-xs"
                    />
                  ))}
                </div>

                {devOtpHint && (
                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        const digits = devOtpHint.split('').slice(0, 6);
                        setOtpValue(digits);
                        setErrorMsg(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-300 dark:border-purple-700 text-[#7C3AED] dark:text-[#A78BFA] text-[11px] font-mono font-bold hover:bg-purple-500/25 transition cursor-pointer"
                    >
                      <span>Verification Code: {devOtpHint}</span>
                      <span className="underline">(Click to Fill)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Expiry Countdown */}
              <div className="flex items-center justify-center space-x-1.5 text-xs text-[#6B6875] dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {expirySeconds > 0 ? (
                    <>OTP expires in <strong className="font-mono font-bold text-amber-600 dark:text-amber-400">{formatTime(expirySeconds)}</strong></>
                  ) : (
                    <span className="text-red-500 font-bold">OTP has expired. Please request a new OTP.</span>
                  )}
                </span>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isLoading || otpValue.join('').length !== 6 || expirySeconds <= 0}
                className="w-full py-3 rounded-xl glass-btn-primary font-bold transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer shadow-md shadow-purple-500/25"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend OTP Section */}
              <div className="pt-2 text-center text-xs text-[#6B6875] dark:text-slate-400 space-y-1">
                <p>Didn't receive the code?</p>
                {resendCooldown > 0 ? (
                  <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                    Resend available in {resendCooldown} seconds
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-[#7C3AED] dark:text-[#A78BFA] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Resend OTP
                  </button>
                )}
              </div>

            </form>

            <div className="pt-2 text-center text-xs text-[#6B6875] dark:text-slate-400 border-t border-purple-100 dark:border-purple-900/30">
              <button
                type="button"
                onClick={() => { setStep('CONTACT'); setErrorMsg(null); }}
                className="text-[#7C3AED] dark:text-[#A78BFA] font-bold hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Change Email / Phone
              </button>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* STEP 3: CREATE NEW PASSWORD                              */}
        {/* ========================================================= */}
        {step === 'PASSWORD' && (
          <>
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] text-white shadow-lg shadow-purple-500/25">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#171321] dark:text-[#F7F7F5] uppercase">
                CREATE NEW PASSWORD
              </h1>
              <p className="text-xs text-[#6B6875] dark:text-slate-400 font-medium">
                Enter and confirm your new secure password
              </p>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              
              {/* New Password */}
              <div>
                <label className="block text-[#171321] dark:text-slate-200 font-semibold mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password (min 8 chars)"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); if (fieldErrors.newPassword) setFieldErrors(prev => ({ ...prev, newPassword: null })); }}
                    disabled={isLoading}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border text-[#171321] dark:text-[#F7F7F5] placeholder-slate-400 focus:outline-none transition ${
                      fieldErrors.newPassword ? 'border-red-500 focus:border-red-500 bg-red-50/20' : 'border-purple-200/60 dark:border-purple-900/50 focus:border-[#7C3AED]'
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
                {fieldErrors.newPassword && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">{fieldErrors.newPassword}</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-[#171321] dark:text-slate-200 font-semibold mb-1">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: null })); }}
                    disabled={isLoading}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border text-[#171321] dark:text-[#F7F7F5] placeholder-slate-400 focus:outline-none transition ${
                      fieldErrors.confirmPassword ? 'border-red-500 focus:border-red-500 bg-red-50/20' : 'border-purple-200/60 dark:border-purple-900/50 focus:border-[#7C3AED]'
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
                {fieldErrors.confirmPassword && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl glass-btn-primary font-bold transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer shadow-md shadow-purple-500/25"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          </>
        )}

        {/* ========================================================= */}
        {/* STEP 4: SUCCESS                                           */}
        {/* ========================================================= */}
        {step === 'SUCCESS' && (
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#171321] dark:text-[#F7F7F5]">
                ✓ PASSWORD RESET SUCCESSFUL
              </h2>
              <p className="text-xs text-[#6B6875] dark:text-slate-300">
                Your password has been updated successfully in MySQL.
              </p>
              <p className="text-xs text-[#6B6875] dark:text-slate-400">
                You can now log in with your new password.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3 rounded-xl glass-btn-primary font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-purple-500/25"
            >
              <span>Back to Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </motion.div>

    </div>
  );
};

export default ForgotPassword;
