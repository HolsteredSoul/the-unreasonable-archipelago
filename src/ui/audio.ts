let context: AudioContext | null = null;

export function playChime(kind: 'select' | 'action' | 'tide' | 'win' | 'loss' | 'error', enabled: boolean, volume = 1): void {
  const level = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0;
  if (!enabled || level === 0) return;
  try {
    if (!context || context.state === 'closed') context = new AudioContext();
    const audio = context;
    void audio.resume().catch(() => undefined);
    const ring = (frequency: number, delay: number, duration: number, strength: number, type: OscillatorType = 'sine') => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const start = audio.currentTime + delay;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(strength * level, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001 * level, start + duration);
      oscillator.connect(gain); gain.connect(audio.destination);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(start); oscillator.stop(start + duration + 0.05);
    };
    if (kind === 'win') {
      // A D-major bell opens into a quiet, held home chord.
      [293.66, 369.99, 440, 587.33].forEach((frequency, index) => {
        ring(frequency, index * 0.19, 2.1, 0.033);
        ring(frequency * 2.01, index * 0.19, 0.95, 0.006);
      });
      ring(146.83, 0.52, 2.05, 0.022);
      ring(880, 0.85, 1.8, 0.011);
    } else if (kind === 'loss') {
      // The same bell descends; its last low note outlives the higher lights.
      [293.66, 261.63, 220, 146.83].forEach((frequency, index) => ring(frequency, index * 0.3, 1.8, 0.032));
      ring(73.42, 0.78, 2.0, 0.014, 'triangle');
    } else {
      const notes = kind === 'tide' ? [196, 293.66, 392] : kind === 'error' ? [174.61] : kind === 'action' ? [392, 523.25] : [523.25];
      notes.forEach((frequency, index) => ring(frequency, index * 0.105, 0.7, 0.035));
    }
  } catch { /* Sound is optional, including where AudioContext is unavailable. */ }
}
