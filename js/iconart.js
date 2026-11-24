// Icons, the war banner and the jaw traps in the chunky cartoon style (see art.js). Icons are painted on a 12x12 grid
// and drawn at scale 4 in the skill web, upgrade cards and armoury.
import { Pix, mix, BONE, DARK, GLOW } from './art.js';

const mk = (w, h, f) => () => { const p = new Pix(w, h); f(p); return p.finish(); };
const W = '#ffffff';

export const ICON_ART = {
  icon_hp: mk(12, 11, (p) => {                                   // a plump red heart
    p.E(3.5, 3.5, 3.2, 3.2, '#e0405a'); p.E(8.5, 3.5, 3.2, 3.2, '#e0405a'); p.P([[0, 4], [12, 4], [6, 11]], '#e0405a');
    p.px(2, 2, '#ffd0d8', true); p.px(3, 2, '#ffd0d8', true); p.px(2, 3, '#ffd0d8', true);
  }),
  icon_dmg: mk(12, 12, (p) => {                                  // a sword
    p.L(3, 9, 10, 2, '#d8dce8'); p.L(4, 9, 10, 3, '#b8bccc'); p.L(3, 8, 9, 2, '#f4f6ff', true);
    p.P([[10, 0], [12, 0], [12, 2]], '#ffffff', true);
    p.L(1, 7, 5, 11, '#c8a040'); p.L(2, 10, 0, 12, '#6a4a2a'); p.L(1, 11, 1, 11, '#c8a040');
  }),
  icon_raise: mk(12, 12, (p) => {                                // a skeletal hand clawing out of the ground
    p.E(6, 11, 6, 2.2, '#6a4a34'); p.R(0, 10, 12, 2, '#5a3a28');
    p.R(4, 6, 5, 4, BONE); p.R(3, 3, 1, 4, BONE); p.R(5, 1, 1, 6, BONE); p.R(7, 2, 1, 5, BONE); p.R(9, 4, 1, 3, BONE);
    p.px(5, 8, DARK, true); p.px(7, 8, DARK, true);
    for (const [x, y] of [[1, 2], [10, 1], [11, 6], [0, 6], [6, 0]]) p.px(x, y, GLOW, true);
  }),
  icon_shield: mk(12, 13, (p) => {
    p.P([[1, 0], [11, 0], [11, 7], [6, 13], [1, 7]], '#4a70c8'); p.P([[2, 1], [10, 1], [10, 7], [6, 11], [2, 7]], '#6a90e8');
    p.R(5, 2, 2, 8, '#f4f6ff', true); p.R(2, 4, 8, 2, '#f4f6ff', true);
  }),
  icon_poison: mk(12, 12, (p) => {                               // a venom drop
    p.P([[6, 0], [10, 6], [10, 9], [6, 12], [2, 9], [2, 6]], '#5ad04a'); p.E(6, 8, 3.6, 3.6, '#7aff6a');
    p.px(4, 6, '#e8ffd8', true); p.px(5, 5, '#e8ffd8', true); p.px(4, 7, '#e8ffd8', true);
    p.px(10, 2, '#9dff7a', true); p.px(1, 4, '#9dff7a', true); p.px(11, 8, '#9dff7a', true);
  }),
  icon_burst: mk(12, 12, (p) => {                                // a spore burst
    for (const [x, y] of [[6, 0], [6, 11], [0, 6], [11, 6], [1, 1], [10, 1], [1, 10], [10, 10]]) p.L(6, 6, x, y, '#7aff6a', true);
    p.E(6, 6, 3, 3, '#c8ff90'); p.E(6, 6, 1.4, 1.4, '#ffffff', true);
  }),
  icon_fire: mk(12, 13, (p) => {
    p.P([[6, 0], [9, 5], [11, 9], [9, 13], [3, 13], [1, 9], [3, 5], [4, 7], [5, 3]], '#e8401a');
    p.P([[6, 4], [9, 8], [8, 12], [4, 12], [3, 8]], '#ff9a30', true); p.P([[6, 8], [8, 11], [4, 11]], '#ffe070', true);
  }),
  icon_pack: mk(12, 12, (p) => {                                 // a paw print: a big pad and four separate toes
    p.E(6, 8.5, 3.4, 2.8, '#d8c8a0'); for (const [x, y] of [[1, 4.5], [4, 1.8], [8, 1.8], [11, 4.5]]) p.E(x, y, 1.1, 1.5, '#d8c8a0');
    p.px(5, 8, '#f4ecd0', true); p.px(4, 8, '#f4ecd0', true);
  }),
  icon_frost: mk(12, 12, (p) => {                                // a snowflake
    for (const [x, y] of [[6, 0], [6, 11], [0, 6], [11, 6], [1, 1], [10, 1], [1, 10], [10, 10]]) p.L(6, 6, x, y, '#a8d8ff', true);
    p.E(6, 6, 2, 2, '#e8f6ff', true); for (const [x, y] of [[6, 0], [6, 11], [0, 6], [11, 6]]) p.px(x, y, W, true);
    for (const [x, y] of [[4, 2], [8, 2], [4, 9], [8, 9]]) p.px(x, y, '#d8f0ff', true);
  }),
  icon_drain: mk(12, 13, (p) => {                                // a soul wisp being siphoned
    p.P([[6, 0], [10, 6], [9, 10], [6, 12], [3, 10], [2, 6]], '#8ae0ff'); p.P([[6, 3], [8, 7], [7, 10], [5, 10], [4, 7]], '#c8f4ff', true);
    p.px(5, 7, '#0a1020', true); p.px(7, 7, '#0a1020', true); p.R(6, 9, 1, 1, '#0a1020', true);
    p.px(1, 2, '#8ae0ff', true); p.px(11, 3, '#8ae0ff', true);
  }),
  icon_regen: mk(12, 12, (p) => {                                // a green cross that grows
    p.R(4, 0, 4, 12, '#4ac85a'); p.R(0, 4, 12, 4, '#4ac85a'); p.R(5, 1, 2, 10, '#8aff9a', true); p.R(1, 5, 10, 2, '#8aff9a', true);
    p.px(10, 1, '#c8ffd0', true); p.px(11, 2, '#c8ffd0', true); p.px(1, 10, '#c8ffd0', true);
  }),
  icon_charge: mk(12, 12, (p) => {                               // a charging arrow
    p.R(0, 3, 4, 1, '#ffb070', true); p.R(0, 8, 5, 1, '#ffb070', true); p.R(1, 5, 4, 2, '#ffb070', true);
    p.P([[5, 3], [11, 6], [5, 9]], '#ff7a30'); p.R(4, 5, 5, 2, '#ff7a30'); p.px(9, 6, '#ffe0b0', true);
  }),
  icon_blight: mk(12, 11, (p) => {                               // a poison cloud with skulls in it
    p.E(3.5, 6, 3.2, 3, '#5ac85a'); p.E(8.5, 6, 3.2, 3, '#5ac85a'); p.E(6, 4, 3.6, 3.4, '#7aff6a'); p.R(1, 7, 10, 3, '#5ac85a');
    p.R(4, 4, 1, 2, '#1a3a1a', true); p.R(7, 4, 1, 2, '#1a3a1a', true); p.R(5, 7, 2, 1, '#1a3a1a', true);
  }),
  icon_mend: mk(12, 12, (p) => {                                 // a golden healing cross
    p.R(4, 1, 4, 10, '#e8c040'); p.R(1, 4, 10, 4, '#e8c040'); p.R(5, 2, 2, 8, '#fff0a0', true); p.R(2, 5, 8, 2, '#fff0a0', true);
    for (const [x, y] of [[0, 0], [11, 0], [0, 11], [11, 11]]) p.px(x, y, '#fff8d0', true);
  }),
  icon_granite: mk(12, 11, (p) => {                              // a chunk of stone
    p.P([[1, 10], [0, 5], [4, 1], [9, 1], [12, 6], [11, 10]], '#8a8a98'); p.P([[3, 9], [2, 5], [5, 3], [8, 3]], '#a8a8b8', true);
    p.L(7, 3, 6, 7, '#5a5a68', true); p.L(6, 7, 9, 9, '#5a5a68', true);
  }),
  icon_dust: mk(12, 9, (p) => {                                  // a pile of bone dust
    p.P([[0, 9], [3, 5], [6, 2], [9, 5], [12, 9]], '#e8e0c8'); p.P([[3, 9], [6, 5], [9, 9]], '#f6f0dc', true);
    for (const [x, y] of [[1, 3], [10, 2], [6, 0]]) p.px(x, y, W, true);
  }),
  gear_weapon: mk(12, 13, (p) => {                               // the necromancer's staff
    p.R(5, 4, 2, 9, '#7a5a30'); p.R(4, 1, 4, 4, '#4a4a60'); p.E(6, 2.5, 2.2, 2.2, '#8fd16a', true); p.px(5, 1, W, true);
    p.px(3, 3, '#c8c8d8', true); p.px(8, 3, '#c8c8d8', true); p.R(4, 11, 4, 1, '#c8a040', true);
  }),
  gear_armour: mk(12, 12, (p) => {                               // robes
    p.P([[3, 0], [9, 0], [12, 12], [0, 12]], '#7a5ab8'); p.P([[4, 1], [8, 1], [9, 6], [3, 6]], '#a888e8', true);
    p.R(5, 0, 2, 12, '#c8a040', true); p.R(1, 8, 10, 1, '#4a3a78', true);
  }),
  gear_charm: mk(12, 11, (p) => {                                // a spell tome
    p.R(1, 0, 10, 11, '#5a3a7a'); p.R(0, 1, 2, 9, '#3a2a5a'); p.R(8, 0, 1, 11, '#c8a040', true);
    p.E(5.5, 4.5, 2.2, 2.2, '#8fd16a', true); p.px(5, 4, W, true); p.R(3, 8, 5, 1, '#e8e0c8', true);
  }),
  gear_familiar: mk(12, 12, (p) => {                             // a crawling hand
    p.E(6, 8, 3.8, 2.6, '#d8d0b0'); for (const [x, h] of [[2, 4], [4, 6], [6, 6], [8, 5], [10, 3]]) p.R(x, 8 - h, 1, h, '#d8d0b0'); p.R(5, 10, 4, 2, '#a09878');
    for (const x of [2, 4, 6, 8, 10]) p.px(x, 1 + (x === 4 || x === 6 ? -1 : x === 8 ? 0 : 2), '#ffffff', true);
    p.px(5, 8, DARK, true); p.px(7, 8, GLOW, true);
  }),
  // The war banner (a static enemy): a skull-topped pole and a tattered red flag with a skull on it
  banner: mk(16, 27, (p) => {
    p.R(2, 4, 2, 22, '#6a4a2a'); p.E(3, 2, 2.4, 2.2, BONE); p.px(2, 2, DARK, true); p.px(4, 2, DARK, true);
    p.P([[4, 5], [15, 6], [13, 10], [15, 14], [12, 18], [14, 22], [4, 20]], '#c03048'); p.P([[5, 6], [14, 7], [12, 10], [5, 11]], '#e0506a', true);
    p.E(9.5, 11.5, 2.4, 2.2, '#f0e8d0', true); p.px(8, 11, DARK, true); p.px(10, 11, DARK, true); p.R(8, 13, 3, 1, DARK, true);
    p.P([[0, 26], [6, 26], [4, 23], [2, 23]], '#3a2a20'); p.P([[0, 27], [8, 27], [6, 24], [2, 24]], '#4a3a30');
  }),
  trap_idle: mk(14, 8, (p) => { trap(p, false); }),
  trap_armed: mk(14, 8, (p) => { trap(p, true); }),
};

function trap(p, armed) {
  p.E(7, 5, 7, 2.8, '#6a6478'); p.E(7, 5, 5, 1.8, '#2a2236', true);
  for (const x of [1, 3, 5, 7, 9, 11, 13]) { p.px(x, 2, '#e8e4f0', true); p.px(x, 3, '#c8c4d8', true); }
  p.R(5, 4, 4, 2, armed ? '#ff4a3a' : '#7a3a3a', true); if (armed) p.R(6, 4, 2, 1, '#ffb0a0', true);
}

export function iconArtCanvas(name) {
  const f = ICON_ART[name];
  if (!f) return null;
  const p = f();
  const c = p.toCanvas(4);
  c.axPx = c.width / 2;
  return c;
}
