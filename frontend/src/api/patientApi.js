import axiosInstance from './axios';

// Store for custom registered patients
export const MOCK_PATIENTS_DETAILED = [];



// Local Storage Persistence Helpers
const CUSTOM_PATIENTS_KEY = 'neurofusion_custom_patients';

const getStoredCustomPatients = () => {
  try {
    const data = localStorage.getItem(CUSTOM_PATIENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveCustomPatientToStorage = (patient) => {
  try {
    const existing = getStoredCustomPatients();
    const filtered = existing.filter(
      (p) => String(p.id).toLowerCase() !== String(patient.id).toLowerCase() && 
             String(p.name).toLowerCase() !== String(patient.name).toLowerCase()
    );
    const updated = [patient, ...filtered];
    localStorage.setItem(CUSTOM_PATIENTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save custom patient to localStorage:', e);
  }
};

/**
 * Helper to determine if a patient is assigned to the currently logged in user.
 * - Admin: sees all patients across the entire clinic.
 * - Doctor: ONLY sees patients assigned/registered to that specific doctor.
 */
export const isPatientAssignedToUser = (patient, user) => {
  if (!patient) return false;
  if (!user) return true;

  const role = String(user.role || '').trim().toLowerCase();
  if (role === 'admin') return true; // Admins have global clinic directory visibility

  const userDocName = String(user.name || '').toLowerCase().replace(/dr\.?\s*/gi, '').replace(/,\s*md/gi, '').trim();
  const assignedDoc = String(patient.primaryDoctor || patient.primary_doctor || patient.assigned_doctor || patient.doctor_name || '').toLowerCase().replace(/dr\.?\s*/gi, '').replace(/,\s*md/gi, '').trim();

  if (!assignedDoc || assignedDoc === 'unassigned') {
    return false;
  }

  // Exact match
  if (assignedDoc === userDocName) return true;

  // Substring match (e.g. "vishwas g" in "Dr. Vishwas G" or vice-versa)
  if (userDocName && (assignedDoc.includes(userDocName) || userDocName.includes(assignedDoc))) return true;

  // Token / keyword matching (for names with titles or different word order)
  const userTokens = userDocName.split(/\s+/).filter(t => t.length > 2);
  const docTokens = assignedDoc.split(/\s+/).filter(t => t.length > 2);
  if (userTokens.some(t => docTokens.includes(t))) return true;

  return false;
};

export const filterPatientsByUser = (patients, user) => {
  if (!Array.isArray(patients)) return [];
  return patients.filter(p => isPatientAssignedToUser(p, user));
};

// Multi-key patient data lookup helper for 100% reliable Admin -> Doctor synchronization
export const getPatientStoredData = (pt, type) => {
  if (!pt) return null;
  const pId = pt.id ? String(pt.id).trim() : '';
  const pDbId = pt.db_id ? String(pt.db_id).trim() : (pt.id && !isNaN(Number(pt.id)) ? String(pt.id).trim() : '');
  const pName = pt.name ? String(pt.name).toLowerCase().trim() : '';
  const isSpecificPatient = Boolean((pId && pId !== 'active') || pDbId || pName);
  const numPart = pId && pId !== 'active' ? pId.replace(/[^0-9]/g, '') : (pDbId ? String(pDbId).replace(/[^0-9]/g, '') : '');
  const numVal = numPart ? parseInt(numPart, 10) : null;

  const keys = [
    pId && pId !== 'active' ? `neurofusion_${type}_${pId}` : null,
    pDbId ? `neurofusion_${type}_${pDbId}` : null,
    pName ? `neurofusion_${type}_${pName}` : null,
    numPart ? `neurofusion_${type}_${numPart}` : null,
    numVal && numVal >= 1000 ? `neurofusion_${type}_${numVal - 1000}` : null,
    numVal && numVal < 1000 ? `neurofusion_${type}_${numVal + 1000}` : null,
    numVal && numVal >= 1000 ? `neurofusion_${type}_NF-${numVal}` : null,
    numVal && numVal < 1000 ? `neurofusion_${type}_NF-${1000 + numVal}` : null,
    // Only fall back to _active if NO specific patient ID or name was provided
    !isSpecificPatient ? `neurofusion_${type}_active` : null
  ].filter(Boolean);

  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed) return parsed;
      }
    } catch (e) {}
  }
  return null;
};

// Helper to save patient data under all matching keys
export const savePatientStoredData = (pt, type, data) => {
  if (!pt || !data) return;
  const pId = pt.id ? String(pt.id).trim() : '';
  const pDbId = pt.db_id ? String(pt.db_id).trim() : '';
  const pName = pt.name ? String(pt.name).toLowerCase().trim() : '';
  const numPart = pId ? pId.replace(/[^0-9]/g, '') : (pDbId ? pDbId.replace(/[^0-9]/g, '') : '');
  const numVal = numPart ? parseInt(numPart, 10) : null;

  const keys = [
    pId ? `neurofusion_${type}_${pId}` : null,
    pDbId ? `neurofusion_${type}_${pDbId}` : null,
    pName ? `neurofusion_${type}_${pName}` : null,
    numPart ? `neurofusion_${type}_${numPart}` : null,
    numVal && numVal >= 1000 ? `neurofusion_${type}_${numVal - 1000}` : null,
    numVal && numVal < 1000 ? `neurofusion_${type}_${numVal + 1000}` : null,
    numVal && numVal >= 1000 ? `neurofusion_${type}_NF-${numVal}` : null,
    numVal && numVal < 1000 ? `neurofusion_${type}_NF-${1000 + numVal}` : null,
    `neurofusion_${type}_active`
  ].filter(Boolean);

  const jsonStr = JSON.stringify(data);
  for (const k of keys) {
    try {
      localStorage.setItem(k, jsonStr);
    } catch (e) {}
  }
};

const formatBackendPatient = (rawPt) => {
  if (!rawPt) return null;
  const ptId = rawPt.patient_id 
    ? rawPt.patient_id 
    : (rawPt.id ? (String(rawPt.id).startsWith('NF-') ? rawPt.id : `NF-${1000 + Number(rawPt.id)}`) : `NF-${Math.floor(1000 + Math.random() * 9000)}`);

  const initials = (rawPt.name || 'Patient')
    .trim()
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2) || 'PT';

  const tempPt = { id: ptId, db_id: rawPt.id, name: rawPt.name };
  const savedMulti = getPatientStoredData(tempPt, 'multimodal');
  const savedMri = getPatientStoredData(tempPt, 'mri');
  const savedEeg = getPatientStoredData(tempPt, 'eeg');
  const savedCog = getPatientStoredData(tempPt, 'cognitive');

  const ptAge = Number(rawPt.age) || 30;
  const computedStage = savedMulti?.diagnosis || savedEeg?.prediction || savedMri?.prediction || "Baseline Evaluation";
  const computedRisk = savedMulti?.riskPercentage ?? (savedMulti?.confidence ? Math.round(savedMulti.confidence * 100) : null);
  const computedCategory = savedMulti?.riskCategory || (computedRisk !== null ? (computedRisk > 50 ? "High Risk" : "Low Risk") : "Pending Evaluation");

  return {
    id: ptId,
    db_id: rawPt.id,
    name: rawPt.name || 'Unnamed Patient',
    initials,
    age: ptAge,
    gender: rawPt.gender || 'Female',
    dob: rawPt.dob || '',
    bloodGroup: rawPt.bloodGroup || '',
    phone: rawPt.phone || '',
    email: rawPt.email || '',
    address: rawPt.address || '',
    emergencyContact: rawPt.emergencyContact || '',
    primaryDoctor: rawPt.primary_doctor || rawPt.primaryDoctor || (savedMulti?.doctorName || savedMulti?.assigned_doctor || 'Dr. Sunita Sharma'),
    assigned_doctor: rawPt.primary_doctor || rawPt.primaryDoctor || (savedMulti?.doctorName || savedMulti?.assigned_doctor || 'Dr. Sunita Sharma'),
    doctor_name: rawPt.primary_doctor || rawPt.primaryDoctor || (savedMulti?.doctorName || savedMulti?.assigned_doctor || 'Dr. Sunita Sharma'),
    intakeDate: rawPt.created_at ? rawPt.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    medicalHistory: rawPt.medical_history || rawPt.medicalHistory || 'Baseline evaluation logged',
    allergies: rawPt.allergies || 'None',
    stage: computedStage,
    riskScore: computedRisk,
    riskCategory: computedCategory,
    aiConfidence: savedMulti?.confidence ? `${Math.round(savedMulti.confidence * 100)}%` : null,
    lastAssessment: savedMulti?.assessmentDate || rawPt.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],

    // MRI Data: ONLY if actual MRI model prediction exists for this patient
    mri: savedMri ? {
      scanDate: savedMri.scanDate || new Date().toISOString().split('T')[0],
      prediction: savedMri.prediction,
      confidence: savedMri.confidence !== undefined ? `${Math.round(savedMri.confidence * 100)}%` : null,
      probabilities: savedMri.probabilities || null,
      fileName: savedMri.signal_info?.filename || savedMri.fileName || 'MRI Scan'
    } : null,

    // EEG Data: ONLY if actual EEG model prediction exists for this patient
    eeg: savedEeg ? {
      scanDate: savedEeg.scanDate || new Date().toISOString().split('T')[0],
      prediction: savedEeg.prediction,
      confidence: savedEeg.confidence !== undefined ? `${Math.round(savedEeg.confidence * 100)}%` : null,
      probabilities: savedEeg.probabilities || null,
      fileName: savedEeg.signal_info?.filename || savedEeg.fileName || 'EEG Recording',
      frequencyBands: savedEeg.oscillatory_frequency_bands || savedEeg.frequencyBands || null,
      dominantBand: savedEeg.dominant_oscillatory_band || savedEeg.dominantBand || null
    } : null,

    // Cognitive Data: ONLY if actual Cognitive scores were entered for this patient
    cognitive: savedCog ? {
      assessmentDate: savedCog.assessmentDate || new Date().toISOString().split('T')[0],
      mmseScore: savedCog.mmseScore,
      mocaScore: savedCog.mocaScore,
      notes: savedCog.notes || ''
    } : null,

    multimodal: savedMulti || null
  };
};

export const enrichPatientWithMultimodalData = (pt) => {
  if (!pt) return pt;
  const savedPred = getPatientStoredData(pt, 'multimodal');

  if (savedPred) {
    const riskPct = savedPred.riskPercentage ?? pt.riskScore;
    const diag = savedPred.diagnosis || pt.stage;
    const cat = savedPred.riskCategory || (riskPct !== null ? (riskPct > 50 ? 'High Risk' : 'Moderate Risk') : 'Pending Evaluation');

    return {
      ...pt,
      stage: diag,
      riskScore: riskPct,
      riskCategory: cat,
      aiConfidence: riskPct !== null ? `${riskPct}%` : null,
      lastAssessment: savedPred.assessmentDate || pt.lastAssessment || new Date().toISOString().split('T')[0],
      cognitive: {
        ...pt.cognitive,
        mmseScore: savedPred.mmseScore ?? pt.cognitive?.mmseScore,
        mocaScore: savedPred.mocaScore ?? pt.cognitive?.mocaScore
      },
      mriStatus: savedPred.mriFileName ? `ResNet50 MRI Volumetric Scan Processed (${savedPred.mriFileName})` : pt.mriStatus,
      eegStatus: savedPred.eegFileName ? `2-Layer LSTM EEG Spectrum Complete (${savedPred.eegFileName})` : pt.eegStatus
    };
  }

  return pt;
};

// Patient API Helper Methods (Integration ready for backend http://localhost:8000)
export const patientApi = {
  // Get all patients directly from MySQL backend
  getPatients: async () => {
    try {
      const response = await axiosInstance.get('/api/v1/patients');
      const rawData = response.data || response;
      if (Array.isArray(rawData)) {
        const backendPatients = rawData.map((pt) => formatBackendPatient(pt)).filter(Boolean);
        return backendPatients.map((p) => enrichPatientWithMultimodalData(p));
      }
    } catch (error) {
      console.error('Error fetching patients from MySQL backend:', error);
    }

    const customPatients = getStoredCustomPatients();
    return customPatients.map((p) => enrichPatientWithMultimodalData(p));
  },

  // Get single patient details by ID directly from MySQL
  getPatientById: async (patientId) => {
    try {
      const numericId = !isNaN(parseInt(patientId)) ? parseInt(patientId) : (String(patientId).startsWith('NF-') ? parseInt(patientId.replace('NF-', '')) : patientId);
      const response = await axiosInstance.get(`/api/v1/patients/${numericId}`);
      const raw = response.data || response;
      if (raw && raw.name) {
        const formatted = formatBackendPatient(raw);
        return enrichPatientWithMultimodalData(formatted);
      }
    } catch (error) {
      console.warn(`Patient lookup for ${patientId}:`, error);
    }

    const all = await patientApi.getPatients();
    const found = all.find((p) => String(p.id).toLowerCase() === String(patientId).toLowerCase() || String(p.db_id) === String(patientId));
    return found ? enrichPatientWithMultimodalData(found) : null;
  },

  // Create / Register new patient directly into MySQL
  createPatient: async (patientData) => {
    const payload = {
      name: patientData.name,
      age: parseInt(patientData.age, 10) || 30,
      gender: patientData.gender || 'Female',
      dob: patientData.dob || '',
      phone: patientData.phone || '',
      address: patientData.address || '',
      medical_history: patientData.medicalHistory || '',
      primary_doctor: patientData.primaryDoctor || patientData.primary_doctor || 'Dr. Sunita Sharma'
    };

    const response = await axiosInstance.post('/api/v1/patients', payload);
    const raw = response.data || response;
    const formattedNewPt = formatBackendPatient(raw);

    // Also cache locally for immediate UI reactivity
    saveCustomPatientToStorage(formattedNewPt);
    return formattedNewPt;
  },

  // Update existing patient in MySQL
  updatePatient: async (patientId, updatedData) => {
    try {
      const numericId = !isNaN(parseInt(patientId)) ? parseInt(patientId) : (String(patientId).startsWith('NF-') ? parseInt(patientId.replace('NF-', '')) : patientId);
      await axiosInstance.put(`/api/v1/patients/${numericId}`, updatedData);
    } catch (error) {
      console.warn(`Backend API /api/patients/${patientId} PUT unavailable:`, error);
    }

    const custom = getStoredCustomPatients();
    const index = custom.findIndex((p) => String(p.id).toLowerCase() === String(patientId).toLowerCase());
    if (index !== -1) {
      custom[index] = { ...custom[index], ...updatedData };
      localStorage.setItem(CUSTOM_PATIENTS_KEY, JSON.stringify(custom));
      return custom[index];
    }
    return updatedData;
  },

  // Delete patient from MySQL
  deletePatient: async (patientId, patientName = null) => {
    const ptStr = String(patientId || '').toLowerCase();
    const cleanNum = String(patientId || '').replace(/[^0-9]/g, '');
    const numericId = cleanNum ? parseInt(cleanNum, 10) : null;

    const candidateIds = [numericId];
    if (numericId && numericId >= 1000) {
      candidateIds.push(numericId - 1000);
    }

    for (const idToTry of candidateIds) {
      if (idToTry) {
        try {
          await axiosInstance.delete(`/api/v1/patients/${idToTry}`);
          break;
        } catch (error) {
          // If 404, try next candidate
        }
      }
    }

    try {
      const custom = getStoredCustomPatients();
      const filtered = custom.filter((p) => {
        if (!p) return false;
        const pId = String(p.id || '').toLowerCase();
        const pDbId = String(p.db_id || '').toLowerCase();
        if (pId === ptStr || pDbId === ptStr) return false;
        if (numericId && (pDbId === String(numericId) || pId === `nf-${numericId}` || pId.replace(/[^0-9]/g, '') === String(numericId))) return false;
        if (numericId && numericId >= 1000 && pDbId === String(numericId - 1000)) return false;
        return true;
      });
      localStorage.setItem(CUSTOM_PATIENTS_KEY, JSON.stringify(filtered));

      // Clean up patient specific localStorage data
      const storageKeys = [
        `neurofusion_mri_${patientId}`,
        `neurofusion_eeg_${patientId}`,
        `neurofusion_multimodal_${patientId}`,
        numericId ? `neurofusion_mri_${numericId}` : null,
        numericId ? `neurofusion_eeg_${numericId}` : null,
        numericId ? `neurofusion_multimodal_${numericId}` : null,
        numericId && numericId >= 1000 ? `neurofusion_mri_${numericId - 1000}` : null,
        numericId && numericId >= 1000 ? `neurofusion_eeg_${numericId - 1000}` : null,
        numericId && numericId >= 1000 ? `neurofusion_multimodal_${numericId - 1000}` : null
      ].filter(Boolean);

      storageKeys.forEach(k => {
        try { localStorage.removeItem(k); } catch (e) {}
      });
    } catch (e) {
      console.error('Error updating localStorage on delete:', e);
    }

    return { success: true, message: `Patient ${patientId} removed.` };
  },

  // Synchronize multimodal fusion prediction result to patient record
  updatePatientRisk: (patientId, predObj) => {
    try {
      const custom = getStoredCustomPatients();
      const targetId = String(patientId || '').toLowerCase();
      const targetName = String(predObj.patientName || '').toLowerCase().trim();

      const updatedCustom = custom.map((p) => {
        const pId = String(p.id || '').toLowerCase();
        const pDbId = String(p.db_id || '').toLowerCase();
        const pName = String(p.name || '').toLowerCase().trim();

        if (pId === targetId || pDbId === targetId || (targetName && pName === targetName)) {
          return {
            ...p,
            stage: predObj.diagnosis || p.stage,
            riskScore: predObj.riskPercentage ?? p.riskScore,
            riskCategory: predObj.riskCategory || p.riskCategory,
            aiConfidence: `${predObj.riskPercentage}%`,
            lastAssessment: predObj.assessmentDate || new Date().toISOString().split('T')[0],
            cognitive: {
              ...p.cognitive,
              mmseScore: predObj.mmseScore ?? p.cognitive?.mmseScore,
              mocaScore: predObj.mocaScore ?? p.cognitive?.mocaScore
            }
          };
        }
        return p;
      });

      localStorage.setItem(CUSTOM_PATIENTS_KEY, JSON.stringify(updatedCustom));

      // Store multimodal prediction under key variants for instantaneous lookup
      if (patientId) localStorage.setItem(`neurofusion_multimodal_${patientId}`, JSON.stringify(predObj));
      if (targetName) localStorage.setItem(`neurofusion_multimodal_${targetName}`, JSON.stringify(predObj));
      localStorage.setItem('neurofusion_latest_prediction', JSON.stringify(predObj));
    } catch (e) {
      console.error('Failed to update patient risk in store:', e);
    }
  },

  // Batch delete multiple patients (Admin only)
  batchDeletePatients: async (patientIds) => {
    try {
      const numericIds = patientIds.map(id => {
        if (typeof id === 'number') return id;
        const num = String(id).replace(/[^0-9]/g, '');
        return num ? parseInt(num, 10) : null;
      }).filter(Boolean);

      const response = await axiosInstance.post('/api/v1/patients/batch-delete', {
        patient_ids: numericIds
      });
      return response;
    } catch (err) {
      console.error('Error during batch delete patients:', err);
      throw err;
    }
  },

  // Batch assign doctor to selected patients
  batchAssignDoctor: async (patientIds, doctorName) => {
    try {
      const numericIds = patientIds.map(id => {
        if (typeof id === 'number') return id;
        const num = String(id).replace(/[^0-9]/g, '');
        return num ? parseInt(num, 10) : null;
      }).filter(Boolean);

      const response = await axiosInstance.post('/api/v1/patients/batch-assign-doctor', {
        patient_ids: numericIds,
        doctor_name: doctorName
      });

      // Update custom patients in localStorage as well
      const custom = getStoredCustomPatients();
      const updatedCustom = custom.map(p => {
        const matches = patientIds.some(pid => 
          String(p.id).toLowerCase() === String(pid).toLowerCase() || 
          String(p.db_id).toLowerCase() === String(pid).toLowerCase() ||
          String(p.id).replace(/[^0-9]/g, '') === String(pid).replace(/[^0-9]/g, '')
        );
        if (matches) {
          return { 
            ...p, 
            primaryDoctor: doctorName, 
            primary_doctor: doctorName, 
            assigned_doctor: doctorName, 
            doctor_name: doctorName 
          };
        }
        return p;
      });
      localStorage.setItem(CUSTOM_PATIENTS_KEY, JSON.stringify(updatedCustom));

      return response;
    } catch (err) {
      console.error('Error during batch assign doctor:', err);
      throw err;
    }
  }
};


