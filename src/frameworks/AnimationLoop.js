// Per-frame render loop: camera orbit, hover raycasting, planet animation, label updates.

import * as THREE from 'three';
import { BASE_PHI } from './CameraController.js';
import { updateNavLabels, updatePlanetLabels } from '../adapters/LabelAdapter.js';

export function createAnimationLoop({
  renderer, scene, camera,
  galaxy, navSprites, navHitMeshes,
  mouseTracker, navigationUseCase, raycaster, clock,
  positionCamera,
}) {
  let lastT            = 0;
  let hoveredNavIdx    = -1;
  let hoveredPlanetIdx = -1;

  function updateNavHover() {
    const mouse2D = mouseTracker.getMouse2D();
    raycaster.setFromCamera(mouse2D, camera);
    const hits = raycaster.intersectObjects(navHitMeshes);
    const prev  = hoveredNavIdx;
    hoveredNavIdx = hits.length > 0 ? navHitMeshes.indexOf(hits[0].object) : -1;
    if (hoveredNavIdx !== prev)
      document.body.style.cursor = hoveredNavIdx >= 0 ? 'pointer' : '';
  }

  function updatePlanetHover() {
    const currentSys = navigationUseCase.currentSys;
    if (!currentSys) return;
    const meshes  = currentSys.planetObjs.map(p => p.mesh);
    const mouse2D = mouseTracker.getMouse2D();
    raycaster.setFromCamera(mouse2D, camera);
    const hits = raycaster.intersectObjects(meshes);
    const prev  = hoveredPlanetIdx;
    hoveredPlanetIdx = hits.length > 0 ? meshes.indexOf(hits[0].object) : -1;
    if (hoveredPlanetIdx !== prev)
      document.body.style.cursor = hoveredPlanetIdx >= 0 ? 'pointer' : '';
    currentSys.planetObjs.forEach((p, i) => {
      const hov    = hoveredPlanetIdx === i ? 1 : 0;
      const tScale = 1.0 + hov * 0.28;
      p.mesh.scale.x += (tScale - p.mesh.scale.x) * 0.12;
      p.mesh.scale.y  = p.mesh.scale.z = p.mesh.scale.x;
      p.mesh.material.emissiveIntensity +=
        ((0.55 + hov * 0.40) - p.mesh.material.emissiveIntensity) * 0.12;
    });
  }

  function tick() {
    requestAnimationFrame(tick);
    const t  = clock.getElapsedTime();
    const dt = Math.min(t - lastT, 0.05);
    lastT = t;

    mouseTracker.update();

    const viewState = navigationUseCase.viewState;
    const { x: smx, y: smy } = mouseTracker.getSmoothed();

    if (viewState === 'galaxy') {
      galaxy.rotation.y = t * 0.06;
      galaxy.updateMatrixWorld(true);
      positionCamera(
        t * 0.01 + smx * 0.55,
        Math.max(0.65, Math.min(1.48, BASE_PHI + smy * 0.38)),
      );
      updateNavLabels(navSprites, hoveredNavIdx, t, camera);
      updateNavHover();

    } else if (viewState === 'stellar') {
      const currentSys = navigationUseCase.currentSys;
      if (!currentSys) { renderer.render(scene, camera); return; }
      const { planetObjs, sys, starMesh, starGlow } = currentSys;

      planetObjs.forEach(p => {
        p.angle += p.data.orbitSpeed * dt;
        p.mesh.position.x = Math.cos(p.angle) * p.data.orbitR;
        p.mesh.position.z = Math.sin(p.angle) * p.data.orbitR;
        p.mesh.rotation.y += dt * 0.4;
      });

      const pulse = 1 + 0.04 * Math.sin(t * 1.8);
      starMesh.scale.setScalar(pulse);
      starGlow.scale.setScalar(sys.starRadius * 7 * (1 + 0.06 * Math.sin(t * 1.8)));

      navigationUseCase.stellarEntryZoom += (1.0 - navigationUseCase.stellarEntryZoom) * 0.025;
      positionCamera(
        t * 0.008 + smx * 0.35,
        Math.max(0.55, Math.min(1.32, BASE_PHI + smy * 0.3)),
        sys.camRadius * navigationUseCase.stellarEntryZoom,
      );

      updatePlanetLabels(currentSys, hoveredPlanetIdx, camera);
      updatePlanetHover();
    }

    renderer.render(scene, camera);
  }

  return { start: () => tick() };
}
