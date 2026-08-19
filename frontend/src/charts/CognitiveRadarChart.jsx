import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';

const cognitiveData = [
  { domain: 'Episodic Memory', score: 54, baseline: 85 },
  { domain: 'Executive Function', score: 62, baseline: 88 },
  { domain: 'Visuospatial', score: 70, baseline: 90 },
  { domain: 'Language & Naming', score: 58, baseline: 86 },
  { domain: 'Attention & Working Mem', score: 65, baseline: 89 },
  { domain: 'Orientation', score: 48, baseline: 95 }
];

const CognitiveRadarChart = () => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={cognitiveData}>
          <PolarGrid stroke="#E2E8F0" />
          <PolarAngleAxis dataKey="domain" stroke="#64748B" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#CBD5E1" />
          <Radar name="Patient Score" dataKey="score" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} />
          <Radar name="Age Baseline" dataKey="baseline" stroke="#94A3B8" fill="#94A3B8" fillOpacity={0.10} />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#64748B' }} />
          <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CognitiveRadarChart;
