import React from 'react';

interface ScoreGaugeProps {
  score: number;
  maxScore: number;
  size?: 'small' | 'medium' | 'large';
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ 
  score, 
  maxScore, 
  size = 'medium' 
}) => {
  const percentage = (score / maxScore) * 100;
  
  // Determine color based on percentage
  const getColor = () => {
    if (percentage >= 80) return '#22c55e'; // Green
    if (percentage >= 60) return '#84cc16'; // Light green
    if (percentage >= 40) return '#eab308'; // Yellow
    if (percentage >= 20) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };
  
  // Determine size dimensions
  const getDimensions = () => {
    switch (size) {
      case 'small':
        return { size: 80, strokeWidth: 6, fontSize: 'text-lg' };
      case 'large':
        return { size: 180, strokeWidth: 12, fontSize: 'text-4xl' };
      case 'medium':
      default:
        return { size: 120, strokeWidth: 8, fontSize: 'text-2xl' };
    }
  };
  
  const { size: gaugeSize, strokeWidth, fontSize } = getDimensions();
  
  // Calculate SVG parameters
  const radius = (gaugeSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: gaugeSize, height: gaugeSize }}>
        {/* Background circle */}
        <svg
          width={gaugeSize}
          height={gaugeSize}
          viewBox={`0 0 ${gaugeSize} ${gaugeSize}`}
          className="rotate-[-90deg]"
        >
          <circle
            cx={gaugeSize / 2}
            cy={gaugeSize / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          
          {/* Foreground circle */}
          <circle
            cx={gaugeSize / 2}
            cy={gaugeSize / 2}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${fontSize}`}>{score}</span>
        </div>
      </div>
      
      {/* Max score label */}
      <div className="mt-2 text-sm text-gray-500">
        out of {maxScore}
      </div>
    </div>
  );
};
