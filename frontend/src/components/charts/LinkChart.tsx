import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface LinkChartProps {
  data: {
    internal: number;
    external: number;
    broken: number;
  };
  className?: string;
}

export const LinkChart: React.FC<LinkChartProps> = ({ data, className = '' }) => {
  const chartData = [
    { name: 'Internal Links', value: data.internal, color: '#10b981' },
    { name: 'External Links', value: data.external, color: '#3b82f6' },
    { name: 'Broken Links', value: data.broken, color: '#ef4444' },
  ];

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Links Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LinkChart; 