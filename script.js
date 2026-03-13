const canvas = document.createElement('canvas');
canvas.id = 'particles';
document.body.prepend(canvas);

const ctx = canvas.getContext('2d');
let pts = [];

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function initParticles() {
  pts = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
  }));
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  pts.forEach(dot => {
    dot.x += dot.vx;
    dot.y += dot.vy;
    if (dot.x < 0 || dot.x > canvas.width) dot.vx *= -1;
    if (dot.y < 0 || dot.y > canvas.height) dot.vy *= -1;
  });

  pts.forEach((a, i) => {
    pts.slice(i + 1).forEach(b => {
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 120) {
        ctx.strokeStyle = `rgba(108, 99, 255, ${1 - d / 120})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    });

    ctx.fillStyle = '#6c63ff';
    ctx.beginPath();
    ctx.arc(a.x, a.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  requestAnimationFrame(draw);
}

resize();
initParticles();
draw();
window.addEventListener('resize', () => { resize(); initParticles(); });