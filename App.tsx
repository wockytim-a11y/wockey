
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Widget } from './components/Widget';
import { Dashboard } from './components/Dashboard';
import { AppState, Settings } from './types';
import { DEFAULT_WORK_SECONDS, DEFAULT_BREAK_SECONDS } from './constants';
import { audioService } from './services/audioService';
import { fetchHealthTip } from './services/geminiService';
// Added Eye icon import from lucide-react to fix the reference error
import { Eye } from 'lucide-react';

const STORAGE_KEY = 'ocular_rest_settings';

const App: React.FC = () => {
  // Load settings from local storage or use defaults
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to parse saved settings", e);
      }
    }
    return {
      workDuration: DEFAULT_WORK_SECONDS,
      breakDuration: DEFAULT_BREAK_SECONDS,
      isMuted: false,
      showCoach: true
    };
  });

  const [appState, setAppState] = useState<AppState>(AppState.WORKING);
  const [timeLeft, setTimeLeft] = useState(settings.workDuration);
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentTip, setCurrentTip] = useState<string>("");

  const timerRef = useRef<number | null>(null);

  // Persist settings whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Handle initialization of notifications
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  const handleStateChange = useCallback(async (newState: AppState) => {
    setAppState(newState);
    
    if (newState === AppState.BREAK) {
      setTimeLeft(settings.breakDuration);
      if (!settings.isMuted) audioService.playBreakStart();
      
      const tip = await fetchHealthTip();
      setCurrentTip(tip);
      
      if (Notification.permission === "granted") {
        new Notification("Ocular Rest Time!", {
          body: `Look away from the screen for ${settings.breakDuration} seconds. ` + tip,
          icon: "https://cdn-icons-png.flaticon.com/512/3233/3233483.png"
        });
      }
    } else if (newState === AppState.WORKING) {
      setTimeLeft(settings.workDuration);
      if (!settings.isMuted) audioService.playBreakEnd();
      
      if (Notification.permission === "granted") {
        new Notification("Focus Session Started", {
          body: `Next rest in ${Math.round(settings.workDuration / 60)} minutes.`,
        });
      }
    }
  }, [settings.breakDuration, settings.workDuration, settings.isMuted]);

  useEffect(() => {
    if (appState !== AppState.PAUSED) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (appState === AppState.WORKING) {
              handleStateChange(AppState.BREAK);
            } else {
              handleStateChange(AppState.WORKING);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000) as unknown as number;
    }

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [appState, handleStateChange]);

  const toggleTimer = () => {
    setAppState(prev => prev === AppState.PAUSED ? AppState.WORKING : AppState.PAUSED);
  };

  const resetTimer = () => {
    setAppState(AppState.WORKING);
    setTimeLeft(settings.workDuration);
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const progress = appState === AppState.WORKING 
    ? 1 - (timeLeft / settings.workDuration)
    : 1 - (timeLeft / settings.breakDuration);

  return (
    <div className="min-h-screen">
      <Widget 
        state={appState} 
        progress={progress}
        onClick={() => setShowDashboard(true)} 
      />

      {showDashboard && (
        <Dashboard
          state={appState}
          timeLeft={timeLeft}
          settings={settings}
          updateSettings={updateSettings}
          onToggle={toggleTimer}
          onReset={resetTimer}
          onClose={() => setShowDashboard(false)}
          currentTip={currentTip}
        />
      )}

      {/* Break Overlay Prompt (Full screen emphasis when it's time to rest) */}
      {appState === AppState.BREAK && !showDashboard && (
        <div className="fixed inset-0 pointer-events-none z-40 bg-emerald-500/10 flex items-center justify-center animate-in fade-in duration-1000">
           <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2.5rem] shadow-2xl border border-emerald-100 max-w-sm pointer-events-auto transform translate-y-[-20%] animate-in slide-in-from-bottom-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-bounce">
                  <Eye size={32} />
                </div>
                <h2 className="text-2xl font-black text-emerald-900 tracking-tight">Time for Ocular Rest!</h2>
                <div className="text-5xl font-mono font-bold text-emerald-600 tabular-nums">
                  {timeLeft}s
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {currentTip || "Look at an object at least 20 feet away to relax your eye muscles."}
                </p>
                <button 
                   onClick={() => setShowDashboard(true)}
                   className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors pt-4"
                >
                  Open Dashboard
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Installation Hint for Desktop App Experience */}
      {!localStorage.getItem('installed_hint_shown') && (
        <div className="fixed bottom-4 left-4 p-4 bg-white border border-gray-100 shadow-lg rounded-2xl max-w-xs z-30 group animate-in slide-in-from-left-4">
          <button 
            onClick={() => {
              localStorage.setItem('installed_hint_shown', 'true');
              (document.activeElement as HTMLElement).parentElement?.remove();
            }}
            className="absolute top-2 right-2 text-gray-300 hover:text-gray-500"
          >✕</button>
          <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Desktop Tip</p>
          <p className="text-xs text-gray-600">To use this as a PC app, click the <span className="font-bold">Install App</span> icon in your browser address bar!</p>
        </div>
      )}
    </div>
  );
};

export default App;
