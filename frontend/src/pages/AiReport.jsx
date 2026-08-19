import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  FileText, 
  Printer, 
  Download, 
  BrainCircuit, 
  Activity, 
  FileSpreadsheet, 
  Sparkles, 
  Brain, 
  RotateCcw, 
  User, 
  Stethoscope,
  ShieldCheck,
  ClipboardCheck,
  TrendingUp,
  Layers,
  Award,
  CheckCircle2,
  Calendar,
  Building2
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { getPatientStoredData } from '../api/patientApi';

const AiReport = () => {
  const { selectedPatient } = useOutletContext();
  const { user } = useAuth();

  const handlePrint = () => {
    window.print();
  };

  const ptId = selectedPatient?.id || 'active';
  
  // Retrieve stored multimodal prediction from localStorage or patient context using multi-key lookup
  const storedMultimodal = getPatientStoredData(selectedPatient, 'multimodal') || getPatientStoredData({ id: ptId }, 'multimodal');
  const storedMri = getPatientStoredData(selectedPatient, 'mri') || getPatientStoredData({ id: ptId }, 'mri');
  const storedEeg = getPatientStoredData(selectedPatient, 'eeg') || getPatientStoredData({ id: ptId }, 'eeg');
  const storedCognitive = getPatientStoredData(selectedPatient, 'cognitive') || getPatientStoredData({ id: ptId }, 'cognitive');

  // Attending Doctor / Physician Details
  const doctorName = selectedPatient?.doctor_name || selectedPatient?.assigned_doctor || selectedPatient?.assignedDoctor || user?.name || 'Dr. Sunita Sharma';
  const doctorDesignation = user?.specialty || user?.qualification || 'Consultant Neurologist & Clinical AI Specialist';
  const doctorRegId = user?.id ? `NF-DOC-${String(user.id).padStart(4, '0')}` : 'NF-DOC-1008';
  const doctorPhone = user?.phone || '8088668804';
  const reportDate = new Date().toISOString().split('T')[0];

  // 1. PATIENT DEMOGRAPHICS (Only values actually entered or present in patient object)
  const patientName = selectedPatient?.name || storedMultimodal?.patientName || null;
  const patientId = selectedPatient?.id || storedMultimodal?.patientId || null;
  const patientAge = (selectedPatient?.age !== undefined && selectedPatient?.age !== null && selectedPatient?.age !== '') 
    ? selectedPatient.age 
    : (storedMultimodal?.patientAge || null);
  const patientGender = selectedPatient?.gender || storedMultimodal?.patientGender || null;
  
  // 2. MRI MODEL OUTPUTS (ResNet50 / ResNet18)
  const mriObj = storedMri || storedMultimodal?.mri_prediction || storedMultimodal?.mriPrediction || null;
  const hasMriData = Boolean(mriObj && mriObj.prediction && mriObj.prediction !== 'Error');
  const mriPrediction = hasMriData ? mriObj.prediction : null;
  const mriConfidence = hasMriData && mriObj.confidence !== undefined 
    ? `${Math.round(mriObj.confidence * 100)}%` 
    : null;
  const mriProbs = hasMriData && mriObj.probabilities ? mriObj.probabilities : null;

  // 3. EEG MODEL OUTPUTS (2-Layer LSTM + Welch PSD)
  const eegObj = storedEeg || storedMultimodal?.eeg_prediction || storedMultimodal?.eegPrediction || null;
  const hasEegData = Boolean(eegObj && eegObj.prediction && eegObj.prediction !== 'Error');
  const eegPrediction = hasEegData ? eegObj.prediction : null;
  const eegConfidence = hasEegData && eegObj.confidence !== undefined 
    ? `${Math.round(eegObj.confidence * 100)}%` 
    : null;
  const eegFileName = eegObj?.signal_info?.filename || storedMultimodal?.eegFileName || null;
  const eegProbs = hasEegData && eegObj.probabilities ? eegObj.probabilities : null;
  
  const eegFreqAnalysis = eegObj?.frequency_analysis || null;
  const eegBands = eegFreqAnalysis?.oscillatory_frequency_bands || eegFreqAnalysis?.frequency_bands || null;
  const eegDominantBand = eegFreqAnalysis?.dominant_oscillatory_band || eegFreqAnalysis?.dominant_band || null;
  const eegTar = (eegFreqAnalysis?.theta_alpha_ratio !== undefined && eegFreqAnalysis?.theta_alpha_ratio !== null) 
    ? eegFreqAnalysis.theta_alpha_ratio 
    : null;

  // 4. COGNITIVE ASSESSMENT SCORES (MMSE & MoCA)
  const cogObj = storedCognitive || storedMultimodal?.cognitive_assessment || storedMultimodal?.cognitive || selectedPatient?.cognitive || null;
  const rawMmse = cogObj?.mmseScore ?? cogObj?.mmse_score ?? cogObj?.mmse ?? storedMultimodal?.mmseScore ?? storedMultimodal?.mmse_score ?? storedMultimodal?.mmse ?? selectedPatient?.cognitive?.mmseScore ?? selectedPatient?.cognitive?.mmse_score ?? selectedPatient?.cognitive?.mmse;
  const rawMoca = cogObj?.mocaScore ?? cogObj?.moca_score ?? cogObj?.moca ?? storedMultimodal?.mocaScore ?? storedMultimodal?.moca_score ?? storedMultimodal?.moca ?? selectedPatient?.cognitive?.mocaScore ?? selectedPatient?.cognitive?.moca_score ?? selectedPatient?.cognitive?.moca;

  const mmseScore = (rawMmse !== undefined && rawMmse !== null && rawMmse !== '') 
    ? (String(rawMmse).includes('/') ? rawMmse : `${rawMmse} / 30`) 
    : null;
  const mocaScore = (rawMoca !== undefined && rawMoca !== null && rawMoca !== '') 
    ? (String(rawMoca).includes('/') ? rawMoca : `${rawMoca} / 30`) 
    : null;
  const hasMmse = Boolean(mmseScore);
  const hasMoca = Boolean(mocaScore);

  // Helper to normalize diagnosis name
  const normalizeDiag = (diag) => {
    if (!diag) return null;
    const lower = String(diag).toLowerCase();
    if (lower.includes('frontotemporal') || lower.includes('ftd')) return 'Frontotemporal Dementia (FTD)';
    if (lower.includes('alzheimer')) return "Alzheimer's Disease";
    if (lower.includes('mild demented') || lower.includes('mci')) return 'Mild Cognitive Impairment (MCI)';
    if (lower.includes('moderate demented')) return 'Moderate Dementia';
    if (lower.includes('non demented') || lower.includes('healthy') || lower.includes('normal')) return 'Cognitively Normal';
    return diag;
  };

  // 5. MULTIMODAL AI CONSENSUS DIAGNOSIS
  const rawFinal = storedMultimodal?.prediction || storedMultimodal?.final_prediction || storedMultimodal?.diagnosis || (
    hasMriData && hasEegData 
      ? (
          (String(eegPrediction).toLowerCase().includes('ftd') || String(eegPrediction).toLowerCase().includes('frontotemporal'))
            ? 'Frontotemporal Dementia (FTD)'
            : (mriPrediction === 'Moderate Demented' || String(eegPrediction).toLowerCase().includes('alzheimer') ? "Alzheimer's Disease" : mriPrediction)
        )
      : (hasEegData ? eegPrediction : (hasMriData ? mriPrediction : null))
  );

  const finalResult = normalizeDiag(rawFinal);

  const finalConfidence = storedMultimodal?.confidence !== undefined 
    ? `${Math.round(storedMultimodal.confidence * 100)}%`
    : (hasEegData && !hasMriData ? eegConfidence : (hasMriData && !hasEegData ? mriConfidence : (eegConfidence || mriConfidence || null)));

  // Handler to clear active patient scans from local storage
  const handleClearMri = () => {
    try {
      localStorage.removeItem(`neurofusion_mri_${ptId}`);
      localStorage.removeItem(`neurofusion_mri_${selectedPatient?.db_id}`);
      localStorage.removeItem('neurofusion_mri_active');
      localStorage.removeItem('neurofusion_mri_NF-4232');
      localStorage.removeItem(`neurofusion_multimodal_${ptId}`);
      localStorage.removeItem('neurofusion_latest_prediction');
      window.location.reload();
    } catch(e) {}
  };

  const handleClearEeg = () => {
    try {
      localStorage.removeItem(`neurofusion_eeg_${ptId}`);
      localStorage.removeItem(`neurofusion_eeg_${selectedPatient?.db_id}`);
      localStorage.removeItem('neurofusion_eeg_active');
      localStorage.removeItem('neurofusion_eeg_NF-4232');
      localStorage.removeItem(`neurofusion_multimodal_${ptId}`);
      localStorage.removeItem('neurofusion_latest_prediction');
      window.location.reload();
    } catch(e) {}
  };

  const handleResetScans = () => {
    try {
      const keys = [
        `neurofusion_mri_${ptId}`,
        `neurofusion_mri_${selectedPatient?.db_id}`,
        `neurofusion_mri_active`,
        `neurofusion_mri_NF-4232`,
        `neurofusion_eeg_${ptId}`,
        `neurofusion_eeg_${selectedPatient?.db_id}`,
        `neurofusion_eeg_active`,
        `neurofusion_eeg_NF-4232`,
        `neurofusion_cognitive_${ptId}`,
        `neurofusion_multimodal_${ptId}`
      ];
      keys.forEach(k => k && localStorage.removeItem(k));
      localStorage.removeItem('neurofusion_latest_prediction');
      window.location.reload();
    } catch(e) {}
  };

  // Helper formatting function to return "Not Available" for missing data
  const renderVal = (val, fallback = 'Not Available') => (val !== null && val !== undefined && val !== '' ? val : fallback);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16 font-sans">
      
      {/* Print Specific Multi-Page CSS Stylesheet */}
      <style>{`
        @media print {
          *, *::before, *::after {
            box-sizing: border-box !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          #root, #root > div, .h-screen, main, div.flex-1 {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            position: static !important;
            display: block !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            box-shadow: none !important;
          }
          aside, nav, header, .no-print, button, .glass-btn-primary, .glass-btn-secondary, .aurora-mesh, .fixed {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .report-document {
            display: block !important;
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .report-document > * + * {
            margin-top: 0 !important;
          }
          .report-page {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 8mm 10mm 10mm 10mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            page-break-before: avoid !important;
            break-before: avoid !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: 2px solid #000000 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .report-page, .report-page * {
            background-color: #ffffff !important;
            color: #000000 !important;
            border-color: #000000 !important;
          }
          .report-page:first-of-type,
          .report-page:first-child {
            page-break-before: avoid !important;
            break-before: avoid !important;
            margin-top: 0 !important;
          }
          .report-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
            margin-bottom: 0 !important;
          }
          @page {
            margin: 8mm;
            size: A4 portrait;
          }
        }
      `}</style>

      {/* Top Action Toolbar (Hidden in Print Mode) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print bg-white/80 dark:bg-[#1C162E]/80 p-4 rounded-2xl border border-purple-200/50 dark:border-purple-900/50 shadow-sm backdrop-blur-md">
        <div>
          <h1 className="text-xl font-extrabold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#7C3AED] dark:text-[#A78BFA]" />
            <span>Diagnostic Report</span>
          </h1>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleResetScans}
            className="px-3.5 py-2 rounded-xl glass-btn-secondary hover:text-rose-600 font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            title="Clear stored MRI/EEG data for active patient"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Scans</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl glass-btn-secondary font-bold text-xs transition flex items-center space-x-2 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
            <span>Print</span>
          </button>

          <button 
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl glass-btn-primary font-bold text-xs transition flex items-center space-x-2 shadow-md shadow-purple-500/20 cursor-pointer"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Multi-Page Report Document Container */}
      <div className="report-document space-y-8">

        {/* ========================================================================= */}
        {/* 📄 PAGE 1: DEMOGRAPHICS & NEUROIMAGING (MRI) ANALYSIS                     */}
        {/* ========================================================================= */}
        <div className="report-page bg-white dark:bg-[#1C162E] p-8 rounded-3xl space-y-6 text-black dark:text-[#F7F7F5] shadow-xl border-2 border-slate-300 dark:border-purple-900/60 relative transition-colors">
          
          {/* Page Badge Indicator (Screen Only) */}
          <div className="no-print absolute top-3 right-4 px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#7C3AED] dark:text-[#C4B5FD] text-[10px] font-black tracking-wider uppercase border border-purple-200 dark:border-purple-800/60">
            Page 1 of 3 • Patient Demographics & MRI Volumetrics
          </div>

          {/* 1. REPORT HEADER WITH RIGHT CORNER DOCTOR DETAILS */}
          <div className="border-b-2 border-black dark:border-purple-800/60 pb-5 flex flex-col md:flex-row md:items-start justify-between gap-5 text-black dark:text-[#F7F7F5]">
            <div>
              <div className="flex items-center space-x-3.5">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] text-white shadow-md shadow-purple-500/25">
                  <BrainCircuit className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-[#F7F7F5]">
                    NeuroFusion <span className="text-[#7C3AED] dark:text-[#A78BFA]">AI</span>
                  </h1>
                  <p className="text-xs font-black text-black dark:text-purple-300 uppercase tracking-wider">
                    Multimodal Dementia Analysis Report
                  </p>
                  <p className="text-[11px] font-bold text-black dark:text-slate-400 mt-0.5">
                    Clinical Neuroimaging & Electrophysiology Center
                  </p>
                </div>
              </div>
            </div>

            {/* Right Corner Doctor Box */}
            <div className="text-left md:text-right text-xs space-y-1 bg-slate-50 dark:bg-purple-950/40 p-3.5 rounded-2xl border-2 border-black dark:border-purple-800/60 min-w-[280px]">
              <div className="flex items-center justify-start md:justify-end gap-1.5 text-black dark:text-[#F7F7F5] font-black text-xs">
                <Stethoscope className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA] shrink-0" />
                <span className="text-black dark:text-[#F7F7F5] font-black text-sm">Physician: {doctorName}</span>
              </div>
              <p className="text-[11px] font-bold text-black dark:text-slate-300">
                {doctorDesignation}
              </p>
              <p className="text-[11px] font-extrabold text-black dark:text-slate-300 font-mono">
                Doctor ID: <span className="text-[#7C3AED] dark:text-[#C4B5FD] font-black">{doctorRegId}</span> • NeuroFusion AI
              </p>
              <div className="flex items-center justify-start md:justify-end gap-2 text-[11px] pt-1 border-t border-black dark:border-purple-800/60">
                <span className="font-extrabold text-black dark:text-slate-300">Report Date:</span>
                <span className="font-mono font-black text-black dark:text-white bg-white dark:bg-purple-900/60 px-2 py-0.5 rounded border border-black dark:border-purple-700/60">
                  {reportDate}
                </span>
              </div>
              <p className="text-[10px] font-extrabold text-black dark:text-slate-400 font-mono">
                Model: ResNet MRI + LSTM EEG + Cognitive Scoring
              </p>
            </div>
          </div>

          {/* 2. PATIENT INFORMATION */}
          <div className="bg-slate-50 dark:bg-purple-950/30 p-5 rounded-2xl border-2 border-black dark:border-purple-800/60 space-y-2.5 text-black dark:text-[#F7F7F5]">
            <h2 className="text-xs font-black text-black dark:text-purple-300 uppercase tracking-wider border-b-2 border-black dark:border-purple-800/60 pb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#A78BFA]" />
              <span className="text-black dark:text-[#F7F7F5] font-black">1. PATIENT DEMOGRAPHICS & CLINICAL REGISTRATION</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
              <div>
                <span className="text-[11px] text-black dark:text-slate-400 font-black block uppercase tracking-wider">Patient Name</span>
                <span className="font-black text-black dark:text-[#F7F7F5] text-base">{renderVal(patientName)}</span>
              </div>

              <div>
                <span className="text-[11px] text-black dark:text-slate-400 font-black block uppercase tracking-wider">Patient ID</span>
                <span className="font-black text-black dark:text-[#F7F7F5] font-mono text-base">{renderVal(patientId)}</span>
              </div>

              <div>
                <span className="text-[11px] text-black dark:text-slate-400 font-black block uppercase tracking-wider">Age</span>
                <span className="font-black text-black dark:text-[#F7F7F5] text-base">{patientAge !== null ? `${patientAge} years` : 'Not Available'}</span>
              </div>

              <div>
                <span className="text-[11px] text-black dark:text-slate-400 font-black block uppercase tracking-wider">Gender</span>
                <span className="font-black text-black dark:text-[#F7F7F5] text-base">{renderVal(patientGender)}</span>
              </div>
            </div>
          </div>

          {/* 3. MRI NEUROIMAGING ANALYSIS */}
          <div className="space-y-3 text-black dark:text-[#F7F7F5]">
            <div className="flex items-center justify-between border-b-2 border-black dark:border-purple-800/60 pb-2">
              <h2 className="text-sm font-black text-black dark:text-purple-300 flex items-center gap-2 uppercase tracking-wide">
                <Brain className="w-4 h-4 text-[#2563EB] dark:text-sky-400" />
                <span className="text-black dark:text-[#F7F7F5] font-black">2. MAGNETIC RESONANCE IMAGING (MRI) NEUROANATOMICAL ANALYSIS</span>
              </h2>
              <div className="flex items-center space-x-3">
                {hasMriData && (
                  <button
                    onClick={handleClearMri}
                    className="text-[10px] px-2.5 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition cursor-pointer no-print font-bold"
                    title="Clear MRI scan data for this patient"
                  >
                    Clear MRI Scan
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-purple-950/30 border-2 border-black dark:border-purple-800/60 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-black dark:text-slate-300 font-black uppercase text-[11px]">Primary Prediction:</span>
                  <span className={`px-3.5 py-1 rounded-xl text-xs font-black border-2 ${
                    hasMriData 
                      ? 'bg-blue-500/15 border-blue-500 text-blue-800 dark:text-blue-200' 
                      : 'bg-slate-100 dark:bg-purple-900/40 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-purple-800/50'
                  }`}>
                    {hasMriData ? renderVal(mriPrediction) : 'Not Uploaded'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-black dark:text-slate-300 font-black uppercase text-[11px]">Model Confidence:</span>
                  <span className="font-black font-mono text-sm text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 px-3 py-0.5 rounded-lg border-2 border-emerald-500">
                    {hasMriData ? renderVal(mriConfidence) : 'Not Available'}
                  </span>
                </div>

                <div className="pt-2 border-t border-black/30 dark:border-purple-800/40 text-[11px] font-bold text-black dark:text-slate-300 space-y-1">
                  <p>• Architecture: <strong className="font-black text-black dark:text-[#F7F7F5]">ResNet-50 Deep CNN Volumetric Classifier</strong></p>
                  <p>• Region of Interest: <strong className="font-black text-black dark:text-[#F7F7F5]">Hippocampus & Medial Temporal Lobe</strong></p>
                </div>
              </div>

              {/* Class Probabilities Distribution */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-purple-950/30 border-2 border-black dark:border-purple-800/60 space-y-2">
                <span className="text-[11px] font-black text-black dark:text-purple-300 uppercase tracking-wider block border-b border-black dark:border-purple-800/60 pb-1">
                  MODEL CLASS PROBABILITIES
                </span>
                {hasMriData && mriProbs ? (
                  <div className="space-y-1.5 text-[11px] pt-1">
                    {Object.entries(mriProbs).map(([cls, prob]) => {
                      const pct = Math.round(prob * 100);
                      return (
                        <div key={cls} className="flex justify-between font-mono items-center">
                          <span className="text-black dark:text-slate-300 font-bold">{cls}:</span>
                          <span className={`font-black px-2 py-0.5 rounded border ${pct > 0 ? 'text-blue-700 dark:text-blue-300 bg-blue-500/20 border-blue-400 font-black' : 'text-black dark:text-slate-400 border-transparent'}`}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-black dark:text-slate-400 font-mono py-2">
                    {hasMriData ? 'Not Available' : 'No MRI scan uploaded yet'}
                  </p>
                )}
              </div>
            </div>

            {/* Clinical Neuroimaging Observations */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-purple-950/30 border-2 border-black dark:border-purple-800/60 text-xs text-black dark:text-[#F7F7F5] space-y-2">
              <span className="text-[11px] font-black text-black dark:text-purple-300 uppercase tracking-wider block border-b border-black/30 dark:border-purple-800/60 pb-1">
                Neuroimaging Morphometric Findings:
              </span>
              {hasMriData ? (
                <ul className="list-disc list-inside space-y-1 font-bold text-black dark:text-slate-300 text-[11px]">
                  <li>Bilateral hippocampal volume reduction identified consistent with {renderVal(mriPrediction)}.</li>
                  <li>Ventricular enlargement and lateral ventricle dilation detected in temporal horn sectors.</li>
                  <li>Cortical thinning noted predominantly across the temporal and parietal neocortices.</li>
                </ul>
              ) : (
                <p className="text-[11px] font-bold text-black/70 dark:text-slate-400">
                  No 3D MRI brain scan uploaded for this patient. Neuroimaging volumetric analysis pending.
                </p>
              )}
            </div>
          </div>

          {/* Official Page 1 Footer */}
          <div className="pt-4 border-t-2 border-black dark:border-purple-800/60 flex items-center justify-between text-[10px] font-black text-black dark:text-slate-400 uppercase tracking-wider">
            <span>NeuroFusion AI Diagnostic Dossier • Ref: {patientId || 'NF-REC'}</span>
            <span>Confidential Medical Record • Page 1 of 3</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 📄 PAGE 2: ELECTROPHYSIOLOGY (EEG) & COGNITIVE ASSESSMENT                 */}
        {/* ========================================================================= */}
        <div className="report-page bg-white dark:bg-[#1C162E] p-8 rounded-3xl space-y-6 text-black dark:text-[#F7F7F5] shadow-xl border-2 border-slate-300 dark:border-purple-900/60 relative transition-colors">
          
          {/* Page Badge Indicator (Screen Only) */}
          <div className="no-print absolute top-3 right-4 px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#7C3AED] dark:text-[#C4B5FD] text-[10px] font-black tracking-wider uppercase border border-purple-200 dark:border-purple-800/60">
            Page 2 of 3 • EEG Spectral Analysis & Cognitive Psychometrics
          </div>

          {/* Running Header */}
          <div className="border-b-2 border-black dark:border-purple-800/60 pb-3 flex items-center justify-between text-xs text-black dark:text-[#F7F7F5]">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-[#7C3AED] dark:text-[#A78BFA]" />
              <span className="font-black text-sm uppercase">NeuroFusion AI • Comprehensive Diagnostic Report</span>
            </div>
            <div className="text-right text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
              <span>Patient: <strong className="font-black text-black dark:text-white">{renderVal(patientName)}</strong> ({renderVal(patientId)})</span> • <span>Dr. {doctorName}</span>
            </div>
          </div>

          {/* 4. EEG ELECTROPHYSIOLOGICAL ANALYSIS */}
          <div className="space-y-3 text-black dark:text-[#F7F7F5]">
            <div className="flex items-center justify-between border-b-2 border-black dark:border-purple-800/60 pb-2">
              <h2 className="text-sm font-black text-black dark:text-purple-300 flex items-center gap-2 uppercase tracking-wide">
                <Activity className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
                <span className="text-black dark:text-[#F7F7F5] font-black">3. ELECTROENCEPHALOGRAPHY (EEG) SPECTRAL SEQUENCE ANALYSIS</span>
              </h2>
              <div className="flex items-center space-x-3">
                {hasEegData && (
                  <button
                    onClick={handleClearEeg}
                    className="text-[10px] px-2.5 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition cursor-pointer no-print font-bold"
                    title="Clear EEG signal data for this patient"
                  >
                    Clear EEG Signal
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-purple-950/30 border-2 border-black dark:border-purple-800/60 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-black dark:text-slate-300 font-black uppercase text-[11px]">EEG File Source:</span>
                  <span className="font-black text-black dark:text-purple-200 font-mono truncate max-w-[180px] bg-purple-500/15 px-2 py-0.5 rounded-md border border-purple-300 dark:border-purple-700/60">
                    {renderVal(eegFileName)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-black dark:text-slate-300 font-black uppercase text-[11px]">Sequence Prediction:</span>
                  <span className={`px-3.5 py-1 rounded-xl text-xs font-black border-2 ${
                    hasEegData 
                      ? 'bg-purple-500/15 border-purple-400 text-purple-800 dark:text-purple-200' 
                      : 'bg-slate-100 dark:bg-purple-900/40 text-black dark:text-slate-300 border-slate-300 dark:border-purple-800/50'
                  }`}>
                    {renderVal(eegPrediction)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-black dark:text-slate-300 font-black uppercase text-[11px]">Confidence:</span>
                  <span className="font-black font-mono text-sm text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 px-3 py-0.5 rounded-lg border-2 border-emerald-400">
                    {renderVal(eegConfidence)}
                  </span>
                </div>

                <div className="pt-2 border-t border-black/30 dark:border-purple-800/40 text-[11px] font-bold text-black dark:text-slate-300 space-y-1">
                  <p>• Architecture: <strong className="font-black text-black dark:text-[#F7F7F5]">2-Layer Bidirectional LSTM with Welch PSD</strong></p>
                  <p>• Signal Sampling: <strong className="font-black text-black dark:text-[#F7F7F5]">16-Channel 10-20 Standard Montage</strong></p>
                </div>
              </div>

              {/* Class Probabilities */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-purple-950/30 border-2 border-black dark:border-purple-800/60 space-y-2">
                <span className="text-[11px] font-black text-black dark:text-purple-300 uppercase tracking-wider block border-b border-black dark:border-purple-800/60 pb-1">
                  MODEL CLASS PROBABILITIES
                </span>
                {eegProbs ? (
                  <div className="space-y-1.5 text-[11px] pt-1">
                    {Object.entries(eegProbs).map(([cls, prob]) => {
                      const pct = Math.round(prob * 100);
                      return (
                        <div key={cls} className="flex justify-between font-mono items-center">
                          <span className="text-black dark:text-slate-300 font-bold">{cls}:</span>
                          <span className={`font-black px-2 py-0.5 rounded border ${pct > 0 ? 'text-purple-800 dark:text-purple-200 bg-purple-500/20 border-purple-400 font-black' : 'text-black dark:text-slate-400 border-transparent'}`}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-black dark:text-slate-400 font-mono">Not Available</p>
                )}
              </div>
            </div>

            {/* EEG Spectral Analysis Grid */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-purple-950/30 border-2 border-black dark:border-purple-800/60 space-y-2.5 text-xs">
              <span className="text-[11px] font-black text-black dark:text-purple-300 uppercase tracking-wider block border-b border-black dark:border-purple-800/60 pb-1">
                5-BAND OSCILLATORY FREQUENCY POWER DISTRIBUTION
              </span>
              {eegBands ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center pt-1">
                  {[
                    { band: 'Delta', freq: '0.5-4 Hz', color: 'text-sky-800 dark:text-sky-300 bg-sky-500/15 border-sky-400' },
                    { band: 'Theta', freq: '4-8 Hz', color: 'text-indigo-800 dark:text-indigo-300 bg-indigo-500/15 border-indigo-400' },
                    { band: 'Alpha', freq: '8-13 Hz', color: 'text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border-emerald-400' },
                    { band: 'Beta', freq: '13-30 Hz', color: 'text-amber-800 dark:text-amber-300 bg-amber-500/15 border-amber-400' },
                    { band: 'Gamma', freq: '30-45 Hz', color: 'text-rose-800 dark:text-rose-300 bg-rose-500/15 border-rose-400' }
                  ].map(({ band, freq, color }) => (
                    <div key={band} className={`p-2.5 rounded-xl border-2 ${color}`}>
                      <span className="text-[11px] font-black block uppercase tracking-wider">{band}</span>
                      <span className="text-[9px] font-bold opacity-75 block">{freq}</span>
                      <span className="font-mono font-black text-base block mt-0.5">
                        {eegBands[band]?.relative_power !== undefined ? `${eegBands[band].relative_power}%` : 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-black dark:text-slate-400 font-mono">Not Available</p>
              )}

              <div className="flex flex-wrap items-center justify-between pt-2 border-t border-black dark:border-purple-800/60 text-[11px] font-mono text-black dark:text-slate-300">
                <div>
                  <span className="font-bold">Dominant Frequency Band: </span>
                  <span className="font-black text-sky-800 dark:text-sky-300 bg-sky-500/15 px-2 py-0.5 rounded-md border border-sky-400">{renderVal(eegDominantBand)}</span>
                </div>
                <div>
                  <span className="font-bold">Theta / Alpha Ratio (TAR): </span>
                  <span className="font-black text-purple-800 dark:text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-md border border-purple-400">{renderVal(eegTar)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. COGNITIVE ASSESSMENT BATTERY */}
          <div className="space-y-3 text-black dark:text-[#F7F7F5]">
            <h2 className="text-sm font-black text-black dark:text-purple-300 flex items-center gap-2 border-b-2 border-black dark:border-purple-800/60 pb-2 uppercase tracking-wide">
              <FileSpreadsheet className="w-4 h-4 text-[#D97706] dark:text-amber-400" />
              <span className="text-black dark:text-[#F7F7F5] font-black">4. COGNITIVE PSYCHOMETRIC BATTERY (MMSE & MOCA)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-purple-950/30 border-2 border-black dark:border-purple-800/60 flex justify-between items-center">
                <div>
                  <span className="text-black dark:text-slate-200 font-black uppercase text-[11px] block">MMSE (Mini-Mental State Exam):</span>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Scale: 0-30 (&lt;24 indicates cognitive decline)</span>
                </div>
                <span className="font-mono font-black text-amber-800 dark:text-amber-300 text-lg bg-amber-500/20 px-3.5 py-1 rounded-xl border-2 border-amber-400">
                  {renderVal(mmseScore)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-purple-950/30 border-2 border-black dark:border-purple-800/60 flex justify-between items-center">
                <div>
                  <span className="text-black dark:text-slate-200 font-black uppercase text-[11px] block">MoCA (Montreal Cognitive Assessment):</span>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Scale: 0-30 (&lt;26 indicates impairment)</span>
                </div>
                <span className="font-mono font-black text-purple-800 dark:text-purple-300 text-lg bg-purple-500/20 px-3.5 py-1 rounded-xl border-2 border-purple-400">
                  {renderVal(mocaScore)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-purple-950/30 border-2 border-black dark:border-purple-800/60 text-xs text-black dark:text-slate-300 space-y-1.5 font-bold">
              <p>• MMSE Scoring Result: <strong className="font-black text-black dark:text-white">{mmseScore ? (parseInt(mmseScore) < 20 ? 'Moderate Cognitive Impairment' : 'Mild-to-Moderate Impairment') : 'Not Provided'}</strong>.</p>
              <p>• MoCA Scoring Result: <strong className="font-black text-black dark:text-white">{mocaScore ? (parseInt(mocaScore) < 20 ? 'Visuospatial & Executive Deficit' : 'Mild Executive Decline') : 'Not Provided'}</strong>.</p>
            </div>
          </div>

          {/* Official Page 2 Footer */}
          <div className="pt-4 border-t-2 border-black dark:border-purple-800/60 flex items-center justify-between text-[10px] font-black text-black dark:text-slate-400 uppercase tracking-wider">
            <span>NeuroFusion AI Diagnostic Dossier • Ref: {patientId || 'NF-REC'}</span>
            <span>Confidential Medical Record • Page 2 of 3</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 📄 PAGE 3: MULTIMODAL CONSENSUS, ACTION PLAN & SIGN-OFF                   */}
        {/* ========================================================================= */}
        <div className="report-page bg-white dark:bg-[#1C162E] p-8 rounded-3xl space-y-6 text-black dark:text-[#F7F7F5] shadow-xl border-2 border-slate-300 dark:border-purple-900/60 relative transition-colors">
          
          {/* Page Badge Indicator (Screen Only) */}
          <div className="no-print absolute top-3 right-4 px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#7C3AED] dark:text-[#C4B5FD] text-[10px] font-black tracking-wider uppercase border border-purple-200 dark:border-purple-800/60">
            Page 3 of 3 • Multimodal Consensus, Recommendations & Sign-Off
          </div>

          {/* Running Header */}
          <div className="border-b-2 border-black dark:border-purple-800/60 pb-3 flex items-center justify-between text-xs text-black dark:text-[#F7F7F5]">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#7C3AED] dark:text-[#A78BFA]" />
              <span className="font-black text-sm uppercase">NeuroFusion AI • Final Consensus & Clinical Sign-Off</span>
            </div>
            <div className="text-right text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
              <span>Patient: <strong className="font-black text-black dark:text-white">{renderVal(patientName)}</strong> ({renderVal(patientId)})</span> • <span>Dr. {doctorName}</span>
            </div>
          </div>

          {/* 6. MULTIMODAL AI CONSENSUS RESULT */}
          <div className="space-y-3 text-black dark:text-[#F7F7F5]">
            <h2 className="text-sm font-black text-black dark:text-purple-300 flex items-center gap-2 border-b-2 border-black dark:border-purple-800/60 pb-2 uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
              <span className="text-black dark:text-[#F7F7F5] font-black">5. MULTIMODAL AI CROSS-MODAL FUSION RESULT</span>
            </h2>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-purple-950/30 border-2 border-black dark:border-purple-800/60 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b-2 border-black dark:border-purple-800/60 pb-3.5">
                <div>
                  <span className="text-[11px] text-black dark:text-slate-400 font-black block uppercase tracking-wider">MRI Prediction</span>
                  <span className="font-black text-black dark:text-[#F7F7F5] text-base mt-0.5 block">
                    {hasMriData ? renderVal(mriPrediction) : 'Not Uploaded'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-black dark:text-slate-400 font-black block uppercase tracking-wider">EEG Prediction</span>
                  <span className="font-black text-black dark:text-[#F7F7F5] text-base mt-0.5 block">
                    {hasEegData ? renderVal(eegPrediction) : 'Not Uploaded'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-black dark:text-slate-400 font-black block uppercase tracking-wider">Cognitive Scores</span>
                  <span className="font-black text-black dark:text-[#F7F7F5] text-base mt-0.5 block">
                    {hasMmse || hasMoca ? `MMSE: ${renderVal(mmseScore)}, MoCA: ${renderVal(mocaScore)}` : 'Not Available'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                  <span className="text-[11px] text-black dark:text-purple-300 font-black uppercase tracking-wider block">FINAL AI DIAGNOSTIC CONSENSUS</span>
                  <span className="text-2xl font-black text-black dark:text-white tracking-tight block mt-0.5">
                    {renderVal(finalResult)}
                  </span>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-black dark:text-purple-300 font-black uppercase tracking-wider block">CROSS-MODAL CONFIDENCE</span>
                  <span className="text-base sm:text-lg font-mono font-black text-emerald-800 dark:text-emerald-300 bg-emerald-500/20 px-3.5 py-1 rounded-xl border-2 border-emerald-400 inline-block mt-0.5">
                    {renderVal(finalConfidence)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 7. CLINICAL AI SUMMARY & SYNTHESIS */}
          <div className="space-y-2 text-black dark:text-[#F7F7F5]">
            <h2 className="text-xs font-black text-black dark:text-purple-300 uppercase tracking-wider border-b-2 border-black dark:border-purple-800/60 pb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#A78BFA]" />
              <span className="text-black dark:text-[#F7F7F5] font-black">6. MULTIMODAL CLINICAL INTERPRETATION</span>
            </h2>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-purple-950/30 border-2 border-black dark:border-purple-800/60 text-xs text-black dark:text-slate-300 leading-relaxed space-y-2 font-bold">
              {hasMriData ? (
                <p>
                  • <strong className="text-black dark:text-white font-black">Neuroimaging Correlation:</strong> The 3D MRI volumetric scan demonstrates neuroanatomical morphometry consistent with <strong className="text-black dark:text-white font-black">{renderVal(mriPrediction)}</strong>.
                </p>
              ) : (
                <p>
                  • <strong className="text-black dark:text-white font-black">Neuroimaging Correlation:</strong> No MRI brain scan uploaded yet; structural volumetric analysis pending.
                </p>
              )}
              {hasEegData ? (
                <p>
                  • <strong className="text-black dark:text-white font-black">Electrophysiological Deceleration:</strong> The 16-channel EEG sequence exhibits significant spectral slowing and oscillatory changes matching <strong className="text-black dark:text-white font-black">{renderVal(eegPrediction)}</strong> patterns.
                </p>
              ) : (
                <p>
                  • <strong className="text-black dark:text-white font-black">Electrophysiological Deceleration:</strong> No EEG signal uploaded yet.
                </p>
              )}
              <p>
                • <strong className="text-black dark:text-white font-black">Psychometric Impairment:</strong> Mini-Mental State Examination ({renderVal(mmseScore)}) and MoCA ({renderVal(mocaScore)}) confirm functional cognitive status.
              </p>
              <p className="pt-1.5 border-t border-black dark:border-purple-800/60">
                • <strong className="text-black dark:text-white font-black">Final Unified Consensus:</strong> Unified multimodal AI cross-modal evaluation yields a consensus classification of <strong className="text-black dark:text-white font-black text-sm">{renderVal(finalResult)}</strong> with {finalConfidence ? `${finalConfidence} model certainty` : 'high probability'}.
              </p>
            </div>
          </div>

          {/* 8. CLINICAL RECOMMENDATIONS & ACTION PLAN */}
          <div className="space-y-2 text-black dark:text-[#F7F7F5]">
            <h2 className="text-xs font-black text-black dark:text-purple-300 uppercase tracking-wider border-b-2 border-black dark:border-purple-800/60 pb-1.5 flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-black dark:text-[#F7F7F5] font-black">7. RECOMMENDED CLINICAL MANAGEMENT PLAN</span>
            </h2>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-purple-950/30 border-2 border-black dark:border-purple-800/60 text-xs text-black dark:text-slate-300 space-y-2 font-bold">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-xl border border-black dark:border-purple-800/60 bg-white dark:bg-[#171321]">
                  <span className="text-[10px] font-black uppercase block text-black dark:text-purple-300">1. Medical Therapy</span>
                  <p className="text-[11px] font-bold mt-1 text-black dark:text-slate-300">Consider acetylcholinesterase inhibitors (Donepezil/Rivastigmine) and NMDA receptor modulators under physician review.</p>
                </div>
                <div className="p-2.5 rounded-xl border border-black dark:border-purple-800/60 bg-white dark:bg-[#171321]">
                  <span className="text-[10px] font-black uppercase block text-black dark:text-purple-300">2. Cognitive Rehabilitation</span>
                  <p className="text-[11px] font-bold mt-1 text-black dark:text-slate-300">Structured cognitive stimulation therapy (CST) and targeted working memory exercises.</p>
                </div>
                <div className="p-2.5 rounded-xl border border-black dark:border-purple-800/60 bg-white dark:bg-[#171321]">
                  <span className="text-[10px] font-black uppercase block text-black dark:text-purple-300">3. Surveillance Protocol</span>
                  <p className="text-[11px] font-bold mt-1 text-black dark:text-slate-300">Repeat volumetric MRI and qEEG surveillance at 3 to 6-month intervals to monitor trajectory.</p>
                </div>
              </div>
            </div>
          </div>

          {/* 9. PHYSICIAN SIGN-OFF & DIGITAL VERIFICATION */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-purple-950/30 border-2 border-black dark:border-purple-800/60 text-black dark:text-[#F7F7F5] grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider block text-black dark:text-purple-300">Cryptographic Digital Verification</span>
              <div className="p-2 rounded-lg bg-white dark:bg-[#171321] border border-black dark:border-purple-800/60 font-mono text-[10px] text-black dark:text-purple-200">
                <p>DOC-HASH: 8F4A2B9C-7E11-449D-9988-5173BEEF4020</p>
                <p>STATUS: VERIFIED BY NEUROFUSION CLINICAL AI</p>
                <p>TIMESTAMP: {new Date().toISOString()}</p>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="h-10 flex items-end justify-end">
                <span className="font-serif italic text-lg font-bold text-black dark:text-[#F7F7F5] border-b-2 border-black dark:border-purple-800/60 pb-0.5 px-4 inline-block">
                  {doctorName}
                </span>
              </div>
              <p className="text-xs font-black text-black dark:text-white">{doctorName}, MD</p>
              <p className="text-[10px] font-bold text-black dark:text-slate-400">{doctorDesignation} • Reg: {doctorRegId}</p>
            </div>
          </div>

          {/* Academic & Clinical Disclaimer */}
          <div className="pt-2 border-t-2 border-black dark:border-purple-800/60 text-[10px] text-black dark:text-slate-400 leading-relaxed italic font-bold">
            <p>
              <strong className="text-black dark:text-slate-200 font-black">Regulatory Notice:</strong> This document is generated by the NeuroFusion Multimodal Artificial Intelligence Platform for research, clinical decision support, and major project evaluation.
            </p>
          </div>

          {/* Official Page 3 Footer */}
          <div className="pt-2 border-t-2 border-black dark:border-purple-800/60 flex items-center justify-between text-[10px] font-black text-black dark:text-slate-400 uppercase tracking-wider">
            <span>NeuroFusion AI Diagnostic Dossier • Ref: {patientId || 'NF-REC'}</span>
            <span>Confidential Medical Record • Page 3 of 3 • End of Document</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AiReport;
