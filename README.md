# Portfolio — Shubham Mohta

My personal portfolio website built with Three.js, plain HTML, and CSS — deployed on Vercel.

## About

An interactive 3D galaxy portfolio where each section of the site is a stellar system you navigate to by clicking on nav stars in a spiral galaxy. Built from scratch with no bundler or framework — just an ES module importmap for Three.js.

## Built With

- Three.js (3D rendering via CDN importmap — no bundler)
- HTML5 / CSS3 / Vanilla JavaScript (ES modules)
- Clean Architecture + SOLID principles
- Vercel (hosting)

## Architecture

The JS source is split into four layers under `src/`, with dependencies flowing strictly inward:

```
src/entities/       ← raw portfolio data (no external dependencies)
src/usecases/       ← navigation state, planet interaction logic
src/adapters/       ← scene builders, label management, sheet HTML renderer
src/frameworks/     ← Three.js setup, input events, render loop
src/main.js         ← composition root (wires all layers together)
```

See [CODEBASE.md](CODEBASE.md) for a full file-by-file reference.

## Features

- 3D spiral galaxy with 2 arms, dense warm core, cool halo, and 45 background galaxy sprites
- Interactive nav stars — click to fly into a stellar system for each section
- Each section is a planetary system with orbiting planets you click to explore
- 12,000-star background field that persists across scene transitions
- Smooth camera transitions between galaxy view and stellar views
- Planet detail bottom sheet with project info, skills, links, and inline PDF résumé viewer
- Hover effects on all interactive 3D objects (cursor change, scale/glow lerp)
- Keyboard shortcut: Escape closes sheets and returns to galaxy

## Sections

- **About** — full-screen HTML overlay with bio, photo, and skill tags
- **Projects** — Sudoku Solver, Portfolio, H.A.D.E.S., Argus, Animal Encyclopedia
- **Contact** — Email, GitHub, LinkedIn
- **Résumé** — Education, Skills, inline PDF viewer

## Adding a Section

1. Add an entry to `src/entities/navDefs.js` (position + colour).
2. Add an entry to `src/entities/systems.js` (planets + content).
3. Add a `.star-label` div in `index.html`.
4. If `viewType: 'page'`, also add the `#${id}-page` HTML element.

Nothing else needs to change.

## Live Site

[portfolio-shubham-gilt.vercel.app](https://portfolio-shubham-gilt.vercel.app)

## Author

**Shubham Mohta**
2nd year CS & Astrophysics student at the University of Toronto
[GitHub](https://github.com/ShubhamMohta29) · [LinkedIn](https://www.linkedin.com/in/shubham-mohta-9902a2260/)
