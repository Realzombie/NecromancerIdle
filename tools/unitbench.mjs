// Compares summons by raw numbers and by a head-to-head fight: node tools/unitbench.mjs
import { UNITS, PLAYER_UNITS } from '../js/data.js';
import { Battle } from '../js/sim.js';
import { defaultSave } from '../js/save.js';
console.log('unit            hp   dps   hp*dps  raise  value/s   cost(champ)');
for (const k of PLAYER_UNITS) {
  const u = UNITS[k];
  let dps = u.dmg / u.atk;
  if (u.cleave) dps *= 2.2;
  if (u.aura) dps += u.aura.dps * u.dmg * 2.5;
  if (u.splash) dps *= 1.6;
  if (u.heal) dps += (u.heal.amt / u.heal.every) * 1.2;
  const hp = u.hp * (u.dodge ? 1 / (1 - u.dodge) : 1) / (1 - (u.armor || 0));
  const val = Math.sqrt(hp * dps) / u.raise;
  console.log(k.padEnd(14), String(u.hp).padStart(4), dps.toFixed(1).padStart(6), (hp * dps).toFixed(0).padStart(8), String(u.raise).padStart(6), val.toFixed(2).padStart(8), String(u.unlockCost).padStart(8));
}
// Duel: N of one unit against waves of knights (fixed level, no upgrades), how many survive?
function duel(type, n, enemy, m) {
  const s = defaultSave(); s.nodes['unit_' + type] = 1; s.cleared = {};
  const b = new Battle(s, 5, () => 0.5);
  b.units = []; b.mines = []; b.spawnQueue = []; b.raiseTypes = () => [];
  for (let i = 0; i < n; i++) b.spawn(type, 300 + (i % 4) * 20, 280 + (i % 5) * 18);
  for (let i = 0; i < m; i++) b.spawn(enemy, 700 + (i % 4) * 20, 280 + (i % 5) * 18, true);
  let t = 0; b.pause = 999;
  while (t < 120 && b.alive('enemy') > 0 && b.alive('player') > 0) { b.update(0.05); t += 0.05; }
  return { left: b.alive('player'), foes: b.alive('enemy'), t: t.toFixed(0) };
}
console.log('\nduel: 10 of a unit vs 6 crusaders');
for (const k of PLAYER_UNITS) console.log(k.padEnd(14), JSON.stringify(duel(k, 10, 'crusader', 6)));
