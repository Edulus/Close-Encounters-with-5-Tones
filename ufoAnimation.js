// unifiedUFOModule.js
const BEAM_CONFIG = {
  dimensions: {
    top: { left: 35, right: 65 },
    bottom: { left: -15, right: 115 },
    startHeight: 45,
    initialHeight: 45,
    extensionRate: 50,
  },
  gradient: {
    color: "#7fffd4",
    radialColor: "rgba(127, 255, 212, 0.2)",
    stops: [
      { offset: "0%", opacity: 0.6 },
      { offset: "40%", opacity: 0.5 },
      { offset: "60%", opacity: 0.4 },
      { offset: "75%", opacity: 0.3 },
      { offset: "85%", opacity: 0.2 },
      { offset: "92%", opacity: 0.1 },
      { offset: "96%", opacity: 0.05 },
      { offset: "100%", opacity: 0 },
    ],
  },
  animation: {
    transitionDuration: "1s",
    glowRadius: 2,
  },
};

const UFO_CONFIG = {
  zoom: {
    duration: "0.5s",
    finalScale: 0.1,
    finalRotation: 720,
    finalY: -1000,
  },
  teleport: {
    duration: 3000,
    endPosition: -275,
  },
  position: {
    initial: -450,
    final: -275,
    descentRate: 10,
  },
  margin: {
    bottom: 10,
  },
};

class UFOController {
  #element = null;
  #beam = null;
  #beamGlow = null;
  #lights = null;
  #position = UFO_CONFIG.position.initial;
  #beamHeight = BEAM_CONFIG.dimensions.initialHeight;
  #sequenceCount = 0;
  #currentEmojis = new Set();
  #beamIntersections = new Set();
  #animationFrame = null;
  #gradientTemplate = null;

  constructor() {
    this.#gradientTemplate = this.#createBeamGradient();
  }

  #createBeamGradient() {
    const stops = BEAM_CONFIG.gradient.stops
      .map(
        (stop) =>
          `<stop offset="${stop.offset}" style="stop-color:${BEAM_CONFIG.gradient.color};stop-opacity:${stop.opacity}" />`
      )
      .join("\n");

    return `
      <linearGradient id="beam" x1="0%" y1="0%" x2="0%" y2="100%">
        ${stops}
      </linearGradient>
      <radialGradient id="beamGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" style="stop-color:${BEAM_CONFIG.gradient.radialColor};stop-opacity:0.3"/>
        <stop offset="100%" style="stop-color:${BEAM_CONFIG.gradient.radialColor};stop-opacity:0"/>
      </radialGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="${BEAM_CONFIG.animation.glowRadius}" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `;
  }

  #createBeamPath(height) {
    const { top, bottom } = BEAM_CONFIG.dimensions;
    const startHeight = BEAM_CONFIG.dimensions.startHeight;

    return `M${top.left} ${startHeight} 
            L${bottom.left} ${startHeight + height}
            L${bottom.right} ${startHeight + height}
            L${top.right} ${startHeight}`;
  }

  initialize() {
    if (this.#element) return;

    this.#element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    const viewBox = `${BEAM_CONFIG.dimensions.bottom.left} 0 
                     ${
                       BEAM_CONFIG.dimensions.bottom.right -
                       BEAM_CONFIG.dimensions.bottom.left
                     } 60`;
    this.#element.setAttribute("viewBox", viewBox);

    this.#element.innerHTML = `
      <defs>${this.#gradientTemplate}</defs>
      <g class="beam-group">
        <path class="beam-glow" d="${this.#createBeamPath(
          BEAM_CONFIG.dimensions.initialHeight
        )}" 
              fill="url(#beamGlow)" style="opacity: 0;" />
        <path class="beam" d="${this.#createBeamPath(
          BEAM_CONFIG.dimensions.initialHeight
        )}" 
              fill="url(#beam)" style="opacity: 0;" />
      </g>
      <ellipse cx="50" cy="25" rx="15" ry="20" fill="#85A1C1" />
      <ellipse cx="50" cy="35" rx="45" ry="12" fill="#5E81AC" />
      <circle class="ufo-light" cx="30" cy="35" r="3" fill="#EBCB8B" />
      <circle class="ufo-light" cx="50" cy="35" r="3" fill="#EBCB8B" />
      <circle class="ufo-light" cx="70" cy="35" r="3" fill="#EBCB8B" />
      <ellipse cx="50" cy="40" rx="20" ry="5" fill="#88C0D0" opacity="0.5" />
    `;

    this.#setupStyles();
    this.#setupElement();
    this.#cacheElements();
    this.#updatePosition();
    document.body.appendChild(this.#element);
  }

  #cacheElements() {
    this.#beam = this.#element.querySelector(".beam");
    this.#beamGlow = this.#element.querySelector(".beam-glow");
    this.#lights = this.#element.querySelectorAll(".ufo-light");
  }

  #setupStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .ufo-light.active {
        fill: ${BEAM_CONFIG.gradient.color};
        filter: url(#glow);
        animation: pulse 2s infinite;
      }
      .beam, .beam-glow {
        transition: opacity ${BEAM_CONFIG.animation.transitionDuration} ease-in;
        mix-blend-mode: screen;
      }
      .beam-glow {
        filter: blur(3px);
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .teleporting-emoji {
        position: fixed;
        transition: all linear ${UFO_CONFIG.teleport.duration}ms;
      }
    `;
    document.head.appendChild(style);
  }

  #setupElement() {
    Object.assign(this.#element.style, {
      position: "fixed",
      left: "50%",
      transform: "translateX(-50%)",
      width: "300px",
      height: "800px",
      transition: "top 0.3s linear",
      zIndex: "1000",
      pointerEvents: "none",
    });
  }

  #updatePosition() {
    this.#element.style.top = `${this.#position}px`;
  }

  #updateBeamPath() {
    const path = this.#createBeamPath(this.#beamHeight);
    this.#beam?.setAttribute("d", path);
    this.#beamGlow?.setAttribute("d", path);
  }

  isPointInBeam(x, y) {
    const beamTop = this.#position + BEAM_CONFIG.dimensions.startHeight;
    const beamBottom = beamTop + this.#beamHeight;

    if (y < beamTop || y > beamBottom) return false;

    const progress = (y - beamTop) / this.#beamHeight;
    const { top, bottom } = BEAM_CONFIG.dimensions;
    const leftBound =
      this.#element.offsetLeft + top.left + (bottom.left - top.left) * progress;
    const rightBound =
      this.#element.offsetLeft +
      top.right +
      (bottom.right - top.right) * progress;

    return x >= leftBound && x <= rightBound;
  }

  #checkBeamCollisions() {
    const buttons = {
      slower: document.getElementById("slower-button"),
      faster: document.getElementById("faster-button"),
    };

    Object.entries(buttons).forEach(([type, button]) => {
      if (!button || this.#beamIntersections.has(type)) return;

      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      if (this.isPointInBeam(centerX, centerY)) {
        this.#beamIntersections.add(type);
        this.#teleportEmoji(type === "slower" ? "🐢" : "🐰", centerX, centerY);
      }
    });
  }

  descend(speed) {
    if (!this.#element) this.initialize();

    if (this.#position < UFO_CONFIG.position.final) {
      this.#sequenceCount++;
      if (this.#sequenceCount % 1 === 0) {
        this.#position += UFO_CONFIG.position.descentRate;
        this.#element.style.transition = `top ${speed / 1000}s linear`;
        this.#updatePosition();
      }
    } else {
      this.#activateBeamAndLights();
    }
  }

  #activateBeamAndLights() {
    this.#lights.forEach((light) => light.classList.add("active"));
    this.#beam.style.opacity = "1";
    this.#beamGlow.style.opacity = "0.8";

    const screenHeight = window.innerHeight;
    const saucerBottom = UFO_CONFIG.position.final + 180;
    const maxBeamHeight =
      screenHeight - saucerBottom - UFO_CONFIG.margin.bottom;

    if (this.#beamHeight < maxBeamHeight) {
      this.#beamHeight += BEAM_CONFIG.dimensions.extensionRate;
      this.#updateBeamPath();
      this.#checkBeamCollisions();
    }
  }

  #teleportEmoji(emoji, startX, startY) {
    const emojiElement = document.createElement("div");
    emojiElement.textContent = emoji;
    emojiElement.classList.add("teleporting-emoji");

    Object.assign(emojiElement.style, {
      left: `${startX}px`,
      top: `${startY}px`,
      fontSize: "24px",
      pointerEvents: "none",
      zIndex: "1001",
      opacity: "1",
    });

    document.body.appendChild(emojiElement);
    this.#currentEmojis.add(emojiElement);

    emojiElement.offsetHeight; // Force reflow

    const ufoX = window.innerWidth / 2;
    const ufoY = this.#position + 35;

    requestAnimationFrame(() => {
      emojiElement.style.transform = `translate(${ufoX - startX}px, ${
        ufoY - startY
      }px)`;
      emojiElement.style.opacity = "0";
    });

    setTimeout(() => {
      emojiElement.remove();
      this.#currentEmojis.delete(emojiElement);
    }, UFO_CONFIG.teleport.duration);
  }

  zoomAway() {
    this.#beam.style.opacity = "0";
    this.#beamGlow.style.opacity = "0";
    this.#lights.forEach((light) => light.classList.remove("active"));

    const { duration, finalScale, finalRotation, finalY } = UFO_CONFIG.zoom;
    this.#element.style.transition = `top ${duration}, transform ${duration}`;
    this.#element.style.transform = `translateX(-50%) scale(${finalScale}) rotate(${finalRotation}deg)`;
    this.#element.style.top = `${finalY}px`;

    this.#animationFrame = requestAnimationFrame(() => {
      setTimeout(() => this.reset(), parseFloat(duration) * 1000);
    });
  }

  reset() {
    this.#beamHeight = BEAM_CONFIG.dimensions.initialHeight;
    this.#updateBeamPath();
    this.#currentEmojis.forEach((emoji) => emoji.remove());
    this.#currentEmojis.clear();
    this.#beamIntersections.clear();

    this.#element.style.transition = "none";
    this.#position = UFO_CONFIG.position.initial;
    this.#updatePosition();
    this.#element.style.transform = "translateX(-50%) scale(1) rotate(0deg)";
    this.#sequenceCount = 0;
  }

  setTransitionSpeed(speed) {
    if (this.#element) {
      this.#element.style.transition = `top ${speed / 1000}s linear`;
    }
  }

  destroy() {
    cancelAnimationFrame(this.#animationFrame);
    this.#currentEmojis.forEach((emoji) => emoji.remove());
    this.#element?.remove();
    this.#element = null;
    this.#beam = null;
    this.#beamGlow = null;
    this.#lights = null;
  }

  initializeTeleportation() {
    // Required by interface, but implementation is handled in other methods
  }
}

export const ufoController = new UFOController();
