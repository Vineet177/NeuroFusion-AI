import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from 'recharts';

const data = [
  { region: 'Hippocampus L', patient: 2.85, norm: 3.40, unit: 'cm³' },
  { region: 'Hippocampus R', patient: 2.92, norm: 3.45, unit: 'cm³' },
  { region: 'Entorhinal Cortex', patient: 1.10, norm: 1.50, unit: 'cm³' },
  { region: 'Lateral Ventricle', patient: 28.4, norm: 18.2, unit: 'cm³' },
  { region: 'Temporal Lobe', patient: 42.1, norm: 48.0, unit: 'cm³' }
];

const MriVolumeChart = () => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="region" stroke="#64748B" tick={{ fontSize: 10 }} />
          <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            itemStyle={{ color: '#0F172A' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#64748B' }} />
          <Bar dataKey="patient" name="Patient Volume" fill="#2563EB" radius={[4, 4, 0, 0]} />
          <Bar dataKey="norm" name="Normative Control" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MriVolumeChart;
