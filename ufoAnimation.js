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
    durationMs: 500,
    finalScale: 0.1,
    finalRotation: 720,
    finalY: -1000,
  },
  teleport: {
    durationMs: 3000,
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
  #body = null;
  #position = UFO_CONFIG.position.initial;
  #beamHeight = BEAM_CONFIG.dimensions.initialHeight;
  #currentEmojis = new Set();
  #beamIntersections = new Set();
  #zoomTimeout = null;
  #abductionCompleteTimeout = null;
  #onAbductionComplete = null;
  #gradientTemplate;
  #beamTargets = [];

  constructor() {
    this.#gradientTemplate = this.#createBeamGradient();
  }

  setBeamTargets(targets) {
    this.#beamTargets = targets;
  }

  setOnAbductionComplete(callback) {
    this.#onAbductionComplete = callback;
  }

  #restoreTarget(key) {
    const target = this.#beamTargets.find((t) => t.key === key);
    if (target?.element) target.element.textContent = target.emoji;
  }

  restoreAllTargets() {
    this.#beamTargets.forEach((t) => {
      if (t.element) t.element.textContent = t.emoji;
    });
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
    const { top, bottom, startHeight } = BEAM_CONFIG.dimensions;
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
    const viewBox = `${BEAM_CONFIG.dimensions.bottom.left} 0 ${
      BEAM_CONFIG.dimensions.bottom.right - BEAM_CONFIG.dimensions.bottom.left
    } 60`;
    this.#element.setAttribute("viewBox", viewBox);

    const initialPath = this.#createBeamPath(BEAM_CONFIG.dimensions.initialHeight);
    this.#element.innerHTML = `
      <defs>${this.#gradientTemplate}</defs>
      <g class="beam-group">
        <path class="beam-glow" d="${initialPath}" fill="url(#beamGlow)" style="opacity: 0;" />
        <path class="beam" d="${initialPath}" fill="url(#beam)" style="opacity: 0;" />
      </g>
      <ellipse cx="50" cy="25" rx="15" ry="20" fill="#85A1C1" />
      <ellipse class="ufo-body" cx="50" cy="35" rx="45" ry="12" fill="#5E81AC" />
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
    this.#body = this.#element.querySelector(".ufo-body");
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
        transition: all linear ${UFO_CONFIG.teleport.durationMs}ms;
      }
      .teleporting-emoji.rescuable {
        pointer-events: auto;
        cursor: grab;
      }
      .teleporting-emoji.rescuing {
        transition: all 0.5s ease-out !important;
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
    if (!this.#beam) return false;
    const bbox = this.#beam.getBoundingClientRect();
    if (bbox.width === 0 || bbox.height === 0) return false;
    return (
      x >= bbox.left && x <= bbox.right && y >= bbox.top && y <= bbox.bottom
    );
  }

  #checkBeamCollisions() {
    this.#beamTargets.forEach(({ element, emoji, key }) => {
      if (!element || this.#beamIntersections.has(key)) return;

      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      if (this.isPointInBeam(centerX, centerY)) {
        this.#beamIntersections.add(key);
        element.textContent = "";
        this.#teleportEmoji(emoji, centerX, centerY, key);
      }
    });

    const allAbducted =
      this.#beamTargets.length > 0 &&
      this.#beamIntersections.size === this.#beamTargets.length;

    if (allAbducted && this.#abductionCompleteTimeout === null) {
      this.#abductionCompleteTimeout = setTimeout(() => {
        this.#abductionCompleteTimeout = null;
        this.#onAbductionComplete?.();
      }, UFO_CONFIG.teleport.durationMs);
    }
  }

  descend(speed) {
    if (!this.#element) this.initialize();

    if (this.#position < UFO_CONFIG.position.final) {
      this.#position += UFO_CONFIG.position.descentRate;
      this.#element.style.transition = `top ${speed / 1000}s linear`;
      this.#updatePosition();
    } else {
      this.#activateBeamAndLights();
    }
  }

  #activateBeamAndLights() {
    this.#lights.forEach((light) => light.classList.add("active"));
    this.#beam.style.opacity = "1";
    this.#beamGlow.style.opacity = "0.8";

    const bottomLimit = window.innerHeight - UFO_CONFIG.margin.bottom;
    if (this.#beam.getBoundingClientRect().bottom < bottomLimit) {
      this.#beamHeight += BEAM_CONFIG.dimensions.extensionRate;
      this.#updateBeamPath();
    }
    this.#checkBeamCollisions();
  }

  #teleportEmoji(emoji, startX, startY, key) {
    const emojiElement = document.createElement("div");
    emojiElement.textContent = emoji;
    emojiElement.classList.add("teleporting-emoji", "rescuable");

    Object.assign(emojiElement.style, {
      left: `${startX}px`,
      top: `${startY}px`,
      fontSize: "24px",
      zIndex: "1001",
      opacity: "1",
    });

    document.body.appendChild(emojiElement);
    this.#currentEmojis.add(emojiElement);
    emojiElement.offsetHeight;

    const ufoRect = this.#body.getBoundingClientRect();
    const ufoX = ufoRect.left + ufoRect.width / 2;
    const ufoY = ufoRect.top + ufoRect.height / 2;

    requestAnimationFrame(() => {
      emojiElement.style.transform = `translate(${ufoX - startX}px, ${
        ufoY - startY
      }px)`;
      emojiElement.style.opacity = "0";
    });

    const captureTimeout = setTimeout(() => {
      emojiElement.remove();
      this.#currentEmojis.delete(emojiElement);
    }, UFO_CONFIG.teleport.durationMs);

    emojiElement.addEventListener("click", () => {
      clearTimeout(captureTimeout);
      this.#rescueEmoji(emojiElement, key);
    });
  }

  #rescueEmoji(emojiElement, key) {
    this.#beamIntersections.delete(key);
    this.#restoreTarget(key);
    if (this.#abductionCompleteTimeout !== null) {
      clearTimeout(this.#abductionCompleteTimeout);
      this.#abductionCompleteTimeout = null;
    }
    emojiElement.classList.add("rescuing");
    emojiElement.classList.remove("rescuable");
    emojiElement.style.transform = "translate(0, 200px)";
    emojiElement.style.opacity = "0";
    setTimeout(() => {
      emojiElement.remove();
      this.#currentEmojis.delete(emojiElement);
    }, 500);
  }

  zoomAway() {
    if (!this.#element) return;

    this.#beam.style.opacity = "0";
    this.#beamGlow.style.opacity = "0";
    this.#lights.forEach((light) => light.classList.remove("active"));

    const { durationMs, finalScale, finalRotation, finalY } = UFO_CONFIG.zoom;
    const durationSec = `${durationMs / 1000}s`;
    this.#element.style.transition = `top ${durationSec}, transform ${durationSec}`;
    this.#element.style.transform = `translateX(-50%) scale(${finalScale}) rotate(${finalRotation}deg)`;
    this.#element.style.top = `${finalY}px`;

    clearTimeout(this.#zoomTimeout);
    this.#zoomTimeout = setTimeout(() => this.reset(), durationMs);
  }

  reset() {
    clearTimeout(this.#abductionCompleteTimeout);
    this.#abductionCompleteTimeout = null;
    this.#beamHeight = BEAM_CONFIG.dimensions.initialHeight;
    this.#updateBeamPath();
    this.#beam.style.opacity = "0";
    this.#beamGlow.style.opacity = "0";
    this.#currentEmojis.forEach((emoji) => emoji.remove());
    this.#currentEmojis.clear();
    this.#beamIntersections.clear();

    this.#element.style.transition = "none";
    this.#position = UFO_CONFIG.position.initial;
    this.#updatePosition();
    this.#element.style.transform = "translateX(-50%) scale(1) rotate(0deg)";
  }

  setTransitionSpeed(speed) {
    if (this.#element) {
      this.#element.style.transition = `top ${speed / 1000}s linear`;
    }
  }

  destroy() {
    clearTimeout(this.#zoomTimeout);
    clearTimeout(this.#abductionCompleteTimeout);
    this.#currentEmojis.forEach((emoji) => emoji.remove());
    this.#currentEmojis.clear();
    this.#element?.remove();
    this.#element = null;
    this.#beam = null;
    this.#beamGlow = null;
    this.#lights = null;
    this.#body = null;
  }
}

export const ufoController = new UFOController();
