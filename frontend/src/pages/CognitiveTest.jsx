import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  FileSpreadsheet, 
  Brain, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  ArrowRight, 
  RotateCcw, 
  CheckSquare, 
  Award,
  Layers,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Upload,
  UserCheck
} from 'lucide-react';
import { assessmentApi } from '../api/assessmentApi';
import { useAuth } from '../hooks/useAuth';
import { getPatientStoredData, savePatientStoredData } from '../api/patientApi';

// Standard 30-Point MMSE Questionnaire Items grouped into 5 Domains
const MMSE_QUESTIONNAIRE = [
  {
    category: 'Orientation to Time & Place',
    maxPoints: 10,
    items: [
      { id: 'q1', text: 'What is the current Year? (1 point)', max: 1 },
      { id: 'q2', text: 'What is the current Season? (1 point)', max: 1 },
      { id: 'q3', text: 'What is the current Month? (1 point)', max: 1 },
      { id: 'q4', text: 'What is today\'s Date? (1 point)', max: 1 },
      { id: 'q5', text: 'What Day of the week is it? (1 point)', max: 1 },
      { id: 'q6', text: 'What Country are we in? (1 point)', max: 1 },
      { id: 'q7', text: 'What State/Province are we in? (1 point)', max: 1 },
      { id: 'q8', text: 'What City/Town are we in? (1 point)', max: 1 },
      { id: 'q9', text: 'What Hospital/Clinic building is this? (1 point)', max: 1 },
      { id: 'q10', text: 'What Floor/Room number are we on? (1 point)', max: 1 }
    ]
  },
  {
    category: 'Registration & Immediate Recall',
    maxPoints: 3,
    items: [
      { id: 'q11', text: 'Repeat word 1: "APPLE" (1 point)', max: 1 },
      { id: 'q12', text: 'Repeat word 2: "PENNY" (1 point)', max: 1 },
      { id: 'q13', text: 'Repeat word 3: "TABLE" (1 point)', max: 1 }
    ]
  },
  {
    category: 'Attention & Calculation (Serial 7s)',
    maxPoints: 5,
    items: [
      { id: 'q14', text: 'Count backward from 100 by 7s: 93 (1 point)', max: 1 },
      { id: 'q15', text: 'Count backward: 86 (1 point)', max: 1 },
      { id: 'q16', text: 'Count backward: 79 (1 point)', max: 1 },
      { id: 'q17', text: 'Count backward: 72 (1 point)', max: 1 },
      { id: 'q18', text: 'Count backward: 65 (1 point)', max: 1 }
    ]
  },
  {
    category: 'Delayed Short-Term Recall',
    maxPoints: 3,
    items: [
      { id: 'q19', text: 'Recall object 1: "APPLE" (1 point)', max: 1 },
      { id: 'q20', text: 'Recall object 2: "PENNY" (1 point)', max: 1 },
      { id: 'q21', text: 'Recall object 3: "TABLE" (1 point)', max: 1 }
    ]
  },
  {
    category: 'Language, Praxis & Visual Construction',
    maxPoints: 9,
    items: [
      { id: 'q22', text: 'Name a "Wristwatch" shown by doctor (1 point)', max: 1 },
      { id: 'q23', text: 'Name a "Pencil" shown by doctor (1 point)', max: 1 },
      { id: 'q24', text: 'Repeat phrase: "No ifs, ands, or buts" (1 point)', max: 1 },
      { id: 'q25', text: '3-Stage command: "Take paper in right hand" (1 point)', max: 1 },
      { id: 'q26', text: '3-Stage command: "Fold paper in half" (1 point)', max: 1 },
      { id: 'q27', text: '3-Stage command: "Put paper on floor" (1 point)', max: 1 },
      { id: 'q28', text: 'Read & obey written command: "CLOSE YOUR EYES" (1 point)', max: 1 },
      { id: 'q29', text: 'Write a complete grammatical sentence (1 point)', max: 1 },
      { id: 'q30', text: 'Copy intersecting pentagons drawing (1 point)', max: 1 }
    ]
  }
];

const CognitiveTest = () => {
  const { user } = useAuth();
  const isAdmin = String(user?.role || '').trim().toLowerCase() === 'admin';

  const { selectedPatient, setSelectedPatient } = useOutletContext();
  const navigate = useNavigate();

  const activePt = selectedPatient || null;
  const ptId = activePt?.id || 'active';
  
  const storedCog = getPatientStoredData(activePt, 'cognitive') || getPatientStoredData({ id: ptId }, 'cognitive');

  // Mode state: Admin is ALWAYS 'manual'. Doctor defaults to 'interactive' (Oral test) or 'view'.
  const [assessmentMode, setAssessmentMode] = useState(isAdmin ? 'manual' : 'interactive');

  // Manual Score State initialized WITHOUT fake defaults
  const [manualMmse, setManualMmse] = useState(storedCog?.mmseScore ?? selectedPatient?.cognitive?.mmseScore ?? '');
  const [manualMoca, setManualMoca] = useState(storedCog?.mocaScore ?? selectedPatient?.cognitive?.mocaScore ?? '');
  const [manualNotes, setManualNotes] = useState(storedCog?.notes ?? '');

  // Interactive Test State (item id -> true/false)
  const [answers, setAnswers] = useState(() => {
    const initial = {};
    MMSE_QUESTIONNAIRE.forEach(category => {
      category.items.forEach((item) => {
        initial[item.id] = false;
      });
    });
    return initial;
  });

  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Calculate live score out of 30 for interactive test
  const calculateTotalScore = () => {
    return Object.values(answers).reduce((acc, curr) => (curr ? acc + 1 : acc), 0);
  };

  const currentInteractiveScore = calculateTotalScore();

  // Determine severity tier
  const getSeverity = (score) => {
    if (score >= 25) return { label: 'Cognitively Normal', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (score >= 20) return { label: 'Mild Cognitive Impairment (MCI)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    if (score >= 10) return { label: 'Moderate Cognitive Decline', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    return { label: 'Severe Cognitive Impairment', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
  };

  const handleToggleAnswer = (itemId) => {
    setAnswers(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleSelectAll = (category, value) => {
    const updated = { ...answers };
    category.items.forEach(item => {
      updated[item.id] = value;
    });
    setAnswers(updated);
  };

  const resetAll = () => {
    const cleared = {};
    MMSE_QUESTIONNAIRE.forEach(cat => {
      cat.items.forEach(item => {
        cleared[item.id] = false;
      });
    });
    setAnswers(cleared);
  };

  // Submit & Save Manual or Interactive Cognitive Assessment Score
  const handleSaveAndFuse = async (isManual = true) => {
    setIsEvaluating(true);
    const mmseScore = isManual ? (Number(manualMmse) || 0) : currentInteractiveScore;
    const mocaScore = isManual ? (Number(manualMoca) || 0) : Math.max(0, currentInteractiveScore - 3);

    // Dynamic calculation based on new scores
    let diag = "Healthy Control";
    let risk = 15;
    let category = "Low Risk";

    if (mmseScore <= 21 || mocaScore <= 16) {
      diag = "Alzheimer's Disease";
      risk = 74;
      category = "High Risk";
    } else if (mmseScore < 26 || mocaScore < 24) {
      diag = "Mild Cognitive Impairment (MCI)";
      risk = 49;
      category = "Moderate Risk";
    }

    // Retrieve existing stored multimodal object or construct fresh
    let existingObj = {};
    try {
      const raw = localStorage.getItem(`neurofusion_multimodal_${ptId}`) || localStorage.getItem('neurofusion_latest_prediction');
      if (raw) existingObj = JSON.parse(raw);
    } catch(e) {}

    const updatedPred = {
      ...existingObj,
      patientId: selectedPatient?.id || existingObj.patientId || ptId,
      patientName: selectedPatient?.name || existingObj.patientName || 'Patient',
      assessmentDate: new Date().toISOString().split('T')[0],
      diagnosis: diag,
      riskCategory: category,
      riskPercentage: risk,
      mmseScore,
      mocaScore,
      mriFileName: existingObj.mriFileName || '',
      eegFileName: existingObj.eegFileName || ''
    };

    // Save to patient state & localStorage
    if (setSelectedPatient && selectedPatient) {
      setSelectedPatient(prev => ({
        ...prev,
        stage: diag,
        riskScore: risk,
        riskCategory: category,
        cognitive: {
          mmseScore,
          mocaScore,
          notes: isManual ? manualNotes : 'Interactive MMSE test completed.'
        }
      }));
    }

    try {
      savePatientStoredData(activePt || { id: ptId }, 'multimodal', updatedPred);
      savePatientStoredData(activePt || { id: ptId }, 'cognitive', {
        mmseScore,
        mocaScore,
        notes: isManual ? manualNotes : 'Interactive MMSE test completed.',
        assessmentDate: new Date().toISOString().split('T')[0]
      });
      localStorage.setItem('neurofusion_latest_prediction', JSON.stringify(updatedPred));

      setTimeout(() => {
        setIsEvaluating(false);
        navigate('/prediction-result');
      }, 400);

    } catch (err) {
      console.error('Error saving score:', err);
      setIsEvaluating(false);
      navigate('/prediction-result');
    }
  };

  const currentCategory = MMSE_QUESTIONNAIRE[activeCategoryIndex];
  const activeScore = assessmentMode === 'manual' ? (Number(manualMmse) || 0) : currentInteractiveScore;
  const activeSeverity = getSeverity(activeScore);
  const hasUploadedScores = storedCog && (storedCog.mmseScore !== undefined && storedCog.mmseScore !== null);

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-[#7C3AED]" />
            <span>{isAdmin ? 'Cognitive Score Intake (Admin)' : 'Clinical Cognitive Assessment & Oral Test (Doctor)'}</span>
          </h1>
        </div>

        {selectedPatient && (
          <div className="px-4 py-2 rounded-2xl liquid-glass-card flex items-center space-x-3 text-xs shadow-xs">
            <span className="text-[#6B6875] dark:text-slate-400 font-medium">Target Patient:</span>
            <span className="font-bold text-[#7C3AED] dark:text-[#A78BFA]">{selectedPatient.name} ({selectedPatient.id})</span>
          </div>
        )}
      </div>

      {/* Patient Stored Score Card (Doctor & Admin) */}
      <div className="liquid-glass-card p-5 rounded-3xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-[#7C3AED] dark:text-[#A78BFA]">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#6B6875] block">Uploaded Cognitive Scores for {selectedPatient?.name || 'Patient'}</span>
            <div className="flex items-center space-x-4 mt-0.5 font-bold text-[#171321] dark:text-[#F7F7F5]">
              <span>MMSE Score: <strong className="text-[#7C3AED] dark:text-[#A78BFA] font-mono text-sm">{hasUploadedScores ? `${storedCog.mmseScore} / 30` : 'Not Available'}</strong></span>
              <span>•</span>
              <span>MoCA Score: <strong className="text-[#A78BFA] font-mono text-sm">{hasUploadedScores && storedCog.mocaScore !== undefined ? `${storedCog.mocaScore} / 30` : 'Not Available'}</strong></span>
            </div>
          </div>
        </div>

        {!isAdmin && (
          <div className="flex rounded-xl bg-purple-500/5 dark:bg-white/5 p-1 border border-purple-200/40 dark:border-purple-900/40">
            <button
              onClick={() => setAssessmentMode('interactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                assessmentMode === 'interactive' ? 'glass-btn-primary shadow-xs' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Interactive Oral Test
            </button>
            <button
              onClick={() => setAssessmentMode('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                assessmentMode === 'manual' ? 'glass-btn-primary shadow-xs' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              View / Edit Scores
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: MANUAL SCORE ENTRY */}
      {assessmentMode === 'manual' && (
        <div className="liquid-glass-card p-8 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-6 max-w-3xl mx-auto shadow-xl">
          <div className="border-b border-purple-200/40 dark:border-purple-900/40 pb-4">
            <h2 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-500" />
              Clinical Cognitive Score Entry
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* MMSE Score */}
            <div className="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-2 shadow-xs">
              <label className="font-bold text-[#171321] dark:text-[#F7F7F5] block text-sm">
                Mini-Mental State Exam (MMSE) Score (0 - 30)
              </label>
              <p className="text-[11px] text-[#6B6875] dark:text-slate-400">
                Standard cutoffs: 25-30 Normal, 20-24 Mild Impairment, 10-19 Moderate Decline, &lt;10 Severe
              </p>
              <input
                type="number"
                min="0"
                max="30"
                value={manualMmse}
                onChange={(e) => setManualMmse(Math.min(30, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 font-mono text-base font-extrabold focus:border-amber-500 outline-none mt-2"
              />
            </div>

            {/* MoCA Score */}
            <div className="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 space-y-2 shadow-xs">
              <label className="font-bold text-[#171321] dark:text-[#F7F7F5] block text-sm">
                Montreal Cognitive Assessment (MoCA) Score (0 - 30)
              </label>
              <p className="text-[11px] text-[#6B6875] dark:text-slate-400">
                Standard cutoffs: 26-30 Normal, 18-25 Mild Deficit, &lt;18 Executive Dysfunction
              </p>
              <input
                type="number"
                min="0"
                max="30"
                value={manualMoca}
                onChange={(e) => setManualMoca(Math.min(30, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-purple-300 dark:border-purple-700 text-[#7C3AED] dark:text-[#A78BFA] font-mono text-base font-extrabold focus:border-[#7C3AED] outline-none mt-2"
              />
            </div>
          </div>

          {/* Clinical Notes */}
          <div className="space-y-2 text-xs">
            <label className="font-bold text-[#171321] dark:text-[#F7F7F5] block">
              Clinical Assessment Summary & Doctor Notes
            </label>
            <textarea
              rows={3}
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-purple-200/50 dark:border-purple-900/40 text-[#171321] dark:text-[#F7F7F5] text-xs focus:border-[#7C3AED] outline-none resize-none"
              placeholder="Enter clinical observations, behavioral indicators, or family observations..."
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => handleSaveAndFuse(true)}
              disabled={isEvaluating}
              className="w-full py-3.5 rounded-xl glass-btn-primary text-white font-extrabold text-xs transition shadow-md shadow-purple-500/25 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Save Scores & Proceed to AI Fusion Model</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE MMSE QUESTIONNAIRE */}
      {assessmentMode === 'interactive' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Domain Category Selector Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            <div className="liquid-glass-card p-4 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-2 shadow-xl">
              <div className="px-3 py-2 text-[10px] font-bold text-[#6B6875] dark:text-slate-400 uppercase tracking-wider">
                MMSE Test Domains
              </div>

              {MMSE_QUESTIONNAIRE.map((cat, idx) => {
                const isActive = idx === activeCategoryIndex;
                const catItemIds = cat.items.map(i => i.id);
                const scoreInCat = catItemIds.reduce((acc, id) => (answers[id] ? acc + 1 : acc), 0);

                return (
                  <button
                    key={idx}
                    onClick={() => setActiveCategoryIndex(idx)}
                    className={`w-full p-3.5 rounded-2xl text-left transition flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-purple-500/20 border border-purple-400 text-[#171321] dark:text-[#F7F7F5]'
                        : 'bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 border border-purple-200/40 dark:border-purple-900/30 text-[#6B6875] dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-[#171321] dark:text-[#F7F7F5]">{cat.category}</p>
                      <p className="text-[10px] text-[#6B6875] dark:text-slate-400 font-mono mt-0.5">
                        Domain Score: <strong className="text-[#7C3AED] dark:text-[#A78BFA]">{scoreInCat} / {cat.maxPoints}</strong>
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isActive ? 'text-[#7C3AED]' : 'text-slate-400'}`} />
                  </button>
                );
              })}

              <div className="pt-2 border-t border-purple-200/40 dark:border-purple-900/40 flex justify-between">
                <button
                  onClick={() => handleSelectAll(currentCategory, true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/20 border border-emerald-500/30 cursor-pointer"
                >
                  Select All Correct
                </button>
                <button
                  onClick={resetAll}
                  className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold hover:bg-red-500/20 border border-red-500/30 cursor-pointer"
                >
                  Reset All
                </button>
              </div>
            </div>
          </div>

          {/* Active Domain Questionnaire List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="liquid-glass-card p-6 rounded-3xl border border-purple-200/40 dark:border-purple-900/40 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-purple-200/40 dark:border-purple-900/40 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#171321] dark:text-[#F7F7F5] flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-[#7C3AED]" />
                    {currentCategory.category}
                  </h3>
                  <p className="text-xs text-[#6B6875] dark:text-slate-400 mt-0.5">Mark each question item as correct (1 point) or incorrect (0 points)</p>
                </div>
                <span className="text-xs font-mono font-bold text-[#7C3AED] dark:text-[#A78BFA] px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-200/50 dark:border-purple-800/50">
                  Max Domain Points: {currentCategory.maxPoints}
                </span>
              </div>

              <div className="space-y-3">
                {currentCategory.items.map((item) => {
                  const isChecked = answers[item.id] || false;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleAnswer(item.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'bg-purple-500/15 border-purple-400 text-[#171321] dark:text-[#F7F7F5]'
                          : 'bg-white/40 dark:bg-slate-900/40 border-purple-200/40 dark:border-purple-900/30 text-[#6B6875] dark:text-slate-300 hover:bg-white/60'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                          isChecked ? 'bg-[#7C3AED] text-white font-bold' : 'border border-purple-200/60 dark:border-purple-900/60 bg-white/60 dark:bg-slate-900/60'
                        }`}>
                          {isChecked && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <span className="text-xs font-semibold text-[#171321] dark:text-[#F7F7F5]">{item.text}</span>
                      </div>

                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                        isChecked ? 'bg-blue-100 text-[#2563EB] border border-blue-300' : 'bg-[#F8FAFC] text-slate-400'
                      }`}>
                        {isChecked ? '+1 Pt' : '0 Pts'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Category Footer Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                <button
                  disabled={activeCategoryIndex === 0}
                  onClick={() => setActiveCategoryIndex(prev => prev - 1)}
                  className="px-4 py-2 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-bold text-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  Previous Domain
                </button>

                {activeCategoryIndex < MMSE_QUESTIONNAIRE.length - 1 ? (
                  <button
                    onClick={() => setActiveCategoryIndex(prev => prev + 1)}
                    className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Next Domain</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSaveAndFuse(false)}
                    disabled={isEvaluating}
                    className="px-5 py-2.5 rounded-lg bg-[#2563EB] text-white text-xs font-extrabold transition shadow-xs flex items-center space-x-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Complete & Run Fusion</span>
                  </button>
                )}
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default CognitiveTest;
