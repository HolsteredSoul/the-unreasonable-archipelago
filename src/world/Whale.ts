import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { worldAsset } from './assets';

/** A visual passenger: loading, animation, or fallback availability never changes game state. */
export function createWhaleVisual() {
  const group = new THREE.Group();
  group.name = 'Courteous whale encounter';
  const pose = new THREE.Group(); group.add(pose);
  let disposed = false, mixer: THREE.AnimationMixer | null = null, model: THREE.Group | null = null;
  const fallback = new THREE.Group(); pose.add(fallback);
  const dark = new THREE.MeshStandardMaterial({ color: 0x497b83, roughness: 0.88, flatShading: true });
  const pale = new THREE.MeshStandardMaterial({ color: 0xd4e2ce, roughness: 0.9, flatShading: true });
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x173d44 });
  const addPart = (geometry: THREE.BufferGeometry, material: THREE.Material, position: THREE.Vector3, scale: THREE.Vector3, rotation = 0) => {
    const part = new THREE.Mesh(geometry, material); part.position.copy(position); part.scale.copy(scale); part.rotation.z = rotation; fallback.add(part); return part;
  };
  addPart(new THREE.IcosahedronGeometry(1, 2), dark, new THREE.Vector3(0, 0.12, 0.25), new THREE.Vector3(1.12, 0.58, 2.37));
  addPart(new THREE.IcosahedronGeometry(1, 1), pale, new THREE.Vector3(0, -0.24, 0.45), new THREE.Vector3(0.87, 0.27, 1.9));
  addPart(new THREE.IcosahedronGeometry(1, 1), dark, new THREE.Vector3(0, 0.07, -2.05), new THREE.Vector3(0.37, 0.28, 0.86));
  for (const sign of [-1, 1]) {
    addPart(new THREE.IcosahedronGeometry(1, 1), dark, new THREE.Vector3(sign * 0.77, 0.05, -2.6), new THREE.Vector3(0.97, 0.13, 0.46));
    const flipper = addPart(new THREE.IcosahedronGeometry(1, 1), dark, new THREE.Vector3(sign * 1.25, -0.01, 0.6), new THREE.Vector3(1.05, 0.14, 0.32)); flipper.rotation.y = sign * 0.45;
    addPart(new THREE.SphereGeometry(0.072, 8, 6), eyeMaterial, new THREE.Vector3(sign * 0.85, 0.3, 1.67), new THREE.Vector3(1, 1, 1));
  }
  const dorsal = addPart(new THREE.ConeGeometry(0.33, 0.73, 3), dark, new THREE.Vector3(0, 0.71, -0.5), new THREE.Vector3(0.4, 1, 1)); dorsal.rotation.x = -0.25;
  const wakeGeometry = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 65 }, (_, i) => new THREE.Vector3(Math.sin(i / 64 * Math.PI * 2) * 2.4, -0.25, Math.cos(i / 64 * Math.PI * 2) * 3.35)));
  const wakeMaterial = new THREE.LineBasicMaterial({ color: 0xd5eece, transparent: true, opacity: 0.28 });
  const wake = new THREE.Line(wakeGeometry, wakeMaterial); group.add(wake);
  const spray = new THREE.Group(); pose.add(spray);
  const sprayMaterial = new THREE.MeshBasicMaterial({ color: 0xe2f4de, transparent: true, opacity: 0.72 });
  for (let i = 0; i < 6; i++) {
    const drop = new THREE.Mesh(new THREE.IcosahedronGeometry(0.058, 0), sprayMaterial); spray.add(drop);
  }
  function release(root: THREE.Object3D) {
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
    root.traverse(child => { if (child instanceof THREE.Mesh || child instanceof THREE.Line) { geometries.add(child.geometry); (Array.isArray(child.material) ? child.material : [child.material]).forEach(material => materials.add(material)); } });
    geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
  }
  new GLTFLoader().load(worldAsset('whale.glb'), gltf => {
    if (disposed) { release(gltf.scene); return; }
    model = gltf.scene; model.traverse(child => { if (child instanceof THREE.Mesh) { child.castShadow = false; child.receiveShadow = false; } });
    fallback.visible = false; pose.add(model);
    if (gltf.animations.length) {
      mixer = new THREE.AnimationMixer(model);
      const swim = gltf.animations.find(clip => clip.name === 'GentleSwim') ?? gltf.animations[0]; mixer.clipAction(swim).play();
    }
  }, undefined, () => { /* The finned, eyed procedural whale remains visible. */ });
  return {
    group,
    tick(delta: number, elapsed: number, reducedMotion: boolean, quality: 'high' | 'low', visiting: boolean, reacting: boolean) {
      if (mixer && !reducedMotion) mixer.update(delta * (reacting ? 1.7 : 1));
      pose.position.y = reducedMotion ? 0 : Math.sin(elapsed * 1.1) * 0.045 + (reacting ? Math.sin(elapsed * 5) * 0.055 : 0);
      pose.rotation.z = reducedMotion ? 0 : Math.sin(elapsed * 0.55) * 0.018;
      const breath = (elapsed % 8) / 1.5;
      spray.visible = visiting && quality === 'high' && !reducedMotion && breath < 1;
      if (spray.visible) spray.children.forEach((drop, i) => {
        const phase = (breath + i * 0.11) % 1;
        drop.position.set(Math.sin(i * 2.4) * phase * 0.4, 0.7 + Math.sin(phase * Math.PI) * 1.05, 1.25 + Math.cos(i * 2.4) * phase * 0.25);
      });
      wakeMaterial.opacity = visiting ? 0.4 : 0.2;
    },
    dispose() {
      disposed = true; mixer?.stopAllAction(); if (model) mixer?.uncacheRoot(model);
      group.removeFromParent(); release(group);
    },
  };
}
