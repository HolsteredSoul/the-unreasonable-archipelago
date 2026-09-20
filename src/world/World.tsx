import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Hex, Island, WorldProps } from '../game/types';
import { getConnectedIds, getIslandStats } from '../game';
import { hexDistance, missingConnection, sameHex, shelterCells, tideProduction } from './planning';
import './world.css';
import './planning.css';

const SPACING = 1.75;
const LAND_HEIGHT = 0.57;
const AXIAL: Hex[] = [{q:1,r:0},{q:0,r:1},{q:-1,r:1},{q:-1,r:0},{q:0,r:-1},{q:1,r:-1}];
const PALETTE = { cream: 0xffedc7, stone: 0xf2dba8, grass: 0x9caf70, coral: 0xe58b70, roof: 0xd96c55, wood: 0xa97551, leaf: 0x668970, lightLeaf: 0x91a16a, dark: 0x315b54, gold: 0xefc27c };
const hexPosition = (hex: Hex) => new THREE.Vector3(Math.sqrt(3) * (hex.q + hex.r / 2) * SPACING, 0, 1.5 * hex.r * SPACING);
function randomFor(value: string) {
  let seed = 2166136261;
  for (let i = 0; i < value.length; i++) seed = Math.imul(seed ^ value.charCodeAt(i), 16777619);
  return () => { seed += 0x6D2B79F5; let n = seed; n = Math.imul(n ^ n >>> 15, n | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
}
function material(color: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.88, ...extra }); }
function mesh(geometry: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, mat); object.position.set(x,y,z); object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
}
function box(parent: THREE.Object3D, size: [number,number,number], color: THREE.ColorRepresentation, x=0,y=0,z=0) { return mesh(new THREE.BoxGeometry(...size),material(color),parent,x,y,z); }
function cylinder(parent: THREE.Object3D, top: number, bottom: number, height: number, color: THREE.ColorRepresentation, x=0,y=0,z=0, sides=12) { return mesh(new THREE.CylinderGeometry(top,bottom,height,sides),material(color),parent,x,y,z); }
function ball(parent: THREE.Object3D, radius:number, color:THREE.ColorRepresentation,x=0,y=0,z=0, detail=1) { return mesh(new THREE.IcosahedronGeometry(radius,detail),material(color,{flatShading:true}),parent,x,y,z); }
function disposeObject(object: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(); const materials = new Set<THREE.Material>();
  object.traverse(child => { if (child instanceof THREE.Mesh || child instanceof THREE.Line) { if (child.geometry) geometries.add(child.geometry); const list = Array.isArray(child.material) ? child.material : [child.material]; list.forEach((m:THREE.Material)=>materials.add(m)); } });
  geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose());
}
function ringLine(points:THREE.Vector3[], color:THREE.ColorRepresentation, opacity:number, parent:THREE.Object3D, dashed=false) {
  const mat = dashed ? new THREE.LineDashedMaterial({color,transparent:true,opacity,dashSize:0.13,gapSize:0.12}) : new THREE.LineBasicMaterial({color,transparent:true,opacity});
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),mat); if(dashed) line.computeLineDistances(); parent.add(line); return line;
}
function circlePoints(radius:number,y=0,count=64) { return Array.from({length:count+1},(_,i)=>new THREE.Vector3(Math.cos(i/count*Math.PI*2)*radius,y,Math.sin(i/count*Math.PI*2)*radius)); }

// Mesh ribbons keep chart marks readable where WebGL lines stay one pixel wide.
function seaStroke(points: THREE.Vector3[], color: THREE.ColorRepresentation, width: number, opacity: number, parent: THREE.Object3D) {
  const vertices: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1], to = points[i];
    const side = new THREE.Vector3(-(to.z - from.z), 0, to.x - from.x).normalize().multiplyScalar(width / 2);
    const corners = [from.clone().add(side), from.clone().sub(side), to.clone().add(side), to.clone().sub(side)];
    for (const index of [0, 1, 2, 1, 3, 2]) vertices.push(...corners[index].toArray());
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const stroke = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }));
  parent.add(stroke);
  return stroke;
}

function seaArrow(from: THREE.Vector3, to: THREE.Vector3, color: THREE.ColorRepresentation, parent: THREE.Object3D, width = 0.065) {
  seaStroke([from, to], color, width, 0.88, parent);
  const direction = to.clone().sub(from).normalize(), side = new THREE.Vector3(-direction.z, 0, direction.x);
  seaStroke([to.clone().addScaledVector(direction, -0.33).addScaledVector(side, 0.23), to, to.clone().addScaledVector(direction, -0.33).addScaledVector(side, -0.23)], color, width, 0.96, parent);
}

function makeHouse(parent:THREE.Object3D,x:number,z:number,scale:number,rotation:number,color=PALETTE.coral) {
  const group = new THREE.Group(); group.position.set(x,LAND_HEIGHT,z); group.rotation.y=rotation; group.scale.setScalar(scale); parent.add(group);
  box(group,[0.36,0.42,0.37],PALETTE.cream,0,0.2,0);
  const roof = new THREE.CylinderGeometry(0.34,0.34,0.45,3,1); roof.rotateZ(Math.PI/2); roof.rotateY(Math.PI/2);
  mesh(roof,material(color),group,0,0.43,0);
  box(group,[0.095,0.2,0.012],PALETTE.dark,0,0.1,0.194);
  for (const side of [-1,1]) box(group,[0.063,0.075,0.016],0xe8b86d,side*0.11,0.26,0.199);
  box(group,[0.065,0.26,0.08],PALETTE.stone,0.1,0.56,-0.08);
  box(group,[0.38,0.025,0.14],PALETTE.stone,0,0.018,0.23);
  return group;
}
function makeTree(parent:THREE.Object3D,x:number,z:number,scale:number,variant:number) {
  const group = new THREE.Group(); group.position.set(x,LAND_HEIGHT,z); group.scale.setScalar(scale); parent.add(group);
  cylinder(group,0.025,0.055,0.5,PALETTE.wood,0,0.25,0,6);
  if (variant > 0.5) {
    for(let i=0;i<3;i++) { const crown=mesh(new THREE.ConeGeometry(0.27-i*0.055,0.49,7),material(i===0?PALETTE.leaf:PALETTE.lightLeaf),group,0,0.43+i*0.17,0); crown.rotation.y=i; }
  } else { ball(group,0.28,PALETTE.leaf,0,0.6,0); ball(group,0.23,PALETTE.lightLeaf,0.14,0.63,0.05); ball(group,0.22,PALETTE.lightLeaf,-0.13,0.72,-0.04); }
}

function makeBellFallback() {
  const group = new THREE.Group();
  cylinder(group,0.21,0.32,0.17,PALETTE.cream,0,0.085,0);
  cylinder(group,0.055,0.1,0.75,PALETTE.leaf,0,0.48,0,9);
  for(let i=0;i<4;i++) {
    const a=i*Math.PI/2; const leaf=ball(group,0.27,PALETTE.lightLeaf,Math.cos(a)*0.18,0.35,Math.sin(a)*0.18); leaf.scale.set(0.45,0.3,1.2); leaf.rotation.y=-a+Math.PI/2; leaf.rotation.z=0.3;
  }
  const profile=[new THREE.Vector2(0.04,0.03),new THREE.Vector2(0.3,0.06),new THREE.Vector2(0.37,0.14),new THREE.Vector2(0.22,0.31),new THREE.Vector2(0.14,0.53),new THREE.Vector2(0.02,0.57)];
  mesh(new THREE.LatheGeometry(profile,24),material(PALETTE.gold,{metalness:0.3,roughness:0.4,side:THREE.DoubleSide}),group,0,0.95,0);
  ball(group,0.065,PALETTE.wood,0,0.98,0);
  for(let i=0;i<7;i++) {
    const a=i/7*Math.PI*2;
    const petal=ball(group,0.36,i%2===0?0xf6b2a0:0xec8b7a,Math.cos(a)*0.32,1.4,Math.sin(a)*0.32,2); petal.scale.set(0.48,1.2,0.55); petal.rotation.z=-Math.cos(a)*0.75; petal.rotation.x=Math.sin(a)*0.75;
  }
  return group;
}

function makeIsland(island:Island, seed:string, hero:THREE.Group|null) {
  const group=new THREE.Group(); const random=randomFor(`${seed}:${island.id}`); const radius=island.kind==='heart'?1.28:1.12;
  const vertices=48; const radii=Array.from({length:vertices},(_,i)=>radius*(0.96+0.04*Math.sin(i*0.8)+random()*0.065));
  const layers=[[1.14,-0.22],[1.08,-0.05],[0.96,0.19],[1.015,0.43],[0.97,LAND_HEIGHT]];
  const positions:number[]=[]; const colors:number[]=[];
  const sideColor=new THREE.Color();
  for(let l=0;l<layers.length-1;l++) for(let i=0;i<vertices;i++) {
    const j=(i+1)%vertices; const a=i/vertices*Math.PI*2,b=j/vertices*Math.PI*2;
    const bottom=layers[l],top=layers[l+1];
    const points=[[Math.cos(a)*radii[i]*bottom[0],bottom[1],Math.sin(a)*radii[i]*bottom[0]],[Math.cos(b)*radii[j]*bottom[0],bottom[1],Math.sin(b)*radii[j]*bottom[0]],[Math.cos(a)*radii[i]*top[0],top[1],Math.sin(a)*radii[i]*top[0]],[Math.cos(b)*radii[j]*top[0],top[1],Math.sin(b)*radii[j]*top[0]]];
    sideColor.set(l===0?0xa4c7b2:l===1?0xd4bc91:PALETTE.cream).multiplyScalar(0.91+random()*0.15);
    for(const n of [0,2,1,1,2,3]) {positions.push(...points[n]);colors.push(sideColor.r,sideColor.g,sideColor.b);}
  }
  const geometry=new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3)); geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3)); geometry.computeVertexNormals();
  mesh(geometry,material(0xffffff,{vertexColors:true,flatShading:true}),group);
  const topShape=new THREE.Shape(); radii.forEach((r,i)=>{const a=i/vertices*Math.PI*2; const x=Math.cos(a)*r*0.97,z=-Math.sin(a)*r*0.97; if(i===0)topShape.moveTo(x,z);else topShape.lineTo(x,z);}); topShape.closePath();
  const top=mesh(new THREE.ShapeGeometry(topShape),material(PALETTE.grass,{side:THREE.DoubleSide}),group,0,LAND_HEIGHT,0);top.rotation.x=-Math.PI/2;
  const shore=radii.map((r,i)=>new THREE.Vector3(Math.cos(i/vertices*Math.PI*2)*r*1.15,0.025,Math.sin(i/vertices*Math.PI*2)*r*1.15)); shore.push(shore[0].clone());
  ringLine(shore,0xe7f9df,0.65,group); ringLine(shore.map(v=>new THREE.Vector3(v.x*1.11,0.02,v.z*1.11)),0xc1eade,0.3,group);
  const shallows=mesh(new THREE.CircleGeometry(radius*1.52,48),new THREE.MeshBasicMaterial({color:0x76c5b3,transparent:true,opacity:0.21,depthWrite:false}),group,0,-0.005,0);shallows.rotation.x=-Math.PI/2;shallows.castShadow=false;shallows.userData.pickable=false;
  // Pale paths connect the little municipal buildings to the shore.
  const path=box(group,[radius*1.5,0.012,0.09],0xd4cf9c,0,LAND_HEIGHT+0.013,0.21);path.rotation.y=-0.18;
  for(let i=0;i<8;i++) {
    const a=random()*Math.PI*2;const r=radius*(0.71+random()*0.2);
    const stone=ball(group,0.06+random()*0.06,i%2?PALETTE.stone:0x809777,Math.cos(a)*r,LAND_HEIGHT+0.02,Math.sin(a)*r,0);stone.scale.y=0.5;
  }
  if(island.kind==='heart') {
    makeHouse(group,-0.46,0.05,1.1,-0.3); makeHouse(group,0.48,0.14,0.85,0.2,0xd6a476);makeHouse(group,-0.14,0.52,0.76,-0.1);makeHouse(group,0.42,-0.5,0.75,0.7);
    const tower=new THREE.Group();tower.position.set(-0.17,LAND_HEIGHT,-0.42);group.add(tower);
    box(tower,[0.33,1.1,0.33],PALETTE.cream,0,0.55,0);box(tower,[0.43,0.07,0.43],PALETTE.stone,0,0.95,0);
    cylinder(tower,0.31,0.31,0.38,PALETTE.roof,0,1.24,0,4).rotation.y=Math.PI/4;
    mesh(new THREE.ConeGeometry(0.34,0.43,4),material(PALETTE.roof),tower,0,1.35,0).rotation.y=Math.PI/4;
    cylinder(tower,0.013,0.013,0.35,PALETTE.wood,0,1.73,0,6);
    const flag=box(tower,[0.24,0.12,0.018],0xf2d49b,0.115,1.81,0);flag.rotation.y=-0.3;
    const clock=mesh(new THREE.CircleGeometry(0.1,20),material(0xfff2ce),tower,0,0.83,0.174);clock.castShadow=false;
    box(tower,[0.012,0.075,0.008],PALETTE.dark,0,0.85,0.18);box(tower,[0.065,0.012,0.008],PALETTE.dark,0.022,0.83,0.18);
    makeTree(group,-0.8,-0.44,0.8,0.1);makeTree(group,0.8,0.5,0.64,0.7);
    // A crooked dock, ladder, and a boat make the town feel inhabited.
    for(let i=0;i<7;i++)box(group,[0.4,0.055,0.13],i%2?0xc69c6b:0xb88e61,0.07,0.24,1.05+i*0.13);
    for(const x of [-0.18,0.32]) for(const z of [1.02,1.68])cylinder(group,0.029,0.035,0.65,PALETTE.wood,x,0.12,z,6);
    const boat=ball(group,0.32,PALETTE.roof,0.62,0.035,1.48);boat.scale.set(0.46,0.4,1.2);boat.rotation.y=-0.3;
  } else if(island.kind==='bell') {
    cylinder(group,0.43,0.49,0.13,PALETTE.cream,0,LAND_HEIGHT+0.065,0);
    const bellHolder=new THREE.Group();bellHolder.name='bell-holder';bellHolder.position.y=LAND_HEIGHT+0.11;group.add(bellHolder);
    const bell=hero?hero.clone(true):makeBellFallback();
    if(hero)bell.traverse(child=>{
      if(child instanceof THREE.Mesh){
        child.geometry=child.geometry.clone();
        child.material=Array.isArray(child.material)?child.material.map(m=>m.clone()):child.material.clone();
        const closedIndex=child.morphTargetDictionary?.Closed;
        if(closedIndex!==undefined&&child.morphTargetInfluences)child.morphTargetInfluences[closedIndex]=1-THREE.MathUtils.clamp(island.growth/3,0,1);
      }
    });
    const growScale=0.78+island.growth*0.15;bell.scale.multiplyScalar(hero?0.8*growScale:growScale);bellHolder.add(bell);
    for(let i=0;i<7;i++){const a=i/7*Math.PI*2;const bud=ball(group,0.055,0xf9bc9c,Math.cos(a)*0.6,LAND_HEIGHT+0.07,Math.sin(a)*0.6);bud.scale.y=1.5;}
    makeHouse(group,-0.59,0.37,0.6,0.2,0xdfab80);makeTree(group,0.57,-0.4,0.65,0.1);
  } else if(island.building==='garden') {
    for(let row=0;row<3;row++) {
      box(group,[0.78,0.055,0.2],0x8f7851,-0.03,LAND_HEIGHT+0.028,-0.35+row*0.27);
      for(const x of [-0.42,0.36])box(group,[0.025,0.085,0.23],PALETTE.wood,x,LAND_HEIGHT+0.035,-0.35+row*0.27);
      for(let c=0;c<5;c++) {const x=-0.32+c*0.145,z=-0.35+row*0.27;const leaf=ball(group,0.085,row===1?0xacc074:0x6e995e,x,LAND_HEIGHT+0.11,z);leaf.scale.y=0.9;if(row===2)ball(group,0.045,0xf3b067,x,LAND_HEIGHT+0.17,z);}
    }
    makeHouse(group,0.61,-0.05,0.64,0.3,0xdd9879);makeTree(group,-0.65,-0.56,0.57,0.1);
    for(let i=0;i<4;i++)cylinder(group,0.018,0.018,0.24,PALETTE.wood,-0.6+i*0.29,LAND_HEIGHT+0.12,0.58,5);
    box(group,[0.9,0.026,0.027],PALETTE.wood,-0.16,LAND_HEIGHT+0.17,0.58);
  } else if(island.building==='grove') {
    for(let i=0;i<7;i++){const a=i*2.399,r=i===0?0:0.3+random()*0.47;makeTree(group,Math.cos(a)*r,Math.sin(a)*r,0.72+random()*0.38,random());}
    makeHouse(group,0.48,0.53,0.58,-0.5,0xb48b65);
    for(let i=0;i<3;i++){const log=cylinder(group,0.065,0.065,0.4,PALETTE.wood,-0.4+i*0.11,LAND_HEIGHT+0.06,0.64,7);log.rotation.x=Math.PI/2;}
  } else if(island.building==='breakwater') {
    for(let i=0;i<6;i++){const a=Math.PI*0.06+i/5*Math.PI*0.85;const rock=ball(group,0.25,PALETTE.stone,Math.cos(a)*0.67,LAND_HEIGHT+0.13,Math.sin(a)*0.67,0);rock.scale.set(0.9,0.82,0.72);}
    const lighthouse=new THREE.Group();lighthouse.position.set(-0.11,LAND_HEIGHT,-0.12);group.add(lighthouse);
    cylinder(lighthouse,0.13,0.23,0.83,PALETTE.cream,0,0.415,0);cylinder(lighthouse,0.15,0.17,0.16,PALETTE.coral,0,0.46,0);cylinder(lighthouse,0.23,0.23,0.07,PALETTE.wood,0,0.85,0);
    cylinder(lighthouse,0.13,0.13,0.2,0xf6cb7b,0,0.99,0);mesh(new THREE.ConeGeometry(0.24,0.23,12),material(PALETTE.roof),lighthouse,0,1.18,0);
    makeHouse(group,-0.61,0.17,0.61,0.5);
  } else {
    makeTree(group,-0.3,-0.14,0.9,0.1);makeTree(group,0.42,-0.45,0.62,0.8);makeHouse(group,0.3,0.27,0.72,0.25,0xdbb780);
    for(let i=0;i<5;i++){const a=random()*6.28;ball(group,0.05,0xf3d3a3,Math.cos(a)*0.7,LAND_HEIGHT+0.07,Math.sin(a)*0.7);}
  }
  if(island.growth>0&&island.kind!=='bell'){
    for(let i=0;i<island.growth;i++)makeTree(group,Math.cos(i*2+2)*0.8,Math.sin(i*2+2)*0.8,0.58,0.7);
  }
  if(island.anchored) {
    const anchor=new THREE.Group();anchor.position.set(-0.8,0.16,0.8);anchor.rotation.z=0.25;group.add(anchor);
    cylinder(anchor,0.027,0.027,0.58,PALETTE.dark,0,0.05,0,8);box(anchor,[0.32,0.045,0.05],PALETTE.dark,0,0.13,0);
    const arc=mesh(new THREE.TorusGeometry(0.18,0.031,6,16,Math.PI),material(PALETTE.dark),anchor,0,-0.11,0);arc.rotation.z=Math.PI;
    ringLine([new THREE.Vector3(0,0.27,0),new THREE.Vector3(0.1,0.5,-0.4),new THREE.Vector3(0.5,0.41,-0.7)],PALETTE.wood,0.85,anchor);
  }
  if(island.nourished) for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const sprout=ball(group,0.03,0xffe3a0,Math.cos(a)*1.05,LAND_HEIGHT+0.08,Math.sin(a)*1.05,0);sprout.name='sparkle';}
  group.traverse(child=>{child.userData.islandId=island.id;});
  group.userData.signature=`${island.kind}|${island.building}|${island.growth}|${island.anchored}|${island.nourished}`;
  return group;
}

const waterVertex=`
  varying vec3 vWorld;
  void main(){vec4 w=modelMatrix*vec4(position,1.0);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}
`;
const waterFragment=`
  uniform float uTime;
  varying vec3 vWorld;
  float wave(vec2 p){return sin(p.x*1.9+p.y*1.3+uTime*.35)*sin(p.y*2.7-p.x*.8-uTime*.25);}
  void main(){
    vec2 p=vWorld.xz;
    float broad=sin(p.x*.12+p.y*.13)*.5+.5;
    vec3 shallow=vec3(.045,.29,.29),deep=vec3(.018,.14,.18);
    vec3 col=mix(shallow,deep,smoothstep(0.,38.,length(p))*.5+broad*.13);
    float ripple=wave(p);
    col+=vec3(.04,.075,.065)*smoothstep(.72,.99,ripple)*.21;
    float silk=sin(p.x*.26+p.y*.35+sin(p.y*.13)*2.+uTime*.07);
        col+=vec3(.006,.018,.017)*silk;
    float swell=sin(p.x*3.6+p.y*.7+sin(p.y*1.2+uTime*.18)*.8-uTime*.24);
    float glint=smoothstep(.988,1.,swell)*smoothstep(.6,.95,sin(p.y*3.1-p.x*.7));
    col+=vec3(.10,.16,.14)*glint*.077;
    gl_FragColor=vec4(col,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

type IslandView={group:THREE.Group;target:THREE.Vector3;label:HTMLButtonElement;signature:string};
type Runtime={update:(props:WorldProps)=>void};

export default function World(props:WorldProps) {
  const host=useRef<HTMLDivElement>(null); const labels=useRef<HTMLDivElement>(null); const latest=useRef(props);latest.current=props;
  const runtime=useRef<Runtime|null>(null);const [error,setError]=useState(false);
  useEffect(()=>{
    const container=host.current, labelContainer=labels.current;if(!container||!labelContainer)return;
    let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch{setError(true);return;}
    let disposed=false,raf=0; const scene=new THREE.Scene();scene.background=new THREE.Color(0x73b9b5);scene.fog=new THREE.Fog(0x73b9b5,37,105);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,latest.current.quality==='high'?1.75:1));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
    renderer.domElement.setAttribute('aria-label','Interactive ocean map. Select an island to manage it. Drag to look around; scroll to zoom.');renderer.domElement.setAttribute('role','img');container.prepend(renderer.domElement);
    const camera=new THREE.OrthographicCamera(-15,15,10,-10,0.1,180);camera.position.set(13,21,26);camera.lookAt(0,0,0);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=0.085;controls.enablePan=true;controls.minZoom=0.64;controls.maxZoom=2.2;controls.minPolarAngle=0.35;controls.maxPolarAngle=1.02;controls.minAzimuthAngle=-0.52;controls.maxAzimuthAngle=0.78;controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};controls.target.set(0,0,-0.25);
    scene.add(new THREE.HemisphereLight(0xfff2ce,0x7baca1,1.85));
    const sun=new THREE.DirectionalLight(0xffe4b6,2.5);sun.position.set(-12,23,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=18;sun.shadow.camera.bottom=-18;sun.shadow.camera.near=1;sun.shadow.camera.far=70;sun.shadow.normalBias=0.045;sun.shadow.bias=-0.0003;scene.add(sun);
    const fill=new THREE.DirectionalLight(0xb9e7dc,0.65);fill.position.set(5,6,-12);scene.add(fill);
    const waterMat=new THREE.ShaderMaterial({uniforms:{uTime:{value:0}},vertexShader:waterVertex,fragmentShader:waterFragment});
    const water=new THREE.Mesh(new THREE.PlaneGeometry(250,250),waterMat);water.rotation.x=-Math.PI/2;water.position.y=-0.07;scene.add(water);
    const shadowFloor=new THREE.Mesh(new THREE.PlaneGeometry(48,48),new THREE.ShadowMaterial({color:0x244f48,opacity:0.15}));shadowFloor.rotation.x=-Math.PI/2;shadowFloor.position.y=-0.055;shadowFloor.receiveShadow=true;scene.add(shadowFloor);
    const islands=new Map<string,IslandView>();const selection=new THREE.Group();scene.add(selection);
    const selectionRing=ringLine(circlePoints(1.55,0.08),0xffe6a7,0.96,selection);ringLine(circlePoints(1.64,0.07),0xffedc4,0.32,selection);selection.visible=false;
    const targetsGroup=new THREE.Group(),previewGroup=new THREE.Group(),currentGroup=new THREE.Group(),boundaryGroup=new THREE.Group();scene.add(targetsGroup,previewGroup,currentGroup,boundaryGroup);
    const targetMeshes:THREE.Object3D[]=[];
    const driftParticles: { object: THREE.Mesh; from: THREE.Vector3; to: THREE.Vector3; phase: number }[] = [];
    const chartLabels: { label: HTMLSpanElement; position: THREE.Vector3; width: number; height: number }[] = [];
    function chartLabel(text: string, position: THREE.Vector3, className = '') {
      const label = document.createElement('span'); label.className = `world-map-note ${className}`; label.textContent = text; label.setAttribute('aria-hidden', 'true');
      labelContainer!.append(label); chartLabels.push({ label, position, width: label.offsetWidth, height: label.offsetHeight });
    }
    let hero:THREE.Group|null=null,lastSeed='';
    let projectedWidth=30;
    // A fine perimeter is a chart mark, not a wall around the world.
    // Outline the outside edges of valid hexes, leaving boundary-cell islands inside the chart.
    for(let q=-4;q<=4;q++)for(let r=-4;r<=4;r++){
      if(Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r))>4)continue;
      const center=hexPosition({q,r});
      for(const direction of AXIAL){
        const nextQ=q+direction.q,nextR=r+direction.r;
        if(Math.max(Math.abs(nextQ),Math.abs(nextR),Math.abs(nextQ+nextR))<=4)continue;
        const normal=hexPosition(direction),angle=Math.atan2(normal.z,normal.x);
        const points=[angle-Math.PI/6,angle+Math.PI/6].map(a=>new THREE.Vector3(center.x+Math.cos(a)*SPACING,0.012,center.z+Math.sin(a)*SPACING));
        ringLine(points,0xd6eee2,0.2,boundaryGroup,true);
      }
    }
    function updatePlanning(next: WorldProps) {
      disposeObject(currentGroup); currentGroup.clear(); driftParticles.length = 0;
      chartLabels.forEach(({ label }) => label.remove()); chartLabels.length = 0;
      // Drift and storm pressure are separate rules. Only resolved forecast moves drive these arrows.
      for (const move of next.forecast.moves) {
        const from = hexPosition(move.from).setY(0.095), to = hexPosition(move.to).setY(0.095), direction = to.clone().sub(from).normalize();
        const start = from.clone().addScaledVector(direction, 1.42), end = to.clone().addScaledVector(direction, -0.64);
        const color = move.blocked ? 0xf1a38b : 0xd4f3e8;
        seaArrow(start, end, color, currentGroup, move.id === next.selectedId ? 0.09 : 0.065);
        if (move.blocked) {
          const side = new THREE.Vector3(-direction.z, 0, direction.x), cross = end.clone().addScaledVector(direction, 0.21);
          seaStroke([cross.clone().addScaledVector(direction, -0.15).addScaledVector(side, -0.17), cross.clone().addScaledVector(direction, 0.15).addScaledVector(side, 0.17)], color, 0.075, 1, currentGroup);
          seaStroke([cross.clone().addScaledVector(direction, 0.15).addScaledVector(side, -0.17), cross.clone().addScaledVector(direction, -0.15).addScaledVector(side, 0.17)], color, 0.075, 1, currentGroup);
        } else {
          const dot = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide }));
          dot.rotation.x = -Math.PI / 2; currentGroup.add(dot); driftParticles.push({ object: dot, from: start, to: end, phase: driftParticles.length * 0.27 });
        }
      }
      const chartState = next.preview ? next.forecast.state : next.state;
      if (next.forecast.weather.storm && next.state.status === 'playing') {
        for (const island of chartState.islands) {
          const before = next.state.islands.find(item => item.id === island.id)!;
          const cells = shelterCells({ ...island, growth: before.growth }, next.forecast.weather.direction);
          if (!cells.length) continue;
          const from = hexPosition(island).setY(0.035), end = hexPosition(cells[cells.length - 1]).setY(0.035);
          const direction = end.clone().sub(from).normalize(), side = new THREE.Vector3(-direction.z, 0, direction.x);
          const start = from.clone().addScaledVector(direction, 1.3), finish = end.clone().addScaledVector(direction, 0.65);
          const corners = [start.clone().addScaledVector(side, 0.74), start.clone().addScaledVector(side, -0.74), finish.clone().addScaledVector(side, 0.33), finish.clone().addScaledVector(side, -0.33)];
          const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 1, 2, 1, 3, 2].flatMap(i => corners[i].toArray()), 3));
          currentGroup.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x8be1ca, transparent: true, opacity: island.id === next.selectedId ? 0.2 : 0.1, side: THREE.DoubleSide, depthWrite: false })));
          for (const sign of [-1, 1]) ringLine([start.clone().addScaledVector(side, sign * 0.74), finish.clone().addScaledVector(side, sign * 0.33)], 0xb1edcf, island.id === next.selectedId ? 0.65 : 0.33, currentGroup, true);
          for (const cell of cells) {
            const p = hexPosition(cell);
            ringLine(circlePoints(0.38, 0.055, 24).map(point => point.add(p)), 0xb1edcf, 0.4, currentGroup, true);
          }
        }
      }
      const connectedIds = new Set(next.preview ? next.forecast.connectedIds : getConnectedIds(chartState));
      const connected = chartState.islands.filter(island => connectedIds.has(island.id));
      for (let i = 0; i < connected.length; i++) for (let j = i + 1; j < connected.length; j++) {
        const a = connected[i], b = connected[j]; if (hexDistance(a, b) !== 1) continue;
        const from = hexPosition(a).setY(0.13), to = hexPosition(b).setY(0.13), direction = to.clone().sub(from).normalize();
        from.addScaledVector(direction, 1.15); to.addScaledVector(direction, -1.15);
        seaStroke([from, to], 0xffd591, 0.055, 0.88, currentGroup);
        const middle = from.clone().lerp(to, 0.5);
        const buoy = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.025, 5, 12), new THREE.MeshBasicMaterial({ color: 0xffe6b6 }));
        buoy.rotation.x = -Math.PI / 2; buoy.position.copy(middle); currentGroup.add(buoy);
      }
      const missing = missingConnection(chartState);
      const empty = missing.filter(hex => !chartState.islands.some(island => sameHex(island, hex)));
      if (missing.length) {
        const points = missing.map(hex => hexPosition(hex).setY(0.15));
        ringLine(points, 0xefaf96, 0.76, currentGroup, true);
        for (const hex of empty) {
          const center = hexPosition(hex);
          ringLine(circlePoints(0.47, 0.15, 6).map(point => point.add(center)), 0xefaf96, 0.9, currentGroup, true);
        }
        if ((next.preview || next.selectedId === 'bell') && empty.length) {
          const midpoint = hexPosition(empty[Math.floor(empty.length / 2)]).add(new THREE.Vector3(0, 0.18, -0.5));
          chartLabel(`${empty.length} empty ${empty.length === 1 ? 'link' : 'links'} to Heart`, midpoint, 'is-missing-link');
        }
      }
    }
    // The whale travels outside the playable map, a small promise of a larger world.
    const whale=new THREE.Group();scene.add(whale);const body=ball(whale,1,0x356a6a,0,-0.015,0,2);body.scale.set(0.47,0.16,1.28);
    for(const side of [-1,1]){const fin=ball(whale,0.3,0x3c7772,side*0.23,-0.012,-1.17);fin.scale.set(1,0.12,0.48);fin.rotation.y=side*0.5;}
    const whaleWake=ringLine(circlePoints(0.65,0.008,40),0xc3e6d7,0.2,whale);whaleWake.scale.set(1,1,2.6);
    const gulls:THREE.Group[]=[];
    for(let i=0;i<5;i++){const gull=new THREE.Group();const points=[new THREE.Vector3(-0.18,0,0),new THREE.Vector3(-0.07,0.05,0),new THREE.Vector3(0,0,0),new THREE.Vector3(0.07,0.05,0),new THREE.Vector3(0.18,0,0)];ringLine(points,0xfff4d8,0.9,gull);scene.add(gull);gulls.push(gull);}
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down={x:0,y:0};
    const pointerDown=(event:PointerEvent)=>{down={x:event.clientX,y:event.clientY};};
    const getHits=(event:PointerEvent)=>{const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects([...targetMeshes,...Array.from(islands.values()).map(v=>v.group)],true).filter(hit=>hit.object instanceof THREE.Mesh&&hit.object.userData.pickable!==false);};
    const pointerUp=(event:PointerEvent)=>{if(event.button!==0||Math.hypot(event.clientX-down.x,event.clientY-down.y)>6)return;const hit=getHits(event)[0];if(!hit)return;const hex=hit.object.userData.hex as Hex|undefined;if(hex)latest.current.onSelectHex(hex);else{const id=hit.object.userData.islandId;if(id)latest.current.onSelectIsland(id);}};
    const pointerMove=(event:PointerEvent)=>{renderer.domElement.style.cursor=getHits(event).length?'pointer':'grab';};
    renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('pointermove',pointerMove);
    function resize(){if(disposed)return;const w=container!.clientWidth,h=container!.clientHeight;renderer.setSize(w,h);const aspect=w/Math.max(h,1),halfHeight=Math.max(10.7,projectedWidth/(2*aspect));camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();}
    const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);
    function update(next:WorldProps){
      if(disposed)return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio,next.quality==='high'?1.75:1));renderer.shadowMap.enabled=next.quality==='high';sun.castShadow=next.quality==='high';
      if(lastSeed!==next.state.seed){
        islands.forEach(view=>{scene.remove(view.group);disposeObject(view.group);view.label.remove();});islands.clear();lastSeed=next.state.seed;
        controls.target.set(0,0,-0.4);camera.position.set(13,21,26);camera.zoom=1.34;projectedWidth=29;resize();
      }
      for(const island of next.state.islands){
        const sig=`${island.kind}|${island.building}|${island.growth}|${island.anchored}|${island.nourished}|${!!hero}`;
        let view=islands.get(island.id);
        if(!view){
          const group=makeIsland(island,next.state.seed,hero);group.position.copy(hexPosition(island));scene.add(group);
          const label=document.createElement('button');label.type='button';label.className='island-label';label.dataset.island=island.id;label.textContent=island.name;label.addEventListener('click',()=>latest.current.onSelectIsland(island.id));labelContainer!.append(label);
          view={group,target:hexPosition(island),label,signature:sig};islands.set(island.id,view);
        }else if(view.signature!==sig){
          const oldPosition=view.group.position.clone();scene.remove(view.group);disposeObject(view.group);view.group=makeIsland(island,next.state.seed,hero);view.group.position.copy(oldPosition);scene.add(view.group);view.signature=sig;
        }
        view.target.copy(hexPosition(island));
        const after = next.forecast.state.islands.find(item => item.id === island.id)!;
        const move = next.forecast.moves.find(item => item.id === island.id);
        const currentStats = getIslandStats(next.state, island.id), production = tideProduction(next.state, next.forecast, island.id);
        const stressDelta = after.stress - island.stress, growthDelta = after.growth - island.growth;
        const changes: string[] = [];
        if (move) changes.push(move.blocked ? 'Drift blocked' : 'Drifts next tide');
        else if (island.anchored) changes.push('Anchored this tide');
        if (growthDelta > 0) changes.push(`Growth +${growthDelta}`);
        else if (island.nourished) changes.push('Growth waits');
        if (stressDelta) changes.push(`Stress ${stressDelta > 0 ? '+' : '−'}${Math.abs(stressDelta)}`);
        if (next.forecast.weather.storm) changes.push(next.forecast.shelteredIds.includes(island.id) ? 'Sheltered after drift' : 'Exposed after drift');
        const yields: string[] = [];
        if (island.building === 'garden') yields.push(production.food === currentStats.food ? `Produces ${production.food} food` : `Food ${currentStats.food} → ${production.food}`);
        if (island.building === 'grove') yields.push(production.timber === currentStats.timber ? `Produces ${production.timber} timber` : `Timber ${currentStats.timber} → ${production.timber}`);
        if (island.kind === 'bell') yields.push(next.forecast.connectedIds.includes(island.id) ? 'Linked to Heart after tide' : 'Heart link missing');
        const name = document.createElement('span'); name.className = 'island-label-name'; name.textContent = island.name;
        view.label.replaceChildren(name);
        const details = (next.preview || island.id === next.selectedId) && next.state.status === 'playing';
        if (details) {
          const summary = document.createElement('span'); summary.className = 'island-forecast-text';
          const selected = island.id === next.selectedId;
          const compactChanges = changes.filter(change => !change.includes('after drift')).map(change => change.replace('Drifts next tide', 'Drifts').replace('Anchored this tide', 'Anchored'));
          const line = document.createElement('span'); line.textContent = selected ? (changes.length ? changes.join(' · ') : 'Holds position') : (compactChanges.join(' · ') || 'Holds position'); summary.append(line);
          if (yields.length) { const yieldLine = document.createElement('span'); yieldLine.textContent = yields.map(yieldText => selected ? yieldText : yieldText.replace('Produces ', '+').replace('Linked to Heart after tide', 'Heart linked')).join(' · '); summary.append(yieldLine); }
          view.label.append(summary);
        }
        const connection = next.forecast.connectedIds.includes(island.id) ? 'connected to Heart' : 'disconnected from Heart';
        const accessibility = next.state.status === 'playing' ? `. After the tide: ${[...changes, ...yields, connection].join('. ')}` : '';
        view.label.classList.toggle('is-selected',island.id===next.selectedId);view.label.classList.toggle('is-bell',island.kind==='bell');view.label.classList.toggle('is-stressed',after.stress>=3);view.label.classList.toggle('has-forecast',details);view.label.classList.toggle('is-blocked',Boolean(move?.blocked));
        view.label.setAttribute('aria-label',`Select ${island.name}, ${island.kind==='ordinary'?(island.building||'undeveloped island'):island.kind+' island'}${accessibility}`);view.label.setAttribute('aria-pressed',String(island.id===next.selectedId));
      }
      updatePlanning(next);
      disposeObject(targetsGroup);targetsGroup.clear();targetMeshes.length=0;
      for(const hex of next.towTargets){
        const center=hexPosition(hex);const target=new THREE.Group();target.position.copy(center);targetsGroup.add(target);
        const points=Array.from({length:7},(_,i)=>new THREE.Vector3(Math.cos(i*Math.PI/3+Math.PI/6)*1.28,0.045,Math.sin(i*Math.PI/3+Math.PI/6)*1.28));ringLine(points,0xffecc6,0.85,target);
        const disc=mesh(new THREE.CircleGeometry(1.25,6),new THREE.MeshBasicMaterial({color:0xffdf9c,opacity:0.13,transparent:true,depthWrite:false,side:THREE.DoubleSide}),target,0,0.025,0);disc.rotation.x=-Math.PI/2;disc.rotation.z=Math.PI/6;disc.castShadow=false;disc.userData.hex=hex;targetMeshes.push(disc);
        const cross=ringLine([new THREE.Vector3(-0.16,0.05,0),new THREE.Vector3(0.16,0.05,0)],0xffedcd,0.9,target);cross.userData.hex=hex;
        ringLine([new THREE.Vector3(0,0.05,-0.16),new THREE.Vector3(0,0.05,0.16)],0xffedcd,0.9,target);
      }
      disposeObject(previewGroup);previewGroup.clear();previewGroup.visible=next.preview;
      if(next.preview)for(const move of next.forecast.moves){
        if(move.blocked)continue;
        const from=hexPosition(move.from),to=hexPosition(move.to);if(from.distanceTo(to)<0.1)continue;
        const p=new THREE.Group();p.position.copy(to);previewGroup.add(p);ringLine(circlePoints(1.2,0.06),0xfbf0c6,0.75,p,true);
        const ghost=mesh(new THREE.CylinderGeometry(1.04,1.13,0.45,24),new THREE.MeshBasicMaterial({color:0xfff0bf,transparent:true,opacity:0.13,depthWrite:false}),p,0,0.25,0);ghost.castShadow=false;
        chartLabel('Tide end', to.clone().add(new THREE.Vector3(0, 0.12, 0)), 'is-destination');
        from.y=0.11;to.y=0.11;ringLine([from,to],0xffe5a8,0.72,previewGroup,true);
        const direction=to.clone().sub(from).normalize(),side=new THREE.Vector3(-direction.z,0,direction.x);ringLine([to.clone().addScaledVector(direction,-0.36).addScaledVector(side,0.21),to,to.clone().addScaledVector(direction,-0.36).addScaledVector(side,-0.21)],0xffebba,0.9,previewGroup);
      }
    }
    runtime.current={update};update(latest.current);resize();
    // Loading a hero model is optional: the carefully built procedural flower remains a complete fallback.
    const loader=new GLTFLoader();loader.load('/assets/bell-flower.glb',gltf=>{
      if(disposed){disposeObject(gltf.scene);return;}hero=gltf.scene;hero.traverse(child=>{if(child instanceof THREE.Mesh){child.castShadow=true;child.receiveShadow=true;}});update(latest.current);
    },undefined,()=>{});
    const clock=new THREE.Clock();const projected=new THREE.Vector3();
    function animate(){
      if(disposed)return;raf=requestAnimationFrame(animate);const elapsed=clock.getElapsedTime(),reduce=latest.current.reducedMotion;waterMat.uniforms.uTime.value=reduce?0:elapsed;
      controls.update();
      islands.forEach((view,id)=>{
        view.group.position.lerp(view.target,reduce?1:0.12);
        if(!reduce)view.group.rotation.z=Math.sin(elapsed*0.4+view.target.x)*0.0025;
        projected.copy(view.group.position).add(new THREE.Vector3(0,0.1,1.48)).project(camera);const x=(projected.x*0.5+0.5)*container!.clientWidth,y=(-projected.y*0.5+0.5)*container!.clientHeight;
        view.label.style.transform=`translate(${x}px,${y}px) translate(-50%,0)`;view.label.style.visibility=projected.z>1?'hidden':'visible';
        if(id===latest.current.selectedId){selection.visible=true;selection.position.copy(view.group.position);selectionRing.material.opacity=reduce?0.92:0.83+Math.sin(elapsed*2)*0.12;}
      });if(!latest.current.selectedId)selection.visible=false;
      for (const particle of driftParticles) particle.object.position.copy(particle.from).lerp(particle.to, reduce ? 0.52 : (elapsed * 0.38 + particle.phase) % 1).setY(0.11);
      const occupiedLabels = Array.from(islands.values()).map(view => view.label.getBoundingClientRect());
      const mapBounds = container!.getBoundingClientRect();
      for (const note of chartLabels) {
        projected.copy(note.position).project(camera);
        let x = (projected.x * 0.5 + 0.5) * container!.clientWidth, y = (-projected.y * 0.5 + 0.5) * container!.clientHeight;
        const offsets = [[0, 0], [0, -26], [-55, -26], [55, -26], [-75, 0], [75, 0], [0, -52]];
        const clear = offsets.find(([dx, dy]) => occupiedLabels.every(rect => x + dx + note.width / 2 + 4 < rect.left - mapBounds.left || x + dx - note.width / 2 - 4 > rect.right - mapBounds.left || y + dy + note.height / 2 + 4 < rect.top - mapBounds.top || y + dy - note.height / 2 - 4 > rect.bottom - mapBounds.top));
        if (clear) { x += clear[0]; y += clear[1]; }
        note.label.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; note.label.style.visibility = projected.z > 1 ? 'hidden' : 'visible';
      }
      const drift=reduce?0:elapsed*0.017;whale.position.set(-11+Math.sin(drift)*2.3,0,6+Math.cos(drift)*2);whale.rotation.y=-0.8+Math.sin(drift)*0.2;
      gulls.forEach((gull,i)=>{const t=(reduce?0:elapsed*0.1)+i*1.25;gull.position.set(Math.sin(t)*6.6,3.2+i*0.22,Math.cos(t)*5-2);gull.rotation.y=-t;gull.rotation.z=reduce?0:Math.sin(elapsed*2+i)*0.08;});
      renderer.render(scene,camera);
    }
    animate();
    const onContextLost=(event:Event)=>{event.preventDefault();setError(true);};renderer.domElement.addEventListener('webglcontextlost',onContextLost);
    return()=>{disposed=true;cancelAnimationFrame(raf);runtime.current=null;resizeObserver.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('pointermove',pointerMove);renderer.domElement.removeEventListener('webglcontextlost',onContextLost);disposeObject(scene);if(hero)disposeObject(hero);renderer.dispose();renderer.domElement.remove();islands.forEach(view=>view.label.remove());chartLabels.forEach(({label})=>label.remove());};
  },[]);
  useEffect(()=>{runtime.current?.update(props);},[props.state,props.forecast,props.selectedId,props.towTargets,props.preview,props.quality,props.reducedMotion]);
  return <div className="world-root" ref={host}><div className="world-vignette"/><div className="world-labels" ref={labels}/><div className="world-legend" aria-label="Sea chart legend"><span className="legend-drift">→ Drift</span><span className="legend-blocked">× Blocked</span><span className="legend-chain">— Heart links</span>{props.forecast.weather.storm&&<span className="legend-shelter">▱ Shelter wake</span>}</div>{error&&<div className="world-unavailable"><strong>The sea needs a little more graphics power.</strong><p>This game requires WebGL 2. Enable hardware acceleration or try a current desktop browser, then reload.</p></div>}<div className="world-chart-mark" aria-hidden="true"><span>N</span><svg viewBox="0 0 50 50"><path d="M25 4 31 25 25 46 19 25Z" fill="none" stroke="currentColor"/><path d="M4 25H46M25 4V46" fill="none" stroke="currentColor"/><circle cx="25" cy="25" r="15" fill="none" stroke="currentColor" opacity=".4"/></svg></div></div>;
}
