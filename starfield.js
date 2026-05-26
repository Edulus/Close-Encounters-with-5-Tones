const STAR_COUNT = 120;

let canvas = null;
let ctx = null;
let stars = [];
let started = false;

let comet = { active: false, respawnAt: 0 };

function generateStars() {
  stars = Array.from({ length: STAR_COUNT }, () => {
    const large = Math.random() < 0.1;
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: large
        ? Math.random() * 1.5 + 1.5
        : Math.random() * 1.0 + 0.2,
      baseAlpha: Math.random() * 0.5 + 0.4,
      twinkleSpeed: Math.random() * 0.003 + 0.0008,
      phase: Math.random() * Math.PI * 2,
    };
  });
}

function spawnComet() {
  const fromLeft = Math.random() < 0.5;
  const speed = 0.35 + Math.random() * 0.2;
  const angle = Math.PI / 6 + Math.random() * (Math.PI / 6);
  comet = {
    active: true,
    x: fromLeft ? -60 : canvas.width + 60,
    y: Math.random() * canvas.height * 0.45,
    vx: fromLeft ? speed * Math.cos(angle) : -speed * Math.cos(angle),
    vy: speed * Math.sin(angle),
    tailLength: 40 + Math.random() * 25,
    alpha: 0.65 + Math.random() * 0.2,
    respawnAt: 0,
  };
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

  if (!comet.active && t >= comet.respawnAt) {
    spawnComet();
  }

  if (comet.active) {
    comet.x += comet.vx;
    comet.y += comet.vy;

    if (
      comet.x < -120 ||
      comet.x > canvas.width + 120 ||
      comet.y > canvas.height + 120
    ) {
      comet.active = false;
      comet.respawnAt = t + 30000 + Math.random() * 30000;
    } else {
      const speed = Math.sqrt(comet.vx ** 2 + comet.vy ** 2);
      const tailX = comet.x - (comet.vx / speed) * comet.tailLength;
      const tailY = comet.y - (comet.vy / speed) * comet.tailLength;

      const grad = ctx.createLinearGradient(comet.x, comet.y, tailX, tailY);
      grad.addColorStop(0, `rgba(210, 230, 255, ${comet.alpha})`);
      grad.addColorStop(1, `rgba(210, 230, 255, 0)`);

      ctx.beginPath();
      ctx.moveTo(comet.x, comet.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(comet.x, comet.y, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${comet.alpha})`;
      ctx.fill();
    }
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
  comet.respawnAt = 6000;
  requestAnimationFrame(frame);
}
