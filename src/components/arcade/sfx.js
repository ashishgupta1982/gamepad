// Sound effects made in code with the Web Audio API: no audio files, nothing to
// license, nothing to download over a car's patchy signal.
//
// On by default, with a mute switch remembered on the device (MuteButton).
// Browsers will not start audio until the page has had a tap, so the first
// sound of a session plays only after one; every effect here follows a tap or a
// game event that comes after one, so in practice that is never noticed.

const MUTE_KEY = 'gamepad:muted';
const listeners = new Set();
let ctx = null;
let muted = null;

export function isMuted() {
  if (muted === null) {
    try {
      muted = typeof window !== 'undefined' && window.localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      muted = false;
    }
  }
  return muted;
}

export function setMuted(value) {
  muted = Boolean(value);
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {}
  listeners.forEach((fn) => fn(muted));
}

export function onMutedChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function audio() {
  if (typeof window === 'undefined' || isMuted()) return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// One note: an oscillator through an envelope. `slide` bends the pitch to a
// second frequency over the note, which is what makes a thunk or a whoop.
function note(ac, { freq, slide, type = 'sine', start = 0, dur = 0.15, gain = 0.25, attack = 0.005 }) {
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// A short burst of noise, for the slap of a stamp.
function noise(ac, { start = 0, dur = 0.06, gain = 0.15 }) {
  const t0 = ac.currentTime + start;
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ac.createBufferSource();
  const amp = ac.createGain();
  amp.gain.value = gain;
  src.buffer = buffer;
  src.connect(amp).connect(ac.destination);
  src.start(t0);
}

const EFFECTS = {
  // A light blip for an ordinary button.
  tap: (ac) => note(ac, { freq: 660, slide: 880, type: 'triangle', dur: 0.06, gain: 0.12 }),
  // A rubber stamp coming down: a low thunk with a slap on top.
  stamp: (ac) => {
    note(ac, { freq: 180, slide: 55, type: 'sine', dur: 0.18, gain: 0.5 });
    noise(ac, { dur: 0.05, gain: 0.18 });
  },
  // Undoing a find: the stamp backwards, quieter.
  unstamp: (ac) => note(ac, { freq: 220, slide: 440, type: 'triangle', dur: 0.12, gain: 0.15 }),
  // A line: a quick rising arpeggio.
  line: (ac) => [523, 659, 784, 1047].forEach((f, i) => note(ac, { freq: f, type: 'square', start: i * 0.08, dur: 0.14, gain: 0.12 })),
  // The full house: the arpeggio twice, then a held chord.
  win: (ac) => {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => note(ac, { freq: f, type: 'square', start: i * 0.1, dur: 0.16, gain: 0.12 }));
    [523, 659, 784].forEach((f) => note(ac, { freq: f, type: 'triangle', start: 0.62, dur: 0.9, gain: 0.14 }));
  },
  // Another car found something: two quick toots of a car horn.
  honk: (ac) => {
    for (const start of [0, 0.2]) {
      note(ac, { freq: 415, type: 'sawtooth', start, dur: 0.14, gain: 0.07 });
      note(ac, { freq: 523, type: 'sawtooth', start, dur: 0.14, gain: 0.07 });
    }
  },
  // Something went wrong.
  error: (ac) => note(ac, { freq: 200, slide: 120, type: 'square', dur: 0.25, gain: 0.1 }),
  // The camera pushing into the room: a rising swish of filtered noise.
  whoosh: (ac) => {
    const t0 = ac.currentTime;
    const len = Math.ceil(ac.sampleRate * 0.5);
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / len) * 0.5;
    const src = ac.createBufferSource();
    const filter = ac.createBiquadFilter();
    const amp = ac.createGain();
    filter.type = 'bandpass';
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(300, t0);
    filter.frequency.exponentialRampToValueAtTime(2400, t0 + 0.45);
    amp.gain.value = 0.45;
    src.buffer = buffer;
    src.connect(filter).connect(amp).connect(ac.destination);
    src.start(t0);
  },
  // Pulling back out of it.
  back: (ac) => note(ac, { freq: 700, slide: 380, type: 'triangle', dur: 0.12, gain: 0.14 }),
  // The cupboard doors: a creak and a click.
  door: (ac) => {
    note(ac, { freq: 180, slide: 120, type: 'sawtooth', dur: 0.25, gain: 0.05 });
    note(ac, { freq: 520, slide: 780, type: 'triangle', start: 0.2, dur: 0.12, gain: 0.12 });
  },
  // A dart landing in the board.
  thunk: (ac) => {
    note(ac, { freq: 140, slide: 70, type: 'sine', dur: 0.1, gain: 0.25 });
    noise(ac, { dur: 0.03, gain: 0.1 });
  },
  // The quiz clock's last seconds: a dry tick, higher for the final three.
  tick: (ac) => note(ac, { freq: 1400, type: 'square', dur: 0.03, gain: 0.06 }),
  tickHigh: (ac) => note(ac, { freq: 1900, type: 'square', dur: 0.04, gain: 0.08 }),
  // The 3-2-1 before a quiz: beep, beep, then a long high one.
  beep: (ac) => note(ac, { freq: 660, type: 'sine', dur: 0.14, gain: 0.2 }),
  go: (ac) => note(ac, { freq: 1320, type: 'sine', dur: 0.4, gain: 0.22 }),
  // The answer revealed: a rising sting.
  sting: (ac) => [392, 523, 659].forEach((f, i) => note(ac, { freq: f, type: 'sawtooth', start: i * 0.06, dur: 0.22, gain: 0.06 })),
  // Right: two bright bells. Wrong: a low double buzz.
  correct: (ac) => {
    note(ac, { freq: 988, type: 'sine', dur: 0.18, gain: 0.22 });
    note(ac, { freq: 1319, type: 'sine', start: 0.1, dur: 0.35, gain: 0.22 });
  },
  wrong: (ac) => {
    note(ac, { freq: 150, type: 'square', dur: 0.16, gain: 0.09 });
    note(ac, { freq: 140, type: 'square', start: 0.2, dur: 0.28, gain: 0.09 });
  },
  // An answer locked in.
  lock: (ac) => note(ac, { freq: 520, slide: 780, type: 'triangle', dur: 0.09, gain: 0.16 }),
  // Someone joined the quiz.
  pop: (ac) => note(ac, { freq: 440, slide: 1100, type: 'sine', dur: 0.12, gain: 0.16 }),
  // Cards dealt.
  deal: (ac) => [0, 0.07, 0.14, 0.21].forEach((start) => noise(ac, { start, dur: 0.04, gain: 0.08 })),
};

export function play(name) {
  const ac = audio();
  const effect = EFFECTS[name];
  if (!ac || !effect) return;
  try {
    effect(ac);
  } catch {
    // Sound is decoration; a failure here must never reach the game.
  }
}
