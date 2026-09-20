import { afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { batchIsland } from './batchIsland';

afterEach(() => vi.restoreAllMocks());
const makeMaterial = () => new THREE.MeshStandardMaterial({ color: 0x89ac75, roughness: 0.86, metalness: 0.1 });
function makeMesh(geometry = new THREE.BoxGeometry(0.8, 1, 0.9), material = makeMaterial()) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData = { islandId: 'test-island', pickable: true };
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}
function meshes(root: THREE.Object3D): THREE.Mesh[] {
  const result: THREE.Mesh[] = []; root.traverse(object => { if (object instanceof THREE.Mesh) result.push(object); }); return result;
}
function renderingSignature(mesh: THREE.Mesh): string {
  const material = mesh.material as THREE.MeshStandardMaterial;
  return JSON.stringify({ color: material.color.getHex(), roughness: material.roughness, metalness: material.metalness, side: material.side, castShadow: mesh.castShadow, receiveShadow: mesh.receiveShadow, renderOrder: mesh.renderOrder, layers: mesh.layers.mask, picking: mesh.userData });
}
function uvValues(root: THREE.Object3D): number[] {
  return meshes(root).flatMap(mesh => Array.from(mesh.geometry.getAttribute('uv').array)).sort((a, b) => a - b);
}

describe('static island batching', () => {
  it('preserves nested transformed geometry, picking, UVs, and distinct rendering flags', () => {
    const root = new THREE.Group(); root.position.set(1.3, 0.4, -0.8); root.rotation.y = 0.37; root.scale.set(1.25, 0.85, 0.95);
    const parent = new THREE.Group(); parent.position.set(-1.1, 0.3, 0.6); parent.rotation.set(0.12, -0.24, 0.15); parent.scale.set(0.9, 1.3, 1.6); root.add(parent);
    for (let index = 0; index < 6; index++) {
      const mesh = makeMesh(); mesh.position.set(index * 2.2 - 5.5, index % 2 * 0.4, index % 2 * 1.8); mesh.rotation.set(0.08 * index, 0.13 * index, -0.04 * index); mesh.scale.set(1 + index * 0.03, 0.8, 1.1);
      mesh.receiveShadow = index < 4; mesh.renderOrder = index < 4 ? 0 : 2;
      if (index === 2 || index === 3) { mesh.material.color.setHex(0xc28a73); mesh.layers.set(2); }
      const uv = mesh.geometry.getAttribute('uv'); for (let vertex = 0; vertex < uv.count; vertex++) uv.setXY(vertex, index * 0.13 + vertex * 0.003, index * 0.07 + vertex * 0.005);
      parent.add(mesh);
    }
    root.updateWorldMatrix(true, true);
    const originals = meshes(root), bounds = new THREE.Box3().setFromObject(root, true), beforeUV = uvValues(root);
    const signatures = new Set(originals.map(renderingSignature));
    const rays = originals.map(mesh => {
      const center = mesh.getWorldPosition(new THREE.Vector3());
      const ray = new THREE.Raycaster(center.clone().add(new THREE.Vector3(0, 12, 0)), new THREE.Vector3(0, -1, 0)); ray.layers.enableAll();
      return ray;
    });
    const beforeHits = rays.map(ray => ray.intersectObjects(root.children, true)[0]);
    expect(beforeHits.every(Boolean)).toBe(true);
    batchIsland(root); root.updateWorldMatrix(true, true);
    expect(meshes(root)).toHaveLength(3);
    expect(new Set(meshes(root).map(renderingSignature))).toEqual(signatures);
    expect(uvValues(root)).toEqual(beforeUV);
    const afterBounds = new THREE.Box3().setFromObject(root, true);
    expect(afterBounds.min.distanceTo(bounds.min)).toBeLessThan(0.00001);
    expect(afterBounds.max.distanceTo(bounds.max)).toBeLessThan(0.00001);
    rays.forEach((ray, index) => {
      const hit = ray.intersectObjects(root.children, true)[0];
      expect(hit.object.userData).toEqual(beforeHits[index].object.userData);
      expect(hit.distance).toBeCloseTo(beforeHits[index].distance, 5);
      expect(renderingSignature(hit.object as THREE.Mesh)).toBe(renderingSignature(beforeHits[index].object as THREE.Mesh));
    });
  });

  it('leaves reflected, morphing, hero, animated, textured, transparent, and line objects untouched', () => {
    const root = new THREE.Group(); root.add(makeMesh(), makeMesh());
    const reflected = new THREE.Group(); reflected.scale.x = -1; reflected.add(makeMesh(), makeMesh()); root.add(reflected);
    const hero = new THREE.Group(); hero.name = 'bell-holder'; hero.add(makeMesh(), makeMesh()); root.add(hero);
    const animated = new THREE.Group(); animated.animations.push(new THREE.AnimationClip('Breathe', 1, [])); animated.add(makeMesh(), makeMesh()); root.add(animated);
    const morphGeometry = new THREE.BoxGeometry(); morphGeometry.morphAttributes.position = [morphGeometry.getAttribute('position').clone()];
    const morph = makeMesh(morphGeometry); root.add(morph);
    const transparent = makeMesh(); transparent.material.transparent = true; transparent.material.opacity = 0.3; root.add(transparent);
    const textured = makeMesh(); textured.material.map = new THREE.Texture(); root.add(textured);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]), new THREE.LineBasicMaterial()); root.add(line);
    const excluded = [...reflected.children, ...hero.children, ...animated.children, morph, transparent, textured, line].map(object => ({ object, parent: object.parent, geometry: (object as THREE.Mesh).geometry, material: (object as THREE.Mesh).material }));
    const beforeCount = meshes(root).length;
    batchIsland(root);
    expect(meshes(root).length).toBe(beforeCount - 1);
    for (const item of excluded) {
      expect(item.object.parent).toBe(item.parent);
      expect((item.object as THREE.Mesh).geometry).toBe(item.geometry);
      expect((item.object as THREE.Mesh).material).toBe(item.material);
    }
    expect(morph.morphTargetInfluences).toEqual([0]);
  });

  it('disposes orphaned sources while retaining geometry and materials referenced by excluded local meshes', () => {
    const root = new THREE.Group(), first = makeMesh(), shared = makeMesh(), orphan = makeMesh();
    const survivor = makeMesh(shared.geometry, shared.material); survivor.name = 'sparkle';
    root.add(first, shared, orphan, survivor);
    const sharedGeometryDispose = vi.spyOn(shared.geometry, 'dispose'), sharedMaterialDispose = vi.spyOn(shared.material, 'dispose');
    const orphanGeometryDispose = vi.spyOn(orphan.geometry, 'dispose'), orphanMaterialDispose = vi.spyOn(orphan.material, 'dispose');
    const firstGeometryDispose = vi.spyOn(first.geometry, 'dispose'), firstMaterialDispose = vi.spyOn(first.material, 'dispose');
    batchIsland(root);
    expect(meshes(root)).toHaveLength(2);
    expect(survivor.parent).toBe(root);
    expect(sharedGeometryDispose).not.toHaveBeenCalled(); expect(sharedMaterialDispose).not.toHaveBeenCalled();
    expect(orphanGeometryDispose).toHaveBeenCalledOnce(); expect(orphanMaterialDispose).toHaveBeenCalledOnce();
    expect(firstGeometryDispose).toHaveBeenCalledOnce(); expect(firstMaterialDispose).not.toHaveBeenCalled();
    expect(meshes(root).some(mesh => mesh !== survivor && mesh.material === first.material)).toBe(true);
  });
});
