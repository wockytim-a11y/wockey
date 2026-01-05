
class AudioService {
  private audioContext: AudioContext | null = null;

  private init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public playBeep(frequency: number = 440, type: OscillatorType = 'sine', duration: number = 0.2) {
    try {
      this.init();
      if (!this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.warn("Audio context failed to start (interaction required):", e);
    }
  }

  public playBreakStart() {
    this.playBeep(880, 'sine', 0.15);
    setTimeout(() => this.playBeep(1100, 'sine', 0.2), 100);
  }

  public playBreakEnd() {
    this.playBeep(1100, 'sine', 0.15);
    setTimeout(() => this.playBeep(880, 'sine', 0.2), 100);
  }
}

export const audioService = new AudioService();
