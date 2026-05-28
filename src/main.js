// Composition root — assembles all layers and starts the app.

import * as THREE from 'three';

// Frameworks & Drivers
import { createRenderer, createScene, createCamera }    from './frameworks/RendererSetup.js';
import { positionCamera, BASE_PHI }                     from './frameworks/CameraController.js';
import {
  createMouseTracker, setupClickHandler,
  setupKeyboardHandler, setupResizeHandler,
} from './frameworks/InputDriver.js';
import { createAnimationLoop }                          from './frameworks/AnimationLoop.js';

// Interface Adapters
import { radialTex, makeNavStarTex }                    from './adapters/TextureFactory.js';
import { buildGalaxy, buildBackground, buildDistantGalaxies } from './adapters/GalaxyBuilder.js';
import { buildStellarSystem }                           from './adapters/StellarSystemBuilder.js';
import * as LabelAdapter                                from './adapters/LabelAdapter.js';

// Use Cases
import { NavigationUseCase }        from './usecases/NavigationUseCase.js';
import { PlanetInteractionUseCase } from './usecases/PlanetInteractionUseCase.js';

// ── DOM elements ──────────────────────────────────────────────────────────────
const canvas        = document.getElementById('bg');
const overlay       = document.getElementById('overlay');
const stellarTitle  = document.getElementById('stellar-title');
const planetSheet   = document.getElementById('planet-sheet');
const sheetContent  = document.getElementById('sheet-content');
const pdfModal      = document.getElementById('pdf-modal');
const pdfFrame      = document.getElementById('pdf-frame');

// ── Renderer / scene ──────────────────────────────────────────────────────────
const renderer = createRenderer(canvas);
const scene    = createScene();
const camera   = createCamera();

// ── Shared resources ──────────────────────────────────────────────────────────
const clock     = new THREE.Clock();
const raycaster = new THREE.Raycaster();

// ── Textures ──────────────────────────────────────────────────────────────────
const starTex     = radialTex(64, [
  [0,   'rgba(255,255,255,1)'],
  [0.4, 'rgba(255,255,255,0.6)'],
  [1,   'rgba(0,0,0,0)'],
]);
const coreGlowTex = radialTex(128, [
  [0,   'rgba(255,240,200,1)'],
  [0.3, 'rgba(255,200,100,0.4)'],
  [1,   'rgba(0,0,0,0)'],
]);
const navStarTex = makeNavStarTex();

// ── Scene objects ─────────────────────────────────────────────────────────────
const { galaxy, navSprites, navHitMeshes } = buildGalaxy(starTex, coreGlowTex, navStarTex);

const galaxySceneGroup = new THREE.Group();
galaxySceneGroup.add(galaxy);
scene.add(galaxySceneGroup);
scene.add(buildBackground(starTex));
buildDistantGalaxies().forEach(g => scene.add(g));

positionCamera(camera, 0, BASE_PHI);

// ── Mouse tracker ─────────────────────────────────────────────────────────────
const mouseTracker = createMouseTracker();

// ── Use cases ─────────────────────────────────────────────────────────────────
const navigationUseCase = new NavigationUseCase({
  scene,
  camera,
  galaxySceneGroup,
  navSprites,
  clock,
  labelAdapter:         LabelAdapter,
  stellarSystemBuilder: id => buildStellarSystem(id),
  overlay,
  stellarTitleEl:       stellarTitle,
  getSmoothedMouse:     () => mouseTracker.getSmoothed(),
  positionCamera:       (theta, phi, r) => positionCamera(camera, theta, phi, r),
});

const planetInteractionUseCase = new PlanetInteractionUseCase({
  planetSheet, sheetContent, pdfModal, pdfFrame,
});

navigationUseCase.setOnPlanetClick(pd => planetInteractionUseCase.openPlanetSheet(pd));

// ── Input handlers ────────────────────────────────────────────────────────────
setupClickHandler({
  canvas,
  raycaster,
  camera,
  mouse2D:                 mouseTracker.getMouse2D(),
  navHitMeshes,
  navigationUseCase,
  planetInteractionUseCase,
  getCurrentSys: () => navigationUseCase.currentSys,
  getViewState:  () => navigationUseCase.viewState,
});

setupKeyboardHandler({ navigationUseCase, planetInteractionUseCase, pdfModal });
setupResizeHandler(camera, renderer);

// ── UI button wiring ──────────────────────────────────────────────────────────
document.getElementById('stellar-back').addEventListener('click', () => {
  planetInteractionUseCase.closePlanetSheet();
  navigationUseCase.goToGalaxy();
});

document.getElementById('sheet-close').addEventListener('click', () => {
  planetInteractionUseCase.closePlanetSheet();
});

document.getElementById('pdf-close').addEventListener('click', () => {
  planetInteractionUseCase.closePDF();
});

// ── Start ─────────────────────────────────────────────────────────────────────
createAnimationLoop({
  renderer, scene, camera,
  galaxy, navSprites, navHitMeshes,
  mouseTracker, navigationUseCase, raycaster, clock,
  positionCamera: (theta, phi, r) => positionCamera(camera, theta, phi, r),
}).start();
