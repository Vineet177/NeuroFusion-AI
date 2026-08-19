import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Radio, 
  ShieldAlert,
  Sparkles,
  Sliders
} from 'lucide-react';
import EegBandPowerChart from '../charts/EegBandPowerChart';

const EegAnalysis = () => {
  const { selectedPatient } = useOutletContext();
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeChannel, setActiveChannel] = useState('T3-T5 (Left Temporal)');

  const eegChannels = [
    { name: 'Fp1-F7 (Frontal Left)', status: 'Normal Alpha', peak: '9.8 Hz', color: 'text-emerald-400' },
    { name: 'Fp2-F8 (Frontal Right)', status: 'Normal Alpha', peak: '10.1 Hz', color: 'text-emerald-400' },
    { name: 'T3-T5 (Left Temporal)', status: 'Slowing Detected', peak: '5.2 Hz (Theta)', color: 'text-rose-400' },
    { name: 'T4-T6 (Right Temporal)', status: 'Moderate Slowing', peak: '6.1 Hz (Theta)', color: 'text-amber-400' },
    { name: 'P3-O1 (Parieto-Occipital)', status: 'Alpha Peak Shift', peak: '7.9 Hz', color: 'text-amber-400' },
    { name: 'P4-O2 (Parieto-Occipital)', status: 'Alpha Peak Shift', peak: '8.1 Hz', color: 'text-emerald-400' }
  ];

  const spikeEvents = [
    { timestamp: '00:04:12', channel: 'T3-T5', event: 'Sharp Wave Transient', amplitude: '142 µV', risk: 'High' },
    { timestamp: '00:11:45', channel: 'F3-C3', event: 'Delta Burst', amplitude: '98 µV', risk: 'Medium' },
    { timestamp: '00:22:08', channel: 'T3-T5', event: 'Rhythmic Theta Discharges', amplitude: '175 µV', risk: 'High' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-purple-400" />
            EEG Signal Spectrum & Brainwave Oscillations
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time Power Spectral Density (PSD), Waveform Slowing, & Theta/Alpha Ratio (TAR) Index
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              isPlaying
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause Signal Stream' : 'Resume Live Feed'}</span>
          </button>
        </div>
      </div>

      {/* Main Signal Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Multi-Channel Waveform Monitor */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-200">10-20 System 8-Channel Lead Stream</span>
            </div>
            <span className="text-xs text-purple-400 font-mono">Sampling: 250 Hz | Filter: 0.5-45Hz Notch 50Hz</span>
          </div>

          {/* Oscilloscope Channels Container */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3 font-mono">
            {eegChannels.map((ch, idx) => (
              <div key={idx} className="flex items-center space-x-3 text-xs">
                <span className="w-36 text-[10px] text-slate-400 font-bold flex-shrink-0">{ch.name}</span>
                
                {/* SVG Animated Waveform Line */}
                <div className="flex-1 h-10 bg-slate-900/60 rounded border border-slate-800/50 overflow-hidden relative flex items-center">
                  <svg className="w-full h-full text-purple-400 opacity-90" viewBox="0 0 500 40">
                    <path
                      d={
                        isPlaying
                          ? `M0,20 Q25,${10 + idx * 3} 50,20 T100,20 T150,${5 + (idx % 2) * 25} T200,20 T250,35 T300,20 T350,10 T400,25 T450,20 T500,20`
                          : "M0,20 L500,20"
                      }
                      fill="none"
                      stroke={idx === 2 ? '#f43f5e' : '#c084fc'}
                      strokeWidth={idx === 2 ? '2' : '1.5'}
                    />
                  </svg>

                  {/* Channel Tag */}
                  <span className={`absolute right-2 text-[9px] font-bold ${ch.color}`}>
                    {ch.peak}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick EEG Metrics Footer */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase">Theta/Alpha Ratio (TAR)</p>
              <p className="text-lg font-bold text-rose-400 mt-0.5">2.67 <span className="text-[10px] text-slate-500">(High &gt; 1.5)</span></p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase">Peak Alpha Frequency</p>
              <p className="text-lg font-bold text-amber-400 mt-0.5">7.8 Hz <span className="text-[10px] text-slate-500">(Slowed)</span></p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase">Coherence Score</p>
              <p className="text-lg font-bold text-cyan-400 mt-0.5">0.62 <span className="text-[10px] text-slate-500">(Normal)</span></p>
            </div>
          </div>
        </div>

        {/* Band Power Breakdown & Anomaly Log */}
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
            <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Spectral Power Distribution
            </h2>
            <EegBandPowerChart />
          </div>

          {/* Spike Anomaly Events */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> AI Anomaly Detection
              </span>
              <span className="text-[10px] text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">3 Events</span>
            </h2>

            <div className="space-y-2">
              {spikeEvents.map((evt, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-200">{evt.event}</p>
                    <p className="text-[10px] text-slate-400">{evt.channel} • {evt.timestamp}</p>
                  </div>
                  <span className="font-mono text-rose-400 font-bold">{evt.amplitude}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default EegAnalysis;
