const STAR_COUNT = 120;

let canvas = null;
let ctx = null;
let stars = [];
let started = false;

function generateStars() {
  stars = Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.3 + 0.2,
    baseAlpha: Math.random() * 0.6 + 0.2,
    twinkleSpeed: Math.random() * 0.003 + 0.0008,
    phase: Math.random() * Math.PI * 2,
  }));
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  generateStars();
}

function frame(t) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const s of stars) {
    const alpha = s.baseAlpha + Math.sin(t * s.twinkleSpeed + s.phase) * 0.3;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, alpha))})`;
    ctx.fill();
  }
  requestAnimationFrame(frame);
}

export function startStarfield() {
  if (started) return;
  started = true;
  canvas = document.createElement("canvas");
  canvas.className = "starfield";
  document.body.prepend(canvas);
  ctx = canvas.getContext("2d");
  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);
}
