
import React from 'react';
import { Settings, AppState } from '../types';
import { Settings as SettingsIcon, Play, Pause, RotateCcw, Volume2, VolumeX, Eye, Timer, Coffee } from 'lucide-react';

interface DashboardProps {
  state: AppState;
  timeLeft: number;
  settings: Settings;
  updateSettings: (s: Partial<Settings>) => void;
  onToggle: () => void;
  onReset: () => void;
  onClose: () => void;
  currentTip: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  state,
  timeLeft,
  settings,
  updateSettings,
  onToggle,
  onReset,
  onClose,
  currentTip
}) => {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleWorkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mins = parseInt(e.target.value) || 1;
    updateSettings({ workDuration: mins * 60 });
  };

  const handleBreakChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const secs = parseInt(e.target.value) || 5;
    updateSettings({ breakDuration: secs });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-emerald-500 p-8 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
              <Eye size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Ocular Rest</h1>
          </div>

          <div className="flex flex-col items-center py-2">
            <div className="text-7xl font-mono font-bold mb-2 tabular-nums drop-shadow-lg">
              {formatTime(timeLeft)}
            </div>
            <div className="px-4 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-sm">
              {state === AppState.BREAK ? "✨ Resting ✨" : state === AppState.WORKING ? "Focusing" : "Paused"}
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
          {/* Gemini Tip Section */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 items-start shadow-sm">
            <div className="text-emerald-600 pt-0.5 flex-shrink-0">✨</div>
            <div className="text-sm text-emerald-900 leading-relaxed font-medium">
              {currentTip || "Taking breaks regularly keeps your vision sharp and your mind fresh."}
            </div>
          </div>

          {/* Configuration Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
              <SettingsIcon size={12} />
              Custom Intervals
            </div>
            
            {/* Work Duration Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Timer size={16} className="text-blue-500" /> Focus Time
                </label>
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {Math.round(settings.workDuration / 60)} min
                </span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="60" 
                step="1"
                value={Math.round(settings.workDuration / 60)}
                onChange={handleWorkChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Break Duration Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Coffee size={16} className="text-emerald-500" /> Rest Time
                </label>
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {settings.breakDuration} sec
                </span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="300" 
                step="5"
                value={settings.breakDuration}
                onChange={handleBreakChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex gap-4">
            <button
              onClick={onToggle}
              className={`
                flex-[2] flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all transform active:scale-95
                ${state === AppState.PAUSED 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
              `}
            >
              {state === AppState.PAUSED ? <Play size={22} fill="currentColor" /> : <Pause size={22} fill="currentColor" />}
              {state === AppState.PAUSED ? 'Start Session' : 'Pause'}
            </button>
            <button
              onClick={onReset}
              className="flex-1 flex items-center justify-center bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-2xl transition-all transform active:scale-95"
              title="Reset Timer"
            >
              <RotateCcw size={22} />
            </button>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
             <button
              onClick={() => updateSettings({ isMuted: !settings.isMuted })}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-xs font-bold uppercase tracking-wider
                ${settings.isMuted ? 'border-red-200 bg-red-50 text-red-600' : 'border-gray-200 bg-white text-gray-500'}
              `}
            >
              {settings.isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              {settings.isMuted ? 'Muted' : 'Sound On'}
            </button>

            <div className="text-[10px] text-gray-400 font-medium">
              Changes apply on next cycle
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
