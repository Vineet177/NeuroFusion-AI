import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

const trendData = [
  { month: 'Jan 2026', risk: 24, eegTheta: 2.1, mriVolumeLoss: 4.2 },
  { month: 'Feb 2026', risk: 28, eegTheta: 2.5, mriVolumeLoss: 4.5 },
  { month: 'Mar 2026', risk: 32, eegTheta: 3.1, mriVolumeLoss: 5.0 },
  { month: 'Apr 2026', risk: 35, eegTheta: 3.6, mriVolumeLoss: 5.8 },
  { month: 'May 2026', risk: 39, eegTheta: 4.2, mriVolumeLoss: 6.9 },
  { month: 'Jun 2026', risk: 42, eegTheta: 5.2, mriVolumeLoss: 8.1 }
];

const RiskTrendsChart = () => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="month" stroke="#94A3B8" tick={{ fontSize: 11 }} />
          <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} unit="%" />
          <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px', color: '#0F172A' }} />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#94A3B8' }} />
          <Line type="monotone" dataKey="risk" name="Dementia Risk Index %" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="mriVolumeLoss" name="Hippocampal Atrophy %" stroke="#3B82F6" strokeWidth={1.5} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RiskTrendsChart;
