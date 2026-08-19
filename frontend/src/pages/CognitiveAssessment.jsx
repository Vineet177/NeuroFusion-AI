import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  FileSpreadsheet, 
  Brain, 
  Calendar, 
  TrendingDown, 
  CheckCircle, 
  AlertCircle, 
  Award,
  Sparkles
} from 'lucide-react';
import CognitiveRadarChart from '../charts/CognitiveRadarChart';

const CognitiveAssessment = () => {
  const { selectedPatient } = useOutletContext();

  const domainDetails = [
    { domain: 'Orientation (Time & Place)', score: 7, max: 10, status: 'Mild Deficit', color: 'text-amber-400' },
    { domain: 'Immediate Registration', score: 3, max: 3, status: 'Intact', color: 'text-emerald-400' },
    { domain: 'Attention & Calculation', score: 3, max: 5, status: 'Impaired (Serial 7s)', color: 'text-amber-400' },
    { domain: 'Delayed Recall (5 Words)', score: 1, max: 5, status: 'Severe Memory Loss', color: 'text-rose-400' },
    { domain: 'Language & Object Naming', score: 7, max: 8, status: 'Mild Anomia', color: 'text-emerald-400' },
    { domain: 'Visuospatial (Clock Drawing)', score: 3, max: 5, status: 'Executive Impairment', color: 'text-amber-400' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-400" />
            Cognitive Assessment Scores & Battery Tests
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Standardized MMSE (Mini-Mental) & MoCA Evaluation across 6 Functional Neuropsychological Domains
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs transition flex items-center space-x-1.5 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            <Brain className="w-4 h-4" />
            <span>Administer New MoCA Test</span>
          </button>
        </div>
      </div>

      {/* Main Score Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* MMSE Card */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">MMSE Score</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">Mild Impairment</span>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-4xl font-extrabold text-white">24</span>
              <span className="text-sm text-slate-400 font-bold">/ 30</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Cut-off &lt; 24 indicates clinical cognitive impairment.</p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Last Administered: 2026-07-20</span>
            <span className="text-rose-400 font-semibold">-2 pts vs 2025</span>
          </div>
        </div>

        {/* MoCA Card */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">MoCA (Montreal Battery)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">Executive Deficit</span>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-4xl font-extrabold text-amber-400">21</span>
              <span className="text-sm text-slate-400 font-bold">/ 30</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Normal baseline: &ge; 26 points.</p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Clock Drawing Score: 3/5</span>
            <span className="text-amber-400 font-semibold">MCI Pattern</span>
          </div>
        </div>

        {/* AI Cognitive Decline Index */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between bg-amber-950/10 border-amber-500/30">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> AI Domain Fragility Index
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-amber-300">Delayed Recall</span>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Patient retained 1 out of 5 words after 5-minute filled delay. High sensitivity for hippocampal memory consolidation dysfunction.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-500/20 text-[11px] text-amber-300">
            Recommendation: Digital Memory Training Protocol
          </div>
        </div>

      </div>

      {/* Domain Breakdown Grid & Radar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Radar Domain Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
          <h2 className="text-sm font-bold text-slate-200 mb-3">Multidimensional Cognitive Profile</h2>
          <CognitiveRadarChart />
        </div>

        {/* Detailed Domain Scores List */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-3">
          <h2 className="text-sm font-bold text-slate-200 mb-3">Itemized Neuropsychological Scores</h2>
          <div className="space-y-2.5">
            {domainDetails.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-200">{item.domain}</p>
                  <p className="text-[10px] text-slate-400">Score: {item.score} / {item.max}</p>
                </div>
                <span className={`font-bold font-mono ${item.color}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default CognitiveAssessment;
