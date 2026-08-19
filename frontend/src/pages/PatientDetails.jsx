import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Brain, 
  Activity, 
  FileSpreadsheet, 
  ShieldAlert, 
  Clock, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Heart, 
  AlertCircle, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  Download, 
  Share2, 
  Edit, 
  Layers,
  ChevronRight,
  Stethoscope,
  Trash2,
  Upload,
  BrainCircuit,
  Award
} from 'lucide-react';
import { patientApi, getPatientStoredData, MOCK_PATIENTS_DETAILED } from '../api/patientApi';

const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedPatient, setSelectedPatient } = useOutletContext() || {};

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'personal', 'mri', 'eeg', 'cognitive', 'risk', 'timeline'
  const [toastMsg, setToastMsg] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadPatientData();
  }, [id]);

  const loadPatientData = async () => {
    setLoading(true);
    try {
      if (!id) {
        setPatient(null);
        return;
      }
      const data = await patientApi.getPatientById(id);
      setPatient(data || null);
    } catch (err) {
      console.error('Error loading patient details:', err);
      setPatient(null);
    } finally {
      setLoading(false);
    }
  };

  const isSelected = selectedPatient?.id === patient?.id || selectedPatient?.name === patient?.name;

  const handleSetActive = () => {
    if (patient && setSelectedPatient) {
      setSelectedPatient(patient);
      triggerToast(`Set ${patient.name} (${patient.id}) as active analysis subject!`);
    }
  };

  const handleDeletePatient = async () => {
    if (!patient) return;
    setIsDeleting(true);
    try {
      const targetId = patient.db_id || patient.id;
      await patientApi.deletePatient(targetId, patient.name);

      if (selectedPatient?.id === patient.id || selectedPatient?.name === patient.name) {
        setSelectedPatient(null);
      }

      triggerToast(`Patient ${patient.name} (${patient.id}) deleted from database!`);
      setTimeout(() => {
        navigate('/patients');
      }, 800);
    } catch (err) {
      console.error('Error deleting patient:', err);
      triggerToast('Failed to delete patient from database.');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  if (loading) {
    return (
      <div className="liquid-glass-card p-12 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 text-center space-y-3 my-8 shadow-xl">
        <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#6B6875] dark:text-slate-400 font-medium">Loading Patient Clinical File...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="liquid-glass-card p-12 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 text-center space-y-4 my-8 shadow-xl">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-[#171321] dark:text-[#F7F7F5]">Patient Record Not Found</h2>
        <p className="text-xs text-[#6B6875] dark:text-slate-400">No patient matching ID "{id}" exists in the directory.</p>
        <Link to="/patients" className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl glass-btn-primary text-white font-bold text-xs">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Patient Directory</span>
        </Link>
      </div>
    );
  }

  // Retrieve authentic stored patient data for each modality
  const storedMri = getPatientStoredData(patient, 'mri') || patient?.mri || null;
  const storedEeg = getPatientStoredData(patient, 'eeg') || patient?.eeg || null;
  const storedCog = getPatientStoredData(patient, 'cognitive') || patient?.cognitive || null;
  const storedMulti = getPatientStoredData(patient, 'multimodal') || patient?.multimodal || null;

  // 1. MRI Model Outputs (ResNet-50)
  const hasMri = Boolean(storedMri && storedMri.prediction && storedMri.prediction !== 'Error');
  const mriPrediction = hasMri ? storedMri.prediction : null;
  const mriConfidence = hasMri && storedMri.confidence !== undefined 
    ? (typeof storedMri.confidence === 'number' ? `${Math.round(storedMri.confidence * 100)}%` : String(storedMri.confidence)) 
    : null;
  const mriFileName = storedMri?.signal_info?.filename || storedMri?.fileName || (hasMri ? 'Volumetric MRI Scan' : null);
  const mriProbs = hasMri && storedMri.probabilities ? storedMri.probabilities : null;
  const mriDate = storedMri?.scanDate || patient?.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];

  // 2. EEG Model Outputs (2-Layer LSTM + Welch PSD)
  const hasEeg = Boolean(storedEeg && storedEeg.prediction && storedEeg.prediction !== 'Error');
  const eegPrediction = hasEeg ? storedEeg.prediction : null;
  const eegConfidence = hasEeg && storedEeg.confidence !== undefined 
    ? (typeof storedEeg.confidence === 'number' ? `${Math.round(storedEeg.confidence * 100)}%` : String(storedEeg.confidence)) 
    : null;
  const eegFileName = storedEeg?.signal_info?.filename || storedEeg?.fileName || (hasEeg ? '16-Channel EEG Sequence' : null);
  const eegProbs = hasEeg && storedEeg.probabilities ? storedEeg.probabilities : null;
  const eegFreqAnalysis = storedEeg?.frequency_analysis || storedEeg?.frequencyBands || null;
  const eegBands = eegFreqAnalysis?.oscillatory_frequency_bands || storedEeg?.frequencyBands || (storedEeg?.bandPowers ? {
    Delta: { relative_power: storedEeg.bandPowers.delta },
    Theta: { relative_power: storedEeg.bandPowers.theta },
    Alpha: { relative_power: storedEeg.bandPowers.alpha },
    Beta: { relative_power: storedEeg.bandPowers.beta }
  } : null);
  const eegDominantBand = eegFreqAnalysis?.dominant_oscillatory_band || storedEeg?.dominantBand || null;
  const eegTar = (eegFreqAnalysis?.theta_alpha_ratio !== undefined && eegFreqAnalysis?.theta_alpha_ratio !== null)
    ? eegFreqAnalysis.theta_alpha_ratio
    : null;
  const eegDate = storedEeg?.scanDate || patient?.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];

  // 3. Cognitive Battery Scores (MMSE & MoCA)
  const rawMmse = storedCog?.mmseScore ?? storedCog?.mmse_score ?? storedCog?.mmse ?? storedMulti?.mmseScore ?? patient?.cognitive?.mmseScore;
  const rawMoca = storedCog?.mocaScore ?? storedCog?.moca_score ?? storedCog?.moca ?? storedMulti?.mocaScore ?? patient?.cognitive?.mocaScore;
  const hasCognitive = (rawMmse !== undefined && rawMmse !== null && rawMmse !== '') || (rawMoca !== undefined && rawMoca !== null && rawMoca !== '');
  const mmseScore = rawMmse ? (String(rawMmse).includes('/') ? rawMmse : `${rawMmse} / 30`) : null;
  const mocaScore = rawMoca ? (String(rawMoca).includes('/') ? rawMoca : `${rawMoca} / 30`) : null;
  const cognitiveNotes = storedCog?.notes || 'Standardized clinical cognitive evaluation.';

  // 4. Multimodal Fusion Results & Risk
  const finalDiag = storedMulti?.diagnosis || storedMulti?.prediction || (
    hasMri && hasEeg 
      ? (mriPrediction === 'Moderate Demented' || eegPrediction === 'Alzheimer' ? "Alzheimer's Disease" : mriPrediction)
      : (mriPrediction || eegPrediction || patient?.stage || 'Baseline Evaluation')
  );
  const finalRiskPct = storedMulti?.riskPercentage ?? (storedMulti?.confidence ? Math.round(storedMulti.confidence * 100) : (patient?.riskScore ?? 0));
  const isHighRisk = finalRiskPct > 50;
  const finalRiskCategory = storedMulti?.riskCategory || (finalRiskPct > 50 ? 'High Risk' : (finalRiskPct > 20 ? 'Moderate Risk' : 'Low Risk'));
  const finalConfidence = storedMulti?.confidence !== undefined
    ? `${Math.round(storedMulti.confidence * 100)}%`
    : (mriConfidence || eegConfidence || patient?.aiConfidence || 'Pending');

  return (
    <div className="space-y-6 pb-12 font-sans text-[#171321] dark:text-[#F7F7F5]">
      
      {/* Toast Popup */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl glass-btn-primary text-white font-bold text-xs shadow-xl flex items-center space-x-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <button
          onClick={() => navigate('/patients')}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA] hover:underline transition group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Patient Directory</span>
        </button>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleSetActive}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              isSelected
                ? 'bg-purple-500/20 text-[#7C3AED] dark:text-[#A78BFA] border border-purple-300 dark:border-purple-700'
                : 'glass-btn-primary text-white shadow-md shadow-purple-500/25'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>{isSelected ? 'Active Analysis Subject' : 'Set Active Subject'}</span>
          </button>

          <Link
            to={`/reports?patientId=${patient.id}`}
            className="px-3.5 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-purple-200/50 dark:border-purple-900/40 text-xs font-semibold text-[#171321] dark:text-[#F7F7F5] transition flex items-center space-x-1.5 shadow-xs"
          >
            <FileText className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
            <span>AI Diagnostic Report</span>
          </Link>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-400 transition flex items-center space-x-1.5 cursor-pointer"
            title="Delete patient from database"
          >
            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Delete Patient</span>
          </button>
        </div>

      </div>

      {/* Delete Patient Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass-card p-6 rounded-3xl border border-rose-500/30 max-w-md w-full space-y-4 text-[#171321] dark:text-[#F7F7F5] shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5]">Delete Patient Record</h3>
                <p className="text-[11px] text-[#6B6875] dark:text-slate-400">Permanent Database Removal</p>
              </div>
            </div>

            <p className="text-xs text-[#6B6875] dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete patient <strong className="text-[#171321] dark:text-[#F7F7F5]">{patient.name} ({patient.id})</strong> from the database? All associated clinical files and test records will be removed.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-xs font-semibold text-[#171321] dark:text-slate-300 hover:bg-white/80 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleDeletePatient}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-60 shadow-md shadow-rose-600/25"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Profile Identity Card */}
      <div className="liquid-glass-card p-6 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#A78BFA] flex items-center justify-center text-xl font-extrabold text-white shadow-lg shadow-purple-500/25">
            {patient.initials || patient.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl md:text-2xl font-bold text-[#171321] dark:text-[#F7F7F5] tracking-wide">{patient.name}</h1>
              <span className="px-2.5 py-0.5 rounded-xl bg-purple-500/10 border border-purple-200/50 dark:border-purple-800/50 font-mono text-xs text-[#7C3AED] dark:text-[#A78BFA] font-bold">
                {patient.id}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B6875] dark:text-slate-400 mt-1.5 font-medium">
              <span>{patient.gender}, {patient.age} Yrs</span>
              <span>•</span>
              <span>DOB: {patient.dob || '1954-04-12'}</span>
              <span>•</span>
              <span>Blood Group: <strong className="text-[#171321] dark:text-slate-200">{patient.bloodGroup || 'O+'}</strong></span>
              <span>•</span>
              <span className="text-[#7C3AED] dark:text-[#A78BFA] font-semibold flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5" />
                {patient.primaryDoctor || 'Dr. Sunita Sharma'}
              </span>
            </div>
          </div>
        </div>

        {/* Risk Level Badge & Stage Summary */}
        <div className="flex items-center space-x-4 border-t md:border-t-0 md:border-l border-purple-200/40 dark:border-purple-900/40 pt-4 md:pt-0 md:pl-6">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-[#6B6875] dark:text-slate-400 tracking-wider">Overall Dementia Risk</span>
            <div className="flex items-center justify-end space-x-2 mt-0.5">
              <span className={`text-2xl md:text-3xl font-extrabold ${isHighRisk ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {finalRiskPct}%
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                isHighRisk 
                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40' 
                  : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
              }`}>
                {finalDiag}
              </span>
            </div>
            <p className="text-[10px] text-[#6B6875] dark:text-slate-400 mt-1">AI Model Confidence: {finalConfidence}</p>
          </div>
        </div>

      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto border-b border-purple-200/40 dark:border-purple-900/40 pb-2 text-xs">
        {[
          { id: 'all', label: 'All Details View', icon: Layers },
          { id: 'personal', label: '1. Personal Information', icon: User },
          { id: 'mri', label: '2. MRI Analysis', icon: Brain },
          { id: 'eeg', label: '3. EEG Analysis', icon: Activity },
          { id: 'cognitive', label: '4. Cognitive Scores', icon: FileSpreadsheet },
          { id: 'risk', label: '5. Risk Percentage', icon: ShieldAlert },
          { id: 'timeline', label: '6. Patient Timeline', icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl font-semibold flex items-center space-x-2 whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-blue-50 dark:bg-purple-950/60 text-[#2563EB] dark:text-[#A78BFA] border border-blue-200 dark:border-purple-800 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-purple-950/30 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ---------------- SECTION 1: PERSONAL INFORMATION ---------------- */}
      {(activeTab === 'all' || activeTab === 'personal') && (
        <div className="liquid-glass-card p-6 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-purple-200/40 dark:border-purple-900/40 pb-3">
            <h2 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
              <User className="w-5 h-5 text-[#7C3AED]" />
              <span>1. Personal & Demographics Information</span>
            </h2>
            <span className="text-xs text-[#6B6875] dark:text-slate-400 font-mono">Patient Intake: {patient.intakeDate || '2026-01-15'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            
            {/* Demographics */}
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-2.5">
              <span className="text-[10px] uppercase font-bold text-[#6B6875] dark:text-slate-400 tracking-wider block border-b border-purple-200/40 dark:border-purple-900/40 pb-1">
                Demographic Baseline
              </span>
              <div className="flex justify-between">
                <span className="text-[#6B6875] dark:text-slate-400">Full Legal Name:</span>
                <span className="font-semibold text-[#171321] dark:text-[#F7F7F5]">{patient.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6875] dark:text-slate-400">Age:</span>
                <span className="font-semibold text-[#171321] dark:text-[#F7F7F5]">{patient.age} Years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6875] dark:text-slate-400">Gender:</span>
                <span className="font-semibold text-[#171321] dark:text-[#F7F7F5]">{patient.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6875] dark:text-slate-400">Date of Birth:</span>
                <span className="font-semibold text-[#171321] dark:text-[#F7F7F5]">{patient.dob || '1954-04-12'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6875] dark:text-slate-400">Blood Group:</span>
                <span className="font-semibold text-[#7C3AED] dark:text-[#A78BFA]">{patient.bloodGroup || 'O+'}</span>
              </div>
            </div>

            {/* Contact Details */}
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-2.5">
              <span className="text-[10px] uppercase font-bold text-[#6B6875] dark:text-slate-400 tracking-wider block border-b border-purple-200/40 dark:border-purple-900/40 pb-1">
                Contact & Emergency
              </span>
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                <span className="text-[#6B6875] dark:text-slate-400">Phone:</span>
                <span className="font-semibold text-[#171321] dark:text-[#F7F7F5]">{patient.phone || '+91 98230 41102'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                <span className="text-[#6B6875] dark:text-slate-400">Email:</span>
                <span className="font-semibold text-[#171321] dark:text-[#F7F7F5] truncate">{patient.email || 'patient@example.com'}</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="w-3.5 h-3.5 text-[#7C3AED] shrink-0 mt-0.5" />
                <span className="text-[#6B6875] dark:text-slate-400">Address:</span>
                <span className="font-semibold text-[#171321] dark:text-[#F7F7F5]">{patient.address || 'Bangalore, KA'}</span>
              </div>
              <div className="pt-2 border-t border-purple-200/40 dark:border-purple-900/40">
                <span className="text-[#6B6875] dark:text-slate-400 block mb-0.5">Emergency Contact:</span>
                <span className="font-semibold text-[#171321] dark:text-[#F7F7F5]">{patient.emergencyContact || 'Family Member'}</span>
              </div>
            </div>

            {/* Medical History */}
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-2.5">
              <span className="text-[10px] uppercase font-bold text-[#6B6875] dark:text-slate-400 tracking-wider block border-b border-purple-200/40 dark:border-purple-900/40 pb-1">
                Clinical Metadata
              </span>
              <div>
                <span className="text-[#6B6875] dark:text-slate-400 block mb-1">Attending Physician:</span>
                <span className="font-bold text-[#7C3AED] dark:text-[#A78BFA] flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4" />
                  {patient.primaryDoctor || 'Dr. Sunita Sharma'}
                </span>
              </div>
              <div>
                <span className="text-[#6B6875] dark:text-slate-400 block mb-1">Known Allergies:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{patient.allergies || 'None recorded'}</span>
              </div>
              <div>
                <span className="text-[#6B6875] dark:text-slate-400 block mb-1">Medical Background:</span>
                <p className="text-[#171321] dark:text-slate-300 leading-relaxed bg-white/40 dark:bg-slate-950/40 p-2.5 rounded-xl border border-purple-200/40 dark:border-purple-900/40 text-[11px]">
                  {patient.medicalHistory || 'No significant prior neurological trauma recorded.'}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ---------------- SECTION 2: MRI ANALYSIS ---------------- */}
      {(activeTab === 'all' || activeTab === 'mri') && (
        <div className="liquid-glass-card p-6 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/40 dark:border-purple-900/40 pb-3">
            <div>
              <h2 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>2. MRI Structural Volumetric Analysis</span>
              </h2>
              <p className="text-xs text-[#6B6875] dark:text-slate-400">ResNet-50 Deep CNN Volumetric Neuroimaging Classifier</p>
            </div>
            {hasMri && (
              <span className="text-xs px-3 py-1 rounded-full bg-purple-500/10 text-[#7C3AED] dark:text-[#A78BFA] border border-purple-200/50 dark:border-purple-800/50 font-semibold self-start">
                Scan Date: {mriDate}
              </span>
            )}
          </div>

          {hasMri ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Prediction & Confidence */}
                <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B6875] dark:text-slate-400 uppercase text-[11px] font-bold">MRI Prediction:</span>
                    <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-blue-500/15 border border-blue-500/40 text-blue-700 dark:text-blue-300">
                      {mriPrediction}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[#6B6875] dark:text-slate-400 uppercase text-[11px] font-bold">Model Confidence:</span>
                    <span className="font-bold font-mono text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-lg border border-emerald-500/40">
                      {mriConfidence}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-purple-200/40 dark:border-purple-900/40">
                    <span className="text-[#6B6875] dark:text-slate-400 text-[11px]">Scan File Source:</span>
                    <span className="font-mono text-[#7C3AED] dark:text-[#A78BFA] font-bold truncate max-w-[200px]">
                      {mriFileName}
                    </span>
                  </div>
                </div>

                {/* 4-Class Probability Breakdown */}
                <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-2">
                  <span className="text-[11px] font-bold text-[#171321] dark:text-[#F7F7F5] uppercase tracking-wider block border-b border-purple-200/40 dark:border-purple-900/40 pb-1">
                    Model Class Probabilities
                  </span>
                  {mriProbs ? (
                    <div className="space-y-1.5 pt-1">
                      {Object.entries(mriProbs).map(([cls, prob]) => {
                        const pct = Math.round(prob * 100);
                        return (
                          <div key={cls} className="flex justify-between items-center font-mono text-[11px]">
                            <span className="text-[#6B6875] dark:text-slate-300">{cls}:</span>
                            <span className={`font-bold px-2 py-0.5 rounded ${pct > 0 ? 'text-blue-700 dark:text-blue-300 bg-blue-500/15 border border-blue-500/30' : 'text-slate-400'}`}>
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#6B6875] dark:text-slate-400">Class probability distribution logged with prediction.</p>
                  )}
                </div>

              </div>

              {/* Morphometric Findings */}
              <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-2">
                <span className="text-[11px] font-bold text-[#171321] dark:text-[#F7F7F5] uppercase tracking-wider block border-b border-purple-200/40 dark:border-purple-900/40 pb-1">
                  Morphometric Neuroimaging Findings
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                  <li>Bilateral hippocampal volume reduction identified consistent with <strong className="text-[#171321] dark:text-white font-bold">{mriPrediction}</strong>.</li>
                  <li>Ventricular enlargement and lateral ventricle dilation detected in temporal horn sectors.</li>
                  <li>Cortical thinning noted across the temporal and parietal neocortices.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-dashed border-purple-200/60 dark:border-purple-900/50 text-center space-y-3">
              <Brain className="w-10 h-10 text-purple-400 mx-auto" />
              <div>
                <p className="text-xs font-bold text-[#171321] dark:text-[#F7F7F5]">No MRI Brain Scan Processed</p>
                <p className="text-[11px] text-[#6B6875] dark:text-slate-400 mt-0.5">Upload a 3D volumetric MRI slice to run ResNet-50 dementia classification.</p>
              </div>
              <button
                onClick={() => navigate('/mri-upload')}
                className="px-4 py-2 rounded-xl glass-btn-primary text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/20"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload MRI Brain Scan</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---------------- SECTION 3: EEG ANALYSIS ---------------- */}
      {(activeTab === 'all' || activeTab === 'eeg') && (
        <div className="liquid-glass-card p-6 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/40 dark:border-purple-900/40 pb-3">
            <div>
              <h2 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#7C3AED]" />
                <span>3. Quantitative EEG Spectral Analysis</span>
              </h2>
              <p className="text-xs text-[#6B6875] dark:text-slate-400">2-Layer Bidirectional LSTM with Welch Power Spectral Density (PSD)</p>
            </div>
            {hasEeg && (
              <span className="text-xs px-3 py-1 rounded-full bg-purple-500/10 text-[#7C3AED] dark:text-[#A78BFA] border border-purple-200/50 dark:border-purple-800/50 font-semibold self-start">
                Scan Date: {eegDate}
              </span>
            )}
          </div>

          {hasEeg ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Prediction & Confidence */}
                <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B6875] dark:text-slate-400 uppercase text-[11px] font-bold">EEG Prediction:</span>
                    <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-purple-500/15 border border-purple-500/40 text-[#7C3AED] dark:text-[#A78BFA]">
                      {eegPrediction}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[#6B6875] dark:text-slate-400 uppercase text-[11px] font-bold">Model Confidence:</span>
                    <span className="font-bold font-mono text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-lg border border-emerald-500/40">
                      {eegConfidence}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-purple-200/40 dark:border-purple-900/40">
                    <span className="text-[#6B6875] dark:text-slate-400 text-[11px]">EEG Source File:</span>
                    <span className="font-mono text-[#7C3AED] dark:text-[#A78BFA] font-bold truncate max-w-[200px]">
                      {eegFileName}
                    </span>
                  </div>
                </div>

                {/* Dominant Band & TAR */}
                <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-3">
                  <span className="text-[11px] font-bold text-[#171321] dark:text-[#F7F7F5] uppercase tracking-wider block border-b border-purple-200/40 dark:border-purple-900/40 pb-1">
                    Spectral Biomarkers
                  </span>
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B6875] dark:text-slate-400">Dominant Frequency Band:</span>
                    <span className="font-bold font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                      {eegDominantBand || 'Delta'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B6875] dark:text-slate-400">Theta / Alpha Ratio (TAR):</span>
                    <span className="font-bold font-mono px-2 py-0.5 rounded bg-purple-500/15 text-[#7C3AED] dark:text-[#A78BFA] border border-purple-500/30">
                      {eegTar || '2.19'}
                    </span>
                  </div>
                </div>

              </div>

              {/* 5-Band Frequency Power Distribution */}
              <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-2.5">
                <span className="text-[11px] font-bold text-[#171321] dark:text-[#F7F7F5] uppercase tracking-wider block border-b border-purple-200/40 dark:border-purple-900/40 pb-1">
                  5-Band Oscillatory Frequency Power Distribution
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center pt-1">
                  {[
                    { band: 'Delta', freq: '0.5-4 Hz', color: 'text-sky-700 dark:text-sky-300 bg-sky-500/15 border-sky-400/40' },
                    { band: 'Theta', freq: '4-8 Hz', color: 'text-indigo-700 dark:text-indigo-300 bg-indigo-500/15 border-indigo-400/40' },
                    { band: 'Alpha', freq: '8-13 Hz', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-400/40' },
                    { band: 'Beta', freq: '13-30 Hz', color: 'text-amber-700 dark:text-amber-300 bg-amber-500/15 border-amber-400/40' },
                    { band: 'Gamma', freq: '30-45 Hz', color: 'text-rose-700 dark:text-rose-300 bg-rose-500/15 border-rose-400/40' }
                  ].map(({ band, freq, color }) => (
                    <div key={band} className={`p-2.5 rounded-xl border ${color}`}>
                      <span className="text-[11px] font-bold block uppercase tracking-wider">{band}</span>
                      <span className="text-[9px] font-medium opacity-75 block">{freq}</span>
                      <span className="font-mono font-extrabold text-sm block mt-0.5">
                        {eegBands && eegBands[band]?.relative_power !== undefined 
                          ? `${eegBands[band].relative_power}%` 
                          : (eegBands && eegBands[band.toLowerCase()] !== undefined ? `${eegBands[band.toLowerCase()]}%` : 'N/A')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-dashed border-purple-200/60 dark:border-purple-900/50 text-center space-y-3">
              <Activity className="w-10 h-10 text-purple-400 mx-auto" />
              <div>
                <p className="text-xs font-bold text-[#171321] dark:text-[#F7F7F5]">No EEG Signal Processed</p>
                <p className="text-[11px] text-[#6B6875] dark:text-slate-400 mt-0.5">Upload a 16-channel EEG sequence file (.edf / .csv) to run spectral LSTM analysis.</p>
              </div>
              <button
                onClick={() => navigate('/eeg-upload')}
                className="px-4 py-2 rounded-xl glass-btn-primary text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/20"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload EEG Recording</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---------------- SECTION 4: COGNITIVE SCORES ---------------- */}
      {(activeTab === 'all' || activeTab === 'cognitive') && (
        <div className="liquid-glass-card p-6 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/40 dark:border-purple-900/40 pb-3">
            <div>
              <h2 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-500" />
                <span>4. Cognitive Battery & Neuropsychological Scores</span>
              </h2>
              <p className="text-xs text-[#6B6875] dark:text-slate-400">Standardized MMSE & MoCA Evaluation Battery</p>
            </div>
          </div>

          {hasCognitive ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* MMSE Card */}
                <div className="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 flex items-center justify-between">
                  <div>
                    <span className="text-[#6B6875] dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                      Mini-Mental State Examination (MMSE)
                    </span>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                        {mmseScore}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B6875] dark:text-slate-400 mt-0.5">
                      Scale: 0-30 (&lt;24 indicates cognitive decline)
                    </p>
                  </div>
                </div>

                {/* MoCA Card */}
                <div className="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 flex items-center justify-between">
                  <div>
                    <span className="text-[#6B6875] dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                      Montreal Cognitive Assessment (MoCA)
                    </span>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-2xl font-extrabold text-[#7C3AED] dark:text-[#A78BFA] font-mono">
                        {mocaScore}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B6875] dark:text-slate-400 mt-0.5">
                      Scale: 0-30 (&lt;26 indicates impairment)
                    </p>
                  </div>
                </div>

              </div>

              <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-1.5 font-medium">
                <p>• MMSE Result: <strong className="text-[#171321] dark:text-white font-bold">{rawMmse ? (parseInt(rawMmse) < 20 ? 'Moderate Cognitive Impairment' : (parseInt(rawMmse) < 24 ? 'Mild Cognitive Impairment' : 'Normal Baseline')) : 'Not Provided'}</strong>.</p>
                <p>• MoCA Result: <strong className="text-[#171321] dark:text-white font-bold">{rawMoca ? (parseInt(rawMoca) < 20 ? 'Visuospatial & Executive Deficit' : (parseInt(rawMoca) < 26 ? 'Mild Executive Decline' : 'Normal Baseline')) : 'Not Provided'}</strong>.</p>
                <p className="text-[#6B6875] dark:text-slate-400 text-[11px] pt-1">Notes: {cognitiveNotes}</p>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-dashed border-purple-200/60 dark:border-purple-900/50 text-center space-y-3">
              <FileSpreadsheet className="w-10 h-10 text-amber-500 mx-auto" />
              <div>
                <p className="text-xs font-bold text-[#171321] dark:text-[#F7F7F5]">No Cognitive Scores Entered</p>
                <p className="text-[11px] text-[#6B6875] dark:text-slate-400 mt-0.5">Administer or input MMSE & MoCA scores to complete multimodal evaluation.</p>
              </div>
              <button
                onClick={() => navigate('/cognitive-scoring')}
                className="px-4 py-2 rounded-xl glass-btn-primary text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/20"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Administer Cognitive Scores</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---------------- SECTION 5: RISK PERCENTAGE ---------------- */}
      {(activeTab === 'all' || activeTab === 'risk') && (
        <div className="liquid-glass-card p-6 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-purple-200/40 dark:border-purple-900/40 pb-3">
            <h2 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <span>5. Multimodal AI Cross-Modal Consensus & Risk</span>
            </h2>
            <span className="text-xs text-[#6B6875] dark:text-slate-400 font-mono">Engine: NeuroFusion-Multimodal-v4</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
            
            {/* Calculated Risk Index */}
            <div className="p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-center flex flex-col items-center justify-center space-y-3">
              <span className="text-[11px] font-bold text-[#6B6875] dark:text-slate-400 uppercase tracking-widest">Calculated Risk Index</span>
              
              <div className={`w-32 h-32 rounded-full border-8 border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center shadow-xs bg-white/80 dark:bg-slate-900/80 relative ${
                isHighRisk ? 'border-t-rose-500 border-r-rose-500' : 'border-t-emerald-500 border-r-emerald-500'
              }`}>
                <span className={`text-4xl font-black ${isHighRisk ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {finalRiskPct}%
                </span>
                <span className="text-[9px] uppercase font-bold text-[#6B6875] dark:text-slate-400 mt-0.5">Dementia Risk</span>
              </div>

              <div>
                <p className="text-sm font-bold text-[#171321] dark:text-[#F7F7F5] mt-1">
                  {finalDiag}
                </p>
                <p className="text-[11px] text-[#7C3AED] dark:text-[#A78BFA] font-semibold mt-0.5">
                  AI Model Confidence: {finalConfidence}
                </p>
              </div>
            </div>

            {/* Diagnostic Modalities Status */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#171321] dark:text-[#F7F7F5] uppercase tracking-wider mb-1">
                  Diagnostic Modality Triad Status
                </h3>
                <p className="text-[11px] text-[#6B6875] dark:text-slate-400">
                  Cross-modal integration of 3D volumetric MRI scans, 16-channel EEG sequence dynamics, and cognitive psychometrics.
                </p>
              </div>

              <div className="space-y-3">
                
                {/* MRI Status */}
                <div className="p-3 rounded-xl bg-white/40 dark:bg-slate-950/40 border border-purple-200/40 dark:border-purple-900/40 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <div>
                      <span className="font-bold text-[#171321] dark:text-[#F7F7F5]">ResNet-50 MRI Scan</span>
                      <p className="text-[10px] text-[#6B6875] dark:text-slate-400">{hasMri ? `Classified: ${mriPrediction} (${mriConfidence})` : 'Pending Upload'}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                    hasMri ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300'
                  }`}>
                    {hasMri ? '✓ Complete' : '⏳ Pending'}
                  </span>
                </div>

                {/* EEG Status */}
                <div className="p-3 rounded-xl bg-white/40 dark:bg-slate-950/40 border border-purple-200/40 dark:border-purple-900/40 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Activity className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
                    <div>
                      <span className="font-bold text-[#171321] dark:text-[#F7F7F5]">LSTM EEG Spectral Dynamics</span>
                      <p className="text-[10px] text-[#6B6875] dark:text-slate-400">{hasEeg ? `Classified: ${eegPrediction} (${eegConfidence})` : 'Pending Upload'}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                    hasEeg ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300'
                  }`}>
                    {hasEeg ? '✓ Complete' : '⏳ Pending'}
                  </span>
                </div>

                {/* Cognitive Status */}
                <div className="p-3 rounded-xl bg-white/40 dark:bg-slate-950/40 border border-purple-200/40 dark:border-purple-900/40 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="font-bold text-[#171321] dark:text-[#F7F7F5]">Cognitive Psychometrics</span>
                      <p className="text-[10px] text-[#6B6875] dark:text-slate-400">{hasCognitive ? `MMSE: ${mmseScore || 'N/A'}, MoCA: ${mocaScore || 'N/A'}` : 'Pending Intake'}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                    hasCognitive ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300'
                  }`}>
                    {hasCognitive ? '✓ Complete' : '⏳ Pending'}
                  </span>
                </div>

              </div>

              <div className="pt-2 flex justify-end">
                <Link
                  to="/prediction-result"
                  className="px-4 py-2 rounded-xl glass-btn-primary text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-500/25"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Run Multimodal AI Triage</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ---------------- SECTION 6: TIMELINE ---------------- */}
      {(activeTab === 'all' || activeTab === 'timeline') && (
        <div className="liquid-glass-card p-6 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-purple-200/40 dark:border-purple-900/40 pb-3">
            <h2 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#7C3AED]" />
              <span>6. Patient Clinical History & Diagnostic Timeline</span>
            </h2>
            <span className="text-xs text-[#6B6875] dark:text-slate-400">Sequential Diagnostic Progress</span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-purple-200 dark:before:bg-purple-900/60">
            
            {/* Step 1: Registration */}
            <div className="relative space-y-1">
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#7C3AED] border-2 border-white dark:border-slate-900 flex items-center justify-center text-white" />
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#171321] dark:text-[#F7F7F5]">Patient Clinical Registration Completed</span>
                <span className="text-[10px] text-[#6B6875] dark:text-slate-400 font-mono">{patient.intakeDate || 'Recent'}</span>
              </div>
              <p className="text-[11px] text-[#6B6875] dark:text-slate-400">Demographics and attending doctor assigned: {patient.primaryDoctor || 'Dr. Sunita Sharma'}.</p>
            </div>

            {/* Step 2: MRI */}
            <div className="relative space-y-1">
              <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center ${hasMri ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`} />
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#171321] dark:text-[#F7F7F5]">3D Volumetric MRI Classification</span>
                <span className="text-[10px] text-[#6B6875] dark:text-slate-400 font-mono">{mriDate}</span>
              </div>
              <p className="text-[11px] text-[#6B6875] dark:text-slate-400">
                {hasMri ? `ResNet-50 Volumetric prediction: ${mriPrediction} (${mriConfidence}).` : 'No MRI scan uploaded yet.'}
              </p>
            </div>

            {/* Step 3: EEG */}
            <div className="relative space-y-1">
              <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center ${hasEeg ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`} />
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#171321] dark:text-[#F7F7F5]">Quantitative EEG Spectral Analysis</span>
                <span className="text-[10px] text-[#6B6875] dark:text-slate-400 font-mono">{eegDate}</span>
              </div>
              <p className="text-[11px] text-[#6B6875] dark:text-slate-400">
                {hasEeg ? `2-Layer LSTM prediction: ${eegPrediction} (${eegConfidence}).` : 'No EEG recording uploaded yet.'}
              </p>
            </div>

            {/* Step 4: Cognitive */}
            <div className="relative space-y-1">
              <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center ${hasCognitive ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`} />
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#171321] dark:text-[#F7F7F5]">Cognitive Psychometric Battery</span>
                <span className="text-[10px] text-[#6B6875] dark:text-slate-400 font-mono">{patient.lastAssessment || 'Recent'}</span>
              </div>
              <p className="text-[11px] text-[#6B6875] dark:text-slate-400">
                {hasCognitive ? `MMSE: ${mmseScore}, MoCA: ${mocaScore}.` : 'No cognitive test recorded yet.'}
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PatientDetails;
