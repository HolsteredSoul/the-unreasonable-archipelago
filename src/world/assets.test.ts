import { afterEach, expect, it, vi } from 'vitest';
import { worldAsset } from './assets';

afterEach(() => vi.unstubAllEnvs());

it('loads both hero models under the deployment base and keeps local URLs at the root', () => {
  vi.stubEnv('BASE_URL', '/the-unreasonable-archipelago/');
  expect(worldAsset('whale.glb')).toBe('/the-unreasonable-archipelago/assets/whale.glb');
  expect(worldAsset('bell-flower.glb')).toBe('/the-unreasonable-archipelago/assets/bell-flower.glb');
  vi.stubEnv('BASE_URL', '/');
  expect(worldAsset('whale.glb')).toBe('/assets/whale.glb');
});
