export type ChimeKind = 'select' | 'action' | 'tide' | 'win' | 'loss' | 'error';
export interface EffectsOptions { enabled: boolean; volume: number }

type Cue = { kind: ChimeKind; priority: number; pending: boolean; voices: Set<Voice> };
type Voice = { oscillator: OscillatorNode; gain: GainNode; cue: Cue; startsAt: number; released: boolean };
const PRIORITY: Record<ChimeKind, number> = { select: 0, action: 1, tide: 1, error: 2, win: 3, loss: 3 };
const MUTE_FADE = 0.06;
const MAX_CUES = 4;
const MAX_VOICES = 24; // Includes short, retiring fades as well as the new cue.
let options: EffectsOptions = { enabled: true, volume: 1 };
let configured = false;
let context: AudioContext | null = null;
let output: GainNode | null = null;
let visibilityDocument: Document | null = null;
let suspendTimer: ReturnType<typeof setTimeout> | undefined;
let lastSelectionAt = -Infinity;
const cues = new Set<Cue>();
const voices = new Set<Voice>();

const clampVolume = (volume: number) => Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0;
const hidden = () => typeof document !== 'undefined' && document.hidden;
const audible = () => options.enabled && options.volume > 0 && !hidden();

function release(voice: Voice): void {
  if (voice.released) return;
  voice.released = true;
  voice.oscillator.onended = null;
  voice.oscillator.disconnect(); voice.gain.disconnect();
  voices.delete(voice); voice.cue.voices.delete(voice);
  if (!voice.cue.pending && !voice.cue.voices.size) cues.delete(voice.cue);
}

function stopVoice(voice: Voice, fade: number): void {
  if (voice.released || !context) return;
  const now = context.currentTime;
  // Future notes are cancelled outright, so a muted fanfare cannot restart on unmute.
  const duration = voice.startsAt > now ? 0 : fade;
  const currentGain = voice.gain.gain.value;
  voice.gain.gain.cancelScheduledValues(now);
  voice.gain.gain.setValueAtTime(currentGain, now);
  voice.gain.gain.linearRampToValueAtTime(0, now + duration);
  try { voice.oscillator.stop(now + duration); } catch { /* Already stopped. */ }
  if (!duration) release(voice);
}

function cancelCue(cue: Cue, fade: number): void {
  cues.delete(cue); cue.pending = false;
  for (const voice of [...cue.voices]) stopVoice(voice, fade);
}

function syncOutput(): void {
  if (!context || !output) return;
  clearTimeout(suspendTimer); suspendTimer = undefined;
  const audio = context, now = audio.currentTime;
  const currentGain = output.gain.value;
  output.gain.cancelScheduledValues(now);
  output.gain.setValueAtTime(currentGain, now);
  output.gain.linearRampToValueAtTime(audible() ? options.volume : 0, now + MUTE_FADE);
  if (!audible()) {
    for (const cue of [...cues]) cancelCue(cue, MUTE_FADE);
    // Clean up even when a suspended context cannot deliver onended callbacks.
    suspendTimer = setTimeout(() => {
      suspendTimer = undefined;
      if (context !== audio || audible()) return;
      for (const voice of [...voices]) { stopVoice(voice, 0); release(voice); }
      void audio.suspend().catch(() => undefined);
    }, 80);
  }
}

/** Settings may call this before any gesture; it never creates or resumes a context. */
export function updateEffects(next: EffectsOptions): void {
  configured = true;
  options = { enabled: next.enabled, volume: clampVolume(next.volume) };
  syncOutput();
}

/** Release pending cues, voices, listener and context; safe during an unresolved resume. */
export function stopEffects(): void {
  clearTimeout(suspendTimer); suspendTimer = undefined;
  for (const cue of [...cues]) cancelCue(cue, 0);
  for (const voice of [...voices]) { stopVoice(voice, 0); release(voice); }
  cues.clear(); voices.clear();
  visibilityDocument?.removeEventListener('visibilitychange', syncOutput);
  visibilityDocument = null;
  output?.disconnect(); output = null;
  const closing = context; context = null; lastSelectionAt = -Infinity;
  if (closing && closing.state !== 'closed') void closing.close().catch(() => undefined);
}

/** Existing callers remain valid; configured volume is a bus gain, never multiplied twice. */
export function playChime(kind: ChimeKind, enabled: boolean, volume = 1): void {
  const requested = clampVolume(volume);
  if (!enabled || requested === 0 || hidden() || (configured && !audible())) return;
  try {
    if (!configured) { options = { enabled: true, volume: requested }; syncOutput(); }
    if (!context || context.state === 'closed') {
      stopEffects();
      context = new AudioContext();
      output = context.createGain(); output.gain.value = options.volume;
      output.connect(context.destination);
      if (typeof document !== 'undefined') {
        visibilityDocument = document;
        visibilityDocument.addEventListener('visibilitychange', syncOutput);
      }
    }
    const audio = context;
    const now = performance.now() / 1000, priority = PRIORITY[kind];
    // A result owns the foreground; an error owns it over ordinary interaction.
    if ([...cues].some(cue => cue.priority > priority || (priority >= 2 && cue.priority === priority))) return;
    if (kind === 'select' && now - lastSelectionAt < 0.14) return;
    if (kind === 'select') lastSelectionAt = now;
    for (const cue of [...cues]) if (cue.priority < priority || (kind === 'select' && cue.kind === 'select')) cancelCue(cue, 0.025);
    while (cues.size >= MAX_CUES) cancelCue(cues.values().next().value!, 0.025);
    const cue: Cue = { kind, priority, pending: true, voices: new Set() };
    cues.add(cue);
    // Await successful unlock, but retain the request so mute/hide/dispose can invalidate it.
    void audio.resume().then(() => {
      if (context !== audio || !cues.has(cue) || !audible()) { cues.delete(cue); return; }
      const bus = output!;
      // A lower per-call level still works; matching settings volume is applied only once.
      const relativeLevel = Math.min(requested, options.volume) / options.volume;
      const ring = (frequency: number, delay: number, duration: number, strength: number, type: OscillatorType = 'sine') => {
        while (voices.size >= MAX_VOICES) stopVoice(voices.values().next().value!, 0);
        const oscillator = audio.createOscillator(), gain = audio.createGain();
        const start = audio.currentTime + delay;
        oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(strength * relativeLevel, start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001 * relativeLevel, start + duration);
        oscillator.connect(gain); gain.connect(bus);
        const voice: Voice = { oscillator, gain, cue, startsAt: start, released: false };
        voices.add(voice); cue.voices.add(voice);
        oscillator.onended = () => release(voice);
        oscillator.start(start); oscillator.stop(start + duration + 0.05);
      };
      try {
        if (kind === 'win') {
          // The original D-major bell opens into a quiet, held home chord.
          [293.66, 369.99, 440, 587.33].forEach((frequency, index) => {
            ring(frequency, index * 0.19, 2.1, 0.033);
            ring(frequency * 2.01, index * 0.19, 0.95, 0.006);
          });
          ring(146.83, 0.52, 2.05, 0.022); ring(880, 0.85, 1.8, 0.011);
        } else if (kind === 'loss') {
          [293.66, 261.63, 220, 146.83].forEach((frequency, index) => ring(frequency, index * 0.3, 1.8, 0.032));
          ring(73.42, 0.78, 2.0, 0.014, 'triangle');
        } else {
          const notes = kind === 'tide' ? [196, 293.66, 392] : kind === 'error' ? [174.61] : kind === 'action' ? [392, 523.25] : [523.25];
          notes.forEach((frequency, index) => ring(frequency, index * 0.105, 0.7, 0.035));
        }
      } catch { cancelCue(cue, 0); }
      cue.pending = false;
      if (!cue.voices.size) cues.delete(cue);
    }).catch(() => { cues.delete(cue); });
  } catch { /* Effects are optional when Web Audio is unavailable. */ }
}
