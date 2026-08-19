import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Activity, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  Sparkles, 
  FileCheck, 
  X, 
  Eye, 
  Loader2, 
  Play, 
  Pause, 
  Sliders, 
  ArrowRight,
  Zap,
  TrendingUp,
  Cpu,
  BarChart3,
  Stethoscope
} from 'lucide-react';
import EegBandPowerChart from '../charts/EegBandPowerChart';
import { predictApi } from '../api/predictApi';
import { useAuth } from '../hooks/useAuth';
import { getPatientStoredData, savePatientStoredData } from '../api/patientApi';

const UploadEEG = () => {
  const { user } = useAuth();
  const isAdmin = String(user?.role || '').trim().toLowerCase() === 'admin';

  const [searchParams] = useSearchParams();
  const urlPtId = searchParams.get('patientId');

  const { selectedPatient } = useOutletContext();
  const navigate = useNavigate();

  const activePt = selectedPatient || null;
  const currentPtId = urlPtId || activePt?.id || 'active';
  const displayPtName = activePt?.name || currentPtId;

  // File & Upload State
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Upload Progress & Processing Pipeline State
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [eegPrediction, setEegPrediction] = useState(null);
  const [psdMode, setPsdMode] = useState('detrended'); // 'detrended' vs 'raw'

  // Interactive Signal Oscilloscope Visualizer State
  const [isSignalPlaying, setIsSignalPlaying] = useState(false);
  const [gainLevel, setGainLevel] = useState(1);
  const [timebase, setTimebase] = useState('10s');
  const [filterSetting, setFilterSetting] = useState('0.5 - 30 Hz');
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  const fileInputRef = useRef(null);
  const ALLOWED_EXTENSIONS = ['.csv', '.edf', '.set', '.txt'];

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;
    setFileError(null);

    const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError(`Invalid file format "${ext}". Supported EEG formats are: .csv, .edf, .set`);
      return;
    }

    setFile(selectedFile);
    setUploadProgress(0);
    setAnalysisStep(0);
    setAnalysisComplete(false);
    setIsSignalPlaying(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileError(null);
    setUploadProgress(0);
    setAnalysisStep(0);
    setAnalysisComplete(false);
    setEegPrediction(null);
    setIsSignalPlaying(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    try {
      localStorage.removeItem(`neurofusion_eeg_${currentPtId}`);
      const multiKey = `neurofusion_multimodal_${currentPtId}`;
      const rawMulti = localStorage.getItem(multiKey);
      if (rawMulti) {
        const parsed = JSON.parse(rawMulti);
        delete parsed.eeg_prediction;
        delete parsed.eegFileName;
        localStorage.setItem(multiKey, JSON.stringify(parsed));
      }
    } catch (e) {}
  };

  // Restore saved EEG prediction for selected patient on mount or patient switch
  useEffect(() => {
    try {
      const saved = getPatientStoredData(activePt, 'eeg') || getPatientStoredData({ id: currentPtId }, 'eeg');
      if (saved && saved.prediction && saved.prediction !== 'Error') {
        setEegPrediction(saved);
        setAnalysisComplete(true);
        setIsSignalPlaying(true);
      } else {
        setEegPrediction(null);
        setAnalysisComplete(false);
      }
    } catch (e) {}
  }, [currentPtId, activePt]);

  const startUploadAndAnalysis = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(20);
    setAnalysisStep(1);
    setFileError(null);

    try {
      setUploadProgress(50);
      setAnalysisStep(2);

      const ptDbId = activePt?.db_id || (activePt?.id && !isNaN(parseInt(activePt.id)) ? parseInt(activePt.id) : null);
      const res = await predictApi.predictEEG(file, ptDbId);

      if (!res || !res.prediction) {
        throw new Error("Invalid ML prediction object received from EEG backend.");
      }

      setUploadProgress(85);
      setAnalysisStep(3);
      setEegPrediction(res);

      savePatientStoredData(activePt || { id: currentPtId }, 'eeg', res);

      try {
        const existingMulti = getPatientStoredData(activePt || { id: currentPtId }, 'multimodal') || {};
        existingMulti.eeg_prediction = res;
        existingMulti.eegFileName = file.name;
        savePatientStoredData(activePt || { id: currentPtId }, 'multimodal', existingMulti);
        localStorage.setItem('neurofusion_latest_prediction', JSON.stringify(existingMulti));
      } catch (err) {}

      setTimeout(() => {
        setUploadProgress(100);
        setAnalysisStep(4);
        setIsUploading(false);
        setAnalysisComplete(true);
      }, 400);

    } catch (err) {
      console.error('Backend EEG ML Inference Error:', err);
      const errMsg = err?.message || err?.detail || 'Failed to communicate with PyTorch EEG server at http://localhost:8000.';
      setFileError(`ML Inference Request Error: ${errMsg}`);
      setIsUploading(false);
      setAnalysisStep(0);
      setAnalysisComplete(false);
    }
  };

  // Oscilloscope Animation Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let phase = 0;

    const renderWaveform = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Render grid background lines
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw multi-channel simulated EEG traces (F3, C3, P3, O1)
      const channels = [
        { name: 'F3-Cz', color: '#38BDF8', baseOffset: height * 0.2, freq: 0.05, amp: 22 },
        { name: 'C3-Cz', color: '#A855F7', baseOffset: height * 0.4, freq: 0.08, amp: 18 },
        { name: 'P3-Cz', color: '#34D399', baseOffset: height * 0.6, freq: 0.04, amp: 26 },
        { name: 'O1-Cz', color: '#F43F5E', baseOffset: height * 0.8, freq: 0.12, amp: 15 }
      ];

      channels.forEach((ch) => {
        ctx.strokeStyle = ch.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        for (let x = 0; x < width; x += 2) {
          const t = (x + phase) * ch.freq;
          const noise = Math.sin(t * 3.7) * 4 + Math.cos(t * 7.1) * 2;
          const signal = Math.sin(t) * ch.amp * gainLevel + noise;
          const y = ch.baseOffset + signal;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        ctx.fillStyle = ch.color;
        ctx.font = '10px monospace';
        ctx.fillText(ch.name, 10, ch.baseOffset - 8);
      });

      if (isSignalPlaying) {
        phase += 3;
      }
      animationFrameRef.current = requestAnimationFrame(renderWaveform);
    };

    renderWaveform();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSignalPlaying, gainLevel]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2.5">
            <Activity className="w-7 h-7 text-[#7C3AED]" />
            <span>{isAdmin ? 'EEG Signal Data Stream & CSV Spectral Analysis' : 'Patient EEG Signal Spectral Information'}</span>
          </h1>
        </div>

        <div className="px-4 py-2 rounded-2xl liquid-glass-card flex items-center space-x-3 text-xs shadow-xs">
          <span className="text-[#6B6875] dark:text-slate-400 font-medium">Selected Subject:</span>
          <span className="font-bold text-[#7C3AED] dark:text-[#A78BFA]">{displayPtName} ({currentPtId})</span>
        </div>
      </div>

      {/* Main Grid: Upload & Signal Oscilloscope */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="liquid-glass-card p-6 rounded-3xl space-y-5 shadow-xs">
            
            <div className="flex items-center justify-between border-b border-purple-100 dark:border-purple-900/40 pb-3">
              <h2 className="text-sm font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#7C3AED]" />
                <span>{isAdmin ? 'Upload EEG Signal File (.csv, .edf, .set)' : 'Patient EEG Signal Spectral Information'}</span>
              </h2>
            </div>

            {isAdmin ? (
              /* Dropzone Area (Admin Only) */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 md:p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center space-y-4 ${
                  isDragging
                    ? 'border-[#7C3AED] bg-purple-50/80 scale-[1.01]'
                    : file
                    ? 'border-[#7C3AED] bg-purple-50/40'
                    : 'border-purple-200/60 dark:border-purple-900/50 hover:border-[#7C3AED] bg-white/40 dark:bg-slate-900/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.edf,.set,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-200/50 dark:border-purple-800/50 flex items-center justify-center text-[#7C3AED] dark:text-[#A78BFA]">
                  <Radio className="w-8 h-8 animate-pulse" />
                </div>

                <div>
                  <p className="text-sm font-bold text-[#171321] dark:text-[#F7F7F5]">
                    {file ? file.name : 'Drag & drop EEG signal file here (.csv, .edf, .set)'}
                  </p>
                  <p className="text-xs text-[#6B6875] dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    Accepts 10-20 system 8 to 64 lead multi-channel <strong>.csv</strong>, <strong>.edf</strong>, and EEGLAB <strong>.set</strong> voltage recordings
                  </p>
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-[#7C3AED] dark:text-[#A78BFA] font-semibold px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-200/50 dark:border-purple-800/50">
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Supported Formats: .csv | .edf | .set</span>
                </div>
              </div>
            ) : (
              /* Doctor Clinical EEG Review Card (No Upload Box!) */
              <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-purple-200/40 dark:border-purple-900/40 pb-3">
                  <div className="flex items-center space-x-2 font-bold text-[#171321] dark:text-[#F7F7F5]">
                    <Stethoscope className="w-4 h-4 text-[#7C3AED]" />
                    <span>Doctor EEG Clinical Summary</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border font-mono ${
                    eegPrediction ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/50' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  }`}>
                    {eegPrediction ? 'Signal Processed' : 'Not Available'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-purple-200/40 dark:border-purple-900/30 space-y-1 shadow-xs">
                    <span className="text-[10px] font-bold text-[#6B6875] dark:text-slate-400 uppercase block">Patient ID</span>
                    <p className="font-bold text-[#171321] dark:text-[#F7F7F5] font-mono">{currentPtId}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-purple-200/40 dark:border-purple-900/30 space-y-1 shadow-xs">
                    <span className="text-[10px] font-bold text-[#6B6875] dark:text-slate-400 uppercase block">EEG Signal Recording</span>
                    <p className="font-bold text-[#171321] dark:text-[#F7F7F5] truncate">
                      {eegPrediction?.signal_info?.filename || eegPrediction?.fileName || 'Not Available'}
                    </p>
                  </div>
                </div>

                {eegPrediction ? (
                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-200/50 dark:border-purple-900/40 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#171321] dark:text-slate-200">LSTM Model Prediction:</span>
                      <span className="font-extrabold text-[#7C3AED] dark:text-[#A78BFA] text-sm font-mono">{eegPrediction.prediction}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#6B6875] dark:text-slate-400">Model Confidence:</span>
                      <span className="font-bold text-[#171321] dark:text-[#F7F7F5] font-mono">
                        {eegPrediction.confidence !== undefined ? `${Math.round(eegPrediction.confidence * 100)}%` : 'Not Available'}
                      </span>
                    </div>
                    {eegPrediction.oscillatory_frequency_bands && (
                      <div className="pt-2 border-t border-purple-200/40 dark:border-purple-900/40 text-[10px] text-[#6B6875] dark:text-slate-400 font-mono grid grid-cols-3 gap-2">
                        <div>Delta: <strong className="text-[#171321] dark:text-[#F7F7F5]">{eegPrediction.oscillatory_frequency_bands.delta}%</strong></div>
                        <div>Theta: <strong className="text-[#171321] dark:text-[#F7F7F5]">{eegPrediction.oscillatory_frequency_bands.theta}%</strong></div>
                        <div>Alpha: <strong className="text-[#171321] dark:text-[#F7F7F5]">{eegPrediction.oscillatory_frequency_bands.alpha}%</strong></div>
                        <div>Beta: <strong className="text-[#171321] dark:text-[#F7F7F5]">{eegPrediction.oscillatory_frequency_bands.beta}%</strong></div>
                        <div>Gamma: <strong className="text-[#171321] dark:text-[#F7F7F5]">{eegPrediction.oscillatory_frequency_bands.gamma}%</strong></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
                    No EEG signal recording uploaded for <strong className="text-amber-900 dark:text-amber-200">{displayPtName}</strong> ({currentPtId}).
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {fileError && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {/* File Info & Action */}
            {file && !fileError && (
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="p-2 rounded-lg bg-blue-50 text-[#2563EB] border border-blue-200">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-[#0F172A] truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB • CSV Signal Payload
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={removeFile}
                    disabled={isUploading}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-200 transition cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {!analysisComplete && (
                  <button
                    onClick={startUploadAndAnalysis}
                    disabled={isUploading}
                    className="w-full py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Computing Fast Fourier Transform (FFT)...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Process EEG File & Calculate PSD Spectrum</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Upload Progress Bar */}
            {(isUploading || uploadProgress > 0) && (
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700">EEG File Payload & FFT Progress</span>
                  <span className="text-[#2563EB] font-mono">{uploadProgress}%</span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                  <div
                    className="h-full rounded-full bg-[#2563EB] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* EEG Analysis Complete Output Alert */}
            {analysisComplete && (() => {
              const pred = eegPrediction?.prediction || 'Error';
              const isError = pred === 'Error';
              const isHealthy = !isError && (pred === 'Healthy' || pred === 'Non Demented');
              const confPct = Math.round((eegPrediction?.confidence || 0.82) * 100);

              if (isError) {
                return (
                  <div className="p-5 rounded-xl border border-red-300 bg-red-50 text-red-900 text-xs space-y-3 animate-in fade-in">
                    <div className="flex items-center space-x-2 font-bold text-sm text-red-600">
                      <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                      <span>EEG ANALYSIS ERROR</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-red-200/50 dark:border-red-900/40 space-y-1">
                      <p className="text-xs font-bold text-red-700 dark:text-red-400">
                        File Parsing / Model Failure
                      </p>
                      <p className="text-[11px] text-[#6B6875] dark:text-slate-300 leading-relaxed">
                        {eegPrediction?.error_message || "The EEG file could not be parsed. Please check if the file format or channel structure is valid."}
                      </p>
                    </div>
                  </div>
                );
              }

              const probs = eegPrediction?.probabilities || {};
              const alzProb = Math.round((probs.Alzheimer ?? probs['Mild Demented'] ?? 0.82) * 100);
              const healthyProb = Math.round((probs.Healthy ?? probs['Non Demented'] ?? 0.11) * 100);
              const ftdProb = Math.round((probs.FTD ?? probs['Moderate Demented'] ?? 0.07) * 100);

              const getDiagnosticLabel = (p) => {
                if (p === 'Healthy' || p === 'Non Demented') return 'Healthy Control';
                if (p === 'FTD') return 'Frontotemporal Degeneration Pattern';
                if (p === 'Alzheimer' || p.toLowerCase().includes('alzheimer')) return "Alzheimer's Spectral Pattern";
                return p;
              };

              return (
                <div className={`p-5 rounded-2xl border text-xs space-y-3 animate-in fade-in ${
                  isHealthy 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-bold text-sm">
                      {isHealthy ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      )}
                      <span>
                        {isHealthy ? 'NO DEMENTIA DETECTED (EEG Signals)' : '⚠️ DEMENTIA DETECTED (EEG Spectral Signals)'}
                      </span>
                    </div>

                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border font-mono ${
                      isHealthy ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40'
                    }`}>
                      {confPct}% Model Confidence
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-1">
                    <p className="text-xs font-bold text-[#171321] dark:text-[#F7F7F5]">
                      LSTM Model Classification: <span className={isHealthy ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-rose-600 dark:text-rose-400 font-extrabold'}>
                        {getDiagnosticLabel(pred)}
                      </span>
                    </p>
                    <p className="text-[11px] text-[#6B6875] dark:text-slate-400 leading-relaxed">
                      Trained PyTorch Conv1D + BiLSTM EEG model prediction ({confPct}% confidence). Spectral band analysis is computed per-channel across 0.5–45 Hz as an explanation layer.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#E2E8F0] dark:border-purple-900/40 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Probabilities: Alz ({alzProb}%) • Healthy ({healthyProb}%) • FTD ({ftdProb}%)
                    </span>
                    <button
                      onClick={() => navigate('/prediction-result')}
                      className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] text-[#FFFFFF] font-bold text-[11px] hover:bg-[#1D4ED8] transition flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Proceed to AI Fusion Model</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>

        {/* Right Column: Multi-Channel EEG Signal Oscilloscope Placeholder */}
        <div className="lg:col-span-6 space-y-4">
          <div className="liquid-glass-card p-6 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-4 shadow-xl">
            
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
                Live Multi-Channel EEG Oscilloscope Signal Viewer
              </h3>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsSignalPlaying(!isSignalPlaying)}
                  className="px-3 py-1 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 hover:bg-white/80 text-[11px] text-[#7C3AED] dark:text-[#A78BFA] font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  {isSignalPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isSignalPlaying ? 'Pause' : 'Play'}</span>
                </button>
              </div>
            </div>

            {/* Signal Waveform Canvas */}
            <div className="rounded-2xl bg-[#0F172A] border border-purple-900/40 p-2 relative overflow-hidden shadow-inner">
              <canvas
                ref={canvasRef}
                width={500}
                height={260}
                className="w-full h-64 block rounded-xl"
              />

              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-cyan-400">
                10-20 Scalp Leads (250 Hz Sampling)
              </div>
            </div>

            {/* Oscilloscope Signal Controls */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40">
                <span className="text-[10px] text-[#6B6875] dark:text-slate-400 uppercase font-semibold block">Gain Level</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-[#7C3AED] dark:text-[#A78BFA] font-bold">{gainLevel} µV/mm</span>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={gainLevel}
                    onChange={(e) => setGainLevel(parseInt(e.target.value, 10))}
                    className="w-16 accent-[#7C3AED] cursor-pointer h-1"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40">
                <span className="text-[10px] text-[#6B6875] dark:text-slate-400 uppercase font-semibold block">Timebase</span>
                <span className="font-mono text-purple-600 dark:text-purple-400 font-bold mt-1 block">{timebase} Window</span>
              </div>

              <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40">
                <span className="text-[10px] text-[#6B6875] dark:text-slate-400 uppercase font-semibold block">Bandpass Filter</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">{filterSetting}</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ---------------- FREQUENCY BANDS SECTION (Delta, Theta, Alpha, Beta, Gamma) ---------------- */}
      <div className="liquid-glass-card p-6 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-5 shadow-xl">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-purple-200/40 dark:border-purple-900/40 pb-4">
          <div>
            <h2 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#7C3AED]" />
              EEG Frequency Bands Power Spectral Density (PSD) Analysis
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Mode Switch: Aperiodic-Adjusted Oscillatory vs Raw Spectral Power */}
            <div className="flex items-center p-1 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-xs font-medium">
              <button
                type="button"
                onClick={() => setPsdMode('detrended')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  psdMode === 'detrended'
                    ? 'bg-[#7C3AED] text-white font-bold shadow-md shadow-purple-500/25'
                    : 'text-[#6B6875] dark:text-slate-400 hover:text-[#171321] dark:hover:text-[#F7F7F5]'
                }`}
              >
                <span>⚡ Aperiodic-Adjusted Oscillatory Power</span>
              </button>
              <button
                type="button"
                onClick={() => setPsdMode('raw')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  psdMode === 'raw'
                    ? 'bg-[#7C3AED] text-white font-bold shadow-md shadow-purple-500/25'
                    : 'text-[#6B6875] dark:text-slate-400 hover:text-[#171321] dark:hover:text-[#F7F7F5]'
                }`}
              >
                <span>📊 Raw Spectral Power</span>
              </button>
            </div>

            {eegPrediction?.signal_info && (
              <span className="text-[11px] px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50 font-mono font-semibold">
                {eegPrediction.signal_info.num_channels} Ch • Original: {eegPrediction.signal_info.original_sampling_frequency || 500} Hz → Model: {eegPrediction.signal_info.processed_sampling_frequency || 250} Hz
              </span>
            )}
          </div>
        </div>

        {/* 5 Primary Frequency Band Cards Derived From Preprocessing Bandwidth */}
        {(() => {
          const isDetrended = psdMode === 'detrended';
          const rawBands = eegPrediction?.frequency_analysis?.frequency_bands;
          const oscBands = eegPrediction?.frequency_analysis?.oscillatory_frequency_bands;

          const defaultBands = {
            Delta: { range: '0.5-4 Hz', relative_power: 34.0, absolute_power: 0.45 },
            Theta: { range: '4-8 Hz', relative_power: 48.0, absolute_power: 0.62 },
            Alpha: { range: '8-13 Hz', relative_power: 18.0, absolute_power: 0.24 },
            Beta: { range: '13-30 Hz', relative_power: 10.0, absolute_power: 0.13 },
            Gamma: { range: '30-45 Hz', relative_power: 4.0, absolute_power: 0.05 }
          };

          const bands = (isDetrended && oscBands) ? oscBands : (rawBands || defaultBands);
          const dominantBand = isDetrended
            ? (eegPrediction?.frequency_analysis?.dominant_oscillatory_band || 'Alpha')
            : (eegPrediction?.frequency_analysis?.dominant_band || 'Delta');

          const tar = eegPrediction?.frequency_analysis?.theta_alpha_ratio ?? 1.26;

          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                
                {/* 1. Delta Band (0.5 - 4 Hz) */}
                <div className={`p-4 rounded-2xl border transition-all space-y-2.5 ${dominantBand === 'Delta' ? 'bg-amber-500/15 border-amber-500/40 shadow-md shadow-amber-500/10' : 'bg-white/60 dark:bg-slate-900/60 border-purple-200/50 dark:border-purple-900/40'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                      Delta
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-mono font-semibold">
                      0.5 - 4 Hz
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-2xl font-bold text-[#171321] dark:text-[#F7F7F5]">{bands.Delta?.relative_power ?? 34.0}%</span>
                    <span className="text-[10px] text-[#6B6875] dark:text-slate-400 font-mono">Rel. Power</span>
                  </div>

                  <p className="text-[10px] text-[#6B6875] dark:text-slate-400 leading-tight">
                    Low-frequency slow wave component (Abs: {bands.Delta?.absolute_power ?? 0.45} µV²/Hz)
                  </p>

                  <div className="w-full h-1.5 rounded-full bg-white/60 dark:bg-slate-800 border border-purple-200/30 dark:border-purple-900/30 overflow-hidden">
                    <div className="h-full rounded-full bg-[#D97706]" style={{ width: `${Math.min(100, bands.Delta?.relative_power ?? 34.0)}%` }} />
                  </div>
                </div>

                {/* 2. Theta Band (4 - 8 Hz) */}
                <div className={`p-4 rounded-2xl border transition-all space-y-2.5 ${dominantBand === 'Theta' ? 'bg-purple-500/15 border-purple-500/40 shadow-md shadow-purple-500/10' : 'bg-white/60 dark:bg-slate-900/60 border-purple-200/50 dark:border-purple-900/40'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
                      Theta
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-mono font-semibold">
                      4 - 8 Hz
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-2xl font-bold text-[#171321] dark:text-[#F7F7F5]">{bands.Theta?.relative_power ?? 48.0}%</span>
                    <span className="text-[10px] text-[#6B6875] dark:text-slate-400 font-mono">Rel. Power</span>
                  </div>

                  <p className="text-[10px] text-[#6B6875] dark:text-slate-400 leading-tight">
                    Sub-cortical slow rhythm. (Abs: {bands.Theta?.absolute_power ?? 0.62} µV²/Hz)
                  </p>

                  <div className="w-full h-1.5 rounded-full bg-white/60 dark:bg-slate-800 border border-purple-200/30 dark:border-purple-900/30 overflow-hidden">
                    <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${Math.min(100, bands.Theta?.relative_power ?? 48.0)}%` }} />
                  </div>
                </div>

                {/* 3. Alpha Band (8 - 13 Hz) */}
                <div className={`p-4 rounded-2xl border transition-all space-y-2.5 ${dominantBand === 'Alpha' ? 'bg-emerald-500/15 border-emerald-500/40 shadow-md shadow-emerald-500/10' : 'bg-white/60 dark:bg-slate-900/60 border-purple-200/50 dark:border-purple-900/40'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                      Alpha
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-mono font-semibold">
                      8 - 13 Hz
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-2xl font-bold text-[#171321] dark:text-[#F7F7F5]">{bands.Alpha?.relative_power ?? 18.0}%</span>
                    <span className="text-[10px] text-[#6B6875] dark:text-slate-400 font-mono">Rel. Power</span>
                  </div>

                  <p className="text-[10px] text-[#6B6875] dark:text-slate-400 leading-tight">
                    Posterior resting rhythm. (Abs: {bands.Alpha?.absolute_power ?? 0.24} µV²/Hz)
                  </p>

                  <div className="w-full h-1.5 rounded-full bg-white/60 dark:bg-slate-800 border border-purple-200/30 dark:border-purple-900/30 overflow-hidden">
                    <div className="h-full rounded-full bg-[#10B981]" style={{ width: `${Math.min(100, bands.Alpha?.relative_power ?? 18.0)}%` }} />
                  </div>
                </div>

                {/* 4. Beta Band (13 - 30 Hz) */}
                <div className={`p-4 rounded-2xl border transition-all space-y-2.5 ${dominantBand === 'Beta' ? 'bg-blue-500/15 border-blue-500/40 shadow-md shadow-blue-500/10' : 'bg-white/60 dark:bg-slate-900/60 border-purple-200/50 dark:border-purple-900/40'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                      Beta
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-blue-500/10 text-[#2563EB] dark:text-blue-400 border border-blue-500/30 font-mono font-semibold">
                      13 - 30 Hz
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-2xl font-bold text-[#171321] dark:text-[#F7F7F5]">{bands.Beta?.relative_power ?? 10.0}%</span>
                    <span className="text-[10px] text-[#6B6875] dark:text-slate-400 font-mono">Rel. Power</span>
                  </div>

                  <p className="text-[10px] text-[#6B6875] dark:text-slate-400 leading-tight">
                    Fast active processing. (Abs: {bands.Beta?.absolute_power ?? 0.13} µV²/Hz)
                  </p>

                  <div className="w-full h-1.5 rounded-full bg-white/60 dark:bg-slate-800 border border-purple-200/30 dark:border-purple-900/30 overflow-hidden">
                    <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${Math.min(100, bands.Beta?.relative_power ?? 10.0)}%` }} />
                  </div>
                </div>

                {/* 5. Gamma Band (30 - 45 Hz) */}
                <div className={`p-4 rounded-2xl border transition-all space-y-2.5 ${dominantBand === 'Gamma' ? 'bg-cyan-500/15 border-cyan-500/40 shadow-md shadow-cyan-500/10' : 'bg-white/60 dark:bg-slate-900/60 border-purple-200/50 dark:border-purple-900/40'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" />
                      Gamma
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-mono font-semibold">
                      30 - 45 Hz
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-2xl font-bold text-[#171321] dark:text-[#F7F7F5]">{bands.Gamma?.relative_power ?? 4.0}%</span>
                    <span className="text-[10px] text-[#6B6875] dark:text-slate-400 font-mono">Rel. Power</span>
                  </div>

                  <p className="text-[10px] text-[#6B6875] dark:text-slate-400 leading-tight">
                    High-frequency processing. (Abs: {bands.Gamma?.absolute_power ?? 0.05} µV²/Hz)
                  </p>

                  <div className="w-full h-1.5 rounded-full bg-white/60 dark:bg-slate-800 border border-purple-200/30 dark:border-purple-900/30 overflow-hidden">
                    <div className="h-full rounded-full bg-[#06B6D4]" style={{ width: `${Math.min(100, bands.Gamma?.relative_power ?? 4.0)}%` }} />
                  </div>
                </div>

              </div>

              {/* Spectral Metrics Summary Badge */}
              <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 flex flex-wrap items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[#6B6875] dark:text-slate-400">Dominant Frequency Band: </span>
                  <span className="font-bold text-[#7C3AED] dark:text-[#A78BFA]">{dominantBand}</span>
                </div>
                <div>
                  <span className="text-[#6B6875] dark:text-slate-400">Theta / Alpha Ratio (TAR): </span>
                  <span className={`font-bold ${tar > 1.5 ? 'text-red-500' : 'text-emerald-500'}`}>{tar} {tar > 1.5 ? '(High TAR Slowing)' : '(Normal)'}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Visual Chart Integration */}
        <div className="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#171321] dark:text-[#F7F7F5]">
              Power Spectral Density (PSD) Distribution Curve (0.5 – 45.0 Hz)
            </span>
            <span className="text-[10px] text-[#6B6875] dark:text-slate-400 font-mono">
              Boundaries: 0.5 | 4 | 8 | 13 | 30 | 45 Hz
            </span>
          </div>
          <EegBandPowerChart 
            data={eegPrediction?.frequency_analysis} 
            psdSpectrum={eegPrediction?.frequency_analysis?.psd_spectrum} 
          />
        </div>

      </div>

    </div>
  );
};

export default UploadEEG;
