// Translates a SYSTEMS entity entry into a Three.js scene group (star + planets + orbits).

import * as THREE from 'three';
import { SYSTEMS } from '../entities/systems.js';
import { radialTex, hex2rgba } from './TextureFactory.js';

export function buildStellarSystem(id) {
  const sys   = SYSTEMS[id];
  const group = new THREE.Group();

  group.add(new THREE.AmbientLight(0x223355, 0.75));
  group.add(new THREE.PointLight(sys.starColor, 5.0, 400));

  const starMesh = new THREE.Mesh(
    new THREE.SphereGeometry(sys.starRadius, 32, 32),
    new THREE.MeshBasicMaterial({ color: sys.starColor }),
  );
  group.add(starMesh);

  const starGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radialTex(128, [
      [0,    hex2rgba(sys.glowColor, 1.0)],
      [0.15, hex2rgba(sys.glowColor, 0.6)],
      [0.45, hex2rgba(sys.glowColor, 0.15)],
      [0.75, hex2rgba(sys.glowColor, 0.03)],
      [1,    'rgba(0,0,0,0)'],
    ]),
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  starGlow.scale.setScalar(sys.starRadius * 7);
  group.add(starGlow);

  const planetObjs = sys.planets.map(pd => {
    const ringPts = [];
    for (let j = 0; j <= 128; j++) {
      const a = (j / 128) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(Math.cos(a) * pd.orbitR, 0, Math.sin(a) * pd.orbitR));
    }
    group.add(new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(ringPts),
      new THREE.LineBasicMaterial({ color: 0x223355, transparent: true, opacity: 0.35 }),
    ));

    const pMesh = new THREE.Mesh(
      new THREE.SphereGeometry(pd.radius, 28, 28),
      new THREE.MeshStandardMaterial({
        color: pd.color, emissive: pd.color, emissiveIntensity: 0.55,
        roughness: 0.65, metalness: 0.12,
      }),
    );
    pMesh.position.set(Math.cos(pd.startAngle) * pd.orbitR, 0, Math.sin(pd.startAngle) * pd.orbitR);
    group.add(pMesh);

    const atmSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: radialTex(64, [
        [0,    hex2rgba(pd.color, 0.55)],
        [0.4,  hex2rgba(pd.color, 0.12)],
        [0.75, hex2rgba(pd.color, 0.03)],
        [1,    'rgba(0,0,0,0)'],
      ]),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    atmSprite.scale.setScalar(pd.radius * 5.5);
    pMesh.add(atmSprite);

    if (pd.hasRings) {
      const ringMesh = new THREE.Mesh(
        new THREE.RingGeometry(pd.radius * 1.45, pd.radius * 2.3, 64),
        new THREE.MeshBasicMaterial({
          color: pd.ringColor || pd.color, side: THREE.DoubleSide, transparent: true, opacity: 0.45,
        }),
      );
      ringMesh.rotation.x = Math.PI / 2 + 0.35;
      pMesh.add(ringMesh);
    }

    return { mesh: pMesh, data: pd, angle: pd.startAngle };
  });

  return { group, planetObjs, sys, starMesh, starGlow };
}
