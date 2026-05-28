// Owns navigation state (viewState, currentSys) and orchestrates galaxy ↔ stellar transitions.

import * as THREE from 'three';
import { SYSTEMS } from '../entities/systems.js';
import { NAV_DEFS } from '../entities/navDefs.js';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export class NavigationUseCase {
  // Private state
  #scene; #camera; #galaxySceneGroup; #navSprites; #clock;
  #labelAdapter; #stellarSystemBuilder; #overlay; #stellarTitleEl;
  #getSmoothedMouse; #positionCamera; #onPlanetClick = null;

  #viewState       = 'galaxy';
  #currentSys      = null;
  #stellarEntryZoom = 1.0;

  constructor({
    scene, camera, galaxySceneGroup, navSprites, clock,
    labelAdapter, stellarSystemBuilder, overlay, stellarTitleEl,
    getSmoothedMouse, positionCamera,
  }) {
    this.#scene               = scene;
    this.#camera              = camera;
    this.#galaxySceneGroup    = galaxySceneGroup;
    this.#navSprites          = navSprites;
    this.#clock               = clock;
    this.#labelAdapter        = labelAdapter;
    this.#stellarSystemBuilder = stellarSystemBuilder;
    this.#overlay             = overlay;
    this.#stellarTitleEl      = stellarTitleEl;
    this.#getSmoothedMouse    = getSmoothedMouse;
    this.#positionCamera      = positionCamera;
  }

  get viewState()        { return this.#viewState; }
  get currentSys()       { return this.#currentSys; }
  get stellarEntryZoom() { return this.#stellarEntryZoom; }
  set stellarEntryZoom(v) { this.#stellarEntryZoom = v; }

  setOnPlanetClick(cb) { this.#onPlanetClick = cb; }

  async goToSystem(id) {
    if (this.#viewState !== 'galaxy') return;
    this.#viewState = 'transition';

    // Zoom camera toward the clicked nav star
    const navIdx = NAV_DEFS.findIndex(d => d.page === id);
    const navPos = new THREE.Vector3();
    this.#navSprites[navIdx].getWorldPosition(navPos);

    const startPos = this.#camera.position.clone();
    const zoomDest = startPos.clone().lerp(navPos, 0.72);
    const ZOOM_MS  = 820, t0 = performance.now();

    await new Promise(resolve => {
      const tick = () => {
        const p = Math.min((performance.now() - t0) / ZOOM_MS, 1);
        const e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
        this.#camera.position.lerpVectors(startPos, zoomDest, e);
        this.#camera.lookAt(navPos);
        if (p < 1) requestAnimationFrame(tick); else resolve();
      };
      tick();
    });

    this.#overlay.classList.add('fast', 'visible');
    await sleep(160);

    this.#galaxySceneGroup.visible = false;
    document.body.classList.replace('galaxy-view', 'stellar-view');

    const sys = SYSTEMS[id];
    if (sys?.viewType === 'page') {
      document.body.classList.add(`${id}-view`);
      document.getElementById(`${id}-page`)?.classList.add('active');
      this.#labelAdapter.clearPlanetSidebar();
      this.#overlay.classList.remove('fast', 'visible');
      await sleep(60);
      this.#viewState = 'stellar';
      return;
    }

    if (this.#currentSys) this.#scene.remove(this.#currentSys.group);
    this.#currentSys = this.#stellarSystemBuilder(id);
    this.#scene.add(this.#currentSys.group);
    this.#labelAdapter.createPlanetLabels(
      this.#currentSys.planetObjs,
      pd => this.#onPlanetClick?.(pd),
    );
    this.#labelAdapter.createPlanetSidebar(
      this.#currentSys.planetObjs,
      pd => this.#onPlanetClick?.(pd),
    );
    this.#stellarTitleEl.textContent = this.#currentSys.sys.title;

    this.#stellarEntryZoom = 2.4;
    this.#positionCamera(0, 1.18, this.#currentSys.sys.camRadius * this.#stellarEntryZoom);

    this.#overlay.classList.remove('fast', 'visible');
    await sleep(60);
    this.#viewState = 'stellar';
  }

  async goToGalaxy() {
    if (this.#viewState !== 'stellar') return;
    this.#viewState = 'transition';

    Object.entries(SYSTEMS).forEach(([key, sys]) => {
      if (sys.viewType === 'page') {
        document.getElementById(`${key}-page`)?.classList.remove('active');
        document.body.classList.remove(`${key}-view`);
      }
    });

    if (this.#currentSys) {
      const camR    = this.#currentSys.sys.camRadius;
      const { x: smx, y: smy } = this.#getSmoothedMouse();
      const thetaRef = this.#clock.getElapsedTime() * 0.008 + smx * 0.35;
      const phiRef   = Math.max(0.55, Math.min(1.32, 1.18 + smy * 0.3));
      const ZOOM_MS  = 350, t0 = performance.now();

      await new Promise(resolve => {
        const tick = () => {
          const p = Math.min((performance.now() - t0) / ZOOM_MS, 1);
          this.#positionCamera(thetaRef + p * 0.06, phiRef, camR * (1 + p * p * 2.0));
          if (p < 1) requestAnimationFrame(tick); else resolve();
        };
        tick();
      });
    }

    this.#overlay.classList.add('visible');
    await sleep(480);

    if (this.#currentSys) { this.#scene.remove(this.#currentSys.group); this.#currentSys = null; }
    this.#labelAdapter.clearPlanetLabels();
    this.#labelAdapter.clearPlanetSidebar();

    document.body.classList.replace('stellar-view', 'galaxy-view');
    this.#galaxySceneGroup.visible = true;
    this.#positionCamera(this.#clock.getElapsedTime() * 0.01, 1.18);

    this.#overlay.classList.remove('visible');
    await sleep(60);
    this.#viewState = 'galaxy';
  }
}
