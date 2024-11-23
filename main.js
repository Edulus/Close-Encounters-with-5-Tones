import {
  frequencies,
  playTone,
  stopTone,
  playChord,
  stopChord,
  shiftOctave,
  currentOctaveShift,
} from "./audioModule.js";
import { toggleAutoSequence, setAutoSequenceSpeed } from "./effectsModule.js";
import { adjustColorForOctave, updateButtonColors } from "./colorModule.js";
import { ufoController } from "./ufoAnimation.js";

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// UI Module
let buttonColors = updateButtonColors(currentOctaveShift);

// Initialize UFO system
ufoController.initializeTeleportation();

function changeBackgroundColor(color) {
  const adjustedColor = adjustColorForOctave(color, currentOctaveShift);
  document.body.style.background = adjustedColor;
}

function resetBackgroundColor() {
  document.body.style.background = "";
}

function updateToneButtons() {
  const toneButtons = document.querySelectorAll(".tone-button");
  toneButtons.forEach((button) => {
    const tone = button.textContent.trim();
    button.style.backgroundColor = buttonColors[tone];
  });
}

document.body.addEventListener(
  "click",
  () => {
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
  },
  { once: true }
);

const activeOscillators = {};

const toneButtons = document.querySelectorAll(".tone-button");
toneButtons.forEach((button) => {
  const tone = button.textContent.trim();
  button.style.backgroundColor = buttonColors[tone];

  function startTone() {
    if (frequencies[tone] && !activeOscillators[tone]) {
      activeOscillators[tone] = playTone(frequencies[tone]);
      changeBackgroundColor(buttonColors[tone]);
    }
  }

  function stopToneIfActive() {
    if (activeOscillators[tone]) {
      stopTone(
        activeOscillators[tone].oscillator,
        activeOscillators[tone].gainNode
      );
      delete activeOscillators[tone];
      resetBackgroundColor();
    }
  }

  button.addEventListener("mousedown", startTone);
  button.addEventListener("mouseup", stopToneIfActive);
  button.addEventListener("mouseleave", stopToneIfActive);
  button.addEventListener("touchstart", (e) => {
    e.preventDefault();
    startTone();
  });
  button.addEventListener("touchend", (e) => {
    e.preventDefault();
    stopToneIfActive();
  });
  button.addEventListener("touchcancel", stopToneIfActive);
});

const chordButton = document.getElementById("chord-button");
let chordOscillators = [];

function startChord() {
  if (chordOscillators.length === 0) {
    chordOscillators = playChord();
    changeBackgroundColor("#4caf50");
  }
}

function stopChordIfActive() {
  if (chordOscillators.length > 0) {
    stopChord(chordOscillators);
    chordOscillators = [];
    resetBackgroundColor();
  }
}

chordButton.addEventListener("mousedown", startChord);
chordButton.addEventListener("mouseup", stopChordIfActive);
chordButton.addEventListener("mouseleave", stopChordIfActive);
chordButton.addEventListener("touchstart", (e) => {
  e.preventDefault();
  startChord();
});
chordButton.addEventListener("touchend", (e) => {
  e.preventDefault();
  stopChordIfActive();
});
chordButton.addEventListener("touchcancel", stopChordIfActive);

const autoSequenceButton = document.getElementById("auto-sequence-button");
let isAutoSequenceActive = false;
autoSequenceButton.addEventListener("click", () => {
  isAutoSequenceActive = toggleAutoSequence(
    buttonColors,
    changeBackgroundColor,
    resetBackgroundColor
  );
  autoSequenceButton.textContent = isAutoSequenceActive
    ? "Stop Auto Sequence"
    : "Start Auto Sequence";
  autoSequenceButton.classList.toggle("active", isAutoSequenceActive);
});

// Octave shift buttons
const decreaseOctaveButton = document.getElementById("decrease-octave");
const increaseOctaveButton = document.getElementById("increase-octave");

decreaseOctaveButton.addEventListener("click", () => {
  buttonColors = shiftOctave(-1);
  updateToneButtons();
});

increaseOctaveButton.addEventListener("click", () => {
  buttonColors = shiftOctave(1);
  updateToneButtons();
});

// Speed control buttons
const slowerButton = document.getElementById("slower-button");
const fasterButton = document.getElementById("faster-button");

slowerButton.addEventListener("click", () => {
  if (isAutoSequenceActive) {
    setAutoSequenceSpeed("slower");
  }
});

fasterButton.addEventListener("click", () => {
  if (isAutoSequenceActive) {
    setAutoSequenceSpeed("faster");
  }
});

// Touch slide functionality
let isSliding = false;
const buttonContainer = document.querySelector(".button-container");

buttonContainer.addEventListener("touchstart", (e) => {
  isSliding = true;
  handleSlide(e);
});

buttonContainer.addEventListener("touchmove", (e) => {
  if (isSliding) {
    handleSlide(e);
  }
});

buttonContainer.addEventListener("touchend", () => {
  isSliding = false;
  Object.values(activeOscillators).forEach(({ oscillator, gainNode }) => {
    stopTone(oscillator, gainNode);
  });
  Object.keys(activeOscillators).forEach(
    (key) => delete activeOscillators[key]
  );
  resetBackgroundColor();
});

function handleSlide(e) {
  const touch = e.touches[0];
  const slidedButton = document.elementFromPoint(touch.clientX, touch.clientY);

  if (slidedButton && slidedButton.classList.contains("tone-button")) {
    const tone = slidedButton.textContent.trim();
    if (!activeOscillators[tone]) {
      startTone(tone);
    }
  }
}

function startTone(tone) {
  if (frequencies[tone] && !activeOscillators[tone]) {
    activeOscillators[tone] = playTone(frequencies[tone]);
    changeBackgroundColor(buttonColors[tone]);
  }
}

// Initial setup
updateToneButtons();
