async (page) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.evaluate(async () => {
    window.__piano = await import('/src/ui/music.ts');
    window.__piano.stopMusic();
    window.__pianoQa = { contexts: [], starts: 0, ends: 0, active: new Set(), samples: 0, frames: [], times: [], rendering: true };
    const NativeContext = window.AudioContext;
    window.AudioContext = class extends NativeContext {
      constructor(...args) { super(...args); window.__pianoQa.contexts.push(this); }
      createBufferSource() {
        const source = super.createBufferSource();
        const start = source.start.bind(source);
        source.start = (...args) => { window.__pianoQa.starts++; window.__pianoQa.active.add(source); window.__pianoQa.times.push(args[0]); return start(...args); };
        const stop = source.stop.bind(source);
        source.stop = (...args) => { window.__pianoQa.active.delete(source); return stop(...args); };
        source.addEventListener('ended', () => { window.__pianoQa.ends++; window.__pianoQa.active.delete(source); });
        return source;
      }
      createBuffer(...args) { window.__pianoQa.samples += args[1]; return super.createBuffer(...args); }
    };
    let previous = performance.now();
    const frame = now => {
      window.__pianoQa.frames.push(now - previous); previous = now;
      if (window.__pianoQa.rendering) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    window.__piano.updateMusic({ enabled: true, volume: 0.35, mood: 'calm' });
    window.addEventListener('pointerdown', window.__piano.unlockMusic, { once: true, capture: true });
  });
  const beforeGesture = await page.evaluate(() => window.__pianoQa.contexts.length);
  if (beforeGesture !== 0) throw new Error('Audio context created before gesture');
  await page.mouse.click(10, 10);
  await page.waitForTimeout(4800);
  const first = await page.evaluate(() => ({ states: window.__pianoQa.contexts.map(c => c.state), starts: window.__pianoQa.starts }));
  if (first.states[0] !== 'running' || first.starts < 1) throw new Error('Piano did not start after gesture');
  for (const mood of ['storm', 'disconnected', 'finale']) {
    await page.evaluate(mood => window.__piano.updateMusic({ enabled: true, volume: 0.35, mood }), mood);
    await page.waitForTimeout(3800);
  }
  await page.evaluate(() => {
    window.__piano.duckMusic(0.5, 0.25);
    window.__piano.updateMusic({ enabled: false, volume: 0.35, mood: 'finale' });
  });
  await page.waitForTimeout(600);
  const muted = await page.evaluate(() => ({ state: window.__pianoQa.contexts[0].state, active: window.__pianoQa.active.size }));
  if (muted.state !== 'suspended' || muted.active !== 0) throw new Error('Mute left active audio: ' + JSON.stringify(muted));
  await page.evaluate(() => window.__piano.updateMusic({ enabled: true, volume: 0.5, mood: 'calm' }));
  await page.waitForTimeout(300);
  // Fast toggles must retain the phrase, not schedule another bar over it.
  const beforeToggle = await page.evaluate(() => window.__pianoQa.starts);
  await page.evaluate(() => {
    window.__piano.updateMusic({ enabled: false, volume: 0.5, mood: 'calm' });
    window.__piano.updateMusic({ enabled: true, volume: 0.5, mood: 'calm' });
  });
  await page.waitForTimeout(250);
  const afterToggle = await page.evaluate(() => window.__pianoQa.starts);
  if (afterToggle !== beforeToggle) throw new Error('Rapid mute duplicated the scheduled phrase');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(600);
  const hiddenState = await page.evaluate(() => window.__pianoQa.contexts[0].state);
  if (hiddenState !== 'suspended') throw new Error('Hidden-page event did not suspend audio');
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(300);
  const visibleState = await page.evaluate(() => window.__pianoQa.contexts[0].state);
  if (visibleState !== 'running') throw new Error('Visible-page event did not resume audio');
  const result = await page.evaluate(() => {
    window.__piano.stopMusic(); window.__pianoQa.rendering = false;
    const frames = window.__pianoQa.frames.filter(n => n > 0).sort((a, b) => a - b);
    return { beforeGesture: 0, starts: window.__pianoQa.starts, cachedSamples: window.__pianoQa.samples,
      medianFrameMs: frames[Math.floor(frames.length / 2)], p95FrameMs: frames[Math.floor(frames.length * 0.95)],
      maxFrameMs: frames.at(-1), finalState: window.__pianoQa.contexts[0].state };
  });
  await page.waitForTimeout(100);
  result.contextClosed = await page.evaluate(() => window.__pianoQa.contexts.every(c => c.state === 'closed'));
  if (!result.contextClosed || errors.length) throw new Error(JSON.stringify({ result, errors }));
  return { ...result, first, muted, hiddenState, visibleState, errors };
}
