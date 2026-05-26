const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const baseFrequencies = {
  "D (High)": 587.33,
  E: 659.25,
  C: 523.25,
  "C (Low)": 261.63,
  G: 392.0,
};

let currentOctaveShift = 0;
let frequencies = computeFrequencies(0);

function computeFrequencies(octaveShift) {
  const multiplier = Math.pow(2, octaveShift);
  return Object.fromEntries(
    Object.entries(baseFrequencies).map(([note, freq]) => [
      note,
      freq * multiplier,
    ])
  );
}

export function getFrequencies() {
  return frequencies;
}

export function getOctaveShift() {
  return currentOctaveShift;
}

export function shiftOctave(direction) {
  currentOctaveShift += direction;
  frequencies = computeFrequencies(currentOctaveShift);
  return currentOctaveShift;
}

export function resumeAudioContext() {
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function buildVoice(frequency) {
  const now = audioContext.currentTime;

  const osc1 = audioContext.createOscillator();
  osc1.type = "sawtooth";
  osc1.frequency.setValueAtTime(frequency, now);
  osc1.detune.setValueAtTime(-7, now);

  const osc2 = audioContext.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(frequency, now);
  osc2.detune.setValueAtTime(7, now);

  const mixer = audioContext.createGain();
  mixer.gain.value = 0.6;

  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.setValueAtTime(6, now);
  filter.frequency.setValueAtTime(1800, now);

  const lfo = audioContext.createOscillator();
  lfo.frequency.value = 5;
  const lfoGain = audioContext.createGain();
  lfoGain.gain.value = 350;
  lfo.connect(lfoGain).connect(filter.frequency);

  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.45, now + 0.04);
  gainNode.gain.linearRampToValueAtTime(0.32, now + 0.25);

  osc1.connect(mixer);
  osc2.connect(mixer);
  mixer.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  osc1.start();
  osc2.start();
  lfo.start();

  return { oscillator: osc1, gainNode, extras: [osc2, lfo] };
}

export function playTone(frequency, duration = Infinity) {
  resumeAudioContext();
  const voice = buildVoice(frequency);

  if (duration !== Infinity) {
    const now = audioContext.currentTime;
    voice.gainNode.gain.cancelScheduledValues(now + 0.05);
    voice.gainNode.gain.linearRampToValueAtTime(0, now + duration);
    voice.oscillator.stop(now + duration);
    voice.extras.forEach((node) => node.stop(now + duration));
  }

  return voice;
}

export function stopTone(oscillator, gainNode, extras = []) {
  const now = audioContext.currentTime;
  const release = 0.08;
  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(gainNode.gain.value, now);
  gainNode.gain.linearRampToValueAtTime(0, now + release);
  setTimeout(() => {
    try {
      oscillator.stop();
      oscillator.disconnect();
      extras.forEach((node) => {
        try {
          node.stop();
        } catch {}
        node.disconnect();
      });
      gainNode.disconnect();
    } catch {}
  }, release * 1000 + 20);
}

export function playChord() {
  return Object.values(frequencies).map((freq) => playTone(freq, Infinity));
}

export function stopChord(chordOscillators) {
  chordOscillators.forEach(({ oscillator, gainNode, extras }) =>
    stopTone(oscillator, gainNode, extras)
  );
}
