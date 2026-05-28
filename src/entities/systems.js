// Portfolio content — the core domain data. No rendering or DOM dependencies.
// viewType 'page'    → activates the matching #<id>-page HTML element.
// viewType 'stellar' → builds a 3D planetary system (default when omitted).

export const SYSTEMS = {
  about: {
    title: 'About', viewType: 'page',
    starColor: 0xffee88, glowColor: 0xffcc44, starRadius: 7, camRadius: 120,
    planets: [
      {
        name: 'Background', color: 0x4488cc, radius: 3.5, orbitR: 30, orbitSpeed: 0.38, startAngle: 0,
        content: {
          type: 'info', heading: 'Background',
          body: "2nd year CS & Astrophysics double major at the University of Toronto.\nPassionate about AI systems, algorithm design, and the physics of the cosmos.",
        },
      },
      {
        name: 'Skills', color: 0x44cc88, radius: 3.0, orbitR: 50, orbitSpeed: 0.28, startAngle: Math.PI * 0.7,
        content: {
          type: 'skills', heading: 'Technical Skills',
          skills: ['Python', 'Java', 'JavaScript', 'C', 'SQL', 'React', 'FastAPI', 'Tkinter', 'Git', 'Three.js', 'Graph Neural Networks', 'LLM Integration'],
        },
      },
      {
        name: 'Interests', color: 0x9955dd, radius: 2.8, orbitR: 70, orbitSpeed: 0.20, startAngle: Math.PI * 1.4,
        content: {
          type: 'info', heading: 'Interests',
          body: "Astrophysics · Computational methods in physics · AI systems\nAlgorithm design · Building tools that solve real problems.",
        },
      },
    ],
  },

  projects: {
    title: 'Projects', starColor: 0x99ccff, glowColor: 0x5588ee, starRadius: 8, camRadius: 170,
    planets: [
      {
        name: 'Sudoku Solver', color: 0xb8a898, radius: 2.8, orbitR: 30, orbitSpeed: 0.50, startAngle: 0,
        content: {
          type: 'project', heading: 'Sudoku Solver', meta: 'Python',
          body: 'Backtracking solver with constraint propagation and MRV heuristic — significantly faster than naive approaches on real puzzles.',
          url: 'https://github.com/ShubhamMohta29/sudoku-solver',
        },
      },
      {
        name: 'Portfolio', color: 0x3a8fd4, radius: 2.5, orbitR: 46, orbitSpeed: 0.36, startAngle: Math.PI * 0.4,
        content: {
          type: 'project', heading: 'Portfolio', meta: 'JavaScript · HTML · CSS · Three.js',
          body: 'Designed and built from scratch. 3D spiral galaxy background, interactive stellar navigation system where each section is its own planetary system.',
          url: 'https://github.com/ShubhamMohta29/portfolio-shubham.git',
        },
      },
      {
        name: 'H.A.D.E.S.', color: 0xd44a2a, radius: 3.0, orbitR: 62, orbitSpeed: 0.27, startAngle: Math.PI * 0.9,
        content: {
          type: 'project', heading: 'H.A.D.E.S.', meta: 'Python · Tkinter · GROQ AI',
          body: 'Human Assistance and Decision Engine System — a fully voice-activated AI assistant inspired by JARVIS, built in Python.',
          url: 'https://github.com/ShubhamMohta29/HADES.git',
        },
      },
      {
        name: 'Argus', color: 0xe8a44a, radius: 3.8, orbitR: 79, orbitSpeed: 0.21, startAngle: Math.PI * 1.5, hasRings: true, ringColor: 0xd4b86a,
        content: {
          type: 'project', heading: 'Argus', meta: 'Python · React · FastAPI · PaySim',
          body: 'Real-time Anti-Money Laundering platform using a Graph Neural Network and Gemini AI. Scores 9M accounts for fraud risk and auto-generates Suspicious Activity Reports.',
          url: 'https://github.com/ShubhamMohta29/GenAI-Hackathon.git',
        },
      },
      {
        name: 'Animal Encyclopedia', color: 0x4ab87a, radius: 2.5, orbitR: 97, orbitSpeed: 0.16, startAngle: Math.PI * 0.2,
        content: {
          type: 'project', heading: 'Animal Encyclopedia', meta: 'Java · Swing · REST APIs',
          body: 'Desktop encyclopedia built with a team of 6. Led the search backend (entity parsing, API client, Clean Architecture interactor chain) and built several Swing UI screens.',
          url: 'https://github.com/ShubhamMohta29/AnimalEncyclopedia.git',
        },
      },
    ],
  },

  contact: {
    title: 'Contact', starColor: 0xff9944, glowColor: 0xff6622, starRadius: 7, camRadius: 115,
    planets: [
      {
        name: 'Email', color: 0xff6633, radius: 3.2, orbitR: 28, orbitSpeed: 0.42, startAngle: Math.PI * 0.3,
        content: {
          type: 'link', heading: 'Email', value: 'shubham.mohta.2995@gmail.com',
          url: 'mailto:shubham.mohta.2995@gmail.com', btnLabel: 'Send email →',
        },
      },
      {
        name: 'GitHub', color: 0x9a9ea8, radius: 3.0, orbitR: 46, orbitSpeed: 0.30, startAngle: Math.PI * 1.1,
        content: {
          type: 'link', heading: 'GitHub', value: 'ShubhamMohta29',
          url: 'https://github.com/ShubhamMohta29', btnLabel: 'View profile →',
        },
      },
      {
        name: 'LinkedIn', color: 0x2a5fd4, radius: 3.4, orbitR: 65, orbitSpeed: 0.22, startAngle: Math.PI * 1.8, hasRings: true, ringColor: 0x5588ee,
        content: {
          type: 'link', heading: 'LinkedIn', value: 'shubham-mohta',
          url: 'https://www.linkedin.com/in/shubham-mohta-9902a2260/', btnLabel: 'Connect →',
        },
      },
    ],
  },

  resume: {
    title: 'Résumé', starColor: 0xddeeff, glowColor: 0xaaccff, starRadius: 7, camRadius: 118,
    planets: [
      {
        name: 'Education', color: 0x66bbee, radius: 3.5, orbitR: 28, orbitSpeed: 0.40, startAngle: Math.PI * 0.2,
        content: {
          type: 'info', heading: 'Education',
          body: "University of Toronto\nB.Sc. Computer Science & Astrophysics · Math Minor\n2023 – present",
        },
      },
      {
        name: 'Skills', color: 0x44ccbb, radius: 3.0, orbitR: 47, orbitSpeed: 0.29, startAngle: Math.PI * 1.0,
        content: {
          type: 'skills', heading: 'Skills',
          skills: ['Python', 'Java', 'JavaScript', 'C', 'SQL', 'React', 'FastAPI', 'Tkinter', 'Git', 'Graph Neural Networks', 'GROQ AI', 'Gemini AI'],
        },
      },
      {
        name: 'View Résumé', color: 0xe8c84a, radius: 2.8, orbitR: 65, orbitSpeed: 0.21, startAngle: Math.PI * 1.6, hasRings: true, ringColor: 0xc8a832,
        content: { type: 'pdf', heading: 'Résumé PDF', url: 'resume.pdf' },
      },
    ],
  },
};
