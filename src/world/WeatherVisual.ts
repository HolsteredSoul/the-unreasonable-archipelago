import * as THREE from 'three';
import { DIRECTIONS, getIslandStats } from '../game';
import type { Forecast, GameState, Hex, Island } from '../game/types';
import { shelterCells } from './planning';

export type WeatherVisualConfig = {
  state: GameState;
  forecast: Forecast;
  selectedId: string | null;
  preview: boolean;
  stage: 'plan' | 'drift' | 'weather' | 'harvest';
  breakwaterPreview?: { state: GameState; forecast: Forecast } | null;
  quality: 'high' | 'low';
};

type LocatedIsland = { island: Island; position: THREE.Vector3; sheltered: boolean; stressAfter: number };
const TAU = Math.PI * 2;
const CAPACITY = 96;
const hexKey = (hex: Hex) => `${hex.q},${hex.r}`;
const fraction = (n: number) => n - Math.floor(n);

/** Flat ribbons remain readable at the game's orthographic camera distance. */
function ribbonGeometry(points: THREE.Vector3[], width: number) {
  const vertices: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1], to = points[i];
    const dx = to.x - from.x, dz = to.z - from.z;
    const length = Math.hypot(dx, dz) || 1;
    const side = new THREE.Vector3(-dz / length * width / 2, 0, dx / length * width / 2);
    const corners = [from.clone().add(side), from.clone().sub(side), to.clone().add(side), to.clone().sub(side)];
    for (const index of [0, 1, 2, 1, 3, 2]) vertices.push(...corners[index].toArray());
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  return geometry;
}

function arcGeometry(radius: number, width: number, start: number, end: number, segments = 48) {
  return ribbonGeometry(Array.from({ length: segments + 1 }, (_, i) => {
    const angle = start + (end - start) * i / segments;
    return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  }), width);
}

function hexOutline(dashed: boolean) {
  const vertices: number[] = [];
  for (let side = 0; side < 6; side++) {
    const from = new THREE.Vector3(Math.cos((side + 0.5) / 6 * TAU) * 1.65, 0, Math.sin((side + 0.5) / 6 * TAU) * 1.65);
    const to = new THREE.Vector3(Math.cos((side + 1.5) / 6 * TAU) * 1.65, 0, Math.sin((side + 1.5) / 6 * TAU) * 1.65);
    const pieces = dashed ? 3 : 1;
    for (let part = 0; part < pieces; part++) {
      const geometry = ribbonGeometry([
        from.clone().lerp(to, part / pieces),
        from.clone().lerp(to, (part + (dashed ? 0.59 : 1)) / pieces),
      ], dashed ? 0.055 : 0.035);
      vertices.push(...Array.from(geometry.getAttribute('position').array));
      geometry.dispose();
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  return geometry;
}

/**
 * A bounded, sea-level weather layer. Direction always means the storm's travel
 * direction, independently of the currents which move islands. All wakes are
 * exact game cells; no broad cone suggests protection the rules cannot give.
 */
export function createWeatherVisual(hexPosition: (hex: Hex) => THREE.Vector3) {
  const group = new THREE.Group();
  group.name = 'weather-visual';
  const meshes: THREE.InstancedMesh[] = [];
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.MeshBasicMaterial>();
  const transform = new THREE.Object3D();
  const color = new THREE.Color();
  const rotationAxis = new THREE.Vector3(0, 1, 0);
  const point = new THREE.Vector3();
  let config: WeatherVisualConfig | null = null;
  let located: LocatedIsland[] = [];
  let wakePositions: THREE.Vector3[] = [];
  let exposed: LocatedIsland[] = [];
  let recovering: LocatedIsland[] = [];
  let intercepting: LocatedIsland[] = [];
  let growing: LocatedIsland[] = [];
  let direction = new THREE.Vector3(1, 0, 0);
  let crosswind = new THREE.Vector3(0, 0, 1);
  let angle = 0;
  let lastTime = 0;
  let lastReducedMotion = false;
  let disposed = false;

  function batch(name: string, geometry: THREE.BufferGeometry, tint: number, opacity: number) {
    const material = new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    // Every face lies in the sea plane. Rendering backfaces in a separate
    // transparency pass has no visual benefit and doubles overlay draw calls.
    material.forceSinglePass = true;
    const mesh = new THREE.InstancedMesh(geometry, material, CAPACITY);
    mesh.name = name;
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.userData.pickable = false;
    // Also safe if a future raycaster traverses all scene descendants.
    mesh.raycast = () => {};
    group.add(mesh);
    meshes.push(mesh); geometries.add(geometry); materials.add(material);
    return mesh;
  }

  const hexFill = new THREE.CircleGeometry(1.60, 6);
  hexFill.rotateX(-Math.PI / 2); hexFill.rotateY(Math.PI / 6);
  const wakeFill = batch('shelter-cell-fill', hexFill, 0x94d4b1, 0.10);
  const wakeEdges = batch('shelter-cell-edges', hexOutline(false), 0xb9e4be, 0.55);
  const focusedFill = batch('focused-shelter-fill', hexFill, 0x9de2bb, 0.17);
  const focusedEdges = batch('focused-shelter-edges', hexOutline(false), 0xc8f1ce, 0.9);
  const candidateFill = batch('proposed-breakwater-fill', hexFill, 0xffd69a, 0.16);
  const candidateEdges = batch('proposed-breakwater-edges', hexOutline(true), 0xffdf9e, 0.98);

  const windPath = Array.from({ length: 11 }, (_, i) => new THREE.Vector3(i / 10 * 1.8, 0, Math.sin(i / 10 * Math.PI) * 0.075));
  const windBands = batch('storm-bands', ribbonGeometry(windPath, 0.20), 0x315b63, 0.16);
  const windStreaks = batch('storm-streaks', ribbonGeometry(windPath, 0.037), 0xd6e7df, 0.40);
  const windHeads = batch('storm-direction-heads', ribbonGeometry([
    new THREE.Vector3(1.52, 0, -0.13), new THREE.Vector3(1.80, 0, 0), new THREE.Vector3(1.52, 0, 0.13),
  ], 0.038), 0xe9eee0, 0.48);
  const riskRing = batch('exposure-rings', arcGeometry(1.43, 0.042, 0, TAU), 0xffffff, 0.50);
  const surf = batch('windward-surf', arcGeometry(1.33, 0.072, Math.PI - 0.84, Math.PI + 0.84, 26), 0xf8f5de, 0.76);
  const surfEcho = batch('windward-surf-echo', arcGeometry(1.33, 0.028, Math.PI - 0.67, Math.PI + 0.67, 24), 0xe2ede5, 0.42);
  const recoveryRing = batch('stress-recovery-rings', arcGeometry(1.41, 0.041, 0, TAU), 0xc3edbf, 0.60);
  const interceptionSurf = batch('breakwater-interception', arcGeometry(1.34, 0.085, Math.PI - 0.90, Math.PI + 0.90, 28), 0xf1f3d4, 0.85);
  const growthRing = batch('harvest-growth-rings', arcGeometry(1.40, 0.065, 0, TAU), 0xffd48c, 0.86);

  function place(mesh: THREE.InstancedMesh, index: number, position: THREE.Vector3, height: number, scale = 1, bearing = 0, length = scale) {
    if (index >= CAPACITY) return;
    transform.position.set(position.x, height, position.z);
    transform.quaternion.setFromAxisAngle(rotationAxis, bearing);
    transform.scale.set(length, 1, scale);
    transform.updateMatrix();
    mesh.setMatrixAt(index, transform.matrix);
  }

  function cells(mesh: THREE.InstancedMesh, positions: THREE.Vector3[], height: number) {
    mesh.count = Math.min(positions.length, CAPACITY);
    positions.slice(0, CAPACITY).forEach((position, index) => place(mesh, index, position, height));
    mesh.instanceMatrix.needsUpdate = true;
  }

  function update(next: WeatherVisualConfig) {
    if (disposed) return;
    config = next;
    const afterDrift = next.preview || next.stage === 'weather' || next.stage === 'harvest';
    const source = afterDrift ? next.forecast.state : next.state;
    const weather = next.forecast.weather;
    direction = hexPosition(DIRECTIONS[weather.direction]).sub(hexPosition({ q: 0, r: 0 })).normalize();
    crosswind.set(-direction.z, 0, direction.x);
    angle = Math.atan2(-direction.z, direction.x);
    // Shelter is tested before same-tide growth, even when drawing after drift.
    const beforeById = new Map(next.state.islands.map(island => [island.id, island]));
    located = source.islands.map(island => ({
      island: { ...island, growth: beforeById.get(island.id)?.growth ?? island.growth },
      position: hexPosition(island),
      sheltered: afterDrift ? next.forecast.shelteredIds.includes(island.id) : getIslandStats(next.state, island.id).sheltered,
      stressAfter: next.forecast.state.islands.find(item => item.id === island.id)?.stress ?? island.stress,
    }));
    exposed = weather.storm ? located.filter(item => !item.sheltered) : [];
    recovering = located.filter(item => item.sheltered && (beforeById.get(item.island.id)?.stress ?? 0) > item.stressAfter);
    growing = located.filter(item => (next.forecast.state.islands.find(after => after.id === item.island.id)?.growth ?? 0) > (beforeById.get(item.island.id)?.growth ?? 0));
    // A breakwater stops direct incoming waves without gaining stress. If an
    // upstream island already shelters it, the sea here should remain quiet.
    intercepting = weather.storm ? located.filter(item => item.island.building === 'breakwater' && !located.some(other =>
      other.island.id !== item.island.id && shelterCells(other.island, weather.direction).some(cell => hexKey(cell) === hexKey(item.island)),
    )) : [];

    const ordinaryCells = new Map<string, Hex>();
    const focusCells = new Map<string, Hex>();
    if (weather.storm) {
      for (const item of located) {
        const special = item.island.building === 'breakwater' || item.island.id === next.selectedId;
        const target = special ? focusCells : ordinaryCells;
        for (const cell of shelterCells(item.island, weather.direction)) target.set(hexKey(cell), cell);
        if (item.island.building === 'breakwater') target.set(hexKey(item.island), item.island);
      }
    }
    for (const key of focusCells.keys()) ordinaryCells.delete(key);
    const ordinaryPositions = [...ordinaryCells.values()].map(hexPosition);
    const focusPositions = [...focusCells.values()].map(hexPosition);
    wakePositions = [...ordinaryPositions, ...focusPositions];
    cells(wakeFill, ordinaryPositions, 0.071); cells(wakeEdges, ordinaryPositions, 0.076);
    cells(focusedFill, focusPositions, 0.077); cells(focusedEdges, focusPositions, 0.083);

    const proposedCells = new Map<string, Hex>();
    const proposed = next.breakwaterPreview;
    if (proposed) {
      const built = proposed.state.islands.find(island => island.id === next.selectedId && island.building === 'breakwater');
      const after = proposed.forecast.state.islands.find(island => island.id === built?.id);
      if (built && after) {
        const blocker = { ...after, growth: built.growth };
        proposedCells.set(hexKey(blocker), blocker);
        for (const cell of shelterCells(blocker, proposed.forecast.weather.direction)) proposedCells.set(hexKey(cell), cell);
      }
    }
    const proposedPositions = [...proposedCells.values()].map(hexPosition);
    cells(candidateFill, proposedPositions, 0.092); cells(candidateEdges, proposedPositions, 0.098);
    riskRing.count = exposed.length;
    exposed.forEach((item, index) => {
      place(riskRing, index, item.position, 0.102);
      color.set(item.stressAfter >= 3 ? 0xe77c5e : 0xf2b780);
      riskRing.setColorAt(index, color);
    });
    riskRing.instanceMatrix.needsUpdate = true;
    if (riskRing.instanceColor) riskRing.instanceColor.needsUpdate = true;
    animate(lastTime, lastReducedMotion);
  }

  function animate(timeSeconds: number, reducedMotion: boolean) {
    if (!config || disposed) return;
    lastTime = timeSeconds; lastReducedMotion = reducedMotion;
    const time = reducedMotion ? 2.75 : timeSeconds;
    const weather = config.forecast.weather;
    const activeWeather = config.stage === 'weather';
    const activeRecovery = activeWeather || config.stage === 'harvest';
    const storm = weather.storm;
    const count = storm ? (config.quality === 'high' ? 48 : 26) : 0;
    windBands.count = count; windStreaks.count = count; windHeads.count = Math.ceil(count / 3);
    const speed = (activeWeather ? 4.7 : 1.9) + weather.strength * 0.5;
    for (let i = 0; i < count; i++) {
      const lane = (fraction(i * 0.6180339887 + 0.23) - 0.5) * 28;
      const travel = (fraction(i * 0.3819660113 + time * speed / 30) - 0.5) * 30;
      point.copy(direction).multiplyScalar(travel).addScaledVector(crosswind, lane);
      const onBoard = point.lengthSq() < 198;
      // Keep the real shelter cells visually quiet as the storm passes around them.
      const protectedWater = wakePositions.some(position => position.distanceToSquared(point) < 2.10);
      const scale = onBoard && !protectedWater ? 0.78 + fraction(i * 0.7321) * 0.52 : 0;
      const length = scale * (1.03 + weather.strength * 0.20);
      place(windBands, i, point, 0.061, scale, angle, length);
      place(windStreaks, i, point, 0.066, scale, angle, length);
      if (i % 3 === 0) place(windHeads, i / 3, point, 0.068, scale, angle, length);
    }
    (windBands.material as THREE.MeshBasicMaterial).opacity = activeWeather ? 0.28 : 0.16;
    (windStreaks.material as THREE.MeshBasicMaterial).opacity = activeWeather ? 0.72 : 0.38;
    (windHeads.material as THREE.MeshBasicMaterial).opacity = activeWeather ? 0.84 : 0.48;
    for (const mesh of [windBands, windStreaks, windHeads]) mesh.instanceMatrix.needsUpdate = true;

    surf.count = exposed.length; surfEcho.count = exposed.length;
    exposed.forEach((item, index) => {
      const phase = fraction(time * (activeWeather ? 1.45 : 0.60) + index * 0.37);
      // Incoming crests tighten onto the windward shore; the second crest trails offshore.
      place(surf, index, item.position, 0.118, 1 + (1 - phase) * 0.20, angle);
      place(surfEcho, index, item.position, 0.115, 1.19 + (1 - phase) * 0.19, angle);
    });
    (surf.material as THREE.MeshBasicMaterial).opacity = activeWeather ? 0.94 : 0.48;
    (surfEcho.material as THREE.MeshBasicMaterial).opacity = activeWeather ? 0.60 : 0.24;
    (riskRing.material as THREE.MeshBasicMaterial).opacity = activeWeather ? 0.86 : 0.51;
    surf.instanceMatrix.needsUpdate = true; surfEcho.instanceMatrix.needsUpdate = true;

    interceptionSurf.count = activeWeather ? intercepting.length : 0;
    intercepting.forEach((item, index) => {
      const phase = fraction(time * 1.45 + index * 0.37);
      place(interceptionSurf, index, item.position, 0.125, 1 + (1 - phase) * 0.17, angle);
    });
    interceptionSurf.instanceMatrix.needsUpdate = true;
    (interceptionSurf.material as THREE.MeshBasicMaterial).opacity = reducedMotion ? 0.84 : 0.67 + Math.sin(time * 4.1) * 0.17;

    growthRing.count = config.stage === 'harvest' ? growing.length : 0;
    growing.forEach((item, index) => {
      const phase = fraction(time * 0.66 + index * 0.12);
      place(growthRing, index, item.position, 0.136, 1 + phase * 0.23);
    });
    growthRing.instanceMatrix.needsUpdate = true;
    (growthRing.material as THREE.MeshBasicMaterial).opacity = reducedMotion ? 0.86 : 0.72 + Math.sin(time * 2.8) * 0.14;

    recoveryRing.count = activeRecovery ? recovering.length : 0;
    recovering.forEach((item, index) => {
      const phase = fraction(time * 0.75 + index * 0.18);
      place(recoveryRing, index, item.position, 0.112, 1 + phase * 0.16);
    });
    recoveryRing.instanceMatrix.needsUpdate = true;
    (recoveryRing.material as THREE.MeshBasicMaterial).opacity = reducedMotion ? 0.78 : 0.56 + Math.sin(time * 2.1) * 0.16;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    meshes.forEach(mesh => mesh.dispose());
    group.clear();
    located = []; exposed = []; recovering = []; intercepting = []; growing = []; wakePositions = []; config = null;
  }

  return { group, update, animate, dispose };
}