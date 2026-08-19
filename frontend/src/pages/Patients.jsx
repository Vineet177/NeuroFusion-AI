import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Plus, 
  Brain, 
  TrendingUp, 
  Calendar, 
  ArrowRight, 
  Eye, 
  CheckCircle2, 
  Check,
  X, 
  Filter, 
  UserPlus, 
  ShieldAlert, 
  Activity, 
  FileSpreadsheet, 
  Grid, 
  List as TableIcon, 
  Sparkles, 
  Phone, 
  Mail, 
  UserCheck,
  Download,
  Trash2,
  Stethoscope,
  Loader2
} from 'lucide-react';
import { patientApi, isPatientAssignedToUser, filterPatientsByUser } from '../api/patientApi';
import { adminDoctorApi } from '../api/adminDoctorApi';
import { useAuth } from '../hooks/useAuth';

const Patients = () => {
  const { user } = useAuth();
  const isAdmin = String(user?.role || '').trim().toLowerCase() === 'admin';

  const { selectedPatient, setSelectedPatient } = useOutletContext();
  const navigate = useNavigate();

  // State management
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Multi-Selection State (Driven by Select Buttons)
  const [selectedPatientIds, setSelectedPatientIds] = useState([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [availableDoctorsList, setAvailableDoctorsList] = useState([]);
  const [selectedDoctorToAssign, setSelectedDoctorToAssign] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Single Patient Delete Modal State
  const [patientToDelete, setPatientToDelete] = useState(null);
  
  // Register Patient Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Female',
    dob: '',
    bloodGroup: 'O+',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    primaryDoctor: user?.name ? (user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`) : '',
    medicalHistory: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch patients on mount
  useEffect(() => {
    loadPatients();
    loadDoctors();
  }, [user]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await patientApi.getPatients();
      const loaded = data || [];
      setPatients(loaded);

      // If Doctor is logged in, ensure active selected patient is within doctor's cohort
      if (!isAdmin && user) {
        const docCohort = filterPatientsByUser(loaded, user);
        if (selectedPatient && !docCohort.some(p => String(p.id).toLowerCase() === String(selectedPatient.id).toLowerCase())) {
          setSelectedPatient(docCohort.length > 0 ? docCohort[0] : null);
        } else if (!selectedPatient && docCohort.length > 0) {
          setSelectedPatient(docCohort[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load patients:', err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const res = await adminDoctorApi.getAvailableDoctors();
      setAvailableDoctorsList(res.doctors || []);
      if (res.doctors && res.doctors.length > 0) {
        setSelectedDoctorToAssign(res.doctors[0].name);
      }
    } catch (err) {
      console.error('Failed to load doctors list for batch assignment:', err);
    }
  };

  // Scope: Only show patients assigned to this doctor (Admins see all clinic patients)
  const visiblePatients = patients.filter((pt) => isPatientAssignedToUser(pt, user));

  // Search & Filter Logic on visible scoped patients
  const filteredPatients = visiblePatients.filter((pt) => {
    const matchesSearch = 
      pt.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      pt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pt.primaryDoctor && pt.primaryDoctor.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStage === 'ALL') return true;
    if (filterStage === 'HIGH_RISK') return pt.riskScore > 50;
    if (filterStage === 'MCI') return pt.stage === 'MCI' || pt.riskCategory?.includes('MCI');
    if (filterStage === 'NORMAL') return pt.stage === 'NORMAL' || pt.riskCategory?.includes('Normal');
    if (filterStage === 'DEMENTIA') return pt.riskScore > 60 || pt.stage?.includes('DEMENTIA');
    return true;
  });

  // Multiple selection helpers via Button Toggle
  const isAllSelected = filteredPatients.length > 0 && selectedPatientIds.length === filteredPatients.length;

  const handleToggleSelectPatient = (pt, e) => {
    if (e) e.stopPropagation();
    const ptId = pt.id;
    
    // Toggle in selection list
    if (selectedPatientIds.includes(ptId)) {
      setSelectedPatientIds(prev => prev.filter(id => id !== ptId));
    } else {
      setSelectedPatientIds(prev => [...prev, ptId]);
      // Also make this the active patient for single-focus context if no active patient exists or clicked
      setSelectedPatient(pt);
      showToast(`Selected ${pt.name} (${pt.id})`);
    }
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedPatientIds([]);
    } else {
      setSelectedPatientIds(filteredPatients.map((p) => p.id));
    }
  };

  const clearSelection = () => {
    setSelectedPatientIds([]);
  };

  // Batch action: Set first selected as active subject
  const handleBatchSetActive = () => {
    if (selectedPatientIds.length === 0) return;
    const target = patients.find(p => p.id === selectedPatientIds[0]);
    if (target) {
      setSelectedPatient(target);
      showToast(`Set ${target.name} (${target.id}) as active analysis patient`);
    }
  };

  // Batch action: Export selected patients as CSV
  const handleBatchExportCsv = () => {
    const selectedObjs = patients.filter(p => selectedPatientIds.includes(p.id));
    if (selectedObjs.length === 0) return;

    const headers = ['Patient ID', 'Full Name', 'Age', 'Gender', 'Phone', 'Risk Score', 'Stage', 'Primary Doctor', 'Last Assessment'];
    const rows = selectedObjs.map(p => [
      p.id,
      `"${p.name}"`,
      p.age,
      p.gender,
      p.phone || 'N/A',
      `${p.riskScore || 0}%`,
      p.stage || 'Normal',
      `"${p.primaryDoctor || 'Unassigned'}"`,
      p.lastAssessment || new Date().toISOString().split('T')[0]
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `neurofusion_patient_cohort_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`✓ Exported ${selectedObjs.length} patient records to CSV!`);
  };

  // Batch action: Assign Doctor
  const handleConfirmBatchAssign = async (e) => {
    e.preventDefault();
    if (!selectedDoctorToAssign) {
      alert('Please select a doctor to assign.');
      return;
    }
    setIsAssigning(true);
    try {
      await patientApi.batchAssignDoctor(selectedPatientIds, selectedDoctorToAssign);
      showToast(`✓ Successfully assigned ${selectedPatientIds.length} patient(s) to ${selectedDoctorToAssign}!`);
      
      // Update local active patient if included in assignment
      if (selectedPatient && selectedPatientIds.some(id => 
        String(selectedPatient.id).toLowerCase() === String(id).toLowerCase() || 
        String(selectedPatient.db_id).toLowerCase() === String(id).toLowerCase()
      )) {
        setSelectedPatient(prev => ({ 
          ...prev, 
          primaryDoctor: selectedDoctorToAssign, 
          assigned_doctor: selectedDoctorToAssign, 
          doctor_name: selectedDoctorToAssign 
        }));
      }

      setIsAssignModalOpen(false);
      clearSelection();
      await loadPatients();
    } catch (err) {
      console.error('Batch assign failed:', err);
      showToast('Failed to assign doctor.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Batch action: Delete (Admin only)
  const handleBatchDelete = async () => {
    if (!isAdmin) return;
    if (window.confirm(`Are you sure you want to permanently delete all ${selectedPatientIds.length} selected patient records and their medical files from MySQL?`)) {
      setIsDeleting(true);
      try {
        await patientApi.batchDeletePatients(selectedPatientIds);
        showToast(`✓ Deleted ${selectedPatientIds.length} patient records from MySQL!`);
        clearSelection();
        await loadPatients();
      } catch (err) {
        console.error('Batch delete failed:', err);
        showToast('Failed to delete patients.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Single patient removal (Admin only)
  const confirmDeletePatient = async () => {
    if (!patientToDelete) return;
    setIsDeleting(true);
    try {
      await patientApi.deletePatient(patientToDelete.id, patientToDelete.name);
      showToast(`✓ Patient ${patientToDelete.name} (${patientToDelete.id}) removed from database.`);
      
      // If the deleted patient was currently active, update active patient
      if (selectedPatient?.id === patientToDelete.id || String(selectedPatient?.id).toLowerCase() === String(patientToDelete.id).toLowerCase()) {
        const remaining = patients.filter(p => p.id !== patientToDelete.id);
        setSelectedPatient(remaining.length > 0 ? remaining[0] : null);
      }

      setPatientToDelete(null);
      await loadPatients();
    } catch (err) {
      console.error('Failed to delete patient:', err);
      showToast('Error deleting patient from database.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewDetails = (patientId, e) => {
    if (e) e.stopPropagation();
    navigate(`/patients/${patientId}`);
  };

  const handleViewMri = (pt, e) => {
    if (e) e.stopPropagation();
    setSelectedPatient(pt);
    navigate(`/mri-analysis?patientId=${pt.id}`);
  };

  const handleViewEeg = (pt, e) => {
    if (e) e.stopPropagation();
    setSelectedPatient(pt);
    navigate(`/eeg-analysis?patientId=${pt.id}`);
  };

  const handleViewReport = (pt, e) => {
    if (e) e.stopPropagation();
    setSelectedPatient(pt);
    navigate(`/reports?patientId=${pt.id}`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.dob || !formData.phone || !formData.address) {
      alert('Please fill in all mandatory fields: Full Name, Age, Date of Birth, Phone Number, and Address.');
      return;
    }
    setIsSubmitting(true);
    try {
      const newPt = await patientApi.createPatient(formData);
      const updatedList = await patientApi.getPatients();
      setPatients(updatedList);
      setSelectedPatient(newPt);

      setIsRegisterOpen(false);
      showToast(`Successfully registered ${newPt.name} (${newPt.id})!`);
      setFormData({
        name: '',
        age: '',
        gender: 'Female',
        dob: '',
        bloodGroup: 'O+',
        phone: '',
        email: '',
        address: '',
        emergencyContact: '',
        primaryDoctor: '',
        medicalHistory: ''
      });
    } catch (err) {
      console.error('Failed to register patient:', err);
      alert(err.message || 'Error occurred while saving patient to MySQL database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Aggregate Stats based on Doctor/Admin visibility scope
  const totalCount = visiblePatients.length;
  const highRiskCount = visiblePatients.filter((p) => p.riskScore > 50).length;
  const mciCount = visiblePatients.filter((p) => p.stage === 'MCI' || p.riskCategory?.includes('MCI')).length;
  const normalCount = visiblePatients.filter((p) => p.stage === 'NORMAL' || p.riskCategory?.includes('Normal')).length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-3 text-xs font-semibold animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#7C3AED]" />
            <span>Patient Management & Clinical Directory</span>
          </h1>
          {!isAdmin && user && (
            <p className="text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA] mt-1 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Displaying patients registered under Dr. {user.name} ({totalCount} patients)</span>
            </p>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="px-4 py-2 rounded-xl glass-btn-primary text-xs font-bold transition flex items-center space-x-2 shadow-md shadow-purple-500/20 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Patient</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="liquid-glass-card p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#6B6875] dark:text-slate-400 uppercase tracking-wider">Total Directory</p>
            <h3 className="text-2xl font-extrabold text-[#171321] dark:text-[#F7F7F5] mt-1">{totalCount}</h3>
          </div>
          <div className="p-3 rounded-2xl bg-purple-500/10 text-[#7C3AED] dark:text-[#A78BFA]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="liquid-glass-card p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#6B6875] dark:text-slate-400 uppercase tracking-wider">High Risk (&gt;50%)</p>
            <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{highRiskCount}</h3>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="liquid-glass-card p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#6B6875] dark:text-slate-400 uppercase tracking-wider">MCI Stage</p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{mciCount}</h3>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="liquid-glass-card p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#6B6875] dark:text-slate-400 uppercase tracking-wider">Cognitively Normal</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{normalCount}</h3>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="liquid-glass-card p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Patient Name, Patient ID (NF-xxxx), or Primary Doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-xs text-[#171321] dark:text-[#F7F7F5] placeholder-slate-400 focus:outline-none focus:border-[#7C3AED] transition"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto text-xs">
          {[
            { id: 'ALL', label: 'All Patients' },
            { id: 'HIGH_RISK', label: 'High Risk (>50%)' },
            { id: 'MCI', label: 'MCI Stage' },
            { id: 'DEMENTIA', label: 'Dementia Stage' },
            { id: 'NORMAL', label: 'Cognitively Normal' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStage(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                filterStage === tab.id
                  ? 'glass-btn-primary shadow-xs'
                  : 'liquid-glass-card text-slate-600 dark:text-slate-300 hover:text-[#171321]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Controls: Select All & View Mode */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleSelectAll}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center space-x-1.5 ${
              isAllSelected
                ? 'bg-purple-500/20 text-[#7C3AED] border-purple-400'
                : 'liquid-glass-card text-slate-700 dark:text-slate-300 hover:border-purple-300'
            }`}
            title="Select or deselect all patients"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 liquid-glass-card p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'table' ? 'bg-purple-500/20 text-[#7C3AED]' : 'text-slate-400 hover:text-[#171321]'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-purple-500/20 text-[#7C3AED]' : 'text-slate-400 hover:text-[#171321]'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MULTIPLE PATIENTS SELECTED: BATCH OPERATIONS FLOATING BAR */}
      {/* =================================================================== */}
      {selectedPatientIds.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#0F172A] dark:bg-slate-800 text-white shadow-xl border border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center space-x-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2563EB] text-white font-black text-xs">
              {selectedPatientIds.length}
            </span>
            <div>
              <p className="text-xs font-bold text-white">
                {selectedPatientIds.length} {selectedPatientIds.length === 1 ? 'Patient Selected' : 'Patients Selected'}
              </p>
              <p className="text-[11px] text-slate-400">Apply batch assignments, export dataset, or initiate cohort triage</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Set Active Patient */}
            <button
              onClick={handleBatchSetActive}
              className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition flex items-center space-x-1.5 cursor-pointer"
              title="Set first selected patient as active"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Set Active</span>
            </button>

            {/* Assign Doctor */}
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Assign Doctor</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleBatchExportCsv}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Run AI Multimodal Model */}
            <Link
              to="/prediction-result"
              className="px-3 py-1.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Triage</span>
            </Link>

            {/* Delete Selected (Admin Only) */}
            {isAdmin && (
              <button
                onClick={handleBatchDelete}
                disabled={isDeleting}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete</span>
              </button>
            )}

            {/* Clear Selection */}
            <button
              onClick={clearSelection}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Clear Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="liquid-glass-card p-12 rounded-3xl text-center space-y-3 shadow-xl">
          <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#6B6875] dark:text-slate-400 font-medium">Loading Patient Management Directory...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="liquid-glass-card p-12 rounded-3xl text-center space-y-3 shadow-xl">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5]">No matching patients found</h3>
          <p className="text-xs text-[#6B6875] dark:text-slate-400 max-w-sm mx-auto">
            Try adjusting your search criteria or register a new patient to add them to the system directory.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        
        /* Patients Table view (Liquid Frosted Glass) */
        <div className="liquid-glass-card rounded-3xl border border-purple-200/40 dark:border-purple-900/40 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/40 dark:bg-purple-950/40 border-b border-purple-200/40 dark:border-purple-900/40 text-[#6B6875] dark:text-purple-300 font-bold uppercase tracking-wider text-[11px] backdrop-blur-md">
                  <th className="py-3.5 px-4">Patient ID</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Age</th>
                  <th className="py-3.5 px-4">Gender</th>
                  <th className="py-3.5 px-4">Last Assessment</th>
                  <th className="py-3.5 px-4">Risk Level</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100/40 dark:divide-purple-900/30">
                {filteredPatients.map((pt) => {
                  const isActiveSubject = selectedPatient?.id === pt.id;
                  const isSelectedInCohort = selectedPatientIds.includes(pt.id);
                  const isHighRisk = pt.riskScore > 50;

                  return (
                    <tr
                      key={pt.id}
                      onClick={() => handleViewDetails(pt.id)}
                      className={`transition-colors cursor-pointer group ${
                        isSelectedInCohort
                          ? 'bg-purple-500/20 dark:bg-purple-900/40'
                          : isActiveSubject 
                            ? 'bg-purple-500/10 dark:bg-purple-950/40 hover:bg-purple-500/15' 
                            : 'hover:bg-purple-500/5 dark:hover:bg-purple-900/20'
                      }`}
                    >
                      {/* 1. Patient ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2.5 py-1 rounded-xl font-mono text-xs font-bold border transition ${
                            isSelectedInCohort || isActiveSubject
                              ? 'bg-[#7C3AED]/20 border-[#7C3AED] text-[#7C3AED] dark:text-[#A78BFA]'
                              : 'bg-white/60 dark:bg-slate-900/60 border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5] group-hover:border-[#7C3AED]'
                          }`}>
                            {pt.id}
                          </span>
                          {isActiveSubject && (
                            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-purple-500/20 text-[#7C3AED] dark:text-[#A78BFA] border border-purple-300 dark:border-purple-700 font-semibold">
                              Active
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-sm ${
                            isSelectedInCohort ? 'bg-emerald-600' : 'bg-gradient-to-br from-[#7C3AED] to-[#A78BFA]'
                          }`}>
                            {isSelectedInCohort ? '✓' : (pt.initials || pt.name.substring(0, 2).toUpperCase())}
                          </div>
                          <div>
                            <p className="font-bold text-[#171321] dark:text-[#F7F7F5] text-xs group-hover:text-[#7C3AED] dark:group-hover:text-[#A78BFA] transition-colors">
                              {pt.name}
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPatientIds([pt.id]);
                                setIsAssignModalOpen(true);
                              }}
                              className="text-[10px] text-[#6B6875] dark:text-slate-400 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] flex items-center gap-1 mt-0.5 group/doc transition cursor-pointer"
                              title="Click to assign or change attending doctor"
                            >
                              <Stethoscope className="w-3 h-3 text-[#7C3AED] dark:text-[#A78BFA] shrink-0" />
                              <span className="font-semibold underline decoration-dotted decoration-purple-300 dark:decoration-purple-600">
                                Doc: {pt.primaryDoctor || 'Unassigned'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* 3. Age */}
                      <td className="py-3.5 px-4 font-medium text-[#171321] dark:text-slate-200">
                        {pt.age} yrs
                      </td>

                      {/* 4. Gender */}
                      <td className="py-3.5 px-4 text-[#171321] dark:text-slate-200">
                        {pt.gender}
                      </td>

                      {/* 5. Last Assessment */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#171321] dark:text-slate-200">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{pt.lastAssessment || '2026-07-20'}</span>
                        </div>
                      </td>

                      {/* 6. Risk Level */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isHighRisk
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50'
                              : pt.riskScore > 20
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
                          }`}>
                            {pt.riskScore || 0}% Risk
                          </span>
                          
                          {/* Mini Progress Bar */}
                          <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden hidden sm:block">
                            <div 
                              className={`h-full rounded-full ${
                                isHighRisk ? 'bg-red-500' : pt.riskScore > 20 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.max(pt.riskScore || 0, 8)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 7. Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          
                          {/* View MRI Result Button */}
                          <button
                            onClick={(e) => handleViewMri(pt, e)}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 border border-blue-200/60 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                            title="View MRI scan analysis for this patient"
                          >
                            <Brain className="w-3.5 h-3.5" />
                            <span>MRI</span>
                          </button>

                          {/* View EEG Result Button */}
                          <button
                            onClick={(e) => handleViewEeg(pt, e)}
                            className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 border border-purple-200/60 dark:border-purple-800/50 text-[#7C3AED] dark:text-[#A78BFA] text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                            title="View EEG spectral frequency analysis for this patient"
                          >
                            <Activity className="w-3.5 h-3.5" />
                            <span>EEG</span>
                          </button>

                          {/* View Diagnostic Report Button */}
                          <button
                            onClick={(e) => handleViewReport(pt, e)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                            title="View complete diagnostic report for this patient"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>Report</span>
                          </button>

                          {/* View Details Button */}
                          <button
                            onClick={(e) => handleViewDetails(pt.id, e)}
                            className="px-2.5 py-1.5 rounded-xl bg-white/60 hover:bg-white/90 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border border-purple-200/60 dark:border-purple-900/50 text-[#171321] dark:text-[#F7F7F5] text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
                            title="View full patient medical profile"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#7C3AED]" />
                            <span>Details</span>
                          </button>

                          {/* Admin Remove Patient Button */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPatientToDelete(pt);
                              }}
                              className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-600 hover:text-white dark:text-rose-400 dark:hover:text-white border border-rose-200/60 dark:border-rose-800/50 text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
                              title={`Delete ${pt.name} from database`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Multi-Select Button (Select / Selected / Active) */}
                          <button
                            onClick={(e) => handleToggleSelectPatient(pt, e)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center space-x-1 shadow-xs cursor-pointer ${
                              isSelectedInCohort
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : isActiveSubject
                                  ? 'bg-purple-500/20 hover:bg-purple-500/30 text-[#7C3AED] dark:text-[#A78BFA] border border-purple-300 dark:border-purple-700'
                                  : 'glass-btn-primary text-white shadow-md shadow-purple-500/25'
                            }`}
                            title={
                              isSelectedInCohort 
                                ? 'Click to deselect from cohort' 
                                : 'Click to select for multiple patient actions'
                            }
                          >
                            {isSelectedInCohort ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Selected</span>
                              </>
                            ) : isActiveSubject ? (
                              <span>Active</span>
                            ) : (
                              <span>Select</span>
                            )}
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      ) : (

        /* Grid View Alternative (Liquid Glass) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPatients.map((pt) => {
            const isActiveSubject = selectedPatient?.id === pt.id;
            const isSelectedInCohort = selectedPatientIds.includes(pt.id);
            const isHighRisk = pt.riskScore > 50;

            return (
              <div
                key={pt.id}
                onClick={() => handleViewDetails(pt.id)}
                className={`liquid-glass-card p-6 rounded-3xl border transition-all cursor-pointer shadow-xl relative ${
                  isSelectedInCohort
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-emerald-500/10'
                    : isActiveSubject
                      ? 'border-[#7C3AED] bg-purple-500/10'
                      : 'border-purple-200/50 dark:border-purple-900/40 hover:border-[#7C3AED]/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-bold text-white tracking-wider shadow-sm ${
                      isSelectedInCohort ? 'bg-emerald-600' : 'bg-gradient-to-br from-[#7C3AED] to-[#A78BFA]'
                    }`}>
                      {isSelectedInCohort ? '✓' : (pt.initials || pt.name.substring(0, 2).toUpperCase())}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5]">{pt.name}</h3>
                      <p className="text-xs text-[#6B6875] dark:text-slate-400 font-mono mt-0.5">
                        {pt.id} • {pt.gender}, {pt.age} yrs
                      </p>
                      <p className="text-[11px] text-[#7C3AED] dark:text-[#A78BFA] font-medium mt-1">
                        Doctor: {pt.primaryDoctor || 'Unassigned'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${
                      isHighRisk 
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50' 
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
                    }`}>
                      {pt.riskScore || 0}% Risk
                    </span>
                    <p className="text-[10px] text-[#6B6875] dark:text-slate-400 mt-1">Last: {pt.lastAssessment || '2026-07-20'}</p>
                  </div>
                </div>

                {/* Grid Card Actions */}
                <div className="mt-6 pt-4 border-t border-purple-100/50 dark:border-purple-900/30 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleToggleSelectPatient(pt, e)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                      isSelectedInCohort
                        ? 'bg-emerald-600 text-white'
                        : isActiveSubject
                          ? 'bg-purple-500/20 text-[#7C3AED] dark:text-[#A78BFA] border border-purple-300 dark:border-purple-700'
                          : 'glass-btn-primary text-white shadow-md shadow-purple-500/25'
                    }`}
                  >
                    {isSelectedInCohort ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Selected</span>
                      </>
                    ) : isActiveSubject ? (
                      <span>Active</span>
                    ) : (
                      <span>Select</span>
                    )}
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleViewMri(pt, e)}
                      className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-200/50 dark:border-blue-800/40 cursor-pointer"
                      title="View MRI"
                    >
                      <Brain className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleViewEeg(pt, e)}
                      className="p-2 rounded-xl bg-purple-500/10 text-[#7C3AED] dark:text-[#A78BFA] hover:bg-purple-500/20 border border-purple-200/50 dark:border-purple-800/40 cursor-pointer"
                      title="View EEG"
                    >
                      <Activity className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleViewDetails(pt.id, e)}
                      className="px-3 py-1.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/60 dark:border-purple-900/50 text-[#171321] dark:text-[#F7F7F5] hover:border-[#7C3AED] text-xs font-bold cursor-pointer"
                    >
                      Details
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPatientToDelete(pt);
                        }}
                        className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white border border-rose-200/50 dark:border-rose-800/40 transition cursor-pointer"
                        title={`Delete ${pt.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      )}

      {/* =================================================================== */}
      {/* BATCH ASSIGN DOCTOR MODAL */}
      {/* =================================================================== */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass-card bg-white/95 dark:bg-[#171321]/95 backdrop-blur-2xl rounded-3xl max-w-md w-full p-6 md:p-7 space-y-4 shadow-2xl border border-purple-200/60 dark:border-purple-900/50">
            <div className="flex items-center justify-between border-b border-purple-100 dark:border-purple-900/30 pb-3">
              <h3 className="font-extrabold text-[#171321] dark:text-[#F7F7F5] text-sm flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
                <span>Batch Assign Attending Doctor</span>
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmBatchAssign} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5] space-y-1">
                <p className="font-bold text-[#7C3AED] dark:text-[#A78BFA]">
                  Assigning to {selectedPatientIds.length} Selected Patient(s):
                </p>
                <p className="text-[11px] text-[#6B6875] dark:text-slate-400 font-mono truncate">
                  {selectedPatientIds.join(', ')}
                </p>
              </div>

              <div>
                <label className="block font-bold text-[#171321] dark:text-[#F7F7F5] mb-1.5">Select Attending Doctor *</label>
                <select
                  value={selectedDoctorToAssign}
                  onChange={(e) => setSelectedDoctorToAssign(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-purple-200/60 dark:border-purple-900/50 bg-white/80 dark:bg-slate-900/80 text-[#171321] dark:text-[#F7F7F5] font-semibold focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 cursor-pointer"
                >
                  <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">-- Choose Doctor --</option>
                  {availableDoctorsList.map((doc) => (
                    <option key={doc.id} value={doc.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {doc.name} ({doc.specialization}) • {doc.availability_status}
                    </option>
                  ))}
                  <option value="Dr. Vineet Mantur, MD" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Dr. Vineet Mantur, MD (Cognitive Neurology)</option>
                  <option value="Dr. Sarah Connor" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Dr. Sarah Connor (Neurology)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl glass-btn-secondary text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="px-5 py-2 rounded-xl glass-btn-primary font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/25 cursor-pointer disabled:opacity-50"
                >
                  {isAssigning ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  <span>Confirm Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* REGISTER NEW PATIENT MODAL */}
      {/* =================================================================== */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass-card bg-white/95 dark:bg-[#171321]/95 backdrop-blur-2xl rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-5 shadow-2xl border border-purple-200/60 dark:border-purple-900/50 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-purple-100 dark:border-purple-900/30 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-200/50 dark:border-purple-800/50 text-[#7C3AED] dark:text-[#A78BFA]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-[#171321] dark:text-[#F7F7F5] text-base">Register New Patient</h3>
              </div>
              <button 
                onClick={() => setIsRegisterOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              
              {/* Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#171321] dark:text-[#F7F7F5] mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Rameshwar Patel"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-purple-200/60 dark:border-purple-900/50 bg-white/80 dark:bg-slate-900/80 text-[#171321] dark:text-[#F7F7F5] font-semibold placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#171321] dark:text-[#F7F7F5] mb-1">Age *</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleFormChange}
                    placeholder="e.g. 68"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-purple-200/60 dark:border-purple-900/50 bg-white/80 dark:bg-slate-900/80 text-[#171321] dark:text-[#F7F7F5] font-semibold placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#171321] dark:text-[#F7F7F5] mb-1">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200/60 dark:border-purple-900/50 bg-white/80 dark:bg-slate-900/80 text-[#171321] dark:text-[#F7F7F5] font-semibold focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  >
                    <option value="Male" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Male</option>
                    <option value="Female" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Female</option>
                    <option value="Other" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#171321] dark:text-[#F7F7F5] mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-purple-200/60 dark:border-purple-900/50 bg-white/80 dark:bg-slate-900/80 text-[#171321] dark:text-[#F7F7F5] font-semibold focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#171321] dark:text-[#F7F7F5] mb-1">Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200/60 dark:border-purple-900/50 bg-white/80 dark:bg-slate-900/80 text-[#171321] dark:text-[#F7F7F5] font-semibold focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  >
                    <option value="A+" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">A+</option>
                    <option value="A-" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">A-</option>
                    <option value="B+" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">B+</option>
                    <option value="B-" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">B-</option>
                    <option value="O+" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">O+</option>
                    <option value="O-" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">O-</option>
                    <option value="AB+" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">AB+</option>
                    <option value="AB-" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">AB-</option>
                  </select>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#171321] dark:text-[#F7F7F5] mb-1">Phone Number *</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    placeholder="e.g. +91 98765 43210"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-purple-200/60 dark:border-purple-900/50 bg-white/80 dark:bg-slate-900/80 text-[#171321] dark:text-[#F7F7F5] font-semibold placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#171321] dark:text-[#F7F7F5] mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="patient@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200/60 dark:border-purple-900/50 bg-white/80 dark:bg-slate-900/80 text-[#171321] dark:text-[#F7F7F5] font-semibold placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#171321] dark:text-[#F7F7F5] mb-1">Residential Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  placeholder="e.g. 42 Richmond Road, Bangalore, Karnataka"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-purple-200/60 dark:border-purple-900/50 bg-white/80 dark:bg-slate-900/80 text-[#171321] dark:text-[#F7F7F5] font-semibold placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                />
              </div>

              {/* Clinical Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#171321] dark:text-[#F7F7F5] mb-1">Primary Attending Doctor</label>
                  <input
                    type="text"
                    name="primaryDoctor"
                    value={formData.primaryDoctor}
                    onChange={handleFormChange}
                    placeholder="e.g. Dr. Vineet Mantur"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200/60 dark:border-purple-900/50 bg-white/80 dark:bg-slate-900/80 text-[#171321] dark:text-[#F7F7F5] font-semibold placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#171321] dark:text-[#F7F7F5] mb-1">Emergency Contact Phone</label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleFormChange}
                    placeholder="e.g. +91 98765 00000"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200/60 dark:border-purple-900/50 bg-white/80 dark:bg-slate-900/80 text-[#171321] dark:text-[#F7F7F5] font-semibold placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#171321] dark:text-[#F7F7F5] mb-1">Medical History & Initial Notes</label>
                <textarea
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="e.g. Memory lapses reported 6 months ago, hypertension under medication..."
                  className="w-full px-3 py-2 rounded-xl border border-purple-200/60 dark:border-purple-900/50 bg-white/80 dark:bg-slate-900/80 text-[#171321] dark:text-[#F7F7F5] font-semibold placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                />
              </div>

              <div className="pt-3 border-t border-purple-100 dark:border-purple-900/30 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-xl glass-btn-secondary text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl glass-btn-primary font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/25 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  <span>Save & Register Patient</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SINGLE PATIENT DELETE CONFIRMATION MODAL (Admin Only) */}
      {/* =================================================================== */}
      {patientToDelete && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass-card bg-white/95 dark:bg-[#171321]/95 backdrop-blur-2xl rounded-3xl max-w-md w-full p-6 md:p-7 space-y-5 shadow-2xl border border-rose-200/60 dark:border-rose-900/50">
            
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#171321] dark:text-[#F7F7F5]">
                  Remove Patient Record
                </h3>
                <p className="text-xs text-[#6B6875] dark:text-slate-400">
                  This action permanently removes the patient from MySQL.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-xs space-y-1.5">
              <p className="font-bold text-[#171321] dark:text-[#F7F7F5]">
                {patientToDelete.name}
              </p>
              <p className="text-[#6B6875] dark:text-slate-400">
                ID: <span className="font-mono font-semibold text-[#7C3AED] dark:text-[#A78BFA]">{patientToDelete.id}</span> • {patientToDelete.gender}, {patientToDelete.age} yrs
              </p>
              {patientToDelete.primaryDoctor && (
                <p className="text-[#6B6875] dark:text-slate-400">
                  Primary Doctor: <span className="font-semibold text-slate-700 dark:text-slate-300">{patientToDelete.primaryDoctor}</span>
                </p>
              )}
              <p className="text-rose-600 dark:text-rose-400 text-[11px] font-semibold pt-1">
                ⚠️ All associated MRI brain scans, EEG signals, cognitive assessments, and diagnostic reports will be deleted.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPatientToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl glass-btn-secondary text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeletePatient}
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
                    <span>Confirm Remove Patient</span>
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

export default Patients;
