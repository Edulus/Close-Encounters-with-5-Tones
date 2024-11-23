import { frequencies, playTone } from "./audioModule.js";
import { ufoController } from "./ufoAnimation.js";

let isAutoSequenceActive = false;
let autoSequenceTimeout;
let currentIndex = 0;
let sequenceSpeed = 800;

function playAutoSequenceTone(
  buttonColors,
  changeBackgroundColor,
  resetBackgroundColor
) {
  if (!isAutoSequenceActive) return;

  const tones = Object.keys(frequencies);

  if (currentIndex < tones.length) {
    const tone = tones[currentIndex];
    playTone(frequencies[tone], 0.7);
    changeBackgroundColor(buttonColors[tone]);
    currentIndex++;
  } else {
    resetBackgroundColor();
    currentIndex = 0;
    ufoController.descend(sequenceSpeed);
  }

  autoSequenceTimeout = setTimeout(() => {
    resetBackgroundColor();
    playAutoSequenceTone(
      buttonColors,
      changeBackgroundColor,
      resetBackgroundColor
    );
  }, sequenceSpeed);
}

function startAutoSequence(
  buttonColors,
  changeBackgroundColor,
  resetBackgroundColor
) {
  isAutoSequenceActive = true;
  currentIndex = 0;
  playAutoSequenceTone(
    buttonColors,
    changeBackgroundColor,
    resetBackgroundColor
  );
}

function stopAutoSequence(resetBackgroundColor) {
  isAutoSequenceActive = false;
  clearTimeout(autoSequenceTimeout);
  resetBackgroundColor();
  ufoController.zoomAway();
}

function toggleAutoSequence(
  buttonColors,
  changeBackgroundColor,
  resetBackgroundColor
) {
  if (isAutoSequenceActive) {
    stopAutoSequence(resetBackgroundColor);
  } else {
    startAutoSequence(
      buttonColors,
      changeBackgroundColor,
      resetBackgroundColor
    );
  }
  return isAutoSequenceActive;
}

function setAutoSequenceSpeed(direction) {
  if (direction === "slower") {
    sequenceSpeed = Math.min(sequenceSpeed * 1.2, 2000);
  } else if (direction === "faster") {
    sequenceSpeed = Math.max(sequenceSpeed / 1.2, 100);
  }
  ufoController.setTransitionSpeed(sequenceSpeed);
}

export { toggleAutoSequence, setAutoSequenceSpeed };
