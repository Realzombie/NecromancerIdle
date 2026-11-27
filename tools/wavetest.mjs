// Checks the rules of the wave game: every zone's waves run without errors, the army and replay rules hold, and
// rebirth resets what it should.   node tools/wavetest.mjs
import { Battle, zoneUnlocked, nextWave, addToArmy, buyMuster, rebirth } from '../js/sim.js';
import { defaultSave } from '../js/save.js';
import * as D from '../js/data.js';

let seed = 7, fails = 0;
const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
Math.random = rng;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL: ' + msg); } };
const run = (b, limit = 400) => { while (!b.result && b.time < limit) { b.update(0.1); b.events.length = 0; } return b; };

// every wave of every zone, with an army that cannot die, so all enemy kinds and bosses take the field
const seen = new Set();
for (const z of D.ZONES) {
  for (const w of z.endless ? [1] : [1, 3, 5, D.BOSS_WAVE]) {
    const s = defaultSave(); s.nodes = { unit_archer: 1 }; s.army = { zombie: 4, archer: 2 };
    const b = new Battle(s, z.id, w, rng);
    for (let i = 0; i < 1600 && !b.result; i++) {
      for (const u of b.units) { if (u.team === 'player') u.hp = u.maxHp; else { seen.add(u.type); if (u.age > 9) u.hp = 0; } }
      b.update(0.1); b.events.length = 0;
    }
    ok(z.endless || b.result === 'clear', `zone ${z.id} wave ${w} did not finish (${b.result}, surge ${b.surge}, enemies ${b.alive('enemy')})`);
  }
}
const missing = D.ENEMY_KEYS.filter((k) => !seen.has(k));
console.log('enemy kinds seen', seen.size, 'never seen:', missing.join(' ') || 'none');

// army rules
const s = defaultSave();
D.tidyArmy(s);
ok(D.armyUsed(s) === D.armyCap(s), 'a new army fills the space');
ok(!addToArmy(s, 'zombie', 1), 'cannot go over army space');
ok(!addToArmy(s, 'drake', 1), 'cannot field a summon you do not own');
s.souls = 1e6;
for (let i = 0; i < 40; i++) buyMuster(s);
ok((s.nodes.muster || 0) === D.musterCap(s), 'army space upgrades stop at the rebirth cap');
s.nodes.legion_zombie = 1; s.army = { zombie: D.armyCap(s) };
const roster = D.armyRoster(s);
ok(roster.legion_zombie === Math.floor(D.armyCap(s) / 10), 'a legion stands in for ten');
const big = new Battle(s, 1, 1, rng);
for (let i = 0; i < 300; i++) big.update(0.1);
ok(big.alive('player') <= Object.values(roster).reduce((a, n) => a + n, 0), 'the necromancer never raises past the army');

// waves unlock one at a time, replays pay half
const t = defaultSave();
ok(nextWave(t, 1) === 1 && zoneUnlocked(t, 1) && !zoneUnlocked(t, 2), 'start');
const first = run(new Battle(t, 1, 1, rng));
ok(first.result === 'clear' && t.progress[1] === 1 && first.firstWin && nextWave(t, 1) === 2, 'first wave win unlocks the second');
const again = run(new Battle(t, 1, 1, rng));
ok(again.replay && !again.firstWin && again.payout < first.payout, `replay pays less (${again.payout} vs ${first.payout})`);

// rebirth locks the waves again and skipped zones hand over their spoils
const r = defaultSave();
r.bestZone = 6; for (let z = 1; z <= 6; z++) { r.cleared[z] = true; r.progress[z] = 6; }
r.perks = { conquest: 3 }; r.army = { zombie: 12 };
const gain = rebirth(r);
ok(gain > 0 && r.rebirths === 1, 'rebirth pays essence');
ok(r.progress[1] === undefined && r.cleared[3] && !r.cleared[4] && r.champSouls === 3 && r.souls > 0, 'rebirth resets waves; skipped zones pay');
ok(D.essenceGain(r) === 0, 'skipped zones pay no essence again');
ok(!zoneUnlocked(r, 5), 'zone 5 waits for a second rebirth');

console.log(fails ? fails + ' failures' : 'all wave checks passed');
process.exit(fails ? 1 : 0);
