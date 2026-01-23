
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Widget } from './components/Widget';
import { Dashboard } from './components/Dashboard';
import { AppState, Settings } from './types';
import { DEFAULT_WORK_SECONDS, DEFAULT_BREAK_SECONDS } from './constants';
import { audioService } from './services/audioService';
import { fetchHealthTip } from './services/geminiService';
import { Eye } from 'lucide-react';

const SETTINGS_KEY = 'ocular_rest_settings';
const SESSION_KEY = 'ocular_rest_session_v2';

const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn(e); }
    }
    return {
      workDuration: DEFAULT_WORK_SECONDS,
      breakDuration: DEFAULT_BREAK_SECONDS,
      isMuted: false,
      showCoach: true
    };
  });

  // Initialize state from localStorage to survive refreshes/background kills
  const [appState, setAppState] = useState<AppState>(() => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        return parsed.state || AppState.PAUSED;
      } catch (e) { return AppState.PAUSED; }
    }
    return AppState.PAUSED;
  });

  const [endTime, setEndTime] = useState<number | null>(() => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        return parsed.endTime || null;
      } catch (e) { return null; }
    }
    return null;
  });

  const [timeLeft, setTimeLeft] = useState(settings.workDuration);
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentTip, setCurrentTip] = useState<string>("");
  const timerRef = useRef<number | null>(null);

  // Persistence: Save current session whenever state or endTime changes
  useEffect(() => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ state: appState, endTime }));
  }, [appState, endTime]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Notifications
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const startPhase = useCallback(async (state: AppState, duration: number) => {
    const newEndTime = Date.now() + duration * 1000;
    setAppState(state);
    setEndTime(newEndTime);
    setTimeLeft(duration);

    if (state === AppState.BREAK) {
      if (!settings.isMuted) audioService.playBreakStart();
      const tip = await fetchHealthTip();
      setCurrentTip(tip);
      
      if (Notification.permission === "granted") {
        new Notification("Ocular Rest Time!", {
          body: `Look away from the screen for ${duration} seconds. ${tip}`,
          icon: "https://cdn-icons-png.flaticon.com/512/3233/3233483.png",
          silent: settings.isMuted
        });
      }
    } else if (state === AppState.WORKING) {
      if (!settings.isMuted) audioService.playBreakEnd();
      if (Notification.permission === "granted") {
        new Notification("Back to Work", {
          body: `Next rest in ${Math.round(duration / 60)} minutes.`,
          silent: settings.isMuted
        });
      }
    }
  }, [settings.isMuted, settings.workDuration, settings.breakDuration]);

  // Aggressive check logic (used by interval and visibility change)
  const syncTimer = useCallback(() => {
    if (appState === AppState.PAUSED || !endTime) return;

    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
    
    if (remaining <= 0) {
      // Catch-up: If the time passed while we were in the background
      if (appState === AppState.WORKING) {
        startPhase(AppState.BREAK, settings.breakDuration);
      } else {
        startPhase(AppState.WORKING, settings.workDuration);
      }
    } else {
      setTimeLeft(remaining);
    }
  }, [appState, endTime, startPhase, settings.workDuration, settings.breakDuration]);

  useEffect(() => {
    if (appState !== AppState.PAUSED && endTime) {
      // Sync immediately on mount/state change
      syncTimer();
      timerRef.current = window.setInterval(syncTimer, 500) as unknown as number;
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [appState, endTime, syncTimer]);

  // Handle Tab Visibility (Essential for background reliability)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncTimer(); // Recalculate everything immediately on return
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [syncTimer]);

  const toggleTimer = () => {
    if (appState === AppState.PAUSED) {
      startPhase(AppState.WORKING, settings.workDuration);
    } else {
      setAppState(AppState.PAUSED);
      setEndTime(null);
    }
  };

  const resetTimer = () => {
    setAppState(AppState.PAUSED);
    setEndTime(null);
    setTimeLeft(settings.workDuration);
    localStorage.removeItem(SESSION_KEY);
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const totalDuration = appState === AppState.BREAK ? settings.breakDuration : settings.workDuration;
  const progress = 1 - (timeLeft / (totalDuration || 1));

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

      {appState === AppState.BREAK && !showDashboard && (
        <div className="fixed inset-0 pointer-events-none z-40 bg-emerald-500/10 flex items-center justify-center animate-in fade-in duration-1000">
           <div className="bg-white/95 backdrop-blur-lg p-8 rounded-[2.5rem] shadow-2xl border border-emerald-100 max-w-sm pointer-events-auto transform translate-y-[-20%] animate-in slide-in-from-bottom-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-bounce">
                  <Eye size={32} />
                </div>
                <h2 className="text-2xl font-black text-emerald-900 tracking-tight">Ocular Rest!</h2>
                <div className="text-5xl font-mono font-bold text-emerald-600 tabular-nums">
                  {timeLeft}s
                </div>
                <p className="text-gray-600 text-sm leading-relaxed italic">
                  "{currentTip || "Look at an object 20 feet away to relax your eyes."}"
                </p>
                <button 
                   onClick={() => setShowDashboard(true)}
                   className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-emerald-600 transition-colors pt-4"
                >
                  Configure
                </button>
              </div>
           </div>
        </div>
      )}

      {!localStorage.getItem('installed_hint_shown') && (
        <div className="fixed bottom-4 left-4 p-4 bg-white border border-gray-100 shadow-lg rounded-2xl max-w-xs z-30 group animate-in slide-in-from-left-4">
          <button 
            onClick={() => {
              localStorage.setItem('installed_hint_shown', 'true');
              (document.activeElement as HTMLElement).parentElement?.remove();
            }}
            className="absolute top-2 right-2 text-gray-300 hover:text-gray-500"
          >✕</button>
          <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Background Tip</p>
          <p className="text-xs text-gray-600 leading-tight">
            The timer now tracks real clock time. It works even if you switch tabs!
          </p>
        </div>
      )}
    </div>
  );
};

export default App;
