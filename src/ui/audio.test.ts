import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class Param {
  value = 0;
  setValueAtTime = vi.fn((value: number, _time: number) => { this.value = value; });
  linearRampToValueAtTime = vi.fn((value: number, _time: number) => { this.value = value; });
  exponentialRampToValueAtTime = vi.fn((value: number, _time: number) => { this.value = value; });
  cancelScheduledValues = vi.fn();
}
class Gain {
  gain = new Param(); connect = vi.fn(); disconnect = vi.fn();
}
class Oscillator {
  frequency = new Param(); type = 'sine'; onended: (() => void) | null = null;
  connect = vi.fn(); disconnect = vi.fn(); start = vi.fn(); stop = vi.fn();
  end() { this.onended?.(); }
}
class Audio {
  static instances: Audio[] = [];
  static resumeResult: (() => Promise<void>) | null = null;
  currentTime = 4; state = 'suspended'; destination = {};
  gains: Gain[] = []; oscillators: Oscillator[] = [];
  constructor() { Audio.instances.push(this); }
  createGain = vi.fn(() => { const gain = new Gain(); this.gains.push(gain); return gain; });
  createOscillator = vi.fn(() => { const oscillator = new Oscillator(); this.oscillators.push(oscillator); return oscillator; });
  resume = vi.fn(() => Audio.resumeResult?.() ?? Promise.resolve().then(() => { this.state = 'running'; }));
  suspend = vi.fn(() => { this.state = 'suspended'; return Promise.resolve(); });
  close = vi.fn(() => { this.state = 'closed'; return Promise.resolve(); });
}

let effects: typeof import('./audio');
let page: EventTarget & { hidden: boolean };
let wallTime = 0;
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };

beforeEach(async () => {
  vi.useFakeTimers(); vi.resetModules();
  Audio.instances = []; Audio.resumeResult = null; wallTime = 0;
  page = Object.assign(new EventTarget(), { hidden: false });
  vi.stubGlobal('document', page); vi.stubGlobal('AudioContext', Audio);
  vi.stubGlobal('performance', { now: () => wallTime });
  effects = await import('./audio');
});
afterEach(() => { effects.stopEffects(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('effects lifecycle', () => {
  it('creates audio only for a permitted chime and applies configured volume once through one output bus', async () => {
    effects.updateEffects({ enabled: true, volume: 0.8 });
    expect(Audio.instances).toHaveLength(0);
    effects.playChime('action', false, 0.8);
    effects.playChime('action', true, 0);
    expect(Audio.instances).toHaveLength(0);
    effects.playChime('action', true, 0.8); await flush();
    const audio = Audio.instances[0], bus = audio.gains[0];
    expect(bus.gain.value).toBe(0.8);
    expect(bus.connect).toHaveBeenCalledWith(audio.destination);
    expect(audio.oscillators).toHaveLength(2);
    for (const gain of audio.gains.slice(1)) {
      expect(gain.connect).toHaveBeenCalledWith(bus);
      expect(gain.gain.linearRampToValueAtTime.mock.calls[0][0]).toBe(0.035);
    }
  });

  it('preserves legacy per-call volume and clamps invalid configured levels safely', async () => {
    effects.playChime('action', true, 0.4); await flush();
    const audio = Audio.instances[0];
    expect(audio.gains[0].gain.value).toBe(0.4);
    effects.playChime('action', true, 0.9); await flush();
    expect(audio.gains[0].gain.value).toBe(0.9);
    effects.updateEffects({ enabled: true, volume: Number.NaN });
    const count = audio.oscillators.length;
    effects.playChime('win', true, 1); await flush();
    expect(audio.oscillators).toHaveLength(count);
    expect(audio.gains[0].gain.value).toBe(0);
    effects.updateEffects({ enabled: true, volume: 20 });
    expect(audio.gains[0].gain.value).toBe(1);
  });

  it('fades master mute within 100 ms and cancels future notes instead of replaying them on unmute', async () => {
    effects.updateEffects({ enabled: true, volume: 0.8 });
    effects.playChime('win', true, 0.8); await flush();
    const audio = Audio.instances[0];
    expect(audio.oscillators).toHaveLength(10);
    effects.updateEffects({ enabled: false, volume: 0.8 });
    const ramp = audio.gains[0].gain.linearRampToValueAtTime.mock.lastCall!;
    expect(ramp[0]).toBe(0); expect(ramp[1] - audio.currentTime).toBeLessThanOrEqual(0.1);
    for (const oscillator of audio.oscillators) {
      const future = oscillator.start.mock.calls[0][0] > audio.currentTime;
      expect(oscillator.stop.mock.lastCall![0]).toBeCloseTo(audio.currentTime + (future ? 0 : 0.06));
      if (future) expect(oscillator.disconnect).toHaveBeenCalledOnce();
    }
    effects.updateEffects({ enabled: true, volume: 0.8 });
    vi.advanceTimersByTime(100); await flush();
    expect(audio.suspend).not.toHaveBeenCalled();
    expect(audio.oscillators).toHaveLength(10);
    expect(audio.oscillators.every(oscillator => oscillator.start.mock.calls.length === 1)).toBe(true);
  });

  it('invalidates a pending resume on mute, including a stale enabled call', async () => {
    let resume!: () => void;
    Audio.resumeResult = () => new Promise<void>(resolve => { resume = resolve; });
    effects.updateEffects({ enabled: true, volume: 0.8 });
    effects.playChime('win', true, 0.8);
    const audio = Audio.instances[0];
    effects.updateEffects({ enabled: false, volume: 0.8 });
    effects.playChime('action', true, 0.8);
    resume(); await flush();
    expect(audio.oscillators).toHaveLength(0);
    vi.advanceTimersByTime(80);
    expect(audio.suspend).toHaveBeenCalledOnce();
  });

  it('coalesces selection bursts and retains at most one current selection cue', async () => {
    for (let i = 0; i < 40; i++) effects.playChime('select', true);
    await flush();
    const audio = Audio.instances[0];
    expect(audio.oscillators).toHaveLength(1);
    wallTime = 150;
    effects.playChime('select', true); await flush();
    expect(audio.oscillators).toHaveLength(2);
    expect(audio.oscillators[0].stop.mock.lastCall![0]).toBeCloseTo(audio.currentTime + 0.025);
  });

  it('gives errors and outcomes priority over ordinary and pending cues', async () => {
    effects.playChime('action', true); await flush();
    const audio = Audio.instances[0];
    effects.playChime('error', true); await flush();
    expect(audio.oscillators).toHaveLength(3);
    effects.playChime('select', true); effects.playChime('action', true); effects.playChime('error', true);
    await flush(); expect(audio.oscillators).toHaveLength(3);
    effects.playChime('win', true); await flush();
    expect(audio.oscillators).toHaveLength(13);
    effects.playChime('error', true); effects.playChime('loss', true); effects.playChime('win', true);
    await flush(); expect(audio.oscillators).toHaveLength(13);
    audio.oscillators.forEach(oscillator => oscillator.end());
    effects.playChime('action', true); await flush();
    expect(audio.oscillators).toHaveLength(15);
  });

  it('bounds queued cues and all connected voices during extreme action bursts', async () => {
    for (let i = 0; i < 100; i++) effects.playChime('tide', true);
    await flush();
    const audio = Audio.instances[0];
    expect(audio.oscillators).toHaveLength(12); // Four accepted pending cues, three notes each.
    for (let i = 0; i < 100; i++) { effects.playChime('tide', true); await flush(); }
    expect(audio.oscillators.filter(oscillator => !oscillator.disconnect.mock.calls.length).length).toBeLessThanOrEqual(24);
    effects.playChime('win', true); await flush();
    expect(audio.oscillators.filter(oscillator => !oscillator.disconnect.mock.calls.length).length).toBeLessThanOrEqual(24);
  });

  it('cancels on hidden pages and resumes only a new effect rather than old tails', async () => {
    effects.playChime('loss', true); await flush();
    const audio = Audio.instances[0];
    page.hidden = true; page.dispatchEvent(new Event('visibilitychange'));
    effects.playChime('win', true); vi.advanceTimersByTime(80); await flush();
    expect(audio.oscillators).toHaveLength(5);
    expect(audio.suspend).toHaveBeenCalledOnce();
    expect(audio.oscillators.every(oscillator => oscillator.disconnect.mock.calls.length === 1)).toBe(true);
    page.hidden = false; page.dispatchEvent(new Event('visibilitychange'));
    expect(audio.resume).toHaveBeenCalledTimes(1);
    effects.playChime('action', true); await flush();
    expect(audio.oscillators).toHaveLength(7);
  });

  it('cleans up idempotently during an unresolved resume and can start a fresh context', async () => {
    let resume!: () => void;
    Audio.resumeResult = () => new Promise<void>(resolve => { resume = resolve; });
    const remove = vi.spyOn(page, 'removeEventListener');
    effects.playChime('win', true);
    const old = Audio.instances[0];
    effects.stopEffects(); effects.stopEffects(); resume(); await flush();
    expect(old.oscillators).toHaveLength(0); expect(old.close).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledTimes(1);
    Audio.resumeResult = null;
    effects.playChime('action', true); await flush();
    expect(Audio.instances).toHaveLength(2);
    expect(Audio.instances[1].oscillators).toHaveLength(2);
  });

  it('does not leak blocked cues after resume rejection and tolerates unavailable Web Audio', async () => {
    Audio.resumeResult = () => Promise.reject(new Error('autoplay'));
    effects.playChime('win', true); await flush();
    const audio = Audio.instances[0]; expect(audio.oscillators).toHaveLength(0);
    Audio.resumeResult = null;
    effects.playChime('action', true); await flush(); expect(audio.oscillators).toHaveLength(2);
    effects.stopEffects(); vi.stubGlobal('AudioContext', undefined);
    expect(() => effects.playChime('action', true)).not.toThrow();
  });

  it('zero-volume settings cancel active effects and later volume changes use the existing bus', async () => {
    effects.updateEffects({ enabled: true, volume: 1 }); effects.playChime('tide', true); await flush();
    const audio = Audio.instances[0];
    effects.updateEffects({ enabled: true, volume: 0 }); vi.advanceTimersByTime(80);
    expect(audio.oscillators.every(oscillator => oscillator.disconnect.mock.calls.length === 1)).toBe(true);
    effects.updateEffects({ enabled: true, volume: 0.4 }); effects.playChime('action', true, 0.4); await flush();
    expect(Audio.instances).toHaveLength(1); expect(audio.gains[0].gain.value).toBe(0.4);
    expect(audio.oscillators).toHaveLength(5);
  });
});
