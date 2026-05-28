// Translates raw DOM events (mouse, keyboard, resize) into use case calls.

import * as THREE from 'three';
import { NAV_DEFS } from '../entities/navDefs.js';

export function createMouseTracker() {
  let mx = 0, my = 0, smoothMX = 0, smoothMY = 0;
  const mouse2D = new THREE.Vector2();

  window.addEventListener('mousemove', e => {
    mx = e.clientX / window.innerWidth  - 0.5;
    my = e.clientY / window.innerHeight - 0.5;
    mouse2D.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouse2D.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  return {
    update() {
      smoothMX += (mx - smoothMX) * 0.04;
      smoothMY += (my - smoothMY) * 0.04;
    },
    getMouse2D: ()  => mouse2D,
    getSmoothed: () => ({ x: smoothMX, y: smoothMY }),
  };
}

export function setupClickHandler({ canvas, raycaster, camera, mouse2D,
                                    navHitMeshes, navigationUseCase,
                                    planetInteractionUseCase, getCurrentSys, getViewState }) {
  canvas.addEventListener('click', () => {
    const viewState = getViewState();

    if (viewState === 'galaxy') {
      raycaster.setFromCamera(mouse2D, camera);
      const hits = raycaster.intersectObjects(navHitMeshes);
      if (hits.length > 0) {
        const idx = navHitMeshes.indexOf(hits[0].object);
        navigationUseCase.goToSystem(NAV_DEFS[idx].page);
      }
    } else if (viewState === 'stellar') {
      const currentSys = getCurrentSys();
      if (!currentSys) return;
      const meshes = currentSys.planetObjs.map(p => p.mesh);
      raycaster.setFromCamera(mouse2D, camera);
      const hits = raycaster.intersectObjects(meshes);
      if (hits.length > 0) {
        planetInteractionUseCase.openPlanetSheet(currentSys.planetObjs[meshes.indexOf(hits[0].object)].data);
      }
    }
  });
}

export function setupKeyboardHandler({ navigationUseCase, planetInteractionUseCase, pdfModal }) {
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (pdfModal.classList.contains('active')) { planetInteractionUseCase.closePDF(); return; }
    planetInteractionUseCase.closePlanetSheet();
    if (navigationUseCase.viewState === 'stellar') navigationUseCase.goToGalaxy();
  });
}

export function setupResizeHandler(camera, renderer) {
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
