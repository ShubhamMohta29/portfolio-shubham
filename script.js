import * as THREE from 'three';

// ── 1. Renderer ───────────────────────────────────────────────────────────────
const canvas = document.getElementById('bg');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);

// ── 2. Scene & Camera ─────────────────────────────────────────────────────────
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);

// ── 3. Texture utilities ──────────────────────────────────────────────────────
function radialTex(size, stops) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  stops.forEach(([t, col]) => g.addColorStop(t, col));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

function hex2rgba(hex, a) {
  return `rgba(${(hex>>16)&255},${(hex>>8)&255},${hex&255},${a})`;
}

const starTex = radialTex(32, [
  [0,    'rgba(255,255,255,1)'],
  [0.15, 'rgba(255,255,255,0.85)'],
  [0.45, 'rgba(200,220,255,0.3)'],
  [1,    'rgba(0,0,0,0)'],
]);

const coreGlowTex = radialTex(128, [
  [0,    'rgba(255,230,140,1)'],
  [0.2,  'rgba(255,200,80,0.6)'],
  [0.5,  'rgba(220,140,60,0.18)'],
  [1,    'rgba(0,0,0,0)'],
]);

function makeNavStarTex() {
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const cx  = s / 2;
  const gO = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  gO.addColorStop(0,   'rgba(200,220,255,0.45)');
  gO.addColorStop(0.4, 'rgba(150,190,255,0.12)');
  gO.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = gO; ctx.fillRect(0, 0, s, s);
  const gC = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx * 0.2);
  gC.addColorStop(0, 'rgba(255,255,255,1)');
  gC.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gC;
  ctx.beginPath(); ctx.arc(cx, cx, cx * 0.2, 0, Math.PI * 2); ctx.fill();
  [[1,0],[0,1]].forEach(([dx,dy]) => {
    const L = cx * 0.9;
    const gr = ctx.createLinearGradient(cx-dx*L,cx-dy*L,cx+dx*L,cx+dy*L);
    gr.addColorStop(0,    'rgba(200,220,255,0)');
    gr.addColorStop(0.42, 'rgba(200,220,255,0.5)');
    gr.addColorStop(0.5,  'rgba(255,255,255,0.95)');
    gr.addColorStop(0.58, 'rgba(200,220,255,0.5)');
    gr.addColorStop(1,    'rgba(200,220,255,0)');
    ctx.strokeStyle = gr; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx-dx*L,cx-dy*L); ctx.lineTo(cx+dx*L,cx+dy*L); ctx.stroke();
  });
  return new THREE.CanvasTexture(c);
}
const navStarTex = makeNavStarTex();

// ── 4. Galaxy scene group ─────────────────────────────────────────────────────
const galaxySceneGroup = new THREE.Group();
scene.add(galaxySceneGroup);

// 4a. Galaxy arms, core, halo
const galaxy = new THREE.Group();
{
  const ARMS=2, ARM_N=4600, CORE_N=1380, HALO_N=1050, MAX_R=110, WINDINGS=2.2;
  const total = ARMS*ARM_N + CORE_N + HALO_N;
  const pos = new Float32Array(total*3), col = new Float32Array(total*3);
  let i = 0;
  for (let arm=0; arm<ARMS; arm++) {
    const off = (arm/ARMS)*Math.PI*2;
    for (let k=0; k<ARM_N; k++) {
      const t = k/ARM_N, r = t*MAX_R, a = off + t*WINDINGS*Math.PI*2;
      const sp = MAX_R*0.07*(0.5+t*0.8);
      pos[i*3]   = Math.cos(a)*r + (Math.random()+Math.random()-1)*sp;
      pos[i*3+1] = (Math.random()-0.5)*4*(1-t*0.5);
      pos[i*3+2] = Math.sin(a)*r + (Math.random()+Math.random()-1)*sp;
      const w = Math.pow(1-t,1.5);
      col[i*3]=0.75+w*0.25; col[i*3+1]=0.85+w*0.07; col[i*3+2]=1.0; i++;
    }
  }
  for (let k=0; k<CORE_N; k++) {
    const r=Math.pow(Math.random(),1.8)*20, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
    pos[i*3]=r*Math.sin(ph)*Math.cos(th); pos[i*3+1]=r*Math.sin(ph)*Math.sin(th)*0.25; pos[i*3+2]=r*Math.cos(ph);
    col[i*3]=1.0; col[i*3+1]=0.88+Math.random()*0.12; col[i*3+2]=0.62+Math.random()*0.18; i++;
  }
  for (let k=0; k<HALO_N; k++) {
    const r=40+Math.pow(Math.random(),0.4)*80, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
    pos[i*3]=r*Math.sin(ph)*Math.cos(th); pos[i*3+1]=r*Math.sin(ph)*Math.sin(th)*0.45; pos[i*3+2]=r*Math.cos(ph);
    col[i*3]=0.6+Math.random()*0.2; col[i*3+1]=0.7+Math.random()*0.15; col[i*3+2]=0.85+Math.random()*0.15; i++;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
  galaxy.add(new THREE.Points(geo, new THREE.PointsMaterial({
    size:1.0, map:starTex, transparent:true, blending:THREE.AdditiveBlending,
    depthWrite:false, vertexColors:true, sizeAttenuation:true,
  })));
  const core = new THREE.Sprite(new THREE.SpriteMaterial({
    map:coreGlowTex, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false,
  }));
  core.scale.set(60,60,1); galaxy.add(core);
}

// 4b. Nav stars (children of galaxy — they rotate with it)
const NAV_DEFS = [
  { page:'about',    pos:[ 88, 5,  14], color:0xaaccff },
  { page:'projects', pos:[-12, 5,  92], color:0xffccaa },
  { page:'contact',  pos:[-90, 5, -10], color:0xaaffd4 },
  { page:'resume',   pos:[ 10, 5, -88], color:0xddaaff },
];
const navSprites=[], navHitMeshes=[];
const _hitGeo = new THREE.SphereGeometry(10,6,6);
const _hitMat = new THREE.MeshBasicMaterial({ visible:false });
NAV_DEFS.forEach(({ pos, color }) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map:navStarTex, color, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false,
  }));
  sp.position.set(...pos); sp.scale.setScalar(10); galaxy.add(sp); navSprites.push(sp);
  const hit = new THREE.Mesh(_hitGeo, _hitMat);
  hit.position.set(...pos); galaxy.add(hit); navHitMeshes.push(hit);
});
galaxySceneGroup.add(galaxy);

// 4c. Background stars — added to scene (not galaxySceneGroup) so they stay
//     visible in stellar views, giving the feeling of being inside the galaxy
{
  const N=12000, pos=new Float32Array(N*3);
  for (let i=0;i<N;i++){
    const r=600+Math.random()*900, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
    pos[i*3]=r*Math.sin(ph)*Math.cos(th); pos[i*3+1]=r*Math.sin(ph)*Math.sin(th); pos[i*3+2]=r*Math.cos(ph);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    size:1.8, map:starTex, transparent:true, blending:THREE.AdditiveBlending,
    depthWrite:false, color:0x99aabb, sizeAttenuation:true,
  })));
}

// 4d. Distant mini-galaxies — purely decorative, scattered far beyond the main galaxy
function makeDistantGalaxyTex(r, g, b, aspect, angle) {
  const s = 64, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  ctx.save();
  ctx.translate(s/2, s/2);
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
{
  const GCOLS = [
    [255,242,210], // warm white  — old spiral
    [200,218,255], // blue-white  — young spiral
    [255,225,185], // amber       — elliptical
    [215,200,255], // lavender    — irregular
    [245,255,250], // cool white  — lenticular
  ];
  for (let i = 0; i < 45; i++) {
    const col    = GCOLS[i % GCOLS.length];
    const aRatio = 0.22 + Math.random() * 0.58;
    const sp     = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeDistantGalaxyTex(col[0], col[1], col[2], aRatio, Math.random() * Math.PI),
      transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, opacity: 0.40 + Math.random() * 0.35,
    }));
    const dist = 700 + Math.random() * 700;
    const th   = Math.random() * Math.PI * 2;
    const ph   = Math.acos(2 * Math.random() - 1);
    sp.position.set(
      dist * Math.sin(ph) * Math.cos(th),
      dist * Math.sin(ph) * Math.sin(th),
      dist * Math.cos(ph)
    );
    const sz = 60 + Math.random() * 70;
    sp.scale.set(sz, sz * aRatio, 1);
    scene.add(sp);
  }
}

// ── 5. Stellar system data ────────────────────────────────────────────────────
const SYSTEMS = {
  about: {
    title:'About', starColor:0xffee88, glowColor:0xffcc44, starRadius:7, camRadius:120,
    planets:[
      { name:'Background', color:0x4488cc, radius:3.5, orbitR:30, orbitSpeed:0.38, startAngle:0,
        content:{ type:'info', heading:'Background',
          body:"2nd year CS & Astrophysics double major at the University of Toronto.\nPassionate about AI systems, algorithm design, and the physics of the cosmos." }},
      { name:'Skills', color:0x44cc88, radius:3.0, orbitR:50, orbitSpeed:0.28, startAngle:Math.PI*0.7,
        content:{ type:'skills', heading:'Technical Skills',
          skills:['Python','Java','JavaScript','C','SQL','React','FastAPI','Tkinter','Git','Three.js','Graph Neural Networks','LLM Integration'] }},
      { name:'Interests', color:0x9955dd, radius:2.8, orbitR:70, orbitSpeed:0.20, startAngle:Math.PI*1.4,
        content:{ type:'info', heading:'Interests',
          body:"Astrophysics · Computational methods in physics · AI systems\nAlgorithm design · Building tools that solve real problems." }},
    ],
  },

  projects: {
    title:'Projects', starColor:0x99ccff, glowColor:0x5588ee, starRadius:8, camRadius:170,
    planets:[
      { name:'Sudoku Solver', color:0xb8a898, radius:2.8, orbitR:30, orbitSpeed:0.50, startAngle:0,
        // Mercury-like — warm grey with faint brown undertone
        content:{ type:'project', heading:'Sudoku Solver', meta:'Python',
          body:'Backtracking solver with constraint propagation and MRV heuristic — significantly faster than naive approaches on real puzzles.',
          url:'https://github.com/ShubhamMohta29/sudoku-solver' }},
      { name:'Portfolio', color:0x3a8fd4, radius:2.5, orbitR:46, orbitSpeed:0.36, startAngle:Math.PI*0.4,
        // Earth-like — ocean blue
        content:{ type:'project', heading:'Portfolio', meta:'JavaScript · HTML · CSS · Three.js',
          body:'Designed and built from scratch. 3D spiral galaxy background, interactive stellar navigation system where each section is its own planetary system.',
          url:'https://github.com/ShubhamMohta29/portfolio-shubham.git' }},
      { name:'H.A.D.E.S.', color:0xd44a2a, radius:3.0, orbitR:62, orbitSpeed:0.27, startAngle:Math.PI*0.9,
        // Mars — rusty iron-oxide red
        content:{ type:'project', heading:'H.A.D.E.S.', meta:'Python · Tkinter · GROQ AI',
          body:'Human Assistance and Decision Engine System — a fully voice-activated AI assistant inspired by JARVIS, built in Python.',
          url:'https://github.com/ShubhamMohta29/HADES.git' }},
      { name:'Argus', color:0xe8a44a, radius:3.8, orbitR:79, orbitSpeed:0.21, startAngle:Math.PI*1.5, hasRings:true, ringColor:0xd4b86a,
        // Jupiter/Saturn — warm amber with cream rings
        content:{ type:'project', heading:'Argus', meta:'Python · React · FastAPI · PaySim',
          body:'Real-time Anti-Money Laundering platform using a Graph Neural Network and Gemini AI. Scores 9M accounts for fraud risk and auto-generates Suspicious Activity Reports.',
          url:'https://github.com/ShubhamMohta29/GenAI-Hackathon.git' }},
      { name:'Animal Encyclopedia', color:0x4ab87a, radius:2.5, orbitR:97, orbitSpeed:0.16, startAngle:Math.PI*0.2,
        // Lush jungle world — vivid forest green
        content:{ type:'project', heading:'Animal Encyclopedia', meta:'Java · Swing · REST APIs',
          body:'Desktop encyclopedia built with a team of 6. Led the search backend (entity parsing, API client, Clean Architecture interactor chain) and built several Swing UI screens.',
          url:'https://github.com/ShubhamMohta29/AnimalEncyclopedia.git' }},
    ],
  },

  contact: {
    title:'Contact', starColor:0xff9944, glowColor:0xff6622, starRadius:7, camRadius:115,
    planets:[
      { name:'Email', color:0xff6633, radius:3.2, orbitR:28, orbitSpeed:0.42, startAngle:Math.PI*0.3,
        // Volcanic — bright lava orange
        content:{ type:'link', heading:'Email', value:'shubham.mohta.2995@gmail.com',
          url:'mailto:shubham.mohta.2995@gmail.com', btnLabel:'Send email →' }},
      { name:'GitHub', color:0x9a9ea8, radius:3.0, orbitR:46, orbitSpeed:0.30, startAngle:Math.PI*1.1,
        // Moon/rocky — neutral slate
        content:{ type:'link', heading:'GitHub', value:'ShubhamMohta29',
          url:'https://github.com/ShubhamMohta29', btnLabel:'View profile →' }},
      { name:'LinkedIn', color:0x2a5fd4, radius:3.4, orbitR:65, orbitSpeed:0.22, startAngle:Math.PI*1.8, hasRings:true, ringColor:0x5588ee,
        // Neptune-like — deep cobalt blue with glowing rings
        content:{ type:'link', heading:'LinkedIn', value:'shubham-mohta',
          url:'https://www.linkedin.com/in/shubham-mohta-9902a2260/', btnLabel:'Connect →' }},
    ],
  },

  resume: {
    title:'Résumé', starColor:0xddeeff, glowColor:0xaaccff, starRadius:7, camRadius:118,
    planets:[
      { name:'Education', color:0x66bbee, radius:3.5, orbitR:28, orbitSpeed:0.40, startAngle:Math.PI*0.2,
        // Ice giant — pale arctic blue
        content:{ type:'info', heading:'Education',
          body:"University of Toronto\nB.Sc. Computer Science & Astrophysics · Math Minor\n2023 – present" }},
      { name:'Skills', color:0x44ccbb, radius:3.0, orbitR:47, orbitSpeed:0.29, startAngle:Math.PI*1.0,
        // Uranus-like — aquamarine teal
        content:{ type:'skills', heading:'Skills',
          skills:['Python','Java','JavaScript','C','SQL','React','FastAPI','Tkinter','Git','Graph Neural Networks','GROQ AI','Gemini AI'] }},
      { name:'View Résumé', color:0xe8c84a, radius:2.8, orbitR:65, orbitSpeed:0.21, startAngle:Math.PI*1.6, hasRings:true, ringColor:0xc8a832,
        // Saturn — golden with dusty rings
        content:{ type:'pdf', heading:'Résumé PDF', url:'resume.pdf' }},
    ],
  },
};

// ── 6. Stellar system builder ─────────────────────────────────────────────────
function buildStellarSystem(id) {
  const sys = SYSTEMS[id];
  const group = new THREE.Group();

  group.add(new THREE.AmbientLight(0x223355, 0.75));
  group.add(new THREE.PointLight(sys.starColor, 5.0, 400));

  const starMesh = new THREE.Mesh(
    new THREE.SphereGeometry(sys.starRadius, 32, 32),
    new THREE.MeshBasicMaterial({ color: sys.starColor })
  );
  group.add(starMesh);

  const starGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radialTex(128,[
      [0,   hex2rgba(sys.glowColor, 1.0)],
      [0.15,hex2rgba(sys.glowColor, 0.6)],
      [0.45,hex2rgba(sys.glowColor, 0.15)],
      [0.75,hex2rgba(sys.glowColor, 0.03)],
      [1,   'rgba(0,0,0,0)'],
    ]),
    transparent:true, blending:THREE.AdditiveBlending, depthWrite:false,
  }));
  starGlow.scale.setScalar(sys.starRadius * 7);
  group.add(starGlow);

  const planetObjs = sys.planets.map(pd => {
    const ringPts = [];
    for (let j=0; j<=128; j++) {
      const a = (j/128)*Math.PI*2;
      ringPts.push(new THREE.Vector3(Math.cos(a)*pd.orbitR, 0, Math.sin(a)*pd.orbitR));
    }
    group.add(new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(ringPts),
      new THREE.LineBasicMaterial({ color:0x223355, transparent:true, opacity:0.35 })
    ));

    const pMesh = new THREE.Mesh(
      new THREE.SphereGeometry(pd.radius, 28, 28),
      new THREE.MeshStandardMaterial({
        color: pd.color, emissive: pd.color, emissiveIntensity: 0.55,
        roughness: 0.65, metalness: 0.12,
      })
    );
    pMesh.position.set(Math.cos(pd.startAngle)*pd.orbitR, 0, Math.sin(pd.startAngle)*pd.orbitR);
    group.add(pMesh);

    const atmSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: radialTex(64,[
        [0,   hex2rgba(pd.color, 0.55)],
        [0.4, hex2rgba(pd.color, 0.12)],
        [0.75,hex2rgba(pd.color, 0.03)],
        [1,   'rgba(0,0,0,0)'],
      ]),
      transparent:true, blending:THREE.AdditiveBlending, depthWrite:false,
    }));
    atmSprite.scale.setScalar(pd.radius * 5.5);
    pMesh.add(atmSprite);

    if (pd.hasRings) {
      const ringMesh = new THREE.Mesh(
        new THREE.RingGeometry(pd.radius*1.45, pd.radius*2.3, 64),
        new THREE.MeshBasicMaterial({ color: pd.ringColor || pd.color, side: THREE.DoubleSide, transparent: true, opacity: 0.45 })
      );
      ringMesh.rotation.x = Math.PI / 2 + 0.35;
      pMesh.add(ringMesh);
    }

    return { mesh: pMesh, data: pd, angle: pd.startAngle };
  });

  return { group, planetObjs, sys, starMesh, starGlow };
}

// ── 7. Camera helpers ─────────────────────────────────────────────────────────
const CAM_R    = 185;
const BASE_PHI = 1.18;

function positionCamera(theta, phi, r=CAM_R) {
  camera.position.set(
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.cos(theta)
  );
  camera.lookAt(0, 0, 0);
}
positionCamera(0, BASE_PHI);

// ── 8. Mouse & raycasting ─────────────────────────────────────────────────────
let mx=0, my=0, smoothMX=0, smoothMY=0;
const mouse2D   = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let hoveredNavIdx    = -1;
let hoveredPlanetIdx = -1;

window.addEventListener('mousemove', e => {
  mx = e.clientX/window.innerWidth  - 0.5;
  my = e.clientY/window.innerHeight - 0.5;
  mouse2D.x =  (e.clientX/window.innerWidth)  * 2 - 1;
  mouse2D.y = -(e.clientY/window.innerHeight) * 2 + 1;
});

// ── 9. Navigation state ───────────────────────────────────────────────────────
let viewState       = 'galaxy';  // 'galaxy' | 'stellar' | 'transition'
let currentSys      = null;
// Multiplier applied to camRadius when entering a stellar system; eases to 1 in animate loop
let stellarEntryZoom = 1.0;

const overlay      = document.getElementById('overlay');
const stellarBack  = document.getElementById('stellar-back');
const stellarTitle = document.getElementById('stellar-title');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function goToSystem(id) {
  if (viewState !== 'galaxy') return;
  viewState = 'transition';

  // Capture nav star's world position at click time (galaxy may be mid-rotation)
  const navIdx = NAV_DEFS.findIndex(d => d.page === id);
  const navPos = new THREE.Vector3();
  navSprites[navIdx].getWorldPosition(navPos);

  // Zoom camera 72% of the way toward the nav star over ~820 ms
  const startPos = camera.position.clone();
  const zoomDest = startPos.clone().lerp(navPos, 0.72);
  const ZOOM_MS  = 820;
  const t0       = performance.now();

  await new Promise(resolve => {
    (function tick() {
      const p = Math.min((performance.now() - t0) / ZOOM_MS, 1);
      const e = p < 0.5 ? 2*p*p : -1 + (4 - 2*p)*p; // ease-in-out quad
      camera.position.lerpVectors(startPos, zoomDest, e);
      camera.lookAt(navPos);
      if (p < 1) requestAnimationFrame(tick); else resolve();
    })();
  });

  // Quick flash hides the scene swap (fast CSS transition variant)
  overlay.classList.add('fast', 'visible');
  await sleep(160);

  galaxySceneGroup.visible = false;
  document.body.classList.replace('galaxy-view', 'stellar-view');

  if (id === 'about') {
    document.body.classList.add('about-view');
    document.getElementById('about-page').classList.add('active');
    overlay.classList.remove('fast', 'visible');
    await sleep(60);
    viewState = 'stellar';
    return;
  }

  if (currentSys) scene.remove(currentSys.group);
  currentSys = buildStellarSystem(id);
  scene.add(currentSys.group);
  createPlanetLabels(currentSys.planetObjs);
  stellarTitle.textContent = currentSys.sys.title;

  // Start camera far out; stellarEntryZoom eases it in via the animate loop
  stellarEntryZoom = 2.4;
  positionCamera(0, BASE_PHI, currentSys.sys.camRadius * stellarEntryZoom);

  overlay.classList.remove('fast', 'visible');
  await sleep(60);
  viewState = 'stellar';
}

async function goToGalaxy() {
  if (viewState !== 'stellar') return;
  viewState = 'transition';
  closePlanetSheet();
  closePDFModal();

  // Close about page if it was open
  document.getElementById('about-page').classList.remove('active');
  document.body.classList.remove('about-view');

  // Zoom out briefly before fading — only when a stellar system is active
  if (currentSys) {
    const camR     = currentSys.sys.camRadius;
    const thetaRef = clock.getElapsedTime() * 0.008 + smoothMX * 0.35;
    const phiRef   = Math.max(0.55, Math.min(1.32, BASE_PHI + smoothMY * 0.3));
    const ZOOM_MS  = 350;
    const t0       = performance.now();

    await new Promise(resolve => {
      (function tick() {
        const p = Math.min((performance.now() - t0) / ZOOM_MS, 1);
        const e = p * p;
        positionCamera(thetaRef + p * 0.06, phiRef, camR * (1 + e * 2.0));
        if (p < 1) requestAnimationFrame(tick); else resolve();
      })();
    });
  }

  overlay.classList.add('visible');
  await sleep(480);

  if (currentSys) { scene.remove(currentSys.group); currentSys = null; }
  clearPlanetLabels();

  document.body.classList.replace('stellar-view', 'galaxy-view');
  galaxySceneGroup.visible = true;
  positionCamera(clock.getElapsedTime() * 0.01, BASE_PHI);

  overlay.classList.remove('visible');
  await sleep(60);
  viewState = 'galaxy';
}

stellarBack.addEventListener('click', goToGalaxy);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (pdfModal.classList.contains('active')) { closePDFModal(); return; }
    closePlanetSheet();
    if (viewState === 'stellar') goToGalaxy();
  }
});
NAV_DEFS.forEach(({ page }) => {
  const el = document.getElementById(`label-${page}`);
  if (el) el.addEventListener('click', () => goToSystem(page));
});

// ── 10. PDF modal ─────────────────────────────────────────────────────────────
const pdfModal = document.getElementById('pdf-modal');
const pdfFrame = document.getElementById('pdf-frame');
document.getElementById('pdf-close').addEventListener('click', closePDFModal);

function openPDFModal(url) {
  pdfFrame.src = url;
  pdfModal.classList.add('active');
}
function closePDFModal() {
  pdfModal.classList.remove('active');
  pdfFrame.src = '';
}

// ── 11. Planet sheet ──────────────────────────────────────────────────────────
const planetSheet  = document.getElementById('planet-sheet');
const sheetContent = document.getElementById('sheet-content');
document.getElementById('sheet-close').addEventListener('click', closePlanetSheet);

function openPlanetSheet(pd) {
  const c = pd.content;
  if (c.type === 'pdf') { openPDFModal(c.url); return; }

  let html = '';
  if (c.type === 'project') {
    html = `<p class="sheet-meta">${c.meta}</p>
            <h2 class="sheet-title">${c.heading}</h2>
            <p class="sheet-body">${c.body}</p>
            <a class="sheet-link" href="${c.url}" target="_blank">View on GitHub →</a>`;
  } else if (c.type === 'link') {
    html = `<h2 class="sheet-title">${c.heading}</h2>
            <p class="sheet-value">${c.value}</p>
            <a class="sheet-link" href="${c.url}" target="${c.url.startsWith('mailto')?'_self':'_blank'}">${c.btnLabel}</a>`;
  } else if (c.type === 'info') {
    html = `<h2 class="sheet-title">${c.heading}</h2>
            <p class="sheet-body">${c.body}</p>`;
  } else if (c.type === 'skills') {
    html = `<h2 class="sheet-title">${c.heading}</h2>
            <div class="sheet-skills">${c.skills.map(s=>`<span>${s}</span>`).join('')}</div>`;
  }
  sheetContent.innerHTML = html;
  planetSheet.classList.add('active');
  document.body.classList.add('sheet-open');
}

function closePlanetSheet() {
  planetSheet.classList.remove('active');
  document.body.classList.remove('sheet-open');
}

// ── 12. Label utilities ───────────────────────────────────────────────────────
const _wp  = new THREE.Vector3();
const _ndc = new THREE.Vector3();
const _cd  = new THREE.Vector3();
const _cs  = new THREE.Vector3();

function projectLabel(worldPos, labelEl) {
  camera.getWorldDirection(_cd);
  _cs.copy(worldPos).sub(camera.position).normalize();
  if (_cd.dot(_cs) <= 0.05) { labelEl.style.display='none'; return false; }
  _ndc.copy(worldPos).project(camera);
  labelEl.style.display = '';
  labelEl.style.left = ((_ndc.x+1)/2*window.innerWidth) + 'px';
  labelEl.style.top  = ((-_ndc.y+1)/2*window.innerHeight) + 'px';
  return true;
}

function updateNavLabels(t) {
  NAV_DEFS.forEach(({ page }, i) => {
    const sp    = navSprites[i];
    const label = document.getElementById(`label-${page}`);
    if (!label) return;
    sp.getWorldPosition(_wp);
    projectLabel(_wp, label);
    label.classList.toggle('hovered', hoveredNavIdx===i);
    const base  = hoveredNavIdx===i ? 22 : 15;
    const pulse = 1 + 0.18*Math.sin(t*1.8+i*1.2);
    sp.scale.setScalar(base*pulse);
  });
}

function createPlanetLabels(planetObjs) {
  const ctr = document.getElementById('planet-labels');
  ctr.innerHTML = '';
  planetObjs.forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'planet-label';
    el.id = `planet-label-${i}`;
    el.textContent = p.data.name;
    el.addEventListener('click', () => openPlanetSheet(p.data));
    ctr.appendChild(el);
  });
}

function clearPlanetLabels() {
  document.getElementById('planet-labels').innerHTML = '';
}

function updatePlanetLabels() {
  if (!currentSys) return;
  currentSys.planetObjs.forEach((p, i) => {
    const label = document.getElementById(`planet-label-${i}`);
    if (!label) return;
    _wp.copy(p.mesh.position).y += p.data.radius + 1.5;
    projectLabel(_wp, label);
    label.classList.toggle('hovered', hoveredPlanetIdx===i);
  });
}

// ── 13. Raycasting updaters ───────────────────────────────────────────────────
function updateNavHover() {
  raycaster.setFromCamera(mouse2D, camera);
  const hits = raycaster.intersectObjects(navHitMeshes);
  const prev = hoveredNavIdx;
  hoveredNavIdx = hits.length > 0 ? navHitMeshes.indexOf(hits[0].object) : -1;
  if (hoveredNavIdx !== prev)
    document.body.style.cursor = hoveredNavIdx>=0 ? 'pointer' : '';
}

function updatePlanetHover() {
  if (!currentSys) return;
  const meshes = currentSys.planetObjs.map(p=>p.mesh);
  raycaster.setFromCamera(mouse2D, camera);
  const hits = raycaster.intersectObjects(meshes);
  const prev = hoveredPlanetIdx;
  hoveredPlanetIdx = hits.length>0 ? meshes.indexOf(hits[0].object) : -1;
  if (hoveredPlanetIdx !== prev)
    document.body.style.cursor = hoveredPlanetIdx>=0 ? 'pointer' : '';
  currentSys.planetObjs.forEach((p, i) => {
    const hov = hoveredPlanetIdx===i ? 1 : 0;
    const tScale = 1.0 + hov*0.28;
    p.mesh.scale.x += (tScale - p.mesh.scale.x) * 0.12;
    p.mesh.scale.y = p.mesh.scale.z = p.mesh.scale.x;
    p.mesh.material.emissiveIntensity += ((0.55 + hov*0.40) - p.mesh.material.emissiveIntensity) * 0.12;
  });
}

canvas.addEventListener('click', () => {
  if (viewState === 'galaxy') {
    raycaster.setFromCamera(mouse2D, camera);
    const hits = raycaster.intersectObjects(navHitMeshes);
    if (hits.length>0) goToSystem(NAV_DEFS[navHitMeshes.indexOf(hits[0].object)].page);
  } else if (viewState === 'stellar' && currentSys) {
    const meshes = currentSys.planetObjs.map(p=>p.mesh);
    raycaster.setFromCamera(mouse2D, camera);
    const hits = raycaster.intersectObjects(meshes);
    if (hits.length>0) openPlanetSheet(currentSys.planetObjs[meshes.indexOf(hits[0].object)].data);
  }
});

// ── 14. Animation loop ────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let lastT = 0;

function animate() {
  requestAnimationFrame(animate);
  const t  = clock.getElapsedTime();
  const dt = Math.min(t - lastT, 0.05);
  lastT = t;

  smoothMX += (mx - smoothMX) * 0.04;
  smoothMY += (my - smoothMY) * 0.04;

  if (viewState === 'galaxy') {
    galaxy.rotation.y = t * 0.06;
    galaxy.updateMatrixWorld(true);
    positionCamera(t*0.01 + smoothMX*0.55, Math.max(0.65, Math.min(1.48, BASE_PHI+smoothMY*0.38)));
    updateNavLabels(t);
    updateNavHover();

  } else if (viewState === 'stellar' && currentSys) {
    const { planetObjs, sys, starMesh, starGlow } = currentSys;

    planetObjs.forEach(p => {
      p.angle += p.data.orbitSpeed * dt;
      p.mesh.position.x = Math.cos(p.angle) * p.data.orbitR;
      p.mesh.position.z = Math.sin(p.angle) * p.data.orbitR;
      p.mesh.rotation.y += dt * 0.4;
    });

    const pulse = 1 + 0.04*Math.sin(t*1.8);
    starMesh.scale.setScalar(pulse);
    starGlow.scale.setScalar(sys.starRadius * 7 * (1 + 0.06*Math.sin(t*1.8)));

    // Ease the entry zoom multiplier toward 1 each frame
    stellarEntryZoom += (1.0 - stellarEntryZoom) * 0.025;

    const sTheta = t*0.008 + smoothMX*0.35;
    const sPhi   = Math.max(0.55, Math.min(1.32, BASE_PHI + smoothMY*0.3));
    positionCamera(sTheta, sPhi, sys.camRadius * stellarEntryZoom);

    updatePlanetLabels();
    updatePlanetHover();
  }

  renderer.render(scene, camera);
}

animate();

// ── 15. Resize ────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
