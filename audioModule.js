import { updateButtonColors } from "./colorModule.js";

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

let baseFrequencies = {
  "D (High)": 587.33,
  E: 659.25,
  C: 523.25,
  "C (Low)": 261.63,
  G: 392.0,
};

let currentOctaveShift = 0;
let frequencies = updateFrequencies();

function updateFrequencies() {
  const octaveMultiplier = Math.pow(2, currentOctaveShift);
  return Object.fromEntries(
    Object.entries(baseFrequencies).map(([note, freq]) => [
      note,
      freq * octaveMultiplier,
    ])
  );
}

function shiftOctave(direction) {
  currentOctaveShift += direction;
  frequencies = updateFrequencies();
  return updateButtonColors(currentOctaveShift);
}

function ensureAudioContextResumed() {
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function playTone(frequency, duration = Infinity) {
  ensureAudioContextResumed();

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2000, audioContext.currentTime);
  filter.Q.setValueAtTime(10, audioContext.currentTime);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.01);

  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();

  if (duration !== Infinity) {
    gainNode.gain.linearRampToValueAtTime(
      0,
      audioContext.currentTime + duration
    );
    oscillator.stop(audioContext.currentTime + duration);
  }

  return { oscillator, gainNode };
}

function stopTone(oscillator, gainNode) {
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.01);
  setTimeout(() => {
    oscillator.stop();
    oscillator.disconnect();
    gainNode.disconnect();
  }, 10);
}

function playChord() {
  return Object.values(frequencies).map((freq) => playTone(freq, Infinity));
}

function stopChord(chordOscillators) {
  chordOscillators.forEach(({ oscillator, gainNode }) =>
    stopTone(oscillator, gainNode)
  );
}

export {
  frequencies,
  playTone,
  stopTone,
  playChord,
  stopChord,
  shiftOctave,
  currentOctaveShift,
};
