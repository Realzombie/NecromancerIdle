// Checks the gear rules: node tools/geartest.mjs
import { defaultSave } from '../js/save.js';
import { rollDrops, rarityCap, equip, salvage, upgradeItem, rerollItem, gearMods, makeItem, addItem, MAX_ITEMS, PITY_AT, RARITIES } from '../js/gear.js';
import { checkAchievements } from '../js/records.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } };
const save = defaultSave();

// Seeded rng so the check is repeatable.
let seed = 7; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// Pity: never more than PITY_AT failed-attempt drops in a row without a Rare.
let sinceRare = 0, worst = 0;
for (let i = 0; i < 400; i++) {
  for (const it of rollDrops(save, rng, 8, { cleared: false, count: 1 })) {
    if (RARITIES.findIndex((r) => r.id === it.rarity) >= 3) sinceRare = 0; else worst = Math.max(worst, ++sinceRare);
  }
}
ok(worst <= PITY_AT, 'pity counter keeps the dry streak at ' + PITY_AT + ' or less (got ' + worst + ')');
// Early zones cannot drop better than their cap.
const early = defaultSave();
let over = 0;
for (let i = 0; i < 300; i++) for (const it of rollDrops(early, rng, 2, { cleared: true, count: 1 })) if (RARITIES.findIndex((r) => r.id === it.rarity) > rarityCap(2)) over++;
ok(over === 0, 'zone 2 only drops Common gear');
ok(save.gear.length <= MAX_ITEMS, 'the bag never exceeds its limit');

// First clear of a boss drops a Rare or better.
const fresh = defaultSave();
const drops = rollDrops(fresh, rng, 6, { cleared: true, first: true });
ok(drops.some((d) => d.rarity === 'rare'), 'first clear of zone 6 drops a Rare');
ok(rollDrops(defaultSave(), rng, 12, { cleared: true, first: true }).some((d) => d.rarity === 'legendary'), 'first clear of zone 12 drops a Legendary');

// Equip, mods, salvage, upgrade.
const s2 = defaultSave();
const w = makeItem(s2, rng, 5, 3, 'weapon'); addItem(s2, w);
ok(gearMods(s2).dmg === 0, 'unequipped gear does nothing');
equip(s2, w.id);
const before = gearMods(s2).dmg;
ok(before > 0, 'equipped weapon adds damage');
ok(salvage(s2, w.id) === 0, 'cannot salvage equipped gear');
s2.dust = 1000;
ok(upgradeItem(s2, w.id) && gearMods(s2).dmg > before, 'upgrade raises the bonus');
ok(rerollItem(s2, w.id, rng), 'reroll works with enough dust');
const extra = makeItem(s2, rng, 1, 0, 'charm'); addItem(s2, extra);
ok(salvage(s2, extra.id) > 0 && s2.dust > 0, 'salvage pays dust');

// Achievements pay once.
const s3 = defaultSave();
s3.stats = { kills: 150 };
const got = checkAchievements(s3);
ok(got.some((a) => a.id === 'dead100') && s3.dust >= 20, 'kills achievements pay dust');
ok(checkAchievements(s3).length === 0, 'achievements only pay once');

console.log(fails ? fails + ' failure(s)' : 'gear rules ok');
process.exit(fails ? 1 : 0);
