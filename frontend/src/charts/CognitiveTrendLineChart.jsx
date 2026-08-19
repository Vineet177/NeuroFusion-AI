import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

const trendData = [
  { month: 'Jan', mmseAvg: 26.4, mocaAvg: 23.8, targetNorm: 28.0 },
  { month: 'Feb', mmseAvg: 25.8, mocaAvg: 23.1, targetNorm: 28.0 },
  { month: 'Mar', mmseAvg: 25.2, mocaAvg: 22.4, targetNorm: 28.0 },
  { month: 'Apr', mmseAvg: 24.7, mocaAvg: 21.9, targetNorm: 28.0 },
  { month: 'May', mmseAvg: 24.1, mocaAvg: 21.3, targetNorm: 28.0 },
  { month: 'Jun', mmseAvg: 23.5, mocaAvg: 20.6, targetNorm: 28.0 }
];

const CognitiveTrendLineChart = () => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="month" stroke="#64748B" tick={{ fontSize: 11 }} />
          <YAxis stroke="#64748B" tick={{ fontSize: 11 }} domain={[15, 30]} />
          <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#64748B' }} />
          <Line type="monotone" dataKey="mmseAvg" name="Mean MMSE Score" stroke="#0284C7" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="mocaAvg" name="Mean MoCA Score" stroke="#D97706" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="targetNorm" name="Normative Baseline (28)" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="4 4" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CognitiveTrendLineChart;
