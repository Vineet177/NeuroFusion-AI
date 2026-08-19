import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  BrainCircuit, 
  Activity, 
  Users, 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  Eye, 
  Sparkles, 
  FileCheck, 
  X, 
  Sliders, 
  ArrowRight,
  ShieldAlert,
  Search,
  Filter
} from 'lucide-react';
import { medicalFileApi } from '../api/medicalFileApi';
import { patientApi } from '../api/patientApi';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

const AdminClinicalDataManagement = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({ total_mri: 0, total_eeg: 0, total_files: 0 });
  const [recentUploads, setRecentUploads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, mri, eeg

  // MRI Upload Form State
  const [mriPatientId, setMriPatientId] = useState('');
  const [mriFile, setMriFile] = useState(null);
  const [mriScanType, setMriScanType] = useState('Structural MRI');
  const [mriScanDate, setMriScanDate] = useState(new Date().toISOString().split('T')[0]);
  const [mriNotes, setMriNotes] = useState('');
  const [isUploadingMri, setIsUploadingMri] = useState(false);
  const mriFileInputRef = useRef(null);

  // EEG Upload Form State
  const [eegPatientId, setEegPatientId] = useState('');
  const [eegFile, setEegFile] = useState(null);
  const [eegRecordingType, setEegRecordingType] = useState('EEG Signal Recording');
  const [eegRecordingDate, setEegRecordingDate] = useState(new Date().toISOString().split('T')[0]);
  const [eegNotes, setEegNotes] = useState('');
  const [isUploadingEeg, setIsUploadingEeg] = useState(false);
  const eegFileInputRef = useRef(null);

  // Modal inspection state
  const [viewingFile, setViewingFile] = useState(null);

  // Load initial patients & medical files stats from MySQL
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ptsData, statsData] = await Promise.all([
        patientApi.getPatients(),
        medicalFileApi.getClinicalStats()
      ]);
      setPatients(ptsData || []);
      if (ptsData && ptsData.length > 0) {
        if (!mriPatientId) setMriPatientId(String(ptsData[0].id));
        if (!eegPatientId) setEegPatientId(String(ptsData[0].id));
      }
      setStats({
        total_mri: statsData.total_mri || 0,
        total_eeg: statsData.total_eeg || 0,
        total_files: statsData.total_files || 0
      });
      setRecentUploads(statsData.recent_uploads || []);
    } catch (err) {
      console.error('Error loading clinical management data:', err);
      showAlert('error', 'Unable to load clinical records from MySQL database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Helper for format file sizes
  const formatBytes = (bytes, decimals = 1) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  // Handle MRI Upload
  const handleUploadMri = async (e) => {
    e.preventDefault();
    if (!mriPatientId) {
      showAlert('error', 'Please select a patient.');
      return;
    }
    if (!mriFile) {
      showAlert('error', 'Please choose an MRI scan file (.dcm, .nii, .jpg, .png).');
      return;
    }

    setIsUploadingMri(true);
    try {
      const result = await medicalFileApi.uploadMRI({
        patientId: mriPatientId,
        file: mriFile,
        scanType: mriScanType,
        scanDate: mriScanDate,
        notes: mriNotes
      });
      showAlert('success', `✓ MRI Scan "${mriFile.name}" persisted to MySQL medical_files successfully!`);
      setMriFile(null);
      setMriNotes('');
      if (mriFileInputRef.current) mriFileInputRef.current.value = '';
      await loadData();
    } catch (err) {
      console.error('MRI upload failed:', err);
      showAlert('error', err?.message || 'Failed to upload MRI scan to MySQL.');
    } finally {
      setIsUploadingMri(false);
    }
  };

  // Handle EEG Upload
  const handleUploadEeg = async (e) => {
    e.preventDefault();
    if (!eegPatientId) {
      showAlert('error', 'Please select a patient.');
      return;
    }
    if (!eegFile) {
      showAlert('error', 'Please choose an EEG file (.edf, .set, .csv).');
      return;
    }

    setIsUploadingEeg(true);
    try {
      const result = await medicalFileApi.uploadEEG({
        patientId: eegPatientId,
        file: eegFile,
        recordingType: eegRecordingType,
        recordingDate: eegRecordingDate,
        notes: eegNotes
      });
      showAlert('success', `✓ EEG Record "${eegFile.name}" persisted to MySQL medical_files successfully!`);
      setEegFile(null);
      setEegNotes('');
      if (eegFileInputRef.current) eegFileInputRef.current.value = '';
      await loadData();
    } catch (err) {
      console.error('EEG upload failed:', err);
      showAlert('error', err?.message || 'Failed to upload EEG recording to MySQL.');
    } finally {
      setIsUploadingEeg(false);
    }
  };

  // Handle File Deletion (Admin only)
  const handleDeleteFile = async (fileId, filename) => {
    if (window.confirm(`Are you sure you want to permanently delete "${filename}" from MySQL database?`)) {
      try {
        await medicalFileApi.deleteMedicalFile(fileId);
        showAlert('success', `✓ Medical file #${fileId} deleted from database.`);
        await loadData();
      } catch (err) {
        console.error('Failed to delete file:', err);
        showAlert('error', 'Failed to delete medical file.');
      }
    }
  };

  // Filtered uploads
  const filteredUploads = recentUploads.filter(item => {
    if (filterType === 'all') return true;
    return item.file_type === filterType;
  });

  const selectedMriPatient = patients.find(p => String(p.id) === String(mriPatientId));
  const selectedEegPatient = patients.find(p => String(p.id) === String(eegPatientId));

  return (
    <div className="space-y-6 font-sans">
      
      {/* Alert Banner */}
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

      {/* 1. Clinical Data Upload Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="liquid-glass-card p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#6B6875] dark:text-slate-400 uppercase tracking-wide">Total MRI Scans</span>
            <h3 className="text-2xl font-extrabold text-[#7C3AED] dark:text-[#A78BFA]">{stats.total_mri}</h3>
            <p className="text-[10px] text-slate-400">Structural DICOM & NIfTI</p>
          </div>
          <div className="p-3 rounded-2xl bg-purple-500/10 text-[#7C3AED] dark:text-[#A78BFA]">
            <BrainCircuit className="w-6 h-6" />
          </div>
        </div>

        <div className="liquid-glass-card p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#6B6875] dark:text-slate-400 uppercase tracking-wide">Total EEG Signals</span>
            <h3 className="text-2xl font-extrabold text-[#22C55E]">{stats.total_eeg}</h3>
            <p className="text-[10px] text-slate-400">EDF, SET & CSV Datasets</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-[#22C55E]">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="liquid-glass-card p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#6B6875] dark:text-slate-400 uppercase tracking-wide">Total Clinical Files</span>
            <h3 className="text-2xl font-extrabold text-[#A78BFA]">{stats.total_files}</h3>
            <p className="text-[10px] text-slate-400">Indexed in MySQL 'medical_files'</p>
          </div>
          <div className="p-3 rounded-2xl bg-purple-500/10 text-[#A78BFA]">
            <FileText className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 2. Quick Upload Navigation Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl liquid-glass-card shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-[#7C3AED]">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#171321] dark:text-[#F7F7F5]">Admin Upload Actions</h3>
            <p className="text-[11px] text-[#6B6875] dark:text-slate-400">Upload new patient volumetric brain scans or electrophysiology recordings</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/mri-upload"
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl glass-btn-primary text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Upload MRI Scan</span>
          </Link>

          <Link
            to="/eeg-upload"
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl glass-btn-secondary text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Activity className="w-4 h-4 text-[#7C3AED]" />
            <span>Upload EEG Signal</span>
          </Link>
        </div>
      </div>

      {/* 3. Recent Clinical MRI & EEG Uploads Table */}
      <div className="liquid-glass-card p-6 md:p-8 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-200/40 dark:border-purple-900/40 pb-4">
          <div>
            <h2 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#7C3AED]" />
              Recent MRI & EEG Clinical Uploads
            </h2>
            <p className="text-xs text-[#6B6875] dark:text-slate-400">Live database records persisted in MySQL 'medical_files' table</p>
          </div>

          <div className="flex items-center space-x-2">
            {['all', 'mri', 'eeg'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filterType === type 
                    ? 'bg-[#2563EB] text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type === 'all' ? 'All Files' : type === 'mri' ? 'MRI Scans' : 'EEG Recordings'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">Modality</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4">Scan / Rec Date</th>
                <th className="py-3 px-4">Uploaded By</th>
                <th className="py-3 px-4">Processing Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredUploads.length > 0 ? (
                filteredUploads.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Modality Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {file.file_type === 'mri' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold text-[11px] bg-sky-50 text-[#0284C7] border border-sky-200">
                          <BrainCircuit className="w-3.5 h-3.5" /> MRI Scan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Activity className="w-3.5 h-3.5" /> EEG Signal
                        </span>
                      )}
                    </td>

                    {/* Patient */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{file.patient_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{file.patient_code}</div>
                    </td>

                    {/* Filename & Size */}
                    <td className="py-3.5 px-4 max-w-[200px] truncate">
                      <div className="font-semibold text-slate-800 truncate" title={file.filename}>{file.filename}</div>
                      <div className="text-[10px] text-slate-400">{formatBytes(file.file_size)} • {file.scan_type}</div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      <div>{file.recording_date || new Date(file.upload_date).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">{new Date(file.upload_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>

                    {/* Uploaded By */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        {file.uploaded_by_name || 'Admin'}
                      </span>
                    </td>

                    {/* Processing Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {file.processing_status || 'Analysis Complete'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => setViewingFile(file)}
                        className="px-2.5 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-semibold transition cursor-pointer"
                      >
                        View
                      </button>

                      <button
                        onClick={() => handleDeleteFile(file.id, file.filename)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete record from MySQL"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No medical files uploaded yet. Select a patient above to upload an MRI scan or EEG signal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* =================================================================== */}
      {/* 4. Medical File Inspection Modal */}
      {/* =================================================================== */}
      {viewingFile && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass-card bg-white/95 dark:bg-[#171321]/95 backdrop-blur-2xl rounded-3xl max-w-lg w-full p-6 md:p-7 space-y-4 shadow-2xl border border-purple-200/60 dark:border-purple-900/50">
            <div className="flex items-center justify-between border-b border-purple-100 dark:border-purple-900/30 pb-3">
              <h3 className="font-extrabold text-[#171321] dark:text-[#F7F7F5] text-sm flex items-center gap-2">
                {viewingFile.file_type === 'mri' ? (
                  <BrainCircuit className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
                ) : (
                  <Activity className="w-4 h-4 text-emerald-500" />
                )}
                <span>Clinical File #{viewingFile.id} Metadata</span>
              </h3>
              <button onClick={() => setViewingFile(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-200/50 dark:border-purple-900/40 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#7C3AED] dark:text-[#A78BFA]">Patient Details</span>
                <p className="font-bold text-[#171321] dark:text-[#F7F7F5] text-sm">{viewingFile.patient_name}</p>
                <p className="text-[11px] text-[#6B6875] dark:text-slate-400 font-mono">{viewingFile.patient_code}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40">
                  <span className="text-[10px] text-[#6B6875] dark:text-slate-400 uppercase font-bold block">Modality</span>
                  <span className="font-bold text-[#171321] dark:text-[#F7F7F5] uppercase">{viewingFile.file_type} Scan</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40">
                  <span className="text-[10px] text-[#6B6875] dark:text-slate-400 uppercase font-bold block">Scan/Record Type</span>
                  <span className="font-bold text-[#171321] dark:text-[#F7F7F5]">{viewingFile.scan_type}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40">
                  <span className="text-[10px] text-[#6B6875] dark:text-slate-400 uppercase font-bold block">File Size</span>
                  <span className="font-mono font-semibold text-[#171321] dark:text-[#F7F7F5]">{formatBytes(viewingFile.file_size)}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40">
                  <span className="text-[10px] text-[#6B6875] dark:text-slate-400 uppercase font-bold block">Acquisition Date</span>
                  <span className="font-semibold text-[#171321] dark:text-[#F7F7F5]">{viewingFile.recording_date || 'N/A'}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#6B6875] dark:text-slate-400">Server Storage Location</span>
                <p className="font-mono text-[11px] text-[#171321] dark:text-[#F7F7F5] break-all">{viewingFile.file_path}</p>
              </div>

              {viewingFile.notes && (
                <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#6B6875] dark:text-slate-400">Acquisition Notes</span>
                  <p className="text-[#171321] dark:text-[#F7F7F5] italic">{viewingFile.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-purple-100 dark:border-purple-900/30 flex items-center justify-between">
              <Link
                to="/prediction-result"
                className="text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA] hover:underline flex items-center gap-1"
              >
                <span>Open in AI Multimodal Pipeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => setViewingFile(null)}
                className="px-4 py-2 rounded-xl glass-btn-secondary text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminClinicalDataManagement;
