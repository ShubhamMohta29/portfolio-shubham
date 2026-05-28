// Creates the Three.js WebGL renderer, scene, and perspective camera.

import * as THREE from 'three';

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1);
  return renderer;
}

export function createScene() {
  return new THREE.Scene();
}

export function createCamera() {
  return new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);
}
