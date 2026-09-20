let context: AudioContext | null = null;

export function playChime(kind: 'select' | 'action' | 'tide' | 'win' | 'error', enabled: boolean): void {
  if (!enabled) return;
  try {
    context ??= new AudioContext();
    void context.resume();
    const notes = kind === 'win' ? [392, 493.88, 587.33, 783.99] : kind === 'tide' ? [196, 293.66, 392] : kind === 'error' ? [174.61] : kind === 'action' ? [392, 523.25] : [523.25];
    notes.forEach((frequency, index) => {
      const oscillator = context!.createOscillator();
      const gain = context!.createGain();
      const start = context!.currentTime + index * 0.105;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.035, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);
      oscillator.connect(gain); gain.connect(context!.destination);
      oscillator.start(start); oscillator.stop(start + 0.75);
    });
  } catch { /* Sound is optional, including where AudioContext is unavailable. */ }
}
