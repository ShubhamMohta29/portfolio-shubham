# Codebase Reference

A file-by-file guide to the portfolio. For every file: what it is, why it exists, what everything inside it does, and what breaks if you change it.

---

## Architecture overview

The code follows Clean Architecture. Dependencies only flow inward:

```
index.html / style.css          ← entry points (no JS logic)
src/main.js                     ← composition root (wires everything together)
src/frameworks/                 ← Three.js, DOM events, render loop
src/adapters/                   ← scene builders, label management, sheet HTML
src/usecases/                   ← navigation state, planet interaction
src/entities/                   ← raw data (no imports from any other layer)
```

The rule: inner layers never import outer layers. `systems.js` knows nothing about Three.js. `NavigationUseCase` knows nothing about the DOM structure. `main.js` is the only place all layers meet.

---

## Root files

### `index.html`

The page shell. Contains zero logic — all behaviour lives in JS.

**What's in it:**

- `<link rel="stylesheet" href="style.css">` — loads the stylesheet.
- `<script type="importmap">` — maps the bare `"three"` specifier to the unpkg CDN URL, so all JS files can write `import * as THREE from 'three'` without a bundler.
- `<canvas id="bg">` — the full-screen Three.js render surface. The renderer draws into this element.
- `<div id="overlay">` — a full-screen black div used for fade transitions between galaxy and stellar views. It's invisible by default; JS adds/removes the `visible` and `fast` CSS classes to control opacity.
- `.home-hero` block — the name, major, and "navigate the stars" hint that sit at the top of the galaxy view. Fades out via CSS when `body.stellar-view` is active.
- `.star-label` divs (`#label-about`, `#label-projects`, `#label-contact`, `#label-resume`) — the four navigation labels that float above the nav stars. Their positions are updated every frame by `LabelAdapter.js`. They are always in the DOM; JS and CSS show/hide them.
- `#stellar-back` button — the "← galaxy" button shown in stellar view.
- `#stellar-title` — the system name shown at the top in stellar view (e.g. "Projects").
- `.stellar-hint` — the "click a planet to explore" text shown in stellar view.
- `#planet-labels` — empty container; planet label divs are created and destroyed dynamically by `LabelAdapter.js`.
- `#planet-sheet` / `#sheet-content` — the bottom sheet panel. JS adds the `active` class to slide it up; sheet content HTML is written into `#sheet-content`.
- `#sheet-backdrop` — an invisible full-screen div that sits behind the sheet; clicking it closes the sheet.
- `#about-page` — the About section rendered as a full-screen HTML overlay (not a 3D system). Hidden by default; JS adds `active` to show it.
- `#pdf-modal` / `#pdf-frame` — the résumé PDF viewer. The `<iframe>` src is set to `resume.pdf` when opened.
- `<script type="module" src="src/main.js">` — the entry point for all JavaScript.

**If you change it:**
- Add a new section: add a `.star-label`, a new `SYSTEMS` entry, a `NAV_DEFS` entry, and (if page-type) the HTML page element. Nothing else changes.
- Change the importmap URL (e.g. upgrade Three.js version): all 3D rendering changes. Test carefully — Three.js has breaking changes between minor versions.
- Remove `id="bg"`: the renderer will fail to find the canvas and throw on startup.
- Remove `id="overlay"`: `NavigationUseCase` will find `null` and throw when trying to fade in/out.

---

### `style.css`

All visual styling. No logic. Classes are toggled by JS on `document.body` to switch between views.

**Body state classes:**

| Class | Set when | Effect |
|---|---|---|
| `galaxy-view` | in galaxy | default; hides stellar HUD, shows star labels |
| `stellar-view` | in any stellar system | shows back button, title, hint; hides home hero |
| `sheet-open` | planet sheet is open | hides stellar hint, dims planet sidebar |
| `about-view` | About section is open | hides stellar title and hint |

**Key sections:**

- **`:root`** — CSS custom properties. `--ink`, `--ink-2`, `--ink-3` are text colour tiers. `--accent` is the cyan highlight used on buttons, links, and hover states. The three `--font-*` vars map to Google Fonts (Space Grotesk for display, DM Sans for body, DM Mono for monospace labels).
- **`#bg`** — the canvas. `position: fixed; inset: 0; z-index: 0` makes it the bottom layer.
- **`#overlay`** — starts at `opacity: 0`, transitions to `opacity: 1` when `.visible` is added. The `.fast` variant overrides the transition duration to 0.18s for the quick flash during zoom-in (the standard 0.55s is used for the slower fade-to-galaxy).
- **`.home-hero`** — `justify-content: flex-start; padding-top: 3rem` places the name and majors at the top. `pointer-events: none` lets mouse events pass through to the 3D canvas.
- **`.star-label`** / **`.planet-label`** — positioned with `transform: translate(-50%, calc(-100% - 14px))` so the label sits centred above its anchor point with a gap. The `::after` pseudo-element draws the 1px vertical stem line below the label.
- **`.planet-sheet`** — starts off-screen with `transform: translateY(100%)`, slides in when `.active` is added. Uses `backdrop-filter: blur(28px)` for the frosted-glass effect.
- **`#about-page`** — hidden at `opacity: 0; pointer-events: none` by default. Fades in with `.active`.
- **`#pdf-modal`** — same pattern as the about page. The `<iframe>` fills all remaining vertical space with `flex: 1; min-height: 0`.
- **`#planet-sidebar`** — right-edge sidebar (currently styled but populated dynamically). Shows only in `stellar-view`.
- **`#sheet-backdrop`** — zero-opacity, covers the screen behind the sheet. Receives pointer events only when `.active`.
- **Media queries** — two breakpoints: `max-width: 600px` (about page goes vertical, photo shrinks) and `max-width: 560px` (sheet max-height and padding adjust for phones).

**If you change it:**
- Change `--accent`: the cyan colour updates everywhere — buttons, hover states, links, eyebrow text.
- Remove `body.stellar-view .home-hero { opacity: 0 }`: the name/majors will remain visible in stellar systems.
- Remove the `.active` transform on `.planet-sheet`: the sheet will never slide up.
- Change the font links in `index.html` without updating `--font-display` / `--font-body`: the fallback sans-serif will be used.

---

## Entities layer — `src/entities/`

Pure data. No imports except from each other. These files define what the portfolio contains.

### `src/entities/navDefs.js`

The four navigation stars: their 3D positions in the galaxy and their accent colours.

**`NAV_DEFS`** — array of four objects:
- `page` — string key (`'about'`, `'projects'`, `'contact'`, `'resume'`). Used to look up the system in `SYSTEMS`, to find the matching `.star-label` in the DOM (`#label-about` etc.), and to call `goToSystem(page)`.
- `pos` — `[x, y, z]` world-space coordinates inside the galaxy. These place the star within the spiral.
- `color` — hex colour used to tint the nav star sprite and (in some cases) the label.

The order matters: `navSprites[i]` and `navHitMeshes[i]` in `GalaxyBuilder` are built in the same order as this array. `InputDriver` and `AnimationLoop` use `indexOf` to match a raycast hit back to an index into this array.

**If you change it:**
- Add a new entry: also add the corresponding `SYSTEMS` entry, the `.star-label` in `index.html`, and (if page-type) the HTML page. Everything else scales automatically.
- Change `pos`: the star moves in 3D space. It still rotates with the galaxy. The hit-mesh moves with it.
- Change `page` key: must match the key in `SYSTEMS`, the `#label-{page}` id in `index.html`, and any `#${page}-page` element.

---

### `src/entities/systems.js`

The content of every section. This is the single source of truth for everything that appears in the portfolio.

**`SYSTEMS`** — object keyed by the same page strings as `NAV_DEFS`. Each system has:

- `title` — displayed in `#stellar-title` when you enter that system.
- `viewType` (optional) — `'page'` means the system renders as an HTML overlay, not a 3D scene. When omitted, a stellar system is built. Currently only `about` uses `'page'`.
- `starColor` / `glowColor` — hex colours for the central star mesh and its glow sprite.
- `starRadius` — radius of the central star sphere in world units.
- `camRadius` — the orbit radius the camera settles at when viewing this system. Larger = more zoomed out.
- `planets` — array of planet data objects, each with:
  - `name` — shown on the planet label.
  - `color` — hex colour for the planet mesh and atmosphere glow.
  - `radius` — planet sphere radius.
  - `orbitR` — orbit ring radius.
  - `orbitSpeed` — radians per second the planet moves along its orbit.
  - `startAngle` — initial angle on the orbit (radians), so planets don't all line up at startup.
  - `hasRings` (optional) — if true, a `RingGeometry` is added to the planet.
  - `ringColor` (optional) — ring colour; falls back to `color` if omitted.
  - `content` — what appears in the bottom sheet when this planet is clicked:
    - `type: 'project'` — shows meta line, title, body text, GitHub link.
    - `type: 'link'` — shows title, value text, an anchor button.
    - `type: 'info'` — shows title and body text (used for About / Education).
    - `type: 'skills'` — shows title and a flex row of skill tags.
    - `type: 'pdf'` — opens the PDF modal instead of the sheet.

**If you change it:**
- Change `camRadius`: the camera zooms in/out when entering that system. Also affects the exit zoom animation speed (it zooms out from `camRadius * 1+`).
- Add a planet: appears in the 3D scene and gets a label. Costs nothing else.
- Change `content.type: 'pdf'` to another type: the planet will open a sheet instead of the PDF modal.
- Add a system with `viewType: 'page'`: it will render as an HTML overlay. You must also add `#${key}-page` in `index.html` and a corresponding `.star-label`.
- Remove a system: its nav star still exists (defined in `NAV_DEFS`). Remove the `NAV_DEFS` entry too, or clicking that star will silently do nothing.

---

## Interface Adapters layer — `src/adapters/`

Translate between entities/use-cases and the frameworks (Three.js, DOM). None of these files hold application state.

### `src/adapters/TextureFactory.js`

Creates `THREE.CanvasTexture` objects by drawing onto a 2D canvas element.

**`radialTex(size, stops)`** — generic radial gradient texture. `size` is canvas width/height in pixels. `stops` is an array of `[position, cssColor]` pairs passed to `createRadialGradient`. Used for: star point sprites (white → transparent), core glow (warm white → transparent), and planet atmospheres.

**`hex2rgba(hex, a)`** — converts a 0xRRGGBB hex number and alpha float into a CSS `rgba()` string. Used throughout `StellarSystemBuilder` to derive atmosphere and glow colours directly from the planet's hex colour.

**`makeNavStarTex()`** — builds the nav-star sprite texture. Draws three layers on a 128×128 canvas: (1) a faint blue outer glow, (2) a small bright white core, (3) two perpendicular lens-flare streaks using linear gradients. Gives the nav stars their distinctive star-cross look.

**`makeDistantGalaxyTex(r, g, b, aspect, angle)`** — builds an elliptical soft blob on a 64×64 canvas, rotated by `angle` and squashed by `aspect`. Used for the 45 background galaxy sprites.

**If you change it:**
- Change `radialTex` stops: affects every texture that calls it — background stars, core glow, planet atmospheres. All share the same function.
- Change `makeNavStarTex` inner core size: the bright dot at the centre of each nav star changes.
- These textures are created once at startup and never recreated. If you add a new texture type, add a new export function rather than modifying an existing one.

---

### `src/adapters/GalaxyBuilder.js`

Builds the main galaxy particle system, background star field, and distant galaxy sprites.

**`buildGalaxy(starTex, coreGlowTex, navStarTex)`**

Returns `{ galaxy, navSprites, navHitMeshes }`.

- `galaxy` — a `THREE.Group`. Rotates as a unit each frame in `AnimationLoop`. Contains all galaxy stars, the core glow sprite, and all nav stars/hit-meshes (so they orbit with the galaxy).
- Internally generates a `Float32Array` of positions and colours for `ARMS * ARM_N + CORE_N + HALO_N` total particles, then creates one `THREE.Points` mesh from them.
  - `ARMS = 3` — number of spiral arms.
  - `ARM_N = 9000` — stars per arm.
  - `CORE_N = 2700` — dense warm-coloured central stars.
  - `HALO_N = 2000` — sparse cool stars scattered around the disc.
  - `MAX_R = 110` — maximum spiral arm radius in world units.
  - `WINDINGS = 2.2` — how many full rotations each arm makes from centre to edge.
- Core stars use `Math.pow(random, 1.8)` to concentrate them near radius 0, flattened on the Y axis by 0.25.
- Halo stars use `Math.pow(random, 0.4)` which skews them outward, flattened by 0.45.
- Nav stars: iterates `NAV_DEFS` and creates one `THREE.Sprite` (visual) and one invisible `THREE.Mesh` (raycasting hit target, 10-unit sphere) per entry. Both are added to `galaxy` so they rotate with it.
- `navSprites` and `navHitMeshes` are parallel arrays: index N in one corresponds to `NAV_DEFS[N]`.

**`buildBackground(starTex)`**

Creates 12,000 background stars scattered on a sphere shell between radius 600 and 1500. Does not rotate. Remains visible in both galaxy and stellar views.

**`buildDistantGalaxies()`**

Returns an array of 45 `THREE.Sprite` objects placed on a sphere shell between radius 700 and 1400. Each gets a unique ellipse texture (different aspect ratio, rotation, and RGB tint from 5 preset palettes). Scattered randomly using spherical coordinates.

**If you change it:**
- `ARMS`: changing to 2 gives a classic barred spiral; 4+ gives a denser, less distinct look.
- `ARM_N` / `CORE_N` / `HALO_N`: higher = more stars, heavier GPU cost. The `total` variable must always equal `ARMS * ARM_N + CORE_N + HALO_N` — if those constants don't match `total`, the `Float32Array` is the wrong size and the geometry will be corrupt.
- Changing a star's `col` values: arm stars are blue-white, core stars are warm yellow-orange, halo stars are cool blue-grey. Swap these to change the galaxy's colour palette.
- `MAX_R`: makes the galaxy physically larger or smaller in the scene. The camera radius (`CAM_R = 185`) should be larger than `MAX_R` or you'll be inside the galaxy.

---

### `src/adapters/StellarSystemBuilder.js`

Builds a complete 3D planetary system from a `SYSTEMS[id]` entry.

**`buildStellarSystem(id)`**

Returns `{ group, planetObjs, sys, starMesh, starGlow }`.

- `group` — `THREE.Group` added to the scene. Contains everything for this system. Removed from the scene when navigating away.
- `sys` — the raw `SYSTEMS[id]` object, passed through for use in the animation loop (accessing `sys.camRadius`, `sys.starRadius`).
- `starMesh` — `THREE.Mesh` with `SphereGeometry` and `MeshBasicMaterial`. Pulses in scale in `AnimationLoop`.
- `starGlow` — `THREE.Sprite` using a radial gradient texture derived from `sys.glowColor`. Also pulses in `AnimationLoop`.
- Lights: one `AmbientLight` (dark blue-grey, 0.75 intensity) and one `PointLight` (star colour, intensity 5, range 400) are added to `group`.
- **Per planet:**
  - Orbit ring — `THREE.LineLoop` from 128-segment circle of points. Faint dark blue, 35% opacity.
  - `pMesh` — `THREE.Mesh` with `SphereGeometry(radius, 28, 28)` and `MeshStandardMaterial`. Has both `color` and `emissive` set to the planet colour so it glows even without direct lighting.
  - Atmosphere — `THREE.Sprite` child of `pMesh`, using a radial gradient from the planet colour. Moves with the planet.
  - Rings (if `hasRings`) — `THREE.Mesh` with `RingGeometry`, rotated 0.35 radians off the XZ plane. Child of `pMesh`.
- `planetObjs` — array of `{ mesh, data, angle }`. `angle` starts at `data.startAngle` and is incremented each frame by `AnimationLoop`. `data` is the raw planet entry from `SYSTEMS`.

**If you change it:**
- Change `SphereGeometry(radius, 28, 28)`: reduce segments (e.g. 16,16) for less GPU cost; increase for smoother spheres.
- Change `emissiveIntensity: 0.55`: lower = darker planets; higher = more neon. This is the rest value; `AnimationLoop` lerps it between `0.55` and `0.95` on hover.
- Change `AmbientLight` intensity: affects how lit planet dark-sides are.
- Add a new visual element (e.g. atmosphere thickness): add it here in the planet loop. You can read any field from `pd` (the planet data object).

---

### `src/adapters/LabelAdapter.js`

Manages all HTML labels — nav star labels in galaxy view and planet labels in stellar view.

**`projectLabel(worldPos, labelEl, camera)`** — takes a `THREE.Vector3` world position, projects it to NDC, then converts to CSS `left`/`top` pixel positions. If the point is behind the camera (dot product check), the label is hidden. Called every frame for each visible label.

**`updateNavLabels(navSprites, hoveredNavIdx, t, camera)`** — called every frame in galaxy view. For each nav star: projects the label, toggles the `hovered` CSS class, and sets the sprite scale to pulse (base 15, 22 when hovered, ±18% sine wave at 1.8 Hz).

**`createPlanetLabels(planetObjs, onPlanetClick)`** — called once when entering a stellar system. Clears `#planet-labels`, creates one `.planet-label` `<div>` per planet, sets text and click listener. The `onPlanetClick` callback is wired to `planetInteractionUseCase.openPlanetSheet` via `main.js`.

**`clearPlanetLabels()`** — empties `#planet-labels`. Called when leaving a stellar system.

**`updatePlanetLabels(currentSys, hoveredPlanetIdx, camera)`** — called every frame in stellar view. Projects each planet label to screen space (with a +1.5 Y offset above the mesh centre), toggles `hovered` class.

**If you change it:**
- Change the `0.05` dot-product threshold in `projectLabel`: lower = labels disappear sooner as they approach the screen edge; higher = they persist further around the side.
- Change `base = 22 : 15` in `updateNavLabels`: changes the normal/hovered sprite sizes. These are in scene units; the sprite appears at these sizes regardless of distance because it's a sprite (always faces the camera, but does scale with distance in `sizeAttenuation: true` material — so these values interact with the camera distance `CAM_R = 185`).
- Change `p.data.radius + 1.5` in `updatePlanetLabels`: adjusts the vertical gap between the planet surface and its label.

---

### `src/adapters/SheetRenderer.js`

Pure function — no DOM access, no state, no side effects.

**`renderSheetHTML(content)`** — takes a content object from `SYSTEMS` and returns an HTML string based on `content.type`:

- `'project'` — renders: meta line (tech stack), h2 title, body paragraph, "View on GitHub →" link.
- `'link'` — renders: h2 title, value line (e.g. email address), anchor button with `btnLabel`. Uses `_self` target for `mailto:` links, `_blank` for URLs.
- `'info'` — renders: h2 title, body paragraph. The CSS applies `white-space: pre-line` so `\n` in body strings becomes a line break.
- `'skills'` — renders: h2 title, a `<div class="sheet-skills">` with a `<span>` per skill.
- Returns `''` for unknown types (the sheet will display nothing).

The result is written to `sheetContent.innerHTML` by `PlanetInteractionUseCase`.

**If you change it:**
- Add a new content type: add a new `if` branch and return the HTML. No other file needs to change except adding the new type to a planet's `content` in `systems.js`.
- Change a class name (e.g. `sheet-title`): the corresponding CSS rule in `style.css` must be updated to match.
- The HTML is set via `innerHTML` — do not put unsanitised user input here. All data currently comes from the hard-coded `systems.js` so there's no injection risk, but keep this in mind if you ever load content from an API.

---

## Use Cases layer — `src/usecases/`

Application logic. Owns state and orchestrates transitions. No Three.js geometry or DOM queries — all dependencies are injected.

### `src/usecases/NavigationUseCase.js`

The most complex class. Owns the application's navigation state and drives all scene transitions.

**Private state:**
- `#viewState` — `'galaxy'` | `'stellar'` | `'transition'`. Prevents re-entrant navigation (e.g. double-clicking a star during a transition). Exposed via `get viewState()`.
- `#currentSys` — the return value of `buildStellarSystem` for the active system, or `null`. Exposed via `get currentSys()`.
- `#stellarEntryZoom` — a float that starts at 2.4 when entering a stellar system and eases toward 1.0 over many frames in `AnimationLoop`. Creates the zoom-in effect on entry. Exposed as a getter and setter so `AnimationLoop` can read and write it.

**Injected dependencies (constructor):**
- `scene`, `camera` — Three.js objects for removing/adding the stellar system group.
- `galaxySceneGroup` — the group containing the galaxy; toggled visible/invisible during transitions.
- `navSprites` — used to get the world position of the clicked nav star for the zoom animation.
- `clock` — shared `THREE.Clock` for time-based camera positioning.
- `labelAdapter` — the `LabelAdapter` module object. Called for `.createPlanetLabels()` and `.clearPlanetLabels()`.
- `stellarSystemBuilder` — a function `(id) => { group, planetObjs, sys, starMesh, starGlow }`. Injected so the use case never imports `StellarSystemBuilder` directly.
- `overlay` — the `#overlay` DOM element. Its classes are toggled to fade in/out.
- `stellarTitleEl` — `#stellar-title` element. Its `textContent` is set to `sys.title`.
- `getSmoothedMouse` — `() => { x, y }` closure. Used during the exit-zoom animation to match the camera angle to where the user was looking.
- `positionCamera` — `(theta, phi, r?) => void` closure wrapping `CameraController.positionCamera`. The use case never imports `CameraController` directly.

**`async goToSystem(id)`** — the galaxy → stellar transition:
1. Guards against re-entry (`viewState !== 'galaxy'`).
2. Zooms the camera toward the clicked nav star over 820ms using an ease-in-out curve.
3. Adds `.fast.visible` to overlay (quick flash).
4. Hides `galaxySceneGroup`, switches body class.
5. If `sys.viewType === 'page'`: shows the HTML page (`#${id}-page`), removes overlay, sets `viewState = 'stellar'`. Returns early — no 3D system built.
6. Otherwise: builds the stellar system, adds it to the scene, creates planet labels, positions the camera at the entry zoom, removes overlay, sets `viewState = 'stellar'`.

**`async goToGalaxy()`** — the stellar → galaxy transition:
1. Guards against re-entry.
2. Closes all open page views by iterating `SYSTEMS` (handles `viewType: 'page'` systems).
3. If a 3D system is active: plays a 350ms outward zoom animation from the current camera angle.
4. Fades to black via overlay (480ms).
5. Removes the stellar system from the scene, clears planet labels.
6. Switches body class, shows `galaxySceneGroup`, repositions camera for galaxy view.
7. Fades overlay back out, sets `viewState = 'galaxy'`.

**`setOnPlanetClick(cb)`** — wires a callback that fires when a planet label is clicked. In `main.js` this is set to `planetInteractionUseCase.openPlanetSheet`.

**If you change it:**
- Change `ZOOM_MS = 820`: makes the fly-in faster or slower.
- Change `stellarEntryZoom = 2.4`: changes how far out the camera starts when entering a system. `AnimationLoop` eases this toward 1.0 at a rate of `0.025` per frame (roughly 40 frames to get there).
- Change the easing formula `p < 0.5 ? 2*p*p : -1+(4-2*p)*p`: this is a standard ease-in-out quad. Swap for a different curve if desired.
- Add new state: add a private field and a getter. If it needs to persist across system transitions (like `viewState`), store it on the class. If it's per-system, reset it inside `goToSystem`.

---

### `src/usecases/PlanetInteractionUseCase.js`

Opens and closes the planet detail sheet and PDF viewer.

**Injected dependencies:** `planetSheet`, `sheetContent`, `sheetBackdrop`, `pdfModal`, `pdfFrame` — all DOM elements.

**`openPlanetSheet(pd)`** — called when a planet is clicked. If `pd.content.type === 'pdf'`, calls `openPDF(pd.content.url)` instead. Otherwise writes `renderSheetHTML(pd.content)` into `sheetContent.innerHTML`, adds `active` to `planetSheet` and `sheetBackdrop`, adds `sheet-open` to `document.body`.

**`closePlanetSheet()`** — removes `active` from `planetSheet` and `sheetBackdrop`, removes `sheet-open` from body.

**`openPDF(url)`** — sets `pdfFrame.src` and adds `active` to `pdfModal`.

**`closePDF()`** — removes `active` from `pdfModal`, clears `pdfFrame.src` (stops loading/playing the PDF).

**If you change it:**
- Add an animation on sheet open: add a CSS class and remove it after `requestAnimationFrame` to trigger a transition.
- Add logic to close the PDF before opening the sheet: call `this.closePDF()` at the top of `openPlanetSheet`.
- The `sheetBackdrop` element must exist in `index.html` with `id="sheet-backdrop"` or `document.getElementById` returns `null` and clicking the backdrop will throw.

---

## Frameworks & Drivers layer — `src/frameworks/`

The outermost layer. Directly touches Three.js and the DOM. These are the only files that may import Three.js.

### `src/frameworks/RendererSetup.js`

Three factory functions for Three.js boilerplate.

**`createRenderer(canvas)`** — creates a `WebGLRenderer` with antialiasing, sets pixel ratio (capped at 2× to avoid performance issues on high-DPI screens), sets full-window size, sets clear colour to pure black.

**`createScene()`** — returns `new THREE.Scene()`. Exists as a function so `main.js` doesn't need to import Three.js just for this.

**`createCamera()`** — returns a `PerspectiveCamera` with FOV 60°, current aspect ratio, near plane 0.1, far plane 3000. Far plane 3000 covers the background stars at radius ~1500.

**If you change it:**
- Change FOV from 60 to a lower value: narrower field of view, objects appear larger / more telephoto.
- Change `Math.min(devicePixelRatio, 2)`: remove the cap to allow full native resolution (heavier GPU load on 3×/4× screens).
- Change far plane below 1500: background stars will be clipped.

---

### `src/frameworks/CameraController.js`

Converts spherical coordinates to a Cartesian camera position.

**`CAM_R = 185`** — default orbit radius for the galaxy view.

**`BASE_PHI = 1.18`** — default polar angle (roughly 68° from vertical). Places the camera slightly above the equatorial plane, giving a good view of the galaxy disc.

**`positionCamera(camera, theta, phi, r = CAM_R)`** — sets `camera.position` using standard spherical-to-Cartesian conversion and calls `camera.lookAt(0, 0, 0)`. Note: Three.js uses Y-up coordinates, so `cos(phi)` maps to Y.

- `theta` — azimuthal angle (rotation around Y axis). Driven by `clock.getElapsedTime() * 0.01 + smoothedMouseX * 0.55` in galaxy view, producing the slow auto-rotation with mouse influence.
- `phi` — polar angle. Clamped to `[0.65, 1.48]` in galaxy view and `[0.55, 1.32]` in stellar view to prevent the camera from flipping over the poles or going below the disc.
- `r` — radius. Equals `CAM_R` in galaxy view. In stellar view equals `sys.camRadius * stellarEntryZoom`.

**If you change it:**
- Change `CAM_R`: moves the galaxy view camera closer or further from the centre. Must stay larger than `MAX_R = 110` (in `GalaxyBuilder`) to avoid being inside the galaxy.
- Change `BASE_PHI`: tilts the default viewing angle. Lower = looking more top-down; higher = more side-on.
- This function is injected into all callers as `(theta, phi, r) => positionCamera(camera, theta, phi, r)`. The `camera` is bound in the closure in `main.js`. If you add a parameter to this function, update the closures in `main.js`.

---

### `src/frameworks/InputDriver.js`

Wires raw DOM events to use case calls.

**`createMouseTracker()`** — returns an object with three methods. Listens to `mousemove` to update raw `mx`/`my` (normalised −0.5..0.5) and `mouse2D` (normalised −1..1 for raycasting).
- `update()` — called once per frame from `AnimationLoop`. Steps the smoothed values toward the raw values with a 4% lerp factor, giving the slow drifting camera response.
- `getMouse2D()` — returns the `THREE.Vector2` used for raycasting. Updated immediately on `mousemove`, not smoothed.
- `getSmoothed()` — returns `{ x: smoothMX, y: smoothMY }` used to drive the camera angles.

**`setupClickHandler({...})`** — adds a `click` listener to the canvas. In `galaxy` view: raycasts against `navHitMeshes`; on hit, calls `navigationUseCase.goToSystem(page)`. In `stellar` view: raycasts against planet meshes; on hit, calls `planetInteractionUseCase.openPlanetSheet(data)`.

**`setupKeyboardHandler({...})`** — `keydown` listener. On Escape: if the PDF is open, close PDF; otherwise close the planet sheet and (if in stellar view) go to galaxy.

**`setupResizeHandler(camera, renderer)`** — `resize` listener. Updates `camera.aspect` and calls `renderer.setSize`.

**If you change it:**
- Change the lerp factor `0.04`: lower = slower/smoother camera response to mouse; higher = snappier.
- The `mouse2D` vector is the *same object* returned by `getMouse2D()` and passed to `setupClickHandler`. Mutations to it in `mousemove` are immediately visible to click raycasting without any extra passing — this is intentional.
- `setupClickHandler` receives `getCurrentSys` and `getViewState` as functions (not values) so it always reads current state at click time, not at setup time.

---

### `src/frameworks/AnimationLoop.js`

The render loop. Everything that changes per-frame lives here.

**`createAnimationLoop({...})`** — returns `{ start }`. Call `start()` to begin the loop.

**Local state:**
- `lastT` — previous frame's elapsed time. Used to compute `dt = min(elapsed - lastT, 0.05)`. The 50ms cap prevents huge jumps if the tab was backgrounded.
- `hoveredNavIdx` / `hoveredPlanetIdx` — indices into `navHitMeshes` / `planetObjs`. Kept here (not in use cases) because hover state is a rendering concern, not a navigation one.

**Per-frame in `galaxy` view:**
1. Rotates `galaxy.rotation.y = t * 0.06` (one full revolution every ~105 seconds).
2. Calls `galaxy.updateMatrixWorld(true)` so sprite world positions are current for label projection.
3. Repositions camera with slow drift + mouse influence.
4. Calls `updateNavLabels` (projects labels, pulses sprite scale).
5. Calls `updateNavHover` (raycasts against hit-meshes, sets cursor).

**Per-frame in `stellar` view:**
1. Steps each planet's `angle` by `orbitSpeed * dt`, then sets `mesh.position` from it.
2. Rotates each planet mesh on its own Y axis (`dt * 0.4`).
3. Pulses `starMesh.scale` and `starGlow.scale` with a 1.8 Hz sine wave.
4. Eases `stellarEntryZoom` toward 1.0 at 2.5% per frame (takes ~80 frames = ~1.3 seconds at 60fps).
5. Repositions camera using the entry zoom multiplier.
6. Calls `updatePlanetLabels` (projects planet labels).
7. Calls `updatePlanetHover` (raycasts against planet meshes, lerps scale and emissive intensity on hover).

**`updatePlanetHover`** — the planet scale and emissive intensity each lerp toward their target values at 12% per frame, giving a smooth grow/brighten effect on hover instead of a snap.

**If you change it:**
- Change `t * 0.06` galaxy rotation: changes rotation speed. `0.06` rad/s = one full revolution in ~105 seconds.
- Change `0.04` lerp factor in `mouseTracker.update()`: this is in `InputDriver`, not here. The smoothing that affects the camera drift lives there.
- Change `dt * 0.4` planet self-rotation: lower = slower spin; 0 = no spin.
- Change `0.025` entry zoom easing rate: lower = longer dramatic zoom-in on system entry.
- Change `0.12` hover lerp rate: lower = slower hover grow/fade.
- Change hover scale target `1.0 + 0.28`: how much planets grow on hover.

---

## `src/main.js`

The composition root. Owns no logic — it instantiates every module and wires them together.

**Sections in order:**

1. **Imports** — all modules. Grouped by layer (Frameworks, Adapters, Use Cases).
2. **DOM elements** — every `getElementById` call in the app. All in one place so nothing is queried more than once.
3. **Renderer / scene** — `createRenderer`, `createScene`, `createCamera`.
4. **Shared resources** — `THREE.Clock` (shared between `NavigationUseCase` and `AnimationLoop` so there's one authoritative time source) and `THREE.Raycaster` (shared between `InputDriver` and `AnimationLoop`).
5. **Textures** — `radialTex` and `makeNavStarTex` calls to produce the Three.js textures passed to builders.
6. **Scene objects** — builds galaxy, background stars, distant galaxies. Positions camera at initial galaxy view.
7. **Mouse tracker** — `createMouseTracker()`.
8. **Use cases** — `NavigationUseCase` (receives injected scene, camera, adapters, closures) and `PlanetInteractionUseCase` (receives injected DOM elements). Wires planet-click callback between them.
9. **Input handlers** — `setupClickHandler`, `setupKeyboardHandler`, `setupResizeHandler`.
10. **UI button wiring** — `stellar-back`, `sheet-close`, `sheet-backdrop`, `pdf-close` click listeners.
11. **Start** — `createAnimationLoop({...}).start()`.

**The two closure patterns used throughout:**

- `positionCamera: (theta, phi, r) => positionCamera(camera, theta, phi, r)` — binds `camera` so callers don't need to hold a camera reference.
- `getSmoothedMouse: () => mouseTracker.getSmoothed()` — a thunk so the use case reads mouse state at call time, not at construction time. `mouseTracker` doesn't exist yet when the closure is defined syntactically, but JavaScript resolves the variable at call time, so this is fine.

**If you change it:**
- Add a new use case: instantiate it here and pass it the DOM elements / adapters it needs.
- Add a new event listener: add it in the "UI button wiring" section.
- The order of sections matters in a few places: DOM elements must be queried before being passed to constructors; `mouseTracker` must be created before the closures that call it are invoked (though not before they're defined).

---

## Static assets

### `profile.jpg`
Photo used in `#about-page`. Referenced directly in `index.html` as `src="profile.jpg"`.

### `resume.pdf`
The résumé. Loaded into `#pdf-frame` as `src="resume.pdf"` when the "View Résumé" planet is clicked. The path is defined in `systems.js` under `resume → planets[2] → content.url`.

---
