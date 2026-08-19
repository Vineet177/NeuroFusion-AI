import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  BrainCircuit, 
  Layers, 
  Eye, 
  Sliders, 
  Download, 
  Sparkles, 
  Activity, 
  AlertTriangle,
  Info,
  RotateCcw
} from 'lucide-react';
import MriVolumeChart from '../charts/MriVolumeChart';

const MriAnalysis = () => {
  const { selectedPatient } = useOutletContext();
  const [viewPlane, setViewPlane] = useState('axial'); // axial, sagittal, coronal
  const [sliceIndex, setSliceIndex] = useState(94);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showSegmentation, setShowSegmentation] = useState(true);

  const regionMetrics = [
    { name: 'Left Hippocampus', volume: '2.85 cm³', norm: '3.40 cm³', deviation: '-16.2%', status: 'Severe Atrophy', color: 'text-rose-400' },
    { name: 'Right Hippocampus', volume: '2.92 cm³', norm: '3.45 cm³', deviation: '-15.3%', status: 'Moderate Atrophy', color: 'text-orange-400' },
    { name: 'Entorhinal Cortex', volume: '1.10 cm³', norm: '1.50 cm³', deviation: '-26.6%', status: 'Critical Shrinkage', color: 'text-rose-400' },
    { name: 'Lateral Ventricles', volume: '28.4 cm³', norm: '18.2 cm³', deviation: '+56.0%', status: 'Enlarged (Ex-Vacuo)', color: 'text-amber-400' },
    { name: 'Whole Brain Parenchyma', volume: '1040 cm³', norm: '1180 cm³', deviation: '-11.8%', status: 'Mild Global Loss', color: 'text-cyan-400' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-cyan-400" />
            3D Structural MRI Brain Scan Analysis
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Volumetric Segmentation & Automated Atrophy AI Heatmap Quantification
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center space-x-1.5 ${
              showHeatmap 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Heatmap {showHeatmap ? 'ON' : 'OFF'}</span>
          </button>
          
          <button className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-200 transition flex items-center space-x-1.5">
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export DICOM</span>
          </button>
        </div>
      </div>

      {/* Main MRI Viewer & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MRI Scan Screen Simulator */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          
          {/* Top Canvas Toolbar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">View Plane:</span>
              {['axial', 'sagittal', 'coronal'].map((plane) => (
                <button
                  key={plane}
                  onClick={() => setViewPlane(plane)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                    viewPlane === plane
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {plane}
                </button>
              ))}
            </div>

            <div className="text-xs text-cyan-400 font-mono">
              Patient: {selectedPatient.id} | Slice #{sliceIndex}/180
            </div>
          </div>

          {/* Interactive Brain Image Viewer Box */}
          <div className="relative my-4 aspect-video w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center group">
            
            {/* Background Medical MRI Brain Image */}
            <img
              src="https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=1000"
              alt="MRI Brain Scan"
              className="w-full h-full object-cover opacity-80 mix-blend-luminosity filter contrast-125"
            />

            {/* Simulated Heatmap Overlay layer */}
            {showHeatmap && (
              <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/30 via-amber-500/20 to-transparent mix-blend-color-dodge pointer-events-none animate-pulse" />
            )}

            {/* Simulated Bounding Box for Hippocampal Atrophy */}
            {showSegmentation && (
              <div className="absolute top-[35%] left-[42%] w-24 h-16 border-2 border-rose-500 bg-rose-500/10 rounded-lg flex flex-col justify-between p-1.5 shadow-[0_0_15px_rgba(244,63,94,0.6)]">
                <span className="text-[9px] font-bold text-rose-300 bg-slate-950/80 px-1 rounded">L Hippocampus</span>
                <span className="text-[9px] text-rose-400 font-mono text-right">-16.2%</span>
              </div>
            )}

            {/* Crosshair guidelines */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
              <div className="w-full h-[1px] bg-cyan-400" />
              <div className="h-full w-[1px] bg-cyan-400 absolute" />
            </div>

            {/* Floating Information HUD */}
            <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] text-slate-300 font-mono space-y-0.5">
              <p>T1-Weighted 3D MPRAGE</p>
              <p>FOV: 256x256mm | Voxel: 1.0mm³</p>
            </div>
          </div>

          {/* Bottom Slider Control Bar */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1"><Sliders className="w-3.5 h-3.5 text-cyan-400" /> Slice Depth Slider</span>
              <span className="font-mono text-slate-200">Slice {sliceIndex} of 180</span>
            </div>
            <input
              type="range"
              min="1"
              max="180"
              value={sliceIndex}
              onChange={(e) => setSliceIndex(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

        </div>

        {/* MRI Metrics & Volumetric Analysis */}
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
            <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Automated Volumetric Metrics
            </h2>

            <div className="space-y-3">
              {regionMetrics.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-medium text-slate-200">{r.name}</p>
                    <p className="text-[10px] text-slate-400">Vol: {r.volume} (Norm: {r.norm})</p>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold font-mono ${r.color}`}>{r.deviation}</span>
                    <p className="text-[9px] text-slate-400">{r.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Lesion Findings Alert Box */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 bg-rose-950/10 border-rose-500/30">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <h3 className="font-bold text-rose-300">Medial Temporal Lobe Atrophy (MTA Scale: 3)</h3>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Significant widening of the choroid fissure and enlargement of the temporal horn. High correlation with prodromal Alzheimer's disease.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Volumetric Breakdown Chart */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
        <h2 className="text-sm font-bold text-slate-200 mb-3">Regional Volumetric Loss vs Population Norms</h2>
        <MriVolumeChart />
      </div>

    </div>
  );
};

export default MriAnalysis;
