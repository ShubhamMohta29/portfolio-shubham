// Builds the galaxy particle system, background stars, and distant galaxy sprites.

import * as THREE from 'three';
import { NAV_DEFS } from '../entities/navDefs.js';
import { makeDistantGalaxyTex } from './TextureFactory.js';

export function buildGalaxy(starTex, coreGlowTex, navStarTex) {
  const galaxy = new THREE.Group();

  const ARMS = 2, ARM_N = 9000, CORE_N = 2700, HALO_N = 0, MAX_R = 110, WINDINGS = 2.2;
  const total = ARMS * ARM_N + CORE_N + HALO_N;
  const pos   = new Float32Array(total * 3);
  const col   = new Float32Array(total * 3);
  let i = 0;

  // Spiral arms
  for (let arm = 0; arm < ARMS; arm++) {
    const off = (arm / ARMS) * Math.PI * 2;
    for (let k = 0; k < ARM_N; k++) {
      const t  = k / ARM_N;
      const r  = t * MAX_R;
      const a  = off + t * WINDINGS * Math.PI * 2;
      const sp = MAX_R * 0.07 * (0.5 + t * 0.8);
      pos[i * 3]     = Math.cos(a) * r + (Math.random() + Math.random() - 1) * sp;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4 * (1 - t * 0.5);
      pos[i * 3 + 2] = Math.sin(a) * r + (Math.random() + Math.random() - 1) * sp;
      const w = Math.pow(1 - t, 1.5);
      col[i * 3]     = 0.75 + w * 0.25;
      col[i * 3 + 1] = 0.85 + w * 0.07;
      col[i * 3 + 2] = 1.0;
      i++;
    }
  }

  // Dense warm core
  for (let k = 0; k < CORE_N; k++) {
    const r  = Math.pow(Math.random(), 1.8) * 20;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.25;
    pos[i * 3 + 2] = r * Math.cos(ph);
    col[i * 3]     = 1.0;
    col[i * 3 + 1] = 0.88 + Math.random() * 0.12;
    col[i * 3 + 2] = 0.62 + Math.random() * 0.18;
    i++;
  }

  // Sparse halo
  for (let k = 0; k < HALO_N; k++) {
    const r  = 40 + Math.pow(Math.random(), 0.4) * 80;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.45;
    pos[i * 3 + 2] = r * Math.cos(ph);
    col[i * 3]     = 0.6 + Math.random() * 0.2;
    col[i * 3 + 1] = 0.7 + Math.random() * 0.15;
    col[i * 3 + 2] = 0.85 + Math.random() * 0.15;
    i++;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
  galaxy.add(new THREE.Points(geo, new THREE.PointsMaterial({
    size: 1.0, map: starTex, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending,
    depthWrite: false, vertexColors: true, sizeAttenuation: true,
  })));

  const core = new THREE.Sprite(new THREE.SpriteMaterial({
    map: coreGlowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  core.scale.set(60, 60, 1);
  galaxy.add(core);

  // Nav stars rotate with the galaxy
  const navSprites   = [];
  const navHitMeshes = [];
  const hitGeo = new THREE.SphereGeometry(10, 6, 6);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });

  NAV_DEFS.forEach(({ pos: p, color }) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: navStarTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sp.position.set(...p);
    sp.scale.setScalar(10);
    galaxy.add(sp);
    navSprites.push(sp);

    const hit = new THREE.Mesh(hitGeo, hitMat);
    hit.position.set(...p);
    galaxy.add(hit);
    navHitMeshes.push(hit);
  });

  return { galaxy, navSprites, navHitMeshes };
}

export function buildBackground(starTex) {
  const N   = 12000;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r  = 600 + Math.random() * 900;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    pos[i * 3 + 2] = r * Math.cos(ph);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({
    size: 1.8, map: starTex, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending,
    depthWrite: false, color: 0x99aabb, sizeAttenuation: true,
  }));
}

export function buildDistantGalaxies() {
  const GCOLS = [
    [255, 242, 210],
    [200, 218, 255],
    [255, 225, 185],
    [215, 200, 255],
    [245, 255, 250],
  ];
  return Array.from({ length: 70 }, (_, i) => {
    const col    = GCOLS[i % GCOLS.length];
    const aRatio = 0.22 + Math.random() * 0.58;
    const sp     = new THREE.Sprite(new THREE.SpriteMaterial({
      map:         makeDistantGalaxyTex(col[0], col[1], col[2], aRatio, Math.random() * Math.PI),
      transparent: true,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
      opacity:     0.40 + Math.random() * 0.35,
    }));
    const dist = 700 + Math.random() * 700;
    const th   = Math.random() * Math.PI * 2;
    const ph   = Math.acos(2 * Math.random() - 1);
    sp.position.set(
      dist * Math.sin(ph) * Math.cos(th),
      dist * Math.sin(ph) * Math.sin(th),
      dist * Math.cos(ph),
    );
    const sz = 60 + Math.random() * 70;
    sp.scale.set(sz, sz * aRatio, 1);
    return sp;
  });
}
