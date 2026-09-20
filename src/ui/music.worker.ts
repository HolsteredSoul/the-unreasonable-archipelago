function random(seed: number): () => number {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}

/** A felt-like piano: two detuned strings, inharmonic partials, hammer/body decay. */
export function pianoTone(midi: number, sampleRate: number): Float32Array {
  const frequency = 440 * 2 ** ((midi - 69) / 12);
  const duration = Math.min(7.8, 3.6 + 220 / frequency);
  const samples = new Float32Array(Math.ceil(duration * sampleRate));
  const rng = random(midi * 197 + 41);
  const partials = Math.min(18, Math.floor(sampleRate * 0.43 / frequency));
  const stiffness = 0.00009 + Math.max(0, midi - 60) * 0.000009;
  for (let partial = 1; partial <= partials; partial++) {
    const strength = (partial === 1 ? 0.8 : partial === 2 ? 0.58 : 0.72 / partial ** 1.36);
    const decay = (1.75 + 100 / frequency) / (1 + partial ** 1.3 * 0.1);
    const partialFrequency = frequency * partial * Math.sqrt(1 + stiffness * partial * partial);
    for (let string = 0; string < 2; string++) {
      const step = 2 * Math.PI * partialFrequency * 2 ** ((string ? 1.7 : -1.7) / 1200) / sampleRate;
      const cosine = Math.cos(step);
      const sine = Math.sin(step);
      let sinPhase = 0;
      let cosPhase = 1;
      let amplitude = strength * 0.34;
      const decayPerSample = Math.exp(-1 / (sampleRate * decay));
      for (let i = 0; i < samples.length; i++) {
        samples[i] += sinPhase * amplitude;
        const nextSin = sinPhase * cosine + cosPhase * sine;
        cosPhase = cosPhase * cosine - sinPhase * sine;
        sinPhase = nextSin;
        amplitude *= decayPerSample;
      }
    }
  }
  let hammer = 0;
  for (let i = 0; i < samples.length; i++) {
    const time = i / sampleRate;
    hammer = hammer * 0.64 + (rng() * 2 - 1) * 0.36;
    const strike = hammer * Math.exp(-time * 95) * 0.075;
    const attack = 1 - Math.exp(-time * 750);
    const release = Math.min(1, (samples.length - i) / (sampleRate * 0.12));
    samples[i] = (samples[i] * attack + strike) * release;
  }
  return samples;
}

// Importing this module for offline rendering or the main-thread fallback has
// no side effects. Only its dedicated Worker handles sample requests.
if (typeof document === 'undefined' && typeof self !== 'undefined') {
  self.addEventListener('message', (event: MessageEvent<{ midi: number; sampleRate: number }>) => {
    const { midi, sampleRate } = event.data;
    const samples = pianoTone(midi, sampleRate);
    self.postMessage({ midi, samples }, { transfer: [samples.buffer] });
  });
}
