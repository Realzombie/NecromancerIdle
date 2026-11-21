// Headless balance check: node tools/simtest.mjs
// Plays repeated attempts, buying the cheapest affordable upgrade between them.
import { Battle, buyUpgrade } from '../js/sim.js';
import { defaultSave } from '../js/save.js';
import { UPGRADES, upgradeCost } from '../js/data.js';

const save = defaultSave();
for (let attempt = 1; attempt <= 15; attempt++) {
  for (;;) {
    const keys = Object.keys(UPGRADES).sort((a, b) => upgradeCost(a, save.upgrades[a]) - upgradeCost(b, save.upgrades[b]));
    if (!buyUpgrade(save, keys[0])) break;
  }
  const b = new Battle(save, 1);
  let t = 0;
  while (!b.result && t < 900) { b.update(0.05); t += 0.05; }
  console.log(`attempt ${attempt}: ${b.result} wave ${b.wave}/${b.totalWaves} time ${t.toFixed(0)}s payout ${b.payout} bank ${save.souls} upg ${JSON.stringify(save.upgrades)}`);
  if (b.result === 'clear') break;
}
