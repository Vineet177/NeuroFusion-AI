import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Stethoscope, 
  Building2, 
  Clock, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Calendar, 
  Award, 
  GraduationCap, 
  MapPin, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Eye, 
  Activity, 
  Check, 
  Sparkles,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { adminDoctorApi } from '../api/adminDoctorApi';
import { useAuth } from '../hooks/useAuth';

const AVAILABILITY_CONFIG = {
  Available: {
    label: 'Available Now',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: '🟢'
  },
  Busy: {
    label: 'Busy (In Consultation)',
    color: 'bg-amber-500',
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: '🟡'
  },
  Offline: {
    label: 'Offline',
    color: 'bg-slate-400',
    textColor: 'text-slate-600',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
    icon: '⚪'
  },
  'On Leave': {
    label: 'On Leave',
    color: 'bg-rose-500',
    textColor: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    icon: '🔴'
  }
};

const AdminAvailableDoctors = () => {
  const { user } = useAuth();
  const isAdmin = String(user?.role || '').trim().toLowerCase() === 'admin';

  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState({
    total_doctors: 0,
    available: 0,
    busy: 0,
    offline: 0,
    on_leave: 0
  });
  const [specialtySummary, setSpecialtySummary] = useState({});
  const [availableSpecializations, setAvailableSpecializations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  const [selectedAvailability, setSelectedAvailability] = useState('All');

  // Modal for Viewing Doctor Details
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorModalData, setDoctorModalData] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [alert, setAlert] = useState(null);

  // Delete Doctor Confirmation State
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load doctors directory from MySQL backend
  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      const data = await adminDoctorApi.getAvailableDoctors({
        search: searchTerm,
        specialization: selectedSpecialization,
        availability: selectedAvailability
      });
      setDoctors(data.doctors || []);
      setStats(data.stats || { total_doctors: 0, available: 0, busy: 0, offline: 0, on_leave: 0 });
      setSpecialtySummary(data.specialty_summary || {});
      setAvailableSpecializations(data.available_specializations || []);
    } catch (err) {
      console.error('Failed to load available doctors:', err);
      showAlert('error', 'Unable to fetch doctors from MySQL database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadDoctors();
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedSpecialization, selectedAvailability]);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4500);
  };

  // View full doctor details in modal
  const handleViewDoctor = async (doc) => {
    setSelectedDoctor(doc);
    setIsLoadingDetails(true);
    try {
      const details = await adminDoctorApi.getDoctorDetails(doc.id);
      setDoctorModalData(details);
    } catch (err) {
      console.error('Failed to fetch full doctor details:', err);
      // Fallback to card data
      setDoctorModalData(doc);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Admin changing doctor availability status in real-time
  const handleUpdateAvailability = async (doctorId, newStatus) => {
    setIsUpdatingStatus(true);
    try {
      await adminDoctorApi.updateAvailability(doctorId, newStatus);
      showAlert('success', `✓ Doctor availability updated to "${newStatus}" in MySQL.`);
      
      // Update local state immediately
      setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, availability_status: newStatus } : d));
      if (selectedDoctor && selectedDoctor.id === doctorId) {
        setSelectedDoctor(prev => ({ ...prev, availability_status: newStatus }));
      }
      // Refresh stats from backend
      loadDoctors();
    } catch (err) {
      console.error('Failed to update doctor availability:', err);
      showAlert('error', 'Failed to update doctor availability.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Admin removing doctor permanently from MySQL
  const confirmDeleteDoctor = async () => {
    if (!doctorToDelete) return;
    setIsDeleting(true);
    try {
      const targetId = doctorToDelete.user_id || doctorToDelete.id;
      await adminDoctorApi.deleteDoctor(targetId);
      showAlert('success', `✓ Doctor Dr. ${doctorToDelete.name} was removed from the database.`);
      setDoctorToDelete(null);
      if (selectedDoctor && (selectedDoctor.id === doctorToDelete.id || selectedDoctor.user_id === doctorToDelete.user_id)) {
        setSelectedDoctor(null);
      }
      // Refresh directory
      await loadDoctors();
    } catch (err) {
      console.error('Failed to remove doctor:', err);
      showAlert('error', err?.response?.data?.detail || err?.message || 'Failed to remove doctor.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Toast Alert */}
      {alert && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-xs transition-all ${
          alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
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

      {/* 1. Availability Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Total Doctors */}
        <div className="liquid-glass-card p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B6875] dark:text-slate-400 uppercase tracking-wide">
              Total Doctors
            </span>
            <div className="p-1.5 rounded-xl bg-purple-500/10 text-[#7C3AED] dark:text-[#A78BFA]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-[#171321] dark:text-[#F7F7F5]">{stats.total_doctors}</h3>
          </div>
        </div>

        {/* Available Live */}
        <div className="liquid-glass-card p-4 rounded-2xl border-emerald-300/40 dark:border-emerald-700/40 flex flex-col justify-between relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Available
            </span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-300">{stats.available}</h3>
          </div>
        </div>

        {/* Busy */}
        <div className="liquid-glass-card p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B6875] dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Busy
            </span>
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-amber-600">{stats.busy}</h3>
          </div>
        </div>

        {/* Offline */}
        <div className="liquid-glass-card p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B6875] dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Offline
            </span>
            <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-700 dark:text-slate-300">{stats.offline}</h3>
          </div>
        </div>

        {/* On Leave */}
        <div className="liquid-glass-card p-4 rounded-2xl flex flex-col justify-between col-span-2 sm:col-span-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B6875] dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              On Leave
            </span>
            <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-rose-600">{stats.on_leave}</h3>
          </div>
        </div>

      </div>

      {/* 2. Doctors by Specialization Availability Summary Strip */}
      <div className="liquid-glass-card p-5 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#7C3AED]" />
            <h2 className="text-xs font-extrabold text-[#171321] dark:text-[#F7F7F5] uppercase tracking-wider">
              Available Doctors by Specialization
            </h2>
          </div>
          <span className="text-[11px] text-[#6B6875]">Click specialty to filter immediately</span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {Object.entries(specialtySummary).length > 0 ? (
            Object.entries(specialtySummary).map(([spec, count]) => {
              const isSelected = selectedSpecialization.toLowerCase() === spec.toLowerCase();
              return (
                <button
                  key={spec}
                  onClick={() => setSelectedSpecialization(isSelected ? 'All' : spec)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? 'glass-btn-primary shadow-xs'
                      : 'liquid-glass-card hover:border-purple-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{spec}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-white text-[#7C3AED]' : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700'
                  }`}>
                    {count} Available
                  </span>
                </button>
              );
            })
          ) : (
            <span className="text-xs text-slate-400 py-1">All registered doctor specializations are indexed and ready.</span>
          )}
        </div>
      </div>

      {/* 3. Find Available Specialist & Filters Section */}
      <div className="liquid-glass-card p-5 md:p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 dark:border-purple-900/40 pb-4">
          <div>
            <h2 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-[#7C3AED]" />
              Find Available Specialist
            </h2>
          </div>

          {(selectedSpecialization !== 'All' || selectedAvailability !== 'All' || searchTerm) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSpecialization('All');
                setSelectedAvailability('All');
              }}
              className="text-xs text-[#7C3AED] hover:underline font-bold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Reset Filters
            </button>
          )}
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          
          {/* Keyword Search */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search doctor name, hospital, specialization (e.g. Dementia, EEG, MRI)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-purple-200/60 dark:border-purple-900/40 focus:outline-none focus:border-[#7C3AED] text-[#171321] dark:text-[#F7F7F5] bg-white/60 dark:bg-slate-900/60 text-xs"
            />
          </div>

          {/* Specialization Filter Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-purple-200/60 dark:border-purple-900/40 focus:outline-none focus:border-[#7C3AED] text-[#171321] dark:text-[#F7F7F5] text-xs font-semibold bg-white/60 dark:bg-slate-900/60"
            >
              <option value="All">All Specializations</option>
              {availableSpecializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {/* Availability Filter Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-purple-200/60 dark:border-purple-900/40 focus:outline-none focus:border-[#7C3AED] text-[#171321] dark:text-[#F7F7F5] text-xs font-semibold bg-white/60 dark:bg-slate-900/60"
            >
              <option value="All">All Statuses</option>
              <option value="Available">🟢 Available</option>
              <option value="Busy">🟡 Busy</option>
              <option value="Offline">⚪ Offline</option>
              <option value="On Leave">🔴 On Leave</option>
            </select>
          </div>

        </div>
      </div>

      {/* 4. Doctors Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
            <span>Available Doctors</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-[#7C3AED] dark:text-[#A78BFA] border border-purple-300/40">
              {doctors.length} Matching
            </span>
          </h3>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 liquid-glass-card rounded-2xl">
            <Loader2 className="w-7 h-7 text-[#7C3AED] animate-spin" />
            <p className="text-xs text-[#6B6875] font-medium">Querying active doctors from MySQL...</p>
          </div>
        ) : doctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {doctors.map((doc) => {
              const statusCfg = AVAILABILITY_CONFIG[doc.availability_status] || AVAILABILITY_CONFIG.Available;
              const initials = doc.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

              return (
                <div
                  key={doc.id}
                  className="liquid-glass-card rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4 hover:border-purple-300"
                >
                  {/* Card Header: Avatar, Name & Live Status */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      
                      <div className="flex items-center space-x-3">
                        {/* Circular Avatar */}
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-purple-200 bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center text-white text-base font-bold shadow-xs shrink-0">
                          {doc.photo ? (
                            <img 
                              src={doc.photo.startsWith('http') ? doc.photo : `http://localhost:8000${doc.photo}`} 
                              alt={doc.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-extrabold text-[#171321] dark:text-[#F7F7F5] tracking-tight">{doc.name}</h4>
                          <p className="text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA]">{doc.professional_title}</p>
                          <p className="text-[10px] text-[#6B6875] font-mono">{doc.doctor_id}</p>
                        </div>
                      </div>

                      {/* Live Availability Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${statusCfg.bgColor} ${statusCfg.textColor} ${statusCfg.borderColor}`}>
                        <span className={`w-2 h-2 rounded-full ${statusCfg.color} ${doc.availability_status === 'Available' ? 'animate-pulse' : ''}`} />
                        <span>{statusCfg.label}</span>
                      </span>

                    </div>

                    {/* Hospital & Experience */}
                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 liquid-glass-card p-2.5 rounded-xl border border-purple-100 dark:border-purple-900/30">
                      <p className="flex items-center gap-1.5 font-medium truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{doc.hospital}</span>
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {doc.experience_years}+ Years Experience
                        </span>
                        {doc.consultation_room && (
                          <span className="font-bold text-[#7C3AED]">{doc.consultation_room}</span>
                        )}
                      </div>
                    </div>

                    {/* Specialization Tags / Chips */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#6B6875] tracking-wider">Specializations:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {doc.specializations && doc.specializations.slice(0, 4).map((spec, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-500/10 text-[#7C3AED] dark:text-[#A78BFA] border border-purple-300/30"
                          >
                            {spec}
                          </span>
                        ))}
                        {doc.specializations && doc.specializations.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 font-medium">
                            +{doc.specializations.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-purple-100 dark:border-purple-900/30 flex items-center justify-between gap-2">
                    
                    {/* Admin Status Switcher Shortcut */}
                    <select
                      value={doc.availability_status}
                      onChange={(e) => handleUpdateAvailability(doc.id, e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-purple-200/60 dark:border-purple-900/40 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-white/60 dark:bg-slate-900/60 cursor-pointer focus:outline-none focus:border-[#7C3AED]"
                      title="Quick Change Availability"
                    >
                      <option value="Available">🟢 Available</option>
                      <option value="Busy">🟡 Busy</option>
                      <option value="Offline">⚪ Offline</option>
                      <option value="On Leave">🔴 On Leave</option>
                    </select>

                    <div className="flex items-center gap-1.5">
                      {/* Admin Remove Doctor Button */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setDoctorToDelete(doc)}
                          className="p-2 rounded-xl border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition cursor-pointer shadow-xs"
                          title={`Remove Dr. ${doc.name} from System`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* View Full Doctor Profile Button */}
                      <button
                        type="button"
                        onClick={() => handleViewDoctor(doc)}
                        className="px-3.5 py-1.5 rounded-xl glass-btn-primary text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Doctor</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 liquid-glass-card rounded-2xl space-y-2">
            <Stethoscope className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-[#171321] dark:text-[#F7F7F5]">No doctors found matching criteria</p>
            <p className="text-xs text-[#6B6875]">Try adjusting your specialization filter or search keywords.</p>
          </div>
        )}

      </div>

      {/* =================================================================== */}
      {/* 5. Doctor Deep Inspection Modal */}
      {/* =================================================================== */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="liquid-glass-card bg-white/85 dark:bg-[#171321]/90 backdrop-blur-2xl rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-5 shadow-2xl border border-purple-200/60 dark:border-purple-900/50 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-purple-100 dark:border-purple-900/30 pb-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] text-white flex items-center justify-center font-bold text-xl shadow-md overflow-hidden">
                  {selectedDoctor.profile_photo ? (
                    <img 
                      src={selectedDoctor.profile_photo.startsWith('http') ? selectedDoctor.profile_photo : `http://localhost:8000${selectedDoctor.profile_photo}`} 
                      alt={selectedDoctor.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span>{selectedDoctor.initials}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
                    Dr. {selectedDoctor.name}
                    <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-purple-500/10 text-[#7C3AED] dark:text-[#A78BFA]">
                      {selectedDoctor.doctor_id}
                    </span>
                  </h3>
                  <p className="text-xs text-[#7C3AED] dark:text-[#A78BFA] font-bold">{selectedDoctor.title}</p>
                  <p className="text-xs text-[#6B6875] dark:text-slate-400">{selectedDoctor.hospital}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDoctor(null)}
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Control */}
            <div className="p-4 rounded-2xl bg-purple-500/5 dark:bg-purple-900/20 border border-purple-200/50 dark:border-purple-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-bold text-[#171321] dark:text-[#F7F7F5]">Current Duty Status:</span>
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                  AVAILABILITY_CONFIG[selectedDoctor.availability_status]?.bgColor || 'bg-slate-100'
                } ${
                  AVAILABILITY_CONFIG[selectedDoctor.availability_status]?.textColor || 'text-slate-700'
                } border`}>
                  {AVAILABILITY_CONFIG[selectedDoctor.availability_status]?.icon} {selectedDoctor.availability_status}
                </span>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-xs text-[#6B6875] font-semibold">Change to:</span>
                <select
                  value={selectedDoctor.availability_status}
                  onChange={(e) => handleUpdateAvailability(selectedDoctor.id, e.target.value)}
                  disabled={isUpdatingStatus}
                  className="px-3 py-1.5 rounded-xl border border-purple-200/60 dark:border-purple-900/40 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none"
                >
                  <option value="Available">🟢 Available</option>
                  <option value="Busy">🟡 Busy</option>
                  <option value="Offline">⚪ Offline</option>
                  <option value="On Leave">🔴 On Leave</option>
                </select>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              <div className="space-y-1 p-3.5 rounded-xl liquid-glass-card">
                <span className="text-[#6B6875] uppercase font-bold text-[10px] block">Primary Department & OPD</span>
                <p className="font-bold text-[#171321] dark:text-[#F7F7F5]">{selectedDoctor.department}</p>
                <p className="text-[11px] text-[#6B6875]">Assigned: {selectedDoctor.opd_room || 'OPD Room 304'}</p>
                <p className="text-[11px] text-[#6B6875]">Degree: {selectedDoctor.medical_degree || 'MBBS, MD (Neurology)'}</p>
              </div>

              <div className="space-y-1 p-3.5 rounded-xl liquid-glass-card">
                <span className="text-[#6B6875] uppercase font-bold text-[10px] block">Medical License & Registration</span>
                <p className="font-mono font-bold text-[#171321] dark:text-[#F7F7F5]">{selectedDoctor.medical_license_number || 'MCI-NEURO-88910'}</p>
                <p className="text-[11px] text-[#6B6875]">Medical Council of India (Verified)</p>
                <p className="text-[11px] text-[#6B6875]">Clinical Experience: {selectedDoctor.experience_years}+ Years</p>
              </div>

              <div className="space-y-1 p-3.5 rounded-xl liquid-glass-card">
                <span className="text-[#6B6875] uppercase font-bold text-[10px] block">Contact Phone & Hours</span>
                <p className="font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {selectedDoctor.phone || '+91 98450 11223'}
                </p>
                <p className="text-[11px] text-[#6B6875]">Consultation: {selectedDoctor.available_from || '09:00 AM'} - {selectedDoctor.available_until || '06:00 PM'}</p>
              </div>

              <div className="space-y-1 p-3.5 rounded-xl liquid-glass-card">
                <span className="text-[#6B6875] uppercase font-bold text-[10px] block">Official Email</span>
                <p className="font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {selectedDoctor.email}
                </p>
                <span className="inline-block text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200 mt-1">
                  ✓ Verified Account
                </span>
              </div>

            </div>

            {/* Specializations & Clinical Areas */}
            <div className="space-y-2">
              <span className="text-[#6B6875] font-bold uppercase text-[10px]">Clinical Specializations & Areas of Practice</span>
              <div className="flex flex-wrap gap-2">
                {selectedDoctor.specializations && selectedDoctor.specializations.map((spec, i) => (
                  <span key={i} className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-500/10 text-[#7C3AED] dark:text-[#A78BFA] border border-purple-300/40">
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-purple-100 dark:border-purple-900/30 flex items-center justify-between gap-3">
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    const doc = selectedDoctor;
                    setSelectedDoctor(null);
                    setDoctorToDelete(doc);
                  }}
                  className="px-4 py-2 rounded-xl border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Doctor</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setSelectedDoctor(null)}
                className="px-4 py-2 rounded-xl glass-btn-secondary text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 6. Admin Delete Doctor Confirmation Modal */}
      {/* =================================================================== */}
      {doctorToDelete && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass-card bg-white/95 dark:bg-[#171321]/95 backdrop-blur-2xl rounded-3xl max-w-md w-full p-6 md:p-7 space-y-5 shadow-2xl border border-rose-200/60 dark:border-rose-900/50">
            
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#171321] dark:text-[#F7F7F5]">
                  Remove Doctor Account
                </h3>
                <p className="text-xs text-[#6B6875] dark:text-slate-400">
                  This action permanently removes the doctor from MySQL.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-xs space-y-1.5">
              <p className="font-bold text-[#171321] dark:text-[#F7F7F5]">
                {doctorToDelete.name.toLowerCase().startsWith('dr.') || doctorToDelete.name.toLowerCase().startsWith('dr ') ? doctorToDelete.name : `Dr. ${doctorToDelete.name}`}
              </p>
              <p className="text-[#6B6875] dark:text-slate-400">
                ID: <span className="font-mono font-semibold text-[#7C3AED] dark:text-[#A78BFA]">{doctorToDelete.doctor_id}</span> • {doctorToDelete.email}
              </p>
              <p className="text-rose-600 dark:text-rose-400 text-[11px] font-semibold pt-1">
                ⚠️ All associated doctor directory records and login access will be deleted.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDoctorToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl glass-btn-secondary text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteDoctor}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-500/25 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                    <span>Confirm Remove</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminAvailableDoctors;
