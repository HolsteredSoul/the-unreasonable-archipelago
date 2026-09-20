import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createGame, DIRECTIONS, forecastTide, getIslandStats } from '../game';
import type { GameState, Hex } from '../game/types';
import { createWeatherVisual, type WeatherVisualConfig } from './WeatherVisual';

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

// These checks protect the game meaning of the effects, rather than their art style.
describe('weather visuals', () => {
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