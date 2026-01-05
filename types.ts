
export enum AppState {
  WORKING = 'WORKING',
  BREAK = 'BREAK',
  PAUSED = 'PAUSED'
}

export interface Settings {
  workDuration: number; // in seconds
  breakDuration: number; // in seconds
  isMuted: boolean;
  showCoach: boolean;
}

export interface HealthTip {
  text: string;
  category: 'eye' | 'posture' | 'mental';
}
