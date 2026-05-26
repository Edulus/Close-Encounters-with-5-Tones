import {
  getFrequencies,
  getOctaveShift,
  shiftOctave,
  resumeAudioContext,
  playTone,
  stopTone,
  playChord,
  stopChord,
} from "./audioModule.js";
import { toggleAutoSequence, setAutoSequenceSpeed, resetAutoSequenceSpeed } from "./effectsModule.js";
import { updateButtonColors } from "./colorModule.js";
import { ufoController } from "./ufoAnimation.js";
import { startStarfield } from "./starfield.js";
import { mountHorizon } from "./horizon.js";

startStarfield();
mountHorizon();

let buttonColors = updateButtonColors(getOctaveShift());
const activeOscillators = {};
let chordOscillators = [];
let isAutoSequenceActive = false;
let abductionOccurred = false;
let sequenceStartPending = false;
let pendingTimeout = null;
let hasRunSequenceBefore = false;

const toneButtons = document.querySelectorAll(".tone-button");
const chordButton = document.getElementById("chord-button");
const autoSequenceButton = document.getElementById("auto-sequence-button");
const decreaseOctaveButton = document.getElementById("decrease-octave");
const increaseOctaveButton = document.getElementById("increase-octave");
const slowerButton = document.getElementById("slower-button");
const fasterButton = document.getElementById("faster-button");
const buttonContainer = document.querySelector(".button-container");

const toneByIndex = Array.from(toneButtons).map((b) => b.textContent.trim());
const buttonByTone = Object.fromEntries(
  Array.from(toneButtons).map((b) => [b.textContent.trim(), b])
);

ufoController.setBeamTargets([
  { key: "slower", element: slowerButton, emoji: "🐢" },
  { key: "faster", element: fasterButton, emoji: "🐰" },
]);

ufoController.setOnAbductionComplete(() => {
  abductionOccurred = true;
  hasRunSequenceBefore = true;
  if (isAutoSequenceActive) toggleSequence();
});

function changeBackgroundColor(color) {
  document.body.style.background = color;
}

function resetBackgroundColor() {
  document.body.style.background = "";
}

function updateToneButtons() {
  toneButtons.forEach((button) => {
    const tone = button.textContent.trim();
    button.style.backgroundColor = buttonColors[tone];
  });
}

function setToneHighlight(tone, on) {
  buttonByTone[tone]?.classList.toggle("playing", on);
}

function startTone(tone) {
  const frequencies = getFrequencies();
  if (frequencies[tone] && !activeOscillators[tone]) {
    activeOscillators[tone] = playTone(frequencies[tone]);
    changeBackgroundColor(buttonColors[tone]);
    setToneHighlight(tone, true);
  }
}

function stopToneIfActive(tone) {
  const active = activeOscillators[tone];
  if (active) {
    stopTone(active.oscillator, active.gainNode, active.extras);
    delete activeOscillators[tone];
    resetBackgroundColor();
    setToneHighlight(tone, false);
  }
}

function stopAllTones() {
  Object.entries(activeOscillators).forEach(
    ([tone, { oscillator, gainNode, extras }]) => {
      stopTone(oscillator, gainNode, extras);
      setToneHighlight(tone, false);
      delete activeOscillators[tone];
    }
  );
  resetBackgroundColor();
}

document.body.addEventListener("click", resumeAudioContext, { once: true });

toneButtons.forEach((button) => {
  const tone = button.textContent.trim();
  button.addEventListener("mousedown", () => startTone(tone));
  button.addEventListener("mouseup", () => stopToneIfActive(tone));
  button.addEventListener("mouseleave", () => stopToneIfActive(tone));
});

function startChord() {
  if (chordOscillators.length === 0) {
    chordOscillators = playChord();
    changeBackgroundColor("#4caf50");
    toneByIndex.forEach((t) => setToneHighlight(t, true));
  }
}

function stopChordIfActive() {
  if (chordOscillators.length > 0) {
    stopChord(chordOscillators);
    chordOscillators = [];
    resetBackgroundColor();
    toneByIndex.forEach((t) => setToneHighlight(t, false));
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

function doToggleAutoSequence() {
  return toggleAutoSequence(
    buttonColors,
    (color, tone) => {
      changeBackgroundColor(color);
      if (tone) setToneHighlight(tone, true);
    },
    (tone) => {
      resetBackgroundColor();
      if (tone) setToneHighlight(tone, false);
    },
    {
      onCycleComplete: (speed) => ufoController.descend(speed),
      onSpeedChange: (speed) => ufoController.setTransitionSpeed(speed),
      onStop: () => ufoController.zoomAway(),
    }
  );
}

function toggleSequence() {
  // Cancel pending start if user clicks Stop during chord preview or pause
  if (sequenceStartPending) {
    clearTimeout(pendingTimeout);
    sequenceStartPending = false;
    stopChordIfActive();
    autoSequenceButton.textContent = "Start Auto Sequence";
    autoSequenceButton.classList.remove("active");
    return;
  }

  if (!isAutoSequenceActive) {
    // Restore abducted buttons immediately, before anything else
    if (abductionOccurred) {
      const shift = getOctaveShift();
      if (shift !== 0) {
        shiftOctave(-shift);
        buttonColors = updateButtonColors(getOctaveShift());
        updateToneButtons();
      }
      resetAutoSequenceSpeed();
      abductionOccurred = false;
      ufoController.animatedRestoreAllTargets();
    } else {
      ufoController.restoreAllTargets();
    }

    if (hasRunSequenceBefore) {
      // Play chord, then 1s pause, then start sequence
      sequenceStartPending = true;
      autoSequenceButton.textContent = "Stop Auto Sequence";
      autoSequenceButton.classList.add("active");
      startChord();

      pendingTimeout = setTimeout(() => {
        stopChordIfActive();
        pendingTimeout = setTimeout(() => {
          sequenceStartPending = false;
          isAutoSequenceActive = doToggleAutoSequence();
        }, 1000);
      }, 1200);
    } else {
      // First run: start immediately, no chord preview
      isAutoSequenceActive = doToggleAutoSequence();
      autoSequenceButton.textContent = "Stop Auto Sequence";
      autoSequenceButton.classList.add("active");
    }
  } else {
    isAutoSequenceActive = doToggleAutoSequence();
    autoSequenceButton.textContent = "Start Auto Sequence";
    autoSequenceButton.classList.remove("active");
    hasRunSequenceBefore = true;
  }
}

autoSequenceButton.addEventListener("click", toggleSequence);

decreaseOctaveButton.addEventListener("click", () => {
  if (getOctaveShift() <= -4) return;
  shiftOctave(-1);
  buttonColors = updateButtonColors(getOctaveShift());
  updateToneButtons();
});

increaseOctaveButton.addEventListener("click", () => {
  if (getOctaveShift() >= 4) return;
  shiftOctave(1);
  buttonColors = updateButtonColors(getOctaveShift());
  updateToneButtons();
});

slowerButton.addEventListener("click", () => {
  if (isAutoSequenceActive) setAutoSequenceSpeed("slower");
});

fasterButton.addEventListener("click", () => {
  if (isAutoSequenceActive) setAutoSequenceSpeed("faster");
});

function toneFromPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  if (el && el.classList.contains("tone-button")) {
    return el.textContent.trim();
  }
  return null;
}

buttonContainer.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const tone = toneFromPoint(e.touches[0].clientX, e.touches[0].clientY);
  if (tone) startTone(tone);
});

buttonContainer.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const tone = toneFromPoint(e.touches[0].clientX, e.touches[0].clientY);
  if (tone) startTone(tone);
});

buttonContainer.addEventListener("touchend", stopAllTones);
buttonContainer.addEventListener("touchcancel", stopAllTones);

const keyToTone = {
  Digit1: toneByIndex[0],
  Digit2: toneByIndex[1],
  Digit3: toneByIndex[2],
  Digit4: toneByIndex[3],
  Digit5: toneByIndex[4],
};

window.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  const tone = keyToTone[e.code];
  if (tone) {
    e.preventDefault();
    startTone(tone);
  }
});

window.addEventListener("keyup", (e) => {
  const tone = keyToTone[e.code];
  if (tone) {
    e.preventDefault();
    stopToneIfActive(tone);
  }
});

updateToneButtons();
