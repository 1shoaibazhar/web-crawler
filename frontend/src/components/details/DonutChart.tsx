import React from 'react';

interface DonutChartProps {
  data: Array<{
    label: string;
    value: number;
    color: string;
    percentage: number;
  }>;
  title: string;
  size?: number;
  className?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  title,
  size = 200,
  className = '',
}) => {
  const radius = size / 2 - 10;
  const strokeWidth = 20;
  
  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Generate SVG path for donut segments
  let currentAngle = -90; // Start from top
  
  const segments = data.map((item) => {
    const percentage = total > 0 ? item.value / total : 0;
    const angle = percentage * 360;
    const endAngle = currentAngle + angle;
    
    // Calculate SVG arc parameters
    const startRadians = (currentAngle * Math.PI) / 180;
    const endRadians = (endAngle * Math.PI) / 180;
    
    const x1 = radius + radius * Math.cos(startRadians);
    const y1 = radius + radius * Math.sin(startRadians);
    const x2 = radius + radius * Math.cos(endRadians);
    const y2 = radius + radius * Math.sin(endRadians);
    
    // Determine if arc is large (> 180 degrees)
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    // Create SVG path
    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
    ].join(' ');
    
    currentAngle = endAngle;
    
    return {
      ...item,
      pathData,
      angle,
      startAngle: currentAngle - angle,
    };
  });

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">{title}</h3>
      
      <div className="flex flex-col items-center">
        {/* SVG Donut Chart */}
        <div className="relative mb-4">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={radius}
              cy={radius}
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
            />
            
            {/* Chart segments */}
            {segments.map((segment, index) => (
              <path
                key={index}
                d={segment.pathData}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                className="transition-all duration-300 hover:stroke-opacity-80"
              />
            ))}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="w-full space-y-2">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-sm text-gray-600">{segment.label}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{segment.value}</div>
                <div className="text-xs text-gray-500">{segment.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 