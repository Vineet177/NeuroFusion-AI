import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

const progressionData = [
  { month: 'Jan', newDiagnosed: 2, stable: 5, highRiskAlerts: 1 },
  { month: 'Feb', newDiagnosed: 3, stable: 6, highRiskAlerts: 1 },
  { month: 'Mar', newDiagnosed: 3, stable: 8, highRiskAlerts: 2 },
  { month: 'Apr', newDiagnosed: 4, stable: 7, highRiskAlerts: 2 },
  { month: 'May', newDiagnosed: 5, stable: 9, highRiskAlerts: 3 },
  { month: 'Jun', newDiagnosed: 4, stable: 10, highRiskAlerts: 3 }
];

const PatientProgressionChart = () => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={progressionData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="month" stroke="#64748B" tick={{ fontSize: 11 }} />
          <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            itemStyle={{ color: '#0F172A' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: '#64748B' }} />
          <Bar dataKey="stable" name="Stable / Normal Control" fill="#16A34A" radius={[4, 4, 0, 0]} />
          <Bar dataKey="newDiagnosed" name="Newly Flagged MCI" fill="#2563EB" radius={[4, 4, 0, 0]} />
          <Bar dataKey="highRiskAlerts" name="High Risk Progression" fill="#DC2626" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PatientProgressionChart;
