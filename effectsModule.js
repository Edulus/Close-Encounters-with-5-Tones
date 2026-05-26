import { getFrequencies, playTone } from "./audioModule.js";

let isAutoSequenceActive = false;
let autoSequenceTimeout = null;
let currentIndex = 0;
let sequenceSpeed = 800;
let activeTone = null;
let onCycleComplete = null;
let onSpeedChange = null;

function tick(buttonColors, changeBackgroundColor, resetBackgroundColor) {
  if (!isAutoSequenceActive) return;

  const frequencies = getFrequencies();
  const tones = Object.keys(frequencies);

  if (currentIndex < tones.length) {
    const tone = tones[currentIndex];
    playTone(frequencies[tone], 0.7);
    changeBackgroundColor(buttonColors[tone], tone);
    activeTone = tone;
    currentIndex++;
  } else {
    resetBackgroundColor(activeTone);
    activeTone = null;
    currentIndex = 0;
    onCycleComplete?.(sequenceSpeed);
  }

  autoSequenceTimeout = setTimeout(() => {
    resetBackgroundColor(activeTone);
    activeTone = null;
    tick(buttonColors, changeBackgroundColor, resetBackgroundColor);
  }, sequenceSpeed);
}

export function toggleAutoSequence(
  buttonColors,
  changeBackgroundColor,
  resetBackgroundColor,
  callbacks = {}
) {
  if (isAutoSequenceActive) {
    isAutoSequenceActive = false;
    clearTimeout(autoSequenceTimeout);
    resetBackgroundColor(activeTone);
    activeTone = null;
    callbacks.onStop?.();
  } else {
    onCycleComplete = callbacks.onCycleComplete ?? null;
    onSpeedChange = callbacks.onSpeedChange ?? null;
    isAutoSequenceActive = true;
    currentIndex = 0;
    activeTone = null;
    tick(buttonColors, changeBackgroundColor, resetBackgroundColor);
  }
  return isAutoSequenceActive;
}

export function setAutoSequenceSpeed(direction) {
  if (direction === "slower") {
    sequenceSpeed = Math.min(sequenceSpeed * 1.2, 2000);
  } else if (direction === "faster") {
    sequenceSpeed = Math.max(sequenceSpeed / 1.2, 100);
  }
  onSpeedChange?.(sequenceSpeed);
}
