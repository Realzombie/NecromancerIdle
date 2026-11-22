// Synthesised sound effects (Web Audio, no asset files). Call unlock() from a user gesture.
let ctx = null, master = null, noiseBuf = null;
let muted = false;
try { muted = localStorage.getItem('necro_muted') === '1'; } catch (e) { /* ignore */ }

export function unlock() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.5;
  master.connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  setTimeout(startMusic, 0);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

export function isMuted() { return muted; }
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('necro_muted', m ? '1' : '0'); } catch (e) { /* ignore */ }
  if (master) master.gain.value = m ? 0 : 0.5;
}

// One oscillator with a frequency sweep and a quick envelope.
function tone({ type = 'sine', f0, f1 = f0, dur = 0.1, vol = 0.1, delay = 0, attack = 0.005 }) {
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}

// Filtered noise burst (whooshes, thuds, rumbles).
function noise({ dur = 0.1, vol = 0.1, f0 = 1000, f1 = f0, q = 1, kind = 'bandpass', delay = 0 }) {
  const t = ctx.currentTime + delay;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = kind; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master);
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}

const jitter = (v, amt = 0.1) => v * (1 + (Math.random() * 2 - 1) * amt);

const SOUNDS = {
  swing: (e) => noise({ dur: 0.09, vol: 0.07, f0: jitter(e.team === 'player' ? 900 : 700), f1: 3200, q: 0.8, kind: 'bandpass' }),
  hit: (e) => {
    noise({ dur: 0.07, vol: 0.12, f0: 500, f1: 120, q: 0.7, kind: 'lowpass' });
    tone({ type: 'triangle', f0: jitter(e.team === 'player' ? 150 : 190), f1: 55, dur: 0.09, vol: 0.12 });
  },
  shoot: () => {
    tone({ type: 'sawtooth', f0: jitter(700), f1: 220, dur: 0.07, vol: 0.05 });
    noise({ dur: 0.04, vol: 0.05, f0: 3000, q: 2, kind: 'highpass' });
  },
  die: (e) => {
    if (e.team === 'player') {
      tone({ type: 'sine', f0: jitter(240), f1: 70, dur: 0.28, vol: 0.12 });
      noise({ dur: 0.18, vol: 0.06, f0: 800, f1: 150, kind: 'lowpass' });
    } else {
      tone({ type: 'square', f0: jitter(420), f1: 140, dur: 0.16, vol: 0.06 });
    }
  },
  raise: () => {
    tone({ type: 'triangle', f0: 90, f1: 300, dur: 0.5, vol: 0.12, attack: 0.08 });
    tone({ type: 'sine', f0: 135, f1: 450, dur: 0.5, vol: 0.07, attack: 0.1 });
    noise({ dur: 0.3, vol: 0.04, f0: 400, f1: 2400, q: 3, delay: 0.15 });
  },
  wave: () => {
    tone({ type: 'sawtooth', f0: 98, f1: 92, dur: 0.55, vol: 0.07, attack: 0.05 });
    tone({ type: 'sawtooth', f0: 147, f1: 140, dur: 0.55, vol: 0.04, attack: 0.05 });
  },
  boss: () => {
    tone({ type: 'sawtooth', f0: 70, f1: 62, dur: 1.2, vol: 0.12, attack: 0.1 });
    tone({ type: 'sawtooth', f0: 105, f1: 93, dur: 1.2, vol: 0.07, attack: 0.1 });
    noise({ dur: 1.0, vol: 0.08, f0: 160, f1: 60, kind: 'lowpass' });
  },
  win: () => [392, 494, 587, 784].forEach((f, i) => tone({ type: 'square', f0: f, dur: 0.22, vol: 0.06, delay: i * 0.13 })),
  lose: () => {
    tone({ type: 'sawtooth', f0: 300, f1: 55, dur: 1.0, vol: 0.1, attack: 0.02 });
    noise({ dur: 0.8, vol: 0.05, f0: 600, f1: 80, kind: 'lowpass' });
  },
  trap: () => {
    noise({ dur: 0.12, vol: 0.1, f0: 2500, f1: 600, q: 1.2, kind: 'bandpass' });
    tone({ type: 'square', f0: 180, f1: 90, dur: 0.1, vol: 0.06 });
  },
  drop: () => [660, 880, 1320].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.16, vol: 0.07, delay: i * 0.07 })),
  ach: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.26, vol: 0.07, delay: i * 0.09 })),
  click: () => tone({ type: 'square', f0: 640, f1: 520, dur: 0.05, vol: 0.04 }),
  buy: () => {
    tone({ type: 'triangle', f0: 740, dur: 0.1, vol: 0.09 });
    tone({ type: 'triangle', f0: 1110, dur: 0.18, vol: 0.09, delay: 0.08 });
  },
};

// Minimum gap between plays (ms) so a big fight stays a murmur rather than a wall of noise.
const GAP = { swing: 70, hit: 45, shoot: 90, die: 90, raise: 200, trap: 150 };
const last = {};

export function play(name, e = {}) {
  if (!ctx || muted || !SOUNDS[name]) return;
  const now = performance.now();
  if (now - (last[name] || 0) < (GAP[name] || 0)) return;
  last[name] = now;
  SOUNDS[name](e);
}

// ---- Ambient music: a slow minor-key pad with sparse bell notes, scheduled just ahead of the clock ----
let music = true, musicGain = null, musicTimer = null, nextChord = 0, chordIdx = 0;
try { music = localStorage.getItem('necro_music') !== '0'; } catch (e) { /* ignore */ }
const CHORDS = [[110, 165, 220, 262], [87.3, 131, 175, 220], [73.4, 110, 147, 175], [82.4, 123, 165, 208]];   // Am F Dm E
const BELLS = [440, 523, 587, 659, 784, 880];

export function isMusicOn() { return music; }
export function setMusic(on) {
  music = on;
  try { localStorage.setItem('necro_music', on ? '1' : '0'); } catch (e) { /* ignore */ }
  if (musicGain) musicGain.gain.value = on ? 0.5 : 0;
  if (on) startMusic();
}

function pad(freq, t, dur) {
  for (const det of [-4, 4]) {
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = 'triangle'; o.frequency.value = freq; o.detune.value = det;
    f.type = 'lowpass'; f.frequency.value = 700;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.035, t + dur * 0.4);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(musicGain);
    o.start(t); o.stop(t + dur + 0.05);
  }
}
function bell(freq, t) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.03, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
  o.connect(g); g.connect(musicGain);
  o.start(t); o.stop(t + 1.7);
}
export function startMusic() {
  if (!ctx || !music || musicTimer) return;
  if (!musicGain) { musicGain = ctx.createGain(); musicGain.gain.value = 0.5; musicGain.connect(master); }
  nextChord = ctx.currentTime + 0.1;
  musicTimer = setInterval(() => {
    while (nextChord < ctx.currentTime + 1.5) {
      const dur = 5;
      for (const f of CHORDS[chordIdx % CHORDS.length]) pad(f, nextChord, dur + 1.5);
      for (let i = 0; i < 3; i++) if (Math.random() < 0.7) bell(BELLS[Math.floor(Math.random() * BELLS.length)], nextChord + 0.5 + i * 1.6 + Math.random() * 0.5);
      chordIdx++;
      nextChord += dur;
    }
  }, 400);
}
