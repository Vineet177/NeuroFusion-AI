import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  HeartPulse, 
  Moon, 
  Smile, 
  AlertCircle, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock,
  Sparkles
} from 'lucide-react';

const BehavioralInfo = () => {
  const { selectedPatient } = useOutletContext();
  const [newLog, setNewLog] = useState({ category: 'Sleep', note: '', severity: 'Mild' });
  const [logs, setLogs] = useState([
    { id: 1, date: '2026-07-22 22:30', category: 'Sleep Fragmentation', text: 'Woke up twice at 2:00 AM confused about time, wandered to kitchen before returning to bed.', severity: 'Moderate', caregiver: 'Priya Deshmukh' },
    { id: 2, date: '2026-07-21 14:15', category: 'Apathy / Mood', text: 'Showed lack of interest during afternoon family visit; reduced conversational initiation.', severity: 'Mild', caregiver: 'Priya Deshmukh' },
    { id: 3, date: '2026-07-19 18:00', category: 'Sundowning / Agitation', text: 'Mild restlessness around dusk (6 PM); calmed after quiet classical music and herbal tea.', severity: 'Mild', caregiver: 'Priya Deshmukh' }
  ]);

  const handleAddLog = (e) => {
    e.preventDefault();
    if (!newLog.note) return;
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      category: newLog.category,
      text: newLog.note,
      severity: newLog.severity,
      caregiver: 'Priya Deshmukh'
    };
    setLogs([entry, ...logs]);
    setNewLog({ category: 'Sleep', note: '', severity: 'Mild' });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-emerald-400" />
            Behavioral Observations & Caregiver Insights
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Daily Living Activities (ADL), Sleep Architecture, Agitation/Sundowning Logs, & Apathy Monitoring
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> ADL Score: 82% (Independent with assistance)
          </div>
        </div>
      </div>

      {/* Sleep & Behavioral Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Sleep Quality */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Moon className="w-4 h-4 text-purple-400" /> Sleep Architecture
            </span>
            <span className="text-[10px] text-purple-400 font-mono">REM 14%</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white">6.2 hrs</span>
            <p className="text-xs text-slate-400 mt-1">Average nightly sleep duration (2 awakenings/night)</p>
          </div>
        </div>

        {/* Agitation Index */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" /> Sundowning Frequency
            </span>
            <span className="text-[10px] text-amber-400 font-mono">1-2x / week</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-amber-400">Low - Mild</span>
            <p className="text-xs text-slate-400 mt-1">Occurs primarily between 5:30 PM - 7:00 PM</p>
          </div>
        </div>

        {/* Independence Index */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Smile className="w-4 h-4 text-emerald-400" /> Functional ADL Score
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">FAQ: 8 / 30</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-emerald-400">82%</span>
            <p className="text-xs text-slate-400 mt-1">Maintains independence in eating & grooming</p>
          </div>
        </div>

      </div>

      {/* Log Entry Form & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* New Caregiver Log Entry Form */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" /> Log Caregiver Observation
          </h2>

          <form onSubmit={handleAddLog} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Category</label>
              <select
                value={newLog.category}
                onChange={(e) => setNewLog({ ...newLog, category: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Sleep Fragmentation">Sleep Fragmentation / Night Wandering</option>
                <option value="Sundowning / Agitation">Sundowning / Agitation</option>
                <option value="Apathy / Mood">Apathy / Depressive Mood</option>
                <option value="Memory Disorientation">Memory Disorientation</option>
                <option value="ADL Difficulty">ADL Difficulty (Dressing, Meals)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Severity</label>
              <select
                value={newLog.severity}
                onChange={(e) => setNewLog({ ...newLog, severity: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Mild">Mild Observation</option>
                <option value="Moderate">Moderate Disruption</option>
                <option value="Severe">Severe Incident</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Observation Notes</label>
              <textarea
                rows="3"
                placeholder="Describe behavior, triggers, time of day, and how patient responded..."
                value={newLog.note}
                onChange={(e) => setNewLog({ ...newLog, note: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold transition flex items-center justify-center space-x-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Caregiver Log</span>
            </button>
          </form>
        </div>

        {/* Behavioral Activity Log Stream */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" /> Observation History Stream
            </span>
            <span className="text-[10px] text-slate-400">{logs.length} Entries</span>
          </h2>

          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    {log.category}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-500 font-mono">{log.date}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${log.severity === 'Moderate' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
                      {log.severity}
                    </span>
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed text-[11px]">{log.text}</p>
                <div className="text-[10px] text-slate-500">Logged by: {log.caregiver}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default BehavioralInfo;
