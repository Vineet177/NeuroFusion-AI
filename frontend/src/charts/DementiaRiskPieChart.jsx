import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Cognitively Normal', value: 450, color: '#16A34A' },
  { name: 'MCI Stage', value: 385, color: '#0284C7' },
  { name: 'Mild Dementia', value: 230, color: '#D97706' },
  { name: 'Moderate Dementia', value: 154, color: '#DC2626' },
  { name: 'Severe Dementia', value: 65, color: '#7C3AED' }
];

const DementiaRiskPieChart = () => {
  return (
    <div className="w-full h-72 relative flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="80%"
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            itemStyle={{ color: '#0F172A' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#64748B' }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center Stat HUD */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
        <span className="text-2xl font-bold text-[#0F172A]">1,284</span>
        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Total Evaluated</span>
      </div>
    </div>
  );
};

export default DementiaRiskPieChart;
