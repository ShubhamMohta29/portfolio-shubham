// Projects 3D world positions onto the screen and manages HTML planet/nav labels.

import * as THREE from 'three';
import { NAV_DEFS } from '../entities/navDefs.js';

const _wp  = new THREE.Vector3();
const _ndc = new THREE.Vector3();
const _cd  = new THREE.Vector3();
const _cs  = new THREE.Vector3();

export function projectLabel(worldPos, labelEl, camera) {
  camera.getWorldDirection(_cd);
  _cs.copy(worldPos).sub(camera.position).normalize();
  if (_cd.dot(_cs) <= 0.05) { labelEl.style.display = 'none'; return false; }
  _ndc.copy(worldPos).project(camera);
  labelEl.style.display = '';
  labelEl.style.left    = ((_ndc.x + 1) / 2 * window.innerWidth)  + 'px';
  labelEl.style.top     = ((-_ndc.y + 1) / 2 * window.innerHeight) + 'px';
  return true;
}

export function updateNavLabels(navSprites, hoveredNavIdx, t, camera) {
  NAV_DEFS.forEach(({ page }, i) => {
    const sp    = navSprites[i];
    const label = document.getElementById(`label-${page}`);
    if (!label) return;
    sp.getWorldPosition(_wp);
    projectLabel(_wp, label, camera);
    label.classList.toggle('hovered', hoveredNavIdx === i);
    const base  = hoveredNavIdx === i ? 22 : 15;
    const pulse = 1 + 0.18 * Math.sin(t * 1.8 + i * 1.2);
    sp.scale.setScalar(base * pulse);
  });
}

export function createPlanetLabels(planetObjs, onPlanetClick) {
  const ctr = document.getElementById('planet-labels');
  ctr.innerHTML = '';
  planetObjs.forEach((p, i) => {
    const el      = document.createElement('div');
    el.className  = 'planet-label';
    el.id         = `planet-label-${i}`;
    el.textContent = p.data.name;
    el.addEventListener('click', () => onPlanetClick(p.data));
    ctr.appendChild(el);
  });
}

export function clearPlanetLabels() {
  document.getElementById('planet-labels').innerHTML = '';
}

export function createPlanetSidebar(planetObjs, onPlanetClick) {
  const sidebar = document.getElementById('planet-sidebar');
  sidebar.innerHTML = '';
  planetObjs.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'sidebar-item';
    const hex = '#' + p.data.color.toString(16).padStart(6, '0');
    btn.innerHTML = `<span class="sidebar-dot" style="background:${hex}"></span><span class="sidebar-name">${p.data.name}</span>`;
    btn.addEventListener('click', () => onPlanetClick(p.data));
    sidebar.appendChild(btn);
  });
}

export function clearPlanetSidebar() {
  const sidebar = document.getElementById('planet-sidebar');
  if (sidebar) sidebar.innerHTML = '';
}

export function updatePlanetLabels(currentSys, hoveredPlanetIdx, camera) {
  if (!currentSys) return;
  currentSys.planetObjs.forEach((p, i) => {
    const label = document.getElementById(`planet-label-${i}`);
    if (!label) return;
    _wp.copy(p.mesh.position);
    _wp.y += p.data.radius + 1.5;
    projectLabel(_wp, label, camera);
    label.classList.toggle('hovered', hoveredPlanetIdx === i);
  });
}
