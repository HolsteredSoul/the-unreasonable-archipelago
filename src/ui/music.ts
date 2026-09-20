import { pianoTone } from './music.worker';

/** Original score: “A Little Landfall”. No recordings or third-party samples. */
export type MusicMood = 'calm' | 'storm' | 'disconnected' | 'finale';
export interface MusicOptions { enabled: boolean; volume: number; mood: MusicMood }
interface Note { beat: number; midi: number; velocity: number }
interface PianoPreview { sampleRate: number; samples: Float32Array; duration: number }

const BEAT = 60 / 68;
const BAR = BEAT * 4;
const SAMPLE_RATE = 22050;
const MOODS: MusicMood[] = ['calm', 'storm', 'disconnected', 'finale'];
// Sixteen bars share a home in D. The borrowed G minor and displaced eighths
// provide the small wobble in an otherwise warm, unhurried piece.
const HARMONY = [
  [50, 57, 61, 66], [49, 57, 59, 64], [47, 54, 57, 62], [43, 54, 59, 62],
  [42, 57, 62, 66], [40, 55, 59, 66], [43, 55, 59, 64], [45, 57, 59, 64],
  [50, 57, 61, 66], [47, 54, 57, 64], [40, 55, 59, 62], [45, 55, 61, 64],
  [43, 54, 59, 62], [43, 55, 58, 64], [45, 54, 57, 62], [50, 57, 59, 66],
];
const MELODY: [number, number][][] = [
  [[0.25, 73], [1.75, 69], [3.25, 66]], [[1, 64], [2.5, 66]],
  [[0.5, 69], [2, 66], [3.5, 62]], [[1.5, 71], [3, 69]],
  [[0.25, 66], [1.75, 69], [3, 73]], [[1, 71], [2.75, 66]],
  [[0.5, 67], [2.5, 66]], [[1.5, 64]],
  [[0.25, 73], [1.75, 76], [3.25, 74]], [[0.5, 73], [2.5, 69]],
  [[1, 71], [2.5, 67], [3.5, 66]], [[1.5, 64], [3, 61]],
  [[0.5, 62], [2, 66], [3.25, 69]], [[1, 70], [2.75, 67]],
  [[0.5, 66], [2, 64]], [[0.25, 62], [2.5, 69]],
];

function random(seed: number): () => number {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}

/** The same authored arrangement drives live playback and the review WAV. */
export function pianoBar(bar: number, mood: MusicMood): Note[] {
  const index = bar % HARMONY.length;
  const variation = Math.floor(bar / HARMONY.length) % 4;
  const chord = HARMONY[index];
  const rng = random(bar * 109 + MOODS.indexOf(mood) * 3701 + 17);
  const notes: Note[] = [];
  const add = (beat: number, midi: number, velocity: number) => {
    notes.push({ beat: Math.max(0, beat + (rng() - 0.5) * 0.045), midi, velocity: velocity * (0.94 + rng() * 0.12) });
  };
  add(0, chord[0], mood === 'storm' ? 0.58 : 0.46);
  add(0.1, chord[1], 0.27);
  if (mood !== 'disconnected' || index % 2 === 0) add(1.5, chord[2], 0.27);
  add(2.5, chord[3], mood === 'finale' ? 0.38 : 0.27);
  if (variation === 1 || mood === 'storm') add(3.35, chord[1] + 12, 0.25);
  if (mood === 'storm') {
    add(1, chord[0] + 12, 0.28);
    add(2, chord[0] + 7, 0.3);
    add(3.5, chord[2], 0.25);
  }
  MELODY[index].forEach(([beat, midi], i) => {
    if (mood === 'disconnected' && i === 1) return;
    const octave = mood === 'disconnected' || (variation === 2 && index >= 8) ? 12 : 0;
    add(beat, midi + octave, mood === 'storm' ? 0.5 : mood === 'disconnected' ? 0.35 : 0.48);
    if (mood === 'finale' && i === 0 && index % 2 === 0) add(beat + 0.09, midi - 12, 0.27);
  });
  // Every fourth pass leaves more breathing room instead of only adding notes.
  return variation === 3 ? notes.filter((_, i) => i !== 2) : notes;
}


let options: MusicOptions = { enabled: false, volume: 0.35, mood: 'calm' };
let context: AudioContext | null = null;
let output: GainNode | null = null;
let duck: GainNode | null = null;
let buses: Map<MusicMood, GainNode> = new Map();
let timer: ReturnType<typeof setInterval> | undefined;
let suspendTimer: ReturnType<typeof setTimeout> | undefined;
let nextBar = 0;
let barNumber = 0;
let playingMood: MusicMood = 'calm';
let worker: Worker | null = null;
const pendingNotes = new Set<number>();
const buffers = new Map<number, AudioBuffer>();
const voices = new Set<AudioBufferSourceNode>();

function volumeTarget(): number { return options.enabled && !document.hidden ? options.volume * 0.5 : 0; }

function clearVoices(): void {
  for (const source of voices) { try { source.stop(); } catch { /* Already ended. */ } }
  voices.clear();
}

function cacheNote(midi: number, pcm: Float32Array): void {
  pendingNotes.delete(midi);
  if (!context) return;
  const buffer = context.createBuffer(1, pcm.length, SAMPLE_RATE);
  buffer.getChannelData(0).set(pcm);
  buffers.set(midi, buffer);
}

function prepareNote(midi: number): void {
  if (buffers.has(midi) || pendingNotes.has(midi)) return;
  pendingNotes.add(midi);
  if (worker) worker.postMessage({ midi, sampleRate: SAMPLE_RATE });
  else cacheNote(midi, pianoTone(midi, SAMPLE_RATE));
}

function startWorker(): void {
  try {
    const started = new Worker(new URL('./music.worker.ts', import.meta.url), { type: 'module' });
    worker = started;
    started.onmessage = (event: MessageEvent<{ midi: number; samples: Float32Array }>) => {
      if (worker === started) cacheNote(event.data.midi, event.data.samples);
    };
    started.onerror = () => {
      if (worker !== started) return;
      started.terminate(); worker = null;
      pendingNotes.clear();
    };
  } catch { worker = null; }
}

function makeGraph(): void {
  if (!context) return;
  output = context.createGain();
  output.gain.value = 0;
  duck = context.createGain();
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -15;
  compressor.knee.value = 16;
  compressor.ratio.value = 2;
  compressor.attack.value = 0.025;
  compressor.release.value = 0.3;
  duck.connect(compressor); compressor.connect(output); output.connect(context.destination);
  const reverb = context.createConvolver();
  const impulse = context.createBuffer(2, Math.floor(context.sampleRate * 1.7), context.sampleRate);
  const rng = random(4107);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    let low = 0;
    for (let i = 0; i < data.length; i++) {
      low = low * 0.7 + (rng() * 2 - 1) * 0.3;
      data[i] = low * (1 - i / data.length) ** 2.6;
    }
  }
  reverb.buffer = impulse;
  const wet = context.createGain(); wet.gain.value = 0.19;
  reverb.connect(wet); wet.connect(duck);
  buses = new Map(MOODS.map(mood => {
    const bus = context!.createGain();
    bus.gain.value = mood === options.mood ? 1 : 0;
    bus.connect(duck!); bus.connect(reverb);
    return [mood, bus];
  }));
  playingMood = options.mood;
}

function playNote(note: Note, time: number, mood: MusicMood): void {
  if (!context) return;
  const buffer = buffers.get(note.midi);
  if (!buffer) return;
  const source = context.createBufferSource(); source.buffer = buffer;
  const gain = context.createGain(); gain.gain.value = note.velocity ** 1.3;
  const pan = context.createStereoPanner(); pan.pan.value = Math.max(-0.42, Math.min(0.42, (note.midi - 62) / 65));
  source.connect(gain); gain.connect(pan); pan.connect(buses.get(mood)!);
  voices.add(source);
  source.onended = () => { voices.delete(source); source.disconnect(); gain.disconnect(); pan.disconnect(); };
  source.start(time);
}

function schedule(): void {
  if (!context || context.state !== 'running' || !options.enabled || document.hidden) return;
  // Resuming an inactive tab must never schedule a backlog of missed music.
  if (nextBar < context.currentTime - BAR) nextBar = context.currentTime + 0.06;
  while (nextBar < context.currentTime + 0.3) {
    const notes = pianoBar(barNumber, options.mood);
    notes.forEach(note => prepareNote(note.midi));
    // Preload the next phrases on the worker. Cold instruments never interrupt
    // the diorama's render thread or leave holes in the first musical phrase.
    for (let ahead = 1; ahead <= 2; ahead++) {
      for (const mood of MOODS) pianoBar(barNumber + ahead, mood).forEach(note => prepareNote(note.midi));
    }
    if (notes.some(note => !buffers.has(note.midi))) {
      nextBar = context.currentTime + 0.08;
      return;
    }
    if (playingMood !== options.mood) {
      playingMood = options.mood;
      for (const [mood, bus] of buses) {
        bus.gain.cancelScheduledValues(nextBar);
        bus.gain.setValueAtTime(bus.gain.value, nextBar);
        bus.gain.linearRampToValueAtTime(mood === playingMood ? 1 : 0, nextBar + 1.2);
      }
    }
    for (const note of notes) playNote(note, nextBar + note.beat * BEAT, playingMood);
    barNumber++;
    nextBar += BAR;
  }
}

function syncPlayback(): void {
  if (!context || !output) return;
  clearTimeout(suspendTimer);
  output.gain.cancelScheduledValues(context.currentTime);
  output.gain.setTargetAtTime(volumeTarget(), context.currentTime, 0.11);
  if (!options.enabled || document.hidden) {
    clearInterval(timer); timer = undefined;
    const closingContext = context;
    suspendTimer = setTimeout(() => {
      if (context === closingContext && (!options.enabled || document.hidden)) {
        clearVoices();
        nextBar = 0;
        void context.suspend().catch(() => undefined);
      }
    }, 450);
    return;
  }
  const startingContext = context;
  void context.resume().then(() => {
    if (context !== startingContext || !options.enabled || document.hidden || timer !== undefined) return;
    // A quick mute/unmute retains the already queued phrase instead of doubling it.
    if (nextBar === 0 || nextBar < context.currentTime - BAR) nextBar = context.currentTime + 0.07;
    schedule();
    timer = setInterval(schedule, 100);
  }).catch(() => undefined);
}

/** Call directly inside a pointer/keyboard handler. No context exists before it. */
export function unlockMusic(): void {
  if (typeof window === 'undefined') return;
  try {
    if (!context) {
      context = new AudioContext({ latencyHint: 'playback' });
      makeGraph();
      startWorker();
      document.addEventListener('visibilitychange', syncPlayback);
    }
    syncPlayback();
  } catch { /* Music is optional when Web Audio or autoplay is unavailable. */ }
}

/** Safe from a React effect. Enabling alone does not create an audio context. */
export function updateMusic(next: MusicOptions): void {
  options = { enabled: next.enabled, volume: Number.isFinite(next.volume) ? Math.max(0, Math.min(1, next.volume)) : 0.35, mood: MOODS.includes(next.mood) ? next.mood : 'calm' };
  if (typeof document !== 'undefined') syncPlayback();
}

/** Make room for the bell or result fanfare; separate from the user's volume. */
export function duckMusic(durationSeconds = 2.5, amount = 0.3): void {
  if (!context || !duck) return;
  const now = context.currentTime;
  duck.gain.cancelScheduledValues(now);
  duck.gain.setValueAtTime(duck.gain.value, now);
  duck.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, amount)), now + 0.08);
  duck.gain.setValueAtTime(Math.max(0, Math.min(1, amount)), now + Math.max(0.1, durationSeconds));
  duck.gain.linearRampToValueAtTime(1, now + Math.max(0.1, durationSeconds) + 1.3);
}

/** Release all timers, listeners, cached samples and the Web Audio context. */
export function stopMusic(): void {
  clearInterval(timer); clearTimeout(suspendTimer); timer = undefined;
  if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', syncPlayback);
  clearVoices(); buffers.clear(); buses.clear();
  worker?.terminate(); worker = null; pendingNotes.clear();
  if (context) void context.close().catch(() => undefined);
  context = null; output = null; duck = null; barNumber = 0; nextBar = 0;
}

/** Deterministic offline review mix, with all four moods when none is specified. */
export function renderPianoPreview(duration = 64, mood?: MusicMood): PianoPreview {
  const sampleRate = SAMPLE_RATE;
  const seconds = Math.max(4, Math.min(600, duration));
  const samples = new Float32Array(Math.ceil(seconds * sampleRate));
  const cache = new Map<number, Float32Array>();
  for (let bar = 0; bar * BAR < seconds; bar++) {
    const selected = mood ?? MOODS[Math.min(3, Math.floor(bar * BAR / seconds * 4))];
    for (const note of pianoBar(bar, selected)) {
      let tone = cache.get(note.midi);
      if (!tone) { tone = pianoTone(note.midi, sampleRate); cache.set(note.midi, tone); }
      const start = Math.floor((bar * BAR + note.beat * BEAT) * sampleRate);
      const gain = note.velocity ** 1.3 * 0.42;
      for (let i = 0; i < tone.length && start + i < samples.length; i++) samples[start + i] += tone[i] * gain;
    }
  }
  // A restrained room tail in the portable preview; the browser uses a convolver.
  const dry = samples.slice();
  for (const [delay, gain] of [[0.073, 0.1], [0.137, 0.07], [0.211, 0.045], [0.317, 0.025]]) {
    const offset = Math.floor(delay * sampleRate);
    for (let i = offset; i < samples.length; i++) samples[i] += dry[i - offset] * gain;
  }
  for (let i = 0; i < samples.length; i++) {
    const fade = Math.min(1, i / (sampleRate * 0.15), (samples.length - i) / (sampleRate * 2));
    samples[i] = Math.tanh(samples[i]) * fade;
  }
  return { sampleRate, samples, duration: seconds };
}
