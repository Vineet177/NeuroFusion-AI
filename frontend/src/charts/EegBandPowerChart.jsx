import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const defaultBandData = [
  { wave: 'Delta (0.5-4Hz)', power: 34.0, normal: 20 },
  { wave: 'Theta (4-8Hz)', power: 48.0, normal: 22 },
  { wave: 'Alpha (8-13Hz)', power: 18.0, normal: 42 },
  { wave: 'Beta (13-30Hz)', power: 10.0, normal: 25 },
  { wave: 'Gamma (30-45Hz)', power: 4.0, normal: 11 }
];

const EegBandPowerChart = ({ data, psdSpectrum }) => {
  // Process dynamic frequency analysis if passed from backend EEG prediction
  let chartData = defaultBandData;

  if (psdSpectrum && Array.isArray(psdSpectrum) && psdSpectrum.length > 0) {
    chartData = psdSpectrum.map((pt) => ({
      wave: `${pt.frequency} Hz (${pt.band})`,
      power: pt.psd,
      frequency: pt.frequency
    }));
  } else if (data && typeof data === 'object') {
    const bands = data.frequency_bands || data;
    if (bands && bands.Delta) {
      chartData = [
        { wave: 'Delta (0.5-4Hz)', power: bands.Delta?.relative_power ?? 34.0, normal: 20 },
        { wave: 'Theta (4-8Hz)', power: bands.Theta?.relative_power ?? 48.0, normal: 22 },
        { wave: 'Alpha (8-13Hz)', power: bands.Alpha?.relative_power ?? 18.0, normal: 42 },
        { wave: 'Beta (13-30Hz)', power: bands.Beta?.relative_power ?? 10.0, normal: 25 },
        { wave: 'Gamma (30-45Hz)', power: bands.Gamma?.relative_power ?? 4.0, normal: 11 }
      ];
    }
  }

  const isPSDMode = psdSpectrum && Array.isArray(psdSpectrum) && psdSpectrum.length > 0;

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="eegColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.02}/>
            </linearGradient>
            <linearGradient id="normColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="wave" stroke="#64748B" tick={{ fontSize: 10 }} interval={isPSDMode ? 4 : 0} />
          <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            itemStyle={{ color: '#0F172A' }}
          />
          <Area 
            type="monotone" 
            dataKey="power" 
            name={isPSDMode ? "Welch PSD (uV^2/Hz)" : "Patient Spectral Power %"} 
            stroke="#7C3AED" 
            strokeWidth={2} 
            fillOpacity={1} 
            fill="url(#eegColor)" 
          />
          {!isPSDMode && (
            <Area type="monotone" dataKey="normal" name="Normal Reference %" stroke="#2563EB" strokeWidth={1.5} fillOpacity={1} fill="url(#normColor)" />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EegBandPowerChart;
