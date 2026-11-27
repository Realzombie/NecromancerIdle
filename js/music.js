// Generative music themes. The home theme is the original ambient piece (a slow Am-F-Dm-E pad with random bell notes);
// every zone gets its own variation built from the same ingredients: a chord pad, sparse bells and a few extra layers
// (drone, wind, embers, organ, choir, plucked arpeggio, war drums, heartbeat, rumble, sparkles).
// Pure Web Audio with no assets, written so it can run on the live AudioContext or an OfflineAudioContext (see
// tools/renderaudio.html, which renders each theme to a WAV for listening).

import { REGION_THEMES, REGION_THEME_NAMES, noteAt } from './music_regions.js';
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const pick = (rnd, a) => a[Math.floor(rnd() * a.length)];

// ---- voices ----
function voice(ctx, dest, { type = 'sine', freq, t, dur, vol, attack = 0.4, det = 0, filt, filtType = 'lowpass', q = 0.7, lfo }) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq; o.detune.value = det;
  let node = o;
  if (filt) { const f = ctx.createBiquadFilter(); f.type = filtType; f.frequency.value = filt; f.Q.value = q; o.connect(f); node = f; }
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + dur * attack);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  node.connect(g); g.connect(dest);
  if (lfo) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = lfo.hz; lg.gain.value = lfo.cents; l.connect(lg); lg.connect(o.detune); l.start(t); l.stop(t + dur + 0.05); }
  o.start(t); o.stop(t + dur + 0.05);
}
function bell(ctx, dest, freq, t, { vol = 0.03, decay = 1.6, type = 'sine' } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  o.connect(g); g.connect(dest);
  o.start(t); o.stop(t + decay + 0.1);
}
function hiss(ctx, dest, nb, { t, dur, vol, f0, f1 = f0, q = 1, kind = 'bandpass', swell = false }) {
  const s = ctx.createBufferSource(); s.buffer = nb; s.loop = true;
  const f = ctx.createBiquadFilter(); f.type = kind; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.linearRampToValueAtTime(f1, t + dur);
  const g = ctx.createGain();
  if (swell) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.5); g.gain.linearRampToValueAtTime(0.0001, t + dur); }
  else { g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  s.connect(f); f.connect(g); g.connect(dest);
  s.start(t, 0.3); s.stop(t + dur + 0.05);
}
function timp(ctx, dest, nb, t, vol) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.35);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.75);
  hiss(ctx, dest, nb, { t, dur: 0.12, vol: vol * 0.5, f0: 260, kind: 'lowpass' });
}
function pluck(ctx, dest, freq, t, vol) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'triangle'; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.75);
}
function choirNote(ctx, dest, freq, t, dur, vol) {
  const o = ctx.createOscillator(), g = ctx.createGain(), f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter();
  o.type = 'sawtooth'; o.frequency.value = freq;
  f1.type = 'bandpass'; f1.frequency.value = 760; f1.Q.value = 5; f2.type = 'bandpass'; f2.frequency.value = 1180; f2.Q.value = 6;
  const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 4.8; lg.gain.value = 14; l.connect(lg); lg.connect(o.detune);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.45); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(dest);
  o.start(t); o.stop(t + dur + 0.05); l.start(t); l.stop(t + dur + 0.05);
}
function organNote(ctx, dest, freq, t, dur, vol) {
  [[1, 1], [2, 0.5], [3, 0.3], [4, 0.16]].forEach(([h, a]) => voice(ctx, dest, { type: 'sine', freq: freq * h, t, dur, vol: vol * a, attack: 0.3 }));
}
function heartbeat(ctx, dest, t, vol) {
  for (const [dt, v] of [[0, 1], [0.24, 0.7]]) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(70, t + dt); o.frequency.exponentialRampToValueAtTime(36, t + dt + 0.25);
    g.gain.setValueAtTime(vol * v, t + dt); g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.3);
    o.connect(g); g.connect(dest); o.start(t + dt); o.stop(t + dt + 0.35);
  }
}

// A melody note: a soft attack, a held middle with gentle vibrato, and a short tail.
function leadNote(ctx, dest, kind, freq, t, dur, vol) {
  if (kind === 'choir') { choirNote(ctx, dest, freq, t, dur + 0.5, vol); return; }
  const tones = kind === 'flute' ? [['sine', 1, 1], ['triangle', 2, 0.12]] : kind === 'reed' ? [['sawtooth', 1, 1], ['square', 1.005, 0.35]] : [['sawtooth', 1, 1], ['sawtooth', 1.006, 0.8]];
  for (const [type, mul, amp] of tones) {
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = type; o.frequency.value = freq * mul;
    f.type = kind === 'reed' ? 'bandpass' : 'lowpass'; f.Q.value = kind === 'reed' ? 1.6 : 0.6;
    f.frequency.value = kind === 'reed' ? Math.min(3200, freq * 3) : kind === 'horn' ? Math.min(2600, freq * 3.5) : 3500;
    const rise = kind === 'horn' ? 0.12 : kind === 'flute' ? 0.09 : 0.05;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol * amp, t + Math.min(rise, dur * 0.4));
    g.gain.linearRampToValueAtTime(vol * amp * 0.75, t + dur * 0.8);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.18);
    const l = ctx.createOscillator(), lg = ctx.createGain();
    l.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(kind === 'horn' ? 7 : 14, t + dur);
    l.connect(lg); lg.connect(o.detune);
    o.connect(f); f.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.25); l.start(t); l.stop(t + dur + 0.25);
  }
}
function blip(ctx, dest, t, f0, f1, dur, vol, type = 'sine') {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
}
function handDrum(ctx, dest, nb, t, kind, vol) {
  if (kind === 'd') blip(ctx, dest, t, 150, 70, 0.22, vol);
  else { blip(ctx, dest, t, 420, 300, 0.07, vol * 0.45, 'triangle'); hiss(ctx, dest, nb, { t, dur: 0.05, vol: vol * 0.5, f0: 2800, q: 2 }); }
}
function anvil(ctx, dest, nb, t, vol) {
  for (const [f, a, d] of [[820, 1, 0.5], [1237, 0.7, 0.4], [2210, 0.45, 0.25]]) bell(ctx, dest, f, t, { vol: vol * a, decay: d });
  hiss(ctx, dest, nb, { t, dur: 0.04, vol: vol * 0.8, f0: 4000, kind: 'highpass' });
}
function toll(ctx, dest, freq, t, vol) {
  for (const [h, a] of [[1, 1], [2.0, 0.5], [2.76, 0.35], [5.4, 0.12]]) bell(ctx, dest, freq * h, t, { vol: vol * a, decay: 4.2 / Math.sqrt(h) });
}

// ---- themes (chords are MIDI note numbers) ----
const CH = (...rows) => rows;
export const THEMES = {
  // The original piece, untouched.
  home: { dur: 5, chords: CH([45, 52, 57, 60], [41, 48, 53, 57], [38, 45, 50, 53], [40, 47, 52, 56]),
    pad: { type: 'triangle', filt: 700, vol: 0.035 }, bells: { scale: [69, 72, 74, 76, 79, 81], p: 0.7, vol: 0.03, decay: 1.6, n: 3, spacing: 1.6 }, extras: [] },
  // Graveyard Fields: the same piece with a cold breeze through the graves.
  z1: { dur: 5, chords: CH([45, 52, 57, 60], [41, 48, 53, 57], [38, 45, 50, 53], [40, 47, 52, 56]),
    pad: { type: 'triangle', filt: 700, vol: 0.035 }, bells: { scale: [69, 72, 74, 76, 79, 81], p: 0.7, vol: 0.03, decay: 1.6, n: 3, spacing: 1.6 }, extras: ['wind'], windVol: 0.012 },
  // Burned Farmstead: lower and slower, a smouldering drone and crackling embers, sparse mournful bells.
  z2: { dur: 6, chords: CH([38, 45, 50, 53], [34, 41, 46, 50], [43, 50, 55, 58], [33, 45, 49, 52]),
    pad: { type: 'sawtooth', filt: 480, vol: 0.026 }, bells: { scale: [62, 65, 69, 70, 74], p: 0.45, vol: 0.03, decay: 2.2, n: 2, spacing: 2.4 }, extras: ['drone', 'crackle'], droneVol: 0.05 },
  // Chapel Hill: an organ under tolling church bells.
  z3: { dur: 6, chords: CH([40, 47, 52, 55], [36, 43, 48, 52], [45, 52, 57, 60], [35, 47, 51, 54]),
    pad: { type: 'triangle', filt: 600, vol: 0.02 }, bells: { scale: [52, 55, 59, 64], p: 0.55, vol: 0.05, decay: 3.2, n: 2, spacing: 2.5 }, extras: ['organ', 'wind'], organVol: 0.03, windVol: 0.008 },
  // Castle Gatehouse: a slow march on war drums with low brass.
  z4: { dur: 5, chords: CH([36, 43, 48, 51], [32, 39, 44, 48], [41, 48, 53, 56], [43, 50, 55, 59]),
    pad: { type: 'sawtooth', filt: 620, vol: 0.034 }, bells: { scale: [60, 63, 67], p: 0.25, vol: 0.025, decay: 2, n: 2, spacing: 2 }, extras: ['timp'], timp: [0, 0.5, 0.75], timpVol: 0.12 },
  // Pilgrim Road: a plucked folk arpeggio at dawn.
  z5: { dur: 5, chords: CH([38, 45, 50, 53], [33, 45, 48, 52], [36, 43, 48, 52], [43, 50, 55, 59]),
    pad: { type: 'triangle', filt: 900, vol: 0.025 }, bells: { scale: [74, 76, 77, 79, 81], p: 0.55, vol: 0.026, decay: 1.4, n: 3, spacing: 1.5 }, extras: ['arp'], arp: { n: 10, vol: 0.045, oct: 12 } },
  // Cathedral Steps: a choir sings over high bells.
  z6: { dur: 7, chords: CH([41, 48, 52, 57], [45, 52, 55, 60], [38, 45, 48, 53], [34, 46, 50, 53]),
    pad: { type: 'sine', filt: 1000, vol: 0.03 }, bells: { scale: [81, 84, 86, 88], p: 0.8, vol: 0.034, decay: 2.4, n: 3, spacing: 2.2 }, extras: ['choir'], choirVol: 0.022 },
  // Hallowed Ground: ruins, a thin echoing hymn.
  z7: { dur: 7, chords: CH([43, 50, 55, 58], [39, 46, 51, 55], [46, 53, 58, 62], [41, 48, 53, 57]),
    pad: { type: 'sine', filt: 900, vol: 0.032, det: 8 }, bells: { scale: [70, 74, 77, 79, 82], p: 0.6, vol: 0.03, decay: 2.8, n: 2, spacing: 2.6, echo: true }, extras: ['wind'], windVol: 0.01 },
  // The Holy Citadel: grand, with drums and swelling brass.
  z8: { dur: 5, chords: CH([36, 43, 48, 52], [33, 45, 48, 52], [41, 48, 53, 57], [43, 50, 55, 59]),
    pad: { type: 'sawtooth', filt: 1100, vol: 0.04 }, bells: { scale: [72, 76, 79, 84], p: 0.6, vol: 0.034, decay: 2, n: 3, spacing: 1.6 }, extras: ['timp'], timp: [0, 0.5], timpVol: 0.1 },
  // Frostbitten Pass: wind, and glassy bells high above.
  z9: { dur: 8, chords: CH([52, 59, 64, 71], [48, 55, 60, 67], [57, 64, 69, 72], [50, 57, 62, 66]),
    pad: { type: 'sine', filt: 1500, vol: 0.026 }, bells: { scale: [88, 91, 93, 95, 96], p: 0.8, vol: 0.02, decay: 2.8, n: 4, spacing: 1.8 }, extras: ['wind'], windVol: 0.03 },
  // Wizard's Tower: shimmering arcane arpeggios and sparkles.
  z10: { dur: 6, chords: CH([38, 44, 50, 54], [40, 46, 52, 56], [42, 48, 54, 58], [36, 42, 48, 52]),
    pad: { type: 'square', filt: 800, vol: 0.016 }, bells: { scale: [78, 82, 84, 88, 90], p: 0.9, vol: 0.024, decay: 1.2, n: 4, spacing: 1.2 }, extras: ['arp', 'sparkle'], arp: { n: 16, vol: 0.03, oct: 24, wave: 'sine' } },
  // Dragon's Rest: low drones, a heartbeat and a distant rumble.
  z11: { dur: 8, chords: CH([28, 35, 40, 43], [29, 36, 41, 45], [28, 35, 40, 43], [26, 33, 38, 41]),
    pad: { type: 'sawtooth', filt: 320, vol: 0.03 }, bells: { scale: [52, 53, 57], p: 0.2, vol: 0.02, decay: 3, n: 1, spacing: 3 }, extras: ['drone', 'heart', 'rumble'], droneVol: 0.07, heartVol: 0.1 },
  // The Hero's Throne: epic, driving drums and brass.
  z12: { dur: 4.5, chords: CH([38, 45, 50, 53], [34, 46, 50, 53], [41, 48, 53, 57], [36, 48, 52, 55]),
    pad: { type: 'sawtooth', filt: 1000, vol: 0.045 }, bells: { scale: [74, 77, 81, 86], p: 0.5, vol: 0.03, decay: 1.8, n: 2, spacing: 1.6 }, extras: ['timp'], timp: [0, 0.25, 0.5, 0.75], timpVol: 0.11 },
  // The Endless Crypt: dread, dissonance and a slow heartbeat.
  crypt: { dur: 8, chords: CH([33, 39, 45], [34, 40, 46], [33, 39, 45], [32, 38, 44]),
    pad: { type: 'sawtooth', filt: 380, vol: 0.026, det: 12 }, bells: { scale: [60, 66, 67, 73], p: 0.4, vol: 0.02, decay: 3.4, n: 2, spacing: 3 }, extras: ['drone', 'heart', 'wind'], droneVol: 0.06, heartVol: 0.08, windVol: 0.012 },
  ...REGION_THEMES,
};
export const THEME_NAMES = {
  home: 'Home', z1: 'Graveyard Fields', z2: 'Burned Farmstead', z3: 'Chapel Hill', z4: 'Castle Gatehouse', z5: 'Pilgrim Road', z6: 'Cathedral Steps',
  z7: 'Hallowed Ground', z8: 'The Holy Citadel', z9: 'Frostbitten Pass', z10: "Wizard's Tower", z11: "Dragon's Rest", z12: "The Hero's Throne", crypt: 'The Endless Crypt', ...REGION_THEME_NAMES,
};

// Schedule one chord block of a theme starting at time t. Returns the block length in seconds.
export function scheduleBlock(ctx, dest, th, t, rnd, nb, idx) {
  const chord = th.chords[idx % th.chords.length], dur = th.dur;
  for (const m of chord) for (const det of [-4, 4]) voice(ctx, dest, { type: th.pad.type, freq: mtof(m), t, dur: dur + 1.5, vol: th.pad.vol, attack: 0.4, det: det + (th.pad.det || 0), filt: th.pad.filt });
  const ex = th.extras || [];
  if (ex.includes('drone')) voice(ctx, dest, { type: 'sawtooth', freq: mtof(chord[0] - 12), t, dur: dur + 2, vol: th.droneVol || 0.05, attack: 0.35, filt: 160 });
  if (ex.includes('wind')) hiss(ctx, dest, nb, { t, dur: dur + 1, vol: th.windVol || 0.015, f0: 500 + rnd() * 400, f1: 900 + rnd() * 500, q: 0.8, swell: true });
  if (ex.includes('rumble')) hiss(ctx, dest, nb, { t, dur: dur + 1, vol: 0.03, f0: 90, kind: 'lowpass', swell: true });
  if (ex.includes('crackle')) for (let i = 0; i < 16; i++) hiss(ctx, dest, nb, { t: t + rnd() * dur, dur: 0.03, vol: 0.012 + rnd() * 0.012, f0: 2500 + rnd() * 3000, q: 1.5, kind: 'highpass' });
  if (ex.includes('timp')) for (const fr of th.timp) timp(ctx, dest, nb, t + fr * dur, th.timpVol || 0.1);
  if (ex.includes('organ')) for (const m of chord) organNote(ctx, dest, mtof(m), t, dur + 1, th.organVol || 0.03);
  if (ex.includes('choir')) for (const m of chord) choirNote(ctx, dest, mtof(m + 12), t, dur + 1.5, th.choirVol || 0.02);
  if (ex.includes('arp')) { const a = th.arp, step = dur / a.n; for (let i = 0; i < a.n; i++) { const m = chord[i % chord.length] + a.oct; if (a.wave === 'sine') bell(ctx, dest, mtof(m), t + i * step, { vol: a.vol, decay: 0.9 }); else pluck(ctx, dest, mtof(m), t + i * step, a.vol); } }
  if (ex.includes('heart')) for (let k = 0; k * 1.9 < dur; k++) heartbeat(ctx, dest, t + k * 1.9, th.heartVol || 0.09);
  if (ex.includes('sparkle')) for (let i = 0; i < 9; i++) bell(ctx, dest, mtof(pick(rnd, th.bells.scale) + 12), t + rnd() * dur, { vol: 0.012, decay: 0.7 });
  if (ex.includes('hand')) for (const [fr, k] of th.hand) handDrum(ctx, dest, nb, t + fr * dur, k, th.handVol || 0.07);
  if (ex.includes('anvil')) for (const fr of th.anvil) anvil(ctx, dest, nb, t + fr * dur, th.anvilVol || 0.025);
  if (ex.includes('snare')) for (const fr of th.snare) hiss(ctx, dest, nb, { t: t + fr * dur, dur: 0.11, vol: th.snareVol || 0.03, f0: 1900, q: 0.9 });
  if (ex.includes('toms')) th.toms.forEach((fr, i) => blip(ctx, dest, t + fr * dur, i % 3 === 2 ? 190 : 130, i % 3 === 2 ? 100 : 62, 0.3, th.tomVol || 0.07));
  if (ex.includes('toll')) toll(ctx, dest, mtof(chord[0] + 24), t + 0.05, th.tollVol || 0.035);
  if (ex.includes('lowchoir')) for (const m of chord.slice(0, 3)) choirNote(ctx, dest, mtof(m), t, dur + 1.5, th.choirVol || 0.018);
  if (ex.includes('harp')) { const up = [0, 1, 2, 3, 2, 1]; up.forEach((k, i) => pluck(ctx, dest, mtof(chord[k] + 24), t + i * 0.16, th.harpVol || 0.025)); up.slice(0, 4).forEach((k, i) => pluck(ctx, dest, mtof(chord[k] + 24), t + dur * 0.55 + i * 0.2, (th.harpVol || 0.025) * 0.8)); }
  if (ex.includes('bubbles')) for (let i = 0; i < 7; i++) { const f = 260 + rnd() * 520; blip(ctx, dest, t + rnd() * dur, f, f * (1.5 + rnd()), 0.09, 0.012 + rnd() * 0.012); }
  if (ex.includes('croak') && rnd() < 0.7) { const at = t + rnd() * (dur - 1), f = 95 + rnd() * 50; for (let k = 0; k < 5; k++) blip(ctx, dest, at + k * 0.055, f * 1.25, f, 0.04, 0.022, 'square'); }
  if (ex.includes('birds')) for (let n = 0; n < 2; n++) if (rnd() < 0.7) { const at = t + rnd() * (dur - 1), f = 2300 + rnd() * 1500; for (let k = 0; k < 2 + Math.floor(rnd() * 3); k++) blip(ctx, dest, at + k * 0.11, f * (1 + 0.06 * k), f * (1.28 + 0.06 * k), 0.07, 0.009); }
  // the tune: stated on one chord, answered on the next, with a rest every fourth time so it can breathe
  if (th.lead && idx % 8 !== 7) {
    const L = th.lead, root = L.roots[idx % L.roots.length], phrase = idx % 2 ? L.answer : L.tune, eighth = dur / 8;
    // keep the tune in range when the chord root is high
    const shift = root > 3 ? root - 7 : root;
    for (const [step, start, len] of phrase) leadNote(ctx, dest, L.voice, mtof(noteAt(L.key, L.mode, shift + step - 7)), t + start * eighth, len * eighth * 0.95, L.vol);
  }
  const b = th.bells;
  for (let i = 0; i < b.n; i++) if (rnd() < b.p) {
    const f = mtof(pick(rnd, b.scale)), bt = t + 0.5 + i * b.spacing + rnd() * 0.5;
    bell(ctx, dest, f, bt, { vol: b.vol, decay: b.decay });
    if (b.echo) bell(ctx, dest, f, bt + 0.7, { vol: b.vol * 0.45, decay: b.decay });
  }
  return dur;
}
