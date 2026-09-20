import { describe, expect, it } from 'vitest';
import { applyCommand, createGame, forecastTide, getConnectedIds, isInBounds, resolveTide } from './index';
import { describeOpening, generateOpening } from './generation';
import type { GameState } from './types';

const engine = { applyCommand, resolveTide };
const template = (seed: string): GameState => ({ ...createGame('first-light'), seed });

describe('generated opening witnesses', () => {
  it('keeps the authored introductory board exactly intact', () => {
    const authored = createGame('first-light');
    expect(generateOpening(authored, engine).state).toEqual(authored);
    expect(describeOpening(authored)).toBe('First light · an introductory sea');
  });

  it('wins 400 different seas using only accepted player commands and the real eight-tide simulation', () => {
    const layouts = new Set<string>();
    const structures = new Set<string>();
    const rotations = new Set<number>();
    const bellDistances = new Set<number>();
    const families = new Set<string>();
    let buildRoutes = 0;
    for (let seed = 0; seed < 400; seed++) {
      const source = template(`generated-sea-${seed}`);
      const original = JSON.stringify(source);
      const generated = generateOpening(source, engine);
      expect(JSON.stringify(source)).toBe(original);
      expect(generateOpening(source, engine)).toEqual(generated);
      expect(generated.attempts).toBeLessThanOrEqual(33);
      expect(generated.solution).toHaveLength(8);
      layouts.add(generated.state.islands.map(({ id, q, r }) => `${id}:${q},${r}`).join('|'));
      structures.add(generated.state.islands.map(island => island.building ?? '-').join('|'));
      rotations.add((generated.state as GameState & { currentRotation?: number }).currentRotation ?? 0);
      const bell = generated.state.islands.find(island => island.kind === 'bell')!;
      bellDistances.add(Math.max(Math.abs(bell.q), Math.abs(bell.r), Math.abs(bell.q + bell.r)));
      families.add(generated.family);
      if (generated.solution.flat().some(command => command.type === 'build')) buildRoutes++;
      // Start from the public game factory: never feed an already-generated state back as a template.
      // Names differ from the authored template, while the seed's geometry and economics must match.
      let state = createGame(source.seed);
      const layout = (value: GameState) => value.islands.map(({ name: _name, ...island }) => island);
      expect(layout(state)).toEqual(layout(generated.state));
      expect(state.currentRotation).toBe(generated.state.currentRotation);
      for (const commands of generated.solution) {
        expect(commands.length).toBeLessThanOrEqual(3);
        for (const command of commands) {
          const result = applyCommand(state, command);
          expect(result.error).toBeUndefined();
          state = result.state;
          expect(state.food).toBeGreaterThanOrEqual(0);
          expect(state.timber).toBeGreaterThanOrEqual(0);
        }
        const forecast = forecastTide(state);
        expect(resolveTide(state)).toEqual(forecast);
        state = forecast.state;
        expect(state.islands.every(isInBounds)).toBe(true);
        expect(new Set(state.islands.map(({ q, r }) => `${q},${r}`)).size).toBe(7);
      }
      expect(state.status, `seed ${source.seed}`).toBe('won');
      expect(state.tide).toBe(8);
      expect(state.integrity).toBeGreaterThan(0);
      expect(state.islands.find(island => island.kind === 'bell')?.growth).toBe(3);
      expect(getConnectedIds(state)).toContain(bell.id);
    }
    expect(layouts.size).toBeGreaterThan(380);
    expect(structures.size).toBeGreaterThan(25);
    expect(rotations.size).toBe(6);
    expect([...bellDistances].sort()).toEqual([2, 3, 4]);
    expect(families.size).toBe(4);
    expect(buildRoutes).toBeGreaterThan(140);
    expect(buildRoutes).toBeLessThan(260);
  }, 30000);

  it('does not let a caller mutate another restart or its cached solution', () => {
    const source = template('do-not-poison-the-sea');
    const pristine = generateOpening(source, engine);
    const mutable = generateOpening(source, engine);
    mutable.state.food = 0;
    mutable.state.islands[0].q = 99;
    mutable.state.log.push('changed');
    const command = mutable.solution.flat().find(item => item.type === 'tow');
    if (command?.type === 'tow') command.to.q = 99;
    mutable.solution[0].push({ type: 'anchor', id: 'heart' });
    expect(generateOpening(source, engine)).toEqual(pristine);
  });

  it('regenerates exactly after a cold start, including unusual seed text', () => {
    for (const seed of ['first-sea', 'SECOND SEA', '潮汐', 'whale 🐋', 'x'.repeat(100)]) {
      const source = template(seed);
      const first = generateOpening(source, engine);
      // A new simulator function gives this call a genuinely empty generation cache.
      const cold = generateOpening(source, { applyCommand, resolveTide: state => resolveTide(state) });
      expect(cold).toEqual(first);
    }
  });

  it('refuses to hand out an opening when no candidate survives the actual rules', () => {
    const rejectsGrowth = {
      applyCommand,
      resolveTide: (state: GameState) => resolveTide({
        ...state,
        islands: state.islands.map(island => ({ ...island, nourished: false })),
      }),
    };
    expect(() => generateOpening(template('changed-rules'), rejectsGrowth)).toThrow('Could not verify a winning route');
  });

  it('keeps short player-facing summaries about geometry, economy, and currents', () => {
    const generated = generateOpening(template('a-second-voyage'), engine);
    expect(generated.summary).toMatch(/Bell [234] hexes from the Heart/);
    expect(generated.summary).toMatch(/[12] gardens?, [12] groves?/);
    expect(generated.summary).toContain('current pattern');
    expect(generated.summary).not.toMatch(/solution|guarantee|tow.*nourish/i);
  });
});
