import { Battle } from '../js/sim.js';
import { defaultSave } from '../js/save.js';
const save = defaultSave(); save.nodes = { hp_zombie: 6, dmg_zombie: 6, rise_zombie: 5 };
const b = new Battle(save, 1);
let t = 0, lastWave = 0;
while (!b.result && t < 1200) { b.update(0.05); t += 0.05; if (b.wave !== lastWave) { console.log('wave', b.wave, 'at', t.toFixed(0), 'horde', b.alive('player')); lastWave = b.wave; } }
console.log(b.result, t.toFixed(0), 'boss', b.bossSpawned);
