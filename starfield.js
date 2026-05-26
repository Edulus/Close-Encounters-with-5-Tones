const STAR_COUNT = 120;

let canvas = null;
let ctx = null;
let stars = [];
let started = false;

let comet = { active: false, respawnAt: 0 };

function generateStars() {
  const clusterCount = 2 + Math.floor(Math.random() * 2);
  const clusters = Array.from({ length: clusterCount }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
  }));

  stars = Array.from({ length: STAR_COUNT }, () => {
    // Spectral color weights: 60% blue-white, 20% white, 12% yellow-white, 5% yellow, 3% orange-red
    const roll = Math.random();
    let r, g, b;
    if (roll < 0.60) {
      r = 200 + Math.floor(Math.random() * 21);
      g = 220 + Math.floor(Math.random() * 21);
      b = 255;
    } else if (roll < 0.80) {
      r = 255; g = 255; b = 255;
    } else if (roll < 0.92) {
      r = 255;
      g = 240 + Math.floor(Math.random() * 11);
      b = 200 + Math.floor(Math.random() * 21);
    } else if (roll < 0.97) {
      r = 255;
      g = 220 + Math.floor(Math.random() * 11);
      b = 150 + Math.floor(Math.random() * 21);
    } else {
      r = 255;
      g = 180 + Math.floor(Math.random() * 21);
      b = 100 + Math.floor(Math.random() * 31);
    }

    // Power-law magnitude: most stars faint, few bright
    const radius = 0.2 + Math.pow(Math.random(), 3) * 2.3;
    const normalizedRadius = (radius - 0.2) / 2.3;

    const twinkleSpeed = 0.001 + (1 - normalizedRadius) * 0.004;
    const twinkleAmplitude = radius > 1.5 ? 0.15 : 0.35;

    // 20% of stars cluster near a random center
    let x, y;
    if (Math.random() < 0.20) {
      const cluster = clusters[Math.floor(Math.random() * clusters.length)];
      const spread = 200 + Math.random() * 100;
      x = cluster.x + (Math.random() + Math.random() + Math.random() - 1.5) * spread;
      y = cluster.y + (Math.random() + Math.random() + Math.random() - 1.5) * spread;
      x = Math.max(0, Math.min(canvas.width, x));
      y = Math.max(0, Math.min(canvas.height, y));
    } else {
      x = Math.random() * canvas.width;
      y = Math.random() * canvas.height;
    }

    return {
      x, y, radius,
      baseAlpha: Math.random() * 0.5 + 0.4,
      twinkleSpeed,
      twinkleAmplitude,
      phase: Math.random() * Math.PI * 2,
      r, g, b,
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
    const alpha = Math.max(0, Math.min(1,
      s.baseAlpha + Math.sin(t * s.twinkleSpeed + s.phase) * s.twinkleAmplitude
    ));

    if (s.radius > 1.5) {
      const glowR = s.radius * 4;
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
      grad.addColorStop(0, `rgba(${s.r}, ${s.g}, ${s.b}, 0.15)`);
      grad.addColorStop(1, `rgba(${s.r}, ${s.g}, ${s.b}, 0)`);
      ctx.beginPath();
      ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${s.r}, ${s.g}, ${s.b}, ${alpha})`;
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
