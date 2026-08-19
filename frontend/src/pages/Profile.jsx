import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Stethoscope, 
  Award, 
  GraduationCap, 
  Briefcase, 
  Shield, 
  ShieldCheck, 
  CheckCircle2, 
  Camera, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Plus, 
  KeyRound, 
  Cpu, 
  Calendar, 
  Clock, 
  FileText, 
  AlertCircle, 
  Loader2,
  Sparkles,
  ChevronRight,
  Lock,
  Server,
  Database
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { profileApi } from '../api/profileApi';

const SPECIALIZATION_OPTIONS = [
  'Neurology',
  'Clinical Neurology',
  'Cognitive & Behavioral Neurology',
  'Neurodegenerative Disorders',
  'Dementia & Alzheimer\'s Care',
  'Neuroscience & Neuroimaging',
  'Epileptology',
  'Movement Disorders & Parkinson\'s'
];

const CLINICAL_EXPERTISE_TAGS = [
  'Dementia',
  'Alzheimer\'s Disease',
  'Parkinson\'s Disease',
  'Epilepsy',
  'Stroke & Vascular Dementia',
  'Multiple Sclerosis',
  'Neurodegenerative Disorders',
  'Cognitive Disorders',
  'EEG Signal Analysis',
  'MRI Volumetrics',
  'Neuropsychological Scoring',
  'Frontotemporal Dementia (FTD)'
];

const Profile = () => {
  const { user, updateUser } = useAuth();
  const isAdmin = String(user?.role || '').trim().toLowerCase() === 'admin';
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [alert, setAlert] = useState(null);

  // Form states
  const [formData, setFormData] = useState({});
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);

  // Doctor Sub-record Modals
  const [showExpModal, setShowExpModal] = useState(false);
  const [expForm, setExpForm] = useState({ organization: '', position: '', department: '', start_date: '', end_date: '', currently_working: true, description: '' });

  const [showEduModal, setShowEduModal] = useState(false);
  const [eduForm, setEduForm] = useState({ degree: '', specialization: '', institution: '', start_year: '', graduation_year: '', grade: '' });

  const [showCertModal, setShowCertModal] = useState(false);
  const [certForm, setCertForm] = useState({ certification_name: '', issuing_organization: '', certificate_number: '', issue_date: '', expiry_date: '', verification_status: 'Verified' });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const data = await profileApi.getProfile();
      if (data) {
        setProfile(data);
        setFormData(data);
      }
    } catch (err) {
      console.warn('API profile fetch notice:', err);
      // Construct fallback profile from auth context
      if (user) {
        const fallback = {
          full_name: user.name || (isAdmin ? 'Vineet Mantur' : 'Doctor'),
          preferred_name: user.name || (isAdmin ? 'Vineet Mantur' : 'Doctor'),
          email: user.email || 'admin@gmail.com',
          role: user.role || (isAdmin ? 'Admin' : 'Doctor'),
          phone: user.phone || '+91 98765 43210',
          profile_photo: user.picture || user.profile_photo || null,
          gender: 'Male',
          specialization: isAdmin ? 'Platform Operations & AI Core' : 'Neurology',
          hospital_name: 'NeuroFusion Clinical & Cognitive Medical Center',
          department: isAdmin ? 'System Operations & Neural AI Infrastructure' : 'Department of Neurology',
          designation: isAdmin ? 'Lead AI & System Administrator' : 'Senior Consultant Neurologist',
          experiences: [],
          educations: [],
          certifications: []
        };
        setProfile(fallback);
        setFormData(fallback);
      } else {
        showAlert('error', 'Unable to load profile from database.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Completion rate calculation (only for doctors)
  const calculateCompletion = () => {
    if (!profile) return 0;
    const requiredFields = [
      'full_name', 'phone', 'gender', 'date_of_birth', 'city', 'state',
      'specialization', 'medical_degree', 'medical_license_number', 'medical_council',
      'hospital_name', 'department', 'designation', 'hospital_phone'
    ];
    let filled = 0;
    requiredFields.forEach(f => {
      if (profile[f] && String(profile[f]).trim().length > 0) filled++;
    });
    if (profile.profile_photo) filled++;
    if (profile.experiences && profile.experiences.length > 0) filled++;
    if (profile.educations && profile.educations.length > 0) filled++;
    if (profile.certifications && profile.certifications.length > 0) filled++;

    const total = requiredFields.length + 4;
    return Math.min(100, Math.round((filled / total) * 100));
  };

  const completionRate = calculateCompletion();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleExpertiseTag = (tag) => {
    if (!isEditing) return;
    const currentTags = formData.clinical_expertise || [];
    const updated = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    setFormData(prev => ({ ...prev, clinical_expertise: updated }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      let currentPhotoUrl = profile?.profile_photo;
      if (selectedPhotoFile) {
        const photoRes = await profileApi.uploadPhoto(selectedPhotoFile);
        currentPhotoUrl = photoRes.profile_photo;
        setSelectedPhotoFile(null);
        setPhotoPreview(null);
      }

      const payload = {
        ...formData,
        profile_photo: currentPhotoUrl || formData.profile_photo || profile?.profile_photo
      };
      
      // Clean up read-only or relational sub-objects
      delete payload.id;
      delete payload.user_id;
      delete payload.doctor_id;
      delete payload.email;
      delete payload.role;
      delete payload.is_active;
      delete payload.experiences;
      delete payload.educations;
      delete payload.certifications;
      delete payload.created_at;
      delete payload.updated_at;
      if (!payload.last_active_at) {
        delete payload.last_active_at;
      }

      const updated = await profileApi.updateProfile(payload);
      setProfile(updated);
      setFormData(updated);
      if (updateUser) {
        updateUser({
          name: updated.full_name || user?.name,
          picture: updated.profile_photo,
          profile_photo: updated.profile_photo
        });
      }
      setIsEditing(false);
      showAlert('success', '✓ Profile updated in MySQL database successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
      showAlert('error', err?.message || 'Unable to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData(profile);
    setPhotoPreview(null);
    setSelectedPhotoFile(null);
    setIsEditing(false);
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showAlert('error', 'Image file exceeds maximum limit of 5MB.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    setSelectedPhotoFile(file);

    try {
      setIsSaving(true);
      const res = await profileApi.uploadPhoto(file);
      const newPhotoUrl = res.profile_photo;
      setProfile(prev => ({ ...prev, profile_photo: newPhotoUrl }));
      setFormData(prev => ({ ...prev, profile_photo: newPhotoUrl }));
      if (updateUser) {
        updateUser({ picture: newPhotoUrl, profile_photo: newPhotoUrl });
      }
      showAlert('success', '✓ Profile photo uploaded and saved successfully!');
    } catch (err) {
      console.error('Error uploading profile photo:', err);
      showAlert('error', err?.response?.data?.detail || err?.message || 'Failed to upload profile photo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (window.confirm('Are you sure you want to remove your profile photo?')) {
      try {
        await profileApi.removePhoto();
        setProfile(prev => ({ ...prev, profile_photo: null }));
        setFormData(prev => ({ ...prev, profile_photo: null }));
        setPhotoPreview(null);
        setSelectedPhotoFile(null);
        if (updateUser) {
          updateUser({ picture: null, profile_photo: null });
        }
        showAlert('success', 'Profile photo removed.');
      } catch (err) {
        showAlert('error', 'Failed to remove photo.');
      }
    }
  };

  // Sub-record handlers for doctors
  const handleAddExperience = async (e) => {
    e.preventDefault();
    try {
      await profileApi.addExperience(expForm);
      setShowExpModal(false);
      setExpForm({ organization: '', position: '', department: '', start_date: '', end_date: '', currently_working: true, description: '' });
      await fetchProfile();
      showAlert('success', 'Experience added successfully!');
    } catch (err) {
      showAlert('error', 'Failed to add experience.');
    }
  };

  const handleDeleteExperience = async (id) => {
    if (window.confirm('Delete this experience entry?')) {
      try {
        await profileApi.deleteExperience(id);
        await fetchProfile();
        showAlert('success', 'Experience deleted.');
      } catch (err) {
        showAlert('error', 'Failed to delete record.');
      }
    }
  };

  const handleAddEducation = async (e) => {
    e.preventDefault();
    try {
      await profileApi.addEducation(eduForm);
      setShowEduModal(false);
      setEduForm({ degree: '', specialization: '', institution: '', start_year: '', graduation_year: '', grade: '' });
      await fetchProfile();
      showAlert('success', 'Education added successfully!');
    } catch (err) {
      showAlert('error', 'Failed to add education.');
    }
  };

  const handleDeleteEducation = async (id) => {
    if (window.confirm('Delete this education record?')) {
      try {
        await profileApi.deleteEducation(id);
        await fetchProfile();
        showAlert('success', 'Education deleted.');
      } catch (err) {
        showAlert('error', 'Failed to delete record.');
      }
    }
  };

  const handleAddCertification = async (e) => {
    e.preventDefault();
    try {
      await profileApi.addCertification(certForm);
      setShowCertModal(false);
      setCertForm({ certification_name: '', issuing_organization: '', certificate_number: '', issue_date: '', expiry_date: '', verification_status: 'Verified' });
      await fetchProfile();
      showAlert('success', 'Certification added successfully!');
    } catch (err) {
      showAlert('error', 'Failed to add certification.');
    }
  };

  const handleDeleteCertification = async (id) => {
    if (window.confirm('Delete this certification?')) {
      try {
        await profileApi.deleteCertification(id);
        await fetchProfile();
        showAlert('success', 'Certification deleted.');
      } catch (err) {
        showAlert('error', 'Failed to delete certification.');
      }
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showAlert('error', 'New password and confirm password do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showAlert('error', 'Password must be at least 6 characters.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await profileApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showAlert('success', '✓ Password changed successfully in database.');
    } catch (err) {
      showAlert('error', err?.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
        <p className="text-sm font-medium text-slate-600">Loading profile from database...</p>
      </div>
    );
  }

  const currentPhoto = photoPreview || profile?.profile_photo;
  const displayName = profile?.full_name || user?.name || (isAdmin ? 'System Administrator' : 'Doctor');
  const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  // =========================================================================
  // 1. ADMIN PROFILE (CLEAN, MINIMAL, SYSTEM ADMINISTRATOR)
  // =========================================================================
  if (isAdmin) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-16 font-sans">
        
        {/* Alert Banner */}
        {alert && (
          <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-xs transition-all ${
            alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              {alert.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
              <span>{alert.message}</span>
            </div>
            <button onClick={() => setAlert(null)} className="p-1 hover:bg-black/5 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Admin Header Card */}
        <div className="liquid-glass-card p-6 md:p-8 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-purple-800/10 via-purple-600/10 to-transparent pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-center sm:items-start md:items-center justify-between gap-6 pt-2">
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
              
              {/* Circular Avatar */}
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-white dark:border-purple-900 shadow-md bg-gradient-to-tr from-[#7C3AED] to-[#A78BFA] flex items-center justify-center text-white text-2xl font-bold tracking-wider">
                  {currentPhoto ? (
                    <img 
                      src={currentPhoto.startsWith('http') || currentPhoto.startsWith('blob:') ? currentPhoto : `http://localhost:8000${currentPhoto}`} 
                      alt={displayName} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#7C3AED] text-white hover:bg-purple-700 shadow-md border-2 border-white dark:border-slate-900 transition transform hover:scale-105 cursor-pointer"
                  title="Change Photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoSelect} 
                  accept="image/png, image/jpeg, image/jpg, image/webp" 
                  className="hidden" 
                />
              </div>

              {/* Admin Identity */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl font-black text-[#171321] dark:text-[#F7F7F5] tracking-tight">{displayName}</h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-950 text-purple-200 border border-purple-800">
                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                    System Administrator
                  </span>
                </div>

                <p className="text-xs text-[#6B6875] dark:text-slate-400 font-medium">
                  Clinical Operations & AI Data Administrator • NeuroFusion AI Platform
                </p>

                <div className="pt-2 flex items-center justify-center sm:justify-start gap-3">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Verified System Admin
                  </span>

                  {profile?.profile_photo && (
                    <button 
                      onClick={handleRemovePhoto} 
                      className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 underline font-medium cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Remove Photo
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Edit / Save Actions */}
            <div className="w-full sm:w-auto flex items-center justify-center gap-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-slate-700 dark:text-slate-300 hover:bg-white/80 text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl glass-btn-primary text-white text-xs font-semibold transition shadow-md shadow-purple-500/25 cursor-pointer flex items-center gap-1.5"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2 rounded-xl glass-btn-primary text-white text-xs font-semibold transition shadow-md shadow-purple-500/25 cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Section 1: Administrator Information Card */}
        <div className="liquid-glass-card p-6 md:p-8 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-5 shadow-xl">
          <h2 className="text-sm font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2 border-b border-purple-200/40 dark:border-purple-900/40 pb-3 uppercase tracking-wider">
            <User className="w-4 h-4 text-[#7C3AED]" />
            Administrator Account Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Full Legal Name</label>
              {isEditing ? (
                <input 
                  type="text" 
                  name="full_name" 
                  value={formData.full_name || ''} 
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5] focus:outline-none focus:border-[#7C3AED]" 
                />
              ) : (
                <p className="font-semibold text-[#171321] dark:text-[#F7F7F5] text-sm">{displayName}</p>
              )}
            </div>

            <div>
              <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Registered Account Email</label>
              <div className="flex items-center space-x-2">
                <p className="font-semibold text-[#171321] dark:text-[#F7F7F5] text-sm">{profile?.email || user?.email}</p>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-lg font-bold border border-emerald-500/30">Verified</span>
              </div>
            </div>

            <div>
              <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Contact Phone</label>
              {isEditing ? (
                <input 
                  type="text" 
                  name="phone" 
                  value={formData.phone || ''} 
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5] focus:outline-none focus:border-[#7C3AED]" 
                />
              ) : (
                <p className="font-semibold text-[#171321] dark:text-[#F7F7F5] text-sm flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {profile?.phone || '+91 98765 43210'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Administrator ID</label>
              <p className="font-mono font-bold text-[#7C3AED] dark:text-[#A78BFA] text-sm">NF-ADM-{String(user?.id || 1).padStart(6, '0')}</p>
            </div>

            <div>
              <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Account Role</label>
              <p className="font-bold text-[#171321] dark:text-[#F7F7F5] text-sm">System Administrator (Tier 1)</p>
            </div>

            <div>
              <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Account Status</label>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active & Verified
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Administrative Permissions & System Scope */}
        <div className="liquid-glass-card p-6 md:p-8 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-4 shadow-xl text-xs">
          <h2 className="text-sm font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2 border-b border-purple-200/40 dark:border-purple-900/40 pb-3 uppercase tracking-wider">
            <Server className="w-4 h-4 text-[#7C3AED]" />
            Administrative System Permissions
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-1">
              <span className="font-bold text-[#171321] dark:text-[#F7F7F5] block">MRI & EEG Data Management</span>
              <p className="text-[#6B6875] dark:text-slate-400 text-[11px]">Authorized to upload, index, and manage DICOM, NIfTI, EDF, and CSV patient scans into MySQL.</p>
              <span className="inline-block mt-1 text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-lg border border-emerald-500/30">Enabled</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-1">
              <span className="font-bold text-[#171321] dark:text-[#F7F7F5] block">Doctor Availability & Directory</span>
              <p className="text-[#6B6875] dark:text-slate-400 text-[11px]">Full access to real-time doctor availability status, specialty tracking, and specialist matching.</p>
              <span className="inline-block mt-1 text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-lg border border-emerald-500/30">Enabled</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-1">
              <span className="font-bold text-[#171321] dark:text-[#F7F7F5] block">Patient Records & Admissions</span>
              <p className="text-[#6B6875] dark:text-slate-400 text-[11px]">Full administrative permissions to register new patients and assign clinical neurologists.</p>
              <span className="inline-block mt-1 text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-lg border border-emerald-500/30">Enabled</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-1">
              <span className="font-bold text-[#171321] dark:text-[#F7F7F5] block">AI Neural Pipeline Engine</span>
              <p className="text-[#6B6875] dark:text-slate-400 text-[11px]">NeuroEngine v3.4 (ResNet18 3D Volumetrics + BiLSTM EEG Spatial Attention Pipeline).</p>
              <span className="inline-block mt-1 text-[10px] bg-purple-500/10 text-[#7C3AED] dark:text-[#A78BFA] font-bold px-2 py-0.5 rounded-lg border border-purple-200/50 dark:border-purple-800/50">Online & Active</span>
            </div>
          </div>
        </div>

        {/* Section 3: Password & Security Settings */}
        <div className="liquid-glass-card p-6 md:p-8 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-5 shadow-xl">
          <h2 className="text-sm font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2 border-b border-purple-200/40 dark:border-purple-900/40 pb-3 uppercase tracking-wider">
            <Lock className="w-4 h-4 text-[#7C3AED]" />
            Security & Account Password
          </h2>

          <form onSubmit={handlePasswordChange} className="max-w-lg space-y-4 text-xs">
            <div>
              <label className="block text-[#171321] dark:text-[#F7F7F5] font-bold mb-1">Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                required
                placeholder="Enter current password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5] focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            <div>
              <label className="block text-[#171321] dark:text-[#F7F7F5] font-bold mb-1">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                required
                minLength={6}
                placeholder="Enter new password (min 6 characters)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5] focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            <div>
              <label className="block text-[#171321] dark:text-[#F7F7F5] font-bold mb-1">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                required
                minLength={6}
                placeholder="Confirm new password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5] focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold transition cursor-pointer flex items-center gap-2"
            >
              {isChangingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Update Password</span>
            </button>
          </form>
        </div>

      </div>
    );
  }

  // =========================================================================
  // 2. DOCTOR / NEUROLOGIST CLINICAL PROFILE
  // =========================================================================
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans">
      
      {/* Alert Banner */}
      {alert && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold shadow-xs transition-all ${
          alert.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
        }`}>
          <div className="flex items-center space-x-2">
            {alert.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="p-1 hover:bg-black/5 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Doctor Profile Header Card */}
      <div className="liquid-glass-card p-6 md:p-8 rounded-3xl shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-r from-[#7C3AED]/10 via-[#A78BFA]/10 to-transparent pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-2">
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
            
            {/* Circular Doctor Avatar with Camera Upload */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white dark:border-purple-900/60 shadow-lg bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center text-white text-3xl font-bold tracking-wider">
                {currentPhoto ? (
                  <img 
                    src={currentPhoto.startsWith('http') || currentPhoto.startsWith('blob:') ? currentPhoto : `http://localhost:8000${currentPhoto}`} 
                    alt={profile?.full_name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2 rounded-full glass-btn-primary text-white shadow-md border-2 border-white transition transform hover:scale-105 cursor-pointer"
                title="Change Doctor Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoSelect} 
                accept="image/png, image/jpeg, image/jpg, image/webp" 
                className="hidden" 
              />
            </div>

            {/* Doctor Identity Details */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171321] dark:text-[#F7F7F5] tracking-tight">
                  {profile?.full_name || 'Dr. Vineet Mantur'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-[#7C3AED] dark:text-[#A78BFA] border border-purple-300/40">
                  <Stethoscope className="w-3.5 h-3.5 text-[#7C3AED]" />
                  Doctor • Neurologist
                </span>
              </div>

              <p className="text-sm font-bold text-[#7C3AED] dark:text-[#A78BFA]">
                {profile?.professional_title || 'Attending Neurologist'} • {profile?.specialization || 'Clinical Neurology'}
              </p>

              <p className="text-xs text-[#6B6875] dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {profile?.hospital_name || 'NeuroFusion Clinical Medical Center'}
              </p>

              {/* Verified Badge */}
              <div className="pt-2 flex items-center justify-center sm:justify-start gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Verified Medical Professional
                </span>

                {profile?.profile_photo && (
                  <button 
                    onClick={handleRemovePhoto} 
                    className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 underline font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Remove Photo
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Edit / Save Action Buttons */}
          <div className="w-full md:w-auto flex items-center justify-center gap-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

        </div>

        {/* Profile Completion Bar */}
        <div className="mt-8 pt-6 border-t border-[#E2E8F0] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#2563EB]" /> Profile Completion
            </span>
            <span className="font-extrabold text-[#2563EB]">{completionRate}%</span>
          </div>

          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div 
              className="h-full bg-gradient-to-r from-[#2563EB] to-[#0284C7] transition-all duration-500 rounded-full"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

      </div>

      {/* Doctor Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-[#E2E8F0] overflow-x-auto pb-1 text-xs font-semibold">
        {[
          { id: 'overview', label: 'Doctor Profile & Credentials', icon: User },
          { id: 'experience', label: `Experience (${profile?.experiences?.length || 0})`, icon: Briefcase },
          { id: 'education', label: `Education (${profile?.educations?.length || 0})`, icon: GraduationCap },
          { id: 'certifications', label: `Certifications (${profile?.certifications?.length || 0})`, icon: Award },
          { id: 'security', label: 'Security & Access', icon: Lock }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-t-xl transition-colors flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
                isActive 
                  ? 'bg-white border-t-2 border-[#2563EB] text-[#2563EB] font-bold shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* DOCTOR TAB 1: PROFILE & CREDENTIALS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Section 1: Personal Information */}
          <div className="liquid-glass-card p-6 md:p-8 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-5 shadow-xl">
            <h2 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2 border-b border-purple-200/40 dark:border-purple-900/40 pb-3">
              <User className="w-5 h-5 text-[#7C3AED]" />
              Personal Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Full Legal Name</label>
                {isEditing ? (
                  <input type="text" name="full_name" value={formData.full_name || ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5]" />
                ) : (
                  <p className="font-semibold text-[#171321] dark:text-[#F7F7F5] text-sm">{profile?.full_name || '—'}</p>
                )}
              </div>

              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Preferred Name / Alias</label>
                {isEditing ? (
                  <input type="text" name="preferred_name" value={formData.preferred_name || ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5]" />
                ) : (
                  <p className="font-semibold text-[#171321] dark:text-[#F7F7F5] text-sm">{profile?.preferred_name || '—'}</p>
                )}
              </div>

              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Gender</label>
                {isEditing ? (
                  <select name="gender" value={formData.gender || 'Male'} onChange={handleInputChange} className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5]">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="font-semibold text-[#171321] dark:text-[#F7F7F5] text-sm">{profile?.gender || '—'}</p>
                )}
              </div>

              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Date of Birth</label>
                {isEditing ? (
                  <input type="date" name="date_of_birth" value={formData.date_of_birth || ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5]" />
                ) : (
                  <p className="font-semibold text-[#171321] dark:text-[#F7F7F5] text-sm">{profile?.date_of_birth || '—'}</p>
                )}
              </div>

              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Primary Phone Number</label>
                {isEditing ? (
                  <input type="text" name="phone" value={formData.phone || ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5]" />
                ) : (
                  <p className="font-semibold text-[#171321] dark:text-[#F7F7F5] text-sm flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {profile?.phone || '—'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Registered Account Email</label>
                <div className="flex items-center space-x-2">
                  <p className="font-semibold text-[#171321] dark:text-[#F7F7F5] text-sm">{profile?.email || user?.email}</p>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-lg font-bold border border-emerald-500/30">Verified</span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Residential / Clinic Address</label>
                {isEditing ? (
                  <input type="text" name="address" value={formData.address || ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5]" />
                ) : (
                  <p className="font-semibold text-[#171321] dark:text-[#F7F7F5] text-sm flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {profile?.address || '—'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">City / State / Pincode</label>
                {isEditing ? (
                  <div className="grid grid-cols-3 gap-2">
                    <input type="text" name="city" placeholder="City" value={formData.city || ''} onChange={handleInputChange} className="px-2 py-1.5 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-xs" />
                    <input type="text" name="state" placeholder="State" value={formData.state || ''} onChange={handleInputChange} className="px-2 py-1.5 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-xs" />
                    <input type="text" name="pincode" placeholder="Pincode" value={formData.pincode || ''} onChange={handleInputChange} className="px-2 py-1.5 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-xs" />
                  </div>
                ) : (
                  <p className="font-semibold text-[#171321] dark:text-[#F7F7F5] text-sm">
                    {[profile?.city, profile?.state, profile?.pincode].filter(Boolean).join(', ') || '—'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Professional Information & Medical License */}
          <div className="liquid-glass-card p-6 md:p-8 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-5 shadow-xl">
            <h2 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2 border-b border-purple-200/40 dark:border-purple-900/40 pb-3">
              <Stethoscope className="w-5 h-5 text-[#7C3AED]" />
              Professional & Medical Licensing
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Primary Specialization</label>
                {isEditing ? (
                  <select name="specialization" value={formData.specialization || 'Neurology'} onChange={handleInputChange} className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5]">
                    {SPECIALIZATION_OPTIONS.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                ) : (
                  <p className="font-semibold text-[#7C3AED] dark:text-[#A78BFA] text-sm">{profile?.specialization || 'Neurology'}</p>
                )}
              </div>

              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Sub-Specialization</label>
                {isEditing ? (
                  <input type="text" name="sub_specialization" value={formData.sub_specialization || ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5]" />
                ) : (
                  <p className="font-semibold text-[#171321] dark:text-[#F7F7F5] text-sm">{profile?.sub_specialization || 'Cognitive & Behavioral Neurology'}</p>
                )}
              </div>

              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Professional Title</label>
                {isEditing ? (
                  <input type="text" name="professional_title" value={formData.professional_title || ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5]" />
                ) : (
                  <p className="font-semibold text-[#171321] dark:text-[#F7F7F5] text-sm">{profile?.professional_title || 'Attending Neurologist'}</p>
                )}
              </div>

              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Medical Degree</label>
                {isEditing ? (
                  <input type="text" name="medical_degree" value={formData.medical_degree || ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5]" />
                ) : (
                  <p className="font-semibold text-[#171321] dark:text-[#F7F7F5] text-sm">{profile?.medical_degree || 'MBBS, MD (Neurology)'}</p>
                )}
              </div>

              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Years of Clinical Experience</label>
                {isEditing ? (
                  <input type="number" name="years_experience" value={formData.years_experience || 0} onChange={handleInputChange} className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5]" />
                ) : (
                  <p className="font-semibold text-[#171321] dark:text-[#F7F7F5] text-sm">{profile?.years_experience || 0} Years</p>
                )}
              </div>

              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Medical License Number</label>
                {isEditing ? (
                  <input type="text" name="medical_license_number" value={formData.medical_license_number || ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5]" />
                ) : (
                  <div className="flex items-center space-x-2">
                    <p className="font-mono font-bold text-[#171321] dark:text-[#F7F7F5] text-sm">{profile?.medical_license_number || 'MCI-NEURO-84920'}</p>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-lg font-bold border border-emerald-500/30">Active</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Hospital & Clinical Information */}
          <div className="liquid-glass-card p-6 md:p-8 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-5 shadow-xl">
            <h2 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2 border-b border-purple-200/40 dark:border-purple-900/40 pb-3">
              <Building2 className="w-5 h-5 text-[#7C3AED]" />
              Hospital & Clinical Practice
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Hospital / Institution</label>
                {isEditing ? (
                  <input type="text" name="hospital_name" value={formData.hospital_name || ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5]" />
                ) : (
                  <p className="font-semibold text-[#171321] dark:text-[#F7F7F5] text-sm">{profile?.hospital_name || 'NeuroFusion Clinical Medical Center'}</p>
                )}
              </div>

              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Department</label>
                {isEditing ? (
                  <input type="text" name="department" value={formData.department || ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5]" />
                ) : (
                  <p className="font-semibold text-[#171321] dark:text-[#F7F7F5] text-sm">{profile?.department || 'Department of Neurology'}</p>
                )}
              </div>

              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold uppercase text-[10px] mb-1">Consultation Room / OPD</label>
                {isEditing ? (
                  <input type="text" name="consultation_room" value={formData.consultation_room || ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5]" />
                ) : (
                  <p className="font-semibold text-[#171321] dark:text-[#F7F7F5] text-sm">{profile?.consultation_room || 'OPD Room 304 (Neuro Wing)'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Clinical Expertise Tags */}
          <div className="liquid-glass-card p-6 md:p-8 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-purple-200/40 dark:border-purple-900/40 pb-3">
              <h2 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#7C3AED]" />
                Clinical Focus & Neurological Expertise
              </h2>
              {isEditing && (
                <span className="text-[11px] text-[#6B6875] dark:text-slate-400">Click chips to toggle areas of practice</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {CLINICAL_EXPERTISE_TAGS.map(tag => {
                const currentTags = isEditing ? (formData.clinical_expertise || []) : (profile?.clinical_expertise || []);
                const isSelected = currentTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleExpertiseTag(tag)}
                    disabled={!isEditing}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#7C3AED] text-white shadow-md shadow-purple-500/25'
                        : isEditing 
                          ? 'bg-white/60 dark:bg-slate-900/60 text-[#6B6875] dark:text-slate-300 hover:bg-white/80 border border-purple-200/50 dark:border-purple-900/40 cursor-pointer' 
                          : 'bg-white/40 dark:bg-slate-900/40 text-[#6B6875] dark:text-slate-400 border border-purple-200/40 dark:border-purple-900/30'
                    }`}
                  >
                    {tag} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* DOCTOR TAB 2: EXPERIENCE */}
      {activeTab === 'experience' && (
        <div className="liquid-glass-card p-6 md:p-8 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-purple-200/40 dark:border-purple-900/40 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#7C3AED]" /> Professional Experience History
              </h2>
              <p className="text-xs text-[#6B6875] dark:text-slate-400">Hospital and clinical neurology appointments</p>
            </div>
            <button
              onClick={() => setShowExpModal(true)}
              className="px-4 py-2 rounded-xl glass-btn-primary text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/25"
            >
              <Plus className="w-4 h-4" /> Add Experience
            </button>
          </div>

          <div className="space-y-4">
            {profile?.experiences && profile.experiences.length > 0 ? (
              profile.experiences.map((exp) => (
                <div key={exp.id} className="p-5 rounded-2xl border border-purple-200/50 dark:border-purple-900/40 bg-white/60 dark:bg-slate-900/60 hover:bg-white/80 transition flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#171321] dark:text-[#F7F7F5]">{exp.position}</h3>
                    <p className="text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA]">{exp.organization} {exp.department && `• ${exp.department}`}</p>
                    <p className="text-[11px] text-[#6B6875] dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {exp.start_date} — {exp.currently_working ? 'Present (Current)' : exp.end_date}
                    </p>
                    {exp.description && (
                      <p className="text-xs text-[#6B6875] dark:text-slate-300 pt-1 leading-relaxed">{exp.description}</p>
                    )}
                  </div>
                  <button onClick={() => handleDeleteExperience(exp.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded-xl transition cursor-pointer" title="Delete record">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                No experience records found. Click "+ Add Experience" above.
              </div>
            )}
          </div>
        </div>
      )}

      {/* DOCTOR TAB 3: EDUCATION */}
      {activeTab === 'education' && (
        <div className="liquid-glass-card p-6 md:p-8 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-purple-200/40 dark:border-purple-900/40 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#7C3AED]" /> Education & Medical Qualifications
              </h2>
              <p className="text-xs text-[#6B6875] dark:text-slate-400">Academic medical degrees and postgraduate training</p>
            </div>
            <button
              onClick={() => setShowEduModal(true)}
              className="px-4 py-2 rounded-xl glass-btn-primary text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/25"
            >
              <Plus className="w-4 h-4" /> Add Education
            </button>
          </div>

          <div className="space-y-4">
            {profile?.educations && profile.educations.length > 0 ? (
              profile.educations.map((edu) => (
                <div key={edu.id} className="p-5 rounded-2xl border border-purple-200/50 dark:border-purple-900/40 bg-white/60 dark:bg-slate-900/60 hover:bg-white/80 transition flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#171321] dark:text-[#F7F7F5]">{edu.degree}</h3>
                    <p className="text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA]">{edu.institution} {edu.specialization && `• ${edu.specialization}`}</p>
                    <p className="text-[11px] text-[#6B6875] dark:text-slate-400">Graduated: {edu.graduation_year} {edu.grade && `• Grade: ${edu.grade}`}</p>
                  </div>
                  <button onClick={() => handleDeleteEducation(edu.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded-xl transition cursor-pointer" title="Delete record">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                No education records found. Click "+ Add Education" to add your degrees.
              </div>
            )}
          </div>
        </div>
      )}

      {/* DOCTOR TAB 4: CERTIFICATIONS */}
      {activeTab === 'certifications' && (
        <div className="liquid-glass-card p-6 md:p-8 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-purple-200/40 dark:border-purple-900/40 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#7C3AED]" /> Certifications & Fellowships
              </h2>
              <p className="text-xs text-[#6B6875] dark:text-slate-400">Accredited medical board certifications</p>
            </div>
            <button
              onClick={() => setShowCertModal(true)}
              className="px-4 py-2 rounded-xl glass-btn-primary text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/25"
            >
              <Plus className="w-4 h-4" /> Add Certification
            </button>
          </div>

          <div className="space-y-4">
            {profile?.certifications && profile.certifications.length > 0 ? (
              profile.certifications.map((cert) => (
                <div key={cert.id} className="p-5 rounded-2xl border border-purple-200/50 dark:border-purple-900/40 bg-white/60 dark:bg-slate-900/60 hover:bg-white/80 transition flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#171321] dark:text-[#F7F7F5]">{cert.certification_name}</h3>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-lg font-bold border border-emerald-500/30">
                        ✓ {cert.verification_status || 'Verified'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#171321] dark:text-[#F7F7F5]">{cert.issuing_organization}</p>
                    <p className="text-[11px] text-[#6B6875] dark:text-slate-400 font-mono">
                      Certificate #{cert.certificate_number || 'N/A'} • Issued: {cert.issue_date || '—'} {cert.expiry_date && `(Expires: ${cert.expiry_date})`}
                    </p>
                  </div>
                  <button onClick={() => handleDeleteCertification(cert.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded-xl transition cursor-pointer" title="Delete record">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                No certification records found. Click "+ Add Certification" to add credentials.
              </div>
            )}
          </div>
        </div>
      )}

      {/* DOCTOR TAB 5: SECURITY */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="liquid-glass-card p-6 md:p-8 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-5 shadow-xl">
            <h2 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2 border-b border-purple-200/40 dark:border-purple-900/40 pb-3">
              <KeyRound className="w-5 h-5 text-[#7C3AED]" />
              Account Password & Security
            </h2>

            <form onSubmit={handlePasswordChange} className="max-w-lg space-y-4 text-xs">
              <div>
                <label className="block text-[#171321] dark:text-[#F7F7F5] font-bold mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                  required
                  placeholder="Enter your current password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-[#171321] dark:text-[#F7F7F5] font-bold mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                  required
                  minLength={6}
                  placeholder="Enter new password (min 6 characters)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-[#171321] dark:text-[#F7F7F5] font-bold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  required
                  minLength={6}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="px-5 py-2.5 rounded-xl glass-btn-primary text-white font-semibold transition cursor-pointer flex items-center gap-2 shadow-md shadow-purple-500/25"
              >
                {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Update Account Password</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Experience Modal */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass-card rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-4 shadow-2xl border border-purple-200/40 dark:border-purple-900/40">
            <div className="flex items-center justify-between border-b border-purple-200/40 dark:border-purple-900/40 pb-3">
              <h3 className="font-bold text-[#171321] dark:text-[#F7F7F5] text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#7C3AED]" /> Add Professional Experience
              </h3>
              <button onClick={() => setShowExpModal(false)} className="text-[#6B6875] dark:text-slate-400 hover:text-[#171321] dark:hover:text-[#F7F7F5] cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddExperience} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold mb-1">Organization / Hospital *</label>
                <input type="text" required value={expForm.organization} onChange={e => setExpForm(p => ({ ...p, organization: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5] focus:outline-none focus:border-[#7C3AED]" />
              </div>
              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold mb-1">Position / Role *</label>
                <input type="text" required value={expForm.position} onChange={e => setExpForm(p => ({ ...p, position: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5] focus:outline-none focus:border-[#7C3AED]" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowExpModal(false)} className="px-4 py-2 rounded-xl border border-purple-200/50 dark:border-purple-900/40 text-[#6B6875] dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-900/40 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white font-semibold shadow-md shadow-purple-500/25 cursor-pointer">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Education Modal */}
      {showEduModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass-card rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-4 shadow-2xl border border-purple-200/40 dark:border-purple-900/40">
            <div className="flex items-center justify-between border-b border-purple-200/40 dark:border-purple-900/40 pb-3">
              <h3 className="font-bold text-[#171321] dark:text-[#F7F7F5] text-sm flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#7C3AED]" /> Add Education Credential
              </h3>
              <button onClick={() => setShowEduModal(false)} className="text-[#6B6875] dark:text-slate-400 hover:text-[#171321] dark:hover:text-[#F7F7F5] cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddEducation} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold mb-1">Medical Degree / Diploma *</label>
                <input type="text" required value={eduForm.degree} onChange={e => setEduForm(p => ({ ...p, degree: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5] focus:outline-none focus:border-[#7C3AED]" />
              </div>
              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold mb-1">University / College *</label>
                <input type="text" required value={eduForm.institution} onChange={e => setEduForm(p => ({ ...p, institution: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5] focus:outline-none focus:border-[#7C3AED]" />
              </div>
              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold mb-1">Graduation Year *</label>
                <input type="text" required value={eduForm.graduation_year} onChange={e => setEduForm(p => ({ ...p, graduation_year: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5] focus:outline-none focus:border-[#7C3AED]" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEduModal(false)} className="px-4 py-2 rounded-xl border border-purple-200/50 dark:border-purple-900/40 text-[#6B6875] dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-900/40 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white font-semibold shadow-md shadow-purple-500/25 cursor-pointer">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certification Modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass-card rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-4 shadow-2xl border border-purple-200/40 dark:border-purple-900/40">
            <div className="flex items-center justify-between border-b border-purple-200/40 dark:border-purple-900/40 pb-3">
              <h3 className="font-bold text-[#171321] dark:text-[#F7F7F5] text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-[#7C3AED]" /> Add Board Certification
              </h3>
              <button onClick={() => setShowCertModal(false)} className="text-[#6B6875] dark:text-slate-400 hover:text-[#171321] dark:hover:text-[#F7F7F5] cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddCertification} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold mb-1">Certification Name *</label>
                <input type="text" required value={certForm.certification_name} onChange={e => setCertForm(p => ({ ...p, certification_name: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5] focus:outline-none focus:border-[#7C3AED]" />
              </div>
              <div>
                <label className="block text-[#6B6875] dark:text-slate-400 font-bold mb-1">Issuing Organization *</label>
                <input type="text" required value={certForm.issuing_organization} onChange={e => setCertForm(p => ({ ...p, issuing_organization: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5] focus:outline-none focus:border-[#7C3AED]" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCertModal(false)} className="px-4 py-2 rounded-xl border border-purple-200/50 dark:border-purple-900/40 text-[#6B6875] dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-900/40 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white font-semibold shadow-md shadow-purple-500/25 cursor-pointer">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
