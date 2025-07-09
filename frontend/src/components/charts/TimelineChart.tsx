import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TimelineChartProps {
  data: Array<{
    date: string;
    crawls: number;
    completed: number;
    failed: number;
  }>;
  className?: string;
}

export const TimelineChart: React.FC<TimelineChartProps> = ({ data, className = '' }) => {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Crawl Activity Timeline</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="crawls" stroke="#3b82f6" strokeWidth={2} />
            <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} />
            <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TimelineChart; 