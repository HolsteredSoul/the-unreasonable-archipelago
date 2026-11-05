import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createGame, DIRECTIONS, forecastTide, getIslandStats } from '../game';
import type { GameState, Hex, Island } from '../game/types';
import { createWeatherVisual, type WeatherVisualConfig } from './WeatherVisual';
import { getWeatherPresentation } from './weatherModel';

const hexPosition = (hex: Hex) => new THREE.Vector3(Math.sqrt(3) * (hex.q + hex.r / 2) * 1.75, 0, 2.625 * hex.r);
const fixture = () => {
  const state = createGame();
  state.tide = 3;
  state.islands = state.islands.filter(island => island.kind !== 'ordinary');
  Object.assign(state.islands[1], { q: 1, r: 0 });
  return state;
};
const configuration = (state: GameState, extra: Partial<WeatherVisualConfig> = {}): WeatherVisualConfig => ({ state, forecast: forecastTide(state), selectedId: null, preview: false, stage: 'plan', quality: 'high', ...extra });
const mesh = (group: THREE.Group, name: string) => group.getObjectByName(name) as THREE.InstancedMesh;
const positions = (instances: THREE.InstancedMesh) => Array.from({ length: instances.count }, (_, index) => {
  const matrix = new THREE.Matrix4(); instances.getMatrixAt(index, matrix);
  const position = new THREE.Vector3().setFromMatrixPosition(matrix);
  return [position.x, position.z];
});
const at = (id: string, q: number, r: number, extra: Partial<Island> = {}): Island => ({
  id, name: id, q, r, kind: 'ordinary', building: null, growth: 0, stress: 0, nourished: false, anchored: true, ...extra,
});
const sea = (tide: number, ...islands: Island[]): GameState => ({
  ...createGame(), tide, islands: [at('heart', 0, 0, { kind: 'heart' }), ...islands],
});
const cellPositions = (hexes: Hex[]) => hexes.map(hex => {
  const position = hexPosition(hex); return [position.x, position.z];
});
const expectCells = (actual: number[][], expected: number[][]) => {
  expect(actual).toHaveLength(expected.length);
  for (const [x, z] of expected) expect(actual.some(([ax, az]) => Math.abs(ax - x) < 0.00001 && Math.abs(az - z) < 0.00001)).toBe(true);
};

// These checks protect the game meaning of the effects, rather than their art style.
describe('weather visuals', () => {
  it('focuses protecting source rays rather than selected outgoing or unrelated breakwater rays', () => {
    const state = sea(3,
      at('wall', -2, 1, { building: 'breakwater', growth: 1 }),
      at('bridge', -1, 1), at('bell', 0, 1, { kind: 'bell' }),
      at('other-wall', 1, -2, { building: 'breakwater' }),
    );
    const config = configuration(state, { selectedId: 'bell', preview: true });
    const snapshot = JSON.stringify(config);
    const visual = createWeatherVisual(hexPosition); visual.update(config);
    const focus = positions(mesh(visual.group, 'focused-shelter-edges'));
    expectCells(focus, cellPositions([{ q: -2, r: 1 }, { q: -1, r: 1 }, { q: 0, r: 1 }]));
    const all = [...focus, ...positions(mesh(visual.group, 'shelter-cell-edges'))];
    expectCells(all, cellPositions(getWeatherPresentation(state).shelteredCells.map(cell => cell.hex)));
    expect(JSON.stringify(config)).toBe(snapshot);
    // Selecting the unrelated structure switches to its self-protection, without stale focus.
    visual.update({ ...config, selectedId: 'other-wall' });
    expectCells(positions(mesh(visual.group, 'focused-shelter-edges')), cellPositions([{ q: 1, r: -2 }, { q: 2, r: -2 }, { q: 3, r: -2 }]));
    visual.dispose();
  });

  it('removes focus when a currently sheltered bell drifts out of protection', () => {
    const state = fixture();
    const config = configuration(state, { selectedId: 'bell' });
    const visual = createWeatherVisual(hexPosition); visual.update(config);
    expect(mesh(visual.group, 'focused-shelter-edges').count).toBeGreaterThan(0);
    expect(config.forecast.shelteredIds).not.toContain('bell');
    for (const extra of [{ preview: true }, { stage: 'weather' as const }, { stage: 'harvest' as const }]) {
      visual.update({ ...config, ...extra });
      expect(mesh(visual.group, 'focused-shelter-edges').count).toBe(0);
      expect(mesh(visual.group, 'exposure-rings').count).toBeGreaterThan(0);
    }
    visual.dispose();
  });

  it('uses resolved blocker positions when drifting into shelter or being blocked', () => {
    const cases = [
      { state: sea(5, at('blocker', 2, 0, { anchored: false }), at('bell', 4, -1, { kind: 'bell' })), cell: { q: 4, r: -1 }, blocked: false },
      { state: sea(5, at('blocker', 2, 0, { anchored: false }), at('obstacle', 3, 0), at('bell', 3, -1, { kind: 'bell' })), cell: { q: 3, r: -1 }, blocked: true },
    ];
    const visual = createWeatherVisual(hexPosition);
    for (const { state, cell, blocked } of cases) {
      const config = configuration(state, { selectedId: 'bell', preview: true });
      expect(config.forecast.moves.find(move => move.id === 'blocker')?.blocked).toBe(blocked);
      visual.update(config);
      expectCells(positions(mesh(visual.group, 'focused-shelter-edges')), cellPositions([cell]));
    }
    visual.dispose();
  });

  it('preserves overview, calm and proposed-build treatment', () => {
    const state = sea(3, at('wall', -2, 1, { building: 'breakwater' }), at('bell', 0, 1, { kind: 'bell' }));
    const visual = createWeatherVisual(hexPosition);
    const config = configuration(state, { preview: true });
    visual.update(config);
    const overview = positions(mesh(visual.group, 'focused-shelter-edges'));
    visual.update({ ...config, selectedId: 'not-an-island' });
    expectCells(positions(mesh(visual.group, 'focused-shelter-edges')), overview);
    // A proposal keeps the selected source's outgoing emphasis, not incoming-focus logic.
    visual.update({ ...config, selectedId: 'wall', breakwaterPreview: { state, forecast: config.forecast } });
    expectCells(positions(mesh(visual.group, 'focused-shelter-edges')), overview);
    expectCells(positions(mesh(visual.group, 'proposed-breakwater-edges')), overview);
    visual.update(configuration({ ...state, tide: 2 }, { preview: true, selectedId: 'bell' }));
    expect(mesh(visual.group, 'focused-shelter-edges').count).toBe(0);
    expect(mesh(visual.group, 'shelter-cell-edges').count).toBe(0);
    visual.dispose();
  });

  it('keeps focused shelter truthful for all winds, display phases and quality/motion settings', () => {
    const observed = new Set<number>();
    const visual = createWeatherVisual(hexPosition);
    for (let index = 0; index < 40; index++) {
      const state = { ...sea(8, at('wall', -1, 1, { building: 'breakwater', growth: 2 }), at('bell', 1, -1, { kind: 'bell' })), seed: `bearing-${index}` };
      const forecast = forecastTide(state), view = getWeatherPresentation(state, forecast);
      observed.add(view.direction);
      const selected = view.islands.find(item => item.id === 'bell')!;
      const expected = new Map<string, Hex>();
      for (const source of view.islands.filter(item => selected.blockerIds.includes(item.id))) {
        for (const cell of source.shelterCells) expected.set(`${cell.q},${cell.r}`, cell);
      }
      for (const quality of ['low', 'high'] as const) for (const stage of ['plan', 'weather', 'harvest'] as const) {
        visual.update({ state, forecast, selectedId: 'bell', preview: stage === 'plan', quality, stage });
        for (const reduced of [true, false]) {
          visual.animate(2, reduced);
          expectCells(positions(mesh(visual.group, 'focused-shelter-edges')), cellPositions([...expected.values()]));
        }
      }
    }
    expect(observed.size).toBe(6);
    visual.dispose();
  });

  it('switches exposure and impact positions to the actual post-drift arrangement', () => {
    const state = fixture();
    const config = configuration(state);
    const visual = createWeatherVisual(hexPosition);
    visual.update(config);
    expect(mesh(visual.group, 'windward-surf').count).toBe(state.islands.filter(island => !getIslandStats(state, island.id).sheltered).length);
    expect(getIslandStats(state, 'bell').sheltered).toBe(true);
    expect(config.forecast.shelteredIds).not.toContain('bell');
    visual.update({ ...config, stage: 'weather' });
    const expected = config.forecast.state.islands.filter(island => !config.forecast.shelteredIds.includes(island.id)).map(island => {
      const position = hexPosition(island); return [position.x, position.z];
    });
    const actual = positions(mesh(visual.group, 'windward-surf'));
    actual.forEach((position, i) => {
      expect(position[0]).toBeCloseTo(expected[i][0]);
      expect(position[1]).toBeCloseTo(expected[i][1]);
    });
    expect(actual).toHaveLength(expected.length);
    visual.dispose();
  });

  it('shows only the current two-cell breakwater reach when this tide grows it to level two', () => {
    const state = createGame(); state.tide = 3;
    state.islands = state.islands.filter(island => island.id === 'heart' || island.id === 'north');
    Object.assign(state.islands[1], { q: -2, r: 1, building: 'breakwater', growth: 1, nourished: true, anchored: true });
    const config = configuration(state, { stage: 'weather' });
    expect(config.forecast.state.islands[1].growth).toBe(2);
    const visual = createWeatherVisual(hexPosition); visual.update(config);
    // The structure's own cell plus two protected cells; growth applies afterwards.
    expect(mesh(visual.group, 'focused-shelter-edges').count).toBe(3);
    visual.update({ ...config, selectedId: 'north' });
    expect(mesh(visual.group, 'focused-shelter-edges').count).toBe(3);
    visual.dispose();
  });

  it('places a prospective breakwater at its forecast destination and marks its exact cells', () => {
    const state = createGame(); state.tide = 3;
    state.islands = state.islands.filter(island => island.id === 'heart' || island.id === 'grove');
    const proposed = { ...state, islands: state.islands.map(island => island.id === 'grove' ? { ...island, building: 'breakwater' as const } : island) };
    const predicted = forecastTide(proposed);
    const visual = createWeatherVisual(hexPosition);
    visual.update(configuration(state, { selectedId: 'grove', breakwaterPreview: { state: proposed, forecast: predicted } }));
    const after = predicted.state.islands.find(island => island.id === 'grove')!;
    const expected = hexPosition(after);
    const outline = mesh(visual.group, 'proposed-breakwater-edges');
    expect(outline.count).toBe(3);
    expect(positions(outline)[0][0]).toBeCloseTo(expected.x);
    expect(positions(outline)[0][1]).toBeCloseTo(expected.z);
    visual.dispose();
  });

  it('keeps storm direction independent of currents for every compass direction', () => {
    const state = fixture();
    const visual = createWeatherVisual(hexPosition);
    for (let bearing = 0; bearing < DIRECTIONS.length; bearing++) {
      const config = configuration(state);
      visual.update({ ...config, forecast: { ...config.forecast, weather: { ...config.forecast.weather, direction: bearing } } });
      visual.animate(0, true);
      const streaks = mesh(visual.group, 'storm-streaks');
      const matrix = new THREE.Matrix4();
      let actual = new THREE.Vector3();
      for (let index = 0; index < streaks.count; index++) {
        streaks.getMatrixAt(index, matrix);
        actual = new THREE.Vector3(1, 0, 0).transformDirection(matrix);
        if (actual.lengthSq()) break;
      }
      const expected = hexPosition(DIRECTIONS[bearing]).normalize();
      expect(actual.x).toBeCloseTo(expected.x);
      expect(actual.z).toBeCloseTo(expected.z);
      // The broken exposure arc must remain on the incoming shore for every bearing.
      const risk = mesh(visual.group, 'exposure-rings');
      risk.getMatrixAt(0, matrix);
      const center = new THREE.Vector3().setFromMatrixPosition(matrix);
      const vertices = risk.geometry.getAttribute('position');
      for (let vertex = 0; vertex < vertices.count; vertex++) {
        const offset = new THREE.Vector3().fromBufferAttribute(vertices, vertex).applyMatrix4(matrix).sub(center);
        expect(offset.dot(expected)).toBeLessThan(0);
      }
    }
    visual.dispose();
  });

  it('shows waves stopping at directly exposed breakwaters, then signals actual harvest growth', () => {
    const state = createGame(); state.tide = 3;
    state.islands = state.islands.filter(island => island.id === 'heart' || island.id === 'north');
    Object.assign(state.islands[1], { building: 'breakwater', nourished: true, anchored: true });
    const visual = createWeatherVisual(hexPosition);
    visual.update(configuration(state, { stage: 'weather' }));
    expect(mesh(visual.group, 'breakwater-interception').count).toBe(1);
    expect(mesh(visual.group, 'harvest-growth-rings').count).toBe(0);
    visual.update(configuration(state, { stage: 'harvest' }));
    expect(mesh(visual.group, 'breakwater-interception').count).toBe(0);
    expect(mesh(visual.group, 'harvest-growth-rings').count).toBe(1);
    // With a blocker directly upstream, no wave may hit the protected structure.
    Object.assign(state.islands[0], { q: 0, r: -2 });
    visual.update(configuration(state, { stage: 'weather' }));
    expect(mesh(visual.group, 'breakwater-interception').count).toBe(0);
    visual.dispose();
  });
  it('keeps reduced-motion frames static and releases every GPU resource once', () => {
    const visual = createWeatherVisual(hexPosition); visual.update(configuration(fixture()));
    visual.animate(1, true);
    const surf = mesh(visual.group, 'windward-surf');
    const before = Array.from(surf.instanceMatrix.array);
    visual.animate(40, true);
    expect(Array.from(surf.instanceMatrix.array)).toEqual(before);
    const children = visual.group.children as THREE.InstancedMesh[];
    expect(children.length).toBeLessThanOrEqual(16);
    // Flat transparent chart marks must not incur Three's front/back double pass.
    children.forEach(child => expect((child.material as THREE.Material).forceSinglePass).toBe(true));
    const geometries = [...new Set(children.map(child => child.geometry))];
    const materials = [...new Set(children.map(child => child.material as THREE.Material))];
    const spies = [...geometries, ...materials, ...children].map(resource => vi.spyOn(resource, 'dispose'));
    visual.dispose(); visual.dispose();
    spies.forEach(spy => expect(spy).toHaveBeenCalledTimes(1));
    expect(visual.group.children).toHaveLength(0);
  });
});
