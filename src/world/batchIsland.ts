import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Batch an exclusively owned procedural island after islandId metadata is assigned. */
export function batchIsland(group: THREE.Group): void {
  group.updateWorldMatrix(true, true);
  const toLocal = group.matrixWorld.clone().invert();
  const batches = new Map<string, THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>[]>();
  const transforms = new Map<THREE.Object3D, THREE.Matrix4>();
  group.traverse(object => {
    if (!(object instanceof THREE.Mesh) || object instanceof THREE.SkinnedMesh || object instanceof THREE.InstancedMesh || object.children.length || !object.visible) return;
    if (Array.isArray(object.material) || !(object.material instanceof THREE.MeshStandardMaterial) || object.material.type !== 'MeshStandardMaterial') return;
    const material = object.material;
    if (material.transparent || material.opacity !== 1 || Object.values(material).some(value => value instanceof THREE.Texture)) return;
    if (material.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile || material.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey) return;
    if (object.morphTargetInfluences || Object.keys(object.geometry.morphAttributes).length || object.name === 'sparkle') return;
    for (let parent: THREE.Object3D | null = object; parent && parent !== group; parent = parent.parent) {
      if (!parent.visible || parent.name === 'bell-holder' || parent.animations.length || parent.userData.batchStatic === false) return;
    }
    const geometry: THREE.BufferGeometry = object.geometry;
    if (geometry.drawRange.start !== 0 || geometry.drawRange.count !== Infinity) return;
    const attributes = Object.entries(geometry.attributes).sort(([a], [b]) => a.localeCompare(b));
    if (attributes.some(([, attribute]) => !(attribute instanceof THREE.BufferAttribute) || attribute.usage !== THREE.StaticDrawUsage)) return;
    const transform = toLocal.clone().multiply(object.matrixWorld);
    // Reflections need triangle winding repair; leave any such mesh unchanged.
    if (transform.determinant() <= 0) return;
    const { uuid: _uuid, name: _name, metadata: _metadata, ...materialState } = material.toJSON();
    const key = JSON.stringify([
      materialState, Boolean(geometry.index),
      attributes.map(([name, attribute]) => [name, attribute.itemSize, attribute.normalized, attribute.array.constructor.name]),
      object.castShadow, object.receiveShadow, object.renderOrder, object.layers.mask, object.frustumCulled, object.userData,
    ]);
    const batch = batches.get(key) ?? []; batch.push(object as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>); batches.set(key, batch);
    transforms.set(object, transform);
  });
  const removedGeometry = new Set<THREE.BufferGeometry>(), removedMaterial = new Set<THREE.Material>();
  for (const objects of batches.values()) {
    if (objects.length < 2) continue;
    const geometryCopies = objects.map(object => object.geometry.clone().applyMatrix4(transforms.get(object)!));
    const merged = mergeGeometries(geometryCopies, false);
    geometryCopies.forEach(geometry => geometry.dispose());
    if (!merged) continue;
    merged.computeBoundingBox(); merged.computeBoundingSphere();
    const first = objects[0], mesh = new THREE.Mesh(merged, first.material);
    mesh.name = 'Batched island scenery'; mesh.userData = { ...first.userData };
    mesh.castShadow = first.castShadow; mesh.receiveShadow = first.receiveShadow;
    mesh.renderOrder = first.renderOrder; mesh.layers.mask = first.layers.mask; mesh.frustumCulled = first.frustumCulled;
    group.add(mesh);
    for (const object of objects) { removedGeometry.add(object.geometry); removedMaterial.add(object.material); object.removeFromParent(); }
  }
  // Source geometries/materials are private to makeIsland. Retain anything still in use locally.
  group.traverse(object => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Line)) return;
    removedGeometry.delete(object.geometry);
    (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => removedMaterial.delete(material));
  });
  removedGeometry.forEach(geometry => geometry.dispose()); removedMaterial.forEach(material => material.dispose());
}
