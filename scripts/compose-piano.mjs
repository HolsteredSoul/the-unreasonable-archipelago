/** Render the original game score for audible review. Run from the project root. */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/ui/music.ts', import.meta.url), 'utf8');
const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const workerSource = fs.readFileSync(new URL('../src/ui/music.worker.ts', import.meta.url), 'utf8');
const workerUrl = `data:text/javascript;base64,${Buffer.from(compile(workerSource)).toString('base64')}`;
const outputText = compile(source).replace("from './music.worker'", `from '${workerUrl}'`);
const { renderPianoPreview } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const seconds = Number(process.argv[2] || 64);
const mood = process.argv[3];
if (!Number.isFinite(seconds) || seconds < 4 || seconds > 600) throw new Error('Duration must be 4–600 seconds.');
if (mood && !['calm', 'storm', 'disconnected', 'finale'].includes(mood)) throw new Error('Unknown music mood.');
const { samples, sampleRate, duration } = renderPianoPreview(seconds, mood);
const wav = Buffer.alloc(44 + samples.length * 2);
wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28);
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(samples.length * 2, 40);
let peak = 0; let energy = 0;
for (let i = 0; i < samples.length; i++) {
  const sample = Math.max(-1, Math.min(1, samples[i]));
  peak = Math.max(peak, Math.abs(sample)); energy += sample * sample;
  wav.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
}
const output = path.resolve('output/playwright', `piano-${mood || 'all-moods'}-${duration}s-preview.wav`);
fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, wav);
console.log(JSON.stringify({ output, duration, sampleRate, peak: Number(peak.toFixed(3)), rms: Number(Math.sqrt(energy / samples.length).toFixed(3)), bytes: wav.length }, null, 2));
