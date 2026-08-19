import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  BrainCircuit, 
  Activity, 
  ShieldAlert, 
  ArrowUpRight, 
  Plus, 
  Sparkles
} from 'lucide-react';
import PatientProgressionChart from '../charts/PatientProgressionChart';
import AdminAvailableDoctors from '../components/AdminAvailableDoctors';
import AdminClinicalDataManagement from '../components/AdminClinicalDataManagement';
import { patientApi, filterPatientsByUser } from '../api/patientApi';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = String(user?.role || '').trim().toLowerCase() === 'admin';
  const { selectedPatient, setSelectedPatient } = useOutletContext() || {};

  const [patientsList, setPatientsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch clinical patient list if logged in user is a Doctor
    if (!isAdmin) {
      loadDashboardPatients();
    } else {
      setLoading(false);
    }
  }, [isAdmin, user]);

  const loadDashboardPatients = async () => {
    try {
      const data = await patientApi.getPatients();
      const scoped = filterPatientsByUser(data || [], user);
      setPatientsList(scoped);
    } catch (err) {
      console.error('Failed to load dashboard patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPatients = patientsList.length;
  const highRiskCount = patientsList.filter(p => 
    (p.riskScore || 0) > 50 || 
    String(p.stage || '').toLowerCase().includes('alzheimer') || 
    String(p.stage || '').toLowerCase().includes('severe') || 
    String(p.stage || '').toLowerCase().includes('high')
  ).length;

  const mriProcessedCount = patientsList.filter(p => p.mri || p.mriStatus).length;
  const eegProcessedCount = patientsList.filter(p => p.eeg || p.eegStatus).length;

  // 4 Primary Doctor Dashboard Cards computed dynamically
  const statCards = [
    {
      title: 'Total Patients',
      value: totalPatients.toLocaleString(),
      icon: Users,
      indicatorColor: 'bg-[#7C3AED]',
      iconColor: 'text-[#7C3AED]'
    },
    {
      title: 'MRI Scans Processed',
      value: mriProcessedCount.toLocaleString(),
      icon: BrainCircuit,
      indicatorColor: 'bg-[#A78BFA]',
      iconColor: 'text-[#A78BFA]'
    },
    {
      title: 'EEG Signal Analysis',
      value: eegProcessedCount.toLocaleString(),
      icon: Activity,
      indicatorColor: 'bg-[#F0A7C0]',
      iconColor: 'text-[#F0A7C0]'
    },
    {
      title: 'High Risk Patients',
      value: highRiskCount.toLocaleString(),
      icon: ShieldAlert,
      indicatorColor: 'bg-[#EF4444]',
      iconColor: 'text-[#EF4444]'
    }
  ];

  // =========================================================================
  // ADMIN VIEW: AVAILABLE DOCTORS & CLINICAL MRI/EEG DATA MANAGEMENT
  // =========================================================================
  if (isAdmin) {
    return (
      <div className="space-y-8">
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
              <span>Admin Available Doctors Dashboard</span>
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/patients"
              className="px-4 py-2 rounded-xl glass-btn-secondary text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#7C3AED]" />
              <span>Patient Directory</span>
            </Link>

            <Link
              to="/prediction-result"
              className="px-4 py-2 rounded-xl glass-btn-primary text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-purple-500/20"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>AI Multimodal Model</span>
            </Link>
          </div>
        </div>

        {/* Admin Available Doctors & Specialization Directory */}
        <AdminAvailableDoctors />
      </div>
    );
  }

  // =========================================================================
  // DOCTOR VIEW: STRICTLY CLINICAL PATIENT DASHBOARD & EVALUATIONS
  // =========================================================================
  return (
    <div className="space-y-6">
      
      {/* Top Welcome & Quick Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
            <span>Doctor Clinical Dashboard</span>
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/prediction-result"
            className="px-4 py-2 rounded-xl glass-btn-primary text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-purple-500/20"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>AI Multimodal Fusion Model</span>
          </Link>

          <Link
            to="/mri-upload"
            className="px-4 py-2 rounded-xl glass-btn-secondary text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#7C3AED]" />
            <span>Upload New Scan</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          const delays = [0.1, 0.18, 0.26, 0.34];
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: delays[idx] || 0.1 }}
              className="liquid-glass-card p-5 rounded-2xl flex flex-col justify-between hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6B6875] dark:text-slate-400 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${card.indicatorColor}`} />
                  {card.title}
                </span>
                <div className="p-2.5 rounded-xl bg-purple-500/10 dark:bg-purple-900/30">
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-2xl md:text-3xl font-extrabold text-[#171321] dark:text-[#F7F7F5]">{card.value}</h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Clinical Patient Progression Visualization */}
      <div className="liquid-glass-card p-6 rounded-2xl flex flex-col justify-between shadow-sm space-y-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#7C3AED]" />
              Patient Progression & Monthly Intake Trends
            </h2>
          </div>
        </div>
        <PatientProgressionChart />
      </div>

      {/* Active Selected Patient Deep Inspection */}
      {selectedPatient && (
        <div className="liquid-glass-card p-6 rounded-2xl space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 dark:border-purple-900/40 pb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center text-lg font-bold text-white tracking-wider shadow-md shadow-purple-500/20">
                {selectedPatient.initials || selectedPatient.name.substring(0, 2)}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5]">{selectedPatient.name}</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-500/10 text-[#7C3AED] dark:text-[#A78BFA]">
                    {selectedPatient.id}
                  </span>
                </div>
                <p className="text-xs text-[#6B6875] dark:text-slate-400 mt-0.5 font-medium">
                  {selectedPatient.gender}, {selectedPatient.age} yrs • Primary Doctor: {selectedPatient.primaryDoctor}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-[#6B6875]">AI Risk Score</p>
                <p className={`text-xl font-bold font-mono ${selectedPatient.riskScore > 50 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {selectedPatient.riskScore}%
                </p>
              </div>

              <Link
                to="/reports"
                className="px-3.5 py-2 rounded-xl glass-btn-secondary text-xs font-bold transition flex items-center space-x-1"
              >
                <span>Full Diagnosis Report</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl liquid-glass-card">
              <span className="text-[#6B6875] text-[10px] uppercase block mb-1 font-bold">MRI Structural Status</span>
              <span className="font-semibold text-[#7C3AED] dark:text-[#A78BFA]">{selectedPatient.mriStatus}</span>
            </div>
            <div className="p-3.5 rounded-xl liquid-glass-card">
              <span className="text-[#6B6875] text-[10px] uppercase block mb-1 font-bold">EEG Spectral Biomarker</span>
              <span className="font-semibold text-[#A78BFA]">{selectedPatient.eegStatus}</span>
            </div>
            <div className="p-3.5 rounded-xl liquid-glass-card">
              <span className="text-[#6B6875] text-[10px] uppercase block mb-1 font-bold">Cognitive Battery</span>
              <span className="font-semibold text-[#F0A7C0]">MMSE {selectedPatient.mmseScore} • MoCA {selectedPatient.mocaScore}</span>
            </div>
          </div>
        </div>
      )}

      {/* Cohort Quick Patient Cases List */}
      <div className="liquid-glass-card p-6 rounded-2xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#7C3AED]" />
              High Priority Patient Cohort
            </h2>
          </div>
          <Link to="/patients" className="text-xs text-[#7C3AED] dark:text-[#A78BFA] hover:underline font-bold">
            View All Patients &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {patientsList.slice(0, 6).map((pt) => (
            <div
              key={pt.id}
              onClick={() => setSelectedPatient && setSelectedPatient(pt)}
              className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                selectedPatient?.id === pt.id 
                  ? 'bg-purple-500/15 border-[#7C3AED] shadow-xs'
                  : 'liquid-glass-card hover:border-purple-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center text-xs font-bold text-white">
                  {pt.initials || pt.name.substring(0, 2)}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#171321] dark:text-[#F7F7F5]">{pt.name}</p>
                  <p className="text-[10px] text-[#6B6875]">{pt.id} • {pt.stage ? pt.stage.replace('_', ' ') : 'MCI'}</p>
                </div>
              </div>

              <div className="text-right text-xs">
                <span className={`font-bold font-mono ${pt.riskScore > 50 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {pt.riskScore}% Risk
                </span>
                <p className="text-[9px] text-[#6B6875]">{pt.lastAssessment || 'Recent'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
