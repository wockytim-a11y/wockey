
import React from 'react';
import { AppState } from '../types';
import { WIDGET_SIZE_PX } from '../constants';

interface WidgetProps {
  state: AppState;
  progress: number; // 0 to 1
  onClick: () => void;
}

export const Widget: React.FC<WidgetProps> = ({ state, progress, onClick }) => {
  const isBreak = state === AppState.BREAK;
  
  // Calculate stroke dashoffset for the progress ring
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  return (
    <div 
      onClick={onClick}
      className={`
        fixed right-4 top-1/2 -translate-y-1/2 cursor-pointer z-50
        transition-all duration-300 transform hover:scale-110
        ${isBreak ? 'scale-125' : 'scale-100'}
      `}
      title={state === AppState.WORKING ? "Working - Click for dashboard" : "Resting! Look away!"}
    >
      <div className={`
        relative flex items-center justify-center
        rounded-full bg-white shadow-lg border border-gray-100
        w-8 h-8 md:w-10 md:h-10
      `}>
        {/* Progress Circle Background */}
        <svg className="absolute w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`transition-all duration-1000 ${isBreak ? 'text-green-500' : 'text-blue-500'}`}
          />
        </svg>

        {/* Center Indicator */}
        <div className={`
          rounded-full transition-all duration-500
          ${isBreak ? 'w-4 h-4 bg-green-500 animate-pulse-green' : 'w-2 h-2 bg-blue-500'}
          ${state === AppState.PAUSED ? 'bg-gray-400' : ''}
        `} />
      </div>
    </div>
  );
};
