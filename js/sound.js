// Task-completion tones, generated with Web Audio (no audio files needed).

let ctx;
function audio() {
  ctx ||= new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function note(freq, start, dur, type = 'sine', gain = 0.18) {
  const a = audio(); const t = a.currentTime + start;
  const o = a.createOscillator(); const g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
}

export const TONES = ['chime', 'bell', 'pop', 'none'];

export function playTone(name) {
  try {
    if (name === 'chime') { note(660, 0, .25); note(880, .12, .35); note(1320, .24, .45, 'sine', .12); }
    else if (name === 'bell') { note(523, 0, 1.1, 'triangle', .22); note(1046, 0, .8, 'sine', .07); }
    else if (name === 'pop') { note(400, 0, .09, 'square', .08); note(800, .06, .12, 'sine', .14); }
  } catch { /* audio not available */ }
}
