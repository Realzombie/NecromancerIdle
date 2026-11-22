// How far does a fully upgraded horde get in the Endless Crypt?  node tools/endlesstest.mjs [rebirths]
import { Battle } from '../js/sim.js';
import { defaultSave } from '../js/save.js';
import { PLAYER_UNITS, STATS, DEFENCES, DEFENCE_KEYS, ZONES } from '../js/data.js';

const save = defaultSave();
const frac = Number(process.argv[3]) || 1;     // fraction of the max upgrade levels to give
save.rebirths = Number(process.argv[2]) || 0;
for (const u of PLAYER_UNITS) {
  save.nodes['unit_' + u] = 1;
  for (const s of Object.keys(STATS)) save.nodes[s + '_' + u] = Math.round(STATS[s].max * frac);
}
for (const k of DEFENCE_KEYS) save.nodes['def_' + k] = Math.round(DEFENCES[k].max * frac);
for (let z = 1; z <= 12; z++) save.cleared[z] = true;
save.bestZone = 12;
const sp = (await import('../js/data.js')).SPECIAL_KEYS;
for (const k of sp) save.nodes['sp_' + k] = 1;

for (let i = 0; i < 3; i++) {
  const b = new Battle(save, 13);
  let t = 0;
  while (!b.result && t < 3600) { b.update(0.05); t += 0.05; }
  console.log(`run ${i + 1}: survived ${b.wave - 1} waves in ${(t / 60).toFixed(1)} min, souls ${b.payout}, drops ${b.drops.length}, record ${save.bestEndless}, essence +${b.endless.essence}, champ +${b.endless.champ}`);
}
