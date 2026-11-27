// A simple player that plays the long game: fights the furthest wave, spends souls, farms when stuck and rebirths when
// it stops getting further. Prints one line per rebirth: how long it took (battle time at 1x) and how far it got.
//   node tools/pacing.mjs [rebirths] [seed]        VERBOSE=1 for every wave
import { Battle, zoneUnlocked, nextWave, buyMuster, buyStat, buyUnit, buySpecial, buyLegion, buyPerk, rebirth, addToArmy } from '../js/sim.js';
import { defaultSave } from '../js/save.js';
import * as D from '../js/data.js';

const RUNS = Number(process.argv[2]) || 8;
let seed = Number(process.argv[3]) || 11;
const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
Math.random = rng;
const save = defaultSave();
if (process.env.SCALE) D.CURVE.scale = Number(process.env.SCALE);
if (process.env.MIGHT) D.TUNING.mightPerRebirth = Number(process.env.MIGHT);
const DT = 0.08;

function buildArmy() {
  const own = D.PLAYER_UNITS.filter((u) => D.owned(save, u));
  const worth = (u) => { const m = D.statMods(save, u); return (D.threat(D.UNITS[u]) * Math.sqrt(m.hp * m.dmg)) / D.ARMY_SLOTS[u]; };
  const front = own.filter((u) => D.UNITS[u].range <= 40).sort((a, b) => worth(b) - worth(a));
  const back = own.filter((u) => D.UNITS[u].range > 40 && !D.UNITS[u].heal).sort((a, b) => worth(b) - worth(a));
  save.army = {};
  const cap = D.armyCap(save);
  const add = (t, share) => { let n = Math.floor((cap * share) / D.ARMY_SLOTS[t]); while (n-- > 0) if (!addToArmy(save, t, 1)) break; };
  if (back.length) { add(back[0], 0.28); if (back[1]) add(back[1], 0.12); }
  if (own.includes('gravepriest') && cap >= 20) add('gravepriest', 0.08);
  if (front[0]) add(front[0], 0.3);
  if (front[1]) add(front[1], 0.15);
  const filler = front[0] || 'zombie';
  while (addToArmy(save, filler, 1)) { /* fill */ }
  while (addToArmy(save, 'zombie', 1)) { /* odd spaces */ }
}

// Spend souls: always the cheapest sensible thing next.
function spend() {
  for (const u of D.PACT_ORDER) if (!D.owned(save, u) && buyUnit(save, u)) { /* unlocked */ }
  for (let guard = 0; guard < 2000; guard++) {
    const opts = [];
    const used = new Set(Object.keys(save.army || {}).concat('zombie'));
    if ((save.nodes.muster || 0) < D.musterCap(save)) opts.push([D.musterCost(save) * 0.7, () => buyMuster(save)]);
    for (const u of D.PLAYER_UNITS) {
      if (!D.owned(save, u)) continue;
      const weight = used.has(u) ? 1 : 3.5;
      for (const k of ['hp', 'dmg', 'rise']) {
        const l = D.level(save, k, u);
        if (l < D.STATS[k].max && (save.rebirths || 0) >= D.statNeeds(k, l)) opts.push([D.statCost(k, u, l, save) * weight * (k === 'rise' ? 2.5 : 1), () => buyStat(save, k, u), D.statCost(k, u, l, save)]);
      }
      if (D.legionReady(save, u) && !D.legionOwned(save, u)) opts.push([D.legionCost(save, u), () => buyLegion(save, u)]);
    }
    for (const k of D.SPECIAL_KEYS) if (!D.hasSpecial(save, k) && D.specialReady(save, k)) opts.push([D.SPECIALS[k].cost * (used.has(D.SPECIALS[k].unit) ? 1 : 3), () => buySpecial(save, k), D.SPECIALS[k].cost]);
    opts.sort((a, b) => a[0] - b[0]);
    const pick = opts.find((o) => (o[2] ?? o[0] / 0.7) <= save.souls);
    if (!pick || !pick[1]()) break;
  }
  buildArmy();
}

function spendEssence() {
  const order = ['might', 'horde', 'souls', 'head', 'thrift', 'conquest', 'quick', 'pact', 'echo', 'ritual', 'restless'];
  for (let guard = 0; guard < 500; guard++) {
    const opts = order.filter((k) => D.perk(save, k) < D.PERKS[k].max && !D.perkLock(save, k) && D.perkCost(k, D.perk(save, k)) <= save.essence)
      .map((k) => [D.perkCost(k, D.perk(save, k)) * ({ might: 0.7, horde: 0.8, souls: 1, conquest: 1.2, restless: 3, ritual: 3, echo: 2.5 }[k] || 1.3), k]);
    opts.sort((a, b) => a[0] - b[0]);
    if (!opts.length || !buyPerk(save, opts[0][1])) break;
  }
}

let total = 0;
for (let run = 0; run < RUNS; run++) {
  let time = 0, fights = 0, stuck = 0, best = '-', power = 0;
  spend();
  const t0 = Date.now();
  while (time < 5 * 3600) {
    const zone = D.ZONES.find((z) => !z.endless && !save.cleared[z.id] && zoneUnlocked(save, z.id));
    if (!zone) break;                                   // nothing more can be reached this run
    const wave = nextWave(save, zone.id);
    const fight = (z, w) => {
      const b = new Battle(save, z, w, rng);
      while (!b.result && b.time < 420) { b.update(DT); b.events.length = 0; }
      if (!b.result) b.finish('fail');
      time += b.time; fights++;
      spend();
      return b;
    };
    const b = fight(zone.id, wave);
    if (b.result === 'clear') {
      stuck = 0; best = zone.id + '-' + wave; power = D.playerRating(save);
      if (process.env.VERBOSE) console.log(`  ${zone.id}-${wave} won ${Math.round(b.time)}s army ${D.armyCap(save)} power ${power} (shown need ${D.waveRating(zone, wave)}) danger ${save.log.at(-1).danger}`);
      continue;
    }
    stuck++;
    if (process.env.FAILS && (save.rebirths || 0) >= Number(process.env.FAILS)) console.log(`  FAIL ${zone.id}-${wave} ${Math.round(b.time)}s wave-time, kills ${b.kills}, enemies left ${b.alive("enemy")}, surge ${b.surge}/${b.surges.length}, queue ${b.spawnQueue.length}, power ${D.playerRating(save)}, army ${JSON.stringify(save.log.at(-1).army)}, danger ${save.log.at(-1).danger}, left: ${b.units.filter((u) => u.team === "enemy").map((u) => u.type + "@" + Math.round(u.x)).slice(0, 6)}`);
    if (stuck >= 6) break;                              // time to rebirth
    // farm the best beaten wave a couple of times before trying again
    const fz = wave > 1 ? zone.id : zone.id - 1, fw = wave > 1 ? wave - 1 : D.BOSS_WAVE;
    if (fz >= 1) for (let i = 0; i < 2 + stuck; i++) fight(fz, fw);
  }
  total += time;
  if (time >= 5 * 3600) { console.log(`run ${run + 1}: stalled at ${best} after ${(time / 3600).toFixed(1)}h`); break; }
  const info = `run ${run + 1} (rebirths ${save.rebirths || 0}): ${(time / 60).toFixed(0)} min, ${fights} fights, reached ${best}, army ${D.armyCap(save)}, power ${power}`;
  if (D.canRebirth(save)) {
    const gain = rebirth(save);
    spendEssence();
    console.log(`${info}, +${gain} essence | total ${(total / 3600).toFixed(1)}h  [${((Date.now() - t0) / 1000).toFixed(0)}s cpu]`);
  } else { console.log(info + ' (cannot rebirth yet)'); }
}
console.log('perks', JSON.stringify(save.perks), 'owned', D.PLAYER_UNITS.filter((u) => D.owned(save, u)).length, 'champ', save.champSouls);
