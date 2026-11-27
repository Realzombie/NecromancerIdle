// Music for regions 4-10 (zones 13-40). Every zone has its own theme: a chord progression and a short tune that comes
// back, answered differently each other time, played with its region's instruments (see the layers in music.js).

const SCALES = {
  aeolian: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], arabic: [0, 1, 4, 5, 7, 8, 10],
  harmonic: [0, 2, 3, 5, 7, 8, 11], major: [0, 2, 4, 5, 7, 9, 11], lydian: [0, 2, 4, 6, 7, 9, 11], mixo: [0, 2, 4, 5, 7, 9, 10],
};
// the MIDI note `step` scale steps above the key note
const note = (key, mode, step) => { const s = SCALES[mode], n = s.length; return key + s[((step % n) + n) % n] + 12 * Math.floor(step / n); };
// a low, open chord on a scale step: bass, fifth, octave and third above
const chordOn = (key, mode, d) => [note(key, mode, d), note(key, mode, d + 4), note(key, mode, d + 7), note(key, mode, d + 9)];

// o: key (MIDI of the low key note), mode, prog (scale steps of each chord), dur (seconds a chord), plus theme fields.
// A tune is a list of [step above the chord's root, start, length] with start and length in eighths of the block.
function theme(o) {
  const { key, mode, prog, lead, bells, ...rest } = o;
  return {
    ...rest,
    chords: prog.map((d) => chordOn(key, mode, d)),
    lead: lead && { ...lead, roots: prog, key: key + 12 * (lead.oct || 2), mode },
    bells: { scale: [0, 2, 4, 7, 9].map((s) => note(key + 36, mode, s)), p: 0.25, vol: 0.016, decay: 1.8, n: 2, spacing: 2.2, ...(bells || {}) },
    extras: o.extras || [],
  };
}
export const noteAt = note;

export const REGION_THEMES = {
  // ---- The Drowned Mire: murky drones, bubbling water, frogs and a breathy low pipe ----
  z13: theme({ key: 38, mode: 'dorian', prog: [0, 3, 0, 6], dur: 7, pad: { type: 'triangle', filt: 520, vol: 0.026, det: 7 }, extras: ['drone', 'bubbles', 'croak'], droneVol: 0.04,
    lead: { voice: 'flute', vol: 0.045, tune: [[7, 0.5, 2], [8, 2.5, 1], [7, 3.5, 1], [4, 4.5, 3]], answer: [[9, 0.5, 1.5], [8, 2, 1], [7, 3, 1], [4, 4, 1], [3, 5, 2.5]] } }),
  z14: theme({ key: 40, mode: 'phrygian', prog: [0, 1, 0, 5], dur: 6.5, pad: { type: 'sawtooth', filt: 380, vol: 0.022, det: 9 }, extras: ['bubbles', 'croak', 'hand', 'drone'], droneVol: 0.025, hand: [[0, 'd'], [0.375, 't'], [0.5, 'd'], [0.875, 't']], handVol: 0.06,
    lead: { voice: 'reed', vol: 0.02, tune: [[7, 0, 1], [8, 1, 1], [7, 2, 2], [4, 5, 2]], answer: [[4, 0, 1], [5, 1, 1], [8, 2, 1.5], [7, 4, 3]] } }),
  z15: theme({ key: 35, mode: 'aeolian', prog: [0, 5, 3, 4], dur: 6, pad: { type: 'sawtooth', filt: 340, vol: 0.03 }, extras: ['drone', 'timp', 'croak', 'rumble'], droneVol: 0.05, timp: [0, 0.375, 0.5], timpVol: 0.1,
    lead: { voice: 'horn', vol: 0.032, oct: 1, tune: [[7, 1, 2], [6, 3, 1], [4, 4, 3]], answer: [[9, 1, 1.5], [7, 2.5, 1.5], [4, 4.5, 3]] } }),
  z16: theme({ key: 36, mode: 'harmonic', prog: [0, 3, 5, 4], dur: 8, pad: { type: 'sine', filt: 800, vol: 0.034, det: 10 }, extras: ['choir', 'bubbles', 'toll'], choirVol: 0.014, tollVol: 0.045,
    lead: { voice: 'flute', vol: 0.04, tune: [[4, 1, 2], [6, 3, 1], [7, 4, 3.5]], answer: [[9, 1, 2], [8, 3, 1], [7, 4, 1], [6, 5, 2.5]] } }),

  // ---- The Sunscorched Wastes: a drone, hand drums and a winding reed pipe ----
  z17: theme({ key: 38, mode: 'arabic', prog: [0, 0, 1, 0], dur: 6, pad: { type: 'triangle', filt: 700, vol: 0.022 }, extras: ['drone', 'hand', 'wind'], droneVol: 0.035, windVol: 0.012,
    hand: [[0, 'd'], [0.25, 't'], [0.375, 't'], [0.5, 'd'], [0.75, 't']], handVol: 0.085,
    lead: { voice: 'reed', vol: 0.024, tune: [[7, 0, 1], [8, 1, 0.5], [9, 1.5, 1.5], [8, 3, 0.5], [7, 3.5, 1.5], [4, 5, 2.5]], answer: [[9, 0, 1], [11, 1, 1], [10, 2, 0.5], [9, 2.5, 0.5], [8, 3, 1], [7, 4, 3]] } }),
  z18: theme({ key: 40, mode: 'arabic', prog: [0, 3, 1, 0], dur: 6.5, pad: { type: 'sine', filt: 1200, vol: 0.032 }, extras: ['arp', 'hand', 'sparkle'], arp: { n: 8, vol: 0.03, oct: 12 },
    hand: [[0, 'd'], [0.375, 't'], [0.625, 't'], [0.75, 'd']], handVol: 0.05,
    lead: { voice: 'flute', vol: 0.045, tune: [[7, 0.5, 1.5], [9, 2, 1], [11, 3, 2], [9, 5, 1], [8, 6, 1.5]], answer: [[11, 0.5, 1], [12, 1.5, 1], [11, 2.5, 1], [9, 3.5, 1], [7, 4.5, 3]] } }),
  z19: theme({ key: 36, mode: 'arabic', prog: [0, 1, 0, 6], dur: 7, pad: { type: 'sawtooth', filt: 420, vol: 0.026 }, extras: ['drone', 'hand', 'rumble'], droneVol: 0.05, hand: [[0, 'd'], [0.5, 'd'], [0.75, 't'], [0.875, 't']], handVol: 0.09,
    lead: { voice: 'reed', vol: 0.02, oct: 1, tune: [[7, 1, 2], [8, 3, 2], [7, 5, 2]], answer: [[11, 1, 1], [9, 2, 1], [8, 3, 1], [7, 4, 3]] } }),
  z20: theme({ key: 38, mode: 'harmonic', prog: [0, 5, 3, 4], dur: 5, pad: { type: 'sawtooth', filt: 900, vol: 0.032 }, extras: ['hand', 'timp', 'choir'], choirVol: 0.011, timp: [0, 0.5], timpVol: 0.08,
    hand: [[0.125, 't'], [0.25, 'd'], [0.375, 't'], [0.625, 't'], [0.75, 'd'], [0.875, 't']], handVol: 0.065,
    lead: { voice: 'horn', vol: 0.034, tune: [[7, 0, 1.5], [9, 1.5, 0.5], [11, 2, 2], [9, 4, 1], [7, 5, 2.5]], answer: [[11, 0, 1], [13, 1, 1.5], [12, 2.5, 0.5], [11, 3, 1], [9, 4, 1], [7, 5, 2.5]] } }),

  // ---- The Deep Holds: anvils, a deep drone, low voices and war drums ----
  z21: theme({ key: 33, mode: 'aeolian', prog: [0, 0, 5, 6], dur: 6, pad: { type: 'triangle', filt: 420, vol: 0.028 }, extras: ['anvil', 'drone', 'lowchoir'], anvil: [0, 0.5], anvilVol: 0.017, droneVol: 0.045, choirVol: 0.016,
    lead: { voice: 'horn', vol: 0.026, tune: [[7, 1, 1], [7, 2, 1], [9, 3, 1.5], [7, 4.5, 3]], answer: [[11, 1, 1.5], [9, 2.5, 0.5], [8, 3, 1], [7, 4, 3.5]] } }),
  z22: theme({ key: 35, mode: 'phrygian', prog: [0, 1, 0, 3], dur: 5, pad: { type: 'sawtooth', filt: 360, vol: 0.026 }, extras: ['anvil', 'crackle', 'timp', 'rumble'], anvil: [0, 0.25, 0.5, 0.625], anvilVol: 0.019, timp: [0, 0.5, 0.75], timpVol: 0.09,
    lead: { voice: 'horn', vol: 0.03, oct: 1, tune: [[7, 0, 2], [8, 2, 1], [7, 3, 1], [4, 4, 3.5]], answer: [[4, 0, 1], [7, 1, 1], [8, 2, 2], [7, 4, 3.5]] } }),
  z23: theme({ key: 36, mode: 'dorian', prog: [0, 3, 6, 4], dur: 4.5, pad: { type: 'square', filt: 460, vol: 0.016 }, extras: ['anvil', 'timp', 'snare'], anvil: [0.25, 0.75], anvilVol: 0.017, timp: [0, 0.5], timpVol: 0.11, snare: [0.125, 0.25, 0.375, 0.625, 0.75, 0.875], snareVol: 0.028,
    lead: { voice: 'reed', vol: 0.019, oct: 1, tune: [[7, 0, 1], [7, 1, 0.5], [9, 1.5, 0.5], [11, 2, 2], [9, 4, 1], [7, 5, 2]], answer: [[11, 0, 1], [9, 1, 1], [7, 2, 1], [6, 3, 1], [7, 4, 3]] } }),
  z24: theme({ key: 31, mode: 'harmonic', prog: [0, 5, 3, 4], dur: 6.5, pad: { type: 'sawtooth', filt: 480, vol: 0.03 }, extras: ['lowchoir', 'anvil', 'timp', 'drone'], choirVol: 0.024, anvil: [0.5], anvilVol: 0.019, timp: [0, 0.25, 0.5], timpVol: 0.1, droneVol: 0.045,
    lead: { voice: 'horn', vol: 0.034, tune: [[7, 0, 2], [9, 2, 2], [11, 4, 2], [10, 6, 1.5]], answer: [[14, 0, 2], [13, 2, 1], [11, 3, 1], [9, 4, 1], [7, 5, 2.5]] } }),

  // ---- The Verdant Court: harp, birdsong and a high silver flute ----
  z25: theme({ key: 41, mode: 'lydian', prog: [0, 1, 0, 4], dur: 7, pad: { type: 'sine', filt: 1400, vol: 0.03 }, extras: ['harp', 'birds', 'wind'], windVol: 0.008, harpVol: 0.03,
    lead: { voice: 'flute', vol: 0.04, tune: [[9, 1, 1], [11, 2, 1], [10, 3, 2], [7, 5, 2.5]], answer: [[11, 1, 1], [12, 2, 0.5], [11, 2.5, 0.5], [9, 3, 2], [8, 5, 2.5]] } }),
  z26: theme({ key: 38, mode: 'mixo', prog: [0, 6, 3, 0], dur: 5, pad: { type: 'triangle', filt: 900, vol: 0.024 }, extras: ['harp', 'birds', 'hand'], harpVol: 0.026, hand: [[0, 'd'], [0.375, 't'], [0.5, 'd'], [0.75, 't']], handVol: 0.045,
    lead: { voice: 'horn', vol: 0.03, tune: [[4, 0, 1], [7, 1, 2], [9, 3, 1], [7, 4, 1], [4, 5, 2.5]], answer: [[9, 0, 1], [11, 1, 1.5], [9, 2.5, 0.5], [8, 3, 1], [7, 4, 3]] } }),
  z27: theme({ key: 36, mode: 'dorian', prog: [0, 3, 1, 4], dur: 8, pad: { type: 'sine', filt: 700, vol: 0.036, det: 8 }, extras: ['harp', 'birds', 'drone', 'lowchoir'], harpVol: 0.022, droneVol: 0.025, choirVol: 0.012,
    lead: { voice: 'flute', vol: 0.036, oct: 1, tune: [[7, 1, 3], [9, 4, 1], [8, 5, 2.5]], answer: [[11, 1, 2], [9, 3, 2], [7, 5, 2.5]] } }),
  z28: theme({ key: 40, mode: 'major', prog: [0, 4, 5, 3], dur: 6, pad: { type: 'triangle', filt: 1200, vol: 0.026 }, extras: ['harp', 'choir', 'sparkle', 'timp'], harpVol: 0.028, choirVol: 0.013, timp: [0], timpVol: 0.07,
    lead: { voice: 'flute', vol: 0.044, tune: [[7, 0, 1.5], [9, 1.5, 0.5], [11, 2, 2], [14, 4, 2], [11, 6, 1.5]], answer: [[12, 0, 1], [11, 1, 1], [9, 2, 1], [11, 3, 1], [7, 4, 3.5]] } }),

  // ---- The Iron Empire: snare drums and brass on the march ----
  z29: theme({ key: 36, mode: 'aeolian', prog: [0, 5, 6, 0], dur: 4.5, pad: { type: 'sawtooth', filt: 700, vol: 0.028 }, extras: ['snare', 'timp'], snare: [0.125, 0.25, 0.3125, 0.375, 0.625, 0.75, 0.875], snareVol: 0.032, timp: [0, 0.5], timpVol: 0.11,
    lead: { voice: 'horn', vol: 0.034, tune: [[4, 0, 1], [7, 1, 1], [7, 2, 0.5], [8, 2.5, 0.5], [9, 3, 2], [7, 5, 2.5]], answer: [[9, 0, 1], [11, 1, 2], [9, 3, 1], [8, 4, 1], [7, 5, 2.5]] } }),
  z30: theme({ key: 38, mode: 'dorian', prog: [0, 3, 0, 6], dur: 5, pad: { type: 'square', filt: 560, vol: 0.017 }, extras: ['anvil', 'snare', 'drone'], anvil: [0, 0.25, 0.5, 0.75], anvilVol: 0.012, snare: [0.375, 0.875], snareVol: 0.035, droneVol: 0.035,
    lead: { voice: 'reed', vol: 0.02, tune: [[7, 0, 0.5], [9, 0.5, 0.5], [11, 1, 1], [9, 2, 1], [7, 3, 2]], answer: [[11, 0, 0.5], [12, 0.5, 0.5], [11, 1, 1], [8, 2, 1], [9, 3, 1], [7, 4, 3]] } }),
  z31: theme({ key: 40, mode: 'harmonic', prog: [0, 4, 0, 5], dur: 4, pad: { type: 'sawtooth', filt: 760, vol: 0.026 }, extras: ['snare', 'toms', 'timp'], snare: [0.25, 0.75], snareVol: 0.035, toms: [0, 0.1875, 0.375, 0.5, 0.6875, 0.875], tomVol: 0.075, timp: [0], timpVol: 0.09,
    lead: { voice: 'horn', vol: 0.033, tune: [[7, 0, 1], [11, 1, 1], [10, 2, 1], [9, 3, 1], [7, 4, 3]], answer: [[11, 0, 1], [14, 1, 2], [13, 3, 1], [11, 4, 3]] } }),
  z32: theme({ key: 34, mode: 'aeolian', prog: [0, 5, 2, 4], dur: 5.5, pad: { type: 'sawtooth', filt: 1000, vol: 0.036 }, extras: ['choir', 'snare', 'timp', 'toll'], choirVol: 0.014, snare: [0.25, 0.375, 0.75, 0.875], snareVol: 0.028, timp: [0, 0.5, 0.625], timpVol: 0.1, tollVol: 0.03,
    lead: { voice: 'horn', vol: 0.04, tune: [[7, 0, 2], [11, 2, 1.5], [9, 3.5, 0.5], [11, 4, 1], [12, 5, 2.5]], answer: [[14, 0, 2], [12, 2, 1], [11, 3, 1], [9, 4, 1], [7, 5, 2.5]] } }),

  // ---- The Dragon Isles: pounding toms, rumbling fire and fierce brass ----
  z33: theme({ key: 38, mode: 'mixo', prog: [0, 6, 0, 3], dur: 4.5, pad: { type: 'triangle', filt: 760, vol: 0.026 }, extras: ['toms', 'arp', 'wind'], toms: [0, 0.375, 0.5, 0.75], tomVol: 0.07, arp: { n: 12, vol: 0.026, oct: 12 }, windVol: 0.014,
    lead: { voice: 'reed', vol: 0.022, tune: [[7, 0, 1], [9, 1, 0.5], [11, 1.5, 1.5], [9, 3, 1], [11, 4, 1], [7, 5, 2.5]], answer: [[11, 0, 1], [12, 1, 1], [11, 2, 0.5], [9, 2.5, 0.5], [8, 3, 1], [7, 4, 3]] } }),
  z34: theme({ key: 36, mode: 'arabic', prog: [0, 1, 0, 3], dur: 6, pad: { type: 'sawtooth', filt: 560, vol: 0.026 }, extras: ['lowchoir', 'toll', 'crackle', 'hand'], choirVol: 0.022, tollVol: 0.032, hand: [[0, 'd'], [0.25, 'd'], [0.375, 't'], [0.75, 'd']], handVol: 0.07,
    lead: { voice: 'reed', vol: 0.019, oct: 1, tune: [[7, 1, 2], [8, 3, 1], [9, 4, 2], [8, 6, 1.5]], answer: [[11, 1, 1], [9, 2, 1], [8, 3, 1], [7, 4, 3.5]] } }),
  z35: theme({ key: 40, mode: 'harmonic', prog: [0, 5, 6, 4], dur: 5, pad: { type: 'sawtooth', filt: 900, vol: 0.024 }, extras: ['toms', 'wind', 'sparkle', 'rumble'], toms: [0, 0.25, 0.5, 0.625, 0.75, 0.875], tomVol: 0.06, windVol: 0.025,
    lead: { voice: 'flute', vol: 0.042, tune: [[11, 0, 1], [12, 1, 0.5], [13, 1.5, 0.5], [14, 2, 2], [11, 4, 3.5]], answer: [[14, 0, 1], [13, 1, 1], [11, 2, 1], [10, 3, 1], [11, 4, 3.5]] } }),
  z36: theme({ key: 31, mode: 'phrygian', prog: [0, 1, 5, 1], dur: 5, pad: { type: 'sawtooth', filt: 520, vol: 0.036 }, extras: ['toms', 'timp', 'rumble', 'drone', 'crackle'], toms: [0.125, 0.25, 0.625, 0.75, 0.875], tomVol: 0.065, timp: [0, 0.5], timpVol: 0.11, droneVol: 0.05,
    lead: { voice: 'horn', vol: 0.04, oct: 1, tune: [[7, 0, 2], [8, 2, 2], [11, 4, 1.5], [8, 5.5, 2]], answer: [[14, 0, 2], [12, 2, 1], [11, 3, 1], [8, 4, 1], [7, 5, 2.5]] } }),

  // ---- The Celestial Gate: choirs, harps and great bells ----
  z37: theme({ key: 43, mode: 'major', prog: [0, 3, 5, 4], dur: 7, pad: { type: 'sine', filt: 1600, vol: 0.03 }, extras: ['harp', 'choir'], harpVol: 0.028, choirVol: 0.015, bells: { p: 0.6, vol: 0.022, decay: 2.8 },
    lead: { voice: 'flute', vol: 0.038, tune: [[4, 1, 1.5], [7, 2.5, 1.5], [9, 4, 1], [11, 5, 2.5]], answer: [[11, 1, 1], [12, 2, 1], [11, 3, 1], [9, 4, 1], [7, 5, 2.5]] } }),
  z38: theme({ key: 41, mode: 'lydian', prog: [0, 1, 5, 4], dur: 8, pad: { type: 'sine', filt: 1200, vol: 0.026 }, extras: ['choir', 'organ', 'sparkle'], choirVol: 0.024, organVol: 0.016,
    lead: { voice: 'choir', vol: 0.026, oct: 1, tune: [[7, 0.5, 2.5], [9, 3, 2], [11, 5, 2.5]], answer: [[11, 0.5, 2], [10, 2.5, 1], [9, 3.5, 1.5], [7, 5, 2.5]] } }),
  z39: theme({ key: 38, mode: 'mixo', prog: [0, 6, 3, 4], dur: 4.5, pad: { type: 'sawtooth', filt: 1200, vol: 0.03 }, extras: ['timp', 'snare', 'choir', 'toll'], timp: [0, 0.25, 0.5], timpVol: 0.09, snare: [0.375, 0.625, 0.875], snareVol: 0.026, choirVol: 0.012, tollVol: 0.028,
    lead: { voice: 'horn', vol: 0.038, tune: [[7, 0, 1], [11, 1, 1], [14, 2, 2], [13, 4, 1], [11, 5, 2.5]], answer: [[14, 0, 1.5], [12, 1.5, 0.5], [11, 2, 1], [9, 3, 1], [11, 4, 3.5]] } }),
  z40: theme({ key: 36, mode: 'major', prog: [0, 5, 3, 4, 2, 5, 1, 4], dur: 5.5, pad: { type: 'sawtooth', filt: 900, vol: 0.026 }, extras: ['organ', 'choir', 'harp', 'timp', 'toll'], organVol: 0.017, choirVol: 0.02, harpVol: 0.02, timp: [0, 0.5], timpVol: 0.09, tollVol: 0.034,
    lead: { voice: 'horn', vol: 0.04, tune: [[7, 0, 2], [9, 2, 1], [11, 3, 1], [14, 4, 2], [13, 6, 1.5]], answer: [[11, 0, 1], [12, 1, 1], [14, 2, 2], [16, 4, 1], [14, 5, 2.5]] } }),
};
export const REGION_THEME_NAMES = {
  z13: 'Reedwater', z14: 'The Sinking Village', z15: 'Trollmire', z16: 'The Black Ferry', z17: 'Glass Dunes', z18: 'Oasis of Dawn', z19: 'The Buried City', z20: 'Valley of Kings',
  z21: 'Foothill Mines', z22: 'The Great Forge', z23: 'Engine Yards', z24: 'Hall Under Stone', z25: 'Whispering Wood', z26: 'The Hunting Grounds', z27: 'The Elder Grove', z28: 'The Evergreen Throne',
  z29: 'The Border Forts', z30: 'The Foundry City', z31: 'The Iron Road', z32: 'The Imperial Palace', z33: "Smugglers' Cove", z34: 'The Ember Temple', z35: 'The Roost', z36: 'Mount Cinder',
  z37: 'The Shining Stair', z38: 'Hall of Hymns', z39: 'The Armoury of Heaven', z40: 'The Celestial Gate',
};
