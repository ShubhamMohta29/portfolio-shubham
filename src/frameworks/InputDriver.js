// Translates raw DOM events (mouse, keyboard, touch, resize) into use case calls.

import * as THREE from 'three';
import { NAV_DEFS } from '../entities/navDefs.js';

export function createMouseTracker() {
  let mx = 0, my = 0, smoothMX = 0, smoothMY = 0;
  const mouse2D = new THREE.Vector2();

  function setFromClient(clientX, clientY) {
    mx = clientX / window.innerWidth  - 0.5;
    my = clientY / window.innerHeight - 0.5;
    mouse2D.x =  (clientX / window.innerWidth)  * 2 - 1;
    mouse2D.y = -(clientY / window.innerHeight) * 2 + 1;
  }

  window.addEventListener('mousemove', e => setFromClient(e.clientX, e.clientY));
  window.addEventListener('touchmove', e => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    if (t.target.closest('.planet-sheet, #experience-page, #about-page, #pdf-modal')) return;
    setFromClient(t.clientX, t.clientY);
  }, { passive: true });

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
  let touchStartX = 0, touchStartY = 0;

  function fireClick() {
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
  }

  canvas.addEventListener('click', fireClick);

  canvas.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    mouse2D.x =  (touchStartX / window.innerWidth)  * 2 - 1;
    mouse2D.y = -(touchStartY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  canvas.addEventListener('touchend', e => {
    e.preventDefault(); // prevent 300ms synthetic click on canvas
    if (e.changedTouches.length !== 1) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (dx * dx + dy * dy > 144) return; // > 12px — drag, not tap
    mouse2D.x =  (t.clientX / window.innerWidth)  * 2 - 1;
    mouse2D.y = -(t.clientY / window.innerHeight) * 2 + 1;
    fireClick();
  }, { passive: false });
}

export function setupKeyboardHandler({ navigationUseCase, planetInteractionUseCase, pdfModal, getCurrentSys }) {
  let focusedPlanetIdx = -1;

  document.addEventListener('keydown', e => {
    if (pdfModal.classList.contains('active')) {
      if (e.key === 'Escape') planetInteractionUseCase.closePDF();
      return;
    }

    if (e.key === 'Escape') {
      focusedPlanetIdx = -1;
      planetInteractionUseCase.closePlanetSheet();
      if (navigationUseCase.viewState === 'stellar') navigationUseCase.goToGalaxy();
      return;
    }

    if (navigationUseCase.viewState !== 'stellar') return;
    const sys = getCurrentSys();
    if (!sys || sys.planetObjs.length === 0) return;
    const count = sys.planetObjs.length;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      focusedPlanetIdx = (focusedPlanetIdx + 1) % count;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      focusedPlanetIdx = ((focusedPlanetIdx <= 0 ? count : focusedPlanetIdx) - 1);
    } else if (e.key === 'Enter' && focusedPlanetIdx >= 0) {
      e.preventDefault();
      planetInteractionUseCase.openPlanetSheet(sys.planetObjs[focusedPlanetIdx].data);
    }
  });

  return {
    getFocusedPlanetIdx: () => navigationUseCase.viewState === 'stellar' ? focusedPlanetIdx : -1,
    resetFocus: () => { focusedPlanetIdx = -1; },
  };
}

export function setupResizeHandler(camera, renderer) {
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
