// How much do rebirths speed things up? node tools/rebirthsim.mjs [runs]
import { Battle, buyUnit, buyStat, buySpecial, buyPerk, rebirth } from '../js/sim.js';
import { defaultSave } from '../js/save.js';
import { ZONES, STATS, PLAYER_UNITS, SPECIAL_KEYS, PERK_KEYS, owned, level, statCost, specialReady, perk, perkCost, PERKS, essenceGain } from '../js/data.js';

const save = defaultSave();
const runs = Number(process.argv[2]) || 3;

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
function spendEssence() {
  for (;;) {
    let best = null;
    for (const k of PERK_KEYS) { const l = perk(save, k); if (l >= PERKS[k].max) continue; const c = perkCost(k, l); if (save.essence >= c && (!best || c < best.c)) best = { k, c }; }
    if (!best) return;
    buyPerk(save, best.k);
  }
}

for (let run = 1; run <= runs; run++) {
  let totalAttempts = 0, secs = 0;
  const line = [];
  for (const zone of ZONES) {
    if (save.cleared[zone.id]) { line.push('z' + zone.id + ':skip'); continue; }
    let attempts = 0;
    while (attempts < 60) {
      spend();
      attempts++;
      const b = new Battle(save, zone.id);
      let t = 0;
      while (!b.result && t < 1200) { b.update(0.05); t += 0.05; }
      secs += t;
      if (b.result === 'clear') break;
    }
    totalAttempts += attempts;
    line.push('z' + zone.id + ':' + attempts);
  }
  const gain = essenceGain(save);
  console.log(`run ${run}: attempts ${totalAttempts} (~${Math.round(secs / 60)} min) [${line.join(' ')}] essence gain ${gain} perks ${JSON.stringify(save.perks)}`);
  rebirth(save);
  spendEssence();
}
