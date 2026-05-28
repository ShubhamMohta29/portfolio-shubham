// Converts canvas drawing commands into THREE.CanvasTexture objects.

import * as THREE from 'three';

export function radialTex(size, stops) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([t, col]) => g.addColorStop(t, col));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

export function hex2rgba(hex, a) {
  return `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${a})`;
}

export function makeNavStarTex() {
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const cx = s / 2;

  const gO = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  gO.addColorStop(0,   'rgba(200,220,255,0.45)');
  gO.addColorStop(0.4, 'rgba(150,190,255,0.12)');
  gO.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = gO;
  ctx.fillRect(0, 0, s, s);

  const gC = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx * 0.2);
  gC.addColorStop(0, 'rgba(255,255,255,1)');
  gC.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gC;
  ctx.beginPath(); ctx.arc(cx, cx, cx * 0.2, 0, Math.PI * 2); ctx.fill();

  [[1, 0], [0, 1]].forEach(([dx, dy]) => {
    const L  = cx * 0.9;
    const gr = ctx.createLinearGradient(cx - dx * L, cx - dy * L, cx + dx * L, cx + dy * L);
    gr.addColorStop(0,    'rgba(200,220,255,0)');
    gr.addColorStop(0.42, 'rgba(200,220,255,0.5)');
    gr.addColorStop(0.5,  'rgba(255,255,255,0.95)');
    gr.addColorStop(0.58, 'rgba(200,220,255,0.5)');
    gr.addColorStop(1,    'rgba(200,220,255,0)');
    ctx.strokeStyle = gr; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - dx * L, cx - dy * L); ctx.lineTo(cx + dx * L, cx + dy * L); ctx.stroke();
  });

  return new THREE.CanvasTexture(c);
}

export function makeDistantGalaxyTex(r, g, b, aspect, angle) {
  const s = 64, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  ctx.save();
  ctx.translate(s / 2, s / 2);
  ctx.rotate(angle);
  ctx.scale(1, aspect);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.48);
  grad.addColorStop(0,    `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.07, `rgba(${r},${g},${b},0.75)`);
  grad.addColorStop(0.22, `rgba(${r},${g},${b},0.28)`);
  grad.addColorStop(0.52, `rgba(${r},${g},${b},0.07)`);
  grad.addColorStop(1,    'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(0, 0, s * 0.48, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  return new THREE.CanvasTexture(cv);
}
