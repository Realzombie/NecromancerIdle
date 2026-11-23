// Headless balance check: node tools/simtest.mjs [zonesToPlay]
// A simple player: buys units when it can, then the cheapest stat upgrade, and retries each zone until it clears it.
import { Battle, buyUnit, buyStat, buySpecial } from '../js/sim.js';
import { defaultSave } from '../js/save.js';
import { ZONES, UNITS, STATS, SPECIALS, SPECIAL_KEYS, PLAYER_UNITS, owned, level, statCost, playerRating, totalLevels, specialReady, hasSpecial } from '../js/data.js';

const save = defaultSave();
const maxZone = Number(process.argv[2]) || ZONES.filter((z) => !z.endless).length;

function spend() {
  for (const u of PLAYER_UNITS) buyUnit(save, u);
  for (const k of SPECIAL_KEYS) if (specialReady(save, k)) buySpecial(save, k);
  for (;;) {
    let best = null;
    for (const u of PLAYER_UNITS) {
      if (!owned(save, u)) continue;
      for (const s of Object.keys(STATS)) {
        const l = level(save, s, u);
        if (l >= STATS[s].max) continue;
        const c = statCost(s, u, l);
        if (save.souls >= c && (!best || c < best.c)) best = { u, s, c };
      }
    }
    if (!best) return;
    buyStat(save, best.s, best.u);
  }
}

for (const zone of ZONES.slice(0, maxZone)) {
  let attempts = 0, done = false;
  for (; attempts < 40;) {
    spend();
    attempts++;
    const b = new Battle(save, zone.id);
    let t = 0;
    while (!b.result && t < 1200) { b.update(0.05); t += 0.05; }
    if (b.result === 'clear') {
      console.log(`zone ${zone.id} ${zone.name}: cleared on attempt ${attempts} (${t.toFixed(0)}s) rating ${playerRating(save)} (zone ${zone.rating}) levels ${totalLevels(save)} souls ${save.souls} cs ${save.champSouls} gear ${save.gear.length}`);
      done = true;
      break;
    }
    if (attempts % 5 === 0 || attempts === 1) console.log(`  zone ${zone.id} attempt ${attempts}: fail wave ${b.wave}/${b.totalWaves} rating ${playerRating(save)}`);
  }
  if (!done) { console.log(`zone ${zone.id}: not cleared in 40 attempts`); break; }
}

import { gearMods, itemPower } from '../js/gear.js';
console.log('gear mods', JSON.stringify(gearMods(save), (k, v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v)));
console.log(save.gear.filter((g) => Object.values(save.equipped).includes(g.id)).map((g) => `${g.rarity} ${g.slot} z${g.zone} p${itemPower(g)}`).join(' | '));
