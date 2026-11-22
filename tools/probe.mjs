import { PERKS, perkCost } from '../js/data.js';
let tot = 0;
for (const [k, P] of Object.entries(PERKS)) { let c = 0; for (let l = 0; l < P.max; l++) c += perkCost(k, l); tot += c; console.log(k, c); }
console.log('total', tot);
