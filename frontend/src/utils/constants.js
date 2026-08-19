export const APP_CONFIG = {
  name: 'NeuroFusion AI',
  version: '3.4.0',
  description: 'Multimodal Dementia Diagnosis & Cognitive Health Intelligence',
  aiEngine: 'NeuroFusion-Transformer-v4'
};

export const PATIENT_STAGES = {
  NORMAL: { label: 'Cognitively Normal', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', riskScore: '0 - 20%' },
  MCI: { label: 'Mild Cognitive Impairment (MCI)', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', riskScore: '21 - 50%' },
  MILD_DEMENTIA: { label: 'Mild Dementia', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30', riskScore: '51 - 75%' },
  MODERATE_DEMENTIA: { label: 'Moderate Dementia', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', riskScore: '76 - 90%' },
  SEVERE_DEMENTIA: { label: 'Severe Dementia', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', riskScore: '91 - 100%' }
};

export const MOCK_PATIENTS = [];

