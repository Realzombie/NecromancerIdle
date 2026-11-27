// How much is each summon worth for the army space it takes? Half of a 32-space army is the summon, half plain
// zombies, all at the same upgrade levels (abilities included). The score is how strong a wave that army can still
// beat, compared with an army of zombies only (1.00).   node tools/summonbench.mjs [unit ...]
import { Battle } from '../js/sim.js';
import { defaultSave } from '../js/save.js';
import * as D from '../js/data.js';

const SPACE = 32, TESTS = [[7, 4], [10, 3], [18, 4], [23, 6]];      // [zone, wave]: foot soldiers, flyers, healers, a boss
let seed = 1;
const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
Math.random = rng;

function makeSave(type) {
  const s = defaultSave();
  s.nodes = { muster: SPACE - D.TUNING.startArmy };
  for (const u of new Set(['zombie', type])) {
    s.nodes['unit_' + u] = 1;
    s.nodes['hp_' + u] = 10; s.nodes['dmg_' + u] = 10; s.nodes['rise_' + u] = 4;
    for (const k of D.SPECIAL_KEYS) if (D.SPECIALS[k].unit === u) s.nodes['sp_' + k] = 1;
  }
  const n = type === 'zombie' ? 0 : Math.max(1, Math.round(SPACE / 2 / D.ARMY_SLOTS[type]));
  s.army = n ? { [type]: n, zombie: SPACE - n * D.ARMY_SLOTS[type] } : { zombie: SPACE };
  return s;
}
function wins(type, zone, wave, scale, trial) {
  seed = 977 * zone + 31 * wave + trial * 7919 + 1;
  D.CURVE.scale = scale;
  const b = new Battle(makeSave(type), zone, wave, rng);
  while (!b.result && b.time < 330) { b.update(0.1); b.events.length = 0; }
  return b.result === 'clear';
}
// the strongest curve multiplier still beaten in most trials
function limit(type, zone, wave) {
  let lo = Math.log(0.02), hi = Math.log(12);
  for (let i = 0; i < 8; i++) {
    const mid = (lo + hi) / 2;
    let w = 0;
    for (let t = 0; t < 3; t++) if (wins(type, zone, wave, Math.exp(mid), t)) w++;
    if (w >= 2) lo = mid; else hi = mid;
  }
  return Math.exp(lo);
}
const base = TESTS.map(([z, w]) => limit('zombie', z, w));
export function score(type) {
  const r = TESTS.map(([z, w], i) => limit(type, z, w) / base[i]);
  return { mean: Math.exp(r.reduce((a, v) => a + Math.log(v), 0) / r.length), each: r };
}
const only = process.argv.slice(2);
const list = only.length ? only : D.PLAYER_UNITS.filter((u) => u !== 'zombie');
console.log('unit          rebirth  score   (foot, flyers, healers, boss)');
for (const u of list) {
  const s = score(u);
  console.log(u.padEnd(14), String(D.UNIT_REBIRTH[u]).padStart(4), '  ', s.mean.toFixed(2), '  ', s.each.map((v) => v.toFixed(2)).join(' '));
}
